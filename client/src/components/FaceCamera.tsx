import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import * as faceapi from "face-api.js";

interface FaceCameraProps {
  open: boolean;
  onClose: () => void;
  onCapture: (descriptor: number[]) => void;
  title?: string;
  description?: string;
}

type CameraState =
  | "loading-models"
  | "requesting-camera"
  | "live"
  | "capturing"
  | "done"
  | "error";

let modelsLoaded = false; // module-level flag — load once for the entire app

export function FaceCamera({
  open,
  onClose,
  onCapture,
  title = "Reconnaissance faciale",
  description = "Placez votre visage au centre de la caméra",
}: FaceCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const [state, setState] = useState<CameraState>("loading-models");
  const [error, setError] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);

  // ── Stop camera helper ──────────────────────────────────────
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, []);

  // ── 1. Load models when dialog opens ────────────────────────
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      if (modelsLoaded) {
        if (!cancelled) setState("requesting-camera");
        return;
      }
      setState("loading-models");
      try {
        const MODEL_URL = "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        modelsLoaded = true;
        if (!cancelled) setState("requesting-camera");
      } catch (err) {
        console.error("[FaceCamera] Model load error:", err);
        if (!cancelled) {
          setError("Impossible de charger les modèles de reconnaissance faciale.");
          setState("error");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [open]);

  // ── 2. Start camera when models ready ───────────────────────
  useEffect(() => {
    if (!open || state !== "requesting-camera") return;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;

        // Wait for the video to actually produce frames
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            video.play().then(resolve).catch(resolve);
          };
        });

        // Extra safety: wait until videoWidth > 0
        await new Promise<void>((resolve) => {
          if (video.videoWidth > 0 && video.videoHeight > 0) { resolve(); return; }
          const check = () => {
            if (video.videoWidth > 0 && video.videoHeight > 0) resolve();
            else requestAnimationFrame(check);
          };
          requestAnimationFrame(check);
        });

        if (!cancelled) setState("live");
      } catch (err) {
        console.error("[FaceCamera] Camera error:", err);
        if (!cancelled) {
          setError("Impossible d'accéder à la caméra. Vérifiez les permissions de votre navigateur.");
          setState("error");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [open, state]);

  // ── 3. Detection overlay loop ───────────────────────────────
  useEffect(() => {
    if (!open || state !== "live") return;

    const video = videoRef.current;
    const canvas = overlayRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const detect = async () => {
      if (!running) return;

      // Make sure video is still producing frames
      if (video.readyState < 2 || video.videoWidth === 0) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      // Sync canvas size to video
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Clear overlay
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        const result = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 }));

        if (!running) return;

        if (result) {
          setFaceDetected(true);
          const { box } = result;

          // Green bounding box
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          // Corner accents
          const c = 16;
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#22c55e";
          // TL
          ctx.beginPath(); ctx.moveTo(box.x, box.y + c); ctx.lineTo(box.x, box.y); ctx.lineTo(box.x + c, box.y); ctx.stroke();
          // TR
          ctx.beginPath(); ctx.moveTo(box.x + box.width - c, box.y); ctx.lineTo(box.x + box.width, box.y); ctx.lineTo(box.x + box.width, box.y + c); ctx.stroke();
          // BL
          ctx.beginPath(); ctx.moveTo(box.x, box.y + box.height - c); ctx.lineTo(box.x, box.y + box.height); ctx.lineTo(box.x + c, box.y + box.height); ctx.stroke();
          // BR
          ctx.beginPath(); ctx.moveTo(box.x + box.width - c, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height - c); ctx.stroke();

          ctx.fillStyle = "#22c55e";
          ctx.font = "bold 14px sans-serif";
          ctx.fillText("✓ Visage détecté", box.x, box.y - 8);
        } else {
          setFaceDetected(false);

          // Guide oval
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          ctx.ellipse(cx, cy, 90, 130, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } catch {
        /* skip frame on error */
      }

      if (running) {
        rafRef.current = requestAnimationFrame(detect);
      }
    };

    rafRef.current = requestAnimationFrame(detect);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [open, state]);

  // ── 4. Cleanup on dialog close ──────────────────────────────
  useEffect(() => {
    if (!open) {
      stopCamera();
      setState("loading-models");
      setFaceDetected(false);
      setError("");
    }
  }, [open, stopCamera]);

  // ── 5. Capture handler ──────────────────────────────────────
  const handleCapture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    setState("capturing");

    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.45 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setState("live");
        setError("Aucun visage détecté. Regardez la caméra et réessayez.");
        setTimeout(() => setError(""), 3000);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      console.log("[FaceCamera] Descriptor captured, length:", descriptor.length);

      setState("done");
      stopCamera();

      setTimeout(() => onCapture(descriptor), 600);
    } catch (err) {
      console.error("[FaceCamera] Capture error:", err);
      setState("live");
      setError("Erreur lors de la capture. Réessayez.");
      setTimeout(() => setError(""), 3000);
    }
  }, [onCapture, stopCamera]);

  // ── Render ──────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="relative bg-black overflow-hidden">
          {/* Live video feed — shown directly */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full aspect-[4/3] object-cover"
            style={{
              display: state === "live" || state === "capturing" ? "block" : "none",
              transform: "scaleX(-1)", // mirror so it feels natural
            }}
          />

          {/* Transparent overlay canvas for detection rectangles */}
          <canvas
            ref={overlayRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              display: state === "live" ? "block" : "none",
              transform: "scaleX(-1)",
            }}
          />

          {/* Loading state */}
          {(state === "loading-models" || state === "requesting-camera") && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {state === "loading-models"
                  ? "Chargement des modèles de reconnaissance..."
                  : "Accès à la caméra..."}
              </p>
            </div>
          )}

          {/* Success state */}
          {state === "done" && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <CheckCircle2 className="h-14 w-14 text-green-500 animate-in zoom-in-50" />
              <p className="text-sm font-medium text-green-600">Visage capturé avec succès !</p>
            </div>
          )}

          {/* Error state */}
          {state === "error" && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Camera className="h-10 w-10 text-destructive" />
              <p className="text-sm text-destructive text-center px-6">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setError(""); setState("requesting-camera"); }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="p-4 flex items-center justify-between">
          {error && state === "live" && (
            <p className="text-xs text-destructive flex-1">{error}</p>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={onClose} disabled={state === "capturing"}>
              Annuler
            </Button>
            {state === "live" && (
              <Button onClick={handleCapture} disabled={!faceDetected} className="min-w-[120px]">
                <Camera className="h-4 w-4 mr-2" />
                {faceDetected ? "Capturer" : "Détection..."}
              </Button>
            )}
            {state === "capturing" && (
              <Button disabled className="min-w-[120px]">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyse...
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
