// backend/src/assemblyai/interfaces/assemblyai.types.ts
export interface WordTimestamp {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: string;
}

export interface SentimentResult {
  text: string;
  start: number;
  end: number;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  confidence: number;
}

export interface Chapter {
  summary: string;
  headline: string;
  start: number;
  end: number;
}

export interface AssemblyAITranscript {
  id: string;
  text: string | null; // Allow null
  words: WordTimestamp[] | null; // Allow null
  sentiment_analysis_results?: SentimentResult[] | null; // Allow null
  chapters?: Chapter[] | null; // Allow null
  confidence: number;
  audio_duration: number;
  status: string;
  error?: string;
}

export interface SpeechMetricsDetails {
  totalWords: number;
  fillerWords: number;
  averagePauseDuration: number;
  wordsPerMinute: number;
  totalSpeakingTime: number;
}

export interface SpeechMetrics {
  fluency: number;
  pronunciation: number;
  speakingPace: number;
  confidence: number;
  details: SpeechMetricsDetails;
}

export interface EvaluationResult {
  transcript: string; // This will never be null/undefined in our return
  metrics: SpeechMetrics;
  rawData: {
    sentiment?: SentimentResult[]; // Optional, but never null
    chapters?: Chapter[]; // Optional, but never null
  };
}
