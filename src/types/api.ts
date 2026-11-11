/**
 * Tipos de comunicação e diagnóstico da API
 */

export interface SystemHealthResponse {
  status: 'operational' | 'degraded' | 'down';
  service: string;
  stage?: string;
  phase?: string;
  multiTenantMode?: string;
  authMode?: string;
  architecture?: {
    pattern: string;
    roles: string[];
    backendReadiness: string;
    securityCompliance: string;
  };
  runtime?: {
    nodeVersion: string;
    environment: string;
    port: number;
    timestamp: string;
  };
  timestamp?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
