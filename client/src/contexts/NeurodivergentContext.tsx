import React, { createContext, useContext, useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SensoryLevel = "default" | "low" | "minimal";
export type ContentDensity = "comfortable" | "compact" | "spacious";
export type UIComplexity = "full" | "simplified";
export type CalmPalette = "default" | "calm-blue" | "calm-green" | "calm-warm" | "monochrome";
export type PresetProfile = "none" | "calm-focus" | "low-stimulation" | "minimal-sensory";

export interface NeurodivergentSettings {
  /** Overall sensory level — controls animation, shadow, border intensity */
  sensoryLevel: SensoryLevel;
  /** Content density — padding/gap scale */
  contentDensity: ContentDensity;
  /** Show/hide decorative elements (gradients, illustrations, shadows) */
  hideDecorative: boolean;
  /** Calm colour palette override */
  calmPalette: CalmPalette;
  /** Reduce or disable hover/focus animations */
  reducedInteractions: boolean;
  /** Predictable layout — disables auto-reflow and carousels */
  predictableLayout: boolean;
  /** Prominent focus indicator ring for current element */
  focusHighlight: boolean;
  /** Simplify UI — hide non-essential chrome */
  uiComplexity: UIComplexity;
  /** Dyslexia-friendly font (OpenDyslexic) */
  dyslexiaFont: boolean;
  /** Active preset profile (for quick switching) */
  activePreset: PresetProfile;
}

interface NeurodivergentContextType {
  settings: NeurodivergentSettings;
  updateSetting: <K extends keyof NeurodivergentSettings>(key: K, value: NeurodivergentSettings[K]) => void;
  applyPreset: (preset: PresetProfile) => void;
  resetSettings: () => void;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const defaultSettings: NeurodivergentSettings = {
  sensoryLevel: "default",
  contentDensity: "comfortable",
  hideDecorative: false,
  calmPalette: "default",
  reducedInteractions: false,
  predictableLayout: false,
  focusHighlight: false,
  uiComplexity: "full",
  dyslexiaFont: false,
  activePreset: "none",
};

const presets: Record<PresetProfile, Partial<NeurodivergentSettings>> = {
  none: {},
  "calm-focus": {
    sensoryLevel: "low",
    calmPalette: "calm-blue",
    reducedInteractions: true,
    focusHighlight: true,
    hideDecorative: false,
    predictableLayout: true,
    uiComplexity: "full",
  },
  "low-stimulation": {
    sensoryLevel: "low",
    calmPalette: "calm-green",
    reducedInteractions: true,
    hideDecorative: true,
    predictableLayout: true,
    focusHighlight: true,
    uiComplexity: "full",
    contentDensity: "spacious",
  },
  "minimal-sensory": {
    sensoryLevel: "minimal",
    calmPalette: "monochrome",
    reducedInteractions: true,
    hideDecorative: true,
    predictableLayout: true,
    focusHighlight: true,
    uiComplexity: "simplified",
    contentDensity: "spacious",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "neurodivergent-settings";

function loadSettings(): NeurodivergentSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt data */
  }
  return defaultSettings;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const NeurodivergentContext = createContext<NeurodivergentContextType | undefined>(undefined);

export function NeurodivergentProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<NeurodivergentSettings>(loadSettings);

  // Persist on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Apply classes/data-attributes to <html>
  useEffect(() => {
    const root = document.documentElement;

    // Sensory level — only set non-default values
    if (settings.sensoryLevel !== "default") {
      root.setAttribute("data-sensory", settings.sensoryLevel);
    } else {
      root.removeAttribute("data-sensory");
    }

    // Content density — only set non-default values
    if (settings.contentDensity !== "comfortable") {
      root.setAttribute("data-density", settings.contentDensity);
    } else {
      root.removeAttribute("data-density");
    }

    // Calm palette — only set non-default values
    if (settings.calmPalette !== "default") {
      root.setAttribute("data-calm-palette", settings.calmPalette);
    } else {
      root.removeAttribute("data-calm-palette");
    }

    // Boolean toggles — only add class when enabled
    root.classList.toggle("nd-hide-decorative", settings.hideDecorative);
    root.classList.toggle("nd-reduced-interactions", settings.reducedInteractions);
    root.classList.toggle("nd-predictable-layout", settings.predictableLayout);
    root.classList.toggle("nd-focus-highlight", settings.focusHighlight);
    root.classList.toggle("nd-simplified", settings.uiComplexity === "simplified");
    root.classList.toggle("nd-dyslexia-font", settings.dyslexiaFont);
  }, [settings]);

  const updateSetting = <K extends keyof NeurodivergentSettings>(
    key: K,
    value: NeurodivergentSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value, activePreset: "none" as PresetProfile }));
  };

  const applyPreset = (preset: PresetProfile) => {
    if (preset === "none") {
      setSettings({ ...defaultSettings, activePreset: "none" });
    } else {
      setSettings({ ...defaultSettings, ...presets[preset], activePreset: preset });
    }
  };

  const resetSettings = () => setSettings(defaultSettings);

  return (
    <NeurodivergentContext.Provider value={{ settings, updateSetting, applyPreset, resetSettings }}>
      {children}
    </NeurodivergentContext.Provider>
  );
}

export function useNeurodivergent() {
  const ctx = useContext(NeurodivergentContext);
  if (!ctx) throw new Error("useNeurodivergent must be used within NeurodivergentProvider");
  return ctx;
}
