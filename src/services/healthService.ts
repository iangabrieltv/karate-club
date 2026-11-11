import { SystemHealthResponse } from '../types/api.ts';
import { requestJson } from './apiClient.ts';

export const HealthService = {
  /**
   * Consulta a integridade do servidor Node.js/Express
   */
  async checkHealth(): Promise<SystemHealthResponse> {
    return requestJson<SystemHealthResponse>('/api/health');
  },
};
