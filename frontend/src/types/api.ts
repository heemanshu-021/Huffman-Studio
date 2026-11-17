/**
 * Type contracts matching backend DTO responses.
 */

export interface HealthResponse {
  status: 'UP' | 'DOWN' | 'UNKNOWN';
  message: string;
  timestamp: string;
  version: string;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
}
