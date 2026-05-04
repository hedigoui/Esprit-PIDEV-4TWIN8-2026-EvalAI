/** Backend origin (no trailing slash). Must be your Nest API, not GitHub/Google. */
function normalizeApiBase(raw) {
  const fallback = 'http://localhost:3000';
  const trimmed = (raw || '').trim().replace(/\/$/, '');
  const base = trimmed || fallback;
  // Mis-set VITE_API_URL often causes OAuth links like https://github.com/auth/github → 404
  if (/github\.com|google\.com|googleapis\.com/i.test(base)) {
    console.warn(
      '[api] VITE_API_URL must point to your API (e.g. http://localhost:3000), not a provider domain. Using default.',
    );
    return fallback;
  }
  return base;
}

export const API_BASE_URL = normalizeApiBase(import.meta.env.VITE_API_URL);
