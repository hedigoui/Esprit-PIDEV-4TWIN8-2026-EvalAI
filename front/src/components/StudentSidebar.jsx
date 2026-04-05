import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Mic, FileText, Settings, LogOut, User, MessageCircle, Users } from 'lucide-react';
import styles from './Sidebar.module.css';

const StudentSidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log('🚪 Student logout');
    
    // Clear all auth data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    
    // Redirect to login page
    navigate('/', { replace: true });
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <img src="/logo.svg" alt="Logo" className={styles.logoIcon} />
        <span className={styles.logoText}>
          <span className={styles.letterRed}>E</span>
          <span className={styles.letterGrey}>v</span>
          <span className={styles.letterBlack}>a</span>
          <span className={styles.letterRed}>l</span>
          <span className={styles.letterGrey}>A</span>
          <span className={styles.letterBlack}>I</span>
        </span>
      </div>

      <nav className={styles.nav}>
        <NavLink 
          to="/student/dashboard" 
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>{t('common.dashboard')}</span>
        </NavLink>
        
        <NavLink 
          to="/student/practice" 
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <Mic size={20} />
          <span>{t('student.practice')}</span>
        </NavLink>
        
        <NavLink 
          to="/student/reports" 
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <FileText size={20} />
          <span>{t('student.reports')}</span>
        </NavLink>
        
        <NavLink 
          to="/profile" 
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <User size={20} />
          <span>{t('common.profile')}</span>
        </NavLink>
        
        <NavLink 
          to="/conversations" 
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <MessageCircle size={20} />
          <span>{t('common.messagesMenu')}</span>
        </NavLink>
        
        <NavLink 
          to="/student/settings" 
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <Settings size={20} />
          <span>{t('student.settings')}</span>
        </NavLink>
        <NavLink 
          to="/student/reclamations" 
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <Users size={20} />
          <span>{t('student.reclamations')}</span>
        </NavLink>
      </nav>

      <div className={styles.footer}>
        <button 
                  onClick={handleLogout}
                  className={styles.logoutButton}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    borderRadius: '10px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  }}
                >
                  <LogOut size={20} />
                  <span>{t('common.logout')}</span>
                </button>
      </div>
    </aside>
  );
};

export default StudentSidebar;