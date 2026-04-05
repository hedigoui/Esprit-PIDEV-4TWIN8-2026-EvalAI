// src/pages/teacher/Evaluate.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherSidebar from '../../components/TeacherSidebar';
import AiDisclosureNotice from '../../components/AiDisclosureNotice';
import { Upload, Play, Pause, Send, Bot, User, Mic, MicOff, CheckCircle, XCircle, Loader, RotateCcw, Sparkles } from 'lucide-react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useEvaluation } from '../../hooks/useEvaluation';
import { oralPerformanceService } from '../services/oralPerformance.service';

// Import CSS modules
// @ts-ignore - CSS module typing is not picked up by current TS project config
import styles from '../../styles/shared.module.css';
// @ts-ignore - CSS module typing is not picked up by current TS project config
import evaluateStyles from './Evaluate.module.css';

// Define types
interface Scores {
  fluency: number;
  pronunciation: number;
  speakingPace: number;
  confidence: number;
  contentStructure: number;
}

interface Performance {
  _id: string;
  studentId: string;
  title: string;
  description?: string;
  audioFile?: {
    fileId: string;
    filename: string;
    size: number;
    duration?: number;
    mimeType: string;
    uploadedAt: string;
  };
  status: string;
  totalScore?: number;
  createdAt?: string;
  completedDate?: string;
  scores?: {
    fluency?: number;
    pronunciation?: number;
    speakingPace?: number;
    confidence?: number;
    contentOrganization?: number;
    vocabulary?: number;
    grammar?: number;
    comprehension?: number;
  };
  feedback?: {
    generalComments?: string;
    cefrLevel?: string;
  };
}

