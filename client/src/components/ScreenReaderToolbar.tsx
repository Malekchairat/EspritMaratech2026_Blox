import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useScreenReader } from "@/hooks/useScreenReader";
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

/**
 * Floating toolbar that appears when screen reader mode is active.
 * Provides play/pause/stop/skip controls and shows current reading progress.
 */
export function ScreenReaderToolbar() {
  const { t } = useTranslation();
  const { settings, toggleScreenReaderMode } = useAccessibility();
  const {
    isReading,
    isPaused,
    currentIndex,
    totalSections,
    currentText,
    startReading,
    pauseReading,
    resumeReading,
    stopReading,
    nextSection,
    prevSection,
    supported,
  } = useScreenReader(settings.screenReaderMode);

  if (!settings.screenReaderMode) return null;

  if (!supported) {
    return (
      <div
        className="sr-toolbar fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-destructive text-destructive-foreground px-6 py-3 rounded-full shadow-2xl flex items-center gap-3"
        role="alert"
      >
        <VolumeX className="h-5 w-5" />
        <span className="text-sm font-medium">
          {t("screenReader.notSupported")}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive-foreground hover:bg-destructive/80"
          onClick={toggleScreenReaderMode}
          aria-label={t("common.close")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="sr-toolbar fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 max-w-[90vw]"
      role="region"
      aria-label={t("screenReader.controls")}
    >
      {/* Voice indicator */}
      <div className="flex items-center gap-2 mr-2">
        <Volume2 className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className="text-sm font-semibold hidden sm:inline">
          {t("screenReader.voiceReading")}
        </span>
      </div>

      <div className="h-6 w-px bg-primary-foreground/30" aria-hidden="true" />

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          onClick={prevSection}
          disabled={!isReading}
          aria-label={t("screenReader.prevSection")}
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        {/* Play / Pause */}
        {!isReading ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={startReading}
            aria-label={t("screenReader.readPage")}
          >
            <Play className="h-5 w-5" />
          </Button>
        ) : isPaused ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={resumeReading}
            aria-label={t("screenReader.resumeReading")}
          >
            <Play className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={pauseReading}
            aria-label={t("screenReader.pause")}
          >
            <Pause className="h-5 w-5" />
          </Button>
        )}

        {/* Stop */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          onClick={stopReading}
          disabled={!isReading}
          aria-label={t("screenReader.stop")}
        >
          <Square className="h-4 w-4" />
        </Button>

        {/* Next */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          onClick={nextSection}
          disabled={!isReading}
          aria-label={t("screenReader.nextSection")}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress info */}
      {isReading && (
        <>
          <div
            className="h-6 w-px bg-primary-foreground/30"
            aria-hidden="true"
          />
          <div className="flex flex-col min-w-0 max-w-48">
            <span className="text-xs opacity-75">
              {currentIndex + 1} / {totalSections}
            </span>
            <span className="text-xs truncate" title={currentText}>
              {currentText}
            </span>
          </div>
        </>
      )}

      <div className="h-6 w-px bg-primary-foreground/30" aria-hidden="true" />

      {/* Close */}
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
        onClick={() => {
          stopReading();
          toggleScreenReaderMode();
        }}
        aria-label={t("screenReader.disable")}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
