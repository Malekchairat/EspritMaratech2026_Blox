import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Send,
  User,
  Sparkles,
  MessageCircle,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AIChatBot() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check speech recognition support
  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) setSpeechSupported(false);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Show greeting when first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      sendToServer("bonjour", true);
    }
  }, [isOpen]);

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

  // TTS: speak a message
  const speak = useCallback(
    (text: string) => {
      if (!ttsEnabled || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langMap[i18n.language] || "fr-FR";
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      // Try to find a matching voice
      const voices = window.speechSynthesis.getVoices();
      const targetLang = langMap[i18n.language] || "fr-FR";
      const match = voices.find((v) => v.lang.startsWith(targetLang.split("-")[0]));
      if (match) utterance.voice = match;

      window.speechSynthesis.speak(utterance);
    },
    [ttsEnabled, i18n.language]
  );

  // Send message to server
  const sendToServer = async (text: string, isGreeting = false) => {
    if (!isGreeting) {
      setMessages((prev) => [...prev, { role: "user", content: text }]);
    }
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          lang: i18n.language,
        }),
      });

      if (!res.ok) throw new Error("Chat API error");

      const data = await res.json();
      const reply = data.reply || t("chatbot.errorGeneric");

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      // Auto-speak the response
      speak(reply);
    } catch {
      const errMsg = t("chatbot.errorNetwork");
      setMessages((prev) => [...prev, { role: "assistant", content: errMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle text submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendToServer(trimmed);
  };

  // Voice input
  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = langMap[i18n.language] || "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let final = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      // Show interim in input field
      setInput(final || interim);

      // If final, send it
      if (final) {
        setIsListening(false);
        const text = final.trim();
        if (text) {
          setInput("");
          sendToServer(text);
        }
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  }, [isListening, i18n.language]);

  // Stop TTS
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Suggested prompts
  const suggestions = [
    t("chatbot.suggestDonate"),
    t("chatbot.suggestCreate"),
    t("chatbot.suggestAccessibility"),
    t("chatbot.suggestCategories"),
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-primary"
              aria-label={t("chatbot.open")}
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-4rem)] flex flex-col rounded-2xl border bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold text-sm">{t("chatbot.title")}</h3>
                  <p className="text-xs opacity-80">{t("chatbot.subtitle")}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => {
                    setTtsEnabled(!ttsEnabled);
                    if (isSpeaking) stopSpeaking();
                  }}
                  aria-label={ttsEnabled ? t("chatbot.muteTTS") : t("chatbot.enableTTS")}
                  title={ttsEnabled ? t("chatbot.muteTTS") : t("chatbot.enableTTS")}
                >
                  {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => {
                    setIsOpen(false);
                    stopSpeaking();
                  }}
                  aria-label={t("chatbot.close")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 overflow-y-auto" ref={scrollRef}>
              <div className="flex flex-col gap-3 p-4">
                {messages.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center gap-4 py-8 text-center text-muted-foreground">
                    <Sparkles className="h-10 w-10 opacity-20" />
                    <p className="text-sm px-4">{t("chatbot.welcomeMessage")}</p>
                    <div className="flex flex-wrap justify-center gap-2 px-2">
                      {suggestions.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => sendToServer(prompt)}
                          className="rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-2 items-start",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      )}
                    >
                      {msg.content}
                    </div>

                    {msg.role === "user" && (
                      <div className="h-7 w-7 shrink-0 rounded-full bg-secondary flex items-center justify-center mt-0.5">
                        <User className="h-3.5 w-3.5 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2 items-start">
                    <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 px-3 py-3 border-t bg-background/80 backdrop-blur-sm"
            >
              {/* Voice Input */}
              {speechSupported && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9 shrink-0 rounded-full transition-colors",
                    isListening &&
                      "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 animate-pulse"
                  )}
                  onClick={toggleListening}
                  disabled={isLoading}
                  aria-label={isListening ? t("chatbot.stopListening") : t("chatbot.startListening")}
                  title={isListening ? t("chatbot.stopListening") : t("chatbot.startListening")}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isListening
                    ? t("chatbot.listeningPlaceholder")
                    : t("chatbot.inputPlaceholder")
                }
                className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
                disabled={isLoading}
                aria-label={t("chatbot.inputPlaceholder")}
              />

              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full"
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
