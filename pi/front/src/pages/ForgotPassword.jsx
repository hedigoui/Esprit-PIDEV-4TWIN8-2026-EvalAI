import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Mic, ArrowLeft } from 'lucide-react';
import styles from './Login.module.css';
import { API_BASE_URL } from '../config/api';
import { useI18n } from '../i18n/I18nProvider';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { t } = useI18n();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.message || t('auth.forgotFailed'));
      }
    } catch (error) {
      console.error('Forgot password error:', error);
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
            <h1>{t('auth.forgotLeftLine1')}<br />{t('auth.forgotLeftLine2')}</h1>
            <p className={styles.welcomeSubtext}>
              {t('auth.forgotSubIdle')}
            </p>
          </div>

          <div className={styles.illustrationArea}>
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureDot} />
                <span>{t('auth.forgotFeature1')}</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureDot} />
                <span>{t('auth.forgotFeature2')}</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureDot} />
                <span>{t('auth.forgotFeature3')}</span>
              </div>
            </div>
          </div>

          <p className={styles.tagline}>
            {t('auth.forgotTagline')}
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
            <h2 className={styles.title}>{t('auth.forgotTitle')}</h2>
            <p className={styles.subtitle}>
              {success 
                ? t('auth.forgotSubSuccess') 
                : t('auth.forgotSubIdle')}
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
              color: '#2e7d32',
              fontSize: '0.9rem',
              lineHeight: '1.6'
            }}>
              <strong>{t('auth.forgotSuccessTitle')}</strong><br />
              {t('auth.forgotSuccessBody')}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="email">{t('auth.email')}</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    required
                    disabled={loading}
                  />
                  <Mail size={18} className={styles.inputIcon} />
                </div>
              </div>

              <button 
                type="submit" 
                className={styles.loginButton}
                disabled={loading}
              >
                {loading ? t('auth.sending') : t('auth.sendReset')}
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

export default ForgotPassword;
