// src/pages/student/Practice.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentSidebar from '../../components/StudentSidebar';
import TopNavbar from '../../components/TopNavbar';
import AiDisclosureNotice from '../../components/AiDisclosureNotice';
import { Upload, Bot, Mic, MicOff, CheckCircle, XCircle, Loader, Send, RotateCcw, BarChart3, Sparkles, BookOpen } from 'lucide-react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useEvaluation } from '../../hooks/useEvaluation';
import { oralPerformanceService } from '../services/oralPerformance.service';
import type { EvaluationResult } from '../services/oralPerformance.service';
import { deriveCefrLevel, holisticOralIndex, indexToCefr } from '../../utils/cefrCalibration';

// @ts-ignore
import styles from '../../styles/shared.module.css';
// @ts-ignore
import evaluateStyles from '../teacher/Evaluate.module.css';

interface Performance {
  _id: string;
  studentId?: string;
  title?: string;
  description?: string;
  audioFile?: { fileId: string; filename: string; size: number; duration?: number; mimeType: string; uploadedAt: string };
  status?: string;
  createdAt?: string;
  totalScore?: number;
  feedback?: { generalComments?: string; cefrLevel?: string };
  scores?: Record<string, number | undefined>;
}

interface HistoryRow {
  performance: Performance & { _id?: string; id?: string };
  evaluation?: EvaluationResult | null;
}

function perfId(p: Performance | HistoryRow['performance'] | null | undefined): string {
  if (!p) return '';
  const x = p as { _id?: string; id?: string };
  return (x._id || x.id || '') as string;
}

function getAudioDurationSeconds(blob: Blob): Promise<number> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(blob);
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => { URL.revokeObjectURL(url); const d = audio.duration; resolve(Number.isFinite(d) && d > 0 ? Math.round(d) : 60); };
    audio.onerror = () => { URL.revokeObjectURL(url); resolve(60); };
    audio.src = url;
  });
}

const getStudentIdFromToken = (): string => {
  const token = localStorage.getItem('token');
  if (!token) return '';
  try { const payload = JSON.parse(atob(token.split('.')[1])); return payload.sub || ''; } catch { return ''; }
};

