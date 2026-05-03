import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English', prefix: 'GB', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', prefix: 'FR', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', prefix: 'SA', flag: '🇸🇦' },
  { code: 'es', label: 'Español', prefix: 'ES', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', prefix: 'DE', flag: '🇩🇪' },
];

const getInitialLang = () => {
  if (typeof document === 'undefined') return 'en';
  const match = document.cookie.match(/googtrans=\/[^/]+\/([^;]+)/);
  return match ? match[1] : 'en';
};

const LanguageSwitcher = () => {
  const [open, setOpen] = useState(false);
  const [activeCode, setActiveCode] = useState(getInitialLang());
  const boxRef = useRef(null);
  const buttonRef = useRef(null);
  const googleTranslateInitialized = useRef(false);

  useEffect(() => {
    // Inject Google Translate script if not present
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,fr,ar,es,de',
            autoDisplay: false,
          },
          'google_translate_element'
        );
        googleTranslateInitialized.current = true;
      };
      
      document.body.appendChild(script);
    } else {
      googleTranslateInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        buttonRef.current?.focus();
      }
      if (e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    // Aggressively remove Google Translate's injected top margin
    const cleanupInterval = setInterval(() => {
      // Force body and html to not have top padding
      if (document.body.style.top) document.body.style.top = '0px';
      if (document.body.style.position === 'relative') document.body.style.position = 'static';
      if (document.documentElement.style.top) document.documentElement.style.top = '0px';
      
      // Look for the banner iframe and destroy it completely
      const banners = document.querySelectorAll('.goog-te-banner-frame');
      banners.forEach(banner => {
        if (banner) {
          banner.style.display = 'none';
          // Also try to hide the wrapper if it exists
          if (banner.parentElement && banner.parentElement.classList.contains('skiptranslate')) {
            banner.parentElement.style.display = 'none';
          }
        }
      });
      
      // Hide any other skiptranslate elements at the body level (except our widget)
      const skips = document.querySelectorAll('body > .skiptranslate');
      skips.forEach(skip => {
        if (skip && skip.tagName.toLowerCase() === 'div' && skip.id !== 'google_translate_element') {
          skip.style.display = 'none';
        }
      });
    }, 50);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(cleanupInterval);
    };
  }, [open]);

  const triggerGoogleTranslate = (langCode) => {
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
    } else {
      // If select isn't ready yet, set the cookie and reload
      document.cookie = `googtrans=/en/${langCode}; path=/`;
      window.location.reload();
    }
  };

  const handleLanguageChange = (langCode) => {
    setActiveCode(langCode);
    triggerGoogleTranslate(langCode);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const current = LANGUAGES.find((l) => l.code === activeCode) || LANGUAGES[0];

  return (
    <div
      ref={boxRef}
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1.5rem',
        zIndex: 9998,
      }}
    >
      <div id="google_translate_element" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}></div>
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
            marginTop: 8,
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
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Aggressively Hide Google Translate Banner */
        .goog-te-banner-frame {
          display: none !important;
          visibility: hidden !important;
        }
        iframe.goog-te-banner-frame {
          display: none !important;
        }
        .goog-te-gadget-icon {
          display: none !important;
        }
        /* Prevent body/html shifting */
        body {
          top: 0px !important;
          position: static !important;
        }
        html {
          top: 0px !important;
          position: static !important;
        }
        /* Hide tooltips and highlights */
        #goog-gt-tt, .goog-te-balloon-frame {
          display: none !important;
        }
        .goog-text-highlight {
          background: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
};

export default LanguageSwitcher;

