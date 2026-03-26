// src/pages/student/Practice.tsx
import React, { useState, useEffect, useRef } from 'react';
import StudentSidebar from '../../components/StudentSidebar';
import { Upload, Bot, Mic, MicOff, CheckCircle, XCircle, Loader, Play, Pause, Award, User } from 'lucide-react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useEvaluation } from '../../hooks/useEvaluation';
import { oralPerformanceService } from '../services/oralPerformance.service';

// Import CSS modules
import styles from '../../styles/shared.module.css';
import practiceStyles from './Practice.module.css';

// Define types
interface Scores {
  fluency: number;
  pronunciation: number;
  speakingPace: number;
  confidence: number;
  contentStructure: number;
}

// Get student ID from token
const getStudentIdFromToken = (): string => {
  const token = localStorage.getItem('token');
  if (!token) return '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || '';
  } catch (error) {
    console.error('Failed to decode token:', error);
    return '';
  }
};

const Practice: React.FC = () => {
  const studentId = getStudentIdFromToken();
  const hasCreatedRef = useRef(false);
  
  const [recordMode, setRecordMode] = useState<'upload' | 'record'>('record');
  const [performance, setPerformance] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  
  // Evaluation states
  const [subject, setSubject] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [showEvaluationForm, setShowEvaluationForm] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');

  // Scores state
  const [scores, setScores] = useState<Scores>({
    fluency: 8,
    pronunciation: 8,
    speakingPace: 7,
    confidence: 7,
    contentStructure: 8,
  });
  
  const [cefrLevel, setCefrLevel] = useState<string>('B2');
  const [finalCEFR, setFinalCEFR] = useState<{ level: string; score: number }>({ level: 'A1', score: 0 });

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

  // Calculate weighted overall score
  const calculateWeightedScore = () => {
    if (!evaluation?.speechMetrics) return 90;
    
    // Speech metrics (50% of total)
    const speechScore = (
      (evaluation.speechMetrics.fluency || 0) * 0.15 +      // 15%
      (evaluation.speechMetrics.pronunciation || 0) * 0.15 + // 15%
      Math.min(100, (evaluation.speechMetrics.speakingPace || 0) / 1.8) * 0.1 + // 10% (normalized to 100)
      (evaluation.speechMetrics.confidence || 0) * 0.1       // 10%
    );
    
    // Content metrics (50% of total)
    const contentScore = (
      (evaluation.contentScores?.contentStructure || 0) * 0.1 +
      (evaluation.contentScores?.coherence || 0) * 0.1 +
      (evaluation.contentScores?.topicRelevance || 0) * 0.1 +
      (evaluation.contentScores?.grammar || 0) * 0.1 +
      (evaluation.contentScores?.vocabulary || 0) * 0.1
    );
    
    return Math.round(speechScore + contentScore);
  };

  // Map score to CEFR level
  const getCEFRFromScore = (score: number): string => {
    if (score >= 85) return 'C1';
    if (score >= 75) return 'B2';
    if (score >= 65) return 'B1';
    if (score >= 55) return 'A2';
    return 'A1';
  };

  // Calculate final unified CEFR level based on ALL criteria
  const calculateFinalCEFRLevel = (
    speechMetrics: any,
    contentScores: any,
    geminiLevel?: string
  ): { level: string; score: number } => {
    
    // 1. Calculate Speech Score (50% of final)
    const speechScore = (
      (speechMetrics?.fluency || 0) * 0.15 +      // 15%
      (speechMetrics?.pronunciation || 0) * 0.15 + // 15%
      Math.min(100, (speechMetrics?.speakingPace || 0) / 1.8) * 0.1 + // 10%
      (speechMetrics?.confidence || 0) * 0.1       // 10%
    );
    
    // 2. Calculate Content Score (50% of final)
    const contentScore = (
      (contentScores?.contentStructure || 0) * 0.1 +
      (contentScores?.coherence || 0) * 0.1 +
      (contentScores?.topicRelevance || 0) * 0.1 +
      (contentScores?.grammar || 0) * 0.1 +
      (contentScores?.vocabulary || 0) * 0.1
    );
    
    // 3. Base combined score
    let combinedScore = speechScore + contentScore;
    
    // 4. Adjust based on Gemini level (if available)
    if (geminiLevel) {
      const geminiScore = {
        'A1': 50,
        'A2': 60,
        'B1': 70,
        'B2': 80,
        'C1': 90,
        'C2': 100
      }[geminiLevel] || 60;
      
      // Weighted: 70% combined metrics, 30% Gemini assessment
      combinedScore = (combinedScore * 0.7) + (geminiScore * 0.3);
    }
    
    // 5. Ensure score is within 0-100
    const finalScore = Math.min(100, Math.max(0, Math.round(combinedScore)));
    
    // 6. Convert to CEFR level
    let finalLevel: string;
    if (finalScore >= 85) finalLevel = 'C1';
    else if (finalScore >= 75) finalLevel = 'B2';
    else if (finalScore >= 70) finalLevel = 'B1+';
    else if (finalScore >= 65) finalLevel = 'B1';
    else if (finalScore >= 60) finalLevel = 'A2+';
    else if (finalScore >= 55) finalLevel = 'A2';
    else finalLevel = 'A1';
    
    return { level: finalLevel, score: finalScore };
  };

  const overallScore = calculateWeightedScore();
  
  // Use Gemini CEFR if available, otherwise calculate from score
  const displayedCEFRLevel = evaluation?.contentAnalysis?.cefrLevel || getCEFRFromScore(overallScore);

  // Update final CEFR when evaluation changes
  useEffect(() => {
    if (evaluation?.speechMetrics) {
      const final = calculateFinalCEFRLevel(
        evaluation.speechMetrics,
        evaluation.contentScores,
        evaluation.contentAnalysis?.cefrLevel
      );
      setFinalCEFR(final);
    }
  }, [evaluation]);

  // Update scores when evaluation results come in
  useEffect(() => {
    if (evaluation?.speechMetrics) {
      setScores({
        fluency: Math.round(evaluation.speechMetrics.fluency / 10),
        pronunciation: Math.round(evaluation.speechMetrics.pronunciation / 10),
        speakingPace: Math.min(10, Math.round(evaluation.speechMetrics.speakingPace / 15)),
        confidence: Math.round(evaluation.speechMetrics.confidence / 10),
        contentStructure: evaluation.contentScores?.contentStructure 
          ? Math.round(evaluation.contentScores.contentStructure / 10)
          : scores.contentStructure,
      });

      setShowEvaluationForm(true);
    }
  }, [evaluation]);

  // Create a practice performance when component mounts (only once)
  useEffect(() => {
    if (studentId && !performance && !hasCreatedRef.current) {
      hasCreatedRef.current = true;
      handleCreatePractice();
    }
  }, [studentId, performance]);

  // Fetch evaluation only when performance exists
  useEffect(() => {
    if (performance?._id) {
      const timer = setTimeout(() => {
        fetchEvaluation();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [performance?._id]);

  const handleCreatePractice = async (): Promise<void> => {
    if (!studentId) {
      setUploadError('Please log in to practice');
      return;
    }

    try {
      setIsLoading(true);
      setUploadError(null);
      
      console.log('Creating practice for student:', studentId);
      
      const newPerformance = await oralPerformanceService.create({
        studentId: studentId,
        title: `Practice Session - ${new Date().toLocaleDateString()}`,
        description: 'Self-practice session',
      });
      
      console.log('Practice created:', newPerformance);
      setPerformance(newPerformance);
      
    } catch (error) {
      setUploadError('Failed to create practice session');
      console.error('Create practice error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadRecording = async (): Promise<void> => {
    if (!audioBlob) {
      console.log('No audio blob to upload');
      return;
    }

    if (!subject.trim()) {
      alert('Please enter a topic/subject for your practice');
      return;
    }

    try {
      setIsLoading(true);
      setUploadError(null);
      setUploadSuccess(false);

      console.log('Starting upload process...');
      console.log('Audio blob size:', audioBlob.size);
      console.log('Formatted time:', formattedTime);

      let currentPerformance = performance;
      
      if (!currentPerformance) {
        console.log('No performance exists, creating one first...');
        
        currentPerformance = await oralPerformanceService.create({
          studentId: studentId,
          title: `Practice Session - ${new Date().toLocaleDateString()}`,
          description: subject,
        });
        
        console.log('Practice created:', currentPerformance);
        setPerformance(currentPerformance);
      }

      if (!currentPerformance) throw new Error('Failed to create practice session');

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
      
      if (!updatedPerformance.audioFile) {
        console.error('Upload succeeded but audioFile is missing!');
        setUploadError('Upload succeeded but audio file not found');
        return;
      }
      
      setPerformance(updatedPerformance);
      setUploadSuccess(true);
      
      // Show evaluation form after successful upload
      setShowEvaluationForm(true);
      
      // Auto-start evaluation
      setTimeout(() => {
        handleStartEvaluation();
      }, 1000);
      
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
      alert('Please create a practice session first');
      return;
    }

    try {
      const refreshedPerformance = await oralPerformanceService.getPerformance(performance._id);
      setPerformance(refreshedPerformance);
      
      if (!refreshedPerformance.audioFile) {
        alert('Please record and save an audio file first');
        return;
      }
    } catch (error) {
      console.error('Failed to refresh performance:', error);
      alert('Error checking audio file');
      return;
    }

    if (!subject.trim()) {
      alert('Please enter a topic for your practice');
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (file) {
      const blob = new Blob([file], { type: file.type });
      console.log('File selected:', file);
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

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Practice Mode</h1>
              <p className={styles.pageSubtitle}>Record yourself and get instant AI feedback</p>
            </div>
          </div>

          {/* Status Messages */}
          {uploadError && (
            <div className={practiceStyles.errorMessage}>
              <XCircle size={18} />
              {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div className={practiceStyles.successMessage}>
              <CheckCircle size={18} />
              Recording uploaded successfully!
            </div>
          )}

          {evaluationError && evaluationError !== 'Evaluation not found' && (
            <div className={practiceStyles.errorMessage}>
              <XCircle size={18} />
              Evaluation error: {evaluationError}
            </div>
          )}

          {recordingError && (
            <div className={practiceStyles.errorMessage}>
              {recordingError}
            </div>
          )}

          {/* Evaluation Status Banner */}
          {evaluation && evaluation.status !== 'pending' && (
            <div className={practiceStyles.statusBanner} style={{ 
              backgroundColor: `${getStatusColor(evaluation.status)}10`,
              borderColor: getStatusColor(evaluation.status),
              color: getStatusColor(evaluation.status)
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {evaluation.status === 'processing' && <Loader size={16} className="spin" />}
                {evaluation.status === 'completed' && <CheckCircle size={16} />}
                {evaluation.status === 'failed' && <XCircle size={16} />}
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  {evaluation.status === 'completed' ? 'Feedback Ready!' : `Evaluation ${evaluation.status}...`}
                </span>
              </div>
            </div>
          )}

          {/* Subject Input */}
          <div className={practiceStyles.subjectCard}>
            <label>What would you like to practice?</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Introduce yourself, Describe your hometown, Talk about your hobbies..."
              disabled={isLoading || isEvaluating || evaluation?.status === 'completed'}
            />
          </div>

          {/* Tab Selection */}
          <div className={practiceStyles.tabContainer}>
            <button 
              className={`${practiceStyles.tab} ${activeTab === 'record' ? practiceStyles.activeTab : ''}`}
              onClick={() => setActiveTab('record')}
              disabled={evaluation?.status === 'completed'}
            >
              <Mic size={18} />
              Record Session
            </button>
            <button 
              className={`${practiceStyles.tab} ${activeTab === 'upload' ? practiceStyles.activeTab : ''}`}
              onClick={() => setActiveTab('upload')}
              disabled={evaluation?.status === 'completed'}
            >
              <Upload size={18} />
              Upload Audio
            </button>
          </div>

          <div className={practiceStyles.practiceGrid}>
            {/* Left: Recording Area */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Session Recording</h3>
              
              {activeTab === 'record' ? (
                <div className={practiceStyles.recordingArea}>
                  {audioUrl ? (
                    <div className={practiceStyles.audioPreview}>
                      <audio controls src={audioUrl} style={{ width: '100%', marginBottom: '1rem' }} />
                      <div className={practiceStyles.audioActions}>
                        <button
                          className={styles.secondaryButton}
                          onClick={resetRecording}
                          disabled={isLoading || evaluation?.status === 'completed'}
                        >
                          Record Again
                        </button>
                        <button
                          className={styles.primaryButton}
                          onClick={handleUploadRecording}
                          disabled={isLoading || isEvaluating || !subject.trim() || evaluation?.status === 'completed'}
                        >
                          {isLoading ? 'Uploading...' : isEvaluating ? 'Evaluating...' : 'Save Recording'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={practiceStyles.videoPreview}>
                        <Mic size={48} style={{ color: isRecording ? '#E31837' : 'rgba(0,0,0,0.2)' }} />
                        <p>
                          {isRecording 
                            ? 'Recording in progress...' 
                            : performance?.audioFile 
                              ? 'Recording already exists' 
                              : 'Click Record to start practicing'
                          }
                        </p>
                      </div>
                      
                      {!performance?.audioFile && (
                        <>
                          <div className={practiceStyles.recordingControls}>
                            <button 
                              className={isRecording ? styles.secondaryButton : styles.primaryButton}
                              onClick={isRecording ? stopRecording : startRecording}
                              disabled={isLoading || evaluation?.status === 'completed'}
                              style={isRecording ? { borderColor: '#E31837', color: '#E31837' } : {}}
                            >
                              {isRecording ? (
                                <><MicOff size={16} /> Stop Recording</>
                              ) : (
                                <><Mic size={16} /> Start Recording</>
                              )}
                            </button>
                          </div>

                          {isRecording && (
                            <div className={practiceStyles.recordingTimer}>
                              <span className={practiceStyles.recordingIndicator} />
                              REC {formattedTime}
                            </div>
                          )}
                        </>
                      )}

                      {performance?.audioFile && (
                        <div className={practiceStyles.existingRecording}>
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
              ) : (
                <div className={practiceStyles.uploadArea}>
                  <Upload size={48} />
                  <p>Upload an audio file to practice</p>
                  <input
                    type="file"
                    accept="audio/*"
                    style={{ display: 'none' }}
                    id="audio-upload"
                    onChange={handleFileUpload}
                  />
                  <button 
                    className={styles.secondaryButton}
                    onClick={() => document.getElementById('audio-upload')?.click()}
                  >
                    <Upload size={16} />
                    Choose File
                  </button>
                </div>
              )}
            </div>

            {/* Right: AI Feedback Panel */}
            <div className={styles.card}>
              <div className={practiceStyles.sectionHeader}>
                <Bot size={20} />
                <h3>AI Feedback</h3>
                {evaluation?.status === 'completed' && (
                  <span className={practiceStyles.aiBadge}>AI Generated</span>
                )}
              </div>
              
              <div className={practiceStyles.aiDisclaimer}>
                <Bot size={14} />
                AI-powered analysis helps you practice. Use this feedback to improve!
              </div>
              
              {evaluationLoading && (
                <div className={practiceStyles.loadingState}>
                  <Loader size={32} className="spin" />
                  <p>Analyzing your speech...</p>
                </div>
              )}

              {evaluation?.status === 'completed' && evaluation.transcript && (
                <>
                  {/* Overall Score */}
                  <div className={practiceStyles.overallScore}>
                    <div className={practiceStyles.scoreCircle}>
                      <span>{overallScore}</span>
                      <small>/100</small>
                    </div>
                    <span>Overall Score</span>
                  </div>

                  {/* FINAL UNIFIED CEFR LEVEL - NEW */}
                  <div className={practiceStyles.finalCefrContainer}>
                    <h4>Final CEFR Level (All Criteria)</h4>
                    <div className={practiceStyles.finalLevelDisplay}>
                      <div className={practiceStyles.finalLevelCircle}>
                        <span className={practiceStyles.finalLevelValue}>{finalCEFR.level}</span>
                        <span className={practiceStyles.finalLevelScore}>{finalCEFR.score}/100</span>
                      </div>
                      <div className={practiceStyles.levelBreakdown}>
                        <div className={practiceStyles.breakdownItem}>
                          <span>Speech</span>
                          <span>{Math.round(
                            ((evaluation.speechMetrics?.fluency || 0) * 0.3 +
                            (evaluation.speechMetrics?.pronunciation || 0) * 0.3 +
                            Math.min(100, (evaluation.speechMetrics?.speakingPace || 0) / 1.8) * 0.2 +
                            (evaluation.speechMetrics?.confidence || 0) * 0.2)
                          )}%</span>
                        </div>
                        <div className={practiceStyles.breakdownItem}>
                          <span>Content</span>
                          <span>{Math.round(
                            ((evaluation.contentScores?.contentStructure || 0) +
                            (evaluation.contentScores?.coherence || 0) +
                            (evaluation.contentScores?.topicRelevance || 0) +
                            (evaluation.contentScores?.grammar || 0) +
                            (evaluation.contentScores?.vocabulary || 0)) / 5
                          )}%</span>
                        </div>
                        {evaluation.contentAnalysis?.cefrLevel && (
                          <div className={practiceStyles.breakdownItem}>
                            <span>Gemini</span>
                            <span>{evaluation.contentAnalysis.cefrLevel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Component Breakdown */}
                  <div className={practiceStyles.formGroup}>
                    <label>Component Breakdown</label>
                    <div className={practiceStyles.levelButtons}>
                      {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => {
                        const isFinal = finalCEFR.level.includes(level);
                        const isSpeech = getCEFRFromScore(overallScore) === level;
                        const isGemini = evaluation.contentAnalysis?.cefrLevel === level;
                        
                        return (
                          <button
                            key={level}
                            className={`${practiceStyles.levelBtn} ${
                              isFinal ? practiceStyles.finalLevel : ''
                            } ${
                              isSpeech ? practiceStyles.speechLevel : ''
                            } ${
                              isGemini ? practiceStyles.geminiLevel : ''
                            }`}
                            disabled
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                    <div className={practiceStyles.legend}>
                      <span><span className={practiceStyles.finalDot}></span> Final Level</span>
                      <span><span className={practiceStyles.speechDot}></span> Speech-based</span>
                      <span><span className={practiceStyles.contentDot}></span> Content (Gemini)</span>
                    </div>
                  </div>

                  {/* AI Transcription */}
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#1e293b' }}>
                      AI Transcription
                    </h4>
                    <div className={practiceStyles.transcript}>
                      <p>{evaluation.transcript}</p>
                    </div>
                  </div>

                  {/* AI Analysis Metrics */}
                  <div>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#1e293b' }}>
                      AI Analysis
                    </h4>
                    <div className={practiceStyles.aiMetrics}>
                      <div className={practiceStyles.metricCard}>
                        <span>Fluency</span>
                        <strong>{evaluation.speechMetrics.fluency}%</strong>
                      </div>
                      <div className={practiceStyles.metricCard}>
                        <span>Pronunciation</span>
                        <strong>{evaluation.speechMetrics.pronunciation}%</strong>
                      </div>
                      <div className={practiceStyles.metricCard}>
                        <span>Speaking Pace</span>
                        <strong>{evaluation.speechMetrics.speakingPace} WPM</strong>
                      </div>
                      <div className={practiceStyles.metricCard}>
                        <span>Confidence</span>
                        <strong>{evaluation.speechMetrics.confidence}%</strong>
                      </div>
                    </div>

                    <div className={practiceStyles.detailsBox}>
                      <strong>Details:</strong> {evaluation.speechMetrics.details.totalWords} words,{' '}
                      {evaluation.speechMetrics.details.fillerWords} filler words,{' '}
                      {evaluation.speechMetrics.details.averagePauseDuration.toFixed(2)}s avg pause
                    </div>

                    {/* Content Scores */}
                    {evaluation.contentScores && (
                      <div className={practiceStyles.contentScores}>
                        <strong>Content Scores:</strong> Structure: {evaluation.contentScores.contentStructure || 0}%, Coherence: {evaluation.contentScores.coherence}%, Topic: {evaluation.contentScores.topicRelevance}%, Grammar: {evaluation.contentScores.grammar}%, Vocabulary: {evaluation.contentScores.vocabulary}%
                      </div>
                    )}

                    {/* Content Analysis */}
                    {evaluation.contentAnalysis && (
                      <div className={practiceStyles.feedbackDetails}>
                        <h4>Summary</h4>
                        <p>{evaluation.contentAnalysis.summary}</p>

                        {evaluation.contentAnalysis.strengths.length > 0 && (
                          <>
                            <h4>Strengths</h4>
                            <ul>
                              {evaluation.contentAnalysis.strengths.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </>
                        )}

                        {evaluation.contentAnalysis.improvements.length > 0 && (
                          <>
                            <h4>Areas to Improve</h4>
                            <ul>
                              {evaluation.contentAnalysis.improvements.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {!evaluation && !evaluationLoading && !evaluationError && (
                <div className={practiceStyles.emptyState}>
                  <Award size={48} style={{ color: 'rgba(0,0,0,0.2)' }} />
                  <p>Record yourself and get AI feedback to improve your skills!</p>
                  <div className={practiceStyles.metricsPreview}>
                    <div className={practiceStyles.metricItem}>
                      <span>Fluency</span>
                      <span>--</span>
                    </div>
                    <div className={practiceStyles.metricItem}>
                      <span>Pronunciation</span>
                      <span>--</span>
                    </div>
                    <div className={practiceStyles.metricItem}>
                      <span>Speaking Pace</span>
                      <span>--</span>
                    </div>
                    <div className={practiceStyles.metricItem}>
                      <span>Confidence</span>
                      <span>--</span>
                    </div>
                    <div className={practiceStyles.metricItem}>
                      <span>Content</span>
                      <span>--</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <style>{`
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

export default Practice;