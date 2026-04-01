import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import {
  Accessibility,
  Type,
  Eye,
  Palette,
  Zap,
  Keyboard,
  RotateCcw,
  Check,
  Hand,
  Ear,
} from "lucide-react";
import { useHearingAccessibility } from "@/contexts/HearingAccessibilityContext";
import { useTranslation } from "react-i18next";

export function AccessibilityMenu() {
  const { t } = useTranslation();
  const {
    settings,
    updateFontSize,
    toggleReducedMotion,
    updateColorScheme,
    toggleScreenReaderMode,
    toggleKeyboardNavigation,
    toggleMotorMode,
    resetSettings,
  } = useAccessibility();
  const { settings: hearingSettings, toggleHearingMode } = useHearingAccessibility();

  const fontSizeOptions = [
    { value: "normal" as const, labelKey: "accessibility.fontNormal" },
    { value: "large" as const, labelKey: "accessibility.fontLarge" },
    { value: "xlarge" as const, labelKey: "accessibility.fontXlarge" },
  ];

  const colorSchemeOptions = [
    { value: "default" as const, labelKey: "accessibility.colorDefault" },
    { value: "high-contrast" as const, labelKey: "accessibility.colorHighContrast" },
    { value: "deuteranopia" as const, labelKey: "accessibility.colorDeuteranopia" },
    { value: "protanopia" as const, labelKey: "accessibility.colorProtanopia" },
    { value: "tritanopia" as const, labelKey: "accessibility.colorTritanopia" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("accessibility.menuAriaLabel")}
          className="relative"
        >
          <Accessibility className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Accessibility className="h-4 w-4" />
          {t("accessibility.menuTitle")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Font size */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Type className="h-4 w-4 mr-2" />
            {t("accessibility.fontSize")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {fontSizeOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => updateFontSize(option.value)}
                className="flex items-center justify-between"
              >
                {t(option.labelKey)}
                {settings.fontSize === option.value && (
                  <Check className="h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Color scheme */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="h-4 w-4 mr-2" />
            {t("accessibility.colorScheme")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {colorSchemeOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => updateColorScheme(option.value)}
                className="flex items-center justify-between"
              >
                {t(option.labelKey)}
                {settings.colorScheme === option.value && (
                  <Check className="h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Reduced motion */}
        <DropdownMenuItem
          onClick={toggleReducedMotion}
          className="flex items-center justify-between"
        >
          <span className="flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            {t("accessibility.reducedMotion")}
          </span>
          {settings.reducedMotion && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        {/* Screen reader mode */}
        <DropdownMenuItem
          onClick={toggleScreenReaderMode}
          className="flex items-center justify-between"
        >
          <span className="flex items-center">
            <Eye className="h-4 w-4 mr-2" />
            {t("accessibility.screenReader")}
          </span>
          {settings.screenReaderMode && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        {/* Keyboard navigation */}
        <DropdownMenuItem
          onClick={toggleKeyboardNavigation}
          className="flex items-center justify-between"
        >
          <span className="flex items-center">
            <Keyboard className="h-4 w-4 mr-2" />
            {t("accessibility.keyboardNav")}
          </span>
          {settings.keyboardNavigation && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        {/* Motor / Physical disability mode */}
        <DropdownMenuItem
          onClick={toggleMotorMode}
          className="flex items-center justify-between"
        >
          <span className="flex items-center">
            <Hand className="h-4 w-4 mr-2" />
            {t("accessibility.motorMode")}
          </span>
          {settings.motorMode && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        {/* Hearing accessibility mode */}
        <DropdownMenuItem
          onClick={toggleHearingMode}
          className="flex items-center justify-between"
        >
          <span className="flex items-center">
            <Ear className="h-4 w-4 mr-2" />
            {t("accessibility.hearingMode")}
          </span>
          {hearingSettings.hearingMode && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Reset */}
        <DropdownMenuItem onClick={resetSettings}>
          <RotateCcw className="h-4 w-4 mr-2" />
          {t("accessibility.reset")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
