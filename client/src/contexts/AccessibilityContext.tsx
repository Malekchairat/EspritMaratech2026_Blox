import React, { createContext, useContext, useEffect, useState } from "react";

type FontSize = "normal" | "large" | "xlarge";
type ColorScheme = "default" | "high-contrast" | "deuteranopia" | "protanopia" | "tritanopia";

interface AccessibilitySettings {
  fontSize: FontSize;
  reducedMotion: boolean;
  colorScheme: ColorScheme;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  motorMode: boolean;
  lineHeight: number;
  letterSpacing: number;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateFontSize: (size: FontSize) => void;
  toggleReducedMotion: () => void;
  updateColorScheme: (scheme: ColorScheme) => void;
  toggleScreenReaderMode: () => void;
  toggleKeyboardNavigation: () => void;
  toggleMotorMode: () => void;
  updateLineHeight: (height: number) => void;
  updateLetterSpacing: (spacing: number) => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: "normal",
  reducedMotion: false,
  colorScheme: "default",
  screenReaderMode: false,
  keyboardNavigation: true,
  motorMode: false,
  lineHeight: 1.6,
  letterSpacing: 0,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const stored = localStorage.getItem("accessibility-settings");
    return stored ? JSON.parse(stored) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("accessibility-settings", JSON.stringify(settings));
    
    // Apply font size
    const root = document.documentElement;
    const fontSizeMap = { normal: "16px", large: "18px", xlarge: "20px" };
    root.style.fontSize = fontSizeMap[settings.fontSize];

    // Apply reduced motion
    if (settings.reducedMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

    // Apply color scheme
    root.setAttribute("data-color-scheme", settings.colorScheme);

    // Apply screen reader mode
    if (settings.screenReaderMode) {
      root.classList.add("screen-reader-mode");
    } else {
      root.classList.remove("screen-reader-mode");
    }

    // Apply keyboard navigation
    if (settings.keyboardNavigation) {
      root.classList.add("keyboard-navigation");
    } else {
      root.classList.remove("keyboard-navigation");
    }

    // Apply motor accessibility mode
    if (settings.motorMode) {
      root.classList.add("motor-mode");
    } else {
      root.classList.remove("motor-mode");
    }

    // Apply line height and letter spacing
    root.style.setProperty("--line-height", settings.lineHeight.toString());
    root.style.setProperty("--letter-spacing", `${settings.letterSpacing}px`);
  }, [settings]);

  const updateFontSize = (size: FontSize) => {
    setSettings((prev) => ({ ...prev, fontSize: size }));
  };

  const toggleReducedMotion = () => {
    setSettings((prev) => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };

  const updateColorScheme = (scheme: ColorScheme) => {
    setSettings((prev) => ({ ...prev, colorScheme: scheme }));
  };

  const toggleScreenReaderMode = () => {
    setSettings((prev) => ({ ...prev, screenReaderMode: !prev.screenReaderMode }));
  };

  const toggleKeyboardNavigation = () => {
    setSettings((prev) => ({ ...prev, keyboardNavigation: !prev.keyboardNavigation }));
  };

  const toggleMotorMode = () => {
    setSettings((prev) => ({
      ...prev,
      motorMode: !prev.motorMode,
      // Auto-enable keyboard nav when motor mode is on
      keyboardNavigation: !prev.motorMode ? true : prev.keyboardNavigation,
    }));
  };

  const updateLineHeight = (height: number) => {
    setSettings((prev) => ({ ...prev, lineHeight: height }));
  };

  const updateLetterSpacing = (spacing: number) => {
    setSettings((prev) => ({ ...prev, letterSpacing: spacing }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateFontSize,
        toggleReducedMotion,
        updateColorScheme,
        toggleScreenReaderMode,
        toggleKeyboardNavigation,
        toggleMotorMode,
        updateLineHeight,
        updateLetterSpacing,
        resetSettings,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return context;
}
