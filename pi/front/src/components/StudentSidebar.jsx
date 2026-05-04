import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Mic, FileText, Settings, LogOut, User, MessageCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

const sidebarStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

  .sidebar-root {
    width: 260px;
    min-height: 100vh;
    background: var(--bg-card-solid);
    border-right: 1px solid var(--border-light);
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: hidden;
    font-family: 'Manrope', sans-serif;
    z-index: 100;
    transition: width 0.3s cubic-bezier(0.4,0,0.2,1);
    box-shadow: 4px 0 24px rgba(0,0,0,0.04);
  }

  .sidebar-root.collapsed {
    width: 72px;
  }

  .sidebar-header {
    padding: 1.5rem 1.25rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-light);
    min-height: 72px;
  }

  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    text-decoration: none;
    overflow: hidden;
  }

  .logo-mark {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    overflow: hidden;
  }

  .logo-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  .logo-text {
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    white-space: nowrap;
    overflow: hidden;
    opacity: 1;
    transition: opacity 0.2s;
  }

  .collapsed .logo-text {
    opacity: 0;
    width: 0;
  }

  .logo-text .red { color: #E31837; }
  .logo-text .grey { color: var(--text-muted); }
  .logo-text .black { color: var(--text-primary); }

  .collapse-btn {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid var(--border-light);
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .collapse-btn:hover {
    background: var(--bg-card);
    border-color: var(--border-light);
  }

  .collapse-btn svg {
    transition: transform 0.3s;
  }

  .collapsed .collapse-btn svg {
    transform: rotate(180deg);
  }

  .sidebar-nav {
    flex: 1;
    padding: 1rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .nav-section-label {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    padding: 0.75rem 0.65rem 0.35rem;
    white-space: nowrap;
    overflow: hidden;
    opacity: 1;
    transition: opacity 0.2s;
  }

  .collapsed .nav-section-label {
    opacity: 0;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0.85rem;
    border-radius: 12px;
    text-decoration: none;
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
    position: relative;
    white-space: nowrap;
    overflow: hidden;
  }

  .nav-item:hover {
    background: var(--primary-soft);
    color: #E31837;
  }

  .nav-item.active {
    background: linear-gradient(135deg, rgba(227,24,55,0.1) 0%, rgba(183,28,28,0.06) 100%);
    color: #E31837;
    font-weight: 600;
  }

  .nav-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 25%;
    bottom: 25%;
    width: 3px;
    background: #E31837;
    border-radius: 0 3px 3px 0;
  }

  .nav-icon {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    transition: transform 0.2s;
  }

  .nav-item:hover .nav-icon {
    transform: scale(1.1);
  }

  .nav-label {
    overflow: hidden;
    opacity: 1;
    transition: opacity 0.15s, width 0.3s;
    white-space: nowrap;
  }

  .collapsed .nav-label {
    opacity: 0;
    width: 0;
  }

  .nav-divider {
    height: 1px;
    background: var(--border-light);
    margin: 0.5rem 0.65rem;
  }

  .sidebar-footer {
    padding: 0.75rem;
    border-top: 1px solid var(--border-light);
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 0.85rem;
    border-radius: 12px;
    border: none;
    background: transparent;
    color: #ef4444;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    font-family: 'Manrope', sans-serif;
    width: 100%;
    transition: all 0.2s;
    white-space: nowrap;
    overflow: hidden;
  }

  .logout-btn:hover {
    background: rgba(239,68,68,0.08);
  }

  .logout-label {
    overflow: hidden;
    opacity: 1;
    transition: opacity 0.15s;
    white-space: nowrap;
  }

  .collapsed .logout-label {
    opacity: 0;
    width: 0;
  }

  .nav-item-wrapper {
    position: relative;
  }

  .nav-tooltip {
    position: absolute;
    left: calc(100% + 12px);
    top: 50%;
    transform: translateY(-50%);
    background: #1a1a2e;
    color: white;
    font-size: 0.78rem;
    font-weight: 600;
    padding: 0.4rem 0.75rem;
    border-radius: 8px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
    z-index: 200;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .nav-tooltip::before {
    content: '';
    position: absolute;
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    border: 5px solid transparent;
    border-right-color: var(--text-primary);
  }

  .collapsed .nav-item-wrapper:hover .nav-tooltip {
    opacity: 1;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .sidebar-root { animation: slideIn 0.3s ease; }
`;

const StudentSidebar = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);
  const { t } = useI18n();

  const navItems = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard'), section: 'main' },
    { to: '/student/practice', icon: Mic, label: t('sidebar.practice'), section: 'main' },
    { to: '/student/reports', icon: FileText, label: t('sidebar.myReports'), section: 'main' },
    { to: '/student/reclamations', icon: AlertCircle, label: t('sidebar.reclamations'), section: 'main' },
    { to: '/profile', icon: User, label: t('sidebar.profile'), section: 'account' },
    { to: '/conversations', icon: MessageCircle, label: t('sidebar.messages'), section: 'account' },
    { to: '/student/settings', icon: Settings, label: t('sidebar.settings'), section: 'account' },
  ];

  const handleLogout = () => {
    console.log('🚪 Student logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    navigate('/', { replace: true });
  };

  const mainItems = navItems.filter(item => item.section === 'main');
  const accountItems = navItems.filter(item => item.section === 'account');

  return (
    <>
      <style>{sidebarStyles}</style>
      <aside
        className={`sidebar-root${collapsed ? ' collapsed' : ''}`}
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
      >
        <div className="sidebar-header">
          <a href="/student/dashboard" className="sidebar-logo">
            <div className="logo-mark">
              <img src="/logo.svg" alt="EvalAI" className="logo-image" />
            </div>
            <span className="logo-text">
              <span className="red">E</span>
              <span className="grey">v</span>
              <span className="black">a</span>
              <span className="red">l</span>
              <span className="grey">A</span>
              <span className="black">I</span>
            </span>
          </a>
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label={t('sidebar.toggleSidebar')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {!collapsed && <div className="nav-section-label">{t('sidebar.main')}</div>}
          {mainItems.map(({ to, icon: Icon, label }) => (
            <div key={to} className="nav-item-wrapper">
              <NavLink
                to={to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Icon className="nav-icon" size={20} />
                <span className="nav-label">{label}</span>
              </NavLink>
              {collapsed && <div className="nav-tooltip">{label}</div>}
            </div>
          ))}

          <div className="nav-divider" />
          {!collapsed && <div className="nav-section-label">{t('sidebar.account')}</div>}

          {accountItems.map(({ to, icon: Icon, label }) => (
            <div key={to} className="nav-item-wrapper">
              <NavLink
                to={to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Icon className="nav-icon" size={20} />
                <span className="nav-label">{label}</span>
              </NavLink>
              {collapsed && <div className="nav-tooltip">{label}</div>}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item-wrapper">
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={20} style={{ flexShrink: 0 }} />
              <span className="logout-label">{t('sidebar.logout')}</span>
            </button>
            {collapsed && <div className="nav-tooltip">{t('sidebar.logout')}</div>}
          </div>
        </div>
      </aside>
    </>
  );
};

export default StudentSidebar;