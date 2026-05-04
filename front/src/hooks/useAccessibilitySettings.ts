import { useState, useEffect, useCallback } from 'react';

export interface AccessibilitySettings {
  fontSize: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  reduceMotion: boolean;
  textSpacing: 'normal' | 'wide' | 'extra-wide';
  focusIndicator: 'standard' | 'enhanced';
  screenReaderOptimized: boolean;
  voiceControlEnabled: boolean;
  keyboardNavigationEnabled: boolean;
  selectionReaderEnabled: boolean;
  colorBlindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  nightShift: boolean;
  nightModeIntensity: number;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 'normal',
  highContrast: false,
  reduceMotion: false,
  textSpacing: 'normal',
  focusIndicator: 'standard',
  screenReaderOptimized: false,
  voiceControlEnabled: true,
  keyboardNavigationEnabled: true,
  selectionReaderEnabled: true,
  colorBlindMode: 'none',
  nightShift: false,
  nightModeIntensity: 0,
};

const STORAGE_KEY = 'a11y-settings';

/**
 * Accessibility Settings Hook
 * Manages user accessibility preferences with localStorage persistence
 */
export const useAccessibilitySettings = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (err) {
      console.warn('Failed to load accessibility settings:', err);
    }
    setLoaded(true);
  }, []);

  // Apply CSS variables for accessibility features
  useEffect(() => {
    if (!loaded) return;

    // Inject global styles if they don't exist
    injectAccessibilityStyles();
    injectColorBlindFilters();

    const root = document.documentElement;
    
    // Font size
    const fontSizeMap = {
      normal: '100%',
      large: '125%',
      'extra-large': '150%',
    };
    root.style.setProperty('--a11y-font-size', fontSizeMap[settings.fontSize]);

    // Text spacing
    const spacingMap = {
      normal: '1.5',
      wide: '2',
      'extra-wide': '2.5',
    };
    root.style.setProperty('--a11y-line-height', spacingMap[settings.textSpacing]);

    // High contrast
    root.classList.toggle('a11y-high-contrast', settings.highContrast);

    // Reduce motion
    root.classList.toggle('a11y-reduce-motion', settings.reduceMotion);

    // Enhanced focus indicators
    root.classList.toggle('a11y-enhanced-focus', settings.focusIndicator === 'enhanced');

    // Screen reader optimized
    root.classList.toggle('a11y-sr-optimized', settings.screenReaderOptimized);

    // Color blind mode
    root.classList.toggle('a11y-deuteranopia', settings.colorBlindMode === 'deuteranopia');
    root.classList.toggle('a11y-protanopia', settings.colorBlindMode === 'protanopia');
    root.classList.toggle('a11y-tritanopia', settings.colorBlindMode === 'tritanopia');

    // Night Shift & Intensity logic
    root.style.setProperty('--a11y-night-shift', settings.nightShift ? '0.2' : '0');
    root.style.setProperty('--a11y-dark-intensity', (settings.nightModeIntensity / 100).toString());

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings, loaded]);

  const updateSetting = useCallback(
    <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        // Dispatch event to sync state across all hook instances
        window.dispatchEvent(new CustomEvent('a11y-settings-sync', { detail: next }));
        return next;
      });
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('a11y-settings-sync', { detail: DEFAULT_SETTINGS }));
  }, []);

  // Listen for sync events from other hook instances
  useEffect(() => {
    const handleSync = (e: CustomEvent<AccessibilitySettings>) => {
      setSettings(e.detail);
    };
    
    window.addEventListener('a11y-settings-sync', handleSync as EventListener);
    return () => window.removeEventListener('a11y-settings-sync', handleSync as EventListener);
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
    loaded,
  };
};

/**
 * Inject accessibility CSS into head
 */
