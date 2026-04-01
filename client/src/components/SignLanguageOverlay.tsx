import { useHearingAccessibility } from "@/contexts/HearingAccessibilityContext";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

/**
 * Sign Language Icons Overlay
 * When enabled, adds visual sign-language indicator icons (🤟) to key
 * interactive elements like buttons, links and media to help deaf/HoH
 * users identify clickable actions and multimedia content.
 *
 * Works by scanning the DOM for interactive elements and overlaying
 * small sign-language badges/icons on them.
 */
export function SignLanguageOverlay() {
  const { settings } = useHearingAccessibility();
  const { t } = useTranslation();
  const [indicators, setIndicators] = useState<
    { id: string; top: number; left: number; label: string; kind: "action" | "media" | "nav" }[]
  >([]);

  const scanDOM = useCallback(() => {
    if (!settings.hearingMode || !settings.signLanguageIcons) {
      setIndicators([]);
      return;
    }

    const found: typeof indicators = [];
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // Find primary action buttons (donate, submit, save, etc.)
    document.querySelectorAll<HTMLElement>(
      'a[href*="/case/"], a[href*="cha9a9a"], button[type="submit"], [data-sign-label]'
    ).forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      // Only visible elements
      if (rect.top < -50 || rect.top > window.innerHeight + 50) return;

      const label =
        el.getAttribute("data-sign-label") ||
        el.getAttribute("aria-label") ||
        el.textContent?.trim().substring(0, 30) ||
        "";

      found.push({
        id: `sign-${i}-${rect.top.toFixed(0)}`,
        top: rect.top + scrollY - 8,
        left: rect.right + scrollX - 8,
        label,
        kind: el.tagName === "A" ? "nav" : "action",
      });
    });

    // Find media elements (video, audio, iframe with video)
    document.querySelectorAll<HTMLElement>("video, audio, iframe[src*='youtube'], iframe[src*='vimeo']").forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (rect.top < -50 || rect.top > window.innerHeight + 50) return;

      found.push({
        id: `sign-media-${i}`,
        top: rect.top + scrollY + 8,
        left: rect.right + scrollX - 32,
        label: t("hearing.mediaContent", "Contenu multimédia"),
        kind: "media",
      });
    });

    setIndicators(found);
  }, [settings.hearingMode, settings.signLanguageIcons, t]);

  useEffect(() => {
    if (!settings.hearingMode || !settings.signLanguageIcons) {
      setIndicators([]);
      return;
    }

    // Initial scan
    scanDOM();

    // Re-scan on scroll and resize
    const handleUpdate = () => requestAnimationFrame(scanDOM);
    window.addEventListener("scroll", handleUpdate, { passive: true });
    window.addEventListener("resize", handleUpdate, { passive: true });

    // Observe DOM changes
    const observer = new MutationObserver(() => {
      requestAnimationFrame(scanDOM);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("scroll", handleUpdate);
      window.removeEventListener("resize", handleUpdate);
      observer.disconnect();
    };
  }, [settings.hearingMode, settings.signLanguageIcons, scanDOM]);

  if (!settings.hearingMode || !settings.signLanguageIcons || indicators.length === 0) {
    return null;
  }

  const kindEmoji = {
    action: "🤟",
    media: "🔇",
    nav: "👆",
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[9994]" aria-hidden="true">
      <AnimatePresence>
        {indicators.map((ind) => (
          <motion.div
            key={ind.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="absolute"
            style={{
              top: ind.top - window.scrollY,
              left: ind.left - window.scrollX,
            }}
            title={ind.label}
          >
            <span
              className={`
                inline-flex items-center justify-center
                w-6 h-6 rounded-full text-xs
                shadow-md border-2 border-white
                ${ind.kind === "media"
                  ? "bg-red-500 text-white"
                  : ind.kind === "nav"
                    ? "bg-blue-500 text-white"
                    : "bg-yellow-400 text-black"
                }
              `}
            >
              {kindEmoji[ind.kind]}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
