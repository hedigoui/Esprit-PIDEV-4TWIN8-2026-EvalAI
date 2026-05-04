import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { translations } from './translations';

const LANG_KEY = 'appLanguage';
const FALLBACK_LANGUAGE = 'en';

const getStoredLanguage = () => {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    return stored === 'fr' ? 'fr' : 'en';
  } catch {
    return 'en';
  }
};

const resolveKey = (table, key) => {
  return key.split('.').reduce((acc, part) => {
    if (acc && Object.prototype.hasOwnProperty.call(acc, part)) return acc[part];
    return undefined;
  }, table);
};

const I18nContext = createContext({
  language: FALLBACK_LANGUAGE,
  setLanguage: () => {},
  t: (key, vars) => {
    const str = String(key || '');
    if (!vars) return str;
    return Object.keys(vars).reduce((out, k) => out.replace(new RegExp(`{{${k}}}`, 'g'), String(vars[k])), str);
  },
});

export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getStoredLanguage);

  const setLanguage = useCallback((next) => {
    const resolved = next === 'fr' ? 'fr' : 'en';
    setLanguageState(resolved);
    try {
      localStorage.setItem(LANG_KEY, resolved);
    } catch {
      // ignore storage errors
    }
  }, []);

  const t = useCallback((key, vars) => {
    const table = translations[language] || translations[FALLBACK_LANGUAGE] || {};
    let str = resolveKey(table, key);
    if (str == null) str = resolveKey(translations[FALLBACK_LANGUAGE] || {}, key);
    if (str == null) str = key;
    if (vars && typeof str === 'string') {
      Object.keys(vars).forEach((k) => {
        str = str.replace(new RegExp(`{{${k}}}`, 'g'), String(vars[k]));
      });
    }
    return str;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
