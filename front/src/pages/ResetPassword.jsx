import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mic, CheckCircle } from 'lucide-react';
import styles from './Login.module.css';
import { useI18n } from '../i18n/I18nProvider';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [token, setToken] = useState('');
  const { t } = useI18n();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    console.log('🔍 Reset password page loaded');
    console.log('🔍 URL search params:', window.location.search);
    console.log('🔍 Token from URL:', tokenParam);
    
    if (!tokenParam) {
      console.error('❌ No token found in URL');
      setError(t('auth.invalidLink'));
    } else {
      console.log('✅ Token found, setting token state');
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordNoMatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (!token) {
      setError(t('auth.invalidToken'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          handleNavigateToLogin();
        }, 3000);
      } else {
        setError(data.message || t('auth.resetFailed'));
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError(t('auth.cannotConnect'));
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToLogin = (e) => {
    if (e) e.preventDefault();
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/');
    }, 300);
  };

  if (!token && !error) {
    return null; // Still loading token
  }

  return (
    <div className={styles.container}>
      {/* Left Branded Panel - Static (same as Login) */}
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
            <h1>{t('auth.createNewLine1')}<br />{t('auth.createNewLine2')}</h1>
            <p className={styles.welcomeSubtext}>
              {t('auth.resetSubIdle')}
            </p>
          </div>

          <div className={styles.illustrationArea}>
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureDot} />
                <span>{t('auth.resetFeature1')}</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureDot} />
                <span>{t('auth.resetFeature2')}</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureDot} />
                <span>{t('auth.resetFeature3')}</span>
              </div>
            </div>
          </div>

          <p className={styles.tagline}>
            {t('auth.resetTagline')}
          </p>
        </div>

        <div className={styles.circle1} />
        <div className={styles.circle2} />
        <div className={styles.circle3} />
      </div>

      {/* Right Form Panel - Animated */}
      <div className={`${styles.rightPanel} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}>
        <div className={styles.formWrapper}>
          <div className={styles.formHeader}>
            <h2 className={styles.title}>{t('auth.resetTitle')}</h2>
            <p className={styles.subtitle}>
              {success 
                ? t('auth.resetSubSuccess') 
                : t('auth.resetSubIdle')}
            </p>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {success ? (
            <div style={{
              background: '#e8f5e9',
              border: '1px solid #4caf50',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <CheckCircle size={48} color="#4caf50" style={{ marginBottom: '1rem' }} />
              <div style={{ color: '#2e7d32', fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {t('auth.resetSubSuccess')}
              </div>
              <div style={{ color: '#2e7d32', fontSize: '0.9rem' }}>
                {t('auth.redirecting')}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="password">{t('auth.newPassword')}</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.newPasswordPlaceholder')}
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

              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.input}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className={styles.loginButton}
                disabled={loading || !token}
              >
                {loading ? t('auth.resetting') : t('auth.resetPassword')}
              </button>
            </form>
          )}

          <p className={styles.signupLink}>
            {t('auth.rememberPassword')} <a href="#" onClick={handleNavigateToLogin}>{t('auth.backToSignIn')}</a>
          </p>
        </div>

        <footer className={styles.footer}>
          EvalAI © 2026
        </footer>
      </div>
    </div>
  );
};

export default ResetPassword;
