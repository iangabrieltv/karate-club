import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

/**
 * Karate Club - Configuração Centralizada do Firebase Admin SDK
 * 
 * Regras Estritas:
 * 1. Inicialização singleton server-side.
 * 2. Utiliza FIREBASE_PROJECT_ID exclusivo do servidor (com fallback para 'gen-lang-client-0540643703').
 * 3. Não exige FIREBASE_SERVICE_ACCOUNT_JSON nesta etapa.
 * 4. Preparado para ADC (Application Default Credentials) nativo quando disponível.
 * 5. Falha explicitamente se for solicitada uma operação e a configuração estiver ausente.
 */

let firebaseAdminApp: App | null = null;

export interface FirebaseAdminConfig {
  projectId: string;
  isEmulator: boolean;
}

export function getFirebaseAdminConfig(): FirebaseAdminConfig {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0540643703';
  const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

  return {
    projectId,
    isEmulator,
  };
}

export function initFirebaseAdmin(): App {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    firebaseAdminApp = existingApps[0];
    return firebaseAdminApp;
  }

  const config = getFirebaseAdminConfig();

  // Em modo emulador local, inicializa com credencial dummy sem custos ou conexões reais
  if (config.isEmulator) {
    firebaseAdminApp = initializeApp({
      projectId: config.projectId,
    });
    return firebaseAdminApp;
  }

  // Inicialização padrão utilizando Application Default Credentials (ADC)
  try {
    firebaseAdminApp = initializeApp({
      credential: applicationDefault(),
      projectId: config.projectId,
    });
    return firebaseAdminApp;
  } catch (err: unknown) {
    // Se ADC não estiver disponível no ambiente de desenvolvimento, registra e lança erro explícito
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `[Firebase Admin SDK] Falha ao inicializar com Application Default Credentials (ADC): ${msg}. ` +
      `Para execução local desacoplada, utilize os repositórios Mock ou configure FIRESTORE_EMULATOR_HOST.`
    );
  }
}

export function getFirestoreDb(): Firestore {
  const app = initFirebaseAdmin();
  return getFirestore(app);
}

export function isFirebaseAdminInitialized(): boolean {
  return getApps().length > 0;
}
