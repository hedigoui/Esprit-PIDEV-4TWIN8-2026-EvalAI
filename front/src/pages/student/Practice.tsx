// src/pages/student/Practice.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentSidebar from '../../components/StudentSidebar';
import AiDisclosureNotice from '../../components/AiDisclosureNotice';
import {
  Upload,
  Bot,
  Mic,
  MicOff,
  CheckCircle,
  XCircle,
  Loader,
  Send,
  RotateCcw,
  BarChart3,
} from 'lucide-react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useEvaluation } from '../../hooks/useEvaluation';
import { oralPerformanceService } from '../services/oralPerformance.service';
import type { EvaluationResult } from '../services/oralPerformance.service';
import {
  deriveCefrLevel,
  holisticOralIndex,
  indexToCefr,
} from '../../utils/cefrCalibration';

// @ts-ignore
import styles from '../../styles/shared.module.css';
// @ts-ignore — same layout & AI panels as teacher Evaluate
import evaluateStyles from '../teacher/Evaluate.module.css';

interface Performance {
  _id: string;
  studentId?: string;
  title?: string;
  description?: string;
  audioFile?: {
    fileId: string;
    filename: string;
    size: number;
    duration?: number;
    mimeType: string;
    uploadedAt: string;
  };
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
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const d = audio.duration;
      resolve(Number.isFinite(d) && d > 0 ? Math.round(d) : 60);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(60);
    };
    audio.src = url;
  });
}

