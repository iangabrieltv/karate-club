import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Karate Club - Configuração do Firebase Web SDK
 * Conexão direta ao projeto: gen-lang-client-0540643703
 * Banco Firestore: (default) em southamerica-east1 (São Paulo)
 *
 * REGRA RIGOROSA:
 * - Nenhum valor fictício ou fallback artificial é utilizado.
 * - Se as variáveis obrigatórias não estiverem presentes no .env, o SDK NÃO é inicializado com dados incompletos.
 * - Storage NÃO é utilizado nesta etapa.
 */

// Leitura estrita das variáveis de ambiente Vite (sem fallbacks falsos)
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim() || '';
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || '';
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() || '';
const rawAppId = import.meta.env.VITE_FIREBASE_APP_ID?.trim() || '';
const rawSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || '';

// Detecção inteligente de inversão entre appId e messagingSenderId
// No Firebase Web, o appId segue o padrão '1:<projectNumber>:web:<hash>'
const isAppIdInverted = Boolean(rawSenderId?.startsWith('1:') && !rawAppId?.startsWith('1:'));
const appId = isAppIdInverted ? rawSenderId : rawAppId;
const messagingSenderId = isAppIdInverted ? (rawAppId || undefined) : (rawSenderId || undefined);

// Identificação estrita de pendências nas variáveis obrigatórias
const missingVariables: string[] = [];
if (!apiKey) missingVariables.push('VITE_FIREBASE_API_KEY');
if (!authDomain) missingVariables.push('VITE_FIREBASE_AUTH_DOMAIN');
if (!projectId) missingVariables.push('VITE_FIREBASE_PROJECT_ID');
if (!appId) missingVariables.push('VITE_FIREBASE_APP_ID');

const isConfigurationComplete = missingVariables.length === 0;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let initializationError: string | null = null;

// Inicializa exclusivamente se todas as variáveis obrigatórias estiverem preenchidas
if (isConfigurationComplete) {
  try {
    if (getApps().length === 0) {
      const firebaseConfig: FirebaseOptions = {
        apiKey,
        authDomain,
        projectId,
        appId,
        ...(messagingSenderId ? { messagingSenderId } : {}),
      };
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    if (app) {
      auth = getAuth(app);
      db = getFirestore(app); // Conecta ao banco padrão (default) existente
    }
  } catch (err: unknown) {
    initializationError = err instanceof Error ? err.message : 'Falha na inicialização do Firebase SDK';
    console.error('[Karate Club Firebase] Erro ao inicializar SDK:', initializationError);
  }
} else {
  console.info(
    `[Karate Club Firebase] Configuração pendente no .env. Variáveis ausentes: ${missingVariables.join(', ')}`
  );
}

export type FirebaseConfigStatus = 'pending_configuration' | 'sdk_initialized' | 'initialization_error';

export interface FirebaseDiagnostic {
  status: FirebaseConfigStatus;
  isConfigurationComplete: boolean;
  missingVariables: string[];
  isAppIdInverted: boolean;
  targetProject: {
    expectedId: 'gen-lang-client-0540643703';
    configuredId?: string;
    isMatched: boolean;
  };
  loadedVariables: {
    apiKeyConfigured: boolean;
    authDomainConfigured: boolean;
    projectIdConfigured: boolean;
    appIdConfigured: boolean;
    messagingSenderIdConfigured: boolean;
    projectIdValue?: string;
    authDomainValue?: string;
  };
  sdkInstances: {
    appAvailable: boolean;
    authAvailable: boolean;
    firestoreAvailable: boolean;
  };
  firestoreTarget: {
    databaseId: '(default)';
    configuredRegion: 'southamerica-east1 (São Paulo)';
    rulesStatus: 'regras_padrao_bloqueando_acessos';
  };
  networkHandshake: {
    state: 'pendente_primeira_operacao_fase3';
    description: 'A presença de variáveis ou SDK instanciado em memória não confirma conexão ativa na rede. O teste de rede ocorrerá na Fase 3.';
  };
  error: string | null;
}

export function getFirebaseDiagnostic(): FirebaseDiagnostic {
  let status: FirebaseConfigStatus = 'pending_configuration';
  if (initializationError) {
    status = 'initialization_error';
  } else if (app && auth && db) {
    status = 'sdk_initialized';
  }

  return {
    status,
    isConfigurationComplete,
    missingVariables,
    isAppIdInverted,
    targetProject: {
      expectedId: 'gen-lang-client-0540643703',
      configuredId: projectId || undefined,
      isMatched: projectId === 'gen-lang-client-0540643703',
    },
    loadedVariables: {
      apiKeyConfigured: Boolean(apiKey),
      authDomainConfigured: Boolean(authDomain),
      projectIdConfigured: Boolean(projectId),
      appIdConfigured: Boolean(appId),
      messagingSenderIdConfigured: Boolean(messagingSenderId),
      projectIdValue: projectId || undefined,
      authDomainValue: authDomain || undefined,
    },
    sdkInstances: {
      appAvailable: Boolean(app),
      authAvailable: Boolean(auth),
      firestoreAvailable: Boolean(db),
    },
    firestoreTarget: {
      databaseId: '(default)',
      configuredRegion: 'southamerica-east1 (São Paulo)',
      rulesStatus: 'regras_padrao_bloqueando_acessos',
    },
    networkHandshake: {
      state: 'pendente_primeira_operacao_fase3',
      description:
        'A presença de variáveis ou SDK instanciado em memória não confirma conexão ativa na rede. O teste de rede ocorrerá na Fase 3.',
    },
    error: initializationError,
  };
}

export { app, auth, db };
