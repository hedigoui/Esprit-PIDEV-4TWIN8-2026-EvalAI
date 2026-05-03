import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Bell, Check, X } from 'lucide-react';

const ExamInviteNotification = () => {
  const { socket, examInvite, clearInvite } = useSocket();
  const navigate = useNavigate();

  if (!examInvite) return null;

  const handleAccept = () => {
    if (socket) {
      const user = JSON.parse(localStorage.getItem('user'));
      socket.emit('acceptExamInvite', {
        roomId: examInvite.roomId,
        teacherId: examInvite.teacherId,
        studentId: user?.id,
      });
    }
    clearInvite();
    navigate(`/student/exam-room/${examInvite.roomId}`);
  };

  const handleDecline = () => {
    clearInvite();
  };

  return (
    <div style={{
      position: 'fixed',
      top: '1.5rem',
      right: '1.5rem',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      padding: '1.5rem',
      zIndex: 9999,
      width: '320px',
      border: '1px solid rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ 
          background: 'rgba(59, 130, 246, 0.1)', 
          padding: '0.75rem', 
          borderRadius: '50%',
          color: '#3b82f6'
        }}>
          <Bell size={24} />
        </div>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#1e293b' }}>Online Exam Invite</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
            Your teacher has invited you to take an online evaluation.
          </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button
          onClick={handleAccept}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: '#22c55e',
            color: 'white',
            border: 'none',
            padding: '0.6rem',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Check size={18} /> Accept
        </button>
        <button
          onClick={handleDecline}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: '#f1f5f9',
            color: '#64748b',
            border: 'none',
            padding: '0.6rem',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <X size={18} /> Decline
        </button>
      </div>
    </div>
  );
};

export default ExamInviteNotification;
