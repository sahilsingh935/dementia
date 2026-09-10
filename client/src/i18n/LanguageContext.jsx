import { createContext, useContext, useEffect, useMemo, useState } from "react";

import translations from "./translations";

const LanguageContext = createContext(null);

export const LANGUAGES = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
  },
  {
    code: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
  },
  {
    code: "brx",
    name: "Bodo",
    nativeName: "बर'",
  },
  {
    code: "mni",
    name: "Manipuri",
    nativeName: "মৈতৈলোন্",
  },
];

const DEFAULT_LANGUAGE = "en";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem("manasLanguage");

    if (saved && translations[saved]) {
      return saved;
    }

    return DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    localStorage.setItem("manasLanguage", language);
  }, [language]);

  const setLanguage = (newLanguage) => {
    if (!translations[newLanguage]) {
      console.warn("Unsupported language:", newLanguage);
      return;
    }

    setLanguageState(newLanguage);
  };

  const t = (key) => {
    const keys = key.split(".");

    let value = translations[language];

    for (const part of keys) {
      value = value?.[part];
    }

    // English fallback
    if (value === undefined) {
      value = translations.en;

      for (const part of keys) {
        value = value?.[part];
      }
    }

    return value ?? key;
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      languages: LANGUAGES,
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
