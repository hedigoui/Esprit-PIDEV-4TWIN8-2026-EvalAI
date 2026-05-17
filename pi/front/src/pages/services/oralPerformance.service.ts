// ===========================================
// TYPES & INTERFACES
// ===========================================

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

export interface ContentScores {
  contentStructure: number;
  coherence: number;
  topicRelevance: number;
  grammar: number;
  vocabulary: number;
}

export interface ContentAnalysis {
  summary: string;
  keyPoints: string[];
  strengths: string[];
  improvements: string[];
  cefrLevel: string;
}

export interface EvaluationResult {
  _id: string;
  performanceId: string;
  subject: string;
  transcript: string;
  speechMetrics: SpeechMetrics;
  contentScores?: ContentScores;
  contentAnalysis?: ContentAnalysis;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  evaluatedAt?: string;
  errorMessage?: string;
}

export interface PerformanceRecord {
  _id: string;
  studentId: string;
  instructorId?: string;
  title: string;
  description?: string;
  status: string;
  totalScore?: number;
  overallProficiency?: string;
  createdAt: string;
  updatedAt?: string;
  completedDate?: string;
  audioFile?: {
    fileId: string;
    filename: string;
    size: number;
    duration?: number;
    mimeType: string;
    uploadedAt: string;
  };
  scores?: {
    pronunciation?: number;
    fluency?: number;
    vocabulary?: number;
    grammar?: number;
    comprehension?: number;
    contentOrganization?: number;
    speakingPace?: number;
    confidence?: number;
  };
  feedback?: {
    generalComments?: string;
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
    cefrLevel?: string;
  };
}

export interface InstructorRosterRow {
  rowNumber: number;
  firstName?: string;
  lastName?: string;
  studentId?: string;
  email?: string;
  cefrLevel?: string;
}

export interface InstructorRosterRecord {
  _id: string;
  instructorId: string;
  originalFilename?: string;
  rows: InstructorRosterRow[];
  createdAt?: string;
  updatedAt?: string;
}

// ===========================================
// SERVICE IMPLEMENTATION
// ===========================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function readFetchError(response: Response, fallback: string): Promise<string> {
  try {
    const text = await response.text();
    if (!text) return fallback;
    const parsed = JSON.parse(text);
    if (typeof parsed?.message === 'string') return parsed.message;
    if (Array.isArray(parsed?.message)) return parsed.message.join(', ');
    return text;
  } catch {
    return fallback;
  }
}

