import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, X, HelpCircle } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Floating voice assistant for accessibility.
 * Allows users with hand injuries or other disabilities to
 * navigate the site and perform actions using voice commands.
 *
 * Triple-F shortcut: press the "f" key 3 times quickly (within 800ms)
 * to toggle the voice assistant — designed for blind users.
 */
export function VoiceAssistant() {
  const { t } = useTranslation();
  const {
    isListening,
    transcript,
    feedback,
    supported,
    toggleListening,
    getCommands,
  } = useVoiceAssistant();

  const [showHelp, setShowHelp] = useState(false);
  const { i18n } = useTranslation();

  // ── Triple-F shortcut (accessibility for blind users) ───────
  const fPressTimestamps = useRef<number[]>([]);

  const handleTripleF = useCallback(() => {
    toggleListening();
  }, [toggleListening]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea/contenteditable
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key.toLowerCase() !== "f") {
        // Reset on any other key
        fPressTimestamps.current = [];
        return;
      }

      const now = Date.now();
      fPressTimestamps.current.push(now);

      // Keep only presses within the last 800ms
      fPressTimestamps.current = fPressTimestamps.current.filter(
        (ts) => now - ts < 800
      );

      if (fPressTimestamps.current.length >= 3) {
        fPressTimestamps.current = [];
        e.preventDefault();
        handleTripleF();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleTripleF]);

  if (!supported) return null;

  const lang = i18n.language?.split("-")[0] ?? "fr";

  const commands = getCommands().filter((c) => c.descKey !== "voice.cmdHelp");

  return (
    <>
      {/* Floating mic button */}
      <div className="fixed bottom-6 right-[88px] z-50 flex flex-col items-end gap-3">
        {/* Feedback / transcript bubble */}
        <AnimatePresence>
          {(isListening || feedback || transcript) && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-card border shadow-2xl rounded-2xl p-4 max-w-xs w-72"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    {t("voice.title")}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowHelp(!showHelp)}
                  aria-label={t("voice.helpTitle")}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>

              {/* Listening indicator */}
              {isListening && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse [animation-delay:300ms]" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t("voice.listening")}
                  </span>
                </div>
              )}

              {/* Live transcript */}
              {transcript && (
                <div className="bg-muted rounded-lg p-2 mb-2">
                  <p className="text-sm text-foreground italic">"{transcript}"</p>
                </div>
              )}

              {/* Feedback */}
              {feedback && (
                <div className="text-sm text-foreground whitespace-pre-line">
                  {feedback}
                </div>
              )}

              {/* Initial prompt */}
              {isListening && !transcript && !feedback && (
                <p className="text-xs text-muted-foreground">
                  {t("voice.speakNow")}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help panel */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-card border shadow-2xl rounded-2xl p-4 max-w-xs w-80"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  {t("voice.helpTitle")}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowHelp(false)}
                  aria-label={t("common.close")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {t("voice.helpDesc")}
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {commands.map((cmd) => {
                  const example = (cmd.patterns[lang] || cmd.patterns["fr"] || [])[0];
                  return (
                    <div
                      key={cmd.descKey}
                      className="flex items-start gap-2 text-xs"
                    >
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-mono shrink-0">
                        "{example}"
                      </span>
                      <span className="text-muted-foreground">
                        {t(cmd.descKey)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mic button */}
        <Button
          onClick={toggleListening}
          size="lg"
          className={`rounded-full h-14 w-14 shadow-2xl transition-all ${
            isListening
              ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          }`}
          aria-label={
            isListening ? t("voice.stopListening") : t("voice.startListening")
          }
        >
          {isListening ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
      </div>
    </>
  );
}
