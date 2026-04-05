import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherSidebar from '../components/TeacherSidebar';
import StudentSidebar from '../components/StudentSidebar';
import AdminSidebar from '../components/AdminSidebar';
import styles from '../styles/shared.module.css';

const MessageTest = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [testUsers, setTestUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.id) {
      setUser(userData);
    } else {
      navigate('/');
      return;
    }
    
    // Mock test users - in real app, these would come from API
    setTestUsers([
      { id: 'teacher1', name: 'John Smith (Teacher)', email: 'teacher@test.com', role: 'instructor' },
      { id: 'student1', name: 'Sarah Miller (Student)', email: 'student@test.com', role: 'student' },
    ]);
  }, [navigate]);

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

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!selectedUser || !message.trim()) {
      setResult('❌ Please select a user and enter a message');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setResult('❌ No authentication token found. Please login first.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3000/communication/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedUser,
          content: message.trim(),
          type: 'text'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`✅ Message sent successfully to ${testUsers.find(u => u.id === selectedUser)?.name}`);
        setMessage('');
      } else {
        setResult(`❌ Error: ${data.message || 'Failed to send message'}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openConversation = (userId) => {
    navigate(`/messages/${userId}`);
  };

  return (
    <div className={styles.layout}>
      {getSidebar()}
      <div className={styles.mainContent}>
        <div className={styles.content}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Message Test</h1>
              <p className={styles.pageSubtitle}>Test messaging between users</p>
            </div>
          </div>

          {/* Current User Info */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Current User: {user?.firstName} {user?.lastName} ({user?.role})
            </h3>
          </div>

          {/* Test Users */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Test Users
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {testUsers.map((testUser) => (
                <div key={testUser.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-primary)',
                }}>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                      {testUser.name}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {testUser.email}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setSelectedUser(testUser.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: selectedUser === testUser.id 
                          ? 'linear-gradient(135deg, #E31837, #B71C1C)' 
                          : 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        color: selectedUser === testUser.id ? 'white' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      {selectedUser === testUser.id ? 'Selected' : 'Select'}
                    </button>
                    <button
                      onClick={() => openConversation(testUser.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Send Message Form */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Send Test Message
            </h3>
            <form onSubmit={sendMessage}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  color: 'var(--text-primary)', 
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem' 
                }}>
                  Selected User:
                </label>
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-tertiary)',
                  border: '2px solid var(--border-primary)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                }}>
                  {testUsers.find(u => u.id === selectedUser)?.name || 'No user selected'}
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  color: 'var(--text-primary)', 
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem' 
                }}>
                  Message:
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your test message here..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-tertiary)',
                    border: '2px solid var(--border-primary)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !selectedUser || !message.trim()}
                style={{
                  padding: '0.75rem 2rem',
                  background: loading || !selectedUser || !message.trim()
                    ? 'var(--bg-tertiary)'
                    : 'linear-gradient(135deg, #E31837, #B71C1C)',
                  border: 'none',
                  borderRadius: '12px',
                  color: loading || !selectedUser || !message.trim() 
                    ? 'var(--text-secondary)' 
                    : 'white',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: loading || !selectedUser || !message.trim() 
                    ? 'not-allowed' 
                    : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {loading ? (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                ) : (
                  'Send Message'
                )}
              </button>
            </form>

            {result && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                borderRadius: '12px',
                background: result.includes('✅') 
                  ? 'rgba(34, 197, 94, 0.1)' 
                  : 'rgba(239, 68, 68, 0.1)',
                border: result.includes('✅') 
                  ? '1px solid rgba(34, 197, 94, 0.3)' 
                  : '1px solid rgba(239, 68, 68, 0.3)',
                color: result.includes('✅') 
                  ? '#22c55e' 
                  : '#ef4444',
              }}>
                {result}
              </div>
            )}
          </div>

          {/* Test Instructions */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
              🧪 Test Instructions
            </h3>
            <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '0.5rem' }}><strong>1. Create Test Users:</strong></p>
              <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                <li>Sign up as: teacher@test.com / password123</li>
                <li>Sign up as: student@test.com / password123</li>
              </ul>
              
              <p style={{ marginBottom: '0.5rem' }}><strong>2. Test Messaging:</strong></p>
              <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                <li>Login as teacher</li>
                <li>Select student user</li>
                <li>Send test message</li>
                <li>Check result</li>
              </ul>
              
              <p style={{ marginBottom: '0.5rem' }}><strong>3. Verify Communication:</strong></p>
              <ul style={{ marginLeft: '1.5rem' }}>
                <li>Login as student</li>
                <li>Check if message appears in conversations</li>
                <li>Reply to teacher</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageTest;
