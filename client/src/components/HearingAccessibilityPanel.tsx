import { useHearingAccessibility } from "@/contexts/HearingAccessibilityContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Ear, EarOff, Captions, CaptionsOff, Bell, BellOff,
  Zap, ZapOff, Eye, Type, RotateCcw, Check, X,
  Volume2, VolumeX, Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Hearing Accessibility Panel - a floating panel for deaf/hard-of-hearing users.
 * Provides controls for visual alerts, real-time captions,
 * sound indicators, and sign language icons.
 */
export function HearingAccessibilityPanel() {
  const { t } = useTranslation();
  const {
    settings,
    toggleHearingMode,
    toggleVisualAlerts,
    toggleFlashScreen,
    toggleCaptions,
    updateCaptionFontSize,
    toggleSignLanguageIcons,
    toggleSoundIndicators,
    resetHearingSettings,
    pushNotification,
    isCaptioning,
    startCaptioning,
    stopCaptioning,
  } = useHearingAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  const captionSizeOptions = [
    { value: "normal" as const, label: t("hearing.captionSizeNormal") },
    { value: "large" as const, label: t("hearing.captionSizeLarge") },
    { value: "xlarge" as const, label: t("hearing.captionSizeXLarge") },
  ];

  const testAlert = () => {
    pushNotification(t("hearing.testAlertMessage"), "info");
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t("hearing.panelTitle")}
        className="relative"
      >
        <Ear className="h-5 w-5" />
        {settings.hearingMode && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-background" />
        )}
      </Button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9990] bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel content */}
            <motion.div
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed right-4 top-20 z-[9991] w-80 max-h-[calc(100vh-6rem)] overflow-y-auto"
            >
              <Card className="shadow-2xl border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ear className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{t("hearing.panelTitle")}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-xs">
                    {t("hearing.panelDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Master Toggle */}
                  <button
                    onClick={toggleHearingMode}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      settings.hearingMode
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    {settings.hearingMode ? (
                      <Ear className="h-5 w-5 shrink-0" />
                    ) : (
                      <EarOff className="h-5 w-5 shrink-0" />
                    )}
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold">{t("hearing.hearingMode")}</p>
                      <p className="text-xs opacity-75">{t("hearing.hearingModeDesc")}</p>
                    </div>
                    {settings.hearingMode && <Check className="h-4 w-4 shrink-0" />}
                  </button>

                  {/* Sub-settings (only visible when hearing mode is on) */}
                  <AnimatePresence>
                    {settings.hearingMode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2 overflow-hidden"
                      >
                        {/* Visual Alerts */}
                        <SettingToggle
                          icon={settings.visualAlerts ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                          label={t("hearing.visualAlerts")}
                          description={t("hearing.visualAlertsDesc")}
                          active={settings.visualAlerts}
                          onClick={toggleVisualAlerts}
                        />

                        {/* Flash Screen */}
                        <SettingToggle
                          icon={settings.flashScreen ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
                          label={t("hearing.flashScreen")}
                          description={t("hearing.flashScreenDesc")}
                          active={settings.flashScreen}
                          onClick={toggleFlashScreen}
                        />

                        {/* Sound Indicators */}
                        <SettingToggle
                          icon={settings.soundIndicators ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                          label={t("hearing.soundIndicators")}
                          description={t("hearing.soundIndicatorsDesc")}
                          active={settings.soundIndicators}
                          onClick={toggleSoundIndicators}
                        />

                        {/* Sign Language Icons */}
                        <SettingToggle
                          icon={<Lightbulb className="h-4 w-4" />}
                          label={t("hearing.signLanguageIcons")}
                          description={t("hearing.signLanguageIconsDesc")}
                          active={settings.signLanguageIcons}
                          onClick={toggleSignLanguageIcons}
                        />

                        {/* Divider */}
                        <div className="border-t my-2" />

                        {/* Real-time Captions */}
                        <SettingToggle
                          icon={settings.showCaptions ? <Captions className="h-4 w-4" /> : <CaptionsOff className="h-4 w-4" />}
                          label={t("hearing.captions")}
                          description={t("hearing.captionsDesc")}
                          active={settings.showCaptions}
                          onClick={toggleCaptions}
                        />

                        {/* Caption font size (when captions enabled) */}
                        {settings.showCaptions && (
                          <div className="pl-4 space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                              <Type className="h-3 w-3" />
                              {t("hearing.captionSize")}
                            </p>
                            <div className="flex gap-1.5">
                              {captionSizeOptions.map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() => updateCaptionFontSize(opt.value)}
                                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                    settings.captionFontSize === opt.value
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>

                            {/* Caption toggle control */}
                            <div className="pt-1">
                              {isCaptioning ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="w-full text-xs h-8"
                                  onClick={stopCaptioning}
                                >
                                  <CaptionsOff className="h-3 w-3 mr-1.5" />
                                  {t("hearing.stopCaptions")}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="w-full text-xs h-8"
                                  onClick={startCaptioning}
                                >
                                  <Captions className="h-3 w-3 mr-1.5" />
                                  {t("hearing.startCaptions")}
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Divider */}
                        <div className="border-t my-2" />

                        {/* Test Alert Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs h-8"
                          onClick={testAlert}
                        >
                          <Bell className="h-3 w-3 mr-1.5" />
                          {t("hearing.testAlert")}
                        </Button>

                        {/* Reset */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs h-8 text-muted-foreground"
                          onClick={resetHearingSettings}
                        >
                          <RotateCcw className="h-3 w-3 mr-1.5" />
                          {t("accessibility.reset")}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/** Small toggle row for sub-settings */
function SettingToggle({
  icon,
  label,
  description,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border transition-all text-left ${
        active
          ? "border-primary/40 bg-primary/5"
          : "border-transparent bg-muted/20 hover:bg-muted/40"
      }`}
    >
      <div className={`shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>
      </div>
      {active && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
    </button>
  );
}
