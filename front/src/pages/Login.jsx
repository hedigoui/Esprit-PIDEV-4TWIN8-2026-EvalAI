import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, User, GraduationCap, Mic, Github } from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';
import styles from './Login.module.css';
import { API_BASE_URL } from '../config/api';

const OAUTH_ERROR_KEYS = {
  oauth_not_configured: 'oauthNotConfigured',
  oauth_failed: 'oauthFailed',
  oauth_missing: 'oauthMissing',
  oauth_invalid: 'oauthInvalid',
  oauth_role: 'oauthRole',
  oauth_email: 'oauthEmail',
  deactivated: 'deactivatedOAuth',
};

const Login = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
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

  useEffect(() => {
    const err = searchParams.get('error');
    if (!err) return;
    const key = OAUTH_ERROR_KEYS[err] ? `login.${OAUTH_ERROR_KEYS[err]}` : 'login.oauthFailed';
    let msg = t(key);
    if (err === 'oauth_not_configured') {
      const p = searchParams.get('provider');
      if (p === 'google') msg += t('login.oauthNotConfiguredGoogle');
      else if (p === 'github') msg += t('login.oauthNotConfiguredGithub');
    }
    setError(msg);
    navigate('/', { replace: true });
  }, [searchParams, navigate, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
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
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }

        const userRole = data.user?.role;
        const isTemporaryPassword = data.user?.isTemporaryPassword;
        
        if (!userRole) {
          setError(t('login.noRoleInUserData'));
          setLoading(false);
          return;
        }

        // If user has temporary password, show modal
        if (isTemporaryPassword) {
          setLoggedInUser(data.user);
          setLoggedInToken(data.access_token);
          setShowPasswordModal(true);
          setLoading(false);
          return;
        }

        // Otherwise proceed to dashboard
        setIsTransitioning(true);
        setTimeout(() => {
          if (userRole === 'admin') {
            navigate('/admin/dashboard');
          } else if (userRole === 'instructor') {
            navigate('/teacher/dashboard');
          } else if (userRole === 'student') {
            navigate('/student/dashboard');
          } else {
            setError(t('login.unknownUserRole', { role: userRole }));
          }
        }, 100);
        
      } else {
        if (response.status === 401) {
          if (data.message && data.message.includes('deactivated')) {
            setError(t('login.accountDeactivated'));
          } else {
            setError(data.message || t('login.invalidEmailOrPassword'));
          }
        } else if (response.status === 400) {
          setError(data.message || t('login.badRequest'));
        } else {
          setError(data.message || t('login.loginFailedGeneric'));
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(t('login.cannotConnectServer'));
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToSignup = (e) => {
    e.preventDefault();
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/signup');
    }, 300); // Match this with CSS transition duration
  };

  const navigateToDashboard = (userRole) => {
    if (userRole === 'admin') {
      navigate('/admin/dashboard');
    } else if (userRole === 'instructor') {
      navigate('/teacher/dashboard');
    } else if (userRole === 'student') {
      navigate('/student/dashboard');
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Branded Panel - Static */}
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <div className={styles.brandLogo}>
            <div className={styles.logoCircle}>
              <Mic size={28} color="#fff" />
            </div>
            <span className={styles.logoText}>
              <span className={styles.letterWhite}>E</span>
              <span className={styles.letterLight}>v</span>
              <span className={styles.letterWhite}>a</span>
              <span className={styles.letterLight}>l</span>
              <span className={styles.letterWhite}>A</span>
              <span className={styles.letterLight}>I</span>
            </span>
          </div>

          <div className={styles.welcomeText}>
            <h1>{t('login.welcomeTitle')}<br />{t('common.dashboard')}</h1>
            <p className={styles.welcomeSubtext}>
              {t('login.welcomeSubtitle')}
            </p>
          </div>

          <div className={styles.illustrationArea}>
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureDot} />
                <span>{t('login.feature1')}</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureDot} />
                <span>{t('login.feature2')}</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureDot} />
                <span>{t('login.feature3')}</span>
              </div>
            </div>
          </div>

          <p className={styles.tagline}>
            {t('login.tagline')}
          </p>
        </div>

        {/* Decorative circles */}
        <div className={styles.circle1} />
        <div className={styles.circle2} />
        <div className={styles.circle3} />
      </div>

      {/* Right Form Panel - Animated */}
      <div className={`${styles.rightPanel} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}>
        <div className={styles.formWrapper}>
          <div className={styles.formHeader}>
            <h2 className={styles.title}>{t('login.title')}</h2>
            <p className={styles.subtitle}>{t('login.subtitle')}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="email">{t('common.email')}</label>
              <div className={styles.inputWrapper}>
                <input
                  id="email"
                  type="email"
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  required
                  disabled={loading}
                />
                <Mail size={18} className={styles.inputIcon} />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="password">{t('common.password')}</label>
              <div className={styles.inputWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  required
                  disabled={loading}
                  minLength={6}
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.optionsRow}>
              <label className={styles.rememberMe}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={styles.checkbox}
                  disabled={loading}
                />
                <span>{t('login.rememberMe')}</span>
              </label>
              <a 
                href="#" 
                className={styles.forgotLink} 
                onClick={(e) => {
                  e.preventDefault();
                  setIsTransitioning(true);
                  setTimeout(() => {
                    navigate('/forgot-password');
                  }, 300);
                }}
              >
                {t('login.forgotPassword')}
              </a>
            </div>

            <button 
              type="submit" 
              className={styles.loginButton}
              disabled={loading}
            >
              {loading ? t('common.loading') : t('login.loginButton')}
            </button>

            <div className={styles.divider}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerText}>{t('login.orContinueWith')}</span>
              <span className={styles.dividerLine} />
            </div>

            <div className={styles.socialButtons}>
              <button 
                type="button" 
                className={styles.socialButton}
                onClick={() => {
                  window.location.assign(`${API_BASE_URL}/auth/github`);
                }}
                disabled={loading}
              >
                <Github size={20} />
                <span>GitHub</span>
              </button>
              <button 
                type="button" 
                className={`${styles.socialButton} ${styles.googleButton}`}
                onClick={() => {
                  window.location.assign(`${API_BASE_URL}/auth/google`);
                }}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Google</span>
              </button>
            </div>

            <p className={styles.signupLink}>
              {t('login.noAccount')} <a href="#" onClick={handleNavigateToSignup}>{t('login.createAccount')}</a>
            </p>
          </form>
        </div>

        <footer className={styles.footer}>
          {t('login.footerCopyright')}
        </footer>
      </div>

      {showPasswordModal && loggedInUser && loggedInToken && (
        <ChangePasswordModal
          user={loggedInUser}
          token={loggedInToken}
          onClose={() => {
            setShowPasswordModal(false);
            navigateToDashboard(loggedInUser.role);
          }}
          onSuccess={() => {
            setShowPasswordModal(false);
            setTimeout(() => {
              navigateToDashboard(loggedInUser.role);
            }, 500);
          }}
        />
      )}
    </div>
  );
};

export default Login;