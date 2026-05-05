import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Paperclip, Mic, Phone, Video, MoreVertical } from 'lucide-react';
import { io } from 'socket.io-client';
import styles from '../styles/shared.module.css';
import StudentSidebar from '../components/StudentSidebar';
import TeacherSidebar from '../components/TeacherSidebar';
import AdminSidebar from '../components/AdminSidebar';
import TopNavbar from '../components/TopNavbar';
import { useI18n } from '../i18n/I18nProvider';
import { API_BASE_URL } from '../config/api';

// Avatar component - displays DiceBear avatar
const Avatar = ({ name, avatar, gender, size = 40 }) => {
  const g = gender === 'female' ? 'female' : 'male';
  const { t } = useI18n();
  return (
    <img 
      src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(`${g}-${name || 'user'}`)}&backgroundColor=b6e3f4,c0aede,d1d4f9&sex=${g}`} 
      alt={name || t('messages.userFallback')}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover',
      }}
    />
  );
};

const Messages = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [user, setUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordChunksRef = useRef([]);
  const recordStartRef = useRef(0);
  const loadMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessages([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/communication/messages/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
        
        // Set other user details from response
        if (data.otherUser) {
          setOtherUser(data.otherUser);
        }
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  }, [userId]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const resolvedId = userData.id || userData._id;
    if (resolvedId) {
      setUser({ ...userData, id: resolvedId });
    } else {
      navigate('/');
      return;
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    if (userId && user && user.id) {
      void loadMessages();
    }
  }, [userId, user, loadMessages]);

  useEffect(() => {
    if (!user?.id || !userId) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(API_BASE_URL, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('message:new', (message) => {
      if (!message) return;
      const isCurrentConversation =
        (message.senderId === user.id && message.receiverId === userId) ||
        (message.senderId === userId && message.receiverId === user.id);
      if (!isCurrentConversation) return;
      setMessages((prev) => [...prev, message]);
    });

    socket.on('message:delete', (payload) => {
      if (!payload?.messageId) return;
      setMessages((prev) => prev.filter((m) => String(m._id || m.id) !== String(payload.messageId)));
    });

    socket.on('message:update', (updated) => {
      if (!updated) return;
      setMessages((prev) => prev.map((m) => (String(m._id || m.id) === String(updated._id || updated.id) ? updated : m)));
    });

    return () => {
      socket.off('message:new');
      socket.off('message:delete');
      socket.off('message:update');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDuration = (seconds) => {
    if (!Number.isFinite(seconds)) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatMessageTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sendMessageRest = async (content) => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const response = await fetch(`${API_BASE_URL}/communication/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        receiverId: userId,
        content,
        type: 'text'
      })
    });

    if (response.ok) {
      const data = await response.json();
      setMessages(prev => [...prev, data.data]);
      return true;
    }
    return false;
  };

  const sendFileMessage = async (file, type, duration) => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const fd = new FormData();
    fd.append('file', file);
    fd.append('receiverId', userId);
    fd.append('type', type);
    fd.append('content', file?.name || (type === 'voice_note' ? t('messages.voiceMessage') : t('messages.fileLabel')));
    if (Number.isFinite(duration)) {
      fd.append('duration', String(duration));
    }

    const response = await fetch(`${API_BASE_URL}/communication/messages/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: fd,
    });

    if (response.ok) {
      const data = await response.json();
      setMessages((prev) => [...prev, data.data]);
      return true;
    }
    return false;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const content = newMessage.trim();
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit('message:send', { receiverId: userId, content, type: 'text' }, (ack) => {
          if (ack?.ok) {
            setNewMessage('');
            return;
          }
          void sendMessageRest(content).then((sent) => {
            if (sent) setNewMessage('');
          });
        });
      } else {
        const sent = await sendMessageRest(content);
        if (sent) setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleFilePick = () => {
    setRecordError('');
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSending(true);
    try {
      await sendFileMessage(file, 'file');
    } finally {
      setSending(false);
      e.target.value = '';
    }
  };

  const startRecording = async () => {
    try {
      setRecordError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordChunksRef.current = [];
      recordStartRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data?.size) recordChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - recordStartRef.current) / 1000),
        );
        const blob = new Blob(recordChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
        stream.getTracks().forEach((t) => t.stop());
        setSending(true);
        try {
          await sendFileMessage(file, 'voice_note', durationSeconds);
        } finally {
          setSending(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
      setRecordError(t('messages.micError'));
      setRecording(false);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    setRecording(false);
  };

  const deleteMessage = async (messageId) => {
    const token = localStorage.getItem('token');
    if (!token || !messageId) return;
    try {
      const res = await fetch(`http://localhost:3000/communication/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => String(m._id || m.id) !== String(messageId)));
      }
    } catch (error) {
      console.error('Delete message error:', error);
    }
  };

  const startEditMessage = (message) => {
    setEditingMessageId(message._id || message.id);
    setEditingText(message.content || '');
    setOpenMenuId(null);
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const saveEditMessage = async (messageId) => {
    const token = localStorage.getItem('token');
    if (!token || !messageId || !editingText.trim()) return;
    try {
      const res = await fetch(`http://localhost:3000/communication/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: editingText.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => prev.map((m) => (String(m._id || m.id) === String(messageId) ? data.data : m)));
        cancelEditMessage();
      }
    } catch (error) {
      console.error('Update message error:', error);
    }
  };

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
          <TopNavbar />
          <div className={styles.content}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', color: 'var(--text-secondary)' }}>
              {t('messages.loading')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle case when no userId is provided
  if (!userId) {
    return (
      <div className={styles.layout}>
        {getSidebar()}
        <div className={styles.mainContent}>
          <TopNavbar />
          <div className={styles.content}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '400px',
              color: 'var(--text-secondary)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
                {t('messages.selectTitle')}
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>
                {t('messages.selectBody')}
              </p>
              <button
                onClick={() => navigate('/conversations')}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(135deg, #E31837, #B71C1C)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
              >
                {t('messages.viewConversations')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <style>{`
      `}</style>
      {getSidebar()}
      <div className={styles.mainContent}>
        <TopNavbar />
        <div className={styles.content}>
          {/* Chat Header */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '16px',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => navigate('/conversations')}
                style={{
                  padding: '0.4rem 0.65rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
                aria-label={t('messages.backAria')}
              >
                ← {t('messages.back')}
              </button>
              <Avatar 
                name={otherUser?.name}
                avatar={otherUser?.avatar}
                gender={otherUser?.gender}
                size={40}
              />
              <div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                  {otherUser?.name || t('messages.unknownUser')}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  {otherUser?.role || t('messages.userFallback')}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={{
                padding: '0.5rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Phone size={16} />
              </button>
              <button style={{
                padding: '0.5rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Video size={16} />
              </button>
              <button style={{
                padding: '0.5rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '16px',
            padding: '1.5rem',
            height: '500px',
            overflowY: 'auto',
            marginBottom: '1.5rem',
          }}>
            {messages.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-secondary)',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                <p style={{ textAlign: 'center' }}>
                  {otherUser?.name
                    ? t('messages.noMessages', { name: otherUser.name })
                    : t('messages.noMessagesFallback')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((message) => {
                  const currentUserId = String(user?.id ?? user?._id ?? '');
                  const isSentByMe = String(message.senderId ?? '') === currentUserId;
                  const hasFile = Boolean(message.fileUrl);
                  const isVoice = message.type === 'voice_note';
                  const isFile = message.type === 'file';
                  const timeLabel = formatMessageTime(message.createdAt || message.updatedAt);
                  let contentNode = message.content;
                  if (hasFile && isVoice) {
                    contentNode = (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <audio controls src={message.fileUrl} style={{ width: '220px' }} />
                        {Number.isFinite(message.duration) && (
                          <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                            {formatDuration(message.duration)}
                          </span>
                        )}
                      </div>
                    );
                  } else if (hasFile && isFile) {
                    contentNode = (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <a
                          href={message.fileUrl}
                          download={message.fileName || 'file'}
                          style={{ color: isSentByMe ? '#fff' : 'var(--text-primary)', textDecoration: 'underline' }}
                        >
                          {message.fileName || t('messages.downloadFile')}
                        </a>
                        {message.fileSize ? (
                          <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                            {(message.fileSize / 1024).toFixed(1)} KB
                          </span>
                        ) : null}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={message._id || message.id}
                      style={{
                        display: 'flex',
                        justifyContent: isSentByMe ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                      }}
                    >
                      <div style={{ position: 'relative', maxWidth: '100%' }}>
                        <div style={{
                          background: isSentByMe 
                            ? 'linear-gradient(135deg, #E31837, #B71C1C)' 
                            : 'var(--bg-tertiary)',
                          color: isSentByMe ? 'white' : 'var(--text-primary)',
                          padding: '0.75rem 1rem',
                          borderRadius: isSentByMe 
                            ? '16px 16px 4px 16px' 
                            : '16px 16px 16px 4px',
                          wordWrap: 'break-word',
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {editingMessageId === (message._id || message.id) ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <textarea
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  rows={2}
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem 0.6rem',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255,255,255,0.4)',
                                    background: 'rgba(255,255,255,0.12)',
                                    color: isSentByMe ? '#fff' : 'var(--text-primary)',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                    resize: 'vertical',
                                  }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    onClick={() => saveEditMessage(message._id || message.id)}
                                    style={{
                                      border: 'none',
                                      background: 'rgba(255,255,255,0.2)',
                                      color: isSentByMe ? '#fff' : 'var(--text-primary)',
                                      padding: '0.3rem 0.6rem',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      fontSize: '0.72rem',
                                    }}
                                  >
                                    {t('messages.save')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditMessage}
                                    style={{
                                      border: 'none',
                                      background: 'transparent',
                                      color: isSentByMe ? '#fff' : 'var(--text-primary)',
                                      padding: '0.3rem 0.6rem',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      fontSize: '0.72rem',
                                    }}
                                  >
                                    {t('messages.cancel')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>{contentNode}</div>
                            )}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.75rem',
                              fontSize: '0.72rem',
                              opacity: 0.85,
                            }}>
                              <span>{timeLabel}</span>
                              {isSentByMe && (
                                <button
                                  type="button"
                                  onClick={() => setOpenMenuId(openMenuId === (message._id || message.id) ? null : (message._id || message.id))}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: isSentByMe ? '#fff' : 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    lineHeight: 1,
                                  }}
                                  aria-label={t('messages.optionsAria')}
                                >
                                  ⋯
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {openMenuId === (message._id || message.id) && isSentByMe && (
                          <div style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            marginTop: '6px',
                            background: 'var(--bg-card-solid)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '10px',
                            padding: '6px',
                            minWidth: '120px',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                            zIndex: 5,
                          }}>
                            <button
                              type="button"
                              onClick={() => startEditMessage(message)}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '6px 8px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {t('messages.edit')}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                deleteMessage(message._id || message.id);
                              }}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '6px 8px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                color: '#dc2626',
                              }}
                            >
                              {t('messages.delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-end',
          }}>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
            }}>
              <button
                type="button"
                onClick={handleFilePick}
                aria-label={t('messages.fileLabel')}
                style={{
                  padding: '0.75rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Paperclip size={18} />
              </button>
              <button
                type="button"
                onClick={() => (recording ? stopRecording() : startRecording())}
                aria-label={t('messages.voiceMessage')}
                style={{
                  padding: '0.75rem',
                  background: recording ? 'rgba(227,24,55,0.12)' : 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '12px',
                  color: recording ? '#E31837' : 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mic size={18} />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('messages.typeMessage')}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-tertiary)',
                  border: '2px solid var(--border-primary)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
                disabled={sending}
              />
              {recordError && (
                <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.4rem' }}>
                  {recordError}
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              style={{
                padding: '0.75rem 1.5rem',
                background: newMessage.trim() && !sending 
                  ? 'linear-gradient(135deg, #E31837, #B71C1C)' 
                  : 'var(--bg-tertiary)',
                border: 'none',
                borderRadius: '12px',
                color: newMessage.trim() && !sending ? 'white' : 'var(--text-secondary)',
                cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
              }}
            >
              {sending ? (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Messages;
