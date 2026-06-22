import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { translations, LANGUAGES } from '../i18n/translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('mpt_lang') || 'en'; }
    catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn('LanguageContext: cannot read lang:', e?.message || e);
      return 'en';
    }
  });

  useEffect(() => {
    try { localStorage.setItem('mpt_lang', lang); }
    catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn('LanguageContext: cannot persist lang:', e?.message || e);
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key) => {
    const dict = translations[lang] || translations.en;
    return dict[key] || translations.en[key] || key;
  }, [lang]);

  const value = useMemo(
    () => ({ lang, setLang, t, languages: LANGUAGES }),
    [lang, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
};