const getStudentIdFromToken = (): string => {
  const token = localStorage.getItem('token');
  if (!token) return '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || '';
  } catch {
    return '';
  }
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
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [recordingPrepared, setRecordingPrepared] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState('');

  const {
    isRecording,
    audioBlob,
    audioUrl,
    error: recordingError,
    formattedTime,
    recordingTime,
    startRecording,
    stopRecording,
    resetRecording,
    loadExternalAudio,
  } = useAudioRecorder();

  const {
    evaluation,
    isLoading: evaluationLoading,
    error: evaluationError,
    startEvaluation,
    fetchEvaluation,
    stopPolling,
  } = useEvaluation({
    performanceId: performance?._id || '',
    autoPoll: true,
  });

  const loadSubmissionHistory = useCallback(async () => {
    if (!studentId) return;
    try {
      setHistoryLoading(true);
      const list = await oralPerformanceService.getAllStudentEvaluations(studentId);
      const rows = Array.isArray(list) ? list : [];
      rows.sort(
        (a, b) =>
          new Date(b.performance?.createdAt || 0).getTime() -
          new Date(a.performance?.createdAt || 0).getTime(),
      );
      setSubmissionHistory(rows as HistoryRow[]);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (!studentId) {
      navigate('/', { replace: true });
      return;
    }
    loadSubmissionHistory();
  }, [studentId, navigate, loadSubmissionHistory]);

  useEffect(() => {
    if (performance?._id) {
      const t = setTimeout(() => fetchEvaluation(), 400);
      return () => clearTimeout(t);
    }
  }, [performance?._id, fetchEvaluation]);

  const calculateWeightedScore = () => {
    if (!evaluation?.speechMetrics) return 0;
    const speechScore =
      (evaluation.speechMetrics.fluency || 0) * 0.15 +
      (evaluation.speechMetrics.pronunciation || 0) * 0.15 +
      Math.min(100, (evaluation.speechMetrics.speakingPace || 0) / 1.8) * 0.1 +
      (evaluation.speechMetrics.confidence || 0) * 0.1;
    const contentScore =
      (evaluation.contentScores?.contentStructure || 0) * 0.1 +
      (evaluation.contentScores?.coherence || 0) * 0.1 +
      (evaluation.contentScores?.topicRelevance || 0) * 0.1 +
      (evaluation.contentScores?.grammar || 0) * 0.1 +
      (evaluation.contentScores?.vocabulary || 0) * 0.1;
    return Math.round(speechScore + contentScore);
  };

  const overallScore = calculateWeightedScore();

  const displayedCEFR =
    evaluation?.contentAnalysis?.cefrLevel ||
    (evaluation?.contentScores
      ? deriveCefrLevel(
          evaluation.contentScores,
          evaluation.speechMetrics ?? null,
        )
      : indexToCefr(Math.min(100, Math.max(0, overallScore))));

  const holisticScore = useMemo(() => {
    if (!evaluation?.contentScores) return 0;
    return holisticOralIndex(
      evaluation.contentScores,
      evaluation.speechMetrics ?? null,
    );
  }, [evaluation]);

  const selectedRow = useMemo(
    () =>
      submissionHistory.find((r) => perfId(r.performance) === selectedHistoryId) ||
      null,
    [submissionHistory, selectedHistoryId],
  );

  const handleHistorySelection = async (historyId: string): Promise<void> => {
    setSelectedHistoryId(historyId);
    if (!historyId) return;
    const row = submissionHistory.find((r) => perfId(r.performance) === historyId);
    if (!row) return;
    try {
      const full = await oralPerformanceService.getPerformance(historyId);
      setPerformance(full as Performance);
      setSubject((full as Performance).title || '');
      setRecordingPrepared(false);
      resetRecording();
      setShowEvaluationForm(Boolean((full as Performance).audioFile));
    } catch (e) {
      console.error(e);
      setPerformance(row.performance as Performance);
      setSubject(row.performance.title || '');
      setShowEvaluationForm(Boolean(row.performance.audioFile));
    }
  };

  const handleNewPractice = (): void => {
    stopPolling();
    resetRecording();
    setPerformance(null);
    setSubject('');
    setSelectedHistoryId('');
    setRecordingPrepared(false);
    setShowEvaluationForm(false);
    setUploadError(null);
    setUploadSuccess(false);
    setIsEvaluating(false);
  };

  const handleUploadRecording = (): void => {
    if (!audioBlob) return;
    setUploadError(null);
    setRecordingPrepared(true);
    setShowEvaluationForm(true);
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setUploadError(null);
      const blob = file.slice(0, file.size, file.type || 'audio/webm');
      const dur = await getAudioDurationSeconds(blob);
      loadExternalAudio(blob, dur);
      setRecordingPrepared(true);
      setShowEvaluationForm(true);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2500);
    } catch (err) {
      console.error(err);
      setUploadError('Could not load audio file.');
    }
  };

  const handleStartEvaluation = async (): Promise<void> => {
    if (!subject.trim()) {
      alert('Please enter a topic you practiced.');
      return;
    }
    try {
      setIsEvaluating(true);
      setUploadError(null);
      let currentPerformance = performance;

      if (!currentPerformance?.audioFile) {
        if (!audioBlob) {
          alert('Please record or upload audio first.');
          return;
        }
        const durationInSeconds = Math.max(
          1,
          recordingTime > 0
            ? recordingTime
            : (() => {
                const parts = formattedTime.split(':');
                return (
                  parseInt(parts[0] || '0', 10) * 60 +
                  parseInt(parts[1] || '0', 10)
                );
              })(),
        );

        const created = await oralPerformanceService.create({
          studentId,
          title: subject.trim(),
          description: 'Practice session',
        });
        currentPerformance = (await oralPerformanceService.uploadAudio(
          created._id,
          audioBlob,
          durationInSeconds,
        )) as Performance;
        setPerformance(currentPerformance);
        setRecordingPrepared(false);
      }

      if (!currentPerformance?._id) {
        setUploadError('Session is not ready. Try saving your recording again.');
        return;
      }

      await startEvaluation(subject.trim(), currentPerformance._id);
      const refreshed = await oralPerformanceService.getPerformance(
        currentPerformance._id,
      );
      setPerformance(refreshed as Performance);
      await loadSubmissionHistory();
      setSelectedHistoryId(currentPerformance._id);
    } catch (error) {
      console.error(error);
      setUploadError(
        error instanceof Error ? error.message : 'Failed to start AI feedback.',
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const showEvaluationError =
    !!evaluationError &&
    evaluationError !== 'Evaluation not found' &&
    !/no performance id|performance id available/i.test(evaluationError);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'processing':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const cardClass = styles?.card || 'card';
  const cardTitleClass = styles?.cardTitle || 'card-title';
  const primaryButtonClass = styles?.primaryButton || 'primary-button';
  const secondaryButtonClass = styles?.secondaryButton || 'secondary-button';

  const evalAny = evaluation as EvaluationResult & {
    detailedContentFeedback?: {
      structure?: string;
      contentGaps?: string[];
      vocabularySuggestions?: string[];
    };
  };

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Practice</h1>
              <p className={styles.pageSubtitle}>
                Self-study mode: record a response, run AI analysis, and review your submission
                history—same feedback layout as in class evaluations.
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={handleNewPractice}
                title="Start a fresh session"
              >
                <RotateCcw size={18} />
                New practice session
              </button>
              {(recordingPrepared || performance?.audioFile) && (
                <button
                  type="button"
                  className={primaryButtonClass}
                  onClick={handleStartEvaluation}
                  disabled={isLoading || isEvaluating}
                >
                  <Send size={18} />
                  {isLoading || isEvaluating ? 'Analyzing…' : 'Start AI feedback'}
                </button>
              )}
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => navigate('/student/dashboard')}
              >
                <BarChart3 size={18} />
                Progress on dashboard
              </button>
            </div>
          </div>

          <AiDisclosureNotice />

          {uploadError && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                padding: '0.75rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <XCircle size={18} />
              {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div
              style={{
                backgroundColor: '#d1fae5',
                color: '#059669',
                padding: '0.75rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle size={18} />
              Recording ready. Add a topic and press Start AI feedback.
            </div>
          )}

          {showEvaluationError && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                padding: '0.75rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <XCircle size={18} />
              {evaluationError}
            </div>
          )}

          {recordingError && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                padding: '0.75rem',
                borderRadius: '8px',
                marginBottom: '1rem',
              }}
            >
              {recordingError}
            </div>
          )}

          {evaluation && (
            <div
              style={{
                backgroundColor: `${getStatusColor(evaluation.status)}10`,
                border: `1px solid ${getStatusColor(evaluation.status)}`,
                color: getStatusColor(evaluation.status),
                padding: '0.75rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {evaluation.status === 'processing' && (
                  <Loader size={16} className="spin" />
                )}
                {evaluation.status === 'completed' && <CheckCircle size={16} />}
                {evaluation.status === 'failed' && <XCircle size={16} />}
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  AI feedback: {evaluation.status}
                </span>
              </div>
            </div>
          )}

          <div className={evaluateStyles.evaluateGrid}>
            <div className={evaluateStyles.leftColumn}>
              <div className={cardClass}>
                <h3 className={cardTitleClass}>Session recording</h3>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setRecordMode('upload')}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      background: recordMode === 'upload' ? '#E31837' : 'rgba(0,0,0,0.04)',
                      color: recordMode === 'upload' ? '#fff' : '#64748b',
                    }}
                  >
                    <Upload size={16} /> Upload audio
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordMode('record')}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      background: recordMode === 'record' ? '#E31837' : 'rgba(0,0,0,0.04)',
                      color: recordMode === 'record' ? '#fff' : '#64748b',
                    }}
                  >
                    <Mic size={16} /> Record
                  </button>
                </div>

                {recordMode === 'upload' ? (
                  <div className={evaluateStyles.videoContainer}>
                    <div className={evaluateStyles.videoPlaceholder}>
                      <Upload size={48} />
                      <p>Upload a short audio clip to analyze</p>
                      <input
                        type="file"
                        accept="audio/*"
                        style={{ display: 'none' }}
                        id="practice-audio-upload"
                        onChange={handleFileUpload}
                      />
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={() =>
                          document.getElementById('practice-audio-upload')?.click()
                        }
                      >
                        <Upload size={16} /> Choose file
                      </button>
                      {audioUrl && (
                        <audio
                          controls
                          src={audioUrl}
                          style={{ width: '100%', marginTop: '0.75rem' }}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={evaluateStyles.videoContainer}>
                    <div
                      className={evaluateStyles.videoPlaceholder}
                      style={{
                        background: isRecording ? 'rgba(227,24,55,0.03)' : undefined,
                      }}
                    >
                      {audioUrl ? (
                        <div style={{ width: '100%' }}>
                          <audio
                            controls
                            src={audioUrl}
                            style={{ width: '100%', marginBottom: '1rem' }}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              className={secondaryButtonClass}
                              onClick={resetRecording}
                              style={{ flex: 1 }}
                            >
                              Record again
                            </button>
                            <button
                              type="button"
                              className={primaryButtonClass}
                              onClick={handleUploadRecording}
                              disabled={isLoading}
                              style={{ flex: 1 }}
                            >
                              {isLoading ? 'Saving…' : 'Save recording'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Mic
                            size={48}
                            style={{ color: isRecording ? '#E31837' : 'rgba(0,0,0,0.2)' }}
                          />
                          <p>
                            {isRecording
                              ? 'Recording…'
                              : performance?.audioFile
                                ? 'Recording saved for this session'
                                : 'Press record, speak, then stop and save'}
                          </p>
                          {!performance?.audioFile && (
                            <>
                              <button
                                type="button"
                                className={
                                  isRecording ? secondaryButtonClass : primaryButtonClass
                                }
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isLoading}
                                style={
                                  isRecording
                                    ? { borderColor: '#E31837', color: '#E31837' }
                                    : {}
                                }
                              >
                                {isRecording ? (
                                  <>
                                    <MicOff size={16} /> Stop
                                  </>
                                ) : (
                                  <>
                                    <Mic size={16} /> Start recording
                                  </>
                                )}
                              </button>
                              {isRecording && (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginTop: '0.5rem',
                                    color: '#E31837',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  <span
                                    style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      background: '#E31837',
                                      animation: 'pulse 1.5s infinite',
                                    }}
                                  />
                                  REC {formattedTime}
                                </div>
                              )}
                            </>
                          )}
                          {performance?.audioFile && (
                            <div
                              style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                background: '#d1fae5',
                                borderRadius: '8px',
                                color: '#059669',
                                width: '100%',
                              }}
                            >
                              <CheckCircle size={24} />
                              <p style={{ margin: '0.35rem 0' }}>Recording saved</p>
                              <audio
                                controls
                                src={oralPerformanceService.getAudioUrl(performance._id)}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                              />
                            </div>
                          )}
                          {recordingPrepared && !performance?.audioFile && (
                            <div
                              style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                background: '#dbeafe',
                                borderRadius: '8px',
                                color: '#1d4ed8',
                                width: '100%',
                              }}
                            >
                              <CheckCircle size={24} />
                              <p style={{ margin: 0 }}>
                                Ready to send—enter your topic and start AI feedback.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {showEvaluationForm && (recordingPrepared || performance?.audioFile) && (
                <div className={cardClass}>
                  <div className={evaluateStyles.sectionHeader}>
                    <Bot size={20} />
                    <h3>AI-supported feedback</h3>
                  </div>
                  <div
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(59,130,246,0.06)',
                      borderRadius: '8px',
                      margin: '0 0 1rem',
                      fontSize: '0.72rem',
                      color: '#3b82f6',
                      lineHeight: 1.45,
                    }}
                  >
                    <Bot size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    Explanations and suggestions below help you understand your level and what to
                    improve next. Official grades may still come from your instructor.
                  </div>

                  {!evaluation && (
                    <div style={{ padding: '0 1rem 1rem' }}>
                      <div className={evaluateStyles.formGroup}>
                        <label>Topic you answered</label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder='e.g. "Introduce yourself", "Describe your studies"'
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            marginBottom: '1rem',
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className={primaryButtonClass}
                        onClick={handleStartEvaluation}
                        disabled={isEvaluating || !subject.trim()}
                        style={{ width: '100%' }}
                      >
                        {isEvaluating ? (
                          <>
                            <Loader size={16} className="spin" /> Analyzing…
                          </>
                        ) : (
                          'Start AI feedback'
                        )}
                      </button>
                    </div>
                  )}

                  {evaluationLoading && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                      <Loader size={32} className="spin" style={{ marginBottom: '1rem' }} />
                      <p>Processing your speech…</p>
                    </div>
                  )}

                  {evaluation?.status === 'completed' &&
                    (evaluation.speechMetrics ||
                      evaluation.transcript ||
                      evaluation.contentAnalysis) && (
                      <>
                        <div style={{ padding: '0 1rem' }}>
                          <h4
                            style={{
                              fontSize: '0.9rem',
                              marginBottom: '0.5rem',
                              color: '#1e293b',
                            }}
                          >
                            AI transcription
                          </h4>
                          <div
                            className={evaluateStyles.transcription}
                            style={{
                              background: '#f8fafc',
                              padding: '1rem',
                              borderRadius: '8px',
                              fontSize: '0.9rem',
                              lineHeight: 1.6,
                              color: '#334155',
                              maxHeight: '200px',
                              overflowY: 'auto',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {evaluation.transcript ? (
                              <p style={{ margin: 0 }}>{evaluation.transcript}</p>
                            ) : (
                              <p style={{ margin: 0, color: '#94a3b8' }}>
                                No transcript for this session.
                              </p>
                            )}
                          </div>
                        </div>

                        {evaluation.speechMetrics && (
                          <div style={{ padding: '1rem' }}>
                            <h4
                              style={{
                                fontSize: '0.9rem',
                                marginBottom: '0.5rem',
                                color: '#1e293b',
                              }}
                            >
                              AI speech metrics
                            </h4>
                            <div
                              className={evaluateStyles.aiMetrics}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '0.75rem',
                              }}
                            >
                              <div
                                className={evaluateStyles.aiMetric}
                                style={{
                                  background: '#f8fafc',
                                  padding: '0.75rem',
                                  borderRadius: '8px',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    color: '#64748b',
                                    display: 'block',
                                  }}
                                >
                                  Fluency
                                </span>
                                <div
                                  style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                    color: '#0f172a',
                                  }}
                                >
                                  {evaluation.speechMetrics.fluency}%
                                </div>
                              </div>
                              <div
                                className={evaluateStyles.aiMetric}
                                style={{
                                  background: '#f8fafc',
                                  padding: '0.75rem',
                                  borderRadius: '8px',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    color: '#64748b',
                                    display: 'block',
                                  }}
                                >
                                  Pronunciation
                                </span>
                                <div
                                  style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                    color: '#0f172a',
                                  }}
                                >
                                  {evaluation.speechMetrics.pronunciation}%
                                </div>
                              </div>
                              <div
                                className={evaluateStyles.aiMetric}
                                style={{
                                  background: '#f8fafc',
                                  padding: '0.75rem',
                                  borderRadius: '8px',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    color: '#64748b',
                                    display: 'block',
                                  }}
                                >
                                  Speaking pace
                                </span>
                                <div
                                  style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                    color: '#0f172a',
                                  }}
                                >
                                  {evaluation.speechMetrics.speakingPace}{' '}
                                  <span style={{ fontSize: '0.75rem' }}>WPM</span>
                                </div>
                              </div>
                              <div
                                className={evaluateStyles.aiMetric}
                                style={{
                                  background: '#f8fafc',
                                  padding: '0.75rem',
                                  borderRadius: '8px',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    color: '#64748b',
                                    display: 'block',
                                  }}
                                >
                                  Confidence
                                </span>
                                <div
                                  style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                    color: '#0f172a',
                                  }}
                                >
                                  {evaluation.speechMetrics.confidence}%
                                </div>
                              </div>
                            </div>
                            {evaluation.speechMetrics.details && (
                              <div
                                style={{
                                  marginTop: '1rem',
                                  padding: '0.75rem',
                                  background: '#f1f5f9',
                                  borderRadius: '8px',
                                  fontSize: '0.85rem',
                                  color: '#475569',
                                }}
                              >
                                <strong>Details:</strong>{' '}
                                {evaluation.speechMetrics.details.totalWords} words,{' '}
                                {evaluation.speechMetrics.details.fillerWords} fillers,{' '}
                                {typeof evaluation.speechMetrics.details
                                  .averagePauseDuration === 'number'
                                  ? `${evaluation.speechMetrics.details.averagePauseDuration.toFixed(2)}s avg pause`
                                  : '—'}
                              </div>
                            )}
                            {evaluation.contentScores && (
                              <div
                                style={{
                                  marginTop: '1rem',
                                  padding: '0.75rem',
                                  background: '#f1f5f9',
                                  borderRadius: '8px',
                                  fontSize: '0.85rem',
                                  color: '#475569',
                                }}
                              >
                                <strong>AI content scores:</strong> Structure:{' '}
                                {evaluation.contentScores.contentStructure || 0}%, Coherence:{' '}
                                {evaluation.contentScores.coherence}%, Topic:{' '}
                                {evaluation.contentScores.topicRelevance}%, Grammar:{' '}
                                {evaluation.contentScores.grammar}%, Vocabulary:{' '}
                                {evaluation.contentScores.vocabulary}%
                              </div>
                            )}
                          </div>
                        )}

                        {evaluation.contentAnalysis && (
                          <div style={{ padding: '0 1rem 1rem' }}>
                            <h4
                              style={{
                                fontSize: '0.9rem',
                                marginBottom: '0.5rem',
                                color: '#1e293b',
                              }}
                            >
                              AI narrative &amp; suggestions to improve
                            </h4>
                            <div
                              style={{
                                background: '#faf5ff',
                                border: '1px solid #e9d5ff',
                                borderRadius: '8px',
                                padding: '0.85rem',
                                fontSize: '0.85rem',
                                color: '#4c1d95',
                                lineHeight: 1.55,
                              }}
                            >
                              <p style={{ margin: '0 0 0.5rem', fontWeight: 700 }}>
                                Suggested CEFR (from scores): {displayedCEFR}
                              </p>
                              {evaluation.contentAnalysis.summary && (
                                <p style={{ margin: '0 0 0.65rem' }}>
                                  <strong>Explanation (summary)</strong>
                                  <br />
                                  {evaluation.contentAnalysis.summary}
                                </p>
                              )}
                              {evaluation.contentAnalysis.keyPoints?.length > 0 && (
                                <div style={{ marginBottom: '0.65rem' }}>
                                  <strong>Key points you covered</strong>
                                  <ul
                                    style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem' }}
                                  >
                                    {evaluation.contentAnalysis.keyPoints.map(
                                      (pt: string, i: number) => (
                                        <li key={i}>{pt}</li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              )}
                              {evaluation.contentAnalysis.strengths?.length > 0 && (
                                <div style={{ marginBottom: '0.65rem' }}>
                                  <strong>What went well</strong>
                                  <ul
                                    style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem' }}
                                  >
                                    {evaluation.contentAnalysis.strengths.map(
                                      (s: string, i: number) => (
                                        <li key={i}>{s}</li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              )}
                              {evaluation.contentAnalysis.improvements?.length > 0 && (
                                <div>
                                  <strong>Suggestions to raise your level</strong>
                                  <ul
                                    style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem' }}
                                  >
                                    {evaluation.contentAnalysis.improvements.map(
                                      (s: string, i: number) => (
                                        <li key={i}>{s}</li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {evalAny.detailedContentFeedback && (
                          <div style={{ padding: '0 1rem 1rem' }}>
                            <h4
                              style={{
                                fontSize: '0.9rem',
                                marginBottom: '0.5rem',
                                color: '#1e293b',
                              }}
                            >
                              More detailed AI notes
                            </h4>
                            <div
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '0.85rem',
                                fontSize: '0.82rem',
                                color: '#334155',
                                lineHeight: 1.5,
                              }}
                            >
                              {evalAny.detailedContentFeedback.structure && (
                                <p style={{ margin: '0 0 0.5rem' }}>
                                  <strong>Structure</strong>
                                  <br />
                                  {evalAny.detailedContentFeedback.structure}
                                </p>
                              )}
                              {evalAny.detailedContentFeedback.contentGaps?.length ? (
                                <div style={{ marginBottom: '0.5rem' }}>
                                  <strong>Gaps to work on</strong>
                                  <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.1rem' }}>
                                    {evalAny.detailedContentFeedback.contentGaps.map(
                                      (g: string, i: number) => (
                                        <li key={i}>{g}</li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              ) : null}
                              {evalAny.detailedContentFeedback.vocabularySuggestions?.length ? (
                                <div>
                                  <strong>Vocabulary ideas</strong>
                                  <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.1rem' }}>
                                    {evalAny.detailedContentFeedback.vocabularySuggestions.map(
                                      (g: string, i: number) => (
                                        <li key={i}>{g}</li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )}

                        {evaluation.contentScores && evaluation.speechMetrics && (
                          <div style={{ padding: '0 1rem 1.25rem' }}>
                            <div className={evaluateStyles.overallScore}>
                              <div className={evaluateStyles.scoreCircle}>
                                <span>{holisticScore}</span>
                                <small>/100</small>
                              </div>
                              <span>Holistic oral index (aligned with CEFR)</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                </div>
              )}
            </div>

            <div className={evaluateStyles.rightColumn}>
              <div className={cardClass}>
                <h3 className={cardTitleClass}>My submission history</h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 0.75rem' }}>
                  Practice and class sessions with audio. Select one to review AI feedback again.
                </p>
                {historyLoading ? (
                  <p style={{ color: '#64748b' }}>Loading…</p>
                ) : submissionHistory.length === 0 ? (
                  <p style={{ color: '#64748b' }}>No sessions yet. Save a recording and run AI feedback.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '0.6rem' }}>
                    <select
                      value={selectedHistoryId}
                      onChange={(e) => handleHistorySelection(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.7rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        background: '#fff',
                        color: '#1e293b',
                        fontSize: '0.85rem',
                      }}
                    >
                      <option value="">Select a session</option>
                      {submissionHistory.map((row) => {
                        const id = perfId(row.performance);
                        if (!id) return null;
                        const created = row.performance.createdAt
                          ? new Date(row.performance.createdAt).toLocaleDateString()
                          : '—';
                        const hasAi = row.evaluation?.status === 'completed';
                        return (
                          <option key={id} value={id}>
                            {row.performance.title || 'Session'} ({created})
                            {hasAi ? ' · AI' : ''}
                          </option>
                        );
                      })}
                    </select>

                    {selectedRow && (
                      <div
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '0.65rem 0.75rem',
                          background: '#fafafa',
                          fontSize: '0.8rem',
                          color: '#334155',
                        }}
                      >
                        <div>
                          <strong>Topic:</strong> {selectedRow.performance.title || '—'}
                        </div>
                        <div>
                          <strong>Status:</strong> {selectedRow.performance.status || '—'}
                        </div>
                        {selectedRow.evaluation?.status === 'completed' && (
                          <>
                            <div>
                              <strong>CEFR (AI):</strong>{' '}
                              {selectedRow.evaluation.contentAnalysis?.cefrLevel ||
                                (selectedRow.evaluation.contentScores &&
                                selectedRow.evaluation.speechMetrics
                                  ? deriveCefrLevel(
                                      selectedRow.evaluation.contentScores,
                                      selectedRow.evaluation.speechMetrics,
                                    )
                                  : '—')}
                            </div>
                            <div>
                              <strong>Holistic index:</strong>{' '}
                              {selectedRow.evaluation.contentScores &&
                              selectedRow.evaluation.speechMetrics
                                ? holisticOralIndex(
                                    selectedRow.evaluation.contentScores,
                                    selectedRow.evaluation.speechMetrics,
                                  )
                                : '—'}
                              /100
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={cardClass}>
                <h3 className={cardTitleClass}>Track progress</h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                  Open your dashboard for charts of scores over time and skill breakdowns from all
                  sessions.
                </p>
                <button
                  type="button"
                  className={primaryButtonClass}
                  style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
                  onClick={() => navigate('/student/dashboard')}
                >
                  <BarChart3 size={16} /> View dashboard
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

export default Practice;