const Practice: React.FC = () => {
  const navigate = useNavigate();
  const studentId = getStudentIdFromToken();

  const [recordMode, setRecordMode] = useState<'upload' | 'record'>('record');
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [subject, setSubject] = useState('');
  const [evaluationLanguage, setEvaluationLanguage] = useState<string>('en');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [recordingPrepared, setRecordingPrepared] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState('');

  const { isRecording, audioBlob, audioUrl, error: recordingError, formattedTime, recordingTime, startRecording, stopRecording, resetRecording, loadExternalAudio } = useAudioRecorder();
  const { evaluation, isLoading: evaluationLoading, error: evaluationError, startEvaluation, fetchEvaluation, stopPolling } = useEvaluation({ performanceId: performance?._id || '', autoPoll: true });

  const loadSubmissionHistory = useCallback(async () => {
    if (!studentId) return;
    try {
      setHistoryLoading(true);
      const list = await oralPerformanceService.getAllStudentEvaluations(studentId);
      const rows = Array.isArray(list) ? list : [];
      rows.sort((a, b) => new Date(b.performance?.createdAt || 0).getTime() - new Date(a.performance?.createdAt || 0).getTime());
      setSubmissionHistory(rows as HistoryRow[]);
    } catch (e) { console.error(e); }
    finally { setHistoryLoading(false); }
  }, [studentId]);

  useEffect(() => { if (!studentId) { navigate('/', { replace: true }); return; } loadSubmissionHistory(); }, [studentId, navigate, loadSubmissionHistory]);
  useEffect(() => { if (performance?._id) { const t = setTimeout(() => fetchEvaluation(), 400); return () => clearTimeout(t); } }, [performance?._id, fetchEvaluation]);

  const calculateWeightedScore = () => {
    if (!evaluation?.speechMetrics) return 0;
    const speechScore = (evaluation.speechMetrics.fluency || 0) * 0.15 + (evaluation.speechMetrics.pronunciation || 0) * 0.15 + Math.min(100, (evaluation.speechMetrics.speakingPace || 0) / 1.8) * 0.1 + (evaluation.speechMetrics.confidence || 0) * 0.1;
    const contentScore = (evaluation.contentScores?.contentStructure || 0) * 0.1 + (evaluation.contentScores?.coherence || 0) * 0.1 + (evaluation.contentScores?.topicRelevance || 0) * 0.1 + (evaluation.contentScores?.grammar || 0) * 0.1 + (evaluation.contentScores?.vocabulary || 0) * 0.1;
    return Math.round(speechScore + contentScore);
  };

  const overallScore = calculateWeightedScore();
  const displayedCEFR = evaluation?.contentAnalysis?.cefrLevel || (evaluation?.contentScores ? deriveCefrLevel(evaluation.contentScores, evaluation.speechMetrics ?? null) : indexToCefr(Math.min(100, Math.max(0, overallScore))));
  const holisticScore = useMemo(() => { if (!evaluation?.contentScores) return 0; return holisticOralIndex(evaluation.contentScores, evaluation.speechMetrics ?? null); }, [evaluation]);

  const selectedRow = useMemo(() => submissionHistory.find(r => perfId(r.performance) === selectedHistoryId) || null, [submissionHistory, selectedHistoryId]);

  const handleHistorySelection = async (historyId: string): Promise<void> => {
    setSelectedHistoryId(historyId);
    if (!historyId) return;
    const row = submissionHistory.find(r => perfId(r.performance) === historyId);
    if (!row) return;
    try {
      const full = await oralPerformanceService.getPerformance(historyId);
      setPerformance(full as Performance); setSubject((full as Performance).title || '');
      setRecordingPrepared(false); resetRecording();
      setShowEvaluationForm(Boolean((full as Performance).audioFile));
    } catch (e) { console.error(e); setPerformance(row.performance as Performance); setSubject(row.performance.title || ''); setShowEvaluationForm(Boolean(row.performance.audioFile)); }
  };

  const handleNewPractice = (): void => {
    stopPolling(); resetRecording(); setPerformance(null); setSubject(''); setSelectedHistoryId('');
    setRecordingPrepared(false); setShowEvaluationForm(false); setUploadError(null); setUploadSuccess(false); setIsEvaluating(false);
  };

  const handleUploadRecording = (): void => {
    if (!audioBlob) return;
    setUploadError(null); setRecordingPrepared(true); setShowEvaluationForm(true);
    setUploadSuccess(true); setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setUploadError(null);
      const blob = file.slice(0, file.size, file.type || 'audio/webm');
      const dur = await getAudioDurationSeconds(blob);
      loadExternalAudio(blob, dur);
      setRecordingPrepared(true); setShowEvaluationForm(true); setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2500);
    } catch (err) { console.error(err); setUploadError('Could not load audio file.'); }
  };

  const handleStartEvaluation = async (): Promise<void> => {
    if (!subject.trim()) { alert('Please enter a topic you practiced.'); return; }
    try {
      setIsEvaluating(true); setUploadError(null);
      let currentPerformance = performance;
      if (!currentPerformance?.audioFile) {
        if (!audioBlob) { alert('Please record or upload audio first.'); return; }
        const durationInSeconds = Math.max(1, recordingTime > 0 ? recordingTime : (() => { const parts = formattedTime.split(':'); return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10); })());
        const created = await oralPerformanceService.create({ studentId, title: subject.trim(), description: 'Practice session' });
        currentPerformance = await oralPerformanceService.uploadAudio(created._id, audioBlob, durationInSeconds) as Performance;
        setPerformance(currentPerformance); setRecordingPrepared(false);
      }
      if (!currentPerformance?._id) { setUploadError('Session is not ready. Try saving your recording again.'); return; }
      await startEvaluation(subject.trim(), currentPerformance._id, evaluationLanguage);
      const refreshed = await oralPerformanceService.getPerformance(currentPerformance._id);
      setPerformance(refreshed as Performance);
      await loadSubmissionHistory();
      setSelectedHistoryId(currentPerformance._id);
    } catch (error) { console.error(error); setUploadError(error instanceof Error ? error.message : 'Failed to start AI feedback.'); }
    finally { setIsEvaluating(false); }
  };

  const showEvaluationError = !!evaluationError && evaluationError !== 'Evaluation not found' && !/no performance id|performance id available/i.test(evaluationError);

  const cardClass = styles?.card || 'card';
  const primaryButtonClass = styles?.primaryButton || 'primary-button';
  const secondaryButtonClass = styles?.secondaryButton || 'secondary-button';
  const evalAny = evaluation as EvaluationResult & { detailedContentFeedback?: { structure?: string; contentGaps?: string[]; vocabularySuggestions?: string[] } };

  return (
    <div className={styles.layout}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}} @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .spin{animation:spin 1s linear infinite} .pr-root{animation:fadeUp 0.3s ease}
        .pr-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap}
        .pr-badge{display:inline-flex;align-items:center;font-size:0.65rem;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:0.12em;background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.15);padding:0.25rem 0.7rem;border-radius:99px;margin-bottom:0.4rem}
        .pr-title{font-size:1.6rem;font-weight:800;color:#0f172a;letter-spacing:-0.03em;line-height:1.2;margin:0 0 0.25rem}
        .pr-subtitle{font-size:0.85rem;color:#64748b;margin:0;max-width:500px;line-height:1.6}
        .pr-actions{display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;flex-shrink:0}
        .pr-alert{display:flex;align-items:center;gap:10px;padding:0.75rem 1rem;border-radius:12px;font-size:0.85rem;font-weight:500;margin-bottom:0.6rem}
        .pr-alert.error{background:#fef2f4;border:1px solid #fecdd3;color:#be123c}
        .pr-alert.success{background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d}
        .pr-alert.warning{background:#fffbeb;border:1px solid #fde68a;color:#92400e}
        .pr-grid{display:grid;grid-template-columns:1fr 360px;gap:1.25rem;align-items:start}
        @media(max-width:1024px){.pr-grid{grid-template-columns:1fr}}
        .pr-card{background:#fff;border-radius:18px;border:1px solid #f1f5f9;box-shadow:0 2px 16px rgba(0,0,0,0.04);overflow:hidden;margin-bottom:1.25rem}
        .pr-card-header{padding:1.25rem 1.5rem;border-bottom:1px solid #f8fafc;display:flex;align-items:center;gap:10px}
        .pr-card-header h3{margin:0;font-size:0.95rem;font-weight:700;color:#0f172a}
        .pr-card-body{padding:1.25rem 1.5rem}
        .pr-mode-tabs{display:flex;gap:6px;padding:1rem 1.5rem 0}
        .pr-mode-tab{flex:1;padding:0.6rem;border-radius:10px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-size:0.82rem;font-weight:600;transition:all 0.2s;background:#f8fafc;color:#64748b}
        .pr-mode-tab:hover{background:#eff6ff;color:#2563eb}
        .pr-mode-tab.active{background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;box-shadow:0 4px 12px rgba(37,99,235,0.3)}
        .pr-record-area{padding:1.5rem;min-height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:1rem}
        .pr-record-icon{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all 0.3s ease}
        .pr-record-icon.idle{background:#f8fafc;color:#94a3b8}
        .pr-record-icon.recording{background:rgba(227,24,55,0.08);color:#E31837;animation:pulse 1.5s infinite}
        .pr-rec-timer{display:flex;align-items:center;gap:8px;background:rgba(227,24,55,0.08);border:1px solid rgba(227,24,55,0.2);padding:0.4rem 0.9rem;border-radius:99px;color:#E31837;font-size:0.85rem;font-weight:700}
        .pr-rec-dot{width:8px;height:8px;border-radius:50%;background:#E31837;animation:pulse 1s infinite}
        .pr-section-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center}
        .pr-ai-hint{margin:0 1.25rem 1rem;padding:0.5rem 0.75rem;background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.15);border-radius:10px;font-size:0.75rem;color:#1d4ed8;display:flex;align-items:center;gap:6px}
        .pr-transcript-box{background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:1rem;font-size:0.88rem;line-height:1.6;color:#334155;max-height:180px;overflow-y:auto}
        .pr-metrics-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:0.75rem}
        .pr-metric-card{background:#f8fafc;border:1px solid #f1f5f9;border-radius:12px;padding:0.85rem}
        .pr-metric-label{font-size:0.72rem;color:#64748b;font-weight:600;margin-bottom:0.25rem}
        .pr-metric-val{font-size:1.3rem;font-weight:800;color:#0f172a}
        .pr-holistic-wrap{display:flex;flex-direction:column;align-items:center;padding:1.25rem;border-top:1px solid #f8fafc;gap:0.4rem}
        .pr-holistic-ring{width:86px;height:86px;border-radius:50%;background:conic-gradient(#2563eb 0% calc(var(--pct)*1%),#f1f5f9 0%);display:flex;align-items:center;justify-content:center;position:relative}
        .pr-holistic-ring::before{content:'';position:absolute;inset:8px;background:#fff;border-radius:50%}
        .pr-holistic-num{position:relative;z-index:1;font-size:1.3rem;font-weight:800;color:#0f172a}
        .pr-narrative-box{background:linear-gradient(135deg,#faf5ff,#f5f3ff);border:1px solid #e9d5ff;border-radius:12px;padding:1rem;font-size:0.85rem;color:#4c1d95;line-height:1.6}
        .pr-details-box{background:#f1f5f9;border-radius:10px;padding:0.75rem;font-size:0.82rem;color:#475569;margin-top:0.75rem}
        .pr-history-card{border:1px solid #f1f5f9;border-radius:12px;padding:0.85rem 1rem;background:#fafafa;font-size:0.8rem;color:#334155;line-height:1.7}
        .pr-progress-card{background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid rgba(37,99,235,0.15);border-radius:16px;padding:1.25rem;text-align:center}
        .pr-select{width:100%;padding:0.75rem 0.9rem;border:1.5px solid #e5e7eb;border-radius:12px;font-size:0.88rem;color:#1f2937;background:#fff;outline:none;cursor:pointer;font-family:inherit;transition:border-color 0.2s}
        .pr-select:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,0.08)}
        .pr-input{width:100%;padding:0.75rem 0.9rem;border:1.5px solid #e5e7eb;border-radius:12px;font-size:0.88rem;color:#1f2937;background:#f9fafb;outline:none;font-family:inherit;transition:all 0.2s}
        .pr-input:focus{border-color:#2563eb;background:#fff;box-shadow:0 0 0 3px rgba(37,99,235,0.08)}
        .pr-ai-loading{display:flex;flex-direction:column;align-items:center;gap:0.75rem;padding:2.5rem 1rem;color:#64748b;font-size:0.88rem}
      `}</style>

      <StudentSidebar />
      <div className={styles.mainContent}>
        <TopNavbar />
        <main className={styles.content}>
          <div className="pr-root">
            {/* Header */}
            <div className="pr-header">
              <div>
                <div className="pr-badge">Student Practice</div>
                <h1 className="pr-title">Practice Session</h1>
                <p className="pr-subtitle">Self-study mode: record a response, run AI analysis, and review your submission history — same feedback layout as in class evaluations.</p>
              </div>
              <div className="pr-actions">
                <button type="button" className={secondaryButtonClass} onClick={handleNewPractice} title="Start a fresh session">
                  <RotateCcw size={16} /> New session
                </button>
                {(recordingPrepared || performance?.audioFile) && (
                  <button type="button" className={primaryButtonClass} onClick={handleStartEvaluation} disabled={isLoading || isEvaluating}>
                    <Send size={16} />
                    {isLoading || isEvaluating ? 'Analyzing…' : 'Start AI Feedback'}
                  </button>
                )}
                <button type="button" className={secondaryButtonClass} onClick={() => navigate('/student/dashboard')}>
                  <BarChart3 size={16} /> Dashboard
                </button>
              </div>
            </div>

            <AiDisclosureNotice />

            {/* Alerts */}
            {uploadError && <div className="pr-alert error"><XCircle size={15} />{uploadError}</div>}
            {uploadSuccess && <div className="pr-alert success"><CheckCircle size={15} />Recording ready. Add a topic and press Start AI Feedback.</div>}
            {showEvaluationError && <div className="pr-alert error"><XCircle size={15} />{evaluationError}</div>}
            {recordingError && <div className="pr-alert error"><XCircle size={15} />{recordingError}</div>}

            {evaluation && (
              <div className={`pr-alert ${evaluation.status === 'completed' ? 'success' : evaluation.status === 'processing' ? 'warning' : 'error'}`} style={{ marginBottom: '1rem' }}>
                {evaluation.status === 'processing' && <Loader size={15} className="spin" />}
                {evaluation.status === 'completed' && <CheckCircle size={15} />}
                {evaluation.status === 'failed' && <XCircle size={15} />}
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>AI Feedback: {evaluation.status}</span>
              </div>
            )}

            <div className="pr-grid">
              {/* LEFT */}
              <div>
                {/* Recording */}
                <div className="pr-card">
                  <div className="pr-card-header">
                    <div className="pr-section-icon" style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb' }}><Mic size={16} /></div>
                    <h3>Session Recording</h3>
                  </div>
                  <div className="pr-mode-tabs">
                    <button type="button" onClick={() => setRecordMode('upload')} className={`pr-mode-tab${recordMode === 'upload' ? ' active' : ''}`}>
                      <Upload size={15} /> Upload Audio
                    </button>
                    <button type="button" onClick={() => setRecordMode('record')} className={`pr-mode-tab${recordMode === 'record' ? ' active' : ''}`}>
                      <Mic size={15} /> Record
                    </button>
                  </div>

                  {recordMode === 'upload' ? (
                    <div className="pr-record-area">
                      <div className="pr-record-icon idle"><Upload size={28} /></div>
                      <div style={{ color: '#64748b', fontSize: '0.88rem' }}>Upload a short audio clip to analyze</div>
                      <input type="file" accept="audio/*" style={{ display: 'none' }} id="practice-audio-upload" onChange={handleFileUpload} />
                      <button type="button" className={secondaryButtonClass} onClick={() => document.getElementById('practice-audio-upload')?.click()}>
                        <Upload size={15} /> Choose File
                      </button>
                      {audioUrl && <audio controls src={audioUrl} style={{ width: '100%', marginTop: '0.5rem' }} />}
                    </div>
                  ) : (
                    <div className="pr-record-area" style={{ background: isRecording ? 'rgba(227,24,55,0.02)' : undefined }}>
                      {audioUrl ? (
                        <div style={{ width: '100%' }}>
                          <audio controls src={audioUrl} style={{ width: '100%', marginBottom: '0.75rem' }} />
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" className={secondaryButtonClass} onClick={resetRecording} style={{ flex: 1 }}>Record Again</button>
                            <button type="button" className={primaryButtonClass} onClick={handleUploadRecording} disabled={isLoading} style={{ flex: 1 }}>
                              {isLoading ? 'Saving…' : 'Save Recording'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={`pr-record-icon ${isRecording ? 'recording' : 'idle'}`}><Mic size={28} /></div>
                          <div style={{ color: '#64748b', fontSize: '0.88rem' }}>
                            {isRecording ? 'Recording…' : performance?.audioFile ? 'Recording saved for this session' : 'Press record, speak, then stop and save'}
                          </div>
                          {!performance?.audioFile && (
                            <>
                              <button type="button" className={isRecording ? secondaryButtonClass : primaryButtonClass}
                                onClick={isRecording ? stopRecording : startRecording} disabled={isLoading}
                                style={isRecording ? { borderColor: '#E31837', color: '#E31837' } : {}}>
                                {isRecording ? <><MicOff size={15} /> Stop</> : <><Mic size={15} /> Start Recording</>}
                              </button>
                              {isRecording && <div className="pr-rec-timer"><div className="pr-rec-dot" />REC {formattedTime}</div>}
                            </>
                          )}
                          {performance?.audioFile && (
                            <div style={{ width: '100%', padding: '1rem', background: '#f0fdf4', borderRadius: '12px', color: '#15803d', textAlign: 'center' }}>
                              <CheckCircle size={20} style={{ marginBottom: '0.4rem' }} />
                              <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.88rem' }}>Recording saved</p>
                              <audio controls src={oralPerformanceService.getAudioUrl(performance._id)} style={{ width: '100%' }} />
                            </div>
                          )}
                          {recordingPrepared && !performance?.audioFile && (
                            <div style={{ width: '100%', padding: '1rem', background: '#eff6ff', borderRadius: '12px', color: '#1d4ed8', textAlign: 'center' }}>
                              <CheckCircle size={20} style={{ marginBottom: '0.4rem' }} />
                              <p style={{ margin: 0, fontSize: '0.85rem' }}>Ready to send — enter your topic and start AI feedback.</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Feedback Card */}
                {showEvaluationForm && (recordingPrepared || performance?.audioFile) && (
                  <div className="pr-card">
                    <div className="pr-card-header">
                      <div className="pr-section-icon" style={{ background: 'rgba(139,92,246,0.08)', color: '#7c3aed' }}><Bot size={16} /></div>
                      <h3>AI-Supported Feedback</h3>
                    </div>

                    <div className="pr-ai-hint">
                      <Bot size={13} /> Explanations and suggestions help you understand your level and what to improve. Official grades come from your instructor.
                    </div>

                    {!evaluation && (
                      <div className="pr-card-body">
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Language</label>
                          <select value={evaluationLanguage} onChange={e => setEvaluationLanguage(e.target.value)} className="pr-select">
                            <option value="en">English</option>
                            <option value="fr">French (Français)</option>
                          </select>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Topic You Answered</label>
                          <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                            placeholder='e.g. "Introduce yourself", "Describe your studies"' className="pr-input" />
                        </div>
                        <button type="button" className={primaryButtonClass} onClick={handleStartEvaluation} disabled={isEvaluating || !subject.trim()} style={{ width: '100%', justifyContent: 'center' }}>
                          {isEvaluating ? <><Loader size={15} className="spin" /> Analyzing…</> : 'Start AI Feedback'}
                        </button>
                      </div>
                    )}

                    {evaluationLoading && (
                      <div className="pr-ai-loading">
                        <Loader size={28} className="spin" style={{ color: '#7c3aed' }} />
                        <span>Processing your speech…</span>
                      </div>
                    )}

                    {evaluation?.status === 'completed' && (evaluation.speechMetrics || evaluation.transcript || evaluation.contentAnalysis) && (
                      <>
                        {/* Transcript */}
                        <div style={{ padding: '0 1.25rem 1rem' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>AI Transcription</div>
                          <div className="pr-transcript-box">
                            {evaluation.transcript ? <p style={{ margin: 0 }}>{evaluation.transcript}</p> : <p style={{ margin: 0, color: '#94a3b8' }}>No transcript for this session.</p>}
                          </div>
                        </div>

                        {/* Speech metrics */}
                        {evaluation.speechMetrics && (
                          <div style={{ padding: '0 1.25rem 1rem' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.75rem' }}>AI Speech Metrics</div>
                            <div className="pr-metrics-grid">
                              {[
                                { label: 'Fluency', value: `${evaluation.speechMetrics.fluency}%` },
                                { label: 'Pronunciation', value: `${evaluation.speechMetrics.pronunciation}%` },
                                { label: 'Speaking pace', value: `${evaluation.speechMetrics.speakingPace} WPM` },
                                { label: 'Confidence', value: `${evaluation.speechMetrics.confidence}%` },
                              ].map(m => (
                                <div key={m.label} className="pr-metric-card">
                                  <div className="pr-metric-label">{m.label}</div>
                                  <div className="pr-metric-val">{m.value}</div>
                                </div>
                              ))}
                            </div>
                            {evaluation.speechMetrics.details && (
                              <div className="pr-details-box">
                                <strong>Details:</strong> {evaluation.speechMetrics.details.totalWords} words, {evaluation.speechMetrics.details.fillerWords} fillers,{' '}
                                {typeof evaluation.speechMetrics.details.averagePauseDuration === 'number' ? `${evaluation.speechMetrics.details.averagePauseDuration.toFixed(2)}s avg pause` : '—'}
                              </div>
                            )}
                            {evaluation.contentScores && (
                              <div className="pr-details-box">
                                <strong>AI content scores:</strong> Structure: {evaluation.contentScores.contentStructure || 0}%, Coherence: {evaluation.contentScores.coherence}%, Topic: {evaluation.contentScores.topicRelevance}%, Grammar: {evaluation.contentScores.grammar}%, Vocabulary: {evaluation.contentScores.vocabulary}%
                              </div>
                            )}
                          </div>
                        )}

                        {/* Narrative */}
                        {evaluation.contentAnalysis && (
                          <div style={{ padding: '0 1.25rem 1.25rem' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>AI Narrative & Suggestions</div>
                            <div className="pr-narrative-box">
                              <p style={{ margin: '0 0 0.5rem', fontWeight: 700 }}>Suggested CEFR: {displayedCEFR}</p>
                              {evaluation.contentAnalysis.summary && <p style={{ margin: '0 0 0.65rem' }}><strong>Explanation</strong><br />{evaluation.contentAnalysis.summary}</p>}
                              {evaluation.contentAnalysis.strengths?.length > 0 && (
                                <div style={{ marginBottom: '0.65rem' }}>
                                  <strong>What went well</strong>
                                  <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem' }}>{evaluation.contentAnalysis.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                                </div>
                              )}
                              {evaluation.contentAnalysis.improvements?.length > 0 && (
                                <div>
                                  <strong>Suggestions to raise your level</strong>
                                  <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem' }}>{evaluation.contentAnalysis.improvements.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Holistic score */}
                        {evaluation.contentScores && evaluation.speechMetrics && (
                          <div className="pr-holistic-wrap">
                            <div className="pr-holistic-ring" style={{ '--pct': holisticScore } as React.CSSProperties}>
                              <span className="pr-holistic-num">{holisticScore}</span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Holistic Oral Index / 100</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT */}
              <div>
                {/* History */}
                <div className="pr-card">
                  <div className="pr-card-header">
                    <div className="pr-section-icon" style={{ background: 'rgba(100,116,139,0.08)', color: '#475569' }}><BookOpen size={16} /></div>
                    <h3>My Submission History</h3>
                  </div>
                  <div className="pr-card-body">
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                      Practice and class sessions with audio. Select one to review AI feedback again.
                    </p>
                    {historyLoading ? (
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading…</p>
                    ) : submissionHistory.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No sessions yet. Save a recording and run AI feedback.</p>
                    ) : (
                      <>
                        <select value={selectedHistoryId} onChange={e => handleHistorySelection(e.target.value)} className="pr-select" style={{ marginBottom: '0.75rem' }}>
                          <option value="">Select a session</option>
                          {submissionHistory.map(row => {
                            const id = perfId(row.performance);
                            if (!id) return null;
                            const created = row.performance.createdAt ? new Date(row.performance.createdAt).toLocaleDateString() : '—';
                            const hasAi = row.evaluation?.status === 'completed';
                            return <option key={id} value={id}>{row.performance.title || 'Session'} ({created}){hasAi ? ' · AI' : ''}</option>;
                          })}
                        </select>
                        {selectedRow && (
                          <div className="pr-history-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Topic</strong><span>{selectedRow.performance.title || '—'}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Status</strong><span>{selectedRow.performance.status || '—'}</span></div>
                            {selectedRow.evaluation?.status === 'completed' && (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>CEFR (AI)</strong><span>{selectedRow.evaluation.contentScores ? deriveCefrLevel(selectedRow.evaluation.contentScores, selectedRow.evaluation.speechMetrics) : '—'}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Holistic</strong><span>{selectedRow.evaluation.contentScores && selectedRow.evaluation.speechMetrics ? holisticOralIndex(selectedRow.evaluation.contentScores, selectedRow.evaluation.speechMetrics) : '—'}/100</span></div>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div className="pr-card">
                  <div className="pr-card-header">
                    <div className="pr-section-icon" style={{ background: 'rgba(34,197,94,0.08)', color: '#15803d' }}><BarChart3 size={16} /></div>
                    <h3>Track Progress</h3>
                  </div>
                  <div className="pr-card-body">
                    <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, margin: '0 0 1rem' }}>
                      Open your dashboard for charts of scores over time and skill breakdowns from all sessions.
                    </p>
                    <button type="button" className={primaryButtonClass} style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/student/dashboard')}>
                      <BarChart3 size={15} /> View Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Practice;