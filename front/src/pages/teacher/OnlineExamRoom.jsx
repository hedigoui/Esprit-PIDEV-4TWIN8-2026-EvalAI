import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { ShieldAlert, Video, MonitorUp, Activity, CheckCircle, LogOut } from 'lucide-react';
import Toast from '../../components/Toast';

const TeacherOnlineExamRoom = () => {
  const { roomId } = useParams();
  const { socket } = useSocket();
  const navigate = useNavigate();
  
  const [studentConnected, setStudentConnected] = useState(false);
  const [examStatus, setExamStatus] = useState('waiting');
  const [submissionData, setSubmissionData] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });
  
  // WebRTC & Media
  const peerConnectionRef = useRef(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  
  // Refs for video elements (up to 2 streams: camera and screen)
  const videoRef1 = useRef(null);
  const videoRef2 = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Initialize WebRTC
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('examEvent', { roomId, type: 'webrtc_ice_candidate', payload: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      setRemoteStreams(prev => {
        // Prevent duplicate streams
        if (prev.some(s => s.id === stream.id)) return prev;
        return [...prev, stream];
      });
    };

    socket.emit('joinExamRoom', { roomId });

    socket.on('examEventReceived', async (data) => {
      if (data.type === 'student_joined') setStudentConnected(true);
      
      if (data.type === 'status_update') {
        setExamStatus(data.payload.status);
        if (data.payload.status === 'submitted') {
          setSubmissionData({
            performanceId: data.payload.performanceId,
            studentId: data.payload.studentId
          });
        }
      }

      // WebRTC Signaling
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
      pc.close();
    };
  }, [socket, roomId]);

  // Attach streams to video elements when remoteStreams update
  useEffect(() => {
    if (remoteStreams[0] && videoRef1.current) {
      videoRef1.current.srcObject = remoteStreams[0];
    }
    if (remoteStreams[1] && videoRef2.current) {
      videoRef2.current.srcObject = remoteStreams[1];
    }
  }, [remoteStreams]);

  const handleEndExam = () => {
    if (submissionData && submissionData.studentId && submissionData.performanceId) {
      navigate(`/teacher/evaluate/${submissionData.studentId}/${submissionData.performanceId}`);
    } else if (submissionData && submissionData.studentId) {
      navigate(`/teacher/evaluate/${submissionData.studentId}`);
    } else {
      navigate('/teacher/students');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', fontFamily: 'sans-serif' }}>
      
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />

      {/* Top Header */}
      <header style={{ 
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', 
        padding: '1rem 2.5rem', borderBottom: '1px solid var(--border-light)', 
        background: 'var(--bg-card)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div /> {/* Empty left column for grid balance */}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', justifyContent: 'center' }}>
          <div style={{ background: 'var(--primary-soft)', color: 'var(--primary)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
            <ShieldAlert size={24} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>Live Proctoring Dashboard</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', justifyContent: 'flex-end' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '0.6rem', 
            background: 'var(--bg-main)', border: '1px solid var(--border-light)', 
            padding: '0.5rem 1rem', borderRadius: '20px' 
          }}>
            <div style={{ 
              width: 10, height: 10, borderRadius: '50%', 
              background: studentConnected ? 'var(--green)' : 'var(--text-muted)', 
              boxShadow: studentConnected ? '0 0 10px rgba(34,197,94,0.5)' : 'none' 
            }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {studentConnected ? 'Student Connected' : 'Waiting...'}
            </span>
          </div>
          <button 
            onClick={handleEndExam}
            style={{ 
              background: examStatus === 'submitted' ? 'linear-gradient(135deg, var(--green), #16a34a)' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))', 
              color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0.6rem 1.25rem',
              fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: examStatus === 'submitted' ? '0 4px 15px rgba(34,197,94,0.3)' : 'var(--shadow-md)',
              transition: 'all var(--transition-fast)'
            }}
          >
            <LogOut size={18} />
            {examStatus === 'submitted' ? 'Grade Exam' : 'End Exam'}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div style={{ 
        padding: '2rem 2.5rem', display: 'grid', gridTemplateColumns: '1fr 340px', 
        gap: '2rem', maxWidth: '1800px', margin: '0 auto', height: 'calc(100vh - 80px)' 
      }}>
        
        {/* Security Monitors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
          
          {/* Monitor 1 */}
          <div style={{ 
            flex: 1, background: '#000', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-card)', 
            position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 10 }}>
              <Video size={14} strokeWidth={2.5} /> EXAMINEE CAMERA {remoteStreams.length > 0 && <span style={{ color: 'var(--green)' }}>• LIVE</span>}
            </div>
            
            <video 
              ref={videoRef1} 
              autoPlay 
              playsInline 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            {remoteStreams.length === 0 && <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}><Video size={48} opacity={0.5} /><span style={{ fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.85rem' }}>No signal</span></div>}
          </div>

          {/* Monitor 2 */}
          <div style={{ 
            flex: 1, background: '#000', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-card)', 
            position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 10 }}>
              <MonitorUp size={14} strokeWidth={2.5} /> EXAMINEE SCREEN {remoteStreams.length > 1 && <span style={{ color: 'var(--green)' }}>• LIVE</span>}
            </div>
            
            <video 
              ref={videoRef2} 
              autoPlay 
              playsInline 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            {remoteStreams.length <= 1 && <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}><MonitorUp size={48} opacity={0.5} /><span style={{ fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.85rem' }}>No signal</span></div>}
          </div>

        </div>

        {/* Right Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Task Setup Card */}
          <div style={{ 
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', 
            border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-md)', backdropFilter: 'blur(20px)' 
          }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ background: 'var(--primary-soft)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                <Activity size={18} color="var(--primary)" />
              </div>
              Exam Task Setup
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Task Title</label>
                <input 
                  type="text" 
                  id="taskTitle"
                  placeholder="e.g. B2 ORAL: Part 2"
                  defaultValue="B2 ORAL: Part 2"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontWeight: 600 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Task Description (Sujet)</label>
                <textarea 
                  id="taskDesc"
                  placeholder="Enter the prompt or topic for the student to talk about..."
                  rows={4}
                  defaultValue="Look at the provided image carefully. Imagine you are presenting your opinion on the environmental impact of renewable energy sources to a panel of experts. Prepare a 2-minute talk highlighting the pros and cons."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-main)', color: 'var(--text-primary)', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
              <button 
                onClick={() => {
                  const title = document.getElementById('taskTitle').value;
                  const description = document.getElementById('taskDesc').value;
                  socket.emit('examEvent', { roomId, type: 'set_prompt', payload: { title, description } });
                  setToast({ message: "Prompt sent to student!", type: 'success' });
                }}
                disabled={!studentConnected}
                style={{ 
                  background: studentConnected ? 'var(--primary)' : 'var(--border-light)', 
                  color: studentConnected ? 'white' : 'var(--text-muted)', 
                  border: 'none', borderRadius: 'var(--radius-sm)', padding: '0.75rem',
                  fontWeight: '700', cursor: studentConnected ? 'pointer' : 'not-allowed',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {studentConnected ? 'Send Prompt to Student' : 'Waiting for student...'}
              </button>
            </div>
          </div>

          {/* Status Card */}
          <div style={{ 
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', 
            border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-md)', backdropFilter: 'blur(20px)' 
          }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ background: 'var(--primary-soft)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                <Activity size={18} color="var(--primary)" />
              </div>
              Session Info
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Room ID</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 600, background: 'var(--bg-main)', border: '1px solid var(--border-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>{roomId}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Exam Status</div>
                <div style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
                  background: examStatus === 'submitted' ? 'rgba(34,197,94,0.1)' : 'var(--primary-soft)',
                  color: examStatus === 'submitted' ? 'var(--green)' : 'var(--primary)',
                  padding: '0.6rem 1rem', borderRadius: '20px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.05em'
                }}>
                  {examStatus === 'submitted' && <CheckCircle size={16} strokeWidth={2.5} />}
                  {examStatus.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>

          {/* Alerts Card */}
          {examStatus === 'submitted' && (
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: '0 4px 20px rgba(34,197,94,0.1)' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                <CheckCircle size={22} strokeWidth={2.5} /> Exam Completed
              </h3>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                The student has successfully submitted their final recording. The live session is over. Click <strong style={{ color: 'var(--text-primary)' }}>"Grade Exam"</strong> to proceed to the AI evaluation.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TeacherOnlineExamRoom;
