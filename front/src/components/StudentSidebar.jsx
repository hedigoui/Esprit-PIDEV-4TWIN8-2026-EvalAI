import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Mic, FileText, Settings, LogOut } from 'lucide-react';
import styles from './Sidebar.module.css';

const StudentSidebar = () => {
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
          <span className={styles.letterGrey}>V</span>
          <span className={styles.letterBlack}>A</span>
          <span className={styles.letterRed}>L</span>
          <span className={styles.letterGrey}>U</span>
          <span className={styles.letterBlack}>A</span>
        </span>
      </div>

      <nav className={styles.nav}>
        <NavLink 
          to="/student/dashboard" 
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/student/practice" 
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <Mic size={20} />
          <span>Practice</span>
        </NavLink>
        
        <NavLink 
          to="/student/reports" 
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <FileText size={20} />
          <span>My Reports</span>
        </NavLink>
        
        <NavLink 
          to="/student/settings" 
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
        <NavLink 
          to="/student/reclamations" 
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <Settings size={20} />
          <span>Reclamations</span>
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
                  <span>Logout</span>
                </button>
      </div>
    </aside>
  );
};

export default StudentSidebar;