import { request } from './apiClient';
import { HealthResponse } from '../types/api';

/**
 * Service methods for verifying backend availability and health.
 */
export const healthService = {
  /**
   * Fetches backend health check information from GET /api/health.
   */
  async getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>('/api/health');
  },
};
