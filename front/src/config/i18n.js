import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation resources
import enTranslations from '../locales/en.json';
import frTranslations from '../locales/fr.json';
import arTranslations from '../locales/ar.json';

const resources = {
  en: { translation: enTranslations },
  fr: { translation: frTranslations },
  ar: { translation: arTranslations },
};

// Get saved language from localStorage or default to 'en' (strip region e.g. fr-FR → fr)
const rawSaved =
  typeof window !== 'undefined' ? localStorage.getItem('language') || 'en' : 'en';
const savedLanguage = String(rawSaved).split('-')[0];

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage.split('-')[0],
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr', 'ar'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Listen to language changes and save to localStorage
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    const base = String(lng).split('-')[0];
    localStorage.setItem('language', base);
    document.documentElement.lang = base;
    document.documentElement.dir = base === 'ar' ? 'rtl' : 'ltr';
  }
});

// Set initial lang attribute
if (typeof window !== 'undefined') {
  const base = savedLanguage;
  document.documentElement.lang = base;
  document.documentElement.dir = base === 'ar' ? 'rtl' : 'ltr';
}

export default i18n;

