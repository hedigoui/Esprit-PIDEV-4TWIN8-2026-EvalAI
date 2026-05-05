import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { ShieldAlert, Video, MonitorUp, Activity, CheckCircle, LogOut } from 'lucide-react';
import Toast from '../../components/Toast';
import oex from '../../styles/onlineExam.module.css';

const TeacherOnlineExamRoom = () => {
  const { roomId } = useParams();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [studentConnected, setStudentConnected] = useState(false);
  const [examStatus, setExamStatus] = useState('waiting');
  const [submissionData, setSubmissionData] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });

  const peerConnectionRef = useRef(null);
  const [remoteStreams, setRemoteStreams] = useState([]);

  const videoRef1 = useRef(null);
  const videoRef2 = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('examEvent', { roomId, type: 'webrtc_ice_candidate', payload: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      setRemoteStreams((prev) => {
        if (prev.some((s) => s.id === stream.id)) return prev;
        return [...prev, stream];
      });
    };

    socket.emit('joinExamRoom', { roomId });
    // Tell anyone in the room I'm here
    socket.emit('examEvent', { roomId, type: 'teacher_joined', payload: {} });
    // Ask for a sync in case the student is already there
    socket.emit('examEvent', { roomId, type: 'sync_request', payload: {} });

    const onInviteAccepted = () => {
      setToast({ message: 'Student joined the room.', type: 'success' });
    };
    socket.on('examInviteAccepted', onInviteAccepted);

    socket.on('examEventReceived', async (data) => {
      if (data.type === 'student_joined') {
        setStudentConnected(true);
        // If they sent their status with the join event, update it
        if (data.payload?.status) setExamStatus(data.payload.status);
      }

      if (data.type === 'status_update') {
        setStudentConnected(true);
        setExamStatus(data.payload.status);
        if (data.payload.status === 'submitted') {
          setSubmissionData({
            performanceId: data.payload.performanceId,
            studentId: data.payload.studentId,
          });
        }
      }

      if (data.type === 'webrtc_offer') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('examEvent', { roomId, type: 'webrtc_answer', payload: pc.localDescription });
        } catch (err) {
          console.error('Error handling WebRTC offer:', err);
        }
      }

      if (data.type === 'webrtc_ice_candidate') {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.payload));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    return () => {
      socket.off('examEventReceived');
      socket.off('examInviteAccepted', onInviteAccepted);
      pc.close();
    };
  }, [socket, roomId]);

  useEffect(() => {
    if (remoteStreams[0] && videoRef1.current) {
      videoRef1.current.srcObject = remoteStreams[0];
    }
    if (remoteStreams[1] && videoRef2.current) {
      videoRef2.current.srcObject = remoteStreams[1];
    }
  }, [remoteStreams]);

  const handleEndExam = () => {
    if (submissionData?.studentId && submissionData?.performanceId) {
      navigate(`/teacher/evaluate/${submissionData.studentId}/${submissionData.performanceId}`);
    } else if (submissionData?.studentId) {
      navigate(`/teacher/evaluate/${submissionData.studentId}`);
    } else {
      navigate('/teacher/students');
    }
  };

  return (
    <div className={oex.root}>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />

      <header className={oex.hero}>
        <div className={oex.heroLeft} />
        <div className={oex.heroBrand}>
          <div className={oex.heroIcon}>
            <ShieldAlert size={22} />
          </div>
          <h1 className={oex.heroTitle}>
            Live proctoring
            <span>· EvalAI</span>
          </h1>
        </div>
        <div className={oex.heroRight}>
          <span className={oex.pill}>
            <span className={`${oex.pillDot} ${studentConnected ? oex.pillDotLive : ''}`} />
            {studentConnected ? 'Student connected' : 'Waiting for student'}
          </span>
          <button
            type="button"
            className={`${oex.btnHeader} ${examStatus === 'submitted' ? oex.btnHeaderSuccess : ''}`}
            onClick={handleEndExam}
          >
            <LogOut size={18} />
            {examStatus === 'submitted' ? 'Grade exam' : 'Leave session'}
          </button>
        </div>
      </header>

      <div className={oex.shell}>
        <div className={oex.gridTeacher}>
          <div className={oex.teacherMonitors}>
            <div className={`${oex.monitor} ${oex.teacherMonitorFlex}`}>
              <div className={oex.monitorLabel}>
                <Video size={14} strokeWidth={2.5} /> Student camera
                {remoteStreams.length > 0 ? <span style={{ color: 'var(--green)' }}> · LIVE</span> : null}
              </div>
              <video ref={videoRef1} autoPlay playsInline className={oex.videoContain} />
              {remoteStreams.length === 0 && (
                <div className={oex.placeholder}>
                  <Video size={44} style={{ opacity: 0.45 }} />
                  <span>No video yet</span>
                </div>
              )}
            </div>

            <div className={`${oex.monitor} ${oex.teacherMonitorFlex}`}>
              <div className={oex.monitorLabel}>
                <MonitorUp size={14} strokeWidth={2.5} /> Student screen
                {remoteStreams.length > 1 ? <span style={{ color: 'var(--green)' }}> · LIVE</span> : null}
              </div>
              <video ref={videoRef2} autoPlay playsInline className={oex.videoContain} />
              {remoteStreams.length <= 1 && (
                <div className={oex.placeholder}>
                  <MonitorUp size={44} style={{ opacity: 0.45 }} />
                  <span>No screen share</span>
                </div>
              )}
            </div>
          </div>

          <div className={oex.stack}>
            <div className={`${oex.card} ${oex.cardPad}`}>
              <h3 className={oex.sectionTitle}>
                <span className={oex.sectionIcon}>
                  <Activity size={18} color="var(--primary)" />
                </span>
                Exam task
              </h3>
              <div className={oex.formStack}>
                <div>
                  <div className={oex.label}>Task title</div>
                  <input
                    type="text"
                    id="taskTitle"
                    className={oex.input}
                    placeholder="e.g. B2 oral — Part 2"
                    defaultValue="B2 ORAL: Part 2"
                  />
                </div>
                <div>
                  <div className={oex.label}>Prompt / topic</div>
                  <textarea
                    id="taskDesc"
                    className={oex.textarea}
                    rows={4}
                    placeholder="Describe what the student should talk about..."
                    defaultValue="Look at the image and give a structured 2-minute opinion on the topic your teacher sets. Focus on clarity, argument, and examples."
                  />
                </div>
                <button
                  type="button"
                  className={`${oex.sendPrompt} ${studentConnected ? oex.sendPromptOn : oex.sendPromptOff}`}
                  disabled={!studentConnected}
                  onClick={() => {
                    const title = document.getElementById('taskTitle')?.value;
                    const description = document.getElementById('taskDesc')?.value;
                    socket.emit('examEvent', { roomId, type: 'set_prompt', payload: { title, description } });
                    setToast({ message: 'Prompt sent to the student.', type: 'success' });
                  }}
                >
                  {studentConnected ? 'Send prompt to student' : 'Waiting for student…'}
                </button>
              </div>
            </div>

            <div className={`${oex.card} ${oex.cardPad}`}>
              <h3 className={oex.sectionTitle}>
                <span className={oex.sectionIcon}>
                  <Activity size={18} color="var(--primary)" />
                </span>
                Session
              </h3>
              <div className={oex.label}>Room ID</div>
              <div className={oex.roomBox}>{roomId}</div>
              <div style={{ marginTop: '1rem' }}>
                <div className={oex.label}>Status</div>
                <div
                  className={`${oex.statusPill} ${
                    examStatus === 'submitted' ? oex.statusDone : oex.statusWait
                  }`}
                >
                  {examStatus === 'submitted' && <CheckCircle size={16} strokeWidth={2.5} />}
                  {String(examStatus).replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            {examStatus === 'submitted' && (
              <div className={oex.successCard}>
                <h3 className={oex.successTitle}>
                  <CheckCircle size={22} strokeWidth={2.5} /> Exam completed
                </h3>
                <p className={oex.successText}>
                  The student submitted their recording. Use <strong style={{ color: 'var(--text-primary)' }}>Grade exam</strong>{' '}
                  in the header to open evaluation with their performance.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherOnlineExamRoom;
