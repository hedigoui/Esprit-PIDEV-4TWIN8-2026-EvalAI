import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { oralPerformanceService } from '../services/oralPerformance.service';
import { Mic, Camera, MonitorUp, LogOut, CheckCircle, VideoOff, MicOff, AlertCircle } from 'lucide-react';
import AudioVisualizer from '../../components/AudioVisualizer';
import Toast from '../../components/Toast';
import oex from '../../styles/onlineExam.module.css';

const StudentOnlineExamRoom = () => {
  const { roomId } = useParams();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [examStatus, setExamStatus] = useState('waiting');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [screenActive, setScreenActive] = useState(false);
  const [mediaError, setMediaError] = useState('');

  const cameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const {
    isRecording,
    audioBlob,
    formattedTime,
    startRecording,
    stopRecording,
  } = useAudioRecorder();

  const peerConnectionRef = useRef(null);
  const cameraSenderRef = useRef(null);
  const screenSenderRef = useRef(null);

  const [taskPrompt, setTaskPrompt] = useState({
    title: 'Waiting for teacher...',
    description: 'The teacher will assign your exam prompt here shortly. Please wait.',
  });

  const [toast, setToast] = useState({ message: '', type: '' });

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
      if (data.type === 'teacher_joined') {
        // If a teacher joins, tell them I'm here and send my current status
        socket.emit('examEvent', { roomId, type: 'student_joined', payload: {
          status: examStatus,
          isRecording
        } });
      }
      if (data.type === 'sync_request') {
        // Respond to sync requests with current state
        socket.emit('examEvent', { roomId, type: 'status_update', payload: { status: examStatus } });
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
      if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
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

  const handleToggleCamera = async () => {
    if (cameraActive) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
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
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
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
      setToast({ message: 'Please record an audio first.', type: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      const userStr = localStorage.getItem('user');
      const studentId = userStr ? JSON.parse(userStr).id : null;

      if (!studentId) throw new Error('Student not found');

      const timeParts = formattedTime.split(':');
      const rawSeconds = parseInt(timeParts[0] || '0', 10) * 60 + parseInt(timeParts[1] || '0', 10);
      const durationInSeconds = Math.max(1, rawSeconds);

      const newPerformance = await oralPerformanceService.create({
        studentId,
        title: 'Live Online Exam',
        description: 'Submitted from Online Exam Room',
      });

      const completePerformance = await oralPerformanceService.uploadAudio(
        newPerformance._id,
        audioBlob,
        durationInSeconds,
      );

      updateStatus('submitted', {
        performanceId: completePerformance._id,
        studentId,
      });

      setToast({ message: 'Exam submitted successfully!', type: 'success' });
      setTimeout(() => navigate('/student/dashboard'), 2000);
    } catch (error) {
      console.error('Failed to submit exam', error);
      setToast({
        message: `Failed to submit exam: ${error.message || 'Unknown error'}`,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusLabel =
    examStatus === 'in_progress'
      ? 'Recording'
      : examStatus === 'submitted'
        ? 'Submitted'
        : examStatus === 'recording_stopped'
          ? 'Review & submit'
          : 'Waiting';

  return (
    <div className={oex.root}>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />

      <header className={oex.hero}>
        <div className={oex.heroLeft}>
          <button
            type="button"
            className={oex.btnHeader}
            style={{ background: 'rgba(255,255,255,0.12)', boxShadow: 'none' }}
            onClick={() => navigate('/student/dashboard')}
            aria-label="Back to dashboard"
          >
            <LogOut size={18} />
          </button>
        </div>
        <div className={oex.heroBrand}>
          <div className={oex.heroIcon}>
            <Mic size={22} />
          </div>
          <h1 className={oex.heroTitle}>
            Live oral exam
            <span>· EvalAI</span>
          </h1>
        </div>
        <div className={oex.heroRight}>
          <span className={oex.pill}>
            <span className={`${oex.pillDot} ${examStatus === 'in_progress' ? oex.pillDotLive : ''}`} />
            {statusLabel}
          </span>
        </div>
      </header>

      <div className={oex.shell}>
        <div className={oex.gridStudent}>
          <div className={`${oex.card} ${oex.cardPad}`}>
            <div className={oex.label}>Current task</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>
              {taskPrompt.title}
            </div>
            <div className={oex.divider} />
            <div className={oex.label}>Session timer</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
              {formattedTime}
            </div>
            <div className={oex.divider} />
            <div className={oex.label}>Audio level</div>
            <AudioVisualizer isRecording={isRecording} color="var(--primary)" />
            <div className={oex.divider} />
            <div className={oex.label}>Room</div>
            <div className={oex.roomBox}>{roomId}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={`${oex.monitor} ${oex.monitorTall}`}>
              <div className={oex.monitorLabel}>Your camera</div>
              <div className={oex.badgeRow}>
                <div className={`${oex.badge} ${oex.badgeGreen}`}>
                  <CheckCircle size={14} strokeWidth={3} />
                </div>
                <div className={`${oex.badge} ${cameraActive ? oex.badgeGreen : oex.badgeDark}`}>
                  {cameraActive ? <Camera size={14} strokeWidth={2.5} /> : <VideoOff size={14} strokeWidth={2.5} />}
                </div>
                <div className={`${oex.badge} ${isRecording ? oex.badgeRec : oex.badgeDark}`}>
                  {isRecording ? <Mic size={14} strokeWidth={2.5} /> : <MicOff size={14} strokeWidth={2.5} />}
                </div>
              </div>
              <video
                ref={cameraVideoRef}
                autoPlay
                playsInline
                muted
                className={oex.videoFill}
                style={{ display: cameraActive ? 'block' : 'none' }}
              />
              {!cameraActive && (
                <div className={oex.placeholder}>
                  <VideoOff size={44} style={{ opacity: 0.5 }} />
                  <span>Camera off</span>
                </div>
              )}
            </div>

            <div className={oex.notice}>
              <AlertCircle size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                Wait for your teacher to send the task. When you are ready, record your answer, then submit.{' '}
                {mediaError ? <strong style={{ color: 'var(--primary)' }}>{mediaError}</strong> : null}
              </span>
            </div>

            <div className={oex.controls}>
              <button
                type="button"
                className={`${oex.ctrlBtn} ${isRecording ? `${oex.ctrlBtnActive}` : ''}`}
                onClick={handleToggleRecording}
              >
                <Mic size={26} />
                <div className={oex.ctrlLines}>
                  <div className={oex.ctrlTitle}>{isRecording ? 'Stop' : 'Record'}</div>
                  <div className={oex.ctrlSub}>VOICE</div>
                </div>
              </button>
              <button
                type="button"
                className={`${oex.ctrlBtn} ${cameraActive ? oex.ctrlBtnAccent : ''}`}
                onClick={handleToggleCamera}
              >
                <Camera size={26} color={cameraActive ? 'var(--primary)' : 'var(--text-secondary)'} />
                <div className={oex.ctrlLines}>
                  <div className={oex.ctrlTitle}>{cameraActive ? 'Close' : 'Open'}</div>
                  <div className={oex.ctrlSub}>CAMERA</div>
                </div>
              </button>
              <button
                type="button"
                className={`${oex.ctrlBtn} ${screenActive ? oex.ctrlBtnAccent : ''}`}
                onClick={handleToggleScreen}
              >
                <MonitorUp size={26} color={screenActive ? 'var(--primary)' : 'var(--text-secondary)'} />
                <div className={oex.ctrlLines}>
                  <div className={oex.ctrlTitle}>{screenActive ? 'Stop' : 'Share'}</div>
                  <div className={oex.ctrlSub}>SCREEN</div>
                </div>
              </button>
              <div className={oex.previewShell}>
                <div className={oex.previewBanner}>
                  SCREEN PREVIEW
                  {screenActive ? <span style={{ color: 'var(--green)' }}> · LIVE</span> : null}
                </div>
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={oex.videoContain}
                  style={{ display: screenActive ? 'block' : 'none', marginTop: 28 }}
                />
                {!screenActive && (
                  <div className={oex.placeholder} style={{ marginTop: 28 }}>
                    No screen share
                  </div>
                )}
              </div>
            </div>

            {audioBlob && !isRecording && (
              <button type="button" className={oex.submitBtn} onClick={handleSubmitTest} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Finalize & submit'}
              </button>
            )}
          </div>

          <div className={oex.card}>
            <div className={oex.cardHeader}>Task prompt</div>
            <div className={oex.taskBody}>
              <div className={oex.taskTitle}>{taskPrompt.title}</div>
              <div className={oex.taskDesc}>{taskPrompt.description}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentOnlineExamRoom;
