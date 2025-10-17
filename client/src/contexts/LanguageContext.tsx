import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentLanguage, Language, loadTranslations, setCurrentLanguage, t as translate } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getCurrentLanguage());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load translations for current language
    loadTranslations(language).then(() => {
      setIsLoading(false);
    });
  }, [language]);

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    setLanguageState(lang);
    setIsLoading(true);
  };

  const t = (key: string) => translate(key, language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

