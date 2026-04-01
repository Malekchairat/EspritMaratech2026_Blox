import { useHearingAccessibility, type VisualNotification } from "@/contexts/HearingAccessibilityContext";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info, CheckCircle, AlertTriangle, AlertCircle, Bell, Volume2 } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Visual Alert Overlay for hearing-impaired users.
 * Shows visual notifications (screen flash + text banners)
 * as an alternative to audio alerts and sounds.
 */
export function VisualAlertOverlay() {
  const { t } = useTranslation();
  const { settings, notifications, dismissNotification } = useHearingAccessibility();
  const [flash, setFlash] = useState(false);

  // Flash screen when new notifications arrive
  useEffect(() => {
    if (!settings.hearingMode || !settings.flashScreen) return;
    if (notifications.length === 0) return;

    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 400);
    return () => clearTimeout(timer);
  }, [notifications.length, settings.hearingMode, settings.flashScreen]);

  if (!settings.hearingMode || !settings.visualAlerts) return null;

  const getIcon = (type: VisualNotification["type"]) => {
    switch (type) {
      case "success": return <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />;
      case "error": return <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />;
      default: return <Info className="h-5 w-5 text-blue-500 shrink-0" />;
    }
  };

  const getBorderColor = (type: VisualNotification["type"]) => {
    switch (type) {
      case "success": return "border-l-green-500 bg-green-50 dark:bg-green-950/30";
      case "warning": return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30";
      case "error": return "border-l-red-500 bg-red-50 dark:bg-red-950/30";
      default: return "border-l-blue-500 bg-blue-50 dark:bg-blue-950/30";
    }
  };

  return (
    <>
      {/* Screen flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9999] pointer-events-none bg-yellow-300 dark:bg-yellow-500"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Visual notification banners */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9998] flex flex-col gap-2 w-full max-w-md px-4"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <AnimatePresence mode="popLayout">
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`flex items-center gap-3 p-3 rounded-lg border-l-4 border shadow-lg backdrop-blur-sm ${getBorderColor(notif.type)}`}
            >
              {getIcon(notif.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(notif.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => dismissNotification(notif.id)}
                className="shrink-0 p-1 rounded-full hover:bg-muted/50 transition-colors"
                aria-label={t("hearing.dismissAlert")}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Sound indicator icon (when sounds play in the environment) */}
      {settings.soundIndicators && (
        <div className="fixed bottom-6 left-6 z-[9997]">
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-card border shadow-md text-xs text-muted-foreground">
            <Volume2 className="h-4 w-4" />
            <span>{t("hearing.soundIndicator")}</span>
          </div>
        </div>
      )}
    </>
  );
}
