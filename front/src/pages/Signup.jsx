import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, User, GraduationCap, Mic, Github } from 'lucide-react';
import styles from './Login.module.css';
import { API_BASE_URL } from '../config/api';

const Signup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to Terms & Conditions');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          role: selectedRole,
          isActive: false,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Account created successfully! Please sign in.');
        handleNavigateToLogin();
      } else {
        if (response.status === 400) {
          setError(data.message || 'Email already exists or invalid data');
        } else {
          setError(data.message || 'Failed to create account');
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
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

  const roles = [
    { id: 'student', label: t('admin.students') || 'Student', icon: GraduationCap },
    { id: 'instructor', label: t('admin.instructors') || 'Instructor', icon: User },
  ];

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
            <h1>Join EvalAI<br />Platform</h1>
            <p className={styles.welcomeSubtext}>
              AI-Powered Oral Performance Assessment
            </p>
          </div>

          <div className={styles.illustrationArea}>
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureDot} />
                <span>AI-Powered Transcription & CEFR Analysis</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureDot} />
                <span>Real-time Practice with Instant Feedback</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureDot} />
                <span>Comprehensive Performance Analytics</span>
              </div>
            </div>
          </div>

          <p className={styles.tagline}>
            Efficiently assess and improve oral communication skills.
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
            <h2 className={styles.title}>Create Account</h2>
            <p className={styles.subtitle}>Please enter your details to sign up</p>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.roleSelector}>
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                className={`${styles.roleButton} ${selectedRole === role.id ? styles.activeRole : ''}`}
                onClick={() => setSelectedRole(role.id)}
              >
                <role.icon size={16} />
                <span>{role.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="firstName">First Name</label>
              <div className={styles.inputWrapper}>
                <input
                  id="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={styles.input}
                  required
                />
                <User size={18} className={styles.inputIcon} />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="lastName">Last Name</label>
              <div className={styles.inputWrapper}>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={styles.input}
                  required
                />
                <User size={18} className={styles.inputIcon} />
              </div>
            </div>

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
                />
                <Mail size={18} className={styles.inputIcon} />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="password">Password</label>
              <div className={styles.inputWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="confirmPassword">Confirm Password</label>
              <div className={styles.inputWrapper}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.input}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <label className={styles.rememberMe}>
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className={styles.checkbox}
                required
              />
              <span>I agree to Terms & Conditions</span>
            </label>

            <button 
              type="submit" 
              className={styles.loginButton}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>

            <div className={styles.divider}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerText}>or continue with</span>
              <span className={styles.dividerLine} />
            </div>

            <div className={styles.socialButtons}>
              <button
                type="button"
                className={styles.socialButton}
                disabled={loading}
                onClick={() => {
                  window.location.assign(`${API_BASE_URL}/auth/github`);
                }}
              >
                <Github size={20} />
                <span>GitHub</span>
              </button>
              <button
                type="button"
                className={`${styles.socialButton} ${styles.googleButton}`}
                disabled={loading}
                onClick={() => {
                  window.location.assign(`${API_BASE_URL}/auth/google`);
                }}
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
              Already have an account? <a href="#" onClick={handleNavigateToLogin}>Sign In</a>
            </p>
          </form>
        </div>

        <footer className={styles.footer}>
          EvalAI © 2026
        </footer>
      </div>
    </div>
  );
};

export default Signup;