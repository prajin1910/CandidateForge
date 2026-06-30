import { useState, useCallback } from 'react';
import { transformCandidate } from '@/lib/pipeline/transformService';

/**
 * useTransform — manages the transformation pipeline state.
 * Returns { status, result, error, pipelineLog, transform, reset }.
 */
export function useTransform() {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [pipelineLog, setPipelineLog] = useState([]);

  const transform = useCallback(async (inputs) => {
    setStatus('loading');
    setError(null);
    setResult(null);
    setPipelineLog([]);

    try {
      const res = await transformCandidate({
        ...inputs,
        onProgress: (entry) => {
          setPipelineLog(prev => [...prev, entry]);
        },
      });

      if (res.success) {
        setStatus('success');
        setResult(res);
      } else {
        setStatus('error');
        setError({
          message: 'Schema validation failed',
          details: res.errors,
        });
        setResult(res);
      }
    } catch (e) {
      setStatus('error');
      setError({
        message: e.message || 'An unexpected error occurred',
        name: e.name,
      });
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
    setPipelineLog([]);
  }, []);

  return { status, result, error, pipelineLog, transform, reset };
}