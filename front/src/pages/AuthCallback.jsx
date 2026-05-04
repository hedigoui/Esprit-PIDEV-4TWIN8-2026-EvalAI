import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Login.module.css';
import { useI18n } from '../i18n/I18nProvider';

function parseUser(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

/**
 * OAuth redirect target: backend sends token + user JSON in query params.
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [message, setMessage] = useState(t('authCallback.completing'));

  useEffect(() => {
    const token = searchParams.get('token');
    const userRaw = searchParams.get('user');
    const err = searchParams.get('error');

    if (err) {
      setMessage(t('authCallback.redirecting'));
      navigate(`/?error=${encodeURIComponent(err)}`, { replace: true });
      return;
    }

    if (!token || !userRaw) {
      navigate('/?error=oauth_missing', { replace: true });
      return;
    }

    const user = parseUser(userRaw);
    if (!user?.id || !user?.role) {
      navigate('/?error=oauth_invalid', { replace: true });
      return;
    }

    if (!user.isActive) {
      navigate('/?error=deactivated', { replace: true });
      return;
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event('evalai:user-updated'));

    const role = user.role;
    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (role === 'instructor') {
      navigate('/teacher/dashboard', { replace: true });
    } else if (role === 'student') {
      navigate('/student/dashboard', { replace: true });
    } else {
      navigate('/?error=oauth_role', { replace: true });
    }
  }, [navigate, searchParams, t]);

  return (
    <div className={styles.container}>
      <div className={styles.rightPanel} style={{ flex: 1, maxWidth: '100%' }}>
        <div className={styles.formWrapper}>
          <p className={styles.subtitle} style={{ textAlign: 'center' }}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
