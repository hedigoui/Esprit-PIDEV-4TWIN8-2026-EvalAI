import { useState, useRef, useEffect } from 'react';
import { 
  Settings, X, Type, AlignLeft, MousePointerClick, 
  Palette, Contrast, Activity, Mic, Keyboard, 
  MonitorSpeaker, RotateCcw, Accessibility, Languages,
  Sparkles, Monitor
} from 'lucide-react';
import { useAccessibilitySettings, injectAccessibilityStyles, injectColorBlindFilters } from '../../hooks/useAccessibilitySettings';
import styles from './AccessibilityPanel.module.css';

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
    injectColorBlindFilters();
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
    <div ref={panelRef} className={styles.panelContainer}>
      {/* Toggle Button */}
      <button
        type="button"
        className={styles.triggerButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle accessibility settings"
        aria-expanded={isOpen}
        title="Accessibility settings (Alt + A)"
      >
        <Accessibility size={24} />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className={styles.panel}>
          {/* Header */}
          <div className={styles.header}>
            <h2>
              <Accessibility size={20} color="var(--primary)" />
              Accessibility
            </h2>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close settings"
            >
              <X size={20} />
            </button>
          </div>

          <div className={styles.content}>
            {/* Font Size */}
            <div className={styles.settingGroup}>
              <label><Type size={16} /> Text Size</label>
              <div className={styles.buttonGroup}>
                <button 
                  type="button"
                  className={`${styles.optionButton} ${settings.fontSize === 'normal' ? styles.active : ''}`}
                  onClick={() => updateSetting('fontSize', 'normal')}
                >Normal</button>
                <button 
                  type="button"
                  className={`${styles.optionButton} ${settings.fontSize === 'large' ? styles.active : ''}`}
                  onClick={() => updateSetting('fontSize', 'large')}
                >Large</button>
                <button 
                  type="button"
                  className={`${styles.optionButton} ${settings.fontSize === 'extra-large' ? styles.active : ''}`}
                  onClick={() => updateSetting('fontSize', 'extra-large')}
                >X-Large</button>
              </div>
            </div>

            {/* Text Spacing */}
            <div className={styles.settingGroup}>
              <label><AlignLeft size={16} /> Line Spacing</label>
              <div className={styles.buttonGroup}>
                <button 
                  type="button"
                  className={`${styles.optionButton} ${settings.textSpacing === 'normal' ? styles.active : ''}`}
                  onClick={() => updateSetting('textSpacing', 'normal')}
                >Normal</button>
                <button 
                  type="button"
                  className={`${styles.optionButton} ${settings.textSpacing === 'wide' ? styles.active : ''}`}
                  onClick={() => updateSetting('textSpacing', 'wide')}
                >Wide</button>
                <button 
                  type="button"
                  className={`${styles.optionButton} ${settings.textSpacing === 'extra-wide' ? styles.active : ''}`}
                  onClick={() => updateSetting('textSpacing', 'extra-wide')}
                >X-Wide</button>
              </div>
            </div>

            {/* Focus Indicator */}
            <div className={styles.settingGroup}>
              <label><MousePointerClick size={16} /> Focus Outline</label>
              <div className={styles.buttonGroup}>
                <button 
                  type="button"
                  className={`${styles.optionButton} ${settings.focusIndicator === 'standard' ? styles.active : ''}`}
                  onClick={() => updateSetting('focusIndicator', 'standard')}
                >Standard</button>
                <button 
                  type="button"
                  className={`${styles.optionButton} ${settings.focusIndicator === 'enhanced' ? styles.active : ''}`}
                  onClick={() => updateSetting('focusIndicator', 'enhanced')}
                >Enhanced</button>
              </div>
            </div>

            {/* Color Blind Mode */}
            <div className={styles.settingGroup}>
              <label><Palette size={16} /> Color Blind Mode</label>
              <div className={styles.buttonGroup} style={{ gap: '0.25rem' }}>
                <button 
                  type="button"
                  className={`${styles.optionButton} ${settings.colorBlindMode === 'none' ? styles.active : ''}`}
                  onClick={() => updateSetting('colorBlindMode', 'none')}
                  style={{ flex: '1 1 45%' }}
                >None</button>
                <button 
                  type="button"
                  className={`${styles.optionButton} ${settings.colorBlindMode === 'deuteranopia' ? styles.active : ''}`}
                  onClick={() => updateSetting('colorBlindMode', 'deuteranopia')}
                  style={{ flex: '1 1 45%' }}
                >Deutera</button>
                <button 
                  type="button"
                  className={`${styles.optionButton} ${settings.colorBlindMode === 'protanopia' ? styles.active : ''}`}
                  onClick={() => updateSetting('colorBlindMode', 'protanopia')}
                  style={{ flex: '1 1 45%' }}
                >Protano</button>
                <button 
                  type="button"
                  className={`${styles.optionButton} ${settings.colorBlindMode === 'tritanopia' ? styles.active : ''}`}
                  onClick={() => updateSetting('colorBlindMode', 'tritanopia')}
                  style={{ flex: '1 1 45%' }}
                >Tritano</button>
              </div>
            </div>

            {/* High Contrast */}
            <div className={styles.toggleItem}>
              <div className={styles.toggleItemInfo}>
                <Contrast size={18} />
                <span>High Contrast</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(e) => updateSetting('highContrast', e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            {/* Reduce Motion */}
            <div className={styles.toggleItem}>
              <div className={styles.toggleItemInfo}>
                <Activity size={18} />
                <span>Reduce Motion</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.reduceMotion}
                  onChange={(e) => updateSetting('reduceMotion', e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            {/* Voice Control */}
            <div className={styles.toggleItem}>
              <div className={styles.toggleItemInfo}>
                <Mic size={18} />
                <span>Voice Assistant</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.voiceControlEnabled}
                  onChange={(e) => updateSetting('voiceControlEnabled', e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            {/* Selection Reader */}
            <div className={styles.toggleItem}>
              <div className={styles.toggleItemInfo}>
                <Languages size={18} />
                <span>Text Reader / Translator</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.selectionReaderEnabled}
                  onChange={(e) => updateSetting('selectionReaderEnabled', e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            {/* Keyboard Navigation */}
            <div className={styles.toggleItem}>
              <div className={styles.toggleItemInfo}>
                <Keyboard size={18} />
                <span>Keyboard Navigation</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.keyboardNavigationEnabled}
                  onChange={(e) => updateSetting('keyboardNavigationEnabled', e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            {/* Screen Reader */}
            <div className={styles.toggleItem}>
              <div className={styles.toggleItemInfo}>
                <MonitorSpeaker size={18} />
                <span>Screen Reader</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.screenReaderOptimized}
                  onChange={(e) => updateSetting('screenReaderOptimized', e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            {/* Night Shift */}
            <div className={styles.toggleItem}>
              <div className={styles.toggleItemInfo}>
                <Sparkles size={18} />
                <span>Night Shift</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.nightShift}
                  onChange={(e) => updateSetting('nightShift', e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            {/* Night Mode Intensity */}
            <div className={styles.intensityControl}>
              <div className={styles.intensityLabel}>
                <Monitor size={18} />
                <span>Dark Mode Depth: {settings.nightModeIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={settings.nightModeIntensity}
                onChange={(e) => updateSetting('nightModeIntensity', parseInt(e.target.value))}
                className={styles.rangeSlider}
              />
            </div>

            {/* Reset Button */}
            <button
              type="button"
              className={styles.resetButton}
              onClick={resetSettings}
            >
              <RotateCcw size={16} />
              Reset to Defaults
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcut: Press 'Alt+A' to open */}
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
