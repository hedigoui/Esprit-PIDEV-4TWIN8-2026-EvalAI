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
      
      if (result) {
        setEvaluation(result);
        setError(null);
        
        if (result.status === 'completed' || result.status === 'failed') {
          stopPolling();
        }
      }
      // If result is null, it means evaluation not found yet - keep polling
      
      return result;
    } catch (err: any) {
      // Log non-404 errors but don't set them as UI errors during polling
      const errorMsg = err?.message || 'Unknown error';
      if (!errorMsg.includes('404')) {
        console.debug('Polling evaluation:', errorMsg);
      }
    }
  };

  const startPolling = () => {
    stopPolling();
    const interval = window.setInterval(fetchEvaluation, 3000);
    setPollingInterval(interval);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      window.clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        window.clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  useEffect(() => {
    if (performanceId) {
      fetchEvaluation();
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
