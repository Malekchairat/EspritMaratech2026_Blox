import { useTranslateContent } from "@/hooks/useTranslateContent";

interface TranslatedTextProps {
  text: string;
  sourceLang?: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

/**
 * Renders text that is auto-translated from the source language
 * to the user's current language. Shows original text immediately,
 * then swaps in the translated version once available.
 *
 * Results are cached in localStorage for instant subsequent loads.
 */
export function TranslatedText({
  text,
  sourceLang = "fr",
  as: Tag,
  className,
}: TranslatedTextProps) {
  const translated = useTranslateContent(text, sourceLang);

  if (Tag) {
    return <Tag className={className}>{translated}</Tag>;
  }

  return <>{translated}</>;
}
