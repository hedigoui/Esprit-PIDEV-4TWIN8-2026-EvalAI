import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Bell, Check, X } from 'lucide-react';
import styles from './examInvite.module.css';

const ExamInviteNotification = () => {
  const { socket, examInvite, clearInvite } = useSocket();
  const navigate = useNavigate();

  if (!examInvite) return null;

  const handleAccept = () => {
    if (socket) {
      try {
        const raw = localStorage.getItem('user');
        const user = raw ? JSON.parse(raw) : null;
        const studentId = user?.id || user?._id;
        socket.emit('acceptExamInvite', {
          roomId: examInvite.roomId,
          teacherId: examInvite.teacherId,
          studentId: String(studentId),
        });
      } catch {
        /* ignore */
      }
    }
    clearInvite();
    navigate(`/student/exam-room/${examInvite.roomId}`);
  };

  const handleDecline = () => {
    clearInvite();
  };

  return (
    <div className={styles.card} role="alertdialog" aria-labelledby="exam-invite-title">
      <div className={styles.top}>
        <div className={styles.iconWrap}>
          <Bell size={22} />
        </div>
        <div>
          <h3 id="exam-invite-title" className={styles.title}>
            Live oral exam
          </h3>
          <p className={styles.sub}>
            Your teacher invited you to a proctored session. Accept to join the secure exam room.
          </p>
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.btnAccept} onClick={handleAccept}>
          <Check size={18} strokeWidth={2.5} /> Accept
        </button>
        <button type="button" className={styles.btnDecline} onClick={handleDecline}>
          <X size={18} strokeWidth={2.5} /> Decline
        </button>
      </div>
    </div>
  );
};

export default ExamInviteNotification;