export const oralPerformanceService = {
  // Create a new performance
  async create(data: { studentId: string; instructorId?: string; title: string; description?: string }) {
    const response = await fetch(`${API_URL}/oral-performances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(await readFetchError(response, `Failed to create performance: ${response.statusText}`));
    }
    const result = await response.json();
    return result.data || result;
  },

  // Upload audio for a performance
  async uploadAudio(performanceId: string, audioBlob: Blob, duration: number) {
    const formData = new FormData();
    formData.append('audio', audioBlob, `recording-${Date.now()}.webm`);

    const response = await fetch(
      `${API_URL}/oral-performances/${performanceId}/audio?duration=${duration}`,
      {
        method: 'POST',
        body: formData,
      }
    );
    if (!response.ok) {
      throw new Error(await readFetchError(response, `Failed to upload audio: ${response.statusText}`));
    }
    const result = await response.json();
    return result.data || result;
  },

  // Get audio URL for a performance
  getAudioUrl(performanceId: string) {
    return `${API_URL}/oral-performances/${performanceId}/audio`;
  },

  // Get a single performance by ID
  async getPerformance(id: string) {
    const response = await fetch(`${API_URL}/oral-performances/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to get performance: ${response.statusText}`);
    }
    const result = await response.json();
    return result.data || result;
  },

  async getInstructorPerformances(instructorId: string): Promise<PerformanceRecord[]> {
    const response = await fetch(`${API_URL}/oral-performances/instructor/${instructorId}`);
    if (!response.ok) {
      throw new Error(`Failed to get instructor performances: ${response.statusText}`);
    }
    const result = await response.json();
    return result.data || [];
  },

  async getInstructorPerformancesPage(instructorId: string, page: number, limit: number) {
    const response = await fetch(
      `${API_URL}/oral-performances/instructor/${instructorId}?page=${page}&limit=${limit}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to get instructor performances: ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  },

  async getAllPerformancesPage(page: number, limit: number) {
    const response = await fetch(`${API_URL}/oral-performances?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to get performances: ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  },

  async getStatistics(instructorId: string) {
    const response = await fetch(`${API_URL}/oral-performances/statistics?instructorId=${encodeURIComponent(instructorId)}`);
    if (!response.ok) {
      throw new Error(`Failed to get statistics: ${response.statusText}`);
    }
    const result = await response.json();
    return result.data || result;
  },

  async getStatisticsForStudent(studentId: string) {
    const response = await fetch(
      `${API_URL}/oral-performances/statistics?studentId=${encodeURIComponent(studentId)}`,
    );
    if (!response.ok) {
      throw new Error(await readFetchError(response, `Failed to get statistics: ${response.statusText}`));
    }
    const result = await response.json();
    return result.data || result;
  },

  async getUserProfile(userId: string) {
    const response = await fetch(`${API_URL}/users/profile/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to get user profile: ${response.statusText}`);
    }
    return response.json();
  },

  // Update scores for a performance
  async updateScores(id: string, scores: any) {
    const response = await fetch(`${API_URL}/oral-performances/${id}/scores`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scores),
    });
    if (!response.ok) {
      throw new Error(await readFetchError(response, `Failed to update scores: ${response.statusText}`));
    }
    const result = await response.json();
    return result.data || result;
  },

  // Update feedback for a performance
  async updateFeedback(id: string, feedback: any) {
    const response = await fetch(`${API_URL}/oral-performances/${id}/feedback`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });
    if (!response.ok) {
      throw new Error(await readFetchError(response, `Failed to update feedback: ${response.statusText}`));
    }
    const result = await response.json();
    return result.data || result;
  },

  // Update status for a performance
  async updateStatus(id: string, status: string) {
    const response = await fetch(`${API_URL}/oral-performances/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error(await readFetchError(response, `Failed to update status: ${response.statusText}`));
    }
    const result = await response.json();
    return result.data || result;
  },

  // ===========================================
  // EVALUATION METHODS
  // ===========================================

  // Start a new evaluation
  async startEvaluation(performanceId: string, subject: string, language: string = 'en') {
    const response = await fetch(`${API_URL}/evaluations/performance/${performanceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, language }),
    });
    if (!response.ok) {
      throw new Error(await readFetchError(response, `Failed to start evaluation: ${response.statusText}`));
    }
    const result = await response.json();
    return result;
  },

  async getEvaluation(performanceId: string): Promise<EvaluationResult | null> {
    const response = await fetch(`${API_URL}/evaluations/performance/${performanceId}`);
    
    if (response.status === 404) {
      return null; // Return null instead of throwing error
    }
    
    if (!response.ok) {
      throw new Error(`Failed to get evaluation: ${response.statusText}`);
    }
    
    // Check if response has content
    const text = await response.text();
    if (!text) {
      return null;
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse evaluation response:', e);
      return null;
    }
  },

  // Get evaluation status
  async getEvaluationStatus(performanceId: string) {
    const response = await fetch(`${API_URL}/evaluations/performance/${performanceId}/status`);
    if (!response.ok) {
      throw new Error(`Failed to get evaluation status: ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  },

  // Get all evaluations for a student
  async getAllStudentEvaluations(studentId: string) {
    const response = await fetch(`${API_URL}/evaluations/student/${studentId}`);
    if (!response.ok) {
      throw new Error(await readFetchError(response, `Failed to get student evaluations: ${response.statusText}`));
    }
    const raw = await response.json();
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  },

  async getAllStudentEvaluationsPage(studentId: string, page: number, limit: number) {
    const response = await fetch(
      `${API_URL}/evaluations/student/${studentId}?page=${page}&limit=${limit}`,
    );
    if (!response.ok) {
      throw new Error(await readFetchError(response, `Failed to get student evaluations: ${response.statusText}`));
    }
    return response.json();
  },

  async uploadInstructorRoster(instructorId: string, file: File): Promise<InstructorRosterRecord> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/oral-performances/roster/upload/${instructorId}`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error(await readFetchError(response, `Failed to upload roster: ${response.statusText}`));
    }
    const result = await response.json();
    return result.data || result;
  },

  async getInstructorRoster(instructorId: string): Promise<InstructorRosterRecord | null> {
    const response = await fetch(`${API_URL}/oral-performances/roster/${instructorId}`);
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(await readFetchError(response, `Failed to get roster: ${response.statusText}`));
    }
    const result = await response.json();
    return result.data || result;
  },

  getInstructorRosterExportUrl(instructorId: string): string {
    return `${API_URL}/oral-performances/roster/${instructorId}/export`;
  }
};