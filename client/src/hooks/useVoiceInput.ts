import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface UseVoiceInputOptions {
  onResult?: (text: string) => void;
  lang?: string;
  continuous?: boolean;
}

export function useVoiceInput(options?: UseVoiceInputOptions) {
  const { i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(options?.onResult);

  // Keep callback ref up-to-date
  onResultRef.current = options?.onResult;

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
    }
  }, []);

  const startListening = useCallback(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // Stop any existing recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }

    const recognition = new SR();
    recognitionRef.current = recognition;

    // Map i18n language to BCP-47 speech recognition locale
    const langMap: Record<string, string> = {
      fr: "fr-FR",
      en: "en-US",
      ar: "ar-SA",
      es: "es-ES",
      de: "de-DE",
      tr: "tr-TR",
      it: "it-IT",
      pt: "pt-PT",
    };
    recognition.lang = options?.lang || langMap[i18n.language] || "fr-FR";
    recognition.continuous = options?.continuous ?? false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Use final transcript, or interim if still speaking
      const text = finalTranscript || interimTranscript;
      if (text && onResultRef.current) {
        onResultRef.current(text.trim());
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  }, [i18n.language, options?.lang, options?.continuous]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
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

  return { isListening, supported, startListening, stopListening, toggleListening };
}
