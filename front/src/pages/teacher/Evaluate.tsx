// src/pages/teacher/Evaluate.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TeacherSidebar from '../../components/TeacherSidebar';
import TopNavbar from '../../components/TopNavbar';
import AiDisclosureNotice from '../../components/AiDisclosureNotice';
import { Upload, Send, Bot, User, Mic, MicOff, CheckCircle, XCircle, Loader, RotateCcw, Sparkles, ChevronDown, FileSpreadsheet, Download } from 'lucide-react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useEvaluation } from '../../hooks/useEvaluation';
import { oralPerformanceService } from '../services/oralPerformance.service';
import type { InstructorRosterRow } from '../services/oralPerformance.service';
import { useSocket } from '../../context/SocketContext';
import { Video } from 'lucide-react';

// @ts-ignore
import styles from '../../styles/shared.module.css';

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
  updatedAt?: string;
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

function isProfileLookupable(id: string): boolean {
  const value = String(id || '').trim();
  if (!value) return false;
  if (value.includes('@')) return true;
  return /^[a-fA-F0-9]{24}$/.test(value);
}

const Evaluate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { studentId, performanceId } = useParams<{ studentId: string; performanceId: string }>();
  const { socket } = useSocket();

  const [recordMode, setRecordMode] = useState<'upload' | 'record'>('record');
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

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
  const [uploadedAudioBlob, setUploadedAudioBlob] = useState<Blob | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string>('');
  const [uploadedAudioDuration, setUploadedAudioDuration] = useState<number>(0);
  const [uploadedAudioName, setUploadedAudioName] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<'draft' | 'submit' | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [rosterRows, setRosterRows] = useState<InstructorRosterRow[]>([]);
  const [selectedRosterKey, setSelectedRosterKey] = useState<string>('');
  const [isRosterLoading, setIsRosterLoading] = useState<boolean>(false);
  const [isRosterUploading, setIsRosterUploading] = useState<boolean>(false);
  const [rosterFileName, setRosterFileName] = useState<string>('');

  const routeStudentId = studentId ?? '';
  const aiRubricImportedForPerformanceId = useRef<string | null>(null);

  const currentUser = useMemo(() => {
    try { const raw = localStorage.getItem('user'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }, []);

  const routedStudentName =
    location.state && typeof location.state === 'object' && 'studentName' in location.state
      ? String((location.state as { studentName?: unknown }).studentName || '').trim()
      : '';

  const instructorId: string = currentUser?.id || '';

  const selectedRosterStudent = useMemo(() => {
    if (!selectedRosterKey) return null;
    return rosterRows.find((row, index) => `${index}` === selectedRosterKey) || null;
  }, [rosterRows, selectedRosterKey]);

  const selectedRosterStudentId = useMemo(() => {
    if (!selectedRosterStudent) return '';
    if (selectedRosterStudent.studentId?.trim()) return selectedRosterStudent.studentId.trim();
    if (selectedRosterStudent.email?.trim()) return selectedRosterStudent.email.trim();
    const fullName = `${selectedRosterStudent.firstName || ''} ${selectedRosterStudent.lastName || ''}`.trim();
    if (fullName) return fullName;
    return `Roster student ${selectedRosterStudent.rowNumber || selectedRosterKey}`;
  }, [selectedRosterStudent, selectedRosterKey]);

  const effectiveStudentId = selectedRosterStudentId || routeStudentId;

  const normalizeText = (value?: string): string =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

  const handleOnlineExam = async (targetStudentId: string) => {
    if (!targetStudentId) {
      setUploadError('Select a student first.');
      return;
    }
    const currentInstructorId = currentUser?.id || currentUser?._id;
    if (!currentInstructorId) {
      setUploadError('You must be signed in to invite students.');
      return;
    }
    if (!socket) {
      setUploadError('Messaging system is not connected.');
      return;
    }

    // Ensure the teacher is registered on the socket before sending the invite
    socket.emit('register', { userId: String(currentInstructorId) });

    const roomId = `exam_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    
    // Attempt to send invite with a callback to confirm student status
    socket.emit(
      'sendExamInvite', 
      { studentId: targetStudentId, teacherId: String(currentInstructorId), roomId },
      (response: any) => {
        if (response?.status === 'invite_sent') {
          navigate(`/teacher/exam-room/${roomId}`);
        } else {
          setUploadError('The student is currently offline and cannot be invited.');
        }
      }
    );
  };

  const selectedRosterStudentEvaluations = useMemo(() => {
    if (!selectedRosterStudent) return [] as Performance[];

    const targetId = normalizeText(
      selectedRosterStudent.studentId || selectedRosterStudent.email || '',
    );
    const targetFirst = normalizeText(selectedRosterStudent.firstName);
    const targetLast = normalizeText(selectedRosterStudent.lastName);

    const byDate = (item: Performance) =>
      new Date(item.updatedAt || item.createdAt || 0).getTime();

    return instructorHistory
      .filter((item) => {
        if (targetId && normalizeText(item.studentId) === targetId) return true;
        const p = studentProfiles[item.studentId];
        if (!p) return false;
        const pFirst = normalizeText(p.firstName);
        const pLast = normalizeText(p.lastName);
        return Boolean(targetFirst && targetLast && pFirst === targetFirst && pLast === targetLast);
      })
      .sort((a, b) => byDate(b) - byDate(a));
  }, [selectedRosterStudent, instructorHistory, studentProfiles]);

  const latestSelectedRosterEvaluation = selectedRosterStudentEvaluations[0] || null;

  const { isRecording, audioBlob, audioUrl, error: recordingError, formattedTime, startRecording, stopRecording, resetRecording } = useAudioRecorder();

  const { evaluation, isLoading: evaluationLoading, error: evaluationError, startEvaluation, fetchEvaluation, stopPolling } = useEvaluation({
    performanceId: performance?._id || '',
    autoPoll: true,
  });

  const [scores, setScores] = useState<Scores>({ fluency: 8, pronunciation: 8, speakingPace: 7, confidence: 7, contentStructure: 8 });
  const [cefrLevel, setCefrLevel] = useState<string>('B2');
  const [notes, setNotes] = useState<string>('');

  const evaluateeStudentKey = effectiveStudentId || performance?.studentId || '';

  const loadPerformance = useCallback(async (): Promise<void> => {
    if (!performanceId) return;
    try {
      setIsLoading(true);
      const data = await oralPerformanceService.getPerformance(performanceId as string);
      setPerformance(data);
      if (data.title && !subject) setSubject(data.title);
      console.log('Loaded performance:', data);
    } catch (error) {
      console.error('Failed to load performance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [performanceId]);

  const loadInstructorHistory = useCallback(async (): Promise<void> => {
    if (!instructorId) return;
    try {
      setIsHistoryLoading(true);
      const history = await oralPerformanceService.getInstructorPerformances(instructorId);
      const submittedHistory = (history || []).filter((item: Performance) => {
        const hasFeedback = Boolean(item.feedback?.generalComments || item.feedback?.cefrLevel);
        const hasScores = Boolean(item.scores && Object.values(item.scores).some(value => typeof value === 'number'));
        return hasFeedback || hasScores || item.status === 'graded' || item.status === 'pending';
      });
      setInstructorHistory(submittedHistory);
      const uniqueStudentIds = Array.from(
        new Set(
          submittedHistory
            .map((item: Performance) => item.studentId)
            .filter((id): id is string => Boolean(id) && isProfileLookupable(id)),
        ),
      );
      const profileEntries = await Promise.all(uniqueStudentIds.map(async id => {
        try { const profile = await oralPerformanceService.getUserProfile(id); return [id, profile] as const; }
        catch { return [id, null] as const; }
      }));
      const profileMap: Record<string, StudentProfile> = {};
      profileEntries.forEach(([id, profile]) => { if (profile) profileMap[id] = profile; });
      setStudentProfiles(prev => ({ ...prev, ...profileMap }));
    } catch (error) { console.error('Failed to load instructor history:', error); }
    finally { setIsHistoryLoading(false); }
  }, [instructorId]);

  useEffect(() => { if (instructorId) loadInstructorHistory(); }, [instructorId, loadInstructorHistory]);

  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;
    (async () => {
      try {
        setIsRosterLoading(true);
        const roster = await oralPerformanceService.getInstructorRoster(instructorId);
        if (cancelled) return;
        setRosterRows(roster?.rows || []);
        setRosterFileName(roster?.originalFilename || '');
      } catch {
        if (!cancelled) {
          setRosterRows([]);
          setRosterFileName('');
        }
      } finally {
        if (!cancelled) setIsRosterLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [instructorId]);

  useEffect(() => {
    if (!evaluateeStudentKey) { setEvaluateeProfile(null); return; }
    if (!isProfileLookupable(evaluateeStudentKey)) { setEvaluateeProfile(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const raw = await oralPerformanceService.getUserProfile(evaluateeStudentKey);
        const p = raw && typeof raw === 'object' && 'data' in raw && (raw as { data: unknown }).data
          ? (raw as { data: StudentProfile }).data : (raw as StudentProfile);
        if (cancelled || !p || typeof p !== 'object') return;
        const idStr = typeof p._id === 'string' ? p._id : (p._id as { toString?: () => string } | undefined)?.toString?.() || evaluateeStudentKey;
        const profile: StudentProfile = { _id: idStr, firstName: p.firstName, lastName: p.lastName, email: p.email };
        setEvaluateeProfile(profile);
        setStudentProfiles(prev => ({ ...prev, [evaluateeStudentKey]: profile }));
      } catch { if (!cancelled) setEvaluateeProfile(null); }
    })();
    return () => { cancelled = true; };
  }, [evaluateeStudentKey]);

  useEffect(() => {
    if (performanceId) loadPerformance();
    else console.log('Using student ID:', effectiveStudentId);
  }, [performanceId, effectiveStudentId, loadPerformance]);

  useEffect(() => { if (performance?._id) fetchEvaluation(); }, [performance?._id, fetchEvaluation]);

  const performanceHasSavedInstructorScores = (p: Performance | null): boolean => {
    if (!p?.scores) return false;
    return Object.values(p.scores).some(v => typeof v === 'number' && !Number.isNaN(v));
  };

  useEffect(() => {
    const pid = performance?._id;
    if (!pid) return;

    // Always show the evaluation form if we have a saved performance with audio
    if (performance.audioFile) {
      setShowEvaluationForm(true);
    }

    if (evaluation?.status !== 'completed' || !evaluation.speechMetrics) return;
    if (performanceHasSavedInstructorScores(performance)) { aiRubricImportedForPerformanceId.current = pid; return; }
    if (aiRubricImportedForPerformanceId.current === pid) { return; }
    aiRubricImportedForPerformanceId.current = pid;
    const sm = evaluation.speechMetrics;
    setScores({
      fluency: Math.round(sm.fluency / 10),
      pronunciation: Math.round(sm.pronunciation / 10),
      speakingPace: Math.min(10, Math.round(sm.speakingPace / 15)),
      confidence: Math.round(sm.confidence / 10),
      contentStructure: evaluation.contentScores?.contentStructure ? Math.round(evaluation.contentScores.contentStructure / 10) : 8,
    });
    const gemini = evaluation.contentAnalysis?.cefrLevel;
    if (gemini) {
      const levels = ['C2', 'C1', 'B2', 'B1', 'A2', 'A1'] as const;
      const hit = levels.find(l => gemini.includes(l));
      if (hit) setCefrLevel(hit);
      else { const avg = (sm.fluency + sm.pronunciation + sm.confidence) / 3; setCefrLevel(avg >= 85 ? 'C1' : avg >= 75 ? 'B2' : avg >= 65 ? 'B1' : avg >= 55 ? 'A2' : 'A1'); }
    } else { const avg = (sm.fluency + sm.pronunciation + sm.confidence) / 3; setCefrLevel(avg >= 85 ? 'C1' : avg >= 75 ? 'B2' : avg >= 65 ? 'B1' : avg >= 55 ? 'A2' : 'A1'); }
  }, [evaluation, performance]);

  const handleScoreChange = (metric: keyof Scores, value: number): void => setScores(prev => ({ ...prev, [metric]: value }));

  const selectedSubmission = useMemo(() => instructorHistory.find(item => item._id === selectedHistoryId) || null, [instructorHistory, selectedHistoryId]);

  const selectedStudentName = useMemo(() => {
    if (!selectedSubmission) return '';
    const student = studentProfiles[selectedSubmission.studentId];
    if (!student) return 'Unknown student';
    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
    return fullName || student.email || 'Unknown student';
  }, [selectedSubmission, studentProfiles]);

  const normalizeToTen = (value?: number, fallback: number = 7): number => {
    if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
    if (value <= 10) return Math.max(1, Math.min(10, Math.round(value)));
    if (value <= 100) return Math.max(1, Math.min(10, Math.round(value / 10)));
    return 10;
  };

  const buildInstructorScoresPayload = (s: Scores) => {
    const clamp = (n: number) => Math.max(1, Math.min(10, Math.round(n)));
    return { pronunciation: clamp(s.pronunciation), fluency: clamp(s.fluency), vocabulary: clamp(s.confidence), grammar: clamp((s.contentStructure + s.fluency) / 2), comprehension: clamp(s.speakingPace), contentOrganization: clamp(s.contentStructure) };
  };

  const applyPerformanceToForm = (record: Performance): void => {
    // Reset transient local recording/upload state so selected history shows its own persisted audio/details.
    resetRecording();
    setUploadedAudioBlob(null);
    setUploadedAudioUrl('');
    setUploadedAudioDuration(0);
    setUploadedAudioName('');
    setRecordMode('record');

    setPerformance(record);
    setSubject(record.title || '');
    const fb = record.feedback;
    setNotes(fb?.generalComments ?? record.description ?? '');
    setCefrLevel(fb?.cefrLevel ?? 'B2');
    if (record.scores) {
      const sc = record.scores;
      setScores({ fluency: normalizeToTen(sc.fluency, scores.fluency), pronunciation: normalizeToTen(sc.pronunciation, scores.pronunciation), speakingPace: normalizeToTen(sc.comprehension ?? sc.speakingPace, scores.speakingPace), confidence: normalizeToTen(sc.vocabulary ?? sc.confidence, scores.confidence), contentStructure: normalizeToTen(sc.contentOrganization, scores.contentStructure) });
    }
    if (performanceHasSavedInstructorScores(record)) aiRubricImportedForPerformanceId.current = record._id;
    setShowEvaluationForm(Boolean(record.audioFile));
  };

  const handleHistorySelection = async (historyId: string): Promise<void> => {
    setSelectedHistoryId(historyId);
    if (!historyId) { setNotes(''); return; }
    const selected = instructorHistory.find(item => item._id === historyId);
    if (!selected) return;
    try { const full = await oralPerformanceService.getPerformance(historyId); applyPerformanceToForm(full as Performance); }
    catch (error) { console.error('Failed to load submission details:', error); applyPerformanceToForm(selected); }
  };

  const overallScore: number = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length * 10);

  const handleUploadRecording = async (): Promise<void> => {
    const hasUpload = Boolean(uploadedAudioBlob || audioBlob);
    if (!hasUpload) { console.log('No audio blob to upload'); return; }
    try {
      setUploadError(null); setUploadSuccess(false); setRecordingPrepared(true);
      setUploadSuccess(true); setShowEvaluationForm(true); setSubmitSuccess(null);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) { setUploadError('Failed to prepare recording'); console.error('Upload error:', error); }
  };

  const handleStartEvaluation = async (): Promise<void> => {
    if (!effectiveStudentId) {
      setUploadError('Select a student first (from roster or route).');
      return;
    }
    if (!subject.trim()) { alert('Please enter a subject/topic for evaluation'); return; }
    try {
      setIsEvaluating(true); setUploadError(null);
      let currentPerformance = performance;
      if (currentPerformance?.status === 'graded') {
        // Never reuse an already submitted record for a new AI run.
        currentPerformance = null;
      }
      if (!currentPerformance?.audioFile) {
        const audioToUpload = uploadedAudioBlob || audioBlob;
        if (!audioToUpload) { alert('Please record and save an audio file first'); return; }
        const timeParts = formattedTime.split(':');
        const rawSeconds = parseInt(timeParts[0] || '0', 10) * 60 + parseInt(timeParts[1] || '0', 10);
        const durationFromRecording = Math.max(1, Number.isFinite(rawSeconds) ? rawSeconds : 1);
        const durationFromUpload = Number.isFinite(uploadedAudioDuration) ? uploadedAudioDuration : 0;
        const durationInSeconds = Math.max(1, Math.round(durationFromUpload || durationFromRecording));
        const newPerformance = await oralPerformanceService.create({ studentId: effectiveStudentId, instructorId: instructorId || undefined, title: subject.trim(), description: notes || undefined });
        currentPerformance = await oralPerformanceService.uploadAudio(newPerformance._id, audioToUpload, durationInSeconds);
        setSelectedHistoryId('');
        setPerformance(currentPerformance); 
        setRecordingPrepared(false);
        setShowEvaluationForm(true);
        
        // Navigate to the performance URL to persist state on reload
        navigate(`/teacher/evaluate/${effectiveStudentId}/${currentPerformance._id}`, { replace: true });
      }
      if (!currentPerformance?._id) { setUploadError('Performance is not ready. Save the recording and try again.'); return; }
      const perfId = currentPerformance._id;
      await startEvaluation(subject.trim(), perfId, evaluationLanguage);
      if (perfId) { const refreshed = await oralPerformanceService.getPerformance(perfId); setPerformance(refreshed); }
    } catch (error) { console.error('Failed to start evaluation:', error); setUploadError(error instanceof Error ? error.message : 'Failed to start evaluation'); }
    finally { setIsEvaluating(false); }
  };

  const handleSubmitEvaluation = async (): Promise<boolean> => {
    if (!performance?._id || !performance.audioFile) { setUploadError('Save and run AI evaluation first, then submit.'); return; }
    try {
      setIsLoading(true); setUploadError(null);
      await oralPerformanceService.updateScores(performance._id, buildInstructorScoresPayload(scores));
      await oralPerformanceService.updateFeedback(performance._id, { strengths: [], weaknesses: [], recommendations: [], generalComments: notes || '', cefrLevel });
      const updated = await oralPerformanceService.getPerformance(performance._id);
      setPerformance(updated); setSubmitSuccess('Evaluation submitted successfully.');

      // Refresh roster preview so CEFR appears immediately after submission.
      if (instructorId) {
        const roster = await oralPerformanceService.getInstructorRoster(instructorId);
        setRosterRows(roster?.rows || []);
        setRosterFileName(roster?.originalFilename || '');
      }

      await loadInstructorHistory();
      return true;
    } catch (error) { console.error('Failed to submit evaluation:', error); setUploadError(error instanceof Error ? error.message : 'Failed to submit evaluation'); }
    finally { setIsLoading(false); }
    return false;
  };

  const handleSaveDraft = async (): Promise<boolean> => {
    if (!performance?._id || !performance.audioFile) { setUploadError('Save and run AI evaluation first, then save draft.'); return; }
    try {
      setIsLoading(true); setUploadError(null);
      await oralPerformanceService.updateScores(performance._id, buildInstructorScoresPayload(scores));
      await oralPerformanceService.updateStatus(performance._id, 'pending');
      const updated = await oralPerformanceService.getPerformance(performance._id);
      setPerformance(updated);
      setSubmitSuccess('Draft saved (pending).');
      await loadInstructorHistory();
      return true;
    } catch (error) {
      console.error('Failed to save draft:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to save draft');
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  const isAlreadySubmitted = performance?.status === 'graded';

  const openActionConfirmation = (action: 'draft' | 'submit'): void => {
    if (action === 'submit' && isAlreadySubmitted) {
      setUploadError('This evaluation is already validated and cannot be submitted again.');
      return;
    }
    setPendingAction(action);
  };

  const closeActionDialogs = (): void => {
    if (isLoading) return;
    setPendingAction(null);
    setActionSuccessMessage(null);
  };

  const confirmActionAndProceed = async (): Promise<void> => {
    if (!pendingAction) return;
    const action = pendingAction;
    const ok = action === 'submit' ? await handleSubmitEvaluation() : await handleSaveDraft();
    if (!ok) return;

    if (action === 'submit') {
      setActionSuccessMessage(`Validated successfully. CEFR ${cefrLevel} sent to student.`);
    } else {
      setActionSuccessMessage('Saved as draft successfully.');
    }
    setPendingAction(null);
    // Refresh history and data instead of full reload
    await loadInstructorHistory();
    if (performance?._id) {
      const updated = await oralPerformanceService.getPerformance(performance._id);
      setPerformance(updated);
    }
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const getSubmissionStatusIndicator = (status?: string): string => {
    return status === 'graded' ? '🟢' : '🔴';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadError(null); setUploadSuccess(false);
      const objectUrl = URL.createObjectURL(file);
      const audio = new Audio();
      const duration = await new Promise<number>(resolve => { audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? audio.duration : 0); audio.onerror = () => resolve(0); audio.src = objectUrl; });
      setUploadedAudioBlob(file); setUploadedAudioUrl(objectUrl); setUploadedAudioDuration(duration); setUploadedAudioName(file.name || 'uploaded-audio');
      setRecordingPrepared(true); setShowEvaluationForm(true); setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) { setUploadError('Failed to load the selected audio file'); console.error('Upload error:', error); }
  };

  const handleRosterUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file || !instructorId) return;
    try {
      setIsRosterUploading(true);
      setUploadError(null);
      // Clear previous roster UI immediately so old students do not linger.
      setSelectedRosterKey('');
      setRosterRows([]);
      setRosterFileName('');

      await oralPerformanceService.uploadInstructorRoster(instructorId, file);
      const roster = await oralPerformanceService.getInstructorRoster(instructorId);
      setRosterRows(roster?.rows || []);
      setRosterFileName(roster?.originalFilename || file.name);
      setSubmitSuccess('Roster uploaded successfully. Select a student to evaluate.');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload roster file');
    } finally {
      setIsRosterUploading(false);
      e.target.value = '';
    }
  };

  const handleExportRoster = (): void => {
    if (!instructorId) return;
    const url = oralPerformanceService.getInstructorRosterExportUrl(instructorId);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const applyAiSuggestionsToRubric = (): void => {
    if (!evaluation?.speechMetrics || !performance?._id) return;
    const sm = evaluation.speechMetrics;
    setScores({ fluency: Math.round(sm.fluency / 10), pronunciation: Math.round(sm.pronunciation / 10), speakingPace: Math.min(10, Math.round(sm.speakingPace / 15)), confidence: Math.round(sm.confidence / 10), contentStructure: evaluation.contentScores?.contentStructure ? Math.round(evaluation.contentScores.contentStructure / 10) : scores.contentStructure });
    const gemini = evaluation.contentAnalysis?.cefrLevel;
    if (gemini) { const levels = ['C2', 'C1', 'B2', 'B1', 'A2', 'A1'] as const; const hit = levels.find(l => gemini.includes(l)); if (hit) setCefrLevel(hit); else { const avg = (sm.fluency + sm.pronunciation + sm.confidence) / 3; setCefrLevel(avg >= 85 ? 'C1' : avg >= 75 ? 'B2' : avg >= 65 ? 'B1' : avg >= 55 ? 'A2' : 'A1'); } }
    else { const avg = (sm.fluency + sm.pronunciation + sm.confidence) / 3; setCefrLevel(avg >= 85 ? 'C1' : avg >= 75 ? 'B2' : avg >= 65 ? 'B1' : avg >= 55 ? 'A2' : 'A1'); }
    aiRubricImportedForPerformanceId.current = performance._id;
  };

  const handleNewEvaluation = (): void => {
    aiRubricImportedForPerformanceId.current = null; stopPolling(); resetRecording(); setPerformance(null); setSubject(''); setNotes('');
    setScores({ fluency: 8, pronunciation: 8, speakingPace: 7, confidence: 7, contentStructure: 8 }); setCefrLevel('B2');
    setShowEvaluationForm(false); setSubmitSuccess(null); setUploadError(null); setUploadSuccess(false); setRecordingPrepared(false);
    setUploadedAudioBlob(null); setUploadedAudioUrl(''); setUploadedAudioDuration(0); setUploadedAudioName(''); setSelectedHistoryId(''); setIsEvaluating(false);
    if (studentId) navigate(`/teacher/evaluate/${studentId}`, { replace: true });
    else navigate('/teacher/evaluate', { replace: true });
  };

  const layoutClass = styles?.layout || 'layout';
  const mainContentClass = styles?.mainContent || 'main-content';
  const contentClass = styles?.content || 'content';
  const primaryButtonClass = styles?.primaryButton || 'primary-button';
  const secondaryButtonClass = styles?.secondaryButton || 'secondary-button';

  const scoreColor = (val: number) => val >= 8 ? '#22c55e' : val >= 6 ? '#f59e0b' : '#ef4444';

  return (
    <div className={layoutClass}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .spin { animation: spin 1s linear infinite; }
        .ev-root { animation: fadeUp 0.3s ease; }

        .ev-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
        }
        .ev-badge {
          display: inline-flex; align-items: center;
          font-size: 0.65rem; font-weight: 700; color: #E31837;
          text-transform: uppercase; letter-spacing: 0.12em;
          background: rgba(227,24,55,0.08); border: 1px solid rgba(227,24,55,0.15);
          padding: 0.25rem 0.7rem; border-radius: 99px; margin-bottom: 0.4rem;
        }
        .ev-title {
          font-size: 1.6rem; font-weight: 800; color: #0f172a;
          letter-spacing: -0.03em; line-height: 1.2; margin: 0 0 0.25rem;
        }
        .ev-subtitle { font-size: 0.85rem; color: #64748b; margin: 0; }
        .ev-actions { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; flex-shrink: 0; }

        .ev-alert {
          display: flex; align-items: center; gap: 10px;
          padding: 0.75rem 1rem; border-radius: 12px;
          font-size: 0.85rem; font-weight: 500; margin-bottom: 0.6rem;
        }
        .ev-alert.error { background: #fef2f4; border: 1px solid #fecdd3; color: #be123c; }
        .ev-alert.success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
        .ev-alert.warning { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
        .ev-alert.info { background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.2); color: #1d4ed8; }

        .ev-eval-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 1.25rem;
          align-items: start;
        }
        @media (max-width: 1024px) { .ev-eval-grid { grid-template-columns: 1fr; } }

        .ev-card {
          background: #fff; border-radius: 18px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 16px rgba(0,0,0,0.04);
          overflow: hidden; margin-bottom: 1.25rem;
        }
        .ev-card-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f8fafc;
          display: flex; align-items: center; gap: 10px;
        }
        .ev-card-header h3 { margin: 0; font-size: 0.95rem; font-weight: 700; color: #0f172a; }
        .ev-card-body { padding: 1.25rem 1.5rem; }

        .ev-mode-tabs {
          display: flex; gap: 6px;
          padding: 1rem 1.5rem 0;
        }
        .ev-mode-tab {
          flex: 1; padding: 0.6rem;
          border-radius: 10px; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 0.82rem; font-weight: 600; transition: all 0.2s;
          background: #f8fafc; color: #64748b;
        }
        .ev-mode-tab:hover { background: #fef2f4; color: #E31837; }
        .ev-mode-tab.active { background: linear-gradient(135deg,#E31837,#B71C1C); color: #fff; box-shadow: 0 4px 12px rgba(227,24,55,0.3); }

        .ev-record-area {
          padding: 1.5rem;
          min-height: 200px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; gap: 1rem;
        }
        .ev-record-icon {
          width: 72px; height: 72px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s ease;
        }
        .ev-record-icon.idle { background: #f8fafc; color: #94a3b8; }
        .ev-record-icon.recording { background: rgba(227,24,55,0.08); color: #E31837; animation: pulse 1.5s infinite; }

        .ev-rec-timer {
          display: flex; align-items: center; gap: 8px;
          background: rgba(227,24,55,0.08); border: 1px solid rgba(227,24,55,0.2);
          padding: 0.4rem 0.9rem; border-radius: 99px;
          color: #E31837; font-size: 0.85rem; font-weight: 700;
        }
        .ev-rec-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #E31837;
          animation: pulse 1s infinite;
        }

        .ev-search-box {
          background: #f8fafc; border: 1.5px solid #f1f5f9;
          border-radius: 14px; padding: 1.5rem; margin-bottom: 1.25rem;
        }
        .ev-search-kicker { font-size: 0.65rem; font-weight: 700; color: #E31837; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
        .ev-search-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.25rem; }
        .ev-search-sub { font-size: 0.82rem; color: #64748b; margin-bottom: 1rem; }
        .ev-search-row { display: flex; gap: 8px; }
        .ev-search-input {
          flex: 1; padding: 0.75rem 1rem; border: 1.5px solid #e5e7eb;
          border-radius: 12px; font-size: 0.9rem; color: #1f2937;
          background: #fff; outline: none; transition: border-color 0.2s;
        }
        .ev-search-input:focus { border-color: #E31837; box-shadow: 0 0 0 3px rgba(227,24,55,0.08); }
        .ev-search-btn {
          padding: 0.75rem 1.25rem; background: linear-gradient(135deg,#E31837,#B71C1C);
          color: #fff; border: none; border-radius: 12px; font-weight: 700; cursor: pointer;
          font-size: 0.88rem; display: flex; align-items: center; gap: 6px;
          box-shadow: 0 4px 12px rgba(227,24,55,0.3); transition: all 0.2s;
        }
        .ev-search-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .ev-search-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .ev-result-item {
          padding: 0.75rem 1rem; background: #fff; border: 1.5px solid #f1f5f9;
          border-radius: 12px; cursor: pointer; transition: all 0.2s; margin-top: 6px;
        }
        .ev-result-item:hover { border-color: rgba(227,24,55,0.3); background: #fef9fa; }

        .ev-selected-student {
          display: flex; justify-content: space-between; align-items: center;
          background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 14px;
          padding: 1rem 1.25rem; margin-bottom: 1.25rem;
        }

        .ev-section-header {
          display: flex; align-items: center; gap: 10px; padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f8fafc;
        }
        .ev-section-header h3 { margin: 0; font-size: 0.95rem; font-weight: 700; color: #0f172a; }
        .ev-section-icon {
          width: 34px; height: 34px; border-radius: 10px;
          background: rgba(227,24,55,0.08); color: #E31837;
          display: flex; align-items: center; justify-content: center;
        }

        .ev-ai-hint {
          margin: 0 1.25rem 1rem;
          padding: 0.5rem 0.75rem;
          background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.15);
          border-radius: 10px; font-size: 0.75rem; color: #1d4ed8;
          display: flex; align-items: center; gap: 6px;
        }

        .ev-transcript-box {
          background: #f8fafc; border: 1px solid #e5e7eb;
          border-radius: 12px; padding: 1rem; font-size: 0.88rem;
          line-height: 1.6; color: #334155; max-height: 180px; overflow-y: auto;
        }

        .ev-metrics-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 0.75rem; }
        .ev-metric-card {
          background: #f8fafc; border: 1px solid #f1f5f9;
          border-radius: 12px; padding: 0.85rem;
        }
        .ev-metric-label { font-size: 0.72rem; color: #64748b; font-weight: 600; margin-bottom: 0.25rem; }
        .ev-metric-val { font-size: 1.3rem; font-weight: 800; color: #0f172a; }

        .ev-narrative-box {
          background: linear-gradient(135deg, #faf5ff, #f5f3ff);
          border: 1px solid #e9d5ff; border-radius: 12px;
          padding: 1rem; font-size: 0.85rem; color: #4c1d95; line-height: 1.6;
        }

        .ev-score-circle-wrap {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 1.25rem; gap: 0.5rem;
          border-bottom: 1px solid #f8fafc;
        }
        .ev-score-ring {
          width: 90px; height: 90px; border-radius: 50%;
          background: conic-gradient(#E31837 0% calc(var(--pct) * 1%), #f1f5f9 0%);
          display: flex; align-items: center; justify-content: center;
          position: relative;
        }
        .ev-score-ring::before {
          content: ''; position: absolute; inset: 8px;
          background: #fff; border-radius: 50%;
        }
        .ev-score-num {
          position: relative; z-index: 1;
          font-size: 1.4rem; font-weight: 800; color: #0f172a;
        }
        .ev-score-label { font-size: 0.78rem; color: #64748b; font-weight: 600; }

        .ev-cefr-btns { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 0.5rem; }
        .ev-cefr-btn {
          padding: 0.4rem 0.75rem; border-radius: 8px;
          border: 1.5px solid #e5e7eb; background: #f8fafc;
          font-size: 0.82rem; font-weight: 700; cursor: pointer;
          color: #64748b; transition: all 0.2s;
        }
        .ev-cefr-btn:hover { border-color: #E31837; color: #E31837; background: #fef2f4; }
        .ev-cefr-btn.active { background: linear-gradient(135deg,#E31837,#B71C1C); color: #fff; border-color: transparent; box-shadow: 0 3px 8px rgba(227,24,55,0.3); }

        .ev-slider-group { margin-bottom: 1rem; }
        .ev-slider-label {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 0.4rem; font-size: 0.82rem;
        }
        .ev-slider-label span:first-child { color: #374151; font-weight: 600; }
        .ev-slider-val { font-weight: 800; font-size: 0.9rem; }
        .ev-slider {
          width: 100%; height: 6px; border-radius: 99px;
          background: #f1f5f9; outline: none; cursor: pointer;
          -webkit-appearance: none; appearance: none;
        }
        .ev-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: linear-gradient(135deg,#E31837,#B71C1C);
          border: 2px solid #fff; box-shadow: 0 2px 8px rgba(227,24,55,0.4);
          cursor: pointer; transition: transform 0.2s;
        }
        .ev-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }

        .ev-textarea {
          width: 100%; padding: 0.85rem 1rem; border: 1.5px solid #e5e7eb;
          border-radius: 12px; font-size: 0.88rem; color: #1f2937;
          background: #f9fafb; resize: vertical; font-family: inherit;
          line-height: 1.6; outline: none; transition: border-color 0.2s;
        }
        .ev-textarea:focus { border-color: #E31837; background: #fff; box-shadow: 0 0 0 3px rgba(227,24,55,0.08); }

        .ev-submit-row {
          display: flex; gap: 0.75rem; padding: 1.25rem 1.5rem;
          border-top: 1px solid #f8fafc;
        }

        .ev-select {
          width: 100%; padding: 0.75rem 0.9rem; border: 1.5px solid #e5e7eb;
          border-radius: 12px; font-size: 0.88rem; color: #1f2937;
          background: #fff; outline: none; cursor: pointer; font-family: inherit;
          transition: border-color 0.2s;
        }
        .ev-select:focus { border-color: #E31837; box-shadow: 0 0 0 3px rgba(227,24,55,0.08); }

        .ev-history-select-wrap {
          position: relative;
          margin-bottom: 0.75rem;
        }
        .ev-history-select {
          width: 100%;
          padding: 0.82rem 2.4rem 0.82rem 0.95rem;
          border: 1.5px solid #dbe3ef;
          border-radius: 14px;
          font-size: 0.86rem;
          color: #0f172a;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
          outline: none;
          cursor: pointer;
          font-family: inherit;
          font-weight: 500;
          box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
          -webkit-appearance: none;
          appearance: none;
        }
        .ev-history-select:hover {
          border-color: #c7d3e4;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.07);
        }
        .ev-history-select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12), 0 6px 18px rgba(15, 23, 42, 0.08);
        }
        .ev-history-chevron {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }
        .ev-history-legend {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }
        .ev-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.01em;
        }
        .ev-status-pill.pending {
          color: #991b1b;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }
        .ev-status-pill.graded {
          color: #166534;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
        }

        .ev-history-card {
          border: 1px solid #f1f5f9; border-radius: 12px;
          padding: 0.85rem 1rem; background: #fafafa;
          font-size: 0.8rem; color: #334155; line-height: 1.7;
        }
        .ev-history-row { display: flex; justify-content: space-between; }
        .ev-history-row strong { color: #0f172a; }

        .ev-ai-loading {
          display: flex; flex-direction: column; align-items: center;
          gap: 0.75rem; padding: 2.5rem 1rem; color: #64748b; font-size: 0.88rem;
        }
        .ev-details-box {
          background: #f1f5f9; border-radius: 10px; padding: 0.75rem;
          font-size: 0.82rem; color: #475569; margin-top: 0.75rem;
        }

        .ev-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          animation: evFadeIn 220ms ease;
        }
        .ev-modal {
          width: min(460px, calc(100vw - 2rem));
          border-radius: 18px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e2e8f0;
          box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
          overflow: hidden;
          animation: evPopIn 260ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ev-modal-head {
          padding: 1rem 1.2rem;
          border-bottom: 1px solid #eef2f7;
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .ev-modal-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(227, 24, 55, 0.1);
          color: #be123c;
        }
        .ev-modal-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
        }
        .ev-modal-body {
          padding: 1rem 1.2rem;
          color: #334155;
          font-size: 0.9rem;
          line-height: 1.6;
        }
        .ev-modal-actions {
          display: flex;
          gap: 0.7rem;
          padding: 0 1.2rem 1.2rem;
        }
        .ev-modal-actions button {
          flex: 1;
          justify-content: center;
        }
        .ev-success-accent {
          background: rgba(22, 163, 74, 0.12);
          color: #15803d;
        }
        @keyframes evFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes evPopIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <TeacherSidebar />
      <div className={mainContentClass}>
        <TopNavbar />
        <main className={contentClass}>
          <div className="ev-root">

            {/* Page Header */}
            <div className="ev-header">
              <div>
                <div className="ev-badge">Instructor Review</div>
                <h1 className="ev-title">
                  Evaluate{selectedRosterStudent?.firstName || selectedRosterStudent?.lastName
                    ? `: ${(selectedRosterStudent?.firstName || '')} ${(selectedRosterStudent?.lastName || '')}`.trim()
                    : evaluateeProfile?.firstName || evaluateeProfile?.lastName
                    ? `: ${(evaluateeProfile?.firstName || '')} ${(evaluateeProfile?.lastName || '')}`.trim()
                    : routedStudentName
                    ? `: ${routedStudentName}`
                    : evaluateeProfile?.email ? `: ${evaluateeProfile.email}` : ''}
                </h1>
                {(selectedRosterStudent?.email || evaluateeProfile?.email) && (
                  <p className="ev-subtitle">Email: {selectedRosterStudent?.email || evaluateeProfile?.email}</p>
                )}
              </div>
              <div className="ev-actions">
                <button type="button" className={secondaryButtonClass} onClick={handleNewEvaluation} title="Clear this session and start a new evaluation">
                  <RotateCcw size={16} /> New evaluation
                </button>
                <button type="button" className={secondaryButtonClass} onClick={() => handleOnlineExam(effectiveStudentId)} disabled={!effectiveStudentId}>
                  <Video size={16} /> Invite to Online Exam
                </button>
                {(recordingPrepared || performance?.audioFile) && (
                  <button className={primaryButtonClass} onClick={handleStartEvaluation} disabled={isLoading || isEvaluating}>
                    <Send size={16} />
                    {isLoading || isEvaluating ? 'Evaluating...' : 'Start AI Evaluation'}
                  </button>
                )}
              </div>
            </div>

            <AiDisclosureNotice />

            {/* Alerts */}
            {uploadError && <div className="ev-alert error"><XCircle size={16} />{uploadError}</div>}
            {uploadSuccess && <div className="ev-alert success"><CheckCircle size={16} />Recording prepared locally. It will be saved when AI evaluation starts.</div>}
            {submitSuccess && <div className="ev-alert success"><CheckCircle size={16} />{submitSuccess}</div>}
            {evaluationError && <div className="ev-alert error"><XCircle size={16} />Evaluation error: {evaluationError}</div>}
            {recordingError && <div className="ev-alert error"><XCircle size={16} />{recordingError}</div>}

            {/* Eval Status Banner */}
            {evaluation && (
              <div className={`ev-alert ${evaluation.status === 'completed' ? 'success' : evaluation.status === 'processing' ? 'warning' : 'error'}`} style={{ marginBottom: '1rem' }}>
                {evaluation.status === 'processing' && <Loader size={15} className="spin" />}
                {evaluation.status === 'completed' && <CheckCircle size={15} />}
                {evaluation.status === 'failed' && <XCircle size={15} />}
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>Evaluation Status: {evaluation.status}</span>
              </div>
            )}

            <div className="ev-eval-grid">
                {/* LEFT COLUMN */}
                <div>
                  {/* Recording Card */}
                  <div className="ev-card">
                    <div className="ev-card-header">
                      <div className="ev-section-icon"><Mic size={16} /></div>
                      <h3>Session Recording</h3>
                    </div>
                    <div className="ev-mode-tabs">
                      <button onClick={() => setRecordMode('upload')} className={`ev-mode-tab${recordMode === 'upload' ? ' active' : ''}`}>
                        <Upload size={15} /> Upload Recording
                      </button>
                      <button onClick={() => setRecordMode('record')} className={`ev-mode-tab${recordMode === 'record' ? ' active' : ''}`}>
                        <Mic size={15} /> Record Live
                      </button>
                      <button onClick={() => handleOnlineExam(effectiveStudentId)} className="ev-mode-tab" disabled={!effectiveStudentId}>
                        <Video size={15} /> Invite to Online Exam
                      </button>
                    </div>

                    {recordMode === 'upload' ? (
                      <div className="ev-record-area">
                        {uploadedAudioUrl ? (
                          <div style={{ width: '100%' }}>
                            <audio controls src={uploadedAudioUrl} style={{ width: '100%', marginBottom: '0.75rem' }} />
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <button className={secondaryButtonClass} onClick={() => { setUploadedAudioBlob(null); setUploadedAudioUrl(''); setUploadedAudioDuration(0); setUploadedAudioName(''); setRecordingPrepared(false); }} style={{ flex: 1 }}>
                                Choose Another
                              </button>
                              <button className={primaryButtonClass} onClick={handleUploadRecording} disabled={isLoading} style={{ flex: 1 }}>
                                {isLoading ? 'Saving...' : 'Save Recording'}
                              </button>
                            </div>
                            {uploadedAudioName && <div style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>{uploadedAudioName}</div>}
                          </div>
                        ) : performance?.audioFile ? (
                          <div style={{ width: '100%' }}>
                            <audio controls src={oralPerformanceService.getAudioUrl(performance._id)} style={{ width: '100%', marginBottom: '0.75rem' }} />
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>Saved submission recording</div>
                          </div>
                        ) : (
                          <>
                            <div className="ev-record-icon idle"><Upload size={28} /></div>
                            <div style={{ color: '#64748b', fontSize: '0.88rem' }}>Upload or select a recording to evaluate</div>
                            <input type="file" accept="audio/*" style={{ display: 'none' }} id="audio-upload" onChange={handleFileUpload} />
                            <button className={secondaryButtonClass} onClick={() => document.getElementById('audio-upload')?.click()}>
                              <Upload size={15} /> Upload Recording
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="ev-record-area" style={{ background: isRecording ? 'rgba(227,24,55,0.02)' : undefined }}>
                        {audioUrl ? (
                          <div style={{ width: '100%' }}>
                            <audio controls src={audioUrl} style={{ width: '100%', marginBottom: '0.75rem' }} />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className={secondaryButtonClass} onClick={resetRecording} style={{ flex: 1 }}>Record Again</button>
                              <button className={primaryButtonClass} onClick={handleUploadRecording} disabled={isLoading} style={{ flex: 1 }}>
                                {isLoading ? 'Saving...' : 'Save Recording'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className={`ev-record-icon ${isRecording ? 'recording' : 'idle'}`}>
                              <Mic size={28} />
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.88rem' }}>
                              {isRecording ? 'Recording in progress...' : performance?.audioFile ? 'Recording already exists' : 'Click Record to start capturing the oral presentation'}
                            </div>
                            {!performance?.audioFile && (
                              <>
                                <button className={isRecording ? secondaryButtonClass : primaryButtonClass}
                                  onClick={isRecording ? stopRecording : startRecording} disabled={isLoading}
                                  style={isRecording ? { borderColor: '#E31837', color: '#E31837' } : {}}>
                                  {isRecording ? <><MicOff size={15} /> Stop Recording</> : <><Mic size={15} /> Start Recording</>}
                                </button>
                                {isRecording && (
                                  <div className="ev-rec-timer">
                                    <div className="ev-rec-dot" />
                                    REC {formattedTime}
                                  </div>
                                )}
                              </>
                            )}
                            {performance?.audioFile && (
                              <div style={{ width: '100%', padding: '1rem', background: '#f0fdf4', borderRadius: '12px', color: '#15803d', textAlign: 'center' }}>
                                <CheckCircle size={22} style={{ marginBottom: '0.5rem' }} />
                                <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>Recording saved</p>
                                <audio controls src={oralPerformanceService.getAudioUrl(performance._id)} style={{ width: '100%' }} />
                              </div>
                            )}
                            {!performance?.audioFile && recordingPrepared && (
                              <div style={{ width: '100%', padding: '1rem', background: '#eff6ff', borderRadius: '12px', color: '#1d4ed8', textAlign: 'center' }}>
                                <CheckCircle size={22} style={{ marginBottom: '0.5rem' }} />
                                <p style={{ margin: 0, fontSize: '0.85rem' }}>Recording prepared locally. It will be saved when you press Start AI Evaluation.</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AI Evaluation Card */}
                  {(showEvaluationForm || recordingPrepared || performance?.audioFile) && (
                    <div className="ev-card">
                      <div className="ev-section-header">
                        <div className="ev-section-icon"><Bot size={16} /></div>
                        <h3>AI Evaluation</h3>
                      </div>

                      {!evaluation && (
                        <div className="ev-card-body">
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Language</label>
                            <select value={evaluationLanguage} onChange={e => setEvaluationLanguage(e.target.value)} className="ev-select">
                              <option value="en">English</option>
                              <option value="fr">French (Français)</option>
                            </select>
                          </div>
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Subject / Topic</label>
                            <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                              placeholder="Enter the topic the student was asked about"
                              className="ev-search-input" style={{ width: '100%', marginBottom: 0 }} />
                          </div>
                          <button className={primaryButtonClass} onClick={handleStartEvaluation} disabled={isEvaluating || !subject.trim()} style={{ width: '100%', justifyContent: 'center' }}>
                            {isEvaluating ? <><Loader size={15} className="spin" /> Analyzing with AI...</> : 'Start AI Evaluation'}
                          </button>
                        </div>
                      )}

                      {evaluationLoading && (
                        <div className="ev-ai-loading">
                          <Loader size={30} className="spin" style={{ color: '#E31837' }} />
                          <span>Processing evaluation… This may take a moment.</span>
                        </div>
                      )}

                      {evaluation?.status === 'completed' && (evaluation.speechMetrics || evaluation.transcript || evaluation.contentAnalysis) && (
                        <>
                          <div className="ev-ai-hint">
                            <Bot size={13} /> AI insights (reference only) — use the instructor panel to override and submit grades
                          </div>

                          {/* Transcript */}
                          <div style={{ padding: '0 1.25rem 1rem' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>AI Transcription</div>
                            <div className="ev-transcript-box">
                              {evaluation.transcript
                                ? <p style={{ margin: 0 }}>{evaluation.transcript}</p>
                                : <p style={{ margin: 0, color: '#94a3b8' }}>No transcript was returned for this session.</p>}
                            </div>
                          </div>

                          {/* Speech Metrics */}
                          {evaluation.speechMetrics && (
                            <div style={{ padding: '0 1.25rem 1rem' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.75rem' }}>AI Speech Metrics</div>
                              <div className="ev-metrics-grid">
                                {[
                                  { label: 'Fluency', value: `${evaluation.speechMetrics.fluency}%` },
                                  { label: 'Pronunciation', value: `${evaluation.speechMetrics.pronunciation}%` },
                                  { label: 'Speaking pace', value: `${evaluation.speechMetrics.speakingPace} WPM` },
                                  { label: 'Confidence', value: `${evaluation.speechMetrics.confidence}%` },
                                ].map(m => (
                                  <div key={m.label} className="ev-metric-card">
                                    <div className="ev-metric-label">{m.label}</div>
                                    <div className="ev-metric-val">{m.value}</div>
                                  </div>
                                ))}
                              </div>
                              {evaluation.speechMetrics.details && (
                                <div className="ev-details-box">
                                  <strong>Details:</strong> {evaluation.speechMetrics.details.totalWords} words, {evaluation.speechMetrics.details.fillerWords} filler words,{' '}
                                  {typeof evaluation.speechMetrics.details.averagePauseDuration === 'number' ? `${evaluation.speechMetrics.details.averagePauseDuration.toFixed(2)}s avg pause` : '—'}
                                </div>
                              )}
                              {evaluation.contentScores && (
                                <div className="ev-details-box">
                                  <strong>AI content scores:</strong> Structure: {evaluation.contentScores.contentStructure || 0}%, Coherence: {evaluation.contentScores.coherence}%, Topic: {evaluation.contentScores.topicRelevance}%, Grammar: {evaluation.contentScores.grammar}%, Vocabulary: {evaluation.contentScores.vocabulary}%
                                </div>
                              )}
                            </div>
                          )}

                          {/* Narrative */}
                          {evaluation.contentAnalysis && (
                            <div style={{ padding: '0 1.25rem 1.25rem' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>AI Narrative Insights</div>
                              <div className="ev-narrative-box">
                                {evaluation.contentAnalysis.cefrLevel && <p style={{ margin: '0 0 0.5rem', fontWeight: 700 }}>Suggested CEFR: {evaluation.contentAnalysis.cefrLevel}</p>}
                                {evaluation.contentAnalysis.summary && <p style={{ margin: '0 0 0.65rem' }}><strong>Summary</strong><br />{evaluation.contentAnalysis.summary}</p>}
                                {evaluation.contentAnalysis.strengths?.length > 0 && (
                                  <div style={{ marginBottom: '0.65rem' }}>
                                    <strong>Strengths</strong>
                                    <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem' }}>
                                      {evaluation.contentAnalysis.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                    </ul>
                                  </div>
                                )}
                                {evaluation.contentAnalysis.improvements?.length > 0 && (
                                  <div>
                                    <strong>Areas to improve</strong>
                                    <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem' }}>
                                      {evaluation.contentAnalysis.improvements.map((s: string, i: number) => <li key={i}>{s}</li>)}
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

                {/* RIGHT COLUMN */}
                <div>
                  {/* Excel Roster */}
                  <div className="ev-card">
                    <div className="ev-card-header">
                      <div className="ev-section-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#047857' }}>
                        <FileSpreadsheet size={16} />
                      </div>
                      <h3>Student Excel Roster</h3>
                    </div>
                    <div className="ev-card-body">
                      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.8rem' }}>
                        <input
                          id="roster-upload"
                          type="file"
                          accept=".xlsx,.xls"
                          style={{ display: 'none' }}
                          onChange={handleRosterUpload}
                        />
                        <button
                          type="button"
                          className={secondaryButtonClass}
                          onClick={() => document.getElementById('roster-upload')?.click()}
                          disabled={isRosterUploading}
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          <Upload size={15} /> {isRosterUploading ? 'Uploading...' : 'Upload Excel'}
                        </button>
                        <button
                          type="button"
                          className={primaryButtonClass}
                          onClick={handleExportRoster}
                          disabled={!rosterRows.length}
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          <Download size={15} /> Export Updated
                        </button>
                      </div>

                      {rosterFileName && (
                        <p style={{ margin: '0 0 0.7rem', fontSize: '0.78rem', color: '#64748b' }}>
                          File: <strong>{rosterFileName}</strong>
                        </p>
                      )}

                      {isRosterLoading ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.84rem', margin: 0 }}>Loading roster...</p>
                      ) : rosterRows.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.84rem', margin: 0 }}>
                          Upload an Excel file with firstName/lastName columns, then select a student.
                        </p>
                      ) : (
                        <>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                            Select Student From Excel
                          </label>
                          <select
                            value={selectedRosterKey}
                            onChange={(e) => setSelectedRosterKey(e.target.value)}
                            className="ev-select"
                          >
                            <option value="">Choose student...</option>
                            {rosterRows.map((row, index) => {
                              const fullName = `${row.firstName || ''} ${row.lastName || ''}`.trim() || row.email || `Row ${row.rowNumber}`;
                              const cefr = row.cefrLevel ? ` | CEFR ${row.cefrLevel}` : '';
                              return (
                                <option key={`${row.rowNumber}-${index}`} value={`${index}`}>
                                  {fullName}{cefr}
                                </option>
                              );
                            })}
                          </select>

                          {latestSelectedRosterEvaluation && (
                            <div className="ev-history-card" style={{ marginTop: '0.75rem' }}>
                              <div className="ev-history-row"><strong>Latest Evaluation</strong><span>{latestSelectedRosterEvaluation.status === 'graded' ? 'Graded' : 'Pending'}</span></div>
                              <div className="ev-history-row"><strong>Topic</strong><span>{latestSelectedRosterEvaluation.title || '-'}</span></div>
                              <div className="ev-history-row"><strong>Score</strong><span>{latestSelectedRosterEvaluation.totalScore != null ? `${Math.round(Number(latestSelectedRosterEvaluation.totalScore))}/100` : '-'}</span></div>
                              <div className="ev-history-row"><strong>CEFR</strong><span>{latestSelectedRosterEvaluation.feedback?.cefrLevel || '-'}</span></div>
                              <div className="ev-history-row"><strong>Updated</strong><span>{latestSelectedRosterEvaluation.updatedAt ? new Date(latestSelectedRosterEvaluation.updatedAt).toLocaleString() : latestSelectedRosterEvaluation.createdAt ? new Date(latestSelectedRosterEvaluation.createdAt).toLocaleString() : '-'}</span></div>
                              <button
                                type="button"
                                className={secondaryButtonClass}
                                style={{ marginTop: '0.7rem', width: '100%', justifyContent: 'center' }}
                                onClick={() => handleHistorySelection(latestSelectedRosterEvaluation._id)}
                              >
                                Load Evaluation Details
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Live Online Exam Session */}
                  <div className="ev-card" style={{ border: '1px solid rgba(227,24,55,0.2)', background: 'rgba(227,24,55,0.02)', marginBottom: '1.25rem' }}>
                    <div className="ev-card-header">
                      <div className="ev-section-icon" style={{ background: '#E31837', color: '#fff' }}>
                        <Video size={16} />
                      </div>
                      <h3 style={{ color: '#E31837' }}>Live Interaction</h3>
                    </div>
                    <div className="ev-card-body">
                      <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                        Start a live video/audio session with the selected student for a real-time oral examination.
                      </p>
                      <button
                        type="button"
                        className={primaryButtonClass}
                        style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #E31837, #dc2626)', boxShadow: '0 4px 15px rgba(227,24,55,0.3)' }}
                        onClick={() => handleOnlineExam(effectiveStudentId)}
                        disabled={!effectiveStudentId}
                      >
                        <Video size={16} /> Start Live Exam Session
                      </button>
                      {!effectiveStudentId && (
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', color: '#ef4444', fontWeight: 600, textAlign: 'center' }}>
                          * Select a student first
                        </p>
                      )}
                    </div>
                  </div>

                  {/* History */}
                  <div className="ev-card">
                    <div className="ev-card-header">
                      <div className="ev-section-icon" style={{ background: 'rgba(59,130,246,0.08)', color: '#2563eb' }}>
                        <User size={16} />
                      </div>
                      <h3>Submission History</h3>
                    </div>
                    <div className="ev-card-body">
                      {isHistoryLoading ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading history...</p>
                      ) : instructorHistory.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No submitted evaluations yet.</p>
                      ) : (
                        <>
                          <div className="ev-history-legend">
                            <span className="ev-status-pill pending">🔴 Pending</span>
                            <span className="ev-status-pill graded">🟢 Graded</span>
                          </div>
                          <div className="ev-history-select-wrap">
                            <select value={selectedHistoryId} onChange={e => handleHistorySelection(e.target.value)} className="ev-history-select">
                              <option value="">Select a submitted evaluation</option>
                              {instructorHistory.map(item => {
                                const student = studentProfiles[item.studentId];
                                const name = student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email || 'Unknown' : 'Unknown';
                                const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'No date';
                                const statusIndicator = getSubmissionStatusIndicator(item.status);
                                return <option key={item._id} value={item._id}>{statusIndicator} {name} — {item.title} ({date})</option>;
                              })}
                            </select>
                            <ChevronDown size={16} className="ev-history-chevron" />
                          </div>
                          {selectedSubmission && (
                            <div className="ev-history-card">
                              <div className="ev-history-row"><strong>Topic</strong><span>{selectedSubmission.title}</span></div>
                              <div className="ev-history-row"><strong>Student</strong><span>{selectedStudentName}</span></div>
                              <div className="ev-history-row"><strong>CEFR</strong><span>{cefrLevel}</span></div>
                              <div className="ev-history-row"><strong>Fluency</strong><span>{scores.fluency}/10</span></div>
                              <div className="ev-history-row"><strong>Pronunciation</strong><span>{scores.pronunciation}/10</span></div>
                              {notes.trim() !== '' && (
                                <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid #e5e7eb' }}>
                                  <strong>Feedback</strong>
                                  <p style={{ margin: '0.35rem 0 0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Instructor Evaluation */}
                  <div className="ev-card">
                    <div className="ev-section-header">
                      <div className="ev-section-icon"><User size={16} /></div>
                      <h3>Instructor Evaluation (Official)</h3>
                    </div>

                    <div className="ev-card-body">
                      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem', lineHeight: 1.5 }}>
                        Adjust the rubric and CEFR below to <strong>override</strong> AI suggestions. Only these values are saved when you submit.
                      </p>

                      {evaluation?.status === 'completed' && evaluation.speechMetrics && (
                        <button type="button" className={secondaryButtonClass} onClick={applyAiSuggestionsToRubric}
                          style={{ width: '100%', marginBottom: '1rem', justifyContent: 'center' }}>
                          <Sparkles size={15} /> Apply AI Suggestions to Rubric
                        </button>
                      )}
                    </div>

                    {/* Score Circle */}
                    <div className="ev-score-circle-wrap">
                      <div className="ev-score-ring" style={{ '--pct': overallScore } as React.CSSProperties}>
                        <span className="ev-score-num">{overallScore}</span>
                      </div>
                      <div className="ev-score-label">Overall Score / 100</div>
                    </div>

                    <div className="ev-card-body">
                      {/* CEFR */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>CEFR Level</div>
                        <div className="ev-cefr-btns">
                          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => (
                            <button key={level} className={`ev-cefr-btn${cefrLevel === level ? ' active' : ''}`} onClick={() => setCefrLevel(level)}>{level}</button>
                          ))}
                        </div>
                      </div>

                      {/* Sliders */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.75rem' }}>Score Rubric</div>
                        {Object.entries(scores).map(([metric, value]) => {
                          const labels: Record<string, string> = { fluency: 'Fluency', pronunciation: 'Pronunciation', speakingPace: 'Speaking Pace', confidence: 'Confidence', contentStructure: 'Content Structure' };
                          return (
                            <div key={metric} className="ev-slider-group">
                              <div className="ev-slider-label">
                                <span>{labels[metric] || metric}</span>
                                <span className="ev-slider-val" style={{ color: scoreColor(value) }}>{value}/10</span>
                              </div>
                              <input type="range" min="1" max="10" value={value}
                                onChange={e => handleScoreChange(metric as keyof Scores, parseInt(e.target.value))}
                                className="ev-slider" />
                            </div>
                          );
                        })}
                      </div>

                      {/* Notes */}
                      <div style={{ marginBottom: '0.25rem' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>Feedback & Notes</div>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)}
                          placeholder="Add your feedback and recommendations..." className="ev-textarea" rows={4} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ev-submit-row">
                      <button className={secondaryButtonClass} onClick={() => openActionConfirmation('draft')} disabled={isLoading || !performance?.audioFile} style={{ flex: 1, justifyContent: 'center' }}>Save Draft</button>
                      <button className={primaryButtonClass} onClick={() => openActionConfirmation('submit')} disabled={isLoading || !performance?.audioFile || isAlreadySubmitted} style={{ flex: 1, justifyContent: 'center', opacity: isAlreadySubmitted ? 0.7 : 1 }}>
                        <Send size={15} /> {isAlreadySubmitted ? 'Submitted' : isLoading ? 'Submitting...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {pendingAction && (
              <div className="ev-modal-backdrop" onClick={closeActionDialogs}>
                <div className="ev-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="ev-modal-head">
                    <span className="ev-modal-icon"><Sparkles size={18} /></span>
                    <h4 className="ev-modal-title">Confirm {pendingAction === 'submit' ? 'Submission' : 'Draft Save'}</h4>
                  </div>
                  <div className="ev-modal-body">
                    {pendingAction === 'submit' && `Do you want to validate this evaluation now? The student will receive a CEFR email (${cefrLevel}).`}
                    {pendingAction === 'draft' && 'Do you want to save this evaluation as draft (pending)?'}
                  </div>
                  <div className="ev-modal-actions">
                    <button className={secondaryButtonClass} onClick={closeActionDialogs} disabled={isLoading}>Cancel</button>
                    <button className={primaryButtonClass} onClick={confirmActionAndProceed} disabled={isLoading}>
                      {isLoading ? 'Processing...' : pendingAction === 'submit' ? 'Yes, Submit' : 'Yes, Save Draft'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {actionSuccessMessage && (
              <div className="ev-modal-backdrop">
                <div className="ev-modal">
                  <div className="ev-modal-head">
                    <span className="ev-modal-icon ev-success-accent"><CheckCircle size={18} /></span>
                    <h4 className="ev-modal-title">Success</h4>
                  </div>
                  <div className="ev-modal-body">{actionSuccessMessage}</div>
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default Evaluate;