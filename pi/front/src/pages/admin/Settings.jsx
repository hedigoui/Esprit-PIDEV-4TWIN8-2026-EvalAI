import { useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import TopNavbar from '../../components/TopNavbar';
import { Shield, Database, Bell, Globe, Lock, Server } from 'lucide-react';
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
    max-width: 1100px;
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

  @media (max-width: 900px) { .stp-grid { grid-template-columns: 1fr; } }

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
    padding: 0.75rem 0.85rem;
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
`;

const Settings = () => {
  const [darkMode, setDarkMode] = useState(() => getStoredTheme() === 'dark');
  const { t, language, setLanguage } = useI18n();

  return (
    <>
      <style>{settingsPageStyles}</style>
      <div className="stp-root">
        <AdminSidebar />
        <div className="stp-main">
          <TopNavbar />
          <div className="stp-content">
            <div className="stp-page-header">
              <div className="stp-page-kicker">⚙️ {t('settings.kickerConfig')}</div>
              <h1 className="stp-page-title">{t('settings.systemTitle')}</h1>
              <p className="stp-page-sub">{t('settings.systemSub')}</p>
            </div>

            <div className="stp-grid">
              <div className="stp-card">
                <div className="stp-card-header">
                  <div className="stp-card-icon"><Globe size={18} /></div>
                  <h3 className="stp-card-title">{t('settings.generalSettings')}</h3>
                </div>
                <div className="stp-form-group">
                  <label className="stp-form-label">{t('settings.platformName')}</label>
                  <input type="text" defaultValue="Oral AI Performance" className="stp-input" />
                </div>
                <div className="stp-form-group">
                  <label className="stp-form-label">{t('settings.defaultLanguage')}</label>
                  <select className="stp-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="en">{t('common.english')}</option>
                    <option value="fr">{t('common.french')}</option>
                  </select>
                </div>
                <div className="stp-form-group">
                  <label className="stp-form-label">{t('settings.timezone')}</label>
                  <select className="stp-select">
                    <option>UTC+0 (London)</option>
                    <option>UTC+1 (Paris, Tunis)</option>
                    <option>UTC+2 (Cairo)</option>
                    <option>UTC-5 (New York)</option>
                  </select>
                </div>
                <div className="stp-toggle-item">
                  <div className="stp-toggle-label">
                    <h4>{t('settings.darkMode')}</h4>
                    <p>{t('settings.darkModeBrowser')}</p>
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
                <button className="stp-submit-btn">{t('settings.saveChanges')}</button>
              </div>

              <div className="stp-card">
                <div className="stp-card-header">
                  <div className="stp-card-icon"><Server size={18} /></div>
                  <h3 className="stp-card-title">AI Configuration</h3>
                </div>
                <div className="stp-toggle-item">
                  <div className="stp-toggle-label">
                    <h4>Enable AI Analysis</h4>
                    <p>Automatically analyze student recordings</p>
                  </div>
                  <label className="stp-toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="stp-toggle-slider"></span>
                  </label>
                </div>
                <div className="stp-toggle-item">
                  <div className="stp-toggle-label">
                    <h4>Auto Speech-to-Text</h4>
                    <p>Generate transcriptions automatically</p>
                  </div>
                  <label className="stp-toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="stp-toggle-slider"></span>
                  </label>
                </div>
                <div className="stp-form-group">
                  <label className="stp-form-label">AI Weight in Final Score</label>
                  <select className="stp-select">
                    <option>30%</option>
                    <option>40%</option>
                    <option>50%</option>
                    <option>60%</option>
                  </select>
                </div>
              </div>

              <div className="stp-card">
                <div className="stp-card-header">
                  <div className="stp-card-icon"><Shield size={18} /></div>
                  <h3 className="stp-card-title">{t('settings.security')}</h3>
                </div>
                <div className="stp-toggle-item">
                  <div className="stp-toggle-label">
                    <h4>{t('settings.twoFactor')}</h4>
                    <p>{t('settings.require2fa')}</p>
                  </div>
                  <label className="stp-toggle">
                    <input type="checkbox" />
                    <span className="stp-toggle-slider"></span>
                  </label>
                </div>
                <div className="stp-toggle-item">
                  <div className="stp-toggle-label">
                    <h4>{t('settings.sessionTimeout')}</h4>
                    <p>{t('settings.autoLogout')}</p>
                  </div>
                  <label className="stp-toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="stp-toggle-slider"></span>
                  </label>
                </div>
                <div className="stp-form-group">
                  <label className="stp-form-label">{t('settings.passwordPolicy')}</label>
                  <select className="stp-select">
                    <option>Basic (6+ characters)</option>
                    <option>Standard (8+ with numbers)</option>
                    <option>Strong (12+ with symbols)</option>
                  </select>
                </div>
              </div>

              <div className="stp-card">
                <div className="stp-card-header">
                  <div className="stp-card-icon"><Bell size={18} /></div>
                  <h3 className="stp-card-title">{t('settings.systemNotifications')}</h3>
                </div>
                <div className="stp-toggle-item">
                  <div className="stp-toggle-label">
                    <h4>{t('settings.emailNotifications')}</h4>
                    <p>{t('settings.sendSystemEmails')}</p>
                  </div>
                  <label className="stp-toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="stp-toggle-slider"></span>
                  </label>
                </div>
                <div className="stp-toggle-item">
                  <div className="stp-toggle-label">
                    <h4>{t('settings.adminAlerts')}</h4>
                    <p>{t('settings.alertAdmins')}</p>
                  </div>
                  <label className="stp-toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="stp-toggle-slider"></span>
                  </label>
                </div>
                <div className="stp-toggle-item">
                  <div className="stp-toggle-label">
                    <h4>{t('settings.weeklyReports')}</h4>
                    <p>{t('settings.weeklySummary')}</p>
                  </div>
                  <label className="stp-toggle">
                    <input type="checkbox" />
                    <span className="stp-toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="stp-card" style={{ gridColumn: 'span 2' }}>
                <div className="stp-card-header">
                  <div className="stp-card-icon"><Database size={18} /></div>
                  <h3 className="stp-card-title">{t('settings.dataManagement')}</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  {[
                    { label: t('settings.storageUsed'), value: '2.4 GB' },
                    { label: t('settings.recordingsStored'), value: '1,250' },
                    { label: t('settings.lastBackup'), value: 'Jan 28' },
                  ].map((item) => (
                    <div key={item.label} style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.015)', borderRadius: '14px', textAlign: 'center' }}>
                      <div style={{ color: '#1a1a2e', fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>{item.value}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                  <button className="stp-submit-btn" style={{ width: 'auto', padding: '0.65rem 1.3rem' }}>{t('settings.exportAllData')}</button>
                  <button className="stp-submit-btn" style={{ width: 'auto', padding: '0.65rem 1.3rem', background: '#fff', color: '#E31837', border: '1.5px solid rgba(227,24,55,0.2)' }}>{t('settings.backupNow')}</button>
                  <button className="stp-submit-btn" style={{ width: 'auto', padding: '0.65rem 1.3rem', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: 'none' }}>{t('settings.clearOldData')}</button>
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