export const injectAccessibilityStyles = () => {
  if (document.getElementById('a11y-styles')) return; // Already injected

  const style = document.createElement('style');
  style.id = 'a11y-styles';
  style.innerHTML = `
    :root {
      --a11y-font-size: 100%;
      --a11y-line-height: 1.5;
      --a11y-focus-color: #4A90E2;
      --a11y-focus-outline: 3px solid var(--a11y-focus-color);
      --a11y-night-shift: 0;
      --a11y-dark-intensity: 0;
    }

    html {
      font-size: var(--a11y-font-size) !important;
    }

    /* Night Shift Overlay */
    html::after {
      content: "";
      position: fixed;
      inset: 0;
      background: #ff9d00;
      opacity: var(--a11y-night-shift);
      pointer-events: none;
      z-index: 99999;
      mix-blend-mode: multiply;
      transition: opacity 0.3s ease;
    }

    /* Dark Mode Intensity Overlay */
    html::before {
      content: "";
      position: fixed;
      inset: 0;
      background: #000;
      opacity: var(--a11y-dark-intensity);
      pointer-events: none;
      z-index: 99998;
      transition: opacity 0.3s ease;
    }

    /* Font size and spacing */
    body {
      line-height: var(--a11y-line-height);
    }

    /* Enhanced focus indicators */
    .a11y-enhanced-focus *:focus-visible {
      outline: var(--a11y-focus-outline) !important;
      outline-offset: 2px !important;
    }

    /* High contrast mode */
    .a11y-high-contrast {
      --bg-color: #000;
      --text-color: #fff;
      --border-color: #fff;
    }

    .a11y-high-contrast body {
      background-color: var(--bg-color) !important;
      color: var(--text-color) !important;
    }

    .a11y-high-contrast button,
    .a11y-high-contrast input,
    .a11y-high-contrast select,
    .a11y-high-contrast textarea {
      border-color: var(--border-color) !important;
      background-color: var(--bg-color) !important;
      color: var(--text-color) !important;
    }

    /* Reduce motion */
    .a11y-reduce-motion,
    .a11y-reduce-motion * {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }

    /* Screen reader optimized - clearer indicators */
    .a11y-sr-optimized button,
    .a11y-sr-optimized a,
    .a11y-sr-optimized input {
      border: 2px solid currentColor;
    }

    /* Color blind filters */
    .a11y-deuteranopia {
      filter: url(#deuteranopia);
    }

    .a11y-protanopia {
      filter: url(#protanopia);
    }

    .a11y-tritanopia {
      filter: url(#tritanopia);
    }

    /* Skip to main content link */
    .skip-to-main {
      position: absolute;
      top: -9999px;
      left: -9999px;
      z-index: 999;
    }

    .skip-to-main:focus {
      top: 0;
      left: 0;
      width: 100%;
      background: #000;
      color: #fff;
      padding: 10px;
      text-align: center;
    }

    /* Focus visible for all interactive elements */
    button:focus-visible,
    a:focus-visible,
    input:focus-visible,
    select:focus-visible,
    textarea:focus-visible {
      outline: 3px solid #4A90E2;
      outline-offset: 2px;
    }
  `;
  document.head.appendChild(style);
};

/**
 * Inject the mathematical SVG matrices required for Color Blind CSS filters to actually work.
 */
export const injectColorBlindFilters = () => {
  if (document.getElementById('a11y-color-blind-filters')) return;

  const svg = document.createElement('div');
  svg.id = 'a11y-color-blind-filters';
  svg.innerHTML = `
    <svg style="width: 0; height: 0; position: absolute; pointer-events: none;" aria-hidden="true">
      <defs>
        <filter id="deuteranopia">
          <feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"/>
        </filter>
        <filter id="protanopia">
          <feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"/>
        </filter>
        <filter id="tritanopia">
          <feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"/>
        </filter>
      </defs>
    </svg>
  `;
  document.body.appendChild(svg);
};

/**
 * Skip to main content content manager
 */
export const createSkipLink = (mainContentSelector: string = 'main') => {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-to-main';
  skipLink.addEventListener('click', () => {
    const mainContent = document.querySelector(mainContentSelector) as HTMLElement;
    if (mainContent) {
      mainContent.tabIndex = -1;
      mainContent.focus();
    }
  });
  document.body.insertBefore(skipLink, document.body.firstChild);
};
