import { useState, useEffect } from 'react';
import StudentSidebar from '../../components/StudentSidebar';
import { Bell, Lock, Globe, Eye, EyeOff } from 'lucide-react';
import styles from '../../styles/shared.module.css';
import settingsStyles from './Settings.module.css';
import { getStoredTheme, setStoredTheme, getStoredIntensity, setStoredIntensity } from '../../theme';

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
  const [darkIntensity, setDarkIntensity] = useState(() => getStoredIntensity());

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
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (!user?.id) {
      setError('User information not found. Please log in again.');
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
        setSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      setError('Cannot connect to server. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Settings</h1>
              <p className={styles.pageSubtitle}>Manage your account preferences</p>
            </div>
          </div>
<div className={settingsStyles.settingsGrid}>

            {/* Notifications */}
            <div className={styles.card}>
              <div className={settingsStyles.sectionHeader}>
                <Bell size={20} />
                <h3>Notifications</h3>
              </div>
              
              <div className={settingsStyles.toggleItem}>
                <div>
                  <h4>Email Notifications</h4>
                  <p>Receive updates about your evaluations</p>
                </div>
                <label className={settingsStyles.toggle}>
                  <input type="checkbox" defaultChecked />
                  <span className={settingsStyles.slider}></span>
                </label>
              </div>
              
              <div className={settingsStyles.toggleItem}>
                <div>
                  <h4>Practice Reminders</h4>
                  <p>Get reminded to practice regularly</p>
                </div>
                <label className={settingsStyles.toggle}>
                  <input type="checkbox" defaultChecked />
                  <span className={settingsStyles.slider}></span>
                </label>
              </div>
              
              <div className={settingsStyles.toggleItem}>
                <div>
                  <h4>New Recommendations</h4>
                  <p>Notify when AI generates new tips</p>
                </div>
                <label className={settingsStyles.toggle}>
                  <input type="checkbox" />
                  <span className={settingsStyles.slider}></span>
                </label>
              </div>
            </div>

            {/* Security */}
            <div className={styles.card}>
              <div className={settingsStyles.sectionHeader}>
                <Lock size={20} />
                <h3>Security</h3>
              </div>

              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  color: '#dc2626',
                  fontSize: '0.875rem'
                }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  color: '#16a34a',
                  fontSize: '0.875rem'
                }}>
                  {success}
                </div>
              )}
              
              <form onSubmit={handleChangePassword}>
                <div className={settingsStyles.formGroup}>
                  <label>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      className={settingsStyles.input}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b'
                      }}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className={settingsStyles.formGroup}>
                  <label>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      className={settingsStyles.input}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b'
                      }}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className={settingsStyles.formGroup}>
                  <label>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      className={settingsStyles.input}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b'
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.secondaryButton}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Preferences */}
            <div className={styles.card}>
              <div className={settingsStyles.sectionHeader}>
                <Globe size={20} />
                <h3>Preferences</h3>
              </div>
              
              <div className={settingsStyles.formGroup}>
                <label>Interface Language</label>
                <select className={settingsStyles.select}>
                  <option selected>English</option>
                  <option>Français</option>
                  <option>العربية</option>
                </select>
              </div>
              
              <div className={settingsStyles.formGroup}>
                <label>Target Language</label>
                <select className={settingsStyles.select}>
                  <option selected>English</option>
                  <option>French</option>
                  <option>Spanish</option>
                  <option>German</option>
                </select>
              </div>

              <div className={settingsStyles.toggleItem}>
                <div>
                  <h4>Dark mode</h4>
                  <p>Use dark theme across the app</p>
                </div>
                <label className={settingsStyles.toggle}>
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => {
                      const on = e.target.checked;
                      setDarkMode(on);
                      setStoredTheme(on ? 'dark' : 'light');
                    }}
                  />
                  <span className={settingsStyles.slider}></span>
                </label>
              </div>

              {darkMode && (
                <div className={settingsStyles.formGroup} style={{ marginTop: '1rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Darkness Degree</span>
                    <span style={{ color: 'var(--text-muted)' }}>{darkIntensity}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={darkIntensity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setDarkIntensity(val);
                      setStoredIntensity(val);
                    }}
                    style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
