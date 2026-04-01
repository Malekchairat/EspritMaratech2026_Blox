import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import fr from "./locales/fr.json";
import en from "./locales/en.json";
import ar from "./locales/ar.json";
import es from "./locales/es.json";
import de from "./locales/de.json";
import tr from "./locales/tr.json";
import it from "./locales/it.json";
import pt from "./locales/pt.json";

export const supportedLanguages = [
  { code: "fr", name: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "en", name: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "ar", name: "العربية", flag: "🇹🇳", dir: "rtl" },
  { code: "es", name: "Español", flag: "🇪🇸", dir: "ltr" },
  { code: "de", name: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷", dir: "ltr" },
  { code: "it", name: "Italiano", flag: "🇮🇹", dir: "ltr" },
  { code: "pt", name: "Português", flag: "🇧🇷", dir: "ltr" },
] as const;

function applyLangDir(lng: string) {
  const lang = supportedLanguages.find((l) => l.code === lng);
  document.documentElement.lang = lng;
  document.documentElement.dir = lang?.dir ?? "ltr";
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      ar: { translation: ar },
      es: { translation: es },
      de: { translation: de },
      tr: { translation: tr },
      it: { translation: it },
      pt: { translation: pt },
    },
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false, // React already protects against XSS
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

// Set lang/dir on initial load
applyLangDir(i18n.language);

// Update lang/dir whenever language changes
i18n.on("languageChanged", applyLangDir);

export default i18n;
