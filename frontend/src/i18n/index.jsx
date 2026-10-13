import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Segmented } from "antd";
import { en } from "./en";
import { vi } from "./vi";
import { setActiveLocale } from "../lib/format";

// Vietnamese is the default. The choice is remembered in this browser.
const dictionaries = { vi, en };
const STORAGE_KEY = "lang";
export const LOCALE_TAGS = { vi: "vi-VN", en: "en-US" };

function readLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "en" || saved === "vi" ? saved : "vi";
  } catch {
    return "vi";
  }
}

const initialLang = readLang();
setActiveLocale(LOCALE_TAGS[initialLang]);

function translate(lang, key, vars) {
  const text = dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? ""));
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  const setLang = useCallback((next) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked. The choice then lasts until the page is reloaded.
    }
    setActiveLocale(LOCALE_TAGS[next]);
    setLangState(next);
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, t: (key, vars) => translate(lang, key, vars) }),
    [lang, setLang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

// Small language switch for the page headers.
export function LanguageSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <Segmented size="small" value={lang} onChange={setLang} options={[{ label: "VI", value: "vi" }, { label: "EN", value: "en" }]} />
  );
}
