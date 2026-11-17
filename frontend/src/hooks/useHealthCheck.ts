import { useState, useEffect, useCallback } from 'react';
import { healthService } from '../services/healthService';
import { HealthResponse } from '../types/api';

export type HealthStatus = 'UP' | 'DOWN' | 'CHECKING';

export function useHealthCheck(pollIntervalMs = 15000) {
  const [status, setStatus] = useState<HealthStatus>('CHECKING');
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    try {
      const response = await healthService.getHealth();
      setData(response);
      setStatus(response.status === 'UP' ? 'UP' : 'DOWN');
      setError(null);
    } catch (err) {
      setStatus('DOWN');
      setError(err instanceof Error ? err.message : 'Backend unreachable');
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, pollIntervalMs);
    return () => clearInterval(interval);
  }, [check, pollIntervalMs]);

  return { status, data, error, refetch: check };
}
