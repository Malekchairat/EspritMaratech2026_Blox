import { useEffect, useCallback } from "react";
import { useLocation } from "wouter";

/**
 * Global keyboard shortcuts for accessibility / quick navigation.
 * Always active — harmless navigation helpers.
 *
 * Shortcuts (Alt+Shift+key to avoid browser conflicts):
 *   Alt+Shift+H  → Home
 *   Alt+Shift+L  → Login
 *   Alt+Shift+D  → Dashboard
 *   Alt+Shift+P  → Profile
 *   Alt+Shift+F  → Feed
 *   Alt+Shift+S  → Saved Cases
 *   Alt+Shift+M  → Skip to main content
 *   Alt+Shift+1  → Focus first interactive element
 */
export function KeyboardShortcuts() {
  const [, navigate] = useLocation();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Require Alt+Shift to avoid conflicts with browser / OS shortcuts
      if (!e.altKey || !e.shiftKey) return;
      // Ignore if user is typing in an input field
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = e.key.toLowerCase();

      const routes: Record<string, string> = {
        h: "/",
        l: "/login",
        d: "/dashboard/donor",
        p: "/profile",
        f: "/feed",
        s: "/saved-cases",
      };

      if (routes[key]) {
        e.preventDefault();
        navigate(routes[key]);
        return;
      }

      // Alt+Shift+M → Skip to main content
      if (key === "m") {
        e.preventDefault();
        const main = document.querySelector("main") || document.getElementById("main-content") || document.getElementById("case-content");
        if (main) {
          const firstFocusable = main.querySelector<HTMLElement>(
            'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            main.setAttribute("tabindex", "-1");
            main.focus();
          }
        }
        return;
      }

      // Alt+Shift+1 → Focus first interactive element on page
      if (key === "1" || key === "!") {
        e.preventDefault();
        const first = document.querySelector<HTMLElement>(
          'main button, main a[href], main input, main select, main textarea, main [tabindex]:not([tabindex="-1"])'
        );
        first?.focus();
        return;
      }
    },
    [navigate]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return null;
}
