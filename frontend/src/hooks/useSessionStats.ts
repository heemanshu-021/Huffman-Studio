import { useState, useCallback } from 'react';
import type { SessionOperation, SessionStats } from '../types/compression';

const SESSION_STORAGE_KEY = 'huffman_studio_session_ops';

/**
 * Custom hook tracking real operations and metrics completed during the current browser session.
 */
export function useSessionStats() {
  const [operations, setOperations] = useState<SessionOperation[]>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const recordOperation = useCallback((op: Omit<SessionOperation, 'id' | 'timestamp'>) => {
    const newOp: SessionOperation = {
      ...op,
      id: 'op-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
    };
    setOperations((prev) => {
      const next = [newOp, ...prev];
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
    setOperations([]);
  }, []);

  const totalCompressed = operations.filter((o) => o.type === 'COMPRESS').length;
  const totalDecompressed = operations.filter((o) => o.type === 'DECOMPRESS').length;
  const totalOriginalBytes = operations
    .filter((o) => o.type === 'COMPRESS')
    .reduce((sum, o) => sum + o.originalSize, 0);
  const totalArchiveBytes = operations
    .filter((o) => o.type === 'COMPRESS')
    .reduce((sum, o) => sum + o.processedSize, 0);
  const totalBytesSaved = totalOriginalBytes - totalArchiveBytes;

  const stats: SessionStats = {
    totalCompressed,
    totalDecompressed,
    totalOriginalBytes,
    totalArchiveBytes,
    totalBytesSaved,
    operations,
  };

  return { stats, recordOperation, clearSession };
}
