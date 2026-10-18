"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type Locale = "en" | "hi";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const STORAGE_KEY = "sadaksetu-language";
const LANGUAGE_CHANGE_EVENT = "sadaksetu-language-change";
const LanguageContext = createContext<LanguageContextValue | null>(null);

function getSavedLocale(): Locale {
  return window.localStorage.getItem(STORAGE_KEY) === "hi" ? "hi" : "en";
}

function getServerLocale(): Locale {
  return "en";
}

function subscribeToLocale(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
  };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeToLocale, getSavedLocale, getServerLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
