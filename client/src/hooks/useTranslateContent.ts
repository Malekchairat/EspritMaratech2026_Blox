import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

/**
 * Cache translated strings in localStorage to avoid repeated API calls.
 * Key format: "tr_cache_{sourceLang}_{targetLang}_{hash}"
 */
const CACHE_PREFIX = "tr_cache_";

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // 32-bit int
  }
  return Math.abs(hash).toString(36);
}

function getCached(sourceLang: string, targetLang: string, text: string): string | null {
  try {
    const key = `${CACHE_PREFIX}${sourceLang}_${targetLang}_${hashText(text)}`;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setCache(sourceLang: string, targetLang: string, text: string, translated: string) {
  try {
    const key = `${CACHE_PREFIX}${sourceLang}_${targetLang}_${hashText(text)}`;
    localStorage.setItem(key, translated);
  } catch {
    // Storage full or unavailable, ignore
  }
}

// In-flight request dedup
const pending = new Map<string, Promise<string>>();

async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  if (!text || text.trim().length === 0) return text;
  if (sourceLang === targetLang) return text;

  // Check cache first
  const cached = getCached(sourceLang, targetLang, text);
  if (cached) return cached;

  const dedupKey = `${sourceLang}_${targetLang}_${hashText(text)}`;
  if (pending.has(dedupKey)) {
    return pending.get(dedupKey)!;
  }

  const promise = (async () => {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${sourceLang}|${targetLang}`;
      const res = await fetch(url);
      if (!res.ok) return text;

      const data = await res.json();
      const translated = data?.responseData?.translatedText;

      if (translated && translated !== text && !translated.includes("MYMEMORY WARNING")) {
        setCache(sourceLang, targetLang, text, translated);
        return translated;
      }
      return text;
    } catch {
      return text;
    } finally {
      pending.delete(dedupKey);
    }
  })();

  pending.set(dedupKey, promise);
  return promise;
}

/**
 * Hook to auto-translate dynamic/user-generated text content.
 * Shows original text immediately, then swaps in the translation.
 * Results are cached in localStorage.
 *
 * @param text - The original text (assumed French by default)
 * @param sourceLang - Source language code (default "fr")
 */
export function useTranslateContent(text: string, sourceLang = "fr") {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.split("-")[0] ?? "fr";
  const [translated, setTranslated] = useState(text);
  const lastKey = useRef("");

  useEffect(() => {
    const key = `${currentLang}_${text}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

    if (currentLang === sourceLang) {
      setTranslated(text);
      return;
    }

    // Check cache synchronously for instant display
    const cached = getCached(sourceLang, currentLang, text);
    if (cached) {
      setTranslated(cached);
      return;
    }

    // Show original while loading, then swap
    setTranslated(text);

    let cancelled = false;
    translateText(text, sourceLang, currentLang).then((result) => {
      if (!cancelled) setTranslated(result);
    });

    return () => {
      cancelled = true;
    };
  }, [text, currentLang, sourceLang]);

  return translated;
}

/**
 * Translate an array of strings in batch, returning results in same order.
 */
export function useTranslateContentBatch(texts: string[], sourceLang = "fr") {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.split("-")[0] ?? "fr";
  const [results, setResults] = useState<string[]>(texts);

  useEffect(() => {
    if (currentLang === sourceLang) {
      setResults(texts);
      return;
    }

    setResults(texts);

    let cancelled = false;

    Promise.all(
      texts.map((t) => translateText(t, sourceLang, currentLang))
    ).then((translated) => {
      if (!cancelled) setResults(translated);
    });

    return () => {
      cancelled = true;
    };
  }, [texts.join("||"), currentLang, sourceLang]);

  return results;
}
