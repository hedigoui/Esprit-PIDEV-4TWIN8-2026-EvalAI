import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Bell, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';

const NotificationCenterContext = createContext(null);

export const useNotificationCenter = () => {
  const ctx = useContext(NotificationCenterContext);
  if (!ctx) {
    throw new Error('useNotificationCenter must be used within NotificationCenterProvider');
  }
  return ctx;
};

export const NotificationCenterProvider = ({ children }) => {
  const location = useLocation();
  const { t } = useI18n();
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const refreshInFlightRef = useRef(false);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('token') || '');
  const [authRole, setAuthRole] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      const user = raw ? JSON.parse(raw) : null;
      return user?.role || '';
    } catch {
      return '';
    }
  });

  const syncAuth = useCallback(() => {
    const token = localStorage.getItem('token') || '';
    let role = '';
    try {
      const raw = localStorage.getItem('user');
      const user = raw ? JSON.parse(raw) : null;
      role = user?.role || '';
    } catch {
      role = '';
    }
    setAuthToken(token);
    setAuthRole(role);
  }, []);

  useEffect(() => {
    syncAuth();
  }, [location.pathname, syncAuth]);

  useEffect(() => {
    const handleStorage = () => syncAuth();
    const handleFocus = () => syncAuth();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [syncAuth]);

  const addToast = useCallback((payload) => {
    if (!payload) return;
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const toast = {
      id,
      title: payload.title || t('nav.notifications'),
      message: payload.message || t('nav.noNotifications'),
    };
    setToasts((prev) => [...prev, toast]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 3600);
  }, [t]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  };

  const refresh = useCallback(async ({ force = false } = {}) => {
    if (!authToken) {
      setNotifications([]);
      setInvitations([]);
      return;
    }
    if (refreshInFlightRef.current && !force) return;

    refreshInFlightRef.current = true;
    setLoading(true);
    try {
      const [notifRes, inviteRes] = await Promise.all([
        fetch('http://localhost:3000/communication/notifications', {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        authRole === 'student'
          ? fetch('http://localhost:3000/communication/invitations/received', {
            headers: { Authorization: `Bearer ${authToken}` },
          })
          : Promise.resolve(null),
      ]);

      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(Array.isArray(data.data) ? data.data : []);
      }

      if (inviteRes && inviteRes.ok) {
        const inviteData = await inviteRes.json();
        const incoming = (Array.isArray(inviteData.data) ? inviteData.data : []).filter((x) => x.status === 'pending');
        setInvitations((prev) => {
          const prevMap = new Map(prev.map((i) => [i._id, i]));
          return incoming.map((i) => ({ ...i, read: prevMap.get(i._id)?.read || false }));
        });
      } else if (authRole !== 'student') {
        setInvitations([]);
      }
    } catch (error) {
      console.error('Notification refresh failed:', error);
    } finally {
      refreshInFlightRef.current = false;
      setLoading(false);
    }
  }, [authRole, authToken]);

  const markAllRead = useCallback(async () => {
    if (!authToken) return;

    await fetch('http://localhost:3000/communication/notifications/read-all', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' })));
    setInvitations((prev) => prev.map((i) => ({ ...i, read: true })));
  }, [authToken]);

  const acceptInvite = useCallback(async (id) => {
    if (!authToken) return;

    await fetch(`http://localhost:3000/communication/invitations/${id}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    await refresh({ force: true });
  }, [authToken, refresh]);

  const rejectInvite = useCallback(async (id) => {
    if (!authToken) return;

    await fetch(`http://localhost:3000/communication/invitations/${id}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    await refresh({ force: true });
  }, [authToken, refresh]);

  useEffect(() => {
    if (!authToken) return;
    void refresh({ force: true });
  }, [authToken, refresh]);

  useEffect(() => {
    if (!authToken) return;

    const socket = io('http://localhost:3000', {
      auth: { token: authToken },
      transports: ['polling'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      void refresh({ force: true });
    });

    socket.on('notification:new', (note) => {
      if (!note) return;
      setNotifications((prev) => {
        if (prev.some((n) => n._id === note._id)) return prev;
        return [note, ...prev];
      });
      addToast(note);
    });

    return () => {
      socket.off('connect');
      socket.off('notification:new');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [addToast, authToken, refresh]);

  const unreadCount = useMemo(() => {
    const notifUnread = notifications.filter((n) => n.status === 'unread').length;
    const inviteUnread = authRole === 'student'
      ? invitations.filter((i) => i.status === 'pending' && !i.read).length
      : 0;
    return notifUnread + inviteUnread;
  }, [authRole, invitations, notifications]);

  return (
    <NotificationCenterContext.Provider
      value={{
        notifications,
        invitations,
        loading,
        unreadCount,
        refresh,
        markAllRead,
        acceptInvite,
        rejectInvite,
      }}
    >
      {children}

      {!!toasts.length && (
        <>
          <style>{`
            .nc-toast-wrap {
              position: fixed;
              top: 82px;
              right: 18px;
              z-index: 10000;
              display: flex;
              flex-direction: column;
              gap: 0.55rem;
              width: min(92vw, 340px);
              pointer-events: none;
            }
            .nc-toast {
              border: 1px solid rgba(227,24,55,0.16);
              border-left: 4px solid #E31837;
              background: rgba(255,255,255,0.98);
              backdrop-filter: blur(8px);
              border-radius: 12px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.12);
              padding: 0.72rem 0.8rem;
              animation: ncToastIn 0.2s ease;
              pointer-events: auto;
            }
            .nc-toast-head {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 0.6rem;
              margin-bottom: 0.2rem;
            }
            .nc-toast-title {
              display: inline-flex;
              align-items: center;
              gap: 0.35rem;
              font-size: 0.78rem;
              font-weight: 800;
              color: #0f172a;
            }
            .nc-toast-close {
              border: none;
              background: transparent;
              color: #94a3b8;
              cursor: pointer;
              padding: 0;
              line-height: 1;
            }
            .nc-toast-close:hover {
              color: #E31837;
            }
            .nc-toast-body {
              font-size: 0.8rem;
              color: #475569;
              line-height: 1.45;
            }
            @keyframes ncToastIn {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div className="nc-toast-wrap">
            {toasts.map((toast) => (
              <div className="nc-toast" key={toast.id}>
                <div className="nc-toast-head">
                  <div className="nc-toast-title">
                    <Bell size={13} />
                    {toast.title}
                  </div>
                  <button type="button" className="nc-toast-close" onClick={() => removeToast(toast.id)}>
                    <X size={14} />
                  </button>
                </div>
                <div className="nc-toast-body">{toast.message}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </NotificationCenterContext.Provider>
  );
};
