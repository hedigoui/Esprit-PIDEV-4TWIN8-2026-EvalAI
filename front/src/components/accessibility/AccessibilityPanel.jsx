import { useState, useRef, useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import { useAccessibilitySettings, injectAccessibilityStyles } from '../../hooks/useAccessibilitySettings';

/**
 * Accessibility Settings Panel
 * Allows users to customize font size, contrast, motion, color blind modes, etc.
 */
const AccessibilityPanel = () => {
  const { settings, updateSetting, resetSettings, loaded } = useAccessibilitySettings();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  // Inject accessibility styles on mount
  useEffect(() => {
    injectAccessibilityStyles();
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!loaded) return null;

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        bottom: '6rem',
        right: '1.5rem',
        zIndex: 9997,
      }}
    >
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle accessibility settings"
        aria-expanded={isOpen}
        title="Accessibility settings (A)"
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: 'none',
          background: '#2563EB',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          transition: 'transform 0.2s',
          ':hover': {
            transform: 'scale(1.05)',
          },
        }}
      >
        <Settings size={20} />
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: 8,
            background: 'rgba(30, 30, 30, 0.98)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 12,
            padding: '1rem',
            width: 320,
            maxHeight: '70vh',
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: 'var(--a11y-font-size, 1rem)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
              Accessibility
            </h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close settings"
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Font Size */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Text Size
            </label>
            <select
              value={settings.fontSize}
              onChange={(e) => updateSetting('fontSize', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: 6,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value="normal">Normal (100%)</option>
              <option value="large">Large (125%)</option>
              <option value="extra-large">Extra Large (150%)</option>
            </select>
          </div>

          {/* Text Spacing */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Line Spacing
            </label>
            <select
              value={settings.textSpacing}
              onChange={(e) => updateSetting('textSpacing', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: 6,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value="normal">Normal</option>
              <option value="wide">Wide (1.5x)</option>
              <option value="extra-wide">Extra Wide (2x)</option>
            </select>
          </div>

          {/* Focus Indicator */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Focus Outline
            </label>
            <select
              value={settings.focusIndicator}
              onChange={(e) => updateSetting('focusIndicator', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: 6,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value="standard">Standard</option>
              <option value="enhanced">Enhanced (Thicker)</option>
            </select>
          </div>

          {/* Color Blind Mode */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Color Blind Mode
            </label>
            <select
              value={settings.colorBlindMode}
              onChange={(e) => updateSetting('colorBlindMode', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: 6,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value="none">None</option>
              <option value="deuteranopia">Deuteranopia (Red-Green)</option>
              <option value="protanopia">Protanopia (Red-Green)</option>
              <option value="tritanopia">Tritanopia (Blue-Yellow)</option>
            </select>
          </div>

          {/* High Contrast */}
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="highContrast"
              checked={settings.highContrast}
              onChange={(e) => updateSetting('highContrast', e.target.checked)}
              style={{ marginRight: '0.5rem', width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="highContrast" style={{ cursor: 'pointer' }}>
              High Contrast Mode
            </label>
          </div>

          {/* Reduce Motion */}
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="reduceMotion"
              checked={settings.reduceMotion}
              onChange={(e) => updateSetting('reduceMotion', e.target.checked)}
              style={{ marginRight: '0.5rem', width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="reduceMotion" style={{ cursor: 'pointer' }}>
              Reduce Motion
            </label>
          </div>

          {/* Voice Control */}
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="voiceEnabled"
              checked={settings.voiceControlEnabled}
              onChange={(e) => updateSetting('voiceControlEnabled', e.target.checked)}
              style={{ marginRight: '0.5rem', width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="voiceEnabled" style={{ cursor: 'pointer' }}>
              Voice Control
            </label>
          </div>

          {/* Keyboard Navigation */}
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="keyboardEnabled"
              checked={settings.keyboardNavigationEnabled}
              onChange={(e) => updateSetting('keyboardNavigationEnabled', e.target.checked)}
              style={{ marginRight: '0.5rem', width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="keyboardEnabled" style={{ cursor: 'pointer' }}>
              Keyboard Navigation
            </label>
          </div>

          {/* Screen Reader */}
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="screenReaderEnabled"
              checked={settings.screenReaderOptimized}
              onChange={(e) => updateSetting('screenReaderOptimized', e.target.checked)}
              style={{ marginRight: '0.5rem', width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="screenReaderEnabled" style={{ cursor: 'pointer' }}>
              Screen Reader Optimized
            </label>
          </div>

          {/* Reset Button */}
          <button
            type="button"
            onClick={resetSettings}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginTop: '1rem',
              borderRadius: 6,
              border: 'none',
              background: 'rgba(255, 59, 48, 0.3)',
              color: '#ff3b30',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 59, 48, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 59, 48, 0.3)';
            }}
          >
            Reset to Default
          </button>
        </div>
      )}

      {/* Keyboard Shortcut: Press 'A' to open */}
      <KeyboardShortcut onKeyPress={() => setIsOpen(!isOpen)} />
    </div>
  );
};

/**
 * Keyboard Shortcut Handler
 */
const KeyboardShortcut = ({ onKeyPress }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt + A to open accessibility panel
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        onKeyPress();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onKeyPress]);

  return null;
};

export default AccessibilityPanel;
