import { useTranslation } from 'react-i18next';

/**
 * Custom hook for easier translation access in pages
 * Usage: const t = usePageTranslation();
 *        const text = t('student.dashboard')
 */
export const usePageTranslation = () => {
  const { t } = useTranslation();
  return t;
};

/**
 * Helper to translate object properties (for API responses)
 * Usage: translateObject({ name: 'Score', value: 80 }, 'student', t)
 */
export const translateObject = (obj, namespace, t) => {
  if (!obj) return obj;
  const translated = { ...obj };
  
  Object.keys(translated).forEach(key => {
    const transKey = `${namespace}.${translated[key]}`;
    const result = t(transKey, translated[key]);
    if (result !== transKey) {
      translated[key] = result;
    }
  });
  
  return translated;
};

/**
 * Get translation key with fallback to default
 * Usage: safeTranslate('student.overallScore', 'Overall Score', t)
 */
export const safeTranslate = (key, fallback, t) => {
  const result = t(key, fallback);
  return result === key ? fallback : result;
};
