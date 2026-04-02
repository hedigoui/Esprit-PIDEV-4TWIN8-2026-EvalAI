// // src/services/oralPerformance.service.ts

// // ===========================================
// // TYPES & INTERFACES
// // ===========================================

// export interface SpeechMetricsDetails {
//   totalWords: number;
//   fillerWords: number;
//   averagePauseDuration: number;
//   wordsPerMinute: number;
//   totalSpeakingTime: number;
// }

// export interface SpeechMetrics {
//   fluency: number;
//   pronunciation: number;
//   speakingPace: number;
//   confidence: number;
//   details: SpeechMetricsDetails;
// }

// // FIXED: Changed from 'structure' to 'contentStructure'
// export interface ContentScores {
//   contentStructure: number;  // This matches what Gemini returns
//   coherence: number;
//   topicRelevance: number;
//   grammar: number;
//   vocabulary: number;
// }

// export interface ContentAnalysis {
//   summary: string;
//   keyPoints: string[];
//   strengths: string[];
//   improvements: string[];
//   cefrLevel: string;  // Added this field
// }

// export interface EvaluationResult {
//   _id: string;
//   performanceId: string;
//   subject: string;
//   transcript: string;
//   speechMetrics: SpeechMetrics;
//   contentScores?: ContentScores;        // Using the updated interface
//   contentAnalysis?: ContentAnalysis;     // Using the updated interface
//   status: 'pending' | 'processing' | 'completed' | 'failed';
//   createdAt: string;
//   evaluatedAt?: string;
//   errorMessage?: string;
// }

// // ===========================================
// // SERVICE IMPLEMENTATION
// // ===========================================

// const API_URL = 'http://localhost:3000';

// export const oralPerformanceService = {
//   // Create a new performance
//   async create(data: { studentId: string; title: string; description?: string }) {
//     const response = await fetch(`${API_URL}/oral-performances`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data),
//     });
//     if (!response.ok) {
//       throw new Error(`Failed to create performance: ${response.statusText}`);
//     }
//     const result = await response.json();
//     return result.data || result;
//   },

//   // Upload audio for a performance
//   async uploadAudio(performanceId: string, audioBlob: Blob, duration: number) {
//     const formData = new FormData();
//     formData.append('audio', audioBlob, `recording-${Date.now()}.webm`);

//     const response = await fetch(
//       `${API_URL}/oral-performances/${performanceId}/audio?duration=${duration}`,
//       {
//         method: 'POST',
//         body: formData,
//       }
//     );
//     if (!response.ok) {
//       throw new Error(`Failed to upload audio: ${response.statusText}`);
//     }
//     const result = await response.json();
//     return result.data || result;
//   },

//   // Get audio URL for a performance
//   getAudioUrl(performanceId: string) {
//     return `${API_URL}/oral-performances/${performanceId}/audio`;
//   },

//   // Get a single performance by ID
//   async getPerformance(id: string) {
//     const response = await fetch(`${API_URL}/oral-performances/${id}`);
//     if (!response.ok) {
//       throw new Error(`Failed to get performance: ${response.statusText}`);
//     }
//     const result = await response.json();
//     return result.data || result;
//   },

//   // Update scores for a performance
//   async updateScores(id: string, scores: any) {
//     const response = await fetch(`${API_URL}/oral-performances/${id}/scores`, {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(scores),
//     });
//     if (!response.ok) {
//       throw new Error(`Failed to update scores: ${response.statusText}`);
//     }
//     const result = await response.json();
//     return result.data || result;
//   },

//   // Update feedback for a performance
//   async updateFeedback(id: string, feedback: any) {
//     const response = await fetch(`${API_URL}/oral-performances/${id}/feedback`, {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(feedback),
//     });
//     if (!response.ok) {
//       throw new Error(`Failed to update feedback: ${response.statusText}`);
//     }
//     const result = await response.json();
//     return result.data || result;
//   },

//   // ===========================================
//   // EVALUATION METHODS
//   // ===========================================

//   // Start a new evaluation
//   async startEvaluation(performanceId: string, subject: string) {
//     const response = await fetch(`${API_URL}/evaluations/performance/${performanceId}`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ subject }),
//     });
//     if (!response.ok) {
//       throw new Error(`Failed to start evaluation: ${response.statusText}`);
//     }
//     const result = await response.json();
//     return result;
//   },

//   // Get evaluation results
//   async getEvaluation(performanceId: string): Promise<EvaluationResult> {
//     const response = await fetch(`${API_URL}/evaluations/performance/${performanceId}`);
//     if (!response.ok) {
//       if (response.status === 404) {
//         // No evaluation found, return null or throw specific error
//         throw new Error('Evaluation not found');
//       }
//       throw new Error(`Failed to get evaluation: ${response.statusText}`);
//     }
//     const result = await response.json();
//     return result;
//   },

//   // Get evaluation status
//   async getEvaluationStatus(performanceId: string) {
//     const response = await fetch(`${API_URL}/evaluations/performance/${performanceId}/status`);
//     if (!response.ok) {
//       throw new Error(`Failed to get evaluation status: ${response.statusText}`);
//     }
//     const result = await response.json();
//     return result;
//   },

//   // Get all evaluations for a student
//   async getAllStudentEvaluations(studentId: string) {
//     const response = await fetch(`${API_URL}/evaluations/student/${studentId}`);
//     if (!response.ok) {
//       throw new Error(`Failed to get student evaluations: ${response.statusText}`);
//     }
//     const result = await response.json();
//     return result;
//   }
// };



// src/services/oralPerformance.service.ts

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

// ===========================================
// SERVICE IMPLEMENTATION
// ===========================================

const API_URL = 'http://localhost:3000';

export const oralPerformanceService = {
  // Create a new performance
  async create(data: { studentId: string; title: string; description?: string }) {
    const response = await fetch(`${API_URL}/oral-performances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to create performance: ${response.statusText}`);
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
      throw new Error(`Failed to upload audio: ${response.statusText}`);
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

  // Update scores for a performance
  async updateScores(id: string, scores: any) {
    const response = await fetch(`${API_URL}/oral-performances/${id}/scores`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scores),
    });
    if (!response.ok) {
      throw new Error(`Failed to update scores: ${response.statusText}`);
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
      throw new Error(`Failed to update feedback: ${response.statusText}`);
    }
    const result = await response.json();
    return result.data || result;
  },

  // ===========================================
  // EVALUATION METHODS
  // ===========================================

  // Start a new evaluation
  async startEvaluation(performanceId: string, subject: string) {
    const response = await fetch(`${API_URL}/evaluations/performance/${performanceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject }),
    });
    if (!response.ok) {
      throw new Error(`Failed to start evaluation: ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  },

  // FIXED: Get evaluation results with proper empty response handling
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
      throw new Error(`Failed to get student evaluations: ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  }
};