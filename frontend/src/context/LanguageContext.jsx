import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { translations, LANGUAGES } from '../i18n/translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('mpt_lang') || 'en'; } catch { return 'en'; }
  });

  useEffect(() => {
    try { localStorage.setItem('mpt_lang', lang); } catch (e) {/* ignore */ }
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key) => {
    const dict = translations[lang] || translations.en;
    return dict[key] || translations.en[key] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
};
