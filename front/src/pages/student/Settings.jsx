import { useState, useEffect } from 'react';
import StudentSidebar from '../../components/StudentSidebar';
import TopNavbar from '../../components/TopNavbar';
import { Bell, Lock, Globe, Eye, EyeOff } from 'lucide-react';
import { getStoredTheme, setStoredTheme } from '../../theme';
import { useI18n } from '../../i18n/I18nProvider';

const settingsPageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

  .stp-root * { font-family: 'Manrope', sans-serif; box-sizing: border-box; }

  .stp-root {
    display: flex;
    min-height: 100vh;
    background: var(--bg-main);
  }

  .stp-main { flex: 1; overflow-y: auto; min-width: 0; }

  .stp-content {
    max-width: 900px;
    padding: 2rem 2.5rem;
    margin: 0 auto;
  }

  .stp-page-header { margin-bottom: 2rem; }

  .stp-page-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #E31837;
    background: rgba(227,24,55,0.08);
    padding: 0.3rem 0.75rem;
    border-radius: 20px;
    margin-bottom: 0.6rem;
    border: 1px solid rgba(227,24,55,0.15);
  }

  .stp-page-title {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.03em;
    margin: 0 0 0.35rem;
  }

  .stp-page-sub {
    font-size: 0.875rem;
    color: #94a3b8;
    margin: 0;
  }

  .stp-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
  }

  @media (max-width: 700px) { .stp-grid { grid-template-columns: 1fr; } }

  .stp-card {
    background: var(--bg-card);
    border-radius: 20px;
    border: 1px solid var(--border-light);
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    transition: box-shadow 0.2s;
  }

  .stp-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }

  .stp-card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-light);
  }

  .stp-card-icon {
    width: 38px; height: 38px; border-radius: 12px;
    background: rgba(227,24,55,0.08);
    display: flex; align-items: center; justify-content: center;
    color: #E31837;
  }

  .stp-card-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  .stp-toggle-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border-light);
  }

  .stp-toggle-item:last-child { border-bottom: none; }

  .stp-toggle-label h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.2rem;
  }

  .stp-toggle-label p {
    font-size: 0.75rem;
    color: #94a3b8;
    margin: 0;
  }

  .stp-toggle {
    position: relative;
    display: inline-block;
    width: 44px; height: 24px;
    flex-shrink: 0;
  }

  .stp-toggle input { opacity: 0; width: 0; height: 0; }

  .stp-toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background: var(--border-light);
    transition: 0.25s cubic-bezier(0.4,0,0.2,1);
    border-radius: 24px;
  }

  .stp-toggle-slider:before {
    position: absolute;
    content: '';
    height: 18px; width: 18px;
    left: 3px; bottom: 3px;
    background: var(--bg-card-solid);
    transition: 0.25s cubic-bezier(0.4,0,0.2,1);
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  }

  .stp-toggle input:checked + .stp-toggle-slider { background: #E31837; }
  .stp-toggle input:checked + .stp-toggle-slider:before { transform: translateX(20px); }

  .stp-form-group { margin-bottom: 1rem; }

  .stp-form-label {
    display: block;
    font-size: 0.78rem;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 0.4rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stp-input {
    width: 100%;
    padding: 0.75rem 2.5rem 0.75rem 0.85rem;
    border: 1.5px solid var(--border-light);
    border-radius: 12px;
    font-size: 0.875rem;
    font-family: 'Manrope', sans-serif;
    color: var(--text-primary);
    background: var(--bg-card-solid);
    outline: none;
    transition: all 0.2s;
  }

  .stp-input:focus {
    border-color: #E31837;
    background: var(--bg-card-solid);
    box-shadow: 0 0 0 3px rgba(227,24,55,0.08);
  }

  .stp-input:disabled { opacity: 0.6; cursor: not-allowed; }

  .stp-input-wrap { position: relative; }

  .stp-eye-btn {
    position: absolute;
    right: 0.85rem; top: 50%;
    transform: translateY(-50%);
    background: none; border: none;
    cursor: pointer; color: #94a3b8;
    padding: 0; display: flex; align-items: center;
    transition: color 0.2s;
  }

  .stp-eye-btn:hover { color: var(--text-primary); }

  .stp-select {
    width: 100%;
    padding: 0.75rem 0.85rem;
    border: 1.5px solid var(--border-light);
    border-radius: 12px;
    font-size: 0.875rem;
    font-family: 'Manrope', sans-serif;
    color: var(--text-primary);
    background: var(--bg-card-solid);
    outline: none;
    transition: all 0.2s;
    cursor: pointer;
  }

  .stp-select:focus {
    border-color: #E31837;
    box-shadow: 0 0 0 3px rgba(227,24,55,0.08);
  }

  .stp-submit-btn {
    width: 100%;
    padding: 0.8rem;
    background: linear-gradient(135deg, #E31837, #B71C1C);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 700;
    font-family: 'Manrope', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(227,24,55,0.25);
    letter-spacing: 0.02em;
    margin-top: 0.25rem;
  }

  .stp-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .stp-alert {
    display: flex; align-items: flex-start; gap: 0.6rem;
    padding: 0.85rem; border-radius: 12px;
    font-size: 0.85rem; font-weight: 500; margin-bottom: 1rem;
  }

  .stp-alert-error {
    background: rgba(220,38,38,0.06);
    border: 1px solid rgba(220,38,38,0.2);
    color: #dc2626;
  }

  .stp-alert-success {
    background: rgba(22,163,74,0.06);
    border: 1px solid rgba(22,163,74,0.2);
    color: #16a34a;
  }
`;

const Settings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => getStoredTheme() === 'dark');
  const { t, language, setLanguage } = useI18n();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t('studentSettings.allFieldsRequired'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('studentSettings.passwordsNoMatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('studentSettings.passwordTooShort'));
      return;
    }

    if (!user?.id) {
      setError(t('studentSettings.userInfoMissing'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(t('studentSettings.passwordChanged'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.message || t('studentSettings.changePasswordFailed'));
      }
    } catch (error) {
      console.error('Change password error:', error);
      setError(t('studentSettings.cannotConnect'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <style>{settingsPageStyles}</style>
      <div className="stp-root">
        <StudentSidebar />
        <div className="stp-main">
          <TopNavbar />
          <div className="stp-content">
            <div className="stp-page-header">
              <div className="stp-page-kicker">⚙️ {t('studentSettings.kicker')}</div>
              <h1 className="stp-page-title">{t('studentSettings.title')}</h1>
              <p className="stp-page-sub">{t('studentSettings.sub')}</p>
            </div>

            <div className="stp-grid">
              <div className="stp-card">
                <div className="stp-card-header">
                  <div className="stp-card-icon"><Bell size={18} /></div>
                  <h3 className="stp-card-title">{t('studentSettings.notifications')}</h3>
                </div>
                <div className="stp-toggle-item">
                  <div className="stp-toggle-label">
                    <h4>{t('studentSettings.emailNotifications')}</h4>
                    <p>{t('studentSettings.receiveUpdates')}</p>
                  </div>
                  <label className="stp-toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="stp-toggle-slider"></span>
                  </label>
                </div>
                <div className="stp-toggle-item">
                  <div className="stp-toggle-label">
                    <h4>{t('studentSettings.practiceReminders')}</h4>
                    <p>{t('studentSettings.practiceRemindersSub')}</p>
                  </div>
                  <label className="stp-toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="stp-toggle-slider"></span>
                  </label>
                </div>
                <div className="stp-toggle-item">
                  <div className="stp-toggle-label">
                    <h4>New Recommendations</h4>
                    <p>Notify when AI generates new tips</p>
                  </div>
                  <label className="stp-toggle">
                    <input type="checkbox" />
                    <span className="stp-toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="stp-card">
                <div className="stp-card-header">
                  <div className="stp-card-icon"><Lock size={18} /></div>
                  <h3 className="stp-card-title">{t('studentSettings.security')}</h3>
                </div>

                {error && (
                  <div className="stp-alert stp-alert-error">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="stp-alert stp-alert-success">
                    {success}
                  </div>
                )}

                <form onSubmit={handleChangePassword}>
                  <div className="stp-form-group">
                    <label className="stp-form-label">{t('studentSettings.currentPassword')}</label>
                    <div className="stp-input-wrap">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder={t('studentSettings.enterCurrentPassword')}
                        className="stp-input"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={loading}
                      />
                      <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="stp-eye-btn">
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="stp-form-group">
                    <label className="stp-form-label">{t('studentSettings.newPassword')}</label>
                    <div className="stp-input-wrap">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder={t('studentSettings.enterNewPassword')}
                        className="stp-input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={loading}
                        minLength={6}
                      />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="stp-eye-btn">
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="stp-form-group">
                    <label className="stp-form-label">{t('studentSettings.confirmPassword')}</label>
                    <div className="stp-input-wrap">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder={t('studentSettings.confirmPassword')}
                        className="stp-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        minLength={6}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="stp-eye-btn">
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="stp-submit-btn" disabled={loading}>
                    {loading ? t('studentSettings.updating') : t('studentSettings.updatePassword')}
                  </button>
                </form>
              </div>

              <div className="stp-card">
                <div className="stp-card-header">
                  <div className="stp-card-icon"><Globe size={18} /></div>
                  <h3 className="stp-card-title">{t('studentSettings.preferences')}</h3>
                </div>
                <div className="stp-form-group">
                  <label className="stp-form-label">{t('studentSettings.interfaceLanguage')}</label>
                  <select className="stp-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="en">{t('common.english')}</option>
                    <option value="fr">{t('common.french')}</option>
                  </select>
                </div>
                <div className="stp-form-group">
                  <label className="stp-form-label">{t('studentSettings.targetLanguage')}</label>
                  <select className="stp-select">
                    <option>English</option>
                    <option>French</option>
                    <option>Spanish</option>
                    <option>German</option>
                  </select>
                </div>
                <div className="stp-toggle-item">
                  <div className="stp-toggle-label">
                    <h4>{t('studentSettings.darkMode')}</h4>
                    <p>{t('studentSettings.darkModeApp')}</p>
                  </div>
                  <label className="stp-toggle">
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setDarkMode(on);
                        setStoredTheme(on ? 'dark' : 'light');
                      }}
                    />
                    <span className="stp-toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
