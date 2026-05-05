/**
 * Utility for voice assistant: read current selection. Returns true if there was selection.
 */
export function readSelectionAloud() {
  const sel = window.getSelection();
  const text = sel?.toString?.()?.trim() ?? '';
  if (!text) return false;
  if (!window.speechSynthesis) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  u.lang = document.documentElement.lang || 'en-US';
  window.speechSynthesis.speak(u);
  return true;
}

const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

/**
 * Utility for voice assistant: translate current selection to target lang and optionally speak.
 * Returns true if there was selection and translation succeeded.
 */
export async function translateSelectionAloud(targetCode = 'fr') {
  const sel = window.getSelection();
  const text = sel?.toString?.()?.trim() ?? '';
  if (!text) return false;
  const sourceLang = (document.documentElement.lang || 'en').split('-')[0];
  try {
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetCode}`;
    const res = await fetch(url);
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (!translated) return false;
    if (window.speechSynthesis) {
      const TRANSLATION_LANGS = [
        { code: 'en', label: 'English', ttsLang: 'en-US' },
        { code: 'fr', label: 'Français', ttsLang: 'fr-FR' },
        { code: 'ar', label: 'العربية', ttsLang: 'ar-SA' },
      ];
      const ttsLang = TRANSLATION_LANGS.find((l) => l.code === targetCode)?.ttsLang || targetCode;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(translated);
      u.rate = 0.95;
      u.lang = ttsLang;
      window.speechSynthesis.speak(u);
    }
    return true;
  } catch {
    return false;
  }
}
