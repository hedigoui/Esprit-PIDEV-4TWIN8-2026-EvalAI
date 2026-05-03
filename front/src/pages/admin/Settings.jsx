import { useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Shield, Database, Bell, Globe, Lock, Server } from 'lucide-react';
import styles from '../../styles/shared.module.css';
import settingsStyles from '../student/Settings.module.css';
import { getStoredTheme, setStoredTheme, getStoredIntensity, setStoredIntensity } from '../../theme';

const Settings = () => {
  const [darkMode, setDarkMode] = useState(() => getStoredTheme() === 'dark');
  const [darkIntensity, setDarkIntensity] = useState(() => getStoredIntensity());

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>System Settings</h1>
              <p className={styles.pageSubtitle}>Configure platform settings and preferences</p>
            </div>
          </div>

          <div className={settingsStyles.settingsGrid}>
            {/* General Settings */}
            <div className={styles.card}>
              <div className={settingsStyles.sectionHeader}>
                <Globe size={20} />
                <h3>General Settings</h3>
              </div>
              
              <div className={settingsStyles.formGroup}>
                <label>Platform Name</label>
                <input type="text" defaultValue="Oral AI Performance" className={settingsStyles.input} />
              </div>
              
              <div className={settingsStyles.formGroup}>
                <label>Default Language</label>
                <select className={settingsStyles.select}>
                  <option selected>English</option>
                  <option>French</option>
                  <option>Arabic</option>
                  <option>Spanish</option>
                </select>
              </div>
              
              <div className={settingsStyles.formGroup}>
                <label>Timezone</label>
                <select className={settingsStyles.select}>
                  <option>UTC+0 (London)</option>
                  <option selected>UTC+1 (Paris, Tunis)</option>
                  <option>UTC+2 (Cairo)</option>
                  <option>UTC-5 (New York)</option>
                </select>
              </div>

              <div className={settingsStyles.toggleItem}>
                <div>
                  <h4>Dark mode</h4>
                  <p>Use dark theme in this browser</p>
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

              <button className={styles.primaryButton}>Save Changes</button>
            </div>

            {/* AI Configuration */}
            <div className={styles.card}>
              <div className={settingsStyles.sectionHeader}>
                <Server size={20} />
                <h3>AI Configuration</h3>
              </div>
              
              <div className={settingsStyles.toggleItem}>
                <div>
                  <h4>Enable AI Analysis</h4>
                  <p>Automatically analyze student recordings</p>
                </div>
                <label className={settingsStyles.toggle}>
                  <input type="checkbox" defaultChecked />
                  <span className={settingsStyles.slider}></span>
                </label>
              </div>
              
              <div className={settingsStyles.toggleItem}>
                <div>
                  <h4>Auto Speech-to-Text</h4>
                  <p>Generate transcriptions automatically</p>
                </div>
                <label className={settingsStyles.toggle}>
                  <input type="checkbox" defaultChecked />
                  <span className={settingsStyles.slider}></span>
                </label>
              </div>
              
              <div className={settingsStyles.formGroup}>
                <label>AI Weight in Final Score</label>
                <select className={settingsStyles.select}>
                  <option>30%</option>
                  <option>40%</option>
                  <option selected>50%</option>
                  <option>60%</option>
                </select>
              </div>
            </div>

            {/* Security */}
            <div className={styles.card}>
              <div className={settingsStyles.sectionHeader}>
                <Shield size={20} />
                <h3>Security</h3>
              </div>
              
              <div className={settingsStyles.toggleItem}>
                <div>
                  <h4>Two-Factor Authentication</h4>
                  <p>Require 2FA for all users</p>
                </div>
                <label className={settingsStyles.toggle}>
                  <input type="checkbox" />
                  <span className={settingsStyles.slider}></span>
                </label>
              </div>
              
              <div className={settingsStyles.toggleItem}>
                <div>
                  <h4>Session Timeout</h4>
                  <p>Auto logout after inactivity</p>
                </div>
                <label className={settingsStyles.toggle}>
                  <input type="checkbox" defaultChecked />
                  <span className={settingsStyles.slider}></span>
                </label>
              </div>
              
              <div className={settingsStyles.formGroup}>
                <label>Password Policy</label>
                <select className={settingsStyles.select}>
                  <option>Basic (6+ characters)</option>
                  <option selected>Standard (8+ with numbers)</option>
                  <option>Strong (12+ with symbols)</option>
                </select>
              </div>
            </div>

            {/* Notifications */}
            <div className={styles.card}>
              <div className={settingsStyles.sectionHeader}>
                <Bell size={20} />
                <h3>System Notifications</h3>
              </div>
              
              <div className={settingsStyles.toggleItem}>
                <div>
                  <h4>Email Notifications</h4>
                  <p>Send system emails to users</p>
                </div>
                <label className={settingsStyles.toggle}>
                  <input type="checkbox" defaultChecked />
                  <span className={settingsStyles.slider}></span>
                </label>
              </div>
              
              <div className={settingsStyles.toggleItem}>
                <div>
                  <h4>Admin Alerts</h4>
                  <p>Alert admins on system events</p>
                </div>
                <label className={settingsStyles.toggle}>
                  <input type="checkbox" defaultChecked />
                  <span className={settingsStyles.slider}></span>
                </label>
              </div>
              
              <div className={settingsStyles.toggleItem}>
                <div>
                  <h4>Weekly Reports</h4>
                  <p>Send weekly analytics summary</p>
                </div>
                <label className={settingsStyles.toggle}>
                  <input type="checkbox" />
                  <span className={settingsStyles.slider}></span>
                </label>
              </div>
            </div>

            {/* Data Management */}
            <div className={styles.card} style={{ gridColumn: 'span 2' }}>
              <div className={settingsStyles.sectionHeader}>
                <Database size={20} />
                <h3>Data Management</h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div style={{ 
                  padding: '1.5rem', 
                  background: 'rgba(0,0,0,0.015)', 
                  borderRadius: '14px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#1a1a2e', fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>2.4 GB</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Storage Used</div>
                </div>
                <div style={{ 
                  padding: '1.5rem', 
                  background: 'rgba(0,0,0,0.015)', 
                  borderRadius: '14px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#1a1a2e', fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>1,250</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Recordings Stored</div>
                </div>
                <div style={{ 
                  padding: '1.5rem', 
                  background: 'rgba(0,0,0,0.015)', 
                  borderRadius: '14px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#1a1a2e', fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Jan 28</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Last Backup</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button className={styles.secondaryButton}>Export All Data</button>
                <button className={styles.secondaryButton}>Backup Now</button>
                <button style={{ 
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}>
                  Clear Old Data
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
