// src/pages/teacher/Evaluate.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TeacherSidebar from '../../components/TeacherSidebar';
import { Upload, Play, Pause, Send, Bot, User, Mic, MicOff, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useEvaluation } from '../../hooks/useEvaluation';
import { oralPerformanceService } from '../services/oralPerformance.service';

// Import CSS modules
import styles from '../../styles/shared.module.css';
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
    duration: number;
    mimeType: string;
    uploadedAt: string;
  };
  status: string;
}

const Evaluate: React.FC = () => {
  // Use static student ID for testing
  const STATIC_STUDENT_ID = "699eb809b6d7f6cf4f5be419";
  
  const { studentId, performanceId } = useParams<{ studentId: string; performanceId: string }>();
  // Use static ID if no studentId from params
  const effectiveStudentId = studentId || STATIC_STUDENT_ID;
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [recordMode, setRecordMode] = useState<'upload' | 'record'>('record');
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  
  // Evaluation states
  const [subject, setSubject] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [showEvaluationForm, setShowEvaluationForm] = useState<boolean>(false);

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
  // If no performance exists and we have a student ID, create one
  if (!performance && effectiveStudentId && !performanceId) {
    handleCreatePerformance();
  }
}, [effectiveStudentId, performanceId]);

  
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

  // Update scores when evaluation results come in
  useEffect(() => {
    if (evaluation?.speechMetrics) {
      setScores({
        fluency: Math.round(evaluation.speechMetrics.fluency / 10),
        pronunciation: Math.round(evaluation.speechMetrics.pronunciation / 10),
        speakingPace: Math.min(10, Math.round(evaluation.speechMetrics.speakingPace / 15)),
        confidence: Math.round(evaluation.speechMetrics.confidence / 10),
        // FIXED: Changed from 'structure' to 'contentStructure'
        contentStructure: evaluation.contentScores?.contentStructure 
          ? Math.round(evaluation.contentScores.contentStructure / 10)
          : scores.contentStructure,
      });

      // Auto-detect CEFR level based on scores
      const avgScore = (
        evaluation.speechMetrics.fluency +
        evaluation.speechMetrics.pronunciation +
        evaluation.speechMetrics.confidence
      ) / 3;

      if (avgScore >= 85) setCefrLevel('C1');
      else if (avgScore >= 75) setCefrLevel('B2');
      else if (avgScore >= 65) setCefrLevel('B1');
      else if (avgScore >= 55) setCefrLevel('A2');
      else setCefrLevel('A1');

      setShowEvaluationForm(true);
    }
  }, [evaluation]);

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

  const handleScoreChange = (metric: keyof Scores, value: number): void => {
    setScores(prev => ({ ...prev, [metric]: value }));
  };

  const overallScore: number = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length * 10
  );

