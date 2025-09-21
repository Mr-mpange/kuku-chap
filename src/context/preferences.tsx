import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "sw" | "es";
export type Currency = "usd" | "eur" | "kes";

type Prefs = {
  language: Language;
  currency: Currency;
  timezone: string;
  dateFormat: string;
  setLanguage: (l: Language) => void;
  setCurrency: (c: Currency) => void;
  setTimezone: (tz: string) => void;
  setDateFormat: (fmt: string) => void;
  formatCurrency: (amount: number) => string;
};

const PrefsContext = createContext<Prefs | undefined>(undefined);

const currencySymbols: Record<Currency, string> = {
  usd: "$",
  eur: "€",
  kes: "KSh",
};

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [currency, setCurrency] = useState<Currency>("usd");
  const [timezone, setTimezone] = useState<string>("utc");
  const [dateFormat, setDateFormat] = useState<string>("mm-dd-yyyy");

  // Load initial from localStorage (or could be fetched globally if needed)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("preferences");
      if (saved) {
        const obj = JSON.parse(saved);
        if (obj.language) setLanguage(obj.language);
        if (obj.currency) setCurrency(obj.currency);
        if (obj.timezone) setTimezone(obj.timezone);
        if (obj.dateFormat) setDateFormat(obj.dateFormat);
      }
    } catch {}
  }, []);

  const formatCurrency = useMemo(() => {
    return (amount: number) => {
      const symbol = currencySymbols[currency] ?? "";
      if (currency === "kes") return `${symbol} ${amount.toLocaleString()}`;
      return `${symbol}${amount.toFixed(2)}`;
    };
  }, [currency]);

  const value: Prefs = {
    language,
    currency,
    timezone,
    dateFormat,
    setLanguage,
    setCurrency,
    setTimezone,
    setDateFormat,
    formatCurrency,
  };

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
