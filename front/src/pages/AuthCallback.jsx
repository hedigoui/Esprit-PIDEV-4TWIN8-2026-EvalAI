import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Authentication failed. Please try again.');
      setLoading(false);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      return;
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Redirect based on user role
        setTimeout(() => {
          if (user.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (user.role === 'instructor') {
            navigate('/teacher/dashboard');
          } else if (user.role === 'student') {
            navigate('/student/dashboard');
          } else {
            navigate('/dashboard');
          }
        }, 100);
      } catch {
        setError('Invalid authentication data');
        setLoading(false);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } else {
      setError('Missing authentication data');
      setLoading(false);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>Authenticating...</div>
        <div style={{ fontSize: '16px', color: '#666' }}>Please wait while we sign you in.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '16px', color: '#e74c3c' }}>Authentication Error</div>
        <div style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>{error}</div>
        <div style={{ fontSize: '14px', color: '#999' }}>Redirecting to login page...</div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;
