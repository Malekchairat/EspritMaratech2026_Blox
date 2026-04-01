import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  className?: string;
  disabled?: boolean;
}

export function VoiceInputButton({ onResult, className, disabled }: VoiceInputButtonProps) {
  const { t } = useTranslation();
  const { isListening, supported, toggleListening } = useVoiceInput({ onResult });

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 shrink-0 rounded-full transition-colors",
        isListening && "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 animate-pulse",
        !isListening && "text-muted-foreground hover:text-primary hover:bg-primary/10",
        className,
      )}
      onClick={toggleListening}
      disabled={disabled}
      aria-label={isListening ? t("voiceInput.stopDictation") : t("voiceInput.startDictation")}
      title={isListening ? t("voiceInput.stopDictation") : t("voiceInput.startDictation")}
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
