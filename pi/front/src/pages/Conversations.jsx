import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, ArrowRight, Users } from 'lucide-react';
import { io } from 'socket.io-client';
import TeacherSidebar from '../components/TeacherSidebar';
import StudentSidebar from '../components/StudentSidebar';
import AdminSidebar from '../components/AdminSidebar';
import TopNavbar from '../components/TopNavbar';
import styles from '../styles/shared.module.css';
import { useI18n } from '../i18n/I18nProvider';
import { API_BASE_URL } from '../config/api';

const Avatar = ({ name, avatar, gender, size = 40 }) => {
  const g = gender === 'female' ? 'female' : 'male';
  const { t } = useI18n();
  return (
    <img
      src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(`${g}-${name || 'user'}`)}&backgroundColor=b6e3f4,c0aede,d1d4f9&sex=${g}`}
      alt={name || t('conversations.userFallback')}
      style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', objectFit: 'cover' }}
    />
  );
};

const getRoleColor = (role) => {
  if (!role) return { bg: 'rgba(100,116,139,0.08)', text: '#475569' };
  const r = role.toLowerCase();
  if (r === 'instructor') return { bg: 'rgba(227,24,55,0.08)', text: '#E31837' };
  if (r === 'student') return { bg: 'rgba(59,130,246,0.08)', text: '#2563eb' };
  if (r === 'admin') return { bg: 'rgba(139,92,246,0.08)', text: '#7c3aed' };
  return { bg: 'rgba(100,116,139,0.08)', text: '#475569' };
};

const Conversations = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [blockedIds, setBlockedIds] = useState(() => new Set());
  const [mutedIds, setMutedIds] = useState(() => new Set());
  const [openMenuId, setOpenMenuId] = useState(null);
  const socketRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setConversations([]); return; }
      const response = await fetch(`${API_BASE_URL}/communication/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(Array.isArray(data.data) ? data.data : []);
      } else { setConversations([]); }
    } catch (error) { console.error('Error loading conversations:', error); setConversations([]); }
  }, []);

  const loadTeachers = useCallback(async () => {
    try {
      setLoadingTeachers(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/instructors`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (response.ok) {
        const data = await response.json();
        setTeachers(Array.isArray(data.data) ? data.data : []);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.error('Error loading instructors:', error);
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  }, []);

  const loadBlocks = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/communication/blocks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const ids = new Set((Array.isArray(data.data) ? data.data : []).map((b) => b.blockedId));
        setBlockedIds(ids);
      }
    } catch (error) {
      console.error('Error loading blocks:', error);
    }
  }, []);

  const loadMutes = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/communication/mutes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const ids = new Set((Array.isArray(data.data) ? data.data : []).map((m) => m.mutedUserId));
        setMutedIds(ids);
      }
    } catch (error) {
      console.error('Error loading mutes:', error);
    }
  }, []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.id) { setUser(userData); } else { navigate('/'); return; }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    if (user && user.id) {
      void loadConversations();
      void loadBlocks();
      void loadMutes();
      if (user.role === 'student') {
        void loadTeachers();
      }
    }
  }, [user, loadConversations, loadTeachers, loadBlocks, loadMutes]);

  useEffect(() => {
    if (!user?.id) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(API_BASE_URL, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('message:new', () => {
      void loadConversations();
    });

    socket.on('message:delete', () => {
      void loadConversations();
    });

    socket.on('message:update', () => {
      void loadConversations();
    });

    socket.on('conversation:update', () => {
      void loadConversations();
      void loadBlocks();
      void loadMutes();
    });

    return () => {
      socket.off('message:new');
      socket.off('message:delete');
      socket.off('message:update');
      socket.off('conversation:update');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, loadConversations, loadBlocks, loadMutes]);

  const deleteConversation = async (otherUserId) => {
    const token = localStorage.getItem('token');
    if (!token || !otherUserId) return;
    await fetch(`${API_BASE_URL}/communication/conversations/${otherUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setOpenMenuId(null);
    void loadConversations();
  };

  const toggleBlock = async (otherUserId) => {
    const token = localStorage.getItem('token');
    if (!token || !otherUserId) return;
    if (blockedIds.has(otherUserId)) {
      await fetch(`${API_BASE_URL}/communication/blocks/${otherUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } else {
      await fetch(`${API_BASE_URL}/communication/blocks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blockedId: otherUserId }),
      });
    }
    setOpenMenuId(null);
    void loadBlocks();
    void loadConversations();
  };

  const toggleMute = async (otherUserId) => {
    const token = localStorage.getItem('token');
    if (!token || !otherUserId) return;
    if (mutedIds.has(otherUserId)) {
      await fetch(`${API_BASE_URL}/communication/mutes/${otherUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } else {
      await fetch(`${API_BASE_URL}/communication/mutes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mutedUserId: otherUserId }),
      });
    }
    setOpenMenuId(null);
    void loadMutes();
  };

  const reportUser = async (otherUserId) => {
    const token = localStorage.getItem('token');
    if (!token || !otherUserId) return;
    const reason = window.prompt(t('conversations.reportPrompt'));
    if (reason === null) return;
    await fetch(`${API_BASE_URL}/communication/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reportedId: otherUserId, reason }),
    });
    setOpenMenuId(null);
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const otherUser = conv.otherParticipant;
    return otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      otherUser?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessageContent?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredTeachers = teachers.filter((t) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const name = `${t.firstName || ''} ${t.lastName || ''}`.trim().toLowerCase();
    return name.includes(q) || String(t.email || '').toLowerCase().includes(q);
  });

  const getSidebar = () => {
    if (!user) return null;
    switch (user.role) {
      case 'student': return <StudentSidebar />;
      case 'instructor': return <TeacherSidebar />;
      case 'admin': return <AdminSidebar />;
      default: return null;
    }
  };

  const formatTime = (t) => {
    if (!t) return '';
    return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return (
    <div className={styles.layout}>
      {getSidebar()}
      <div className={styles.mainContent}>
        <TopNavbar />
        <div className={styles.content} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('conversations.loading')}</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .conv-root { animation: fadeUp 0.3s ease; }
        .conv-item {
          display: flex; align-items: center; gap: 1rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-light);
          cursor: pointer;
          transition: all 0.2s ease;
          background: var(--bg-card);
        }
        .conv-item:hover { background: var(--primary-soft); }
        .conv-item:hover .conv-arrow { opacity: 1; transform: translateX(0); }
        .conv-item:last-child { border-bottom: none; }
        .conv-arrow { opacity: 0; transform: translateX(-4px); transition: all 0.2s ease; color: #E31837; flex-shrink: 0; }
        .conv-teacher-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        .conv-teacher-card {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.9rem 1rem;
          border-radius: 14px;
          border: 1px solid var(--border-light);
          background: var(--bg-card);
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .conv-teacher-info { flex: 1; min-width: 0; }
        .conv-teacher-name {
          font-size: 0.9rem; font-weight: 700; color: var(--text-primary);
        }
        .conv-teacher-email {
          font-size: 0.75rem; color: var(--text-muted);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .conv-teacher-btn {
          padding: 0.45rem 0.7rem;
          border-radius: 10px;
          border: 1px solid rgba(227,24,55,0.2);
          background: rgba(227,24,55,0.08);
          color: #E31837;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .conv-menu-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.1rem;
          line-height: 1;
          padding: 4px 6px;
          border-radius: 8px;
        }
        .conv-menu-btn:hover { background: var(--bg-glass); color: var(--text-primary); }
        .conv-menu {
          position: absolute;
          right: 0;
          top: 100%;
          margin-top: 6px;
          background: var(--bg-card-solid);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          padding: 6px;
          min-width: 150px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
          z-index: 5;
        }
        .conv-menu-item {
          width: 100%;
          text-align: left;
          padding: 6px 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 0.78rem;
          color: var(--text-primary);
        }
        .conv-menu-item.danger { color: #dc2626; }
      `}</style>
      <div className={styles.layout}>
        {getSidebar()}
        <div className={styles.mainContent}>
          <TopNavbar />
          <div className={styles.content}>
            <div className="conv-root">
              {/* Header */}
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#E31837', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>{t('conversations.inboxKicker')}</div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>{t('conversations.title')}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.25rem' }}>{t('conversations.sub')}</p>
              </div>

              {/* Search */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'var(--bg-card)', border: '1.5px solid var(--border-light)',
                borderRadius: '14px', padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                transition: 'border-color 0.2s',
              }}
                onFocus={() => { }} >
                <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder={t('conversations.searchPlaceholder')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit',
                  }}
                />
                {searchTerm && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {filteredConversations.length === 1
                      ? t('conversations.results', { count: filteredConversations.length })
                      : t('conversations.resultsPlural', { count: filteredConversations.length })}
                  </span>
                )}
              </div>

              {/* Stats pill */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '0.4rem 0.9rem', background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)', borderRadius: '99px',
                  fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                }}>
                  <MessageCircle size={13} style={{ color: '#E31837' }} />
                  {conversations.length === 1
                    ? t('conversations.conversationsCount', { count: conversations.length })
                    : t('conversations.conversationsCountPlural', { count: conversations.length })}
                </div>
              </div>

              {user?.role === 'student' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('conversations.teachersTitle')}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('conversations.teachersAvailable', { count: filteredTeachers.length })}</span>
                  </div>
                  {loadingTeachers ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('conversations.loadingTeachers')}</div>
                  ) : filteredTeachers.length ? (
                    <div className="conv-teacher-grid">
                      {filteredTeachers.map((teacher) => (
                        <div key={teacher._id || teacher.id} className="conv-teacher-card">
                          <Avatar name={`${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.email} avatar={teacher.avatar} gender={teacher.gender} size={44} />
                          <div className="conv-teacher-info">
                            <div className="conv-teacher-name">{`${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || t('conversations.teacherFallback')}</div>
                            <div className="conv-teacher-email">{teacher.email || '—'}</div>
                          </div>
                          <button
                            type="button"
                            className="conv-teacher-btn"
                            onClick={() => navigate(`/messages/${teacher._id || teacher.id}`)}
                          >
                            {t('conversations.messageButton')}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('conversations.noTeachers')}</div>
                  )}
                </div>
              )}

              {/* Conversation List */}
              <div style={{ background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-light)', overflow: 'visible', boxShadow: '0 2px 20px rgba(0,0,0,0.04)' }}>
                {filteredConversations.length === 0 ? (
                  <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: '20px',
                      background: 'rgba(227,24,55,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 1.25rem',
                    }}>
                      <MessageCircle size={30} style={{ color: '#E31837' }} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      {searchTerm ? t('conversations.emptySearchTitle') : t('conversations.emptyTitle')}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: 320, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                      {searchTerm
                        ? t('conversations.emptySearchBody', { term: searchTerm })
                        : user?.role === 'instructor'
                          ? t('conversations.emptyInstructorBody')
                          : t('conversations.emptyStudentBody')}
                    </p>
                    {user?.role === 'instructor' && !searchTerm && (
                      <button onClick={() => navigate('/teacher/students')} style={{
                        padding: '0.7rem 1.5rem',
                        background: 'linear-gradient(135deg,#E31837,#B71C1C)',
                        border: 'none', borderRadius: '12px', color: '#fff',
                        fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '7px',
                        boxShadow: '0 4px 14px rgba(227,24,55,0.35)',
                      }}>
                        <Users size={15} /> {t('conversations.viewStudents')}
                      </button>
                    )}
                  </div>
                ) : (
                  filteredConversations.map((conversation, index) => {
                    const convId = String(conversation._id ?? conversation.id ?? index);
                    const other = conversation.otherParticipant;
                    const roleColors = getRoleColor(other?.role);
                    const otherId = other?.id ? String(other.id) : null;
                    const isBlocked = otherId ? blockedIds.has(otherId) : false;
                    const isMuted = otherId ? mutedIds.has(otherId) : false;
                    return (
                      <div
                        key={convId}
                        className="conv-item"
                        onClick={() => { if (otherId) navigate(`/messages/${otherId}`); }}
                        style={{ position: 'relative' }}
                      >
                        {/* Avatar with online indicator */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <Avatar name={other?.name} avatar={other?.avatar} gender={other?.gender} size={48} />
                          <div style={{
                            position: 'absolute', bottom: 2, right: 2,
                            width: 12, height: 12, borderRadius: '50%',
                            background: '#22c55e', border: '2px solid var(--bg-card-solid)',
                          }} />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {other?.name || t('conversations.unknownUser')}
                              </span>
                              <span style={{
                                fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px',
                                borderRadius: '99px', background: roleColors.bg, color: roleColors.text,
                                textTransform: 'capitalize',
                              }}>
                                {other?.role || t('conversations.userFallback')}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '0.5rem' }}>
                              {formatTime(conversation.lastMessageTime)}
                            </span>
                          </div>
                          <p style={{
                            fontSize: '0.83rem', color: 'var(--text-secondary)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            margin: 0,
                          }}>
                            {conversation.lastMessageContent || t('conversations.noMessages')}
                          </p>
                        </div>

                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="conv-menu-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === convId ? null : convId);
                            }}
                            aria-label={t('conversations.optionsAria')}
                          >
                            ⋯
                          </button>

                          {openMenuId === convId && otherId && (
                            <div className="conv-menu" onClick={(e) => e.stopPropagation()}>
                              <button type="button" className="conv-menu-item" onClick={() => toggleMute(otherId)}>
                                {isMuted ? t('conversations.unmute') : t('conversations.mute')}
                              </button>
                              <button type="button" className="conv-menu-item" onClick={() => toggleBlock(otherId)}>
                                {isBlocked ? t('conversations.unblock') : t('conversations.block')}
                              </button>
                              <button type="button" className="conv-menu-item" onClick={() => reportUser(otherId)}>
                                {t('conversations.report')}
                              </button>
                              <button type="button" className="conv-menu-item danger" onClick={() => deleteConversation(otherId)}>
                                Delete
                              </button>
                            </div>
                          )}

                          <ArrowRight size={16} className="conv-arrow" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Conversations;