import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Settings, ChevronDown, LogOut, User, CheckCircle } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useNotificationCenter } from '../context/NotificationCenter';
import LanguageSwitcher from './accessibility/LanguageSwitcher';

const TopNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, setLanguage } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const {
    notifications,
    invitations,
    loading: notifLoading,
    unreadCount,
    refresh,
    markAllRead,
    acceptInvite,
    rejectInvite,
  } = useNotificationCenter();

  const user = useMemo(() => {
    try { const raw = localStorage.getItem('user'); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  }, []);

  const roleFromPath = useMemo(() => {
    if (location.pathname.startsWith('/teacher')) return 'instructor';
    if (location.pathname.startsWith('/admin')) return 'admin';
    if (location.pathname.startsWith('/student')) return 'student';
    return user?.role;
  }, [location.pathname, user]);

  const displayName = useMemo(() => {
    if (!user) return t('nav.user');
    const full = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return full || user.email || t('nav.user');
  }, [t, user]);

  const displayEmail = user?.email || '—';
  const gender = user?.gender === 'female' ? 'female' : 'male';
  const avatarSeed = `${gender}-${displayName || 'user'}`;
  const avatarSrc = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=b6e3f4,c0aede,d1d4f9&sex=${gender}`;

  const pageLabel = useMemo(() => {
    const labelMap = {
      '/teacher/dashboard': t('nav.teacherDashboard'),
      '/teacher/students': t('nav.studentDirectory'),
      '/teacher/evaluate': t('nav.evaluation'),
      '/teacher/reports': t('nav.reports'),
      '/teacher/settings': t('nav.settings'),
      '/teacher/reclamations': t('nav.reclamations'),
      '/student/dashboard': t('nav.studentDashboard'),
      '/student/practice': t('nav.practiceSession'),
      '/student/reports': t('nav.myReports'),
      '/student/settings': t('nav.settings'),
      '/student/reclamations': t('nav.reclamations'),
      '/admin/dashboard': t('nav.adminDashboard'),
      '/admin/users': t('nav.userManagement'),
      '/admin/reports': t('nav.platformReports'),
      '/admin/settings': t('nav.systemSettings'),
      '/admin/reclamations': t('nav.reclamations'),
      '/profile': t('nav.profile'),
      '/conversations': t('nav.messages'),
    };
    const direct = labelMap[location.pathname];
    if (direct) return direct;
    if (location.pathname.startsWith('/teacher/evaluate/')) return t('nav.evaluation');
    if (location.pathname.startsWith('/messages/')) return t('nav.messages');
    return t('nav.dashboard');
  }, [location.pathname, t]);

  const settingsPath = roleFromPath === 'admin' ? '/admin/settings'
    : roleFromPath === 'instructor' ? '/teacher/settings' : '/student/settings';

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('rememberMe');
    window.dispatchEvent(new Event('evalai:user-updated'));
    navigate('/', { replace: true });
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  useEffect(() => { if (notifOpen) refresh({ force: true }); }, [notifOpen, refresh]);

  useEffect(() => {
    if (!notifOpen) return;
    const handle = (e) => { if (!notifRef.current?.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [notifOpen]);

  return (
    <>
      <style>{`
        .tnav {
          position: sticky; top: 0; z-index: 50;
          background: var(--bg-card-solid);
          border-bottom: 1px solid var(--border-light);
          box-shadow: 0 2px 16px rgba(0,0,0,0.04);
        }
        .tnav-inner {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 1.75rem; height: 64px; gap: 1rem;
        }
        .tnav-left { display: flex; flex-direction: column; gap: 1px; }
        .tnav-kicker { font-size: 0.65rem; font-weight: 700; color: #E31837; text-transform: uppercase; letter-spacing: 0.12em; }
        .tnav-title { font-size: 1rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; line-height: 1; }
        .tnav-right { display: flex; align-items: center; gap: 0.5rem; }

        .tnav-icon-btn {
          width: 38px; height: 38px; border-radius: 11px;
          background: var(--bg-card); border: 1px solid var(--border-light);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease;
          position: relative;
        }
        .tnav-icon-btn:hover { background: #fef2f4; color: #E31837; border-color: rgba(227,24,55,0.15); }
        .tnav-badge {
          position: absolute; top: -5px; right: -5px;
          min-width: 18px; height: 18px; padding: 0 4px;
          border-radius: 99px; background: #E31837; color: #fff;
          font-size: 0.62rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid var(--bg-card-solid); box-shadow: 0 2px 8px rgba(227,24,55,0.4);
        }

        .tnav-profile {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 5px 10px 5px 5px;
          border-radius: 14px; border: 1px solid var(--border-light);
          background: var(--bg-card); cursor: pointer; transition: all 0.2s ease;
        }
        .tnav-profile:hover { background: #fef2f4; border-color: rgba(227,24,55,0.15); }
        .tnav-avatar { width: 32px; height: 32px; border-radius: 10px; object-fit: cover; border: 1px solid var(--border-light); }
        .tnav-profile-name { font-size: 0.83rem; font-weight: 700; color: var(--text-primary); line-height: 1; }
        .tnav-profile-role { font-size: 0.7rem; color: var(--text-muted); font-weight: 500; }

        .tnav-lang-select {
          height: 36px;
          padding: 0 0.6rem;
          border-radius: 10px;
          border: 1px solid var(--border-light);
          background: var(--bg-card);
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer;
        }

        .tnav-dropdown {
          position: absolute; right: 0; top: calc(100% + 8px);
          background: var(--bg-card-solid); border: 1px solid var(--border-light);
          border-radius: 16px; padding: 6px;
          min-width: 200px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.1);
          z-index: 9999; animation: dropFade 0.15s ease;
        }
        @keyframes dropFade { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        .tnav-menu-item {
          display: flex; align-items: center; gap: 9px;
          padding: 0.6rem 0.75rem; border-radius: 10px;
          font-size: 0.85rem; color: var(--text-secondary); font-weight: 500;
          cursor: pointer; transition: background 0.15s ease;
        }
        .tnav-menu-item:hover { background: var(--bg-card); color: var(--text-primary); }
        .tnav-menu-item.danger { color: #dc2626; }
        .tnav-menu-item.danger:hover { background: #fef2f2; }
        .tnav-menu-divider { height: 1px; background: var(--border-light); margin: 4px 0; }

        .tnav-notif-panel {
          position: absolute; right: 0; top: calc(100% + 8px);
          background: var(--bg-card-solid); border: 1px solid var(--border-light);
          border-radius: 18px; padding: 0;
          width: 340px; max-height: 440px; overflow-y: auto;
          box-shadow: 0 8px 30px rgba(0,0,0,0.1);
          z-index: 9999; animation: dropFade 0.15s ease;
        }
        .tnav-notif-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1rem 1.1rem 0.75rem;
          border-bottom: 1px solid var(--border-light);
          position: sticky; top: 0; background: var(--bg-card-solid); border-radius: 18px 18px 0 0;
        }
        .tnav-notif-title { font-size: 0.88rem; font-weight: 800; color: var(--text-primary); }
        .tnav-mark-read {
          font-size: 0.75rem; font-weight: 600; color: #E31837;
          background: none; border: none; cursor: pointer; padding: 0;
          transition: opacity 0.15s;
        }
        .tnav-mark-read:hover { opacity: 0.7; }
        .tnav-notif-body { padding: 0.6rem; }
        .tnav-notif-empty { text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem; }
        .tnav-notif-card {
          padding: 0.75rem 0.85rem; border-radius: 12px;
          border: 1px solid var(--border-light); margin-bottom: 0.4rem;
          transition: border-color 0.15s;
        }
        .tnav-notif-card.unread { border-color: rgba(227,24,55,0.2); background: #fef9fa; }
        .tnav-notif-card-title { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.2rem; }
        .tnav-notif-card-body { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; }
        .tnav-invite-actions { display: flex; gap: 0.4rem; margin-top: 0.6rem; }
        .tnav-invite-btn {
          padding: 0.35rem 0.75rem; border-radius: 8px;
          font-size: 0.78rem; font-weight: 700; cursor: pointer; border: none;
          transition: all 0.15s ease;
        }
        .tnav-invite-btn.accept { background: linear-gradient(135deg,#E31837,#B71C1C); color: #fff; box-shadow: 0 2px 8px rgba(227,24,55,0.3); }
        .tnav-invite-btn.accept:hover { transform: translateY(-1px); }
        .tnav-invite-btn.decline { background: var(--bg-card); color: var(--text-secondary); }
        .tnav-invite-btn.decline:hover { background: var(--bg-glass); }

        @media (max-width: 768px) {
          .tnav-inner { padding: 0 1rem; }
          .tnav-profile-name, .tnav-profile-role { display: none; }
        }
      `}</style>

      <div className="tnav">
        <div className="tnav-inner">
          <div className="tnav-left">
            <span className="tnav-kicker">EvalAI</span>
            <span className="tnav-title">{pageLabel}</span>
          </div>

          <div className="tnav-right">
            <LanguageSwitcher />

            {/* Notifications */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button type="button" className="tnav-icon-btn" aria-label={t('nav.notifications')}
                onClick={() => setNotifOpen(p => !p)}>
                <Bell size={17} />
                {unreadCount > 0 && <span className="tnav-badge">{unreadCount}</span>}
              </button>

              {notifOpen && (
                <div className="tnav-notif-panel">
                  <div className="tnav-notif-header">
                    <span className="tnav-notif-title">{t('nav.notifications')} {unreadCount > 0 && `(${unreadCount})`}</span>
                    <button type="button" className="tnav-mark-read" onClick={markAllRead}>{t('nav.markAllRead')}</button>
                  </div>
                  <div className="tnav-notif-body">
                    {notifLoading && <div className="tnav-notif-empty">{t('nav.loading')}</div>}

                    {!notifLoading && roleFromPath === 'student' && invitations.map(invite => (
                      <div key={invite._id} className={`tnav-notif-card${invite.status === 'pending' && !invite.read ? ' unread' : ''}`}>
                        <div className="tnav-notif-card-title">{t('nav.instructorInvitation')}</div>
                        <div className="tnav-notif-card-body">
                          {t('nav.invitedYou', { name: invite.teacher?.name || invite.teacher?.email || t('nav.user') })}
                        </div>
                        <div className="tnav-invite-actions">
                          <button type="button" className="tnav-invite-btn accept" onClick={() => acceptInvite(invite._id)}>
                            <CheckCircle size={12} style={{ display: 'inline', marginRight: 4 }} />{t('nav.accept')}
                          </button>
                          <button type="button" className="tnav-invite-btn decline" onClick={() => rejectInvite(invite._id)}>
                            {t('nav.decline')}
                          </button>
                        </div>
                      </div>
                    ))}

                    {!notifLoading && notifications.length === 0 && invitations.length === 0 && (
                      <div className="tnav-notif-empty">
                        <Bell size={28} style={{ color: '#e2e8f0', marginBottom: 8 }} />
                        <div>{t('nav.noNotifications')}</div>
                      </div>
                    )}

                    {!notifLoading && notifications.map(note => (
                      <div key={note._id} className={`tnav-notif-card${note.status === 'unread' ? ' unread' : ''}`}>
                        <div className="tnav-notif-card-title">{note.title}</div>
                        <div className="tnav-notif-card-body">{note.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <button type="button" className="tnav-icon-btn" aria-label="Settings" onClick={() => navigate(settingsPath)}>
              <Settings size={17} />
            </button>

            {/* Profile Menu */}
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button type="button" className="tnav-profile" onClick={() => setMenuOpen(p => !p)} aria-expanded={menuOpen}>
                <img className="tnav-avatar" src={avatarSrc} alt={displayName} />
                <div>
                  <div className="tnav-profile-name">{displayName}</div>
                  <div className="tnav-profile-role" style={{ textTransform: 'capitalize' }}>{roleFromPath || t('nav.user')}</div>
                </div>
                <ChevronDown size={14} style={{ color: '#94a3b8', marginLeft: 2 }} />
              </button>

              {menuOpen && (
                <div className="tnav-dropdown">
                  <div className="tnav-menu-item" onClick={() => { navigate('/profile'); setMenuOpen(false); }}>
                    <User size={15} style={{ color: '#64748b' }} /> {t('nav.myProfile')}
                  </div>
                  <div className="tnav-menu-item" onClick={() => { navigate(settingsPath); setMenuOpen(false); }}>
                    <Settings size={15} style={{ color: '#64748b' }} /> {t('nav.accountSettings')}
                  </div>
                  <div className="tnav-menu-divider" />
                  <div className="tnav-menu-item danger" onClick={handleLogout}>
                    <LogOut size={15} /> {t('nav.signOut')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TopNavbar;