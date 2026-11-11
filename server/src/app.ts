import express, { Request, Response } from 'express';
import { errorHandler } from './middlewares/errorHandler';

/**
 * Cria a aplicação Express com rotas fundamentais
 */
export function createApp(): express.Application {
  const app = express();

  app.use(express.json());

  // Endpoint de Saúde e Diagnóstico Operacional Seguro
  app.get('/api/health', (_req: Request, res: Response) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const port = Number(process.env.PORT) || 3000;

    res.json({
      status: 'operational',
      service: 'Karate Club SaaS Engine',
      stage: 'Stage 4.2 - Persistence Layer with Cloud Firestore Adapters',
      phase: 'Phase 4.2 - Persistence Layer with Cloud Firestore Adapters',
      multiTenantMode: 'Active (Dojo Isolation with Subcollections)',
      authMode: 'Decoupled (Mockable & Firestore Injection Ready)',
      architecture: {
        pattern: 'Multi-Tenant by Subcollections (/dojos/{dojoId}/*) + Custom Claims',
        roles: ['superadmin', 'admin', 'sensei', 'student'],
        backendReadiness: 'Decoupled (Mockable & Injection Ready)',
        securityCompliance: 'Custom Claims RBAC, server-authoritative models, zero secrets in client',
      },
      runtime: {
        nodeVersion: process.version,
        environment: isProduction ? 'production' : 'development',
        port,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Endpoints declarados mas não conectados nesta etapa respondem 501 Not Implemented
  app.all('/api/auth/*', (_req: Request, res: Response) => {
    res.status(501).json({
      error: 'NOT_IMPLEMENTED',
      message: 'O endpoint de autenticação está preparado na arquitetura mas não conectado a serviços reais nesta etapa.',
    });
  });

  app.all('/api/admin/*', (_req: Request, res: Response) => {
    res.status(501).json({
      error: 'NOT_IMPLEMENTED',
      message: 'O endpoint administrativo está preparado na arquitetura mas não conectado a serviços reais nesta etapa.',
    });
  });

  app.use(errorHandler);

  return app;
}
