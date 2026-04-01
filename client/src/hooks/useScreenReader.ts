import { useCallback, useEffect, useRef, useState } from "react";

interface ScreenReaderState {
  isReading: boolean;
  isPaused: boolean;
  currentIndex: number;
  totalSections: number;
  currentText: string;
}

/**
 * Hook that uses the Web Speech API to read page content aloud.
 * Extracts text from the DOM in a smart order (headings, then body content)
 * and highlights the currently-read element.
 */
export function useScreenReader(enabled: boolean) {
  const [state, setState] = useState<ScreenReaderState>({
    isReading: false,
    isPaused: false,
    currentIndex: 0,
    totalSections: 0,
    currentText: "",
  });

  const sectionsRef = useRef<{ element: Element; text: string }[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentIndexRef = useRef(0);
  const isReadingRef = useRef(false);

  // Collect readable sections from the page in reading order
  const collectSections = useCallback(() => {
    const mainContent =
      document.querySelector("main") ||
      document.querySelector('[role="main"]') ||
      document.getElementById("root");

    if (!mainContent) return [];

    const sections: { element: Element; text: string }[] = [];

    // Priority selectors in reading order
    const selectors = [
      "h1",
      '[role="banner"]',
      "h2",
      "h3",
      "p",
      '[role="article"]',
      "article",
      ".card, [class*='Card']",
      "li",
      "figcaption",
      "blockquote",
      "a[href]",
      "button:not([aria-hidden])",
      "label",
      "td",
      "th",
    ];

    // Walk DOM in document order, collecting text nodes grouped by meaningful blocks
    const walker = document.createTreeWalker(
      mainContent,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode(node) {
          const el = node as Element;
          // Skip hidden, aria-hidden, scripts, styles, SVGs
          if (
            el.getAttribute("aria-hidden") === "true" ||
            el.tagName === "SCRIPT" ||
            el.tagName === "STYLE" ||
            el.tagName === "SVG" ||
            el.tagName === "NOSCRIPT" ||
            el.closest("[aria-hidden='true']") ||
            el.closest(".sr-toolbar") // skip our own toolbar
          ) {
            return NodeFilter.FILTER_REJECT;
          }

          // Accept block-level elements that contain direct text
          const tag = el.tagName;
          const blockTags = [
            "H1", "H2", "H3", "H4", "H5", "H6",
            "P", "LI", "TD", "TH", "FIGCAPTION",
            "BLOCKQUOTE", "LABEL", "ARTICLE", "SECTION",
            "HEADER", "FOOTER", "MAIN", "DIV", "SPAN",
            "A", "BUTTON",
          ];

          if (blockTags.includes(tag)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        },
      }
    );

    const seen = new Set<string>();
    let node = walker.nextNode();

    while (node) {
      const el = node as Element;
      // Get direct text content (not from nested block children)
      const text = getDirectText(el).trim();

      if (text.length > 2 && !seen.has(text)) {
        seen.add(text);
        sections.push({ element: el, text });
      }
      node = walker.nextNode();
    }

    return sections;
  }, []);

  // Get text content directly owned by an element (not deeply nested blocks)
  function getDirectText(el: Element): string {
    let text = "";
    // Check aria-label first
    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel;

    // Get alt text for images
    if (el.tagName === "IMG") {
      return (el as HTMLImageElement).alt || "";
    }

    for (let i = 0; i < el.childNodes.length; i++) {
      const child = el.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent || "";
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const childEl = child as Element;
        const tag = childEl.tagName;
        // Include inline elements' text
        const inlineTags = ["SPAN", "STRONG", "EM", "B", "I", "A", "SMALL", "TIME", "CODE", "MARK", "SUB", "SUP", "BADGE"];
        if (inlineTags.includes(tag) || childEl.classList.contains("badge")) {
          text += " " + (childEl.textContent || "");
        }
      }
    }
    return text;
  }

  // Highlight the currently-read element
  const highlightElement = useCallback((element: Element | null) => {
    // Remove previous highlights
    document.querySelectorAll(".sr-highlight").forEach((el) => {
      el.classList.remove("sr-highlight");
    });
    if (element) {
      element.classList.add("sr-highlight");
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // Speak a single section
  const speakSection = useCallback(
    (index: number) => {
      const sections = sectionsRef.current;
      if (index >= sections.length) {
        // Done reading
        highlightElement(null);
        isReadingRef.current = false;
        setState((prev) => ({
          ...prev,
          isReading: false,
          isPaused: false,
          currentIndex: 0,
          currentText: "",
        }));
        return;
      }

      const section = sections[index];
      currentIndexRef.current = index;

      const utterance = new SpeechSynthesisUtterance(section.text);
      utterance.lang = "fr-FR";
      utterance.rate = 0.9;
      utterance.pitch = 1;

      // Try to find a French voice
      const voices = speechSynthesis.getVoices();
      const frenchVoice = voices.find(
        (v) => v.lang.startsWith("fr") && v.localService
      ) || voices.find((v) => v.lang.startsWith("fr"));
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }

      utterance.onstart = () => {
        highlightElement(section.element);
        setState((prev) => ({
          ...prev,
          isReading: true,
          currentIndex: index,
          currentText: section.text.slice(0, 80) + (section.text.length > 80 ? "..." : ""),
        }));
      };

      utterance.onend = () => {
        if (isReadingRef.current) {
          speakSection(index + 1);
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== "canceled" && isReadingRef.current) {
          // Skip this section and continue
          speakSection(index + 1);
        }
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    },
    [highlightElement]
  );

  // Start reading from the beginning or resume
  const startReading = useCallback(() => {
    if (!("speechSynthesis" in window)) {
      console.warn("Speech synthesis not supported");
      return;
    }

    speechSynthesis.cancel();

    const sections = collectSections();
    if (sections.length === 0) return;

    sectionsRef.current = sections;
    isReadingRef.current = true;

    setState((prev) => ({
      ...prev,
      isReading: true,
      isPaused: false,
      totalSections: sections.length,
    }));

    speakSection(0);
  }, [collectSections, speakSection]);

  // Pause reading
  const pauseReading = useCallback(() => {
    if (speechSynthesis.speaking) {
      speechSynthesis.pause();
      setState((prev) => ({ ...prev, isPaused: true }));
    }
  }, []);

  // Resume reading
  const resumeReading = useCallback(() => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setState((prev) => ({ ...prev, isPaused: false }));
    }
  }, []);

  // Stop reading
  const stopReading = useCallback(() => {
    speechSynthesis.cancel();
    isReadingRef.current = false;
    highlightElement(null);
    setState({
      isReading: false,
      isPaused: false,
      currentIndex: 0,
      totalSections: 0,
      currentText: "",
    });
  }, [highlightElement]);

  // Skip to next section
  const nextSection = useCallback(() => {
    speechSynthesis.cancel();
    const nextIdx = currentIndexRef.current + 1;
    if (nextIdx < sectionsRef.current.length) {
      speakSection(nextIdx);
    }
  }, [speakSection]);

  // Go to previous section
  const prevSection = useCallback(() => {
    speechSynthesis.cancel();
    const prevIdx = Math.max(0, currentIndexRef.current - 1);
    speakSection(prevIdx);
  }, [speakSection]);

  // Cleanup on unmount or when disabled
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      highlightElement(null);
    };
  }, [highlightElement]);

  // Stop reading when mode is disabled
  useEffect(() => {
    if (!enabled) {
      stopReading();
    } else {
      // Auto-start reading when screen reader mode is enabled
      startReading();
    }
  }, [enabled, stopReading, startReading]);

  // Preload voices
  useEffect(() => {
    speechSynthesis.getVoices();
    const handleVoices = () => speechSynthesis.getVoices();
    speechSynthesis.addEventListener("voiceschanged", handleVoices);
    return () => speechSynthesis.removeEventListener("voiceschanged", handleVoices);
  }, []);

  return {
    ...state,
    startReading,
    pauseReading,
    resumeReading,
    stopReading,
    nextSection,
    prevSection,
    supported: "speechSynthesis" in window,
  };
}
