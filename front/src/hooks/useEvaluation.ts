import { useState, useEffect, useCallback, useRef } from 'react';
import { oralPerformanceService, EvaluationResult } from '../pages/services/oralPerformance.service';

interface UseEvaluationProps {
  performanceId: string;
  autoPoll?: boolean;
}

export const useEvaluation = ({ performanceId, autoPoll = true }: UseEvaluationProps) => {
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const fetchEvaluationForPerformance = useCallback(
    async (id: string) => {
      if (!id) return;

      try {
        const result = await oralPerformanceService.getEvaluation(id);

        if (result) {
          setEvaluation(result);
          setError(null);

          if (result.status === 'completed' || result.status === 'failed') {
            stopPolling();
          }
        }

        return result;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        if (!errorMsg.includes('404')) {
          console.debug('Polling evaluation:', errorMsg);
        }
      }
    },
    [stopPolling],
  );

  const startPolling = useCallback(
    (id: string) => {
      stopPolling();
      pollingRef.current = window.setInterval(() => {
        void fetchEvaluationForPerformance(id);
      }, 3000);
    },
    [stopPolling, fetchEvaluationForPerformance],
  );

  /**
   * @param overridePerformanceId — pass after create/upload so the API runs before React
   *   re-renders with the new `performanceId` (fixes "first click does nothing").
   */
  const startEvaluation = async (subject: string, overridePerformanceId?: string) => {
    const id = overridePerformanceId ?? performanceId;
    if (!id) {
      throw new Error('No performance ID');
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await oralPerformanceService.startEvaluation(id, subject);
      setEvaluation(result);

      if (autoPoll && result && result.status === 'processing') {
        startPolling(id);
      }

      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start evaluation';
      setError(message);
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvaluation = async () => {
    if (!performanceId) return;
    return fetchEvaluationForPerformance(performanceId);
  };

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    if (!performanceId) {
      setError(null);
      setEvaluation(null);
      stopPolling();
      return;
    }
    void fetchEvaluationForPerformance(performanceId);
  }, [performanceId, fetchEvaluationForPerformance, stopPolling]);

  return {
    evaluation,
    isLoading,
    error,
    startEvaluation,
    fetchEvaluation,
    stopPolling,
  };
};
