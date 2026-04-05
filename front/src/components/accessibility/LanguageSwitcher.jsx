import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English', prefix: 'GB', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', prefix: 'FR', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', prefix: 'SA', flag: '🇸🇦' },
];

const baseLang = (lng) => (lng || 'en').split('-')[0];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const activeCode = baseLang(i18n.language || i18n.resolvedLanguage);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const current = LANGUAGES.find((l) => l.code === activeCode) || LANGUAGES[0];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setOpen(false);
  };

  return (
    <div
      ref={boxRef}
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9998,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Language: ${current.label}`}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: 'rgba(15,15,26,0.92)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10,
          color: '#fff',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(15,15,26,0.98)';
          e.currentTarget.style.borderColor = 'rgba(227,24,55,0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(15,15,26,0.92)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
        }}
      >
        <Globe size={18} />
        <span>{current.label}</span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 6,
            background: 'rgba(15,15,26,0.98)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            minWidth: 160,
            animation: 'slideDown 0.2s ease',
          }}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleLanguageChange(lang.code)}
              aria-label={`Switch to ${lang.label}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 16px',
                background: activeCode === lang.code ? 'rgba(227,24,55,0.25)' : 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                textAlign: 'left',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (activeCode !== lang.code) {
                  e.currentTarget.style.background = 'rgba(227,24,55,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeCode !== lang.code) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, minWidth: 22 }}>{lang.prefix}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default LanguageSwitcher;

