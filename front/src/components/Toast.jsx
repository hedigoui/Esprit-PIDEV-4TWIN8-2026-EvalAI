import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const getIcon = () => {
    if (type === 'success') return <CheckCircle size={20} color="var(--green)" />;
    if (type === 'error') return <AlertCircle size={20} color="var(--primary)" />;
    return <Info size={20} color="#3b82f6" />;
  };

  const getBg = () => {
    if (type === 'success') return 'rgba(34,197,94,0.1)';
    if (type === 'error') return 'var(--primary-soft)';
    return 'rgba(59,130,246,0.1)';
  };

  const getBorder = () => {
    if (type === 'success') return '1px solid rgba(34,197,94,0.3)';
    if (type === 'error') return '1px solid rgba(227,24,55,0.3)';
    return '1px solid rgba(59,130,246,0.3)';
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2.5rem',
      zIndex: 9999,
      background: 'var(--bg-card)',
      backdropFilter: 'blur(20px)',
      padding: '1rem 1.5rem',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      border: getBorder(),
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      animation: 'slideIn 0.3s ease-out forwards',
      color: 'var(--text-primary)',
      fontWeight: '600',
      fontSize: '0.95rem'
    }}>
      <div style={{ background: getBg(), padding: '0.4rem', borderRadius: '50%', display: 'flex' }}>
        {getIcon()}
      </div>
      {message}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Toast;
