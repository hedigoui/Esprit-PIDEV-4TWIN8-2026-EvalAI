/** Persisted appearance: `light` | `dark` (stored in localStorage). */
export const THEME_STORAGE_KEY = 'app-theme';

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

/**
 * @param {'light' | 'dark'} mode
 */
export function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
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
