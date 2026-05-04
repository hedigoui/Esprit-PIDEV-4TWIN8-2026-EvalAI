import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Phone, User, GraduationCap, Mic, Github, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';
import styles from './Login.module.css';
import { API_BASE_URL } from '../config/api';
import { useI18n } from '../i18n/I18nProvider';

const Signup = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useI18n();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');
  const [gender, setGender] = useState('male');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const brandHeading = t('signup.brandHeading').split('\n');
  const brandFeatures = [
    t('signup.brandFeature1'),
    t('signup.brandFeature2'),
    t('signup.brandFeature3'),
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError(t('signup.passwordsNoMatch')); return; }
    if (password.length < 6) { setError(t('signup.passwordTooShort')); return; }
    if (!agreeTerms) { setError(t('signup.agreeTermsError')); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName, phone, gender, role: selectedRole, isActive: false }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(t('signup.accountCreated'));
        handleNavigateToLogin();
      } else {
        setError(data.message || (response.status === 400 ? t('signup.emailExists') : t('signup.createFailed')));
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError(t('signup.cannotConnect'));
    } finally { setLoading(false); }
  };

  const handleNavigateToLogin = (e) => {
    if (e) e.preventDefault();
    setIsTransitioning(true);
    setTimeout(() => navigate('/'), 300);
  };

  const roles = [
    { id: 'student', label: t('signup.roleStudent'), icon: GraduationCap },
    { id: 'instructor', label: t('signup.roleInstructor'), icon: User },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; }

        .su-root { min-height: 100vh; display: flex; background: var(--bg-main); }

        /* BRAND */
        .su-brand {
          width: 42%;
          background: linear-gradient(145deg, #E31837 0%, #9B0000 55%, #6B0000 100%);
          display: flex; flex-direction: column; justify-content: center;
          padding: 3rem 3rem; position: relative; overflow: hidden;
        }
        .su-brand::before {
          content: ''; position: absolute; top: -100px; right: -100px;
          width: 320px; height: 320px; border-radius: 50%;
          background: rgba(255,255,255,0.06);
        }
        .su-brand::after {
          content: ''; position: absolute; bottom: -60px; left: -60px;
          width: 220px; height: 220px; border-radius: 50%;
          background: rgba(255,255,255,0.04);
        }
        .su-brand-inner { position: relative; z-index: 1; }
        .su-brand-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 2.5rem; }
        .su-brand-icon {
          width: 48px; height: 48px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 14px; display: flex; align-items: center; justify-content: center;
        }
        .su-brand-name { font-size: 1.8rem; font-weight: 800; color: #fff; letter-spacing: -0.04em; }
        .su-brand-name span { opacity: 0.6; }
        .su-brand-heading { font-size: 2.1rem; font-weight: 800; color: #fff; line-height: 1.2; letter-spacing: -0.03em; margin-bottom: 0.85rem; }
        .su-brand-sub { font-size: 0.92rem; color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 2rem; }
        .su-feature { display: flex; align-items: center; gap: 10px; margin-bottom: 0.85rem; }
        .su-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.5); flex-shrink: 0; }
        .su-feature-text { font-size: 0.88rem; color: rgba(255,255,255,0.8); }
        .su-brand-blob1 { position: absolute; bottom: 18%; right: 6%; width: 130px; height: 130px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); }
        .su-brand-blob2 { position: absolute; top: 28%; right: -35px; width: 90px; height: 90px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.07); }

        /* FORM PANEL */
        .su-panel {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: flex-start;
          padding: 2.5rem 2rem; overflow-y: auto;
          background: var(--bg-card-solid);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .su-panel.fade-out { opacity: 0; transform: translateX(16px); }
        .su-panel.fade-in { opacity: 1; transform: translateX(0); }
        .su-wrap { width: 100%; max-width: 420px; }

        .su-header { margin-bottom: 1.75rem; }
        .su-lang {
          display: flex; justify-content: flex-end; margin-bottom: 1rem;
        }
        .su-lang-select {
          height: 34px; padding: 0 0.6rem;
          border-radius: 10px; border: 1px solid var(--border-light);
          background: var(--bg-card); color: var(--text-secondary);
          font-size: 0.75rem; font-weight: 700; letter-spacing: 0.04em;
          cursor: pointer;
        }
        .su-kicker { font-size: 0.68rem; font-weight: 700; color: #E31837; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.4rem; }
        .su-title { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.03em; margin-bottom: 0.3rem; }
        .su-sub { font-size: 0.88rem; color: var(--text-secondary); }

        .su-error {
          display: flex; align-items: flex-start; gap: 10px;
          background: #fef2f4; border: 1px solid #fecdd3; color: #be123c;
          border-radius: 12px; padding: 0.8rem 1rem; margin-bottom: 1.25rem;
          font-size: 0.83rem; line-height: 1.5;
        }

        /* ROLE SELECTOR */
        .su-roles { display: flex; gap: 8px; margin-bottom: 1.25rem; }
        .su-role-btn {
          flex: 1; padding: 0.65rem 0.5rem;
          border: 1.5px solid var(--border-light); border-radius: 12px;
          background: var(--bg-card); cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);
          transition: all 0.2s ease;
        }
        .su-role-btn:hover { border-color: #E31837; color: #E31837; background: #fef2f4; }
        .su-role-btn.active {
          border-color: #E31837; color: #E31837;
          background: rgba(227,24,55,0.06);
          box-shadow: 0 0 0 3px rgba(227,24,55,0.1);
        }

        /* FORM GRID */
        .su-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
        .su-field { margin-bottom: 0.9rem; }
        .su-label { display: block; font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem; }
        .su-input-wrap { position: relative; }
        .su-input {
          width: 100%; padding: 0.72rem 2.6rem 0.72rem 0.9rem;
          border: 1.5px solid var(--border-light); border-radius: 12px;
          font-size: 0.88rem; color: var(--text-primary); background: var(--bg-card-solid);
          transition: all 0.2s ease; outline: none;
        }
        .su-input:focus { border-color: #E31837; background: var(--bg-card-solid); box-shadow: 0 0 0 3px rgba(227,24,55,0.08); }
        .su-input-icon { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
        .su-eye {
          position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #9ca3af; padding: 2px;
          display: flex; align-items: center; transition: color 0.2s;
        }
        .su-eye:hover { color: #E31837; }

        .su-terms {
          display: flex; align-items: center; gap: 9px;
          font-size: 0.84rem; color: var(--text-secondary);
          cursor: pointer; margin-bottom: 1.25rem;
        }
        .su-checkbox { width: 16px; height: 16px; accent-color: #E31837; cursor: pointer; }

        .su-btn {
          width: 100%; padding: 0.82rem;
          background: linear-gradient(135deg, #E31837, #B71C1C);
          color: #fff; border: none; border-radius: 12px;
          font-size: 0.93rem; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 16px rgba(227,24,55,0.35);
          transition: all 0.25s ease; margin-bottom: 1.25rem;
        }
        .su-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(227,24,55,0.45); }
        .su-btn:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }

        .su-divider { display: flex; align-items: center; gap: 10px; margin-bottom: 1rem; }
        .su-divider-line { flex: 1; height: 1px; background: var(--border-light); }
        .su-divider-text { font-size: 0.76rem; color: var(--text-muted); white-space: nowrap; }

        .su-socials { display: flex; gap: 9px; margin-bottom: 1.25rem; }
        .su-social {
          flex: 1; padding: 0.65rem;
          border: 1.5px solid var(--border-light); border-radius: 12px; background: var(--bg-card);
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px;
          font-size: 0.83rem; font-weight: 600; color: var(--text-secondary);
          transition: all 0.2s ease;
        }
        .su-social:hover { border-color: var(--border-light); background: var(--bg-card-solid); transform: translateY(-1px); }
        .su-social:disabled { opacity: 0.6; cursor: not-allowed; }

        .su-login-link { text-align: center; font-size: 0.86rem; color: var(--text-secondary); }
        .su-login-link a { color: #E31837; font-weight: 700; text-decoration: none; }
        .su-login-link a:hover { text-decoration: underline; }

        .su-footer { text-align: center; margin-top: 1.5rem; font-size: 0.76rem; color: var(--text-muted); }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .su-spinner { width: 17px; height: 17px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }

        @media (max-width: 768px) { .su-brand { display: none; } .su-panel { padding: 2rem 1.25rem; } }
      `}</style>

      <div className="su-root">
        {/* Brand Panel */}
        <div className="su-brand">
          <div className="su-brand-inner">
            <div className="su-brand-logo">
              <div className="su-brand-icon"><Mic size={24} color="#fff" /></div>
              <div className="su-brand-name">Eval<span>AI</span></div>
            </div>
            <div className="su-brand-heading">{brandHeading[0]}<br />{brandHeading[1] || ''}</div>
            <p className="su-brand-sub">{t('signup.brandSub')}</p>
            {brandFeatures.map((f) => (
              <div className="su-feature" key={f}>
                <div className="su-dot" /><span className="su-feature-text">{f}</span>
              </div>
            ))}
          </div>
          <div className="su-brand-blob1" /><div className="su-brand-blob2" />
        </div>

        {/* Form Panel */}
        <div className={`su-panel ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
          <div className="su-wrap">
            <div className="su-lang">
              <select
                className="su-lang-select"
                aria-label={t('common.language')}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
              </select>
            </div>
            <div className="su-header">
              <div className="su-kicker">{t('signup.getStarted')}</div>
              <h2 className="su-title">{t('signup.createAccount')}</h2>
              <p className="su-sub">{t('signup.sub')}</p>
            </div>

            {error && (
              <div className="su-error">
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Role Selector */}
            <div className="su-roles">
              {roles.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button"
                  className={`su-role-btn${selectedRole === id ? ' active' : ''}`}
                  onClick={() => setSelectedRole(id)}>
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {/* Gender */}
              <div className="su-field">
                <label className="su-label" htmlFor="gender">{t('signup.gender')}</label>
                <div className="su-input-wrap">
                  <select id="gender" value={gender} onChange={e => setGender(e.target.value)} className="su-input" required>
                    <option value="male">{t('signup.genderMale')}</option>
                    <option value="female">{t('signup.genderFemale')}</option>
                  </select>
                  <User size={15} className="su-input-icon" />
                </div>
              </div>

              {/* Name Row */}
              <div className="su-grid2">
                <div className="su-field">
                  <label className="su-label" htmlFor="firstName">{t('signup.firstName')}</label>
                  <div className="su-input-wrap">
                    <input id="firstName" type="text" placeholder="First name" value={firstName}
                      onChange={e => setFirstName(e.target.value)} className="su-input" required />
                    <User size={15} className="su-input-icon" />
                  </div>
                </div>
                <div className="su-field">
                  <label className="su-label" htmlFor="lastName">{t('signup.lastName')}</label>
                  <div className="su-input-wrap">
                    <input id="lastName" type="text" placeholder="Last name" value={lastName}
                      onChange={e => setLastName(e.target.value)} className="su-input" required />
                    <User size={15} className="su-input-icon" />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="su-field">
                <label className="su-label" htmlFor="email">{t('signup.email')}</label>
                <div className="su-input-wrap">
                  <input id="email" type="email" placeholder="you@example.com" value={email}
                    onChange={e => setEmail(e.target.value)} className="su-input" required />
                  <Mail size={15} className="su-input-icon" />
                </div>
              </div>

              {/* Phone (optional) */}
              <div className="su-field">
                <label className="su-label" htmlFor="phone">{t('signup.phoneOptional')}</label>
                <div className="su-input-wrap">
                  <input id="phone" type="tel" placeholder="+1 (555) 000-0000" value={phone}
                    onChange={e => setPhone(e.target.value)} className="su-input" />
                  <Phone size={15} className="su-input-icon" />
                </div>
              </div>

              {/* Passwords */}
              <div className="su-grid2">
                <div className="su-field">
                  <label className="su-label" htmlFor="password">{t('signup.password')}</label>
                  <div className="su-input-wrap">
                    <input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)} className="su-input" required minLength={6} />
                    <button type="button" className="su-eye" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="su-field">
                  <label className="su-label" htmlFor="confirmPassword">{t('signup.confirm')}</label>
                  <div className="su-input-wrap">
                    <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••"
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="su-input" required />
                    <button type="button" className="su-eye" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <label className="su-terms">
                <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="su-checkbox" required />
                <span>{t('signup.agreeTerms')} <a href="#" style={{ color: '#E31837', textDecoration: 'none', fontWeight: 600 }}>{t('signup.terms')}</a></span>
              </label>

              <button type="submit" className="su-btn" disabled={loading}>
                {loading ? <><div className="su-spinner" /> {t('signup.creatingAccount')}</> : <>{t('signup.createAccount')} <ArrowRight size={15} /></>}
              </button>
            </form>

            <div className="su-divider">
              <span className="su-divider-line" /><span className="su-divider-text">{t('signup.orSignUpWith')}</span><span className="su-divider-line" />
            </div>

            <div className="su-socials">
              <button type="button" className="su-social" disabled={loading}
                onClick={() => window.location.assign(`${API_BASE_URL}/auth/github`)}>
                <Github size={17} /> GitHub
              </button>
              <button type="button" className="su-social" disabled={loading}
                onClick={() => window.location.assign(`${API_BASE_URL}/auth/google`)}>
                <svg width="17" height="17" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
            </div>

            <p className="su-login-link">
              {t('signup.alreadyHaveAccount')} <a href="#" onClick={handleNavigateToLogin}>{t('signup.signIn')}</a>
            </p>
          </div>
          <footer className="su-footer">EvalAI &copy; 2026</footer>
        </div>
      </div>
    </>
  );
};

export default Signup;