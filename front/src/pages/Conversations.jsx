import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, Phone, Video, MoreVertical, User } from 'lucide-react';
import TeacherSidebar from '../components/TeacherSidebar';
import StudentSidebar from '../components/StudentSidebar';
import AdminSidebar from '../components/AdminSidebar';
import styles from '../styles/shared.module.css';

// Avatar component - displays DiceBear avatar
const Avatar = ({ name, avatar, size = 40 }) => {
  return (
    <img 
      src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'user')}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
      alt={name || 'User'}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover',
      }}
    />
  );
};

const Conversations = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const loadConversations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setConversations([]);
        return;
      }

      const response = await fetch('http://localhost:3000/communication/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(Array.isArray(data.data) ? data.data : []);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    }
  }, [user]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.id) {
      setUser(userData);
    } else {
      navigate('/');
      return;
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    if (user && user.id) {
      void loadConversations();

      const intervalId = setInterval(() => {
        void loadConversations();
      }, 3000);

      return () => clearInterval(intervalId);
    }
  }, [user, loadConversations]);

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    // Search by participant name, email, or last message content
    const otherUser = conv.otherParticipant;
    const matchesName = otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmail = otherUser?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMessage = conv.lastMessageContent?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesName || matchesEmail || matchesMessage;
  });

  const getSidebar = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'student':
        return <StudentSidebar />;
      case 'instructor':
        return <TeacherSidebar />;
      case 'admin':
        return <AdminSidebar />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={styles.layout}>
        {getSidebar()}
        <div className={styles.mainContent}>
          <div className={styles.content}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', color: 'var(--text-secondary)' }}>
              Loading conversations...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {getSidebar()}
      <div className={styles.mainContent}>
        <div className={styles.content}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Messages</h1>
              <p className={styles.pageSubtitle}>Communicate with students and teachers</p>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '16px',
            padding: '1rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}>
            <Search size={20} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Conversations List */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}>
            {filteredConversations.length === 0 ? (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  No conversations yet
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {searchTerm 
                    ? 'No conversations found matching your search.' 
                    : user?.role === 'instructor' 
                      ? 'Start conversations with your students by clicking on their profiles or accessing the Students page.'
                      : 'Reach out to your teachers for help and guidance through the Messages system.'
                  }
                </p>
                {user?.role === 'instructor' && (
                  <button
                    onClick={() => navigate('/teacher/students')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #E31837, #B71C1C)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      marginTop: '1rem',
                    }}
                  >
                    View Students
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredConversations.map((conversation, index) => {
                  // Use the otherParticipant data from backend
                  const otherParticipant = conversation.otherParticipant;
                  
                  return (
                  <div
                    key={String(conversation._id ?? conversation.id ?? index)}
                    onClick={() => {
                      if (otherParticipant?.id) {
                        navigate(`/messages/${otherParticipant.id}`);
                      }
                    }}
                    style={{
                      padding: '1rem 1.5rem',
                      borderBottom: '1px solid var(--border-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                    }}
                  >
                    <Avatar 
                      name={conversation.otherParticipant?.name}
                      avatar={conversation.otherParticipant?.avatar}
                      size={48}
                    />
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.5rem',
                      }}>
                        <h3 style={{ 
                          color: 'var(--text-primary)', 
                          fontSize: '1rem', 
                          fontWeight: '600',
                          margin: 0 
                        }}>
                          {otherParticipant?.name || 'Unknown User'}
                        </h3>
                        <span style={{
                          fontSize: '0.75rem',
                          background: 'rgba(227, 24, 55, 0.1)',
                          color: '#E31837',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          textTransform: 'uppercase',
                          fontWeight: '500',
                        }}>
                          {otherParticipant?.role || 'User'}
                        </span>
                      </div>
                      <p style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '0.85rem',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {conversation.lastMessageContent}
                      </p>
                    </div>
                    
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      textAlign: 'right',
                    }}>
                      {conversation.lastMessageTime && 
                        new Date(conversation.lastMessageTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      }
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conversations;
