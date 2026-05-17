/** Backend origin (no trailing slash). Must be your Nest API, not GitHub/Google. */
function normalizeApiBase(raw) {
  const fallback = import.meta.env.DEV
    ? 'http://localhost:3001'
    : 'https://pi-backend-k23t.onrender.com';
  const trimmed = (raw || '').trim().replace(/\/$/, '');
  const base = trimmed || fallback;

  if (!import.meta.env.DEV && /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(base)) {
    console.warn('[api] Ignoring localhost backend origin in production. Using Render backend fallback.');
    return fallback;
  }

  // Mis-set VITE_API_URL often causes OAuth links like https://github.com/auth/github → 404
  if (/github\.com|google\.com|googleapis\.com/i.test(base)) {
    console.warn('[api] VITE_API_URL must point to your API origin. Using fallback backend origin.');
    return fallback;
  }
  return base;
}

export const API_BASE_URL = normalizeApiBase(import.meta.env.VITE_API_URL);
