import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, Mic, Github, AlertCircle, ArrowRight } from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';
import styles from './Login.module.css';
import { API_BASE_URL } from '../config/api';
import { useI18n } from '../i18n/I18nProvider';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language, setLanguage } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loggedInToken, setLoggedInToken] = useState(null);
  const brandHeading = t('login.brandHeading').split('\n');
  const brandFeatures = [
    t('login.brandFeature1'),
    t('login.brandFeature2'),
    t('login.brandFeature3'),
  ];

  const OAUTH_ERROR_MESSAGES = useMemo(() => ({
    oauth_not_configured: t('loginErrors.oauth_not_configured'),
    oauth_failed: t('loginErrors.oauth_failed'),
    oauth_missing: t('loginErrors.oauth_missing'),
    oauth_invalid: t('loginErrors.oauth_invalid'),
    oauth_role: t('loginErrors.oauth_role'),
    oauth_email: t('loginErrors.oauth_email'),
    deactivated: t('loginErrors.deactivated'),
  }), [t]);

  useEffect(() => {
    const err = searchParams.get('error');
    if (!err) return;
    let msg = OAUTH_ERROR_MESSAGES[err] || OAUTH_ERROR_MESSAGES.oauth_failed;
    if (err === 'oauth_not_configured') {
      const p = searchParams.get('provider');
      if (p === 'google') msg += ` ${t('loginErrors.oauth_not_configured_google')}`;
      else if (p === 'github') msg += ` ${t('loginErrors.oauth_not_configured_github')}`;
    }
    setError(msg);
    navigate('/', { replace: true });
  }, [searchParams, navigate, OAUTH_ERROR_MESSAGES, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        if (!data.user?.isActive) {
          setError(t('login.accountDeactivated'));
          setLoading(false);
          return;
        }
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('evalai:user-updated'));
        if (rememberMe) localStorage.setItem('rememberMe', 'true');
        else localStorage.removeItem('rememberMe');
        const userRole = data.user?.role;
        const isTemporaryPassword = data.user?.isTemporaryPassword;
        if (!userRole) { setError(t('login.noRole')); setLoading(false); return; }
        if (isTemporaryPassword) {
          setLoggedInUser(data.user); setLoggedInToken(data.access_token);
          setShowPasswordModal(true); setLoading(false); return;
        }
        setIsTransitioning(true);
        setTimeout(() => {
          if (userRole === 'admin') navigate('/admin/dashboard');
          else if (userRole === 'instructor') navigate('/teacher/dashboard');
          else if (userRole === 'student') navigate('/student/dashboard');
          else setError(`Unknown user role: ${userRole}`);
        }, 100);
      } else {
        if (response.status === 401) {
          setError(data.message?.includes('deactivated') ? t('login.accountDeactivated') : data.message || t('login.invalidEmailPassword'));
        } else setError(data.message || t('login.loginFailed'));
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(t('login.cannotConnectServer'));
    } finally { setLoading(false); }
  };

  const handleNavigateToSignup = (e) => {
    e.preventDefault();
    setIsTransitioning(true);
    setTimeout(() => navigate('/signup'), 300);
  };

  const navigateToDashboard = (userRole) => {
    if (userRole === 'admin') navigate('/admin/dashboard');
    else if (userRole === 'instructor') navigate('/teacher/dashboard');
    else if (userRole === 'student') navigate('/student/dashboard');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }

        .login-root {
          min-height: 100vh;
          display: flex;
          background: var(--bg-main);
        }

        /* ── LEFT BRAND PANEL ── */
        .login-brand {
          width: 45%;
          background: linear-gradient(145deg, #E31837 0%, #9B0000 55%, #6B0000 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 3rem 3.5rem;
          position: relative;
          overflow: hidden;
        }
        .login-brand::before {
          content: '';
          position: absolute;
          top: -120px; right: -120px;
          width: 380px; height: 380px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
        }
        .login-brand::after {
          content: '';
          position: absolute;
          bottom: -80px; left: -80px;
          width: 280px; height: 280px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
        }
        .login-brand-content { position: relative; z-index: 1; }
        .login-brand-logo {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 3rem;
        }
        .login-brand-icon {
          width: 52px; height: 52px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(8px);
        }
        .login-brand-name {
          font-size: 2rem; font-weight: 800; color: #fff;
          letter-spacing: -0.04em; line-height: 1;
        }
        .login-brand-name span { opacity: 0.6; }
        .login-brand-heading {
          font-size: 2.4rem; font-weight: 800; color: #fff;
          line-height: 1.15; letter-spacing: -0.03em;
          margin-bottom: 1rem;
        }
        .login-brand-sub {
          font-size: 1rem; color: rgba(255,255,255,0.7);
          line-height: 1.6; margin-bottom: 2.5rem;
        }
        .login-feature {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 1rem;
        }
        .login-feature-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(255,255,255,0.5); flex-shrink: 0;
        }
        .login-feature-text { font-size: 0.9rem; color: rgba(255,255,255,0.8); }
        .login-brand-tag {
          margin-top: 2.5rem;
          font-size: 0.8rem; color: rgba(255,255,255,0.45);
        }
        .login-brand-blob1 {
          position: absolute; bottom: 15%; right: 8%;
          width: 150px; height: 150px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .login-brand-blob2 {
          position: absolute; top: 30%; right: -40px;
          width: 100px; height: 100px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.07);
        }

        /* ── RIGHT FORM PANEL ── */
        .login-form-panel {
          flex: 1;
          display: flex; flex-direction: column;
          justify-content: center; align-items: center;
          padding: 3rem 2rem;
          background: var(--bg-card-solid);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .login-form-panel.fade-out { opacity: 0; transform: translateX(16px); }
        .login-form-panel.fade-in { opacity: 1; transform: translateX(0); }
        .login-form-wrap { width: 100%; max-width: 400px; }

        .login-form-header { margin-bottom: 2rem; }
        .login-lang {
          display: flex; justify-content: flex-end; margin-bottom: 1rem;
        }
        .login-lang-select {
          height: 34px; padding: 0 0.6rem;
          border-radius: 10px; border: 1px solid var(--border-light);
          background: var(--bg-card); color: var(--text-secondary);
          font-size: 0.75rem; font-weight: 700; letter-spacing: 0.04em;
          cursor: pointer;
        }
        .login-form-kicker {
          font-size: 0.7rem; font-weight: 700; color: #E31837;
          text-transform: uppercase; letter-spacing: 0.12em;
          margin-bottom: 0.5rem;
        }
        .login-form-title {
          font-size: 1.9rem; font-weight: 800; color: var(--text-primary);
          letter-spacing: -0.03em; margin-bottom: 0.35rem;
        }
        .login-form-sub { font-size: 0.9rem; color: var(--text-secondary); }

        .login-error {
          display: flex; align-items: flex-start; gap: 10px;
          background: #fef2f4; border: 1px solid #fecdd3;
          color: #be123c; border-radius: 12px;
          padding: 0.85rem 1rem; margin-bottom: 1.5rem;
          font-size: 0.85rem; line-height: 1.5;
        }

        .login-field { margin-bottom: 1.25rem; }
        .login-label {
          display: block; font-size: 0.83rem; font-weight: 600;
          color: var(--text-secondary); margin-bottom: 0.45rem;
        }
        .login-input-wrap { position: relative; }
        .login-input {
          width: 100%;
          padding: 0.75rem 2.8rem 0.75rem 1rem;
          border: 1.5px solid var(--border-light);
          border-radius: 12px;
          font-size: 0.9rem; color: var(--text-primary);
          background: var(--bg-card-solid);
          transition: all 0.2s ease;
          outline: none;
        }
        .login-input:focus {
          border-color: #E31837;
          background: var(--bg-card-solid);
          box-shadow: 0 0 0 3px rgba(227,24,55,0.08);
        }
        .login-input:disabled { opacity: 0.6; cursor: not-allowed; }
        .login-input-icon {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted); pointer-events: none;
        }
        .login-eye {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); padding: 2px;
          display: flex; align-items: center;
          transition: color 0.2s;
        }
        .login-eye:hover { color: #E31837; }

        .login-options {
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 1.5rem;
        }
        .login-remember {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.85rem; color: #4b5563; cursor: pointer;
        }
        .login-checkbox {
          width: 16px; height: 16px;
          accent-color: #E31837; cursor: pointer;
        }
        .login-forgot {
          font-size: 0.83rem; font-weight: 600; color: #E31837;
          text-decoration: none; transition: opacity 0.2s;
        }
        .login-forgot:hover { opacity: 0.75; }

        .login-btn {
          width: 100%;
          padding: 0.85rem;
          background: linear-gradient(135deg, #E31837 0%, #B71C1C 100%);
          color: #fff; border: none; border-radius: 12px;
          font-size: 0.95rem; font-weight: 700;
          cursor: pointer; letter-spacing: 0.01em;
          transition: all 0.25s ease;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 16px rgba(227,24,55,0.35);
          margin-bottom: 1.5rem;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(227,24,55,0.45);
        }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }

        .login-divider {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 1.25rem;
        }
        .login-divider-line { flex: 1; height: 1px; background: var(--border-light); }
        .login-divider-text { font-size: 0.78rem; color: var(--text-muted); white-space: nowrap; }

        .login-socials { display: flex; gap: 10px; margin-bottom: 1.5rem; }
        .login-social {
          flex: 1; padding: 0.7rem;
          border: 1.5px solid var(--border-light); border-radius: 12px;
          background: var(--bg-card); cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);
          transition: all 0.2s ease;
        }
        .login-social:hover { border-color: var(--border-light); background: var(--bg-card-solid); transform: translateY(-1px); }
        .login-social:disabled { opacity: 0.6; cursor: not-allowed; }

        .login-signup-link {
          text-align: center; font-size: 0.88rem; color: var(--text-secondary);
        }
        .login-signup-link a {
          color: #E31837; font-weight: 700; text-decoration: none;
        }
        .login-signup-link a:hover { text-decoration: underline; }

        .login-footer {
          text-align: center; margin-top: 2rem;
          font-size: 0.78rem; color: var(--text-muted);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .login-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @media (max-width: 768px) {
          .login-brand { display: none; }
          .login-form-panel { padding: 2rem 1.25rem; }
        }
      `}</style>

      <div className="login-root">
        {/* Left Brand */}
        <div className="login-brand">
          <div className="login-brand-content">
            <div className="login-brand-logo">
              <div className="login-brand-icon">
                <Mic size={26} color="#fff" />
              </div>
              <div className="login-brand-name">
                Eval<span>AI</span>
              </div>
            </div>
            <div className="login-brand-heading">{brandHeading[0]}<br />{brandHeading[1] || ''}</div>
            <p className="login-brand-sub">{t('login.brandSub')}</p>
            <div>
              {brandFeatures.map((f) => (
                <div className="login-feature" key={f}>
                  <div className="login-feature-dot" />
                  <span className="login-feature-text">{f}</span>
                </div>
              ))}
            </div>
            <p className="login-brand-tag">{t('login.brandTagline')}</p>
          </div>
          <div className="login-brand-blob1" />
          <div className="login-brand-blob2" />
        </div>

        {/* Right Form */}
        <div className={`login-form-panel ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
          <div className="login-form-wrap">
            <div className="login-lang">
              <select
                className="login-lang-select"
                aria-label={t('common.language')}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
              </select>
            </div>
            <div className="login-form-header">
              <div className="login-form-kicker">{t('login.welcomeBack')}</div>
              <h2 className="login-form-title">{t('login.signIn')}</h2>
              <p className="login-form-sub">{t('login.sub')}</p>
            </div>

            {error && (
              <div className="login-error">
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label className="login-label" htmlFor="email">{t('login.email')}</label>
                <div className="login-input-wrap">
                  <input id="email" type="email" placeholder="you@example.com" value={email}
                    onChange={e => setEmail(e.target.value)} className="login-input" required disabled={loading} />
                  <Mail size={16} className="login-input-icon" />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="password">{t('login.password')}</label>
                <div className="login-input-wrap">
                  <input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} className="login-input"
                    required disabled={loading} minLength={6} />
                  <button type="button" className="login-eye" onClick={() => setShowPassword(!showPassword)} disabled={loading}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="login-options">
                <label className="login-remember">
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                    className="login-checkbox" disabled={loading} />
                  <span>{t('login.rememberMe')}</span>
                </label>
                <a href="#" className="login-forgot"
                  onClick={e => { e.preventDefault(); setIsTransitioning(true); setTimeout(() => navigate('/forgot-password'), 300); }}>
                  {t('login.forgotPassword')}
                </a>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <><div className="login-spinner" /> {t('login.signingIn')}</> : <>{t('login.signIn')} <ArrowRight size={16} /></>}
              </button>
            </form>

            <div className="login-divider">
              <span className="login-divider-line" />
              <span className="login-divider-text">{t('login.orContinueWith')}</span>
              <span className="login-divider-line" />
            </div>

            <div className="login-socials">
              <button type="button" className="login-social" disabled={loading}
                onClick={() => window.location.assign(`${API_BASE_URL}/auth/github`)}>
                <Github size={18} /> GitHub
              </button>
              <button type="button" className="login-social" disabled={loading}
                onClick={() => window.location.assign(`${API_BASE_URL}/auth/google`)}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
            </div>

            <p className="login-signup-link">
              {t('login.noAccount')} <a href="#" onClick={handleNavigateToSignup}>{t('login.createAccount')}</a>
            </p>
          </div>
          <footer className="login-footer">EvalAI &copy; 2026</footer>
        </div>
      </div>

      {showPasswordModal && loggedInUser && loggedInToken && (
        <ChangePasswordModal user={loggedInUser} token={loggedInToken}
          onClose={() => { setShowPasswordModal(false); navigateToDashboard(loggedInUser.role); }}
          onSuccess={() => { setShowPasswordModal(false); setTimeout(() => navigateToDashboard(loggedInUser.role), 500); }}
        />
      )}
    </>
  );
};

export default Login;