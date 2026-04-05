import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Mic, ArrowLeft } from 'lucide-react';
import styles from './Login.module.css';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/users/forgot-password', {
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
        setError(data.message || 'Failed to send reset email. Please try again.');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Cannot connect to server. Please check if backend is running on port 3000');
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
            <h1>Reset Your<br />Password</h1>
            <p className={styles.welcomeSubtext}>
              Enter your email to receive a new temporary password
            </p>
          </div>

          <div className={styles.illustrationArea}>
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureDot} />
                <span>New password sent to your email</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureDot} />
                <span>Sign in with the new password</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureDot} />
                <span>Change it in Settings for security</span>
              </div>
            </div>
          </div>

          <p className={styles.tagline}>
            We'll send you a new temporary password via email.
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
            <h2 className={styles.title}>Forgot Password?</h2>
            <p className={styles.subtitle}>
              {success 
                ? 'Check your email for your new password' 
                : 'Enter your email address and we\'ll send you a new temporary password'}
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
              <strong>✓ New password sent!</strong><br />
              If an account with that email exists, we've sent you a new temporary password. 
              Please check your inbox, sign in with the new password, and then change it in your Settings for security.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="email">Email</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
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
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className={styles.signupLink}>
            Remember your password? <a href="#" onClick={handleNavigateToLogin}>Back to Sign In</a>
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