const handleCreatePerformance = async (): Promise<void> => {
  try {
    setIsLoading(true);
    setUploadError(null);
    
    console.log('Creating performance for student:', effectiveStudentId);
    
    const newPerformance = await oralPerformanceService.create({
      studentId: effectiveStudentId,
      title: `Oral Evaluation - ${new Date().toLocaleDateString()}`,
      description: notes || undefined,
    });
    
    console.log('Performance created:', newPerformance);
    setPerformance(newPerformance);
    
    // Update URL to include the new performance ID (optional)
    // You could use navigate or update the URL here
    
  } catch (error) {
    setUploadError('Failed to create performance');
    console.error('Create performance error:', error);
  } finally {
    setIsLoading(false);
  }
};

  const handleUploadRecording = async (): Promise<void> => {
    if (!audioBlob) {
      console.log('No audio blob to upload');
      return;
    }

    try {
      setIsLoading(true);
      setUploadError(null);
      setUploadSuccess(false);

      console.log('Starting upload process...');
      console.log('Audio blob size:', audioBlob.size);
      console.log('Formatted time:', formattedTime);

      // If no performance exists, create one first
      let currentPerformance = performance;
      if (!currentPerformance) {
        console.log('No performance exists, creating one first...');
        
        currentPerformance = await oralPerformanceService.create({
          studentId: effectiveStudentId,
          title: `Oral Evaluation - ${new Date().toLocaleDateString()}`,
          description: notes || undefined,
        });
        
        console.log('Performance created:', currentPerformance);
        setPerformance(currentPerformance);
      }

      if (!currentPerformance) throw new Error('Failed to create performance');

      // Convert formattedTime (MM:SS) to seconds
      const timeParts = formattedTime.split(':');
      const durationInSeconds = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
      
      console.log('Duration in seconds:', durationInSeconds);
      console.log('Uploading to performance ID:', currentPerformance._id);

      const updatedPerformance = await oralPerformanceService.uploadAudio(
        currentPerformance._id,
        audioBlob,
        durationInSeconds
      );

      console.log('Upload successful:', updatedPerformance);
      setPerformance(updatedPerformance);
      setUploadSuccess(true);
      
      // Show evaluation form after successful upload
      setShowEvaluationForm(true);
      
      resetRecording();

      setTimeout(() => setUploadSuccess(false), 3000);
      
    } catch (error) {
      setUploadError('Failed to upload recording');
      console.error('Upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };

 const handleStartEvaluation = async (): Promise<void> => {
  if (!performance) {
    alert('Please create a performance first');
    return;
  }

  if (!performance.audioFile) {
    alert('Please record and save an audio file first');
    return;
  }

  if (!subject.trim()) {
    alert('Please enter a subject/topic for evaluation');
    return;
  }

  try {
    setIsEvaluating(true);
    await startEvaluation(subject);
  } catch (error) {
    console.error('Failed to start evaluation:', error);
  } finally {
    setIsEvaluating(false);
  }
};

  const handleSubmitEvaluation = async (): Promise<void> => {
    if (!performance) return;

    try {
      setIsLoading(true);
      console.log('Submitting evaluation for:', performance._id);
      
      await oralPerformanceService.updateScores(performance._id, {
        fluency: scores.fluency * 10,
        pronunciation: scores.pronunciation * 10,
        speakingPace: scores.speakingPace * 15,
        confidence: scores.confidence * 10,
        contentOrganization: scores.contentStructure * 10,
      });

      await oralPerformanceService.updateFeedback(performance._id, {
        generalComments: notes,
        cefrLevel,
      });

      alert('Evaluation submitted successfully!');
    } catch (error) {
      console.error('Failed to submit evaluation:', error);
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
              <h1 className={pageTitleClass}>Evaluate Student</h1>
              <p className={pageSubtitleClass}>
                Student ID: {effectiveStudentId} 
                {studentId ? ' (from URL)' : ' (static)'}
              </p>
            </div>
            {performance?.audioFile && (
              <button 
                className={primaryButtonClass}
                onClick={handleStartEvaluation}
                disabled={isLoading || isEvaluating}
              >
                <Send size={18} />
                {isLoading || isEvaluating ? 'Evaluating...' : 'Submit Evaluation'}
              </button>
            )}
          </div>

          {/* Debug Info - Remove in production */}
          <div style={{ 
            backgroundColor: '#f0f9ff', 
            padding: '0.5rem', 
            borderRadius: '4px', 
            marginBottom: '1rem',
            fontSize: '0.8rem',
            color: '#0369a1'
          }}>
            <strong>Debug:</strong> Using Student ID: {effectiveStudentId}
          </div>

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
              Recording uploaded successfully!
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
                              {isLoading ? 'Uploading...' : 'Save Recording'}
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
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Evaluation Form - Show after upload */}
              {showEvaluationForm && performance?.audioFile && (
                <div className={cardClass}>
                  <div className={evaluateStyles?.sectionHeader || 'section-header'}>
                    <Bot size={20} />
                    <h3>AI Evaluation</h3>
                  </div>
                  
                  {!evaluation && (
                    <div style={{ padding: '1.5rem' }}>
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

                  {evaluation?.status === 'completed' && evaluation.transcript && (
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
                        <Bot size={14} /> AI-generated analysis — review and adjust below
                      </div>
                      
                      {/* AI Transcription */}
                      <div style={{ padding: '0 1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#1e293b' }}>
                          AI Transcription
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
                          <p>{evaluation.transcript}</p>
                        </div>
                      </div>

                      {/* AI Analysis Metrics */}
                      <div style={{ padding: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#1e293b' }}>
                          AI Analysis
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
                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Speaking Pace</span>
                            <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a' }}>
                              {evaluation.speechMetrics.speakingPace} <span style={{ fontSize: '0.75rem' }}>WPM</span>
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
                          {evaluation.speechMetrics.details.averagePauseDuration.toFixed(2)}s avg pause
                        </div>

                        {/* FIXED: Content Scores with correct field name */}
                        {evaluation.contentScores && (
                          <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: '#f1f5f9',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            color: '#475569'
                          }}>
                            <strong>Content Scores:</strong> Structure: {evaluation.contentScores.contentStructure || 0}%, Coherence: {evaluation.contentScores.coherence}%, Topic: {evaluation.contentScores.topicRelevance}%, Grammar: {evaluation.contentScores.grammar}%, Vocabulary: {evaluation.contentScores.vocabulary}%
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right: Instructor Evaluation Form */}
            <div className={evaluateStyles?.rightColumn || 'right-column'}>
              <div className={cardClass}>
                <div className={evaluateStyles?.sectionHeader || 'section-header'}>
                  <User size={20} />
                  <h3>Instructor Evaluation</h3>
                </div>

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