interface StudentProfile {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

const Evaluate: React.FC = () => {
  const navigate = useNavigate();
  const { studentId, performanceId } = useParams<{ studentId: string; performanceId: string }>();
  const effectiveStudentId = studentId ?? '';
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [recordMode, setRecordMode] = useState<'upload' | 'record'>('record');
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  
  // Evaluation states
  const [subject, setSubject] = useState<string>('');
  const [evaluationLanguage, setEvaluationLanguage] = useState<string>('en');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [showEvaluationForm, setShowEvaluationForm] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [instructorHistory, setInstructorHistory] = useState<Performance[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<Record<string, StudentProfile>>({});
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('');
  const [recordingPrepared, setRecordingPrepared] = useState<boolean>(false);
  const [evaluateeProfile, setEvaluateeProfile] = useState<StudentProfile | null>(null);

  /** Prevents re-applying AI rubric on every evaluation poll; cleared on new performance / new eval. */
  const aiRubricImportedForPerformanceId = useRef<string | null>(null);

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const instructorId: string = currentUser?.id || '';

  const {
    isRecording,
    audioBlob,
    audioUrl,
    error: recordingError,
    formattedTime,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  // Use evaluation hook
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

  const [scores, setScores] = useState<Scores>({
    fluency: 8,
    pronunciation: 8,
    speakingPace: 7,
    confidence: 7,
    contentStructure: 8,
  });
  
  const [cefrLevel, setCefrLevel] = useState<string>('B2');
  const [notes, setNotes] = useState<string>('');


useEffect(() => {
  if (instructorId) {
    loadInstructorHistory();
  }
}, [instructorId]);

  const evaluateeStudentKey = effectiveStudentId || performance?.studentId || '';

  useEffect(() => {
    if (!evaluateeStudentKey) {
      setEvaluateeProfile(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const raw = await oralPerformanceService.getUserProfile(evaluateeStudentKey);
        const p =
          raw && typeof raw === 'object' && 'data' in raw && (raw as { data: unknown }).data
            ? (raw as { data: StudentProfile }).data
            : (raw as StudentProfile);
        if (cancelled || !p || typeof p !== 'object') return;
        const idStr =
          typeof p._id === 'string'
            ? p._id
            : (p._id as { toString?: () => string } | undefined)?.toString?.() || evaluateeStudentKey;
        const profile: StudentProfile = {
          _id: idStr,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
        };
        setEvaluateeProfile(profile);
        setStudentProfiles((prev) => ({ ...prev, [evaluateeStudentKey]: profile }));
      } catch {
        if (!cancelled) setEvaluateeProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [evaluateeStudentKey]);

  
  useEffect(() => {
    if (performanceId) {
      loadPerformance();
    } else {
      console.log('Using student ID:', effectiveStudentId);
    }
  }, [performanceId, effectiveStudentId]);

  // Check for existing evaluation when performance loads
  useEffect(() => {
    if (performance?._id) {
      fetchEvaluation();
    }
  }, [performance?._id]);

  const performanceHasSavedInstructorScores = (p: Performance | null): boolean => {
    if (!p?.scores) return false;
    return Object.values(p.scores).some((v) => typeof v === 'number' && !Number.isNaN(v));
  };

  // One-time: seed instructor rubric from AI when analysis completes (does not overwrite after you edit or when polling)
  useEffect(() => {
    const pid = performance?._id;
    if (!pid || evaluation?.status !== 'completed' || !evaluation.speechMetrics) return;

    if (performanceHasSavedInstructorScores(performance)) {
      aiRubricImportedForPerformanceId.current = pid;
      setShowEvaluationForm(true);
      return;
    }

    if (aiRubricImportedForPerformanceId.current === pid) {
      setShowEvaluationForm(true);
      return;
    }

    aiRubricImportedForPerformanceId.current = pid;
    const sm = evaluation.speechMetrics;
    setScores({
      fluency: Math.round(sm.fluency / 10),
      pronunciation: Math.round(sm.pronunciation / 10),
      speakingPace: Math.min(10, Math.round(sm.speakingPace / 15)),
      confidence: Math.round(sm.confidence / 10),
      contentStructure: evaluation.contentScores?.contentStructure
        ? Math.round(evaluation.contentScores.contentStructure / 10)
        : 8,
    });

    const gemini = evaluation.contentAnalysis?.cefrLevel;
    if (gemini) {
      const levels = ['C2', 'C1', 'B2', 'B1', 'A2', 'A1'] as const;
      const hit = levels.find((l) => gemini.includes(l));
      if (hit) setCefrLevel(hit);
      else {
        const avgScore = (sm.fluency + sm.pronunciation + sm.confidence) / 3;
        if (avgScore >= 85) setCefrLevel('C1');
        else if (avgScore >= 75) setCefrLevel('B2');
        else if (avgScore >= 65) setCefrLevel('B1');
        else if (avgScore >= 55) setCefrLevel('A2');
        else setCefrLevel('A1');
      }
    } else {
      const avgScore = (sm.fluency + sm.pronunciation + sm.confidence) / 3;
      if (avgScore >= 85) setCefrLevel('C1');
      else if (avgScore >= 75) setCefrLevel('B2');
      else if (avgScore >= 65) setCefrLevel('B1');
      else if (avgScore >= 55) setCefrLevel('A2');
      else setCefrLevel('A1');
    }

    setShowEvaluationForm(true);
  }, [evaluation, performance]);

  const loadPerformance = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const data = await oralPerformanceService.getPerformance(performanceId as string);
      setPerformance(data);
      console.log('Loaded performance:', data);
    } catch (error) {
      console.error('Failed to load performance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInstructorHistory = async (): Promise<void> => {
    if (!instructorId) return;

    try {
      setIsHistoryLoading(true);
      const history = await oralPerformanceService.getInstructorPerformances(instructorId);
      const submittedHistory = (history || []).filter((item: Performance) => {
        const hasFeedback = Boolean(item.feedback?.generalComments || item.feedback?.cefrLevel);
        const hasScores = Boolean(item.scores && Object.values(item.scores).some((value) => typeof value === 'number'));
        const isGraded = item.status === 'graded';
        return hasFeedback || hasScores || isGraded;
      });
      setInstructorHistory(submittedHistory);

      const uniqueStudentIds = Array.from(
        new Set(submittedHistory.map((item) => item.studentId).filter(Boolean)),
      );

      const profileEntries = await Promise.all(
        uniqueStudentIds.map(async (id) => {
          try {
            const profile = await oralPerformanceService.getUserProfile(id);
            return [id, profile] as const;
          } catch {
            return [id, null] as const;
          }
        }),
      );

      const profileMap: Record<string, StudentProfile> = {};
      profileEntries.forEach(([id, profile]) => {
        if (profile) {
          profileMap[id] = profile;
        }
      });
      setStudentProfiles((prev) => ({ ...prev, ...profileMap }));
    } catch (error) {
      console.error('Failed to load instructor history:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleScoreChange = (metric: keyof Scores, value: number): void => {
    setScores(prev => ({ ...prev, [metric]: value }));
  };

  const selectedSubmission = useMemo(
    () => instructorHistory.find((item) => item._id === selectedHistoryId) || null,
    [instructorHistory, selectedHistoryId],
  );

  const selectedStudentName = useMemo(() => {
    if (!selectedSubmission) return '';
    const student = studentProfiles[selectedSubmission.studentId];
    if (!student) return 'Unknown student';
    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
    return fullName || student.email || 'Unknown student';
  }, [selectedSubmission, studentProfiles]);

  const evaluateeDisplayName = useMemo(() => {
    const p = evaluateeProfile;
    if (!p) return '';
    const full = `${p.firstName || ''} ${p.lastName || ''}`.trim();
    return full || p.email || 'Student';
  }, [evaluateeProfile]);

  const normalizeToTen = (value?: number, fallback: number = 7): number => {
    if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
    if (value <= 10) return Math.max(1, Math.min(10, Math.round(value)));
    if (value <= 100) return Math.max(1, Math.min(10, Math.round(value / 10)));
    return 10;
  };

  /** Backend expects six rubric scores on a 1–10 scale (UpdateScoresDto). */
  const buildInstructorScoresPayload = (s: Scores) => {
    const clamp = (n: number) => Math.max(1, Math.min(10, Math.round(n)));
    return {
      pronunciation: clamp(s.pronunciation),
      fluency: clamp(s.fluency),
      vocabulary: clamp(s.confidence),
      grammar: clamp((s.contentStructure + s.fluency) / 2),
      comprehension: clamp(s.speakingPace),
      contentOrganization: clamp(s.contentStructure),
    };
  };

  const applyPerformanceToForm = (record: Performance): void => {
    setPerformance(record);

    const fb = record.feedback;
    setNotes(fb?.generalComments ?? '');
    setCefrLevel(fb?.cefrLevel ?? 'B2');

    if (record.scores) {
      const sc = record.scores;
      setScores({
        fluency: normalizeToTen(sc.fluency, scores.fluency),
        pronunciation: normalizeToTen(sc.pronunciation, scores.pronunciation),
        speakingPace: normalizeToTen(sc.comprehension ?? sc.speakingPace, scores.speakingPace),
        confidence: normalizeToTen(sc.vocabulary ?? sc.confidence, scores.confidence),
        contentStructure: normalizeToTen(sc.contentOrganization, scores.contentStructure),
      });
    }
    if (performanceHasSavedInstructorScores(record)) {
      aiRubricImportedForPerformanceId.current = record._id;
    }
  };

  const handleHistorySelection = async (historyId: string): Promise<void> => {
    setSelectedHistoryId(historyId);

    if (!historyId) {
      setNotes('');
      return;
    }

    const selected = instructorHistory.find((item) => item._id === historyId);
    if (!selected) return;

    try {
      const full = await oralPerformanceService.getPerformance(historyId);
      applyPerformanceToForm(full as Performance);
    } catch (error) {
      console.error('Failed to load submission details:', error);
      applyPerformanceToForm(selected);
    }
  };

  const overallScore: number = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length * 10
  );

  const handleUploadRecording = async (): Promise<void> => {
    if (!audioBlob) {
      console.log('No audio blob to upload');
      return;
    }

    try {
      setUploadError(null);
      setUploadSuccess(false);
      setRecordingPrepared(true);
      setUploadSuccess(true);
      setShowEvaluationForm(true);
      setSubmitSuccess(null);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      setUploadError('Failed to prepare recording');
      console.error('Upload error:', error);
    }
  };

 const handleStartEvaluation = async (): Promise<void> => {
  if (!subject.trim()) {
    alert('Please enter a subject/topic for evaluation');
    return;
  }

  try {
    setIsEvaluating(true);
    setUploadError(null);
    let currentPerformance = performance;

    if (!currentPerformance?.audioFile) {
      if (!audioBlob) {
        alert('Please record and save an audio file first');
        return;
      }

      const timeParts = formattedTime.split(':');
      const rawSeconds =
        parseInt(timeParts[0] || '0', 10) * 60 + parseInt(timeParts[1] || '0', 10);
      const durationInSeconds = Math.max(1, Number.isFinite(rawSeconds) ? rawSeconds : 1);

      const newPerformance = await oralPerformanceService.create({
        studentId: effectiveStudentId,
        instructorId: instructorId || undefined,
        title: subject.trim(),
        description: notes || undefined,
      });

      currentPerformance = await oralPerformanceService.uploadAudio(
        newPerformance._id,
        audioBlob,
        durationInSeconds,
      );
      setPerformance(currentPerformance);
      setRecordingPrepared(false);
    }

    if (!currentPerformance?._id) {
      setUploadError('Performance is not ready. Save the recording and try again.');
      return;
    }

    const perfId = currentPerformance._id;
    await startEvaluation(subject.trim(), perfId, evaluationLanguage);

    const idToRefresh = perfId;
    if (idToRefresh) {
      const refreshed = await oralPerformanceService.getPerformance(idToRefresh);
      setPerformance(refreshed);
    }
  } catch (error) {
    console.error('Failed to start evaluation:', error);
    setUploadError(
      error instanceof Error ? error.message : 'Failed to start evaluation',
    );
  } finally {
    setIsEvaluating(false);
  }
};

  const handleSubmitEvaluation = async (): Promise<void> => {
    if (!performance?._id || !performance.audioFile) {
      setUploadError('Save and run AI evaluation first, then submit.');
      return;
    }

    try {
      setIsLoading(true);
      setUploadError(null);
      console.log('Submitting evaluation for:', performance._id);

      await oralPerformanceService.updateScores(
        performance._id,
        buildInstructorScoresPayload(scores),
      );

      await oralPerformanceService.updateFeedback(performance._id, {
        strengths: [],
        weaknesses: [],
        recommendations: [],
        generalComments: notes || '',
        cefrLevel,
      });

      const updated = await oralPerformanceService.getPerformance(performance._id);
      setPerformance(updated);

      setSubmitSuccess('Evaluation submitted successfully.');
      await loadInstructorHistory();
      setTimeout(() => setSubmitSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to submit evaluation:', error);
      setUploadError(
        error instanceof Error ? error.message : 'Failed to submit evaluation',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file);
      // TODO: Handle file upload
    }
  };

  const applyAiSuggestionsToRubric = (): void => {
    if (!evaluation?.speechMetrics || !performance?._id) return;
    const sm = evaluation.speechMetrics;
    setScores({
      fluency: Math.round(sm.fluency / 10),
      pronunciation: Math.round(sm.pronunciation / 10),
      speakingPace: Math.min(10, Math.round(sm.speakingPace / 15)),
      confidence: Math.round(sm.confidence / 10),
      contentStructure: evaluation.contentScores?.contentStructure
        ? Math.round(evaluation.contentScores.contentStructure / 10)
        : scores.contentStructure,
    });
    const gemini = evaluation.contentAnalysis?.cefrLevel;
    if (gemini) {
      const levels = ['C2', 'C1', 'B2', 'B1', 'A2', 'A1'] as const;
      const hit = levels.find((l) => gemini.includes(l));
      if (hit) setCefrLevel(hit);
      else {
        const avgScore = (sm.fluency + sm.pronunciation + sm.confidence) / 3;
        if (avgScore >= 85) setCefrLevel('C1');
        else if (avgScore >= 75) setCefrLevel('B2');
        else if (avgScore >= 65) setCefrLevel('B1');
        else if (avgScore >= 55) setCefrLevel('A2');
        else setCefrLevel('A1');
      }
    } else {
      const avgScore = (sm.fluency + sm.pronunciation + sm.confidence) / 3;
      if (avgScore >= 85) setCefrLevel('C1');
      else if (avgScore >= 75) setCefrLevel('B2');
      else if (avgScore >= 65) setCefrLevel('B1');
      else if (avgScore >= 55) setCefrLevel('A2');
      else setCefrLevel('A1');
    }
    aiRubricImportedForPerformanceId.current = performance._id;
  };

  const handleNewEvaluation = (): void => {
    aiRubricImportedForPerformanceId.current = null;
    stopPolling();
    resetRecording();
    setPerformance(null);
    setSubject('');
    setNotes('');
    setScores({
      fluency: 8,
      pronunciation: 8,
      speakingPace: 7,
      confidence: 7,
      contentStructure: 8,
    });
    setCefrLevel('B2');
    setShowEvaluationForm(false);
    setSubmitSuccess(null);
    setUploadError(null);
    setUploadSuccess(false);
    setRecordingPrepared(false);
    setSelectedHistoryId('');
    setIsPlaying(false);
    setIsEvaluating(false);
    if (studentId) {
      navigate(`/teacher/evaluate/${studentId}`, { replace: true });
    } else {
      navigate('/teacher/evaluate', { replace: true });
    }
  };

  // Helper to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'processing': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // If styles are not available, use fallback classes
  const layoutClass = styles?.layout || 'layout';
  const mainContentClass = styles?.mainContent || 'main-content';
  const contentClass = styles?.content || 'content';
  const pageHeaderClass = styles?.pageHeader || 'page-header';
  const pageTitleClass = styles?.pageTitle || 'page-title';
  const pageSubtitleClass = styles?.pageSubtitle || 'page-subtitle';
  const primaryButtonClass = styles?.primaryButton || 'primary-button';
  const secondaryButtonClass = styles?.secondaryButton || 'secondary-button';
  const cardClass = styles?.card || 'card';
  const cardTitleClass = styles?.cardTitle || 'card-title';

  return (
    <div className={layoutClass}>
      <TeacherSidebar />
      <div className={mainContentClass}>
        <main className={contentClass}>
          <div className={pageHeaderClass}>
            <div>
              <h1 className={pageTitleClass}>
                Evaluate
                {evaluateeStudentKey
                  ? evaluateeDisplayName
                    ? `: ${evaluateeDisplayName}`
                    : ' (loading…)'
                  : ''}
              </h1>
              <p className={pageSubtitleClass}>
                {!evaluateeStudentKey && 'Choose a student from the Students page or history below.'}
                {evaluateeStudentKey && !evaluateeProfile && 'Loading student profile…'}
                {evaluateeProfile?.email ? evaluateeProfile.email : ''}
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={handleNewEvaluation}
                title="Clear this session and start a new evaluation for this student"
              >
                <RotateCcw size={18} />
                New evaluation
              </button>
              {(recordingPrepared || performance?.audioFile) && (
                <button 
                  className={primaryButtonClass}
                  onClick={handleStartEvaluation}
                  disabled={isLoading || isEvaluating}
                >
                  <Send size={18} />
                  {isLoading || isEvaluating ? 'Evaluating...' : 'Start AI Evaluation'}
                </button>
              )}
            </div>
          </div>

          <AiDisclosureNotice />

          {/* Status Messages */}
          {uploadError && (
            <div style={{ 
              backgroundColor: '#fee2e2', 
              color: '#dc2626', 
              padding: '0.75rem', 
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <XCircle size={18} />
              {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div style={{ 
              backgroundColor: '#d1fae5', 
              color: '#059669', 
              padding: '0.75rem', 
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle size={18} />
              Recording prepared locally. It will be saved when AI evaluation starts.
            </div>
          )}

          {submitSuccess && (
            <div style={{
              backgroundColor: '#d1fae5',
              color: '#059669',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle size={18} />
              {submitSuccess}
            </div>
          )}

          {evaluationError && (
            <div style={{ 
              backgroundColor: '#fee2e2', 
              color: '#dc2626', 
              padding: '0.75rem', 
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <XCircle size={18} />
              Evaluation error: {evaluationError}
            </div>
          )}

          {recordingError && (
            <div style={{ 
              backgroundColor: '#fee2e2', 
              color: '#dc2626', 
              padding: '0.75rem', 
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              {recordingError}
            </div>
          )}

          {/* Evaluation Status Banner */}
          {evaluation && (
            <div style={{ 
              backgroundColor: `${getStatusColor(evaluation.status)}10`,
              border: `1px solid ${getStatusColor(evaluation.status)}`,
              color: getStatusColor(evaluation.status),
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {evaluation.status === 'processing' && <Loader size={16} className="spin" />}
                {evaluation.status === 'completed' && <CheckCircle size={16} />}
                {evaluation.status === 'failed' && <XCircle size={16} />}
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  Evaluation Status: {evaluation.status}
                </span>
              </div>
            </div>
          )}

          <div className={evaluateStyles?.evaluateGrid || 'evaluate-grid'}>
            {/* Left: Video/Audio Player */}
            <div className={evaluateStyles?.leftColumn || 'left-column'}>
              {/* Video Upload/Record */}
              <div className={cardClass}>
                <h3 className={cardTitleClass}>Session Recording</h3>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button
                    onClick={() => setRecordMode('upload')}
                    style={{
                      flex: 1, padding: '0.6rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                      fontSize: '0.82rem', fontWeight: '600', transition: 'all 0.2s',
                      background: recordMode === 'upload' ? '#E31837' : 'rgba(0,0,0,0.04)',
                      color: recordMode === 'upload' ? '#fff' : '#64748b',
                    }}
                  >
                    <Upload size={16} /> Upload Recording
                  </button>
                  <button
                    onClick={() => setRecordMode('record')}
                    style={{
                      flex: 1, padding: '0.6rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                      fontSize: '0.82rem', fontWeight: '600', transition: 'all 0.2s',
                      background: recordMode === 'record' ? '#E31837' : 'rgba(0,0,0,0.04)',
                      color: recordMode === 'record' ? '#fff' : '#64748b',
                    }}
                  >
                    <Mic size={16} /> Record Live Session
                  </button>
                </div>

                {recordMode === 'upload' ? (
                  <div className={evaluateStyles?.videoContainer || 'video-container'}>
                    <div className={evaluateStyles?.videoPlaceholder || 'video-placeholder'}>
                      <Upload size={48} />
                      <p>Upload or select a recording to evaluate</p>
                      <input
                        type="file"
                        accept="audio/*"
                        style={{ display: 'none' }}
                        id="audio-upload"
                        onChange={handleFileUpload}
                      />
                      <button 
                        className={secondaryButtonClass}
                        onClick={() => document.getElementById('audio-upload')?.click()}
                      >
                        <Upload size={16} />
                        Upload Recording
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={evaluateStyles?.videoContainer || 'video-container'}>
                    <div className={evaluateStyles?.videoPlaceholder || 'video-placeholder'} style={{ 
                      background: isRecording ? 'rgba(227,24,55,0.03)' : undefined 
                    }}>
                      {audioUrl ? (
                        <div style={{ width: '100%' }}>
                          <audio 
                            controls 
                            src={audioUrl} 
                            style={{ width: '100%', marginBottom: '1rem' }}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className={secondaryButtonClass}
                              onClick={resetRecording}
                              style={{ flex: 1 }}
                            >
                              Record Again
                            </button>
                            <button
                              className={primaryButtonClass}
                              onClick={handleUploadRecording}
                              disabled={isLoading}
                              style={{ flex: 1 }}
                            >
                              {isLoading ? 'Saving...' : 'Save Recording'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Mic size={48} style={{ color: isRecording ? '#E31837' : 'rgba(0,0,0,0.2)' }} />
                          <p>
                            {isRecording 
                              ? 'Recording in progress...' 
                              : performance?.audioFile 
                                ? 'Recording already exists' 
                                : 'Click Record to start capturing the oral presentation'
                            }
                          </p>
                          
                          {!performance?.audioFile && (
                            <>
                              <button
                                className={isRecording ? secondaryButtonClass : primaryButtonClass}
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isLoading}
                                style={isRecording ? { borderColor: '#E31837', color: '#E31837' } : {}}
                              >
                                {isRecording ? (
                                  <><MicOff size={16} /> Stop Recording</>
                                ) : (
                                  <><Mic size={16} /> Start Recording</>
                                )}
                              </button>
                              
                              {isRecording && (
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '0.5rem', 
                                  marginTop: '0.5rem', 
                                  color: '#E31837', 
                                  fontSize: '0.82rem', 
                                  fontWeight: '600' 
                                }}>
                                  <span style={{ 
                                    width: '8px', 
                                    height: '8px', 
                                    borderRadius: '50%', 
                                    background: '#E31837', 
                                    animation: 'pulse 1.5s infinite' 
                                  }} />
                                  REC {formattedTime}
                                </div>
                              )}
                            </>
                          )}

                          {performance?.audioFile && (
                            <div style={{ 
                              marginTop: '1rem',
                              padding: '1rem',
                              background: '#d1fae5',
                              borderRadius: '8px',
                              color: '#059669',
                              width: '100%'
                            }}>
                              <CheckCircle size={24} />
                              <p>Recording saved</p>
                              <audio 
                                controls 
                                src={oralPerformanceService.getAudioUrl(performance._id)}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                              />
                            </div>
                          )}
                          {!performance?.audioFile && recordingPrepared && (
                            <div style={{ 
                              marginTop: '1rem',
                              padding: '1rem',
                              background: '#dbeafe',
                              borderRadius: '8px',
                              color: '#1d4ed8',
                              width: '100%'
                            }}>
                              <CheckCircle size={24} />
                              <p>Recording prepared locally. It will be saved when you press Start AI Evaluation.</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Evaluation Form - Show after upload */}
              {showEvaluationForm && (recordingPrepared || performance?.audioFile) && (
                <div className={cardClass}>
                  <div className={evaluateStyles?.sectionHeader || 'section-header'}>
                    <Bot size={20} />
                    <h3>AI Evaluation</h3>
                  </div>
                  
                  {!evaluation && (
                    <div style={{ padding: '1.5rem' }}>
                      <div className={evaluateStyles?.formGroup || 'form-group'}>
                        <label>Language</label>
                        <select
                          value={evaluationLanguage}
                          onChange={(e) => setEvaluationLanguage(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            marginBottom: '1rem'
                          }}
                        >
                          <option value="en">English</option>
                          <option value="fr">French (Français)</option>
                        </select>
                      </div>
                      <div className={evaluateStyles?.formGroup || 'form-group'}>
                        <label>Subject/Topic</label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Enter the topic the student was asked about"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            marginBottom: '1rem'
                          }}
                        />
                      </div>
                      <button
                        className={primaryButtonClass}
                        onClick={handleStartEvaluation}
                        disabled={isEvaluating || !subject.trim()}
                        style={{ width: '100%' }}
                      >
                        {isEvaluating ? (
                          <>
                            <Loader size={16} className="spin" />
                            Analyzing with AI...
                          </>
                        ) : (
                          'Start AI Evaluation'
                        )}
                      </button>
                    </div>
                  )}

                  {evaluationLoading && (
                    <div style={{ 
                      padding: '2rem', 
                      textAlign: 'center',
                      color: '#64748b'
                    }}>
                      <Loader size={32} className="spin" style={{ marginBottom: '1rem' }} />
                      <p>Processing evaluation... This may take a moment.</p>
                    </div>
                  )}

                  {evaluation?.status === 'completed' &&
                    (evaluation.speechMetrics || evaluation.transcript || evaluation.contentAnalysis) && (
                    <>
                      <div style={{ 
                        padding: '0.5rem 0.75rem', 
                        background: 'rgba(59,130,246,0.06)', 
                        borderRadius: '8px', 
                        margin: '0 1rem 1rem 1rem', 
                        fontSize: '0.72rem', 
                        color: '#3b82f6', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.4rem' 
                      }}>
                        <Bot size={14} /> AI insights (reference only) — use the instructor panel to override and submit grades
                      </div>
                      
                      {/* AI Transcription */}
                      <div style={{ padding: '0 1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#1e293b' }}>
                          AI transcription
                        </h4>
                        <div className={evaluateStyles?.transcription || 'transcription'} style={{
                          background: '#f8fafc',
                          padding: '1rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          lineHeight: '1.6',
                          color: '#334155',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          border: '1px solid #e2e8f0'
                        }}>
                          {evaluation.transcript ? (
                            <p style={{ margin: 0 }}>{evaluation.transcript}</p>
                          ) : (
                            <p style={{ margin: 0, color: '#94a3b8' }}>No transcript was returned for this session.</p>
                          )}
                        </div>
                      </div>

                      {/* AI speech + content metrics */}
                      {evaluation.speechMetrics && (
                      <div style={{ padding: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#1e293b' }}>
                          AI speech metrics
                        </h4>
                        <div className={evaluateStyles?.aiMetrics || 'ai-metrics'} style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '0.75rem'
                        }}>
                          <div className={evaluateStyles?.aiMetric || 'ai-metric'} style={{
                            background: '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '8px'
                          }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Fluency</span>
                            <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a' }}>
                              {evaluation.speechMetrics.fluency}%
                            </div>
                          </div>
                          <div className={evaluateStyles?.aiMetric || 'ai-metric'} style={{
                            background: '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '8px'
                          }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Pronunciation</span>
                            <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a' }}>
                              {evaluation.speechMetrics.pronunciation}%
                            </div>
                          </div>
                          <div className={evaluateStyles?.aiMetric || 'ai-metric'} style={{
                            background: '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '8px'
                          }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Speaking pace</span>
                            <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a' }}>
                              {evaluation.speechMetrics.speakingPace}{' '}
                              <span style={{ fontSize: '0.75rem' }}>WPM</span>
                            </div>
                          </div>
                          <div className={evaluateStyles?.aiMetric || 'ai-metric'} style={{
                            background: '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '8px'
                          }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Confidence</span>
                            <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a' }}>
                              {evaluation.speechMetrics.confidence}%
                            </div>
                          </div>
                        </div>

                        {evaluation.speechMetrics.details && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '0.75rem',
                          background: '#f1f5f9',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          color: '#475569'
                        }}>
                          <strong>Details:</strong> {evaluation.speechMetrics.details.totalWords} words,{' '}
                          {evaluation.speechMetrics.details.fillerWords} filler words,{' '}
                          {typeof evaluation.speechMetrics.details.averagePauseDuration === 'number'
                            ? `${evaluation.speechMetrics.details.averagePauseDuration.toFixed(2)}s avg pause`
                            : '—'}
                        </div>
                        )}

                        {evaluation.contentScores && (
                          <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: '#f1f5f9',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            color: '#475569'
                          }}>
                            <strong>AI content scores:</strong> Structure: {evaluation.contentScores.contentStructure || 0}%, Coherence:{' '}
                            {evaluation.contentScores.coherence}%, Topic: {evaluation.contentScores.topicRelevance}%, Grammar:{' '}
                            {evaluation.contentScores.grammar}%, Vocabulary: {evaluation.contentScores.vocabulary}%
                          </div>
                        )}
                      </div>
                      )}

                      {/* Narrative AI insights (Gemini / content analysis) */}
                      {evaluation.contentAnalysis && (
                        <div style={{ padding: '0 1rem 1rem' }}>
                          <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#1e293b' }}>
                            AI narrative insights
                          </h4>
                          <div style={{
                            background: '#faf5ff',
                            border: '1px solid #e9d5ff',
                            borderRadius: '8px',
                            padding: '0.85rem',
                            fontSize: '0.85rem',
                            color: '#4c1d95',
                            lineHeight: 1.55,
                          }}>
                            {evaluation.contentAnalysis.cefrLevel && (
                              <p style={{ margin: '0 0 0.5rem', fontWeight: 700 }}>
                                Suggested CEFR (from scores): {evaluation.contentAnalysis.cefrLevel}
                              </p>
                            )}
                            {evaluation.contentAnalysis.summary && (
                              <p style={{ margin: '0 0 0.65rem' }}>
                                <strong>Summary</strong><br />
                                {evaluation.contentAnalysis.summary}
                              </p>
                            )}
                            {evaluation.contentAnalysis.keyPoints?.length > 0 && (
                              <div style={{ marginBottom: '0.65rem' }}>
                                <strong>Key points</strong>
                                <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem' }}>
                                  {evaluation.contentAnalysis.keyPoints.map((pt: string, i: number) => (
                                    <li key={i}>{pt}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {evaluation.contentAnalysis.strengths?.length > 0 && (
                              <div style={{ marginBottom: '0.65rem' }}>
                                <strong>Strengths</strong>
                                <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem' }}>
                                  {evaluation.contentAnalysis.strengths.map((s: string, i: number) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {evaluation.contentAnalysis.improvements?.length > 0 && (
                              <div>
                                <strong>Areas to improve</strong>
                                <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem' }}>
                                  {evaluation.contentAnalysis.improvements.map((s: string, i: number) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right: Instructor Evaluation Form */}
            <div className={evaluateStyles?.rightColumn || 'right-column'}>
              <div className={cardClass}>
                <h3 className={cardTitleClass}>My Submission History</h3>
                {isHistoryLoading ? (
                  <p style={{ color: '#64748b' }}>Loading history...</p>
                ) : instructorHistory.length === 0 ? (
                  <p style={{ color: '#64748b' }}>No submitted evaluations yet.</p>
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
                      <option value="">Select a submitted evaluation</option>
                      {instructorHistory.map((item) => {
                        const student = studentProfiles[item.studentId];
                        const studentName = student
                          ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email || 'Unknown student'
                          : 'Unknown student';
                        const createdLabel = item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : 'No date';

                        return (
                          <option key={item._id} value={item._id}>
                            {studentName} - Topic: {item.title} ({createdLabel})
                          </option>
                        );
                      })}
                    </select>

                    {selectedSubmission && (
                      <div
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '0.6rem 0.75rem',
                          background: '#fafafa',
                          fontSize: '0.8rem',
                          color: '#334155',
                        }}
                      >
                        <div><strong>Topic:</strong> {selectedSubmission.title}</div>
                        <div><strong>Student:</strong> {selectedStudentName}</div>
                        <div><strong>CEFR:</strong> {cefrLevel}</div>
                        <div><strong>Fluency:</strong> {scores.fluency}/10</div>
                        <div><strong>Pronunciation:</strong> {scores.pronunciation}/10</div>
                        <div><strong>Speaking Pace:</strong> {scores.speakingPace}/10</div>
                        <div><strong>Confidence:</strong> {scores.confidence}/10</div>
                        <div><strong>Content Structure:</strong> {scores.contentStructure}/10</div>
                        {notes.trim() !== '' && (
                          <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid #e2e8f0' }}>
                            <strong>Feedback and notes (saved)</strong>
                            <p style={{ margin: '0.35rem 0 0', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                              {notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={cardClass}>
                <div className={evaluateStyles?.sectionHeader || 'section-header'}>
                  <User size={20} />
                  <h3>Instructor evaluation (official)</h3>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem', lineHeight: 1.5 }}>
                  Adjust the rubric and CEFR below to <strong>override</strong> AI suggestions. Only these values are saved when you submit.
                </p>
                {evaluation?.status === 'completed' && evaluation.speechMetrics && (
                  <button
                    type="button"
                    className={secondaryButtonClass}
                    onClick={applyAiSuggestionsToRubric}
                    style={{ width: '100%', marginBottom: '1rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Sparkles size={16} />
                    Apply AI suggestions to rubric
                  </button>
                )}

                {/* Overall Score */}
                <div className={evaluateStyles?.overallScore || 'overall-score'}>
                  <div className={evaluateStyles?.scoreCircle || 'score-circle'}>
                    <span>{overallScore}</span>
                    <small>/100</small>
                  </div>
                  <span>Overall Score</span>
                </div>

                {/* CEFR Level */}
                <div className={evaluateStyles?.formGroup || 'form-group'}>
                  <label>CEFR Level</label>
                  <div className={evaluateStyles?.levelButtons || 'level-buttons'}>
                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
                      <button
                        key={level}
                        className={`${evaluateStyles?.levelBtn || 'level-btn'} ${cefrLevel === level ? evaluateStyles?.activeLevel || 'active-level' : ''}`}
                        onClick={() => setCefrLevel(level)}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Score Sliders */}
                <div className={evaluateStyles?.scoreSliders || 'score-sliders'}>
                  {Object.entries(scores).map(([metric, value]) => {
                    const labels: Record<string, string> = {
                      fluency: 'Fluency',
                      pronunciation: 'Pronunciation',
                      speakingPace: 'Speaking Pace',
                      confidence: 'Confidence',
                      contentStructure: 'Content Structure',
                    };
                    return (
                      <div key={metric} className={evaluateStyles?.sliderGroup || 'slider-group'}>
                        <div className={evaluateStyles?.sliderLabel || 'slider-label'}>
                          <span>{labels[metric] || metric}</span>
                          <span>{value}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={value}
                          onChange={(e) => handleScoreChange(metric as keyof Scores, parseInt(e.target.value))}
                          className={evaluateStyles?.slider || 'slider'}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Notes */}
                <div className={evaluateStyles?.formGroup || 'form-group'}>
                  <label>Feedback & Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your feedback and recommendations..."
                    className={evaluateStyles?.textarea || 'textarea'}
                    rows={5}
                  />
                </div>

                {/* Actions */}
                <div className={evaluateStyles?.actions || 'actions'}>
                  <button 
                    className={secondaryButtonClass}
                    disabled={isLoading}
                  >
                    Save Draft
                  </button>
                  <button 
                    className={primaryButtonClass}
                    onClick={handleSubmitEvaluation}
                    disabled={isLoading || !performance?.audioFile}
                  >
                    <Send size={16} />
                    {isLoading ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Evaluate;