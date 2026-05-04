import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, Languages } from 'lucide-react';
import { useAccessibilitySettings } from '../../hooks/useAccessibilitySettings';

const TRANSLATION_LANGS = [
  { code: 'en', label: 'English', ttsLang: 'en-US' },
  { code: 'fr', label: 'Français', ttsLang: 'fr-FR' },
  { code: 'ar', label: 'العربية', ttsLang: 'ar-SA' },
];

const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

/**
 * When user selects text, shows "Read aloud" and "Translate" buttons.
 * Read: speaks the selection (TTS). Translate: translates and can speak the translation.
 * Available on all pages for accessibility.
 */
const ReadSelectionComponent = () => {
  const { t, i18n } = useTranslation();
  const { settings, loaded } = useAccessibilitySettings();
  const [position, setPosition] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [translateOpen, setTranslateOpen] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState(null);
  const [translateError, setTranslateError] = useState('');

  const speak = useCallback((text, lang) => {
    if (!text?.trim() || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.trim());
    u.rate = 0.95;
    u.lang = lang || document.documentElement.lang || 'en-US';
    window.speechSynthesis.speak(u);
  }, []);

  const updateSelection = useCallback(() => {
    // If disabled in settings, do not show selection popup
    if (loaded && !settings.selectionReaderEnabled) {
      setPosition(null);
      return;
    }

    const sel = window.getSelection();
    const text = sel?.toString?.()?.trim() ?? '';
    if (!text) {
      setPosition(null);
      setSelectedText('');
      setTranslated(null);
      setTranslateOpen(false);
      return;
    }
    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 6,
        left: rect.left,
      });
      setSelectedText(text);
      setTranslated(null);
      setTranslateError('');
    } catch {
      setPosition(null);
      setSelectedText('');
    }
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      requestAnimationFrame(updateSelection);
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [updateSelection]);

  const handleRead = () => {
    speak(selectedText);
    window.getSelection()?.removeAllRanges?.();
    setPosition(null);
    setSelectedText('');
    setTranslated(null);
  };

  const sourceLang = (i18n.language || 'en').split('-')[0];
  const targetOptions = TRANSLATION_LANGS.filter((l) => l.code !== sourceLang);

  const handleTranslate = async (targetCode) => {
    setTranslateOpen(false);
    if (!selectedText?.trim()) return;
    setTranslating(true);
    setTranslateError('');
    setTranslated(null);
    try {
      const pair = `${sourceLang}|${targetCode}`;
      const url = `${MYMEMORY_API}?q=${encodeURIComponent(selectedText)}&langpair=${pair}`;
      const res = await fetch(url);
      const data = await res.json();
      const text = data?.responseData?.translatedText;
      if (text) {
        const target = TRANSLATION_LANGS.find((l) => l.code === targetCode);
        setTranslated({ text, targetCode, ttsLang: target?.ttsLang || targetCode });
      } else {
        setTranslateError('Translation unavailable.');
      }
    } catch (err) {
      console.error(err);
      setTranslateError('Translation failed. Check connection.');
    } finally {
      setTranslating(false);
    }
  };

  const handleSpeakTranslation = () => {
    if (translated?.text) speak(translated.text, translated.ttsLang);
  };

  const closeAll = () => {
    window.getSelection()?.removeAllRanges?.();
    setPosition(null);
    setSelectedText('');
    setTranslated(null);
    setTranslateOpen(false);
  };

  if (!position || !selectedText) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 0,
        background: '#1a1a1a',
        color: '#fff',
        borderRadius: 10,
        padding: '8px 10px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.12)',
        maxWidth: 'min(90vw, 420px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleRead}
          aria-label={t('accessibility.readAloud')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#E31837',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 14px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <Volume2 size={16} />
          {t('accessibility.readAloud')}
        </button>

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setTranslateOpen((v) => !v)}
            aria-label={t('accessibility.translate')}
            disabled={translating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              padding: '8px 14px',
              cursor: translating ? 'wait' : 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <Languages size={16} />
            {translating ? t('accessibility.translating') : t('accessibility.translate')}
          </button>
          {translateOpen && (
            <>
              <div
                role="presentation"
                style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
                onClick={() => setTranslateOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 4,
                  background: '#2a2a2a',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  zIndex: 10001,
                  minWidth: 140,
                }}
              >
                {targetOptions.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleTranslate(lang.code)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 14px',
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 13,
                      textAlign: 'left',
                    }}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {translateError && (
        <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(220,38,38,0.2)', borderRadius: 8, fontSize: 12, color: '#fca5a5' }}>
          {translateError}
        </div>
      )}

      {translated?.text && (
        <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Translation</div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {translated.text}
          </p>
          <button
            type="button"
            onClick={handleSpeakTranslation}
            style={{
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(59,130,246,0.3)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            <Volume2 size={14} />
            {t('accessibility.speakTranslation')}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={closeAll}
        aria-label="Close"
        style={{
          alignSelf: 'flex-end',
          marginTop: 4,
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer',
          fontSize: 11,
        }}
      >
        Close
      </button>
    </div>
  );
};

export default ReadSelectionComponent;
