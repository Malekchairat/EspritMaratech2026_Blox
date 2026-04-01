import { useHearingAccessibility } from "@/contexts/HearingAccessibilityContext";
import { Button } from "@/components/ui/button";
import { Captions, CaptionsOff, Minimize2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Real-time caption overlay for hearing-impaired users.
 * Uses the Web Speech API (SpeechRecognition) for live speech-to-text.
 * Displays captions at the bottom of the screen like TV subtitles.
 */
export function CaptionOverlay() {
  const { t } = useTranslation();
  const { settings, captions, isCaptioning, startCaptioning, stopCaptioning } = useHearingAccessibility();
  const [minimized, setMinimized] = useState(false);

  if (!settings.hearingMode || !settings.showCaptions) return null;

  const fontSizeClass = {
    normal: "text-base",
    large: "text-lg",
    xlarge: "text-xl",
  }[settings.captionFontSize];

  return (
    <>
      {/* Caption display area */}
      <AnimatePresence>
        {isCaptioning && !minimized && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9996] w-full max-w-2xl px-4"
          >
            <div className="bg-black/85 backdrop-blur-md rounded-xl px-6 py-4 shadow-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Captions className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                    {t("hearing.liveCaptions")}
                  </span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={() => setMinimized(true)}
                    aria-label={t("hearing.minimizeCaptions")}
                  >
                    <Minimize2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={stopCaptioning}
                    aria-label={t("hearing.stopCaptions")}
                  >
                    <CaptionsOff className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div
                className={`text-white leading-relaxed min-h-[2.5rem] max-h-32 overflow-y-auto ${fontSizeClass}`}
                role="log"
                aria-live="polite"
                aria-label={t("hearing.captionContent")}
              >
                {captions || (
                  <span className="text-white/50 italic">{t("hearing.waitingForSpeech")}</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized caption indicator */}
      <AnimatePresence>
        {isCaptioning && minimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-20 right-6 z-[9996]"
          >
            <Button
              onClick={() => setMinimized(false)}
              className="bg-black/85 hover:bg-black/95 text-yellow-400 border border-white/10 rounded-full px-4 py-2 shadow-lg"
              aria-label={t("hearing.expandCaptions")}
            >
              <Captions className="h-4 w-4 mr-2" />
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <Maximize2 className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start captions button (when not captioning yet) */}
      {!isCaptioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9996]"
        >
          <Button
            onClick={startCaptioning}
            className="bg-black/85 hover:bg-black/95 text-white border border-white/10 rounded-full px-5 py-2.5 shadow-lg"
            aria-label={t("hearing.startCaptions")}
          >
            <Captions className="h-4 w-4 mr-2" />
            {t("hearing.startCaptions")}
          </Button>
        </motion.div>
      )}
    </>
  );
}
