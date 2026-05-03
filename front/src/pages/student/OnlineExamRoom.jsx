import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { oralPerformanceService } from '../services/oralPerformance.service';
import { Mic, Camera, MonitorUp, LogOut, CheckCircle, VideoOff, MicOff, AlertCircle } from 'lucide-react';
import AudioVisualizer from '../../components/AudioVisualizer';
import Toast from '../../components/Toast';


const StudentOnlineExamRoom = () => {
  const { roomId } = useParams();
  const { socket } = useSocket();
  const navigate = useNavigate();
  
  const [examStatus, setExamStatus] = useState('waiting');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Media states
  const [cameraActive, setCameraActive] = useState(false);
  const [screenActive, setScreenActive] = useState(false);
  const [mediaError, setMediaError] = useState('');
  
  // Refs for video elements
  const cameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const {
    isRecording,
    audioBlob,
    audioUrl,
    formattedTime,
    startRecording,
    stopRecording,
  } = useAudioRecorder();

  // WebRTC
  const peerConnectionRef = useRef(null);
  const cameraSenderRef = useRef(null);
  const screenSenderRef = useRef(null);

  const [taskPrompt, setTaskPrompt] = useState({
    title: 'Waiting for teacher...',
    description: 'The teacher will assign your exam prompt here shortly. Please wait.'
  });

  const [toast, setToast] = useState({ message: '', type: '' });

  // Socket & WebRTC Init
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

    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('examEvent', { roomId, type: 'webrtc_offer', payload: pc.localDescription });
      } catch (err) {
        console.error('Error negotiating WebRTC:', err);
      }
    };

    socket.emit('joinExamRoom', { roomId });
    socket.emit('examEvent', { roomId, type: 'student_joined', payload: {} });

    socket.on('examEventReceived', async (data) => {
      if (data.type === 'set_prompt') {
        setTaskPrompt(data.payload);
      }
      if (data.type === 'webrtc_answer') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.payload));
        } catch (err) {
          console.error('Error setting remote description:', err);
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
      if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach(t => t.stop());
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop());
      pc.close();
    };
  }, [socket, roomId]);

  const updateStatus = (status, payload = {}) => {
    setExamStatus(status);
    socket?.emit('examEvent', { roomId, type: 'status_update', payload: { status, ...payload } });
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
      updateStatus('recording_stopped');
    } else {
      startRecording();
      updateStatus('in_progress');
    }
  };

  // Media Capture Logic
  const handleToggleCamera = async () => {
    if (cameraActive) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (cameraSenderRef.current && peerConnectionRef.current) {
        peerConnectionRef.current.removeTrack(cameraSenderRef.current);
        cameraSenderRef.current = null;
      }
      if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
      setCameraActive(false);
      return;
    }

    try {
      setMediaError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      cameraStreamRef.current = stream;
      
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
      
      // Add track to WebRTC
      if (peerConnectionRef.current) {
        cameraSenderRef.current = peerConnectionRef.current.addTrack(stream.getVideoTracks()[0], stream);
      }
      
      setCameraActive(true);
    } catch (err) {
      console.error(err);
      setMediaError('Could not access camera. Please check permissions.');
    }
  };

  const handleToggleScreen = async () => {
    if (screenActive) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (screenSenderRef.current && peerConnectionRef.current) {
        peerConnectionRef.current.removeTrack(screenSenderRef.current);
        screenSenderRef.current = null;
      }
      if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
      setScreenActive(false);
      return;
    }

    try {
      setMediaError('');
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      
      // Handle user stopping screen share from browser UI
      stream.getVideoTracks()[0].onended = () => {
        setScreenActive(false);
        if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
        if (screenSenderRef.current && peerConnectionRef.current) {
          peerConnectionRef.current.removeTrack(screenSenderRef.current);
          screenSenderRef.current = null;
        }
      };

      screenStreamRef.current = stream;
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }
      
      // Add track to WebRTC
      if (peerConnectionRef.current) {
        screenSenderRef.current = peerConnectionRef.current.addTrack(stream.getVideoTracks()[0], stream);
      }
      
      setScreenActive(true);
    } catch (err) {
      console.error(err);
      setMediaError('Screen sharing was cancelled or denied.');
    }
  };

  const handleSubmitTest = async () => {
    if (!audioBlob) {
      setToast({ message: "Please record an audio first.", type: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      const userStr = localStorage.getItem('user');
      const studentId = userStr ? JSON.parse(userStr).id : null;

      if (!studentId) throw new Error("Student not found");

      const timeParts = formattedTime.split(':');
      const rawSeconds = parseInt(timeParts[0] || '0', 10) * 60 + parseInt(timeParts[1] || '0', 10);
      const durationInSeconds = Math.max(1, rawSeconds);

      const newPerformance = await oralPerformanceService.create({
        studentId: studentId,
        title: 'Live Online Exam',
        description: 'Submitted from Online Exam Room',
      });

      const completePerformance = await oralPerformanceService.uploadAudio(
        newPerformance._id,
        audioBlob,
        durationInSeconds
      );

      updateStatus('submitted', { 
        performanceId: completePerformance._id,
        studentId: studentId 
      });

      setToast({ message: "Exam submitted successfully!", type: 'success' });
      setTimeout(() => navigate('/student/dashboard'), 2000);

    } catch (error) {
      console.error("Failed to submit exam", error);
      setToast({ message: "Failed to submit exam: " + (error.message || "Unknown error"), type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      
      {/* Top Navigation */}
      <header style={{ 
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', 
        padding: '1rem 2.5rem', borderBottom: '1px solid var(--border-light)', 
        background: 'var(--bg-card)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div /> {/* Empty left column for grid balance */}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', justifyContent: 'center' }}>
          <div style={{ background: 'var(--primary-soft)', color: 'var(--primary)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
            <Mic size={22} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>EvalAI</h1>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => navigate('/student/dashboard')}
            style={{ 
              background: 'var(--primary-soft)', border: 'none', color: 'var(--primary)', 
              cursor: 'pointer', padding: '0.6rem', borderRadius: 'var(--radius-sm)',
              transition: 'all var(--transition-fast)'
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'white'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'var(--primary-soft)'; e.currentTarget.style.color = 'var(--primary)'; }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: '260px 1fr 320px', gap: '1.5rem', 
        padding: '2rem 2.5rem', maxWidth: '1600px', margin: '0 auto' 
      }}>
        
        {/* Left Sidebar */}
        <div style={{ 
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', 
          border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-md)',
          backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content' 
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Current Task</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Part 2 <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>(Active)</span></div>
          </div>
          <div style={{ height: '1px', background: 'var(--border-light)' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Time Remaining</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{formattedTime}</div>
          </div>
          <div style={{ height: '1px', background: 'var(--border-light)' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Audio Level</div>
            <AudioVisualizer isRecording={isRecording} color="var(--primary)" />
          </div>
          <div style={{ height: '1px', background: 'var(--border-light)' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Exam Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: examStatus === 'in_progress' ? 'var(--primary)' : 'var(--text-secondary)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: examStatus === 'in_progress' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: examStatus === 'in_progress' ? 'var(--shadow-glow)' : 'none' }} />
              (B2 LEVEL) - {examStatus === 'in_progress' ? 'Recording' : 'Waiting'}
            </div>
          </div>
        </div>

        {/* Center Panel (Media) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Main Camera View */}
          <div style={{ 
            background: 'var(--bg-card-solid)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative', 
            height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-card)'
          }}>
            <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', zIndex: 10, fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(10px)', borderRadius: '20px' }}>
              Examinee Camera
            </div>
            
            {/* Status Overlays */}
            <div style={{ position: 'absolute', top: '3.5rem', left: '1.25rem', zIndex: 10, display: 'flex', gap: '0.5rem' }}>
              <div style={{ background: 'var(--green)', color: 'white', padding: '0.4rem', borderRadius: '50%', boxShadow: '0 2px 10px rgba(34,197,94,0.3)' }}><CheckCircle size={14} strokeWidth={3} /></div>
              <div style={{ background: cameraActive ? 'var(--green)' : 'rgba(0,0,0,0.5)', color: 'white', padding: '0.4rem', borderRadius: '50%', backdropFilter: 'blur(5px)', transition: 'all 0.3s' }}>
                {cameraActive ? <Camera size={14} strokeWidth={2.5} /> : <VideoOff size={14} strokeWidth={2.5} />}
              </div>
              <div style={{ background: isRecording ? 'var(--primary)' : 'rgba(0,0,0,0.5)', color: 'white', padding: '0.4rem', borderRadius: '50%', backdropFilter: 'blur(5px)', transition: 'all 0.3s', boxShadow: isRecording ? 'var(--shadow-glow)' : 'none' }}>
                {isRecording ? <Mic size={14} strokeWidth={2.5} /> : <MicOff size={14} strokeWidth={2.5} />}
              </div>
            </div>

            <video 
              ref={cameraVideoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraActive ? 'block' : 'none' }}
            />
            {!cameraActive && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                <VideoOff size={48} opacity={0.5} />
                <span style={{ fontWeight: 500 }}>Camera is disabled</span>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div style={{ background: 'var(--primary-soft)', border: '1px solid rgba(227,24,55,0.2)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>
            <AlertCircle size={20} color="var(--primary)" />
            Next Task in 3 mins. Preparing automatic screen review...
            {mediaError && <span style={{ color: 'var(--primary)', marginLeft: 'auto', fontWeight: 'bold' }}>{mediaError}</span>}
          </div>

          {/* Bottom Control Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem' }}>
            
            <button 
              onClick={handleToggleRecording}
              style={{ 
                background: isRecording ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'var(--bg-card)', 
                border: isRecording ? 'none' : '1px solid var(--border-light)', 
                borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
                cursor: 'pointer', color: isRecording ? 'white' : 'var(--primary)', transition: 'all var(--transition-smooth)',
                boxShadow: isRecording ? 'var(--shadow-glow)' : 'var(--shadow-sm)'
              }}
            >
              <Mic size={28} />
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{isRecording ? 'STOP' : 'SAVE MY VOICE'}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 600, letterSpacing: '0.05em' }}>RECORDING</div>
              </div>
            </button>

            <button 
              onClick={handleToggleCamera}
              style={{ 
                background: cameraActive ? 'var(--primary-soft)' : 'var(--bg-card)', 
                border: cameraActive ? '1px solid var(--primary)' : '1px solid var(--border-light)', 
                borderRadius: 'var(--radius-md)', padding: '1.25rem', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
                cursor: 'pointer', color: 'var(--text-primary)', transition: 'all var(--transition-fast)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Camera size={28} color={cameraActive ? 'var(--primary)' : 'var(--text-secondary)'} />
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{cameraActive ? 'CLOSE' : 'OPEN'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>CAMERA</div>
              </div>
            </button>

            <button 
              onClick={handleToggleScreen}
              style={{ 
                background: screenActive ? 'var(--primary-soft)' : 'var(--bg-card)', 
                border: screenActive ? '1px solid var(--primary)' : '1px solid var(--border-light)', 
                borderRadius: 'var(--radius-md)', padding: '1.25rem', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
                cursor: 'pointer', color: 'var(--text-primary)', transition: 'all var(--transition-fast)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <MonitorUp size={28} color={screenActive ? 'var(--primary)' : 'var(--text-secondary)'} />
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{screenActive ? 'STOP' : 'SHARE'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>SCREEN</div>
              </div>
            </button>

            {/* Screen Preview */}
            <div style={{ 
              background: '#000', borderRadius: 'var(--radius-md)', width: '180px', height: '100%', 
              display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
              boxShadow: 'var(--shadow-md)', border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', color: 'white', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', padding: '0.4rem', textAlign: 'center', position: 'absolute', top: 0, width: '100%', zIndex: 10 }}>
                VIEW SCREEN {screenActive && <span style={{ color: 'var(--green)' }}>• LIVE</span>}
              </div>
              <video 
                ref={screenVideoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: screenActive ? 'block' : 'none' }}
              />
              {!screenActive && <div style={{ margin: 'auto', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 500 }}>No Signal</div>}
            </div>

          </div>

          {/* Submit Test Button */}
          {audioBlob && !isRecording && (
            <button
              onClick={handleSubmitTest}
              disabled={isSubmitting}
              style={{
                width: '100%', padding: '1.25rem', background: 'linear-gradient(135deg, var(--green), #16a34a)', 
                color: 'white', border: 'none', borderRadius: 'var(--radius-md)',
                fontWeight: '700', fontSize: '1.1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                marginTop: '0.5rem', boxShadow: '0 4px 15px rgba(34,197,94,0.3)', transition: 'all var(--transition-fast)'
              }}
            >
              {isSubmitting ? 'Submitting Test securely...' : 'Finalize & Submit Test'}
            </button>
          )}

        </div>

        {/* Right Sidebar */}
        <div style={{ 
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-card)', 
          boxShadow: 'var(--shadow-md)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', 
          height: 'fit-content', overflow: 'hidden' 
        }}>
          <div style={{ background: 'var(--primary-soft)', color: 'var(--primary)', padding: '1rem 1.5rem', fontWeight: '700', fontSize: '0.9rem', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-light)' }}>
            TASK PROMPT
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{taskPrompt.title}</div>
            <div style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              {taskPrompt.description}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentOnlineExamRoom;
