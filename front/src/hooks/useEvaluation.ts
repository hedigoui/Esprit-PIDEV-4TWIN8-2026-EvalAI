// // src/hooks/useEvaluation.ts
// import { useState, useEffect } from 'react';
// import { oralPerformanceService, EvaluationResult } from '../pages/services/oralPerformance.service';

// interface UseEvaluationProps {
//   performanceId: string;
//   autoPoll?: boolean;
// }

// export const useEvaluation = ({ performanceId, autoPoll = true }: UseEvaluationProps) => {
//   const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   // Use ReturnType<typeof setTimeout> for browser environment
//   const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setTimeout> | null>(null);

//   const startEvaluation = async (subject: string) => {
//     try {
//       setIsLoading(true);
//       setError(null);
      
//       const result = await oralPerformanceService.startEvaluation(performanceId, subject);
//       setEvaluation(result);
      
//       // Start polling if autoPoll is enabled
//       if (autoPoll && result.status === 'processing') {
//         startPolling();
//       }
      
//       return result;
//     } catch (err) {
//       setError('Failed to start evaluation');
//       console.error(err);
//       throw err;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchEvaluation = async () => {
//     try {
//       const result = await oralPerformanceService.getEvaluation(performanceId);
//       setEvaluation(result);
      
//       // Stop polling if evaluation is completed or failed
//       if (result.status === 'completed' || result.status === 'failed') {
//         stopPolling();
//       }
      
//       return result;
//     } catch (err) {
//       console.error('Failed to fetch evaluation:', err);
//     }
//   };

//   const startPolling = () => {
//     stopPolling(); // Clear any existing interval
//     // Use window.setTimeout for browser environment
//     const interval = window.setInterval(fetchEvaluation, 3000); // Poll every 3 seconds
//     setPollingInterval(interval);
//   };

//   const stopPolling = () => {
//     if (pollingInterval) {
//       window.clearInterval(pollingInterval);
//       setPollingInterval(null);
//     }
//   };

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       if (pollingInterval) {
//         window.clearInterval(pollingInterval);
//       }
//     };
//   }, [pollingInterval]);

//   // Fetch evaluation on mount if performanceId exists
//   useEffect(() => {
//     if (performanceId) {
//       fetchEvaluation();
//     }
//   }, [performanceId]);

//   return {
//     evaluation,
//     isLoading,
//     error,
//     startEvaluation,
//     fetchEvaluation,
//     stopPolling,
//   };
// };



// src/hooks/useEvaluation.ts
import { useState, useEffect } from 'react';
import { oralPerformanceService, EvaluationResult } from '../pages/services/oralPerformance.service';

interface UseEvaluationProps {
  performanceId: string;
  autoPoll?: boolean;
}

export const useEvaluation = ({ performanceId, autoPoll = true }: UseEvaluationProps) => {
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setTimeout> | null>(null);

  const startEvaluation = async (subject: string) => {
    if (!performanceId) {
      setError('No performance ID available');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await oralPerformanceService.startEvaluation(performanceId, subject);
      setEvaluation(result);
      
      // Start polling if autoPoll is enabled
      if (autoPoll && result && result.status === 'processing') {
        startPolling();
      }
      
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to start evaluation');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvaluation = async () => {
    if (!performanceId) return;

    try {
      const result = await oralPerformanceService.getEvaluation(performanceId);
      
      // FIXED: Check if result exists before accessing properties
      if (result) {
        setEvaluation(result);
        
        // Stop polling if evaluation is completed or failed
        if (result.status === 'completed' || result.status === 'failed') {
          stopPolling();
        }
      } else {
        // No evaluation yet, that's fine
        setEvaluation(null);
      }
    } catch (err: any) {
      // Don't set error for "not found" - this is normal when evaluation doesn't exist yet
      if (err.message !== 'Evaluation not found') {
        console.error('Failed to fetch evaluation:', err);
        setError(err.message);
      }
    }
  };

  const startPolling = () => {
    stopPolling(); // Clear any existing interval
    const interval = window.setInterval(fetchEvaluation, 3000);
    setPollingInterval(interval);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      window.clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        window.clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Fetch evaluation on mount if performanceId exists
  useEffect(() => {
    if (performanceId) {
      // Small delay to avoid race conditions
      const timer = setTimeout(() => {
        fetchEvaluation();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [performanceId]);

  return {
    evaluation,
    isLoading,
    error,
    startEvaluation,
    fetchEvaluation,
    stopPolling,
  };
};