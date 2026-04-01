import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, X, ImagePlus, Video, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImagePreview {
  file: File;
  preview: string;
}

interface VideoPreview {
  file: File;
  preview: string;
}

interface CreatePostDialogProps {
  trigger?: React.ReactNode;
}

async function uploadImages(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];

  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const res = await fetch("/api/upload/multiple", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "Upload failed");
  }

  const data = await res.json();
  return data.files.map((f: { url: string }) => f.url);
}

async function uploadVideo(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("video", file);

  const res = await fetch("/api/upload/video", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Video upload failed" }));
    throw new Error(err.error || "Video upload failed");
  }

  const data = await res.json();
  return data.url;
}

export function CreatePostDialog({ trigger }: CreatePostDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [type, setType] = useState<"photo" | "event" | "activity">("photo");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [video, setVideo] = useState<VideoPreview | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const createPost = trpc.socialPosts.create.useMutation();

  const resetForm = () => {
    setContent("");
    setType("photo");
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
    if (video) {
      URL.revokeObjectURL(video.preview);
      setVideo(null);
    }
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      toast.error(t("social.maxImages"));
      return;
    }

    const newPreviews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newPreviews]);

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleVideoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error(t("social.maxVideoSize"));
      return;
    }

    if (video) URL.revokeObjectURL(video.preview);
    setVideo({ file, preview: URL.createObjectURL(file) });

    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const removeVideo = () => {
    if (video) {
      URL.revokeObjectURL(video.preview);
      setVideo(null);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error(t("social.contentRequired"));
      return;
    }

    try {
      setUploading(true);

      // Upload images first
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages(images.map((img) => img.file));
      }

      // Upload video
      let videoUrl: string | undefined;
      if (video) {
        videoUrl = await uploadVideo(video.file);
      }

      // Then create the post with the returned URLs (await the mutation)
      await createPost.mutateAsync({
        content: content.trim(),
        type,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        videoUrl,
      });

      toast.success(t("social.postCreated"));
      resetForm();
      setOpen(false);
      utils.socialPosts.feed.invalidate();
      utils.socialPosts.listByAssociation.invalidate();
    } catch (err: any) {
      toast.error(err.message || t("social.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const isSubmitting = uploading || createPost.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("social.createPost")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("social.createPost")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
          <div className="space-y-2">
            <Label>{t("social.postType")}</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photo">{t("social.typePhoto")}</SelectItem>
                <SelectItem value="event">{t("social.typeEvent")}</SelectItem>
                <SelectItem value="activity">{t("social.typeActivity")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("social.content")}</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("social.contentPlaceholder")}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("social.images")}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= 10}
              >
                <ImagePlus className="h-4 w-4 mr-1" />
                {t("social.addImage")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFilesSelected}
              />
            </div>

            {/* Image previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, index) => (
                  <div key={index} className="relative group aspect-square rounded-md overflow-hidden border">
                    <img
                      src={img.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length === 0 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t("social.dropOrClick")}
                </p>
              </div>
            )}
          </div>

          {/* Video upload section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("social.video")}</Label>
              {!video && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Video className="h-4 w-4 mr-1" />
                  {t("social.addVideo")}
                </Button>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,video/ogg"
                className="hidden"
                onChange={handleVideoSelected}
              />
            </div>

            {video ? (
              <div className="relative group rounded-md overflow-hidden border">
                <video
                  src={video.preview}
                  controls
                  className="w-full max-h-64 object-contain bg-black"
                />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="text-xs text-muted-foreground p-2 truncate">{video.file.name}</p>
              </div>
            ) : (
              <div
                onClick={() => videoInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Video className="h-7 w-7 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm text-muted-foreground">
                  {t("social.dropOrClickVideo")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  MP4, WebM, MOV — {t("social.maxVideoLabel")}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); setOpen(false); }} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploading ? t("social.uploading") : t("common.loading")}
              </>
            ) : (
              t("social.publish")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
