import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAccessibility } from "@/contexts/AccessibilityContext";

export type VoiceCommand = {
  /** Patterns to match (lowercase). Supports multiple languages. */
  patterns: Record<string, string[]>;
  /** Action to execute */
  action: () => void;
  /** Description key for help display */
  descKey: string;
};

interface UseVoiceAssistantOptions {
  onNavigate?: (path: string) => void;
}

const LANG_MAP: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar-TN",
  es: "es-ES",
  de: "de-DE",
  tr: "tr-TR",
  it: "it-IT",
  pt: "pt-BR",
};

export function useVoiceAssistant(options?: UseVoiceAssistantOptions) {
  const { i18n, t } = useTranslation();
  const [, navigate] = useLocation();
  const { settings, toggleScreenReaderMode } = useAccessibility();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Track triple 'j' key presses for screen reader mode toggle
  const jPressCountRef = useRef(0);
  const jPressTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Use refs for stable access from speech recognition callbacks
  const navigateRef = useRef<(path: string) => void>(navigate);
  navigateRef.current = options?.onNavigate ?? ((p: string) => navigate(p));

  // Check support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
    }
  }, []);

  // Build commands — use navigateRef.current so actions always have the latest navigate
  const getCommands = useCallback((): VoiceCommand[] => {
    return [
      {
        patterns: {
          fr: ["accueil", "aller à l'accueil", "page d'accueil", "retour"],
          en: ["home", "go home", "go to home", "main page", "back"],
          ar: ["الرئيسية", "الصفحة الرئيسية", "رجوع"],
          es: ["inicio", "ir al inicio", "página principal"],
          de: ["startseite", "zur startseite", "hauptseite"],
          tr: ["ana sayfa", "anasayfa", "geri"],
          it: ["home", "pagina principale", "inizio"],
          pt: ["início", "página inicial", "voltar"],
        },
        action: () => navigateRef.current("/"),
        descKey: "voice.cmdHome",
      },
      {
        patterns: {
          fr: ["connexion", "se connecter", "connecter", "login"],
          en: ["login", "sign in", "log in", "connect"],
          ar: ["تسجيل الدخول", "دخول"],
          es: ["iniciar sesión", "conectar", "login"],
          de: ["anmelden", "einloggen", "login"],
          tr: ["giriş yap", "oturum aç"],
          it: ["accedi", "login", "accesso"],
          pt: ["entrar", "login", "acessar"],
        },
        action: () => navigateRef.current("/login"),
        descKey: "voice.cmdLogin",
      },
      {
        patterns: {
          fr: ["inscription", "s'inscrire", "créer un compte", "nouveau compte"],
          en: ["register", "sign up", "create account", "new account"],
          ar: ["تسجيل", "إنشاء حساب", "حساب جديد"],
          es: ["registrarse", "crear cuenta", "nueva cuenta"],
          de: ["registrieren", "konto erstellen", "neues konto"],
          tr: ["kayıt ol", "hesap oluştur", "yeni hesap"],
          it: ["registrati", "crea account", "nuovo account"],
          pt: ["registrar", "criar conta", "nova conta"],
        },
        action: () => navigateRef.current("/register"),
        descKey: "voice.cmdRegister",
      },
      {
        patterns: {
          fr: ["créer un cas", "nouveau cas", "publier un cas", "ajouter un cas"],
          en: ["create case", "new case", "publish case", "add case"],
          ar: ["إنشاء حالة", "حالة جديدة", "إضافة حالة"],
          es: ["crear caso", "nuevo caso", "publicar caso"],
          de: ["fall erstellen", "neuer fall", "fall veröffentlichen"],
          tr: ["vaka oluştur", "yeni vaka", "vaka ekle"],
          it: ["crea caso", "nuovo caso", "pubblica caso"],
          pt: ["criar caso", "novo caso", "publicar caso"],
        },
        action: () => navigateRef.current("/create-case"),
        descKey: "voice.cmdCreateCase",
      },
      {
        patterns: {
          fr: ["tableau de bord", "dashboard", "mon espace", "espace personnel"],
          en: ["dashboard", "my dashboard", "my space", "my area"],
          ar: ["لوحة التحكم", "لوحة القيادة", "مساحتي"],
          es: ["panel", "tablero", "mi espacio", "dashboard"],
          de: ["dashboard", "mein bereich", "übersicht"],
          tr: ["panel", "kontrol paneli", "benim alanım"],
          it: ["dashboard", "pannello", "il mio spazio"],
          pt: ["painel", "dashboard", "meu espaço"],
        },
        action: () => navigateRef.current("/dashboard/donor"),
        descKey: "voice.cmdDashboard",
      },
      {
        patterns: {
          fr: ["administration", "admin", "panneau admin"],
          en: ["admin", "administration", "admin panel"],
          ar: ["إدارة", "لوحة الإدارة"],
          es: ["administración", "admin", "panel admin"],
          de: ["administration", "admin", "verwaltung"],
          tr: ["yönetim", "admin", "yönetim paneli"],
          it: ["amministrazione", "admin", "pannello admin"],
          pt: ["administração", "admin", "painel admin"],
        },
        action: () => navigateRef.current("/dashboard/admin"),
        descKey: "voice.cmdAdmin",
      },
      {
        patterns: {
          fr: ["cas santé", "santé", "cas médicaux", "maladie"],
          en: ["health cases", "health", "medical cases", "medical"],
          ar: ["حالات صحية", "صحة", "حالات طبية"],
          es: ["casos de salud", "salud", "casos médicos"],
          de: ["gesundheitsfälle", "gesundheit", "medizinische fälle"],
          tr: ["sağlık vakaları", "sağlık", "tıbbi vakalar"],
          it: ["casi sanitari", "salute", "casi medici"],
          pt: ["casos de saúde", "saúde", "casos médicos"],
        },
        action: () => {
          navigateRef.current("/");
        },
        descKey: "voice.cmdHealthCases",
      },
      {
        patterns: {
          fr: ["agrandir le texte", "texte plus grand", "police plus grande", "grande police"],
          en: ["bigger text", "larger text", "increase font", "bigger font"],
          ar: ["تكبير الخط", "خط أكبر", "نص أكبر"],
          es: ["texto más grande", "aumentar fuente", "fuente grande"],
          de: ["text vergrößern", "größere schrift", "schrift vergrößern"],
          tr: ["yazıyı büyüt", "büyük yazı", "font büyüt"],
          it: ["testo più grande", "ingrandire testo", "carattere grande"],
          pt: ["texto maior", "aumentar fonte", "fonte grande"],
        },
        action: () => {
          document.documentElement.classList.remove("font-normal", "font-xlarge");
          document.documentElement.classList.add("font-large");
        },
        descKey: "voice.cmdBiggerText",
      },
      {
        patterns: {
          fr: ["découvrir", "explorer", "découverte", "voir les cas"],
          en: ["discover", "explore", "discover cases", "browse cases"],
          ar: ["اكتشف", "استكشف", "اكتشف الحالات"],
          es: ["descubrir", "explorar", "explorar casos"],
          de: ["entdecken", "erkunden", "fälle erkunden"],
          tr: ["keşfet", "keşfetme", "vakaları keşfet"],
          it: ["scopri", "esplora", "esplora casi"],
          pt: ["explorar", "descobrir", "descobrir casos"],
        },
        action: () => navigateRef.current("/discover"),
        descKey: "voice.cmdDiscover",
      },
      {
        patterns: {
          fr: ["profil", "mon profil", "compte", "mon compte"],
          en: ["profile", "my profile", "account", "my account"],
          ar: ["ملف تعريفي", "حسابي", "حسابي الشخصي"],
          es: ["perfil", "mi perfil", "cuenta", "mi cuenta"],
          de: ["profil", "mein profil", "konto", "mein konto"],
          tr: ["profil", "benim profil", "hesap", "hesabım"],
          it: ["profilo", "il mio profilo", "account", "mio account"],
          pt: ["perfil", "meu perfil", "conta", "minha conta"],
        },
        action: () => navigateRef.current("/profile"),
        descKey: "voice.cmdProfile",
      },
      {
        patterns: {
          fr: ["favoris", "cas sauvegardés", "mes favoris", "sauvegardés"],
          en: ["favorites", "saved cases", "my favorites", "bookmarks"],
          ar: ["المفضلات", "الحالات المحفوظة", "حالاتي المفضلة"],
          es: ["favoritos", "casos guardados", "mis favoritos"],
          de: ["favoriten", "gespeicherte fälle", "meine favoriten"],
          tr: ["favoriler", "kaydedilen vakalar", "favorilerim"],
          it: ["preferiti", "casi salvati", "i miei preferiti"],
          pt: ["favoritos", "casos salvos", "meus favoritos"],
        },
        action: () => navigateRef.current("/saved-cases"),
        descKey: "voice.cmdFavorites",
      },
      {
        patterns: {
          fr: ["fil", "flux", "fil d'actualités", "feed"],
          en: ["feed", "social feed", "timeline", "activity feed"],
          ar: ["الخلاصة", "مجرى الأحداث", "الأنشطة"],
          es: ["feed", "muro", "cronología", "flujo"],
          de: ["feed", "newsfeed", "zeitleiste", "aktivitätsfeed"],
          tr: ["feed", "zaman çizelgesi", "aktivite akışı"],
          it: ["feed", "flusso", "timeline", "attività"],
          pt: ["feed", "mural", "timeline", "fluxo"],
        },
        action: () => navigateRef.current("/feed"),
        descKey: "voice.cmdFeed",
      },
      {
        patterns: {
          fr: ["réunions", "réunion", "vidéo conférence", "conférence"],
          en: ["meetings", "meeting", "video call", "video conference"],
          ar: ["الاجتماعات", "اجتماع", "مكالمة فيديو"],
          es: ["reuniones", "reunión", "videollamada", "conferencia"],
          de: ["besprechungen", "besprechung", "videoanruf", "konferenz"],
          tr: ["toplantılar", "toplantı", "video çağrı", "konferans"],
          it: ["riunioni", "riunione", "videochiamata", "conferenza"],
          pt: ["reuniões", "reunião", "videochamada", "conferência"],
        },
        action: () => navigateRef.current("/meetings"),
        descKey: "voice.cmdMeetings",
      },
      {
        patterns: {
          fr: ["réduire le texte", "texte plus petit", "police plus petite", "petite police"],
          en: ["smaller text", "reduce font", "decrease text", "smaller font"],
          ar: ["تصغير الخط", "خط أصغر", "نص أصغر"],
          es: ["texto más pequeño", "reducir fuente", "fuente pequeña"],
          de: ["text verkleinern", "schrift verkleinern", "kleinere schrift"],
          tr: ["yazıyı küçült", "küçük yazı", "font küçült"],
          it: ["testo più piccolo", "riduci testo", "carattere piccolo"],
          pt: ["texto menor", "reduzir fonte", "fonte pequena"],
        },
        action: () => {
          document.documentElement.classList.remove("font-normal", "font-large");
          document.documentElement.classList.add("font-small");
        },
        descKey: "voice.cmdSmallerText",
      },
      {
        patterns: {
          fr: ["mode sombre", "thème sombre", "thème foncé", "noir"],
          en: ["dark mode", "dark theme", "darkness", "enable dark"],
          ar: ["الوضع المظلم", "المظهر الفاتح", "الأسود"],
          es: ["modo oscuro", "tema oscuro", "tema negro"],
          de: ["dunkelmodus", "dunkles design", "nachtmodus"],
          tr: ["koyu mod", "koyu tema", "karanlık"],
          it: ["modalità scura", "tema scuro", "tema nero"],
          pt: ["modo escuro", "tema escuro"],
        },
        action: () => {
          const html = document.documentElement;
          html.classList.remove("light");
          html.classList.add("dark");
        },
        descKey: "voice.cmdDarkMode",
      },
      {
        patterns: {
          fr: ["mode clair", "thème clair", "thème léger", "blanc"],
          en: ["light mode", "light theme", "brightness", "enable light"],
          ar: ["الوضع الفاتح", "المظهر الفاتح", "الأبيض"],
          es: ["modo claro", "tema claro", "tema blanco"],
          de: ["hellmodus", "helles design", "tagmodus"],
          tr: ["açık mod", "açık tema", "beyaz"],
          it: ["modalità chiara", "tema chiaro", "tema bianco"],
          pt: ["modo claro", "tema claro"],
        },
        action: () => {
          const html = document.documentElement;
          html.classList.remove("dark");
          html.classList.add("light");
        },
        descKey: "voice.cmdLightMode",
      },
      {
        patterns: {
          fr: ["assistant vocal", "activiser assistant", "assistant", "voice"],
          en: ["voice assistant", "activate voice", "enable voice", "voice"],
          ar: ["مساعد صوتي", "تفعيل الصوت", "المساعد الصوتي"],
          es: ["asistente de voz", "activar voz", "asistente vocal"],
          de: ["sprachassistent", "sprache aktivieren", "sprachassistent aktivieren"],
          tr: ["sesli asistan", "sesi etkinleştir", "sesli komut"],
          it: ["assistente vocale", "attiva voce", "assistente vocale attivo"],
          pt: ["assistente de voz", "ativar voz", "comando de voz"],
        },
        action: () => {
          // Toggle voice assistant listening
          if (!isListening) {
            // Start listening - will be called from the startListening function context
            const btn = document.querySelector('[aria-label*="voice"], [aria-label*="Voice"], [title*="voice"], [title*="Voice"]') as HTMLButtonElement;
            if (btn) {
              btn.click();
            }
          }
        },
        descKey: "voice.cmdVoiceAssistant",
      },
      {
        patterns: {
          fr: ["aide", "aide vocale", "quelles commandes", "que peux-tu faire"],
          en: ["help", "voice help", "what commands", "what can you do"],
          ar: ["مساعدة", "ماذا يمكنك", "الأوامر"],
          es: ["ayuda", "comandos de voz", "qué puedes hacer"],
          de: ["hilfe", "sprachhilfe", "was kannst du"],
          tr: ["yardım", "sesli yardım", "ne yapabilirsin"],
          it: ["aiuto", "comandi vocali", "cosa puoi fare"],
          pt: ["ajuda", "comandos de voz", "o que pode fazer"],
        },
        action: () => {
          // Feedback is set separately
        },
        descKey: "voice.cmdHelp",
      },
    ];
  }, []);

  const showFeedback = useCallback((msg: string) => {
    setFeedback(msg);
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(""), 5000);
  }, []);

  // Speak feedback via TTS
  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) return;
      const utterance = new SpeechSynthesisUtterance(text);
      const lang = i18n.language?.split("-")[0] ?? "fr";
      utterance.lang = LANG_MAP[lang] || "fr-FR";
      utterance.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [i18n.language]
  );

  // Keep a ref to processTranscript so the recognition callback always uses the latest
  const processTranscriptRef = useRef<(raw: string) => void>(() => {});

  const processTranscript = useCallback(
    (raw: string) => {
      const text = raw.toLowerCase().trim();
      if (!text) return;

      const lang = i18n.language?.split("-")[0] ?? "fr";
      const commands = getCommands();

      // Check for help command first
      const helpCmd = commands.find((c) => c.descKey === "voice.cmdHelp");
      const helpPatterns = helpCmd?.patterns[lang] || helpCmd?.patterns["fr"] || [];
      const isHelp = helpPatterns.some((p) => text.includes(p));

      if (isHelp) {
        const helpLines = commands
          .filter((c) => c.descKey !== "voice.cmdHelp")
          .map((c) => {
            const example = (c.patterns[lang] || c.patterns["fr"] || [])[0];
            return `"${example}" → ${t(c.descKey)}`;
          })
          .join("\n");
        showFeedback(t("voice.helpTitle") + "\n" + helpLines);
        speak(t("voice.helpSpoken"));
        return;
      }

      // Try to match a command
      for (const cmd of commands) {
        const patterns = cmd.patterns[lang] || cmd.patterns["fr"] || [];
        const matched = patterns.some(
          (p) => text.includes(p) || p.includes(text)
        );
        if (matched) {
          cmd.action();
          const fb = t(cmd.descKey);
          showFeedback(`✅ ${fb}`);
          speak(fb);
          return;
        }
      }

      // No command matched
      showFeedback(`❓ ${t("voice.notUnderstood")}: "${raw}"`);
      speak(t("voice.notUnderstood"));
    },
    [i18n.language, getCommands, showFeedback, speak, t]
  );

  // Always keep processTranscriptRef up to date
  processTranscriptRef.current = processTranscript;

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    const recognition = new SpeechRecognition();
    const lang = i18n.language?.split("-")[0] ?? "fr";
    recognition.lang = LANG_MAP[lang] || "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setFeedback("");
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(final || interim);
      if (final) {
        processTranscriptRef.current(final);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error !== "aborted") {
        showFeedback(`⚠️ ${t("voice.error")}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      speak(t("voice.listening"));
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }
  }, [i18n.language, showFeedback, speak, t]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Keyboard shortcut: Triple 'j' press to toggle screen reader mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'j') {
        // Ignore if a text input is focused
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.contentEditable === 'true'
        ) {
          return;
        }

        // Increment press count
        jPressCountRef.current += 1;

        // Clear existing timeout
        if (jPressTimeoutRef.current) {
          clearTimeout(jPressTimeoutRef.current);
        }

        // Reset counter if more than 1 second passes
        jPressTimeoutRef.current = setTimeout(() => {
          jPressCountRef.current = 0;
        }, 1000);

        // On third press, toggle screen reader mode
        if (jPressCountRef.current === 3) {
          jPressCountRef.current = 0;
          if (jPressTimeoutRef.current) {
            clearTimeout(jPressTimeoutRef.current);
          }
          event.preventDefault();
          toggleScreenReaderMode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleScreenReaderMode]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      if (jPressTimeoutRef.current) {
        clearTimeout(jPressTimeoutRef.current);
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    feedback,
    supported,
    toggleListening,
    startListening,
    stopListening,
    getCommands,
  };
}
