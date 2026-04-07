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
  const buttonRef = useRef(null);
  const activeCode = baseLang(i18n.language || i18n.resolvedLanguage);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        buttonRef.current?.focus();
      }
      // Alt + L for language switcher
      if (e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === activeCode) || LANGUAGES[0];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setOpen(false);
    buttonRef.current?.focus();
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
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(prev => !prev);
          }
          if (e.key === 'ArrowDown' && open) {
            e.preventDefault();
            const items = boxRef.current?.querySelectorAll('[role="menuitem"]');
            items?.[0]?.focus();
          }
        }}
        aria-label={`Language: ${current.label}. Press Alt+L to toggle. Current: ${current.label}`}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Language (Alt+L)"
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
          outline: 'none',
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
        <span>{current.flag}</span>
        <span>{current.label}</span>
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Language options"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 6,
            background: 'rgba(15,15,26,0.98)',
            border: '2px solid rgba(227,24,55,0.3)',
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            minWidth: 180,
            animation: 'slideDown 0.2s ease',
          }}
        >
          {LANGUAGES.map((lang, idx) => (
            <button
              key={lang.code}
              type="button"
              role="menuitem"
              onClick={() => handleLanguageChange(lang.code)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  const items = boxRef.current?.querySelectorAll('[role="menuitem"]');
                  items?.[idx + 1]?.focus();
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  const items = boxRef.current?.querySelectorAll('[role="menuitem"]');
                  if (idx === 0) {
                    buttonRef.current?.focus();
                  } else {
                    items?.[idx - 1]?.focus();
                  }
                } else if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleLanguageChange(lang.code);
                }
              }}
              aria-label={`${lang.label}${activeCode === lang.code ? ' (current)' : ''}`}
              aria-current={activeCode === lang.code ? 'true' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '12px 16px',
                background: activeCode === lang.code ? 'rgba(227,24,55,0.3)' : 'transparent',
                border: 'none',
                borderLeft: activeCode === lang.code ? '3px solid #E31837' : '3px solid transparent',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                textAlign: 'left',
                transition: 'background-color 0.2s',
                outline: 'none',
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
              onFocus={(e) => {
                e.currentTarget.style.background = 'rgba(227,24,55,0.25)';
              }}
            >
              <span style={{ fontSize: 16 }}>{lang.flag}</span>
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

