import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export interface VisualNotification {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: number;
}

interface HearingAccessibilitySettings {
  hearingMode: boolean;
  visualAlerts: boolean;
  flashScreen: boolean;
  showCaptions: boolean;
  captionFontSize: "normal" | "large" | "xlarge";
  signLanguageIcons: boolean;
  soundIndicators: boolean;
}

interface HearingAccessibilityContextType {
  settings: HearingAccessibilitySettings;
  toggleHearingMode: () => void;
  toggleVisualAlerts: () => void;
  toggleFlashScreen: () => void;
  toggleCaptions: () => void;
  updateCaptionFontSize: (size: "normal" | "large" | "xlarge") => void;
  toggleSignLanguageIcons: () => void;
  toggleSoundIndicators: () => void;
  resetHearingSettings: () => void;
  // Visual notifications queue
  notifications: VisualNotification[];
  pushNotification: (message: string, type?: VisualNotification["type"]) => void;
  dismissNotification: (id: string) => void;
  // Caption state
  captions: string;
  isCaptioning: boolean;
  startCaptioning: () => void;
  stopCaptioning: () => void;
}

const defaultSettings: HearingAccessibilitySettings = {
  hearingMode: false,
  visualAlerts: true,
  flashScreen: true,
  showCaptions: false,
  captionFontSize: "normal",
  signLanguageIcons: false,
  soundIndicators: true,
};

const HearingAccessibilityContext = createContext<HearingAccessibilityContextType | undefined>(undefined);

export function HearingAccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<HearingAccessibilitySettings>(() => {
    const stored = localStorage.getItem("hearing-accessibility-settings");
    return stored ? JSON.parse(stored) : defaultSettings;
  });
  const [notifications, setNotifications] = useState<VisualNotification[]>([]);
  const [captions, setCaptions] = useState("");
  const [isCaptioning, setIsCaptioning] = useState(false);
  const recognitionRef = useRef<any>(null);
  const notifTimerRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Persist settings
  useEffect(() => {
    localStorage.setItem("hearing-accessibility-settings", JSON.stringify(settings));

    const root = document.documentElement;
    if (settings.hearingMode) {
      root.classList.add("hearing-mode");
    } else {
      root.classList.remove("hearing-mode");
    }
    if (settings.soundIndicators) {
      root.classList.add("sound-indicators");
    } else {
      root.classList.remove("sound-indicators");
    }
    if (settings.signLanguageIcons && settings.hearingMode) {
      root.classList.add("sign-language-icons");
    } else {
      root.classList.remove("sign-language-icons");
    }
  }, [settings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      notifTimerRef.current.forEach((timer) => clearTimeout(timer));
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  const toggleHearingMode = () => {
    setSettings((prev) => {
      const newMode = !prev.hearingMode;
      return {
        ...prev,
        hearingMode: newMode,
        visualAlerts: newMode ? true : prev.visualAlerts,
        flashScreen: newMode ? true : prev.flashScreen,
        soundIndicators: newMode ? true : prev.soundIndicators,
      };
    });
  };

  const toggleVisualAlerts = () =>
    setSettings((prev) => ({ ...prev, visualAlerts: !prev.visualAlerts }));

  const toggleFlashScreen = () =>
    setSettings((prev) => ({ ...prev, flashScreen: !prev.flashScreen }));

  const toggleCaptions = () =>
    setSettings((prev) => ({ ...prev, showCaptions: !prev.showCaptions }));

  const updateCaptionFontSize = (size: "normal" | "large" | "xlarge") =>
    setSettings((prev) => ({ ...prev, captionFontSize: size }));

  const toggleSignLanguageIcons = () =>
    setSettings((prev) => ({ ...prev, signLanguageIcons: !prev.signLanguageIcons }));

  const toggleSoundIndicators = () =>
    setSettings((prev) => ({ ...prev, soundIndicators: !prev.soundIndicators }));

  const resetHearingSettings = () => {
    setSettings(defaultSettings);
    stopCaptioning();
    setNotifications([]);
  };

  // Push a visual notification
  const pushNotification = useCallback((message: string, type: VisualNotification["type"] = "info") => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const notif: VisualNotification = { id, message, type, timestamp: Date.now() };
    setNotifications((prev) => [...prev.slice(-9), notif]); // Keep last 10

    // Auto-dismiss after 6s
    const timer = setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      notifTimerRef.current.delete(id);
    }, 6000);
    notifTimerRef.current.set(id, timer);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const timer = notifTimerRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      notifTimerRef.current.delete(id);
    }
  }, []);

  // Real-time captioning via Web Speech API
  const startCaptioning = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      pushNotification("Speech-to-Text non supporté par votre navigateur", "warning");
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = document.documentElement.lang || "fr-FR";
    recognition.maxAlternatives = 1;

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
          // Keep only last ~500 chars for display
          if (finalTranscript.length > 500) {
            finalTranscript = finalTranscript.slice(-400);
          }
        } else {
          interimTranscript += transcript;
        }
      }
      setCaptions(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        pushNotification(`Erreur de reconnaissance vocale: ${event.error}`, "error");
      }
    };

    recognition.onend = () => {
      // Auto-restart if still captioning
      if (isCaptioning) {
        try { recognition.start(); } catch {}
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsCaptioning(true);
      setCaptions("");
    } catch (err) {
      pushNotification("Impossible de démarrer la reconnaissance vocale", "error");
    }
  }, [isCaptioning, pushNotification]);

  const stopCaptioning = useCallback(() => {
    setIsCaptioning(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  return (
    <HearingAccessibilityContext.Provider
      value={{
        settings,
        toggleHearingMode,
        toggleVisualAlerts,
        toggleFlashScreen,
        toggleCaptions,
        updateCaptionFontSize,
        toggleSignLanguageIcons,
        toggleSoundIndicators,
        resetHearingSettings,
        notifications,
        pushNotification,
        dismissNotification,
        captions,
        isCaptioning,
        startCaptioning,
        stopCaptioning,
      }}
    >
      {children}
    </HearingAccessibilityContext.Provider>
  );
}

export function useHearingAccessibility() {
  const context = useContext(HearingAccessibilityContext);
  if (!context) {
    throw new Error("useHearingAccessibility must be used within HearingAccessibilityProvider");
  }
  return context;
}
