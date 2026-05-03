/** Persisted appearance: `light` | `dark` (stored in localStorage). */
export const THEME_STORAGE_KEY = 'app-theme';
export const INTENSITY_STORAGE_KEY = 'app-theme-intensity';

/**
 * @returns {'light' | 'dark'}
 */
export function getStoredTheme() {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch {
    /* ignore */
  }
  return 'light';
}

export function getStoredIntensity() {
  try {
    const v = localStorage.getItem(INTENSITY_STORAGE_KEY);
    if (v !== null && !isNaN(parseInt(v, 10))) return parseInt(v, 10);
  } catch {
    /* ignore */
  }
  return 0; // 0% darker by default
}

/**
 * @param {'light' | 'dark'} mode
 * @param {number} intensity
 */
export function applyTheme(mode, intensity = getStoredIntensity()) {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.setAttribute('data-theme', 'dark');
    root.style.setProperty('--dark-intensity', `${intensity}%`);
  } else {
    root.removeAttribute('data-theme');
    root.style.removeProperty('--dark-intensity');
  }
}

export function initTheme() {
  applyTheme(getStoredTheme());
}

/**
 * @param {'light' | 'dark'} mode
 */
export function setStoredTheme(mode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
  applyTheme(mode);
}

export function setStoredIntensity(intensity) {
  try {
    localStorage.setItem(INTENSITY_STORAGE_KEY, intensity.toString());
  } catch {
    /* ignore */
  }
  applyTheme(getStoredTheme(), intensity);
}
