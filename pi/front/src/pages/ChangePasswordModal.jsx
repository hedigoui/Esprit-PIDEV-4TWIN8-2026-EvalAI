import { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle, Lock, X } from 'lucide-react';
import styles from './Login.module.css';
import { API_BASE_URL } from '../config/api';
import { useI18n } from '../i18n/I18nProvider';

const ChangePasswordModal = ({ user, token, onClose, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { t } = useI18n();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) { setError(t('auth.passwordNoMatch')); return; }
    if (newPassword.length < 6) { setError(t('auth.passwordTooShort')); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/change-temporary-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id, newPassword }),
      });
      const data = await response.json();
      if (response.ok) { setSuccess(true); setTimeout(() => onSuccess(), 1500); }
      else setError(data.message || t('auth.resetFailed'));
    } catch (error) { console.error('Change password error:', error); setError(t('auth.cannotConnect')); }
    finally { setLoading(false); }
  };

  const strength = newPassword.length === 0 ? 0 : newPassword.length < 6 ? 1 : newPassword.length < 10 ? 2 : newPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) ? 4 : 3;
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#ef4444', '#f59e0b', '#22c55e', '#16a34a'];

  return (
    <>
      <style>{`
        @keyframes modalOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlide { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes success { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .cpw-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.6);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; animation: modalOverlay 0.2s ease;
        }
        .cpw-modal {
          background: #fff; border-radius: 24px;
          padding: 2rem; max-width: 440px; width: 90%;
          box-shadow: 0 24px 64px rgba(0,0,0,0.2);
          animation: modalSlide 0.25s cubic-bezier(0.4,0,0.2,1);
          position: relative;
        }
        .cpw-close {
          position: absolute; top: 1.25rem; right: 1.25rem;
          width: 32px; height: 32px; border-radius: 50%;
          background: #f8fafc; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #64748b; transition: all 0.2s;
        }
        .cpw-close:hover { background: #fee2e2; color: #E31837; }
        .cpw-icon {
          width: 56px; height: 56px; border-radius: 16px;
          background: linear-gradient(135deg, rgba(227,24,55,0.1), rgba(183,28,28,0.05));
          display: flex; align-items: center; justify-content: center;
          color: #E31837; margin-bottom: 1.25rem;
        }
        .cpw-title { font-size: 1.35rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin: 0 0 0.35rem; }
        .cpw-sub { font-size: 0.88rem; color: #64748b; line-height: 1.6; margin: 0 0 1.5rem; }
        .cpw-error {
          display: flex; align-items: flex-start; gap: 10px;
          background: #fef2f4; border: 1px solid #fecdd3; color: #be123c;
          border-radius: 12px; padding: 0.75rem 1rem; margin-bottom: 1rem;
          font-size: 0.85rem; line-height: 1.5;
        }
        .cpw-field { margin-bottom: 1rem; }
        .cpw-label { display: block; font-size: 0.82rem; font-weight: 600; color: #374151; margin-bottom: 0.4rem; }
        .cpw-input-wrap {
          display: flex; align-items: center;
          border: 1.5px solid #e5e7eb; border-radius: 12px;
          overflow: hidden; background: #f9fafb; transition: all 0.2s;
        }
        .cpw-input-wrap:focus-within { border-color: #E31837; background: #fff; box-shadow: 0 0 0 3px rgba(227,24,55,0.08); }
        .cpw-input {
          flex: 1; padding: 0.75rem 0.9rem; border: none; outline: none;
          background: transparent; font-size: 0.9rem; color: #1f2937; font-family: inherit;
        }
        .cpw-eye {
          padding: 0.75rem; background: none; border: none;
          cursor: pointer; color: #94a3b8; display: flex; align-items: center;
          transition: color 0.2s;
        }
        .cpw-eye:hover { color: #E31837; }
        .cpw-strength-bar {
          display: flex; gap: 3px; margin-top: 0.4rem;
        }
        .cpw-strength-seg {
          height: 3px; flex: 1; border-radius: 99px; transition: background 0.3s;
        }
        .cpw-strength-label { font-size: 0.72rem; font-weight: 600; margin-top: 0.25rem; }
        .cpw-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
        .cpw-submit {
          flex: 1; padding: 0.82rem;
          background: linear-gradient(135deg, #E31837, #B71C1C);
          color: #fff; border: none; border-radius: 12px;
          font-weight: 700; font-size: 0.9rem; cursor: pointer;
          transition: all 0.2s; box-shadow: 0 4px 14px rgba(227,24,55,0.35);
        }
        .cpw-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(227,24,55,0.45); }
        .cpw-submit:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }
        .cpw-skip {
          flex: 1; padding: 0.82rem;
          background: #f8fafc; border: 1.5px solid #e5e7eb;
          border-radius: 12px; color: #374151;
          font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
        }
        .cpw-skip:hover { background: #f1f5f9; }
        .cpw-skip:disabled { opacity: 0.6; cursor: not-allowed; }
        .cpw-success-wrap {
          text-align: center; padding: 1.5rem 0; animation: success 0.3s ease;
        }
        .cpw-success-icon {
          width: 72px; height: 72px; border-radius: 50%;
          background: #f0fdf4; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem;
        }
        .cpw-success-title { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-bottom: 0.35rem; }
        .cpw-success-sub { font-size: 0.85rem; color: #64748b; }
      `}</style>

      <div className="cpw-overlay">
        <div className="cpw-modal">
          <button type="button" className="cpw-close" onClick={onClose} disabled={loading}>
            <X size={16} />
          </button>

          {success ? (
            <div className="cpw-success-wrap">
              <div className="cpw-success-icon">
                <CheckCircle size={36} color="#16a34a" />
              </div>
              <div className="cpw-success-title">{t('auth.tempSuccessTitle')}</div>
              <div className="cpw-success-sub">{t('auth.tempSuccessSub')}</div>
            </div>
          ) : (
            <>
              <div className="cpw-icon"><Lock size={26} /></div>
              <h2 className="cpw-title">{t('auth.tempTitle')}</h2>
              <p className="cpw-sub">{t('auth.tempSub')}</p>

              {error && (
                <div className="cpw-error">
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="cpw-field">
                  <label className="cpw-label">{t('auth.newPassword')}</label>
                  <div className="cpw-input-wrap">
                    <input type={showPassword ? 'text' : 'password'} placeholder={t('auth.newPasswordPlaceholder')}
                      value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      disabled={loading} minLength={6} required className="cpw-input" />
                    <button type="button" className="cpw-eye" onClick={() => setShowPassword(!showPassword)} disabled={loading}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <>
                      <div className="cpw-strength-bar">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="cpw-strength-seg"
                            style={{ background: i <= strength ? strengthColors[strength] : '#e5e7eb' }} />
                        ))}
                      </div>
                      <div className="cpw-strength-label" style={{ color: strengthColors[strength] }}>
                        {strengthLabels[strength]}
                      </div>
                    </>
                  )}
                </div>

                <div className="cpw-field">
                  <label className="cpw-label">{t('auth.confirmPassword')}</label>
                  <div className="cpw-input-wrap">
                    <input type={showConfirmPassword ? 'text' : 'password'} placeholder={t('auth.confirmPasswordPlaceholder')}
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      disabled={loading} minLength={6} required className="cpw-input" />
                    <button type="button" className="cpw-eye" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={loading}>
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={12} /> Passwords don't match
                    </div>
                  )}
                  {confirmPassword.length > 0 && newPassword === confirmPassword && newPassword.length >= 6 && (
                    <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={12} /> Passwords match
                    </div>
                  )}
                </div>

                <div className="cpw-actions">
                  <button type="submit" className="cpw-submit" disabled={loading}>
                    {loading ? t('auth.tempChanging') : t('auth.tempChange')}
                  </button>
                  <button type="button" className="cpw-skip" onClick={onClose} disabled={loading}>
                    Skip for Now
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ChangePasswordModal;