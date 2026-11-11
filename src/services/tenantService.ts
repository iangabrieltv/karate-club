import { Dojo, DojoUser, UserRole } from '../types/tenant.ts';
import { db, auth } from '../config/firebase.ts';

/**
 * Contrato de serviço Multi-Tenant do Dojo
 *
 * FASE 2: Conectado ao Firebase modular (gen-lang-client-0540643703).
 * Instâncias prontas:
 * - db: Cloud Firestore (southamerica-east1)
 * - auth: Firebase Authentication
 *
 * Conforme restrições da especificação da Fase 2:
 * Não realiza leituras ou escritas automáticas até a modelagem de coleções da Fase 3.
 */
export interface ITenantService {
  getCurrentDojoId(): string | null;
  getDojoById(dojoId: string): Promise<Dojo | null>;
  getCurrentUserRole(): UserRole | null;
  validateTenantAccess(userId: string, targetDojoId: string): Promise<boolean>;
}

export const TenantServiceContract = {
  description: 'Contrato de abstração multi-tenant para integração do Firebase Firestore',
  multiTenantKey: 'dojoId',
  supportedRoles: ['admin', 'student'] as const,
  firestoreReady: Boolean(db),
  authReady: Boolean(auth),
};

