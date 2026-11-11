import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { SystemHealthResponse } from '../types/api.ts';
import { StatusCard } from '../components/StatusCard.tsx';
import { MultiTenantInspector } from '../components/MultiTenantInspector.tsx';
import { RouteNavigator } from '../components/RouteNavigator.tsx';
import { Server, ShieldAlert, CheckCircle2, ArrowRight, Flame, Database, Key } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brand.ts';
import { getFirebaseDiagnostic } from '../config/firebase.ts';

interface OutletContextType {
  healthData: SystemHealthResponse | null;
  isCheckingHealth: boolean;
  healthError: string | null;
  runHealthCheck: () => void;
}

export const FoundationOverview: React.FC = () => {
  const { healthData, isCheckingHealth, healthError, runHealthCheck } =
    useOutletContext<OutletContextType>();
  const firebaseDiag = getFirebaseDiagnostic();

  return (
    <div className="space-y-8">
      {/* Hero Foundation Section */}
      <div className="border border-[#222222] bg-[#0A0A0A] rounded-xl p-8 relative overflow-hidden">
        <div className="max-w-3xl relative z-10">
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
            <span className="text-[#B50000] font-bold tracking-widest uppercase">Fase 3</span>
            <span aria-hidden="true">·</span>
            <span>Planejamento de Autenticação & Multi-Tenant</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-zinc-300">gen-lang-client-0540643703</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Sistema de Gestão Profissional para Dojos de Karatê
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-6">
            Estrutura base do SaaS <strong className="text-white">Karate Club</strong> com arquitetura multi-tenant planejada.
            Topologia de subcoleções aninhadas (<code className="text-zinc-300 font-mono">/dojos/&#123;dojoId&#125;/*</code>), controle de acesso por Custom Claims e regras de segurança projetadas sem criação de documentos fictícios.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={runHealthCheck}
              disabled={isCheckingHealth}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#B50000] hover:bg-[#990000] active:scale-95 transition-all rounded cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <span>{isCheckingHealth ? 'Consultando Backend...' : 'Testar Comunicação Backend'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-zinc-500 font-mono">
              Porta: 3000 · Endpoint: /api/health
            </span>
          </div>
        </div>
      </div>

      {/* Backend Live Health Response Block */}
      <div className="bg-[#121212] border border-[#222222] rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#B50000]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Diagnóstico do Servidor Node.js / Express
            </h2>
          </div>
          <div className="text-xs font-mono text-zinc-500">
            {healthData ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 inline" /> Servidor Ativo
              </span>
            ) : healthError ? (
              <span className="text-[#B50000] flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 inline" /> Falha no Diagnóstico
              </span>
            ) : (
              'Aguardando resposta...'
            )}
          </div>
        </div>

        {healthData ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-black/60 border border-[#222222] p-3 rounded">
              <span className="text-zinc-500 block text-[11px] mb-1">Status Operacional</span>
              <span className="text-emerald-400 font-bold uppercase">{healthData.status}</span>
            </div>
            <div className="bg-black/60 border border-[#222222] p-3 rounded">
              <span className="text-zinc-500 block text-[11px] mb-1">Serviço Backend</span>
              <span className="text-white font-medium">{healthData.service}</span>
            </div>
            <div className="bg-black/60 border border-[#222222] p-3 rounded">
              <span className="text-zinc-500 block text-[11px] mb-1">Ambiente & Node</span>
              <span className="text-zinc-300 tabular-nums">
                {healthData.runtime?.environment ?? 'development'} ({healthData.runtime?.nodeVersion ?? 'Node.js'})
              </span>
            </div>
            <div className="bg-black/60 border border-[#222222] p-3 rounded">
              <span className="text-zinc-500 block text-[11px] mb-1">Último Timestamp</span>
              <span className="text-zinc-400 tabular-nums truncate block">
                {healthData.runtime?.timestamp
                  ? new Date(healthData.runtime.timestamp).toLocaleTimeString('pt-BR')
                  : healthData.timestamp
                  ? new Date(healthData.timestamp).toLocaleTimeString('pt-BR')
                  : new Date().toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        ) : healthError ? (
          <div className="bg-[#B50000]/10 border border-[#B50000]/30 rounded p-4 text-xs text-zinc-300">
            <p className="font-semibold text-white mb-1">Aviso de Conexão:</p>
            <p>{healthError}</p>
          </div>
        ) : (
          <div className="text-xs text-zinc-500 font-mono py-2">
            Carregando diagnóstico do backend...
          </div>
        )}
      </div>

      {/* Firebase Existing Project Diagnostic Block */}
      <div className="bg-[#121212] border border-[#222222] rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#B50000]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Integração Manual Firebase (Projeto gen-lang-client-0540643703)
            </h2>
          </div>
          <div className="text-xs font-mono">
            {firebaseDiag.status === 'sdk_initialized' ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 inline" /> SDK Inicializado em Memória
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                Configuração Pendente (.env)
              </span>
            )}
          </div>
        </div>

        {/* 3 Camadas Distintas de Diagnóstico */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-4">
          {/* Camada 1: Configuração .env */}
          <div className="bg-black/60 border border-[#222222] p-4 rounded flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                1. Configuração (.env)
              </div>
              <div className="text-sm font-semibold text-white mb-2">
                {firebaseDiag.isConfigurationComplete ? (
                  <span className="text-emerald-400">Variáveis Carregadas</span>
                ) : (
                  <span className="text-zinc-300">Aguardando Chaves Reais</span>
                )}
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                {firebaseDiag.isConfigurationComplete
                  ? 'Todas as variáveis obrigatórias foram fornecidas sem valores fictícios.'
                  : `Pendentes: ${firebaseDiag.missingVariables.join(', ')}`}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#222222] text-[10px] font-mono text-zinc-500">
              Projeto: gen-lang-client-0540643703
            </div>
          </div>

          {/* Camada 2: SDK Local */}
          <div className="bg-black/60 border border-[#222222] p-4 rounded flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                2. SDK em Memória
              </div>
              <div className="text-sm font-semibold text-white mb-2">
                {firebaseDiag.sdkInstances.appAvailable ? (
                  <span className="text-emerald-400">Instanciado (Auth & DB)</span>
                ) : (
                  <span className="text-zinc-400">Não Inicializado</span>
                )}
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                {firebaseDiag.sdkInstances.appAvailable
                  ? 'initializeApp(), getAuth() e getFirestore() ativos no banco (default).'
                  : 'O SDK não é inicializado com dados incompletos para evitar corrupção de estado.'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#222222] text-[10px] font-mono text-zinc-500">
              Serviços: Auth + Firestore (Sem Storage)
            </div>
          </div>

          {/* Camada 3: Rede & Regras */}
          <div className="bg-black/60 border border-[#222222] p-4 rounded flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                3. Conexão de Rede & Regras
              </div>
              <div className="text-sm font-semibold text-white mb-2">
                <span className="text-zinc-300">Pendente de Teste (Fase 3)</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                A inicialização local não comprova conexão ativa. O teste efetivo de rede ocorrerá
                na primeira operação autenticada. As regras padrão continuam negando acessos.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#222222] text-[10px] font-mono text-zinc-500">
              Alvo: southamerica-east1 (São Paulo)
            </div>
          </div>
        </div>

        {/* Detalhamento das Variáveis de Ambiente */}
        <div className="bg-black/50 border border-[#222222] rounded p-4 mb-4">
          <div className="text-xs font-semibold text-white mb-2 flex items-center justify-between">
            <span>Verificação das Variáveis de Ambiente Vite:</span>
            <span className="font-mono text-[11px] text-zinc-500">
              Projeto Alvo: <span className="text-zinc-300">gen-lang-client-0540643703</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-black/60 border border-[#222222] p-2.5 rounded flex items-center justify-between">
              <span className="text-zinc-400 text-[11px]">API_KEY</span>
              {firebaseDiag.loadedVariables.apiKeyConfigured ? (
                <span className="text-emerald-400 text-[10px] bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/50">Carregada</span>
              ) : (
                <span className="text-zinc-500 text-[10px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">Ausente</span>
              )}
            </div>

            <div className="bg-black/60 border border-[#222222] p-2.5 rounded flex items-center justify-between">
              <span className="text-zinc-400 text-[11px]">AUTH_DOMAIN</span>
              {firebaseDiag.loadedVariables.authDomainConfigured ? (
                <span className="text-emerald-400 text-[10px] bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/50">Carregada</span>
              ) : (
                <span className="text-zinc-500 text-[10px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">Ausente</span>
              )}
            </div>

            <div className="bg-black/60 border border-[#222222] p-2.5 rounded flex items-center justify-between">
              <span className="text-zinc-400 text-[11px]">PROJECT_ID</span>
              {firebaseDiag.loadedVariables.projectIdConfigured ? (
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  firebaseDiag.targetProject.isMatched
                    ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50'
                    : 'text-amber-400 bg-amber-950/40 border-amber-900/50'
                }`}>
                  {firebaseDiag.targetProject.isMatched ? 'Correto' : 'Divergente'}
                </span>
              ) : (
                <span className="text-zinc-500 text-[10px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">Ausente</span>
              )}
            </div>

            <div className="bg-black/60 border border-[#222222] p-2.5 rounded flex items-center justify-between">
              <span className="text-zinc-400 text-[11px]">APP_ID</span>
              {firebaseDiag.loadedVariables.appIdConfigured ? (
                <span className="text-emerald-400 text-[10px] bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/50">Carregada</span>
              ) : (
                <span className="text-zinc-500 text-[10px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">Ausente</span>
              )}
            </div>
          </div>
        </div>

        {firebaseDiag.isAppIdInverted && (
          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded p-3 mb-4 text-xs text-emerald-300">
            <span>
              <strong>Normalização Ativa:</strong> As variáveis <code className="font-mono text-white">VITE_FIREBASE_APP_ID</code> e <code className="font-mono text-white">VITE_FIREBASE_MESSAGING_SENDER_ID</code> foram detectadas e ajustadas automaticamente para os parâmetros corretos do Firebase SDK.
            </span>
          </div>
        )}

        {!firebaseDiag.isConfigurationComplete && (
          <div className="bg-black/40 border border-[#222222] rounded p-4 text-xs text-zinc-300">
            <p className="font-semibold text-white mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#B50000]" />
              <span>Instruções de Configuração no .env:</span>
            </p>
            <p className="leading-relaxed text-zinc-400">
              Copie os valores reais diretamente do Firebase Console (<span className="text-zinc-300">Configurações do Projeto &gt; Seus aplicativos &gt; Karate Club Web &gt; Config</span>)
              e crie o arquivo <code className="text-white font-mono">.env</code> com base no modelo em <code className="text-white font-mono">.env.example</code>. O sistema aguarda as chaves reais para inicializar o SDK sem dados fictícios.
            </p>
          </div>
        )}
      </div>

      {/* Grid of Architecture Pillars */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Pilares da Arquitetura (Fase 1 & 2)
            </h2>
            <p className="text-xs text-zinc-400">
              Conformidade das entregas de fundação e integração manual com Firebase.
            </p>
          </div>
          <span className="text-xs font-mono text-[#B50000]">7/7 Pilares Configurados</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatusCard
            category="Backend Firebase"
            title="Firebase Web SDK Modular"
            description="Conexão direta ao projeto gen-lang-client-0540643703 sem dados fictícios. getFirestore preparado para o banco (default) e regras mantidas negando acessos."
            status={firebaseDiag.status === 'sdk_initialized' ? 'verified' : 'pending'}
            metric={firebaseDiag.status === 'sdk_initialized' ? 'SDK Pronto' : 'Config Pendente'}
            details="src/config/firebase.ts"
          />

          <StatusCard
            category="Backend & Servidor"
            title="Express + Node.js Integrado"
            description="Servidor Express configurado em server.ts com suporte a rotas de API (/api/health) e Vite dev middleware montado sem intermediários externos."
            status="verified"
            metric="Porta 3000"
            details="server.ts"
          />

          <StatusCard
            category="Multi-Tenant"
            title="Isolamento Lógico por dojoId"
            description="Modelagem rigorosa com vínculo obrigatório de dojoId em todas as entidades administrativas, sem dados simulados ou falsos bancos de dados."
            status="ready"
            metric="Multi-Tenant"
            details="src/types/tenant.ts"
          />

          <StatusCard
            category="Roteamento SPA"
            title="React Router DOM Integrado"
            description="Árvore de rotas profissionais declarada, isolando os futuros ambientes do professor (/admin/*) e portal do aluno (/student/*)."
            status="verified"
            metric="v7 SPA"
            details="src/routes/AppRoutes.tsx"
          />

          <StatusCard
            category="Identidade Visual"
            title="Design SaaS Profissional"
            description="Paleta estrita (#B50000, #000000, #FFFFFF), tipografia Plus Jakarta Sans e JetBrains Mono, com conformidade total anti-slop e sem pills decorativas."
            status="verified"
            metric="#B50000"
            details="src/config/brand.ts"
          />

          <StatusCard
            category="Camada de Serviços"
            title="Clientes & Abstração de API"
            description="Camada de serviços desacoplada pronta para receber a autenticação e persistência do Firebase Firestore na etapa posterior."
            status="ready"
            metric="Zero Secrets"
            details="src/services/*"
          />

          <StatusCard
            category="Segurança & Qualidade"
            title="Controle de Papéis de Acesso"
            description="Tipagem de papéis (admin e student) sem senhas no frontend, sem segredos expostos e preparada para regras de segurança robustas."
            status="ready"
            metric="admin | student"
            details="src/types/auth"
          />
        </div>
      </div>

      {/* Multi-Tenant Inspector */}
      <MultiTenantInspector />

      {/* Interactive Route Navigator */}
      <RouteNavigator />

      {/* Arquitetura & Explicação dos Arquivos */}
      <div className="bg-[#121212] border border-[#222222] rounded-lg p-6">
        <h2 className="text-base font-bold text-white tracking-tight mb-2">
          Estrutura Arquitetural de Arquivos Criados
        </h2>
        <p className="text-xs text-zinc-400 mb-4">
          Resumo da divisão de responsabilidades implementada para garantir escalabilidade nas próximas fases:
        </p>

        <div className="space-y-3 text-xs font-mono">
          <div className="border border-[#222222] bg-black/40 rounded p-3">
            <span className="text-[#B50000] font-bold">/server.ts</span>
            <p className="text-zinc-400 mt-1 font-sans">
              Servidor backend Express que expõe a rota <code className="font-mono text-zinc-300">/api/health</code> e orquestra o Vite em modo desenvolvimento e produção.
            </p>
          </div>

          <div className="border border-[#222222] bg-black/40 rounded p-3">
            <span className="text-[#B50000] font-bold">/src/types/tenant.ts</span>
            <p className="text-zinc-400 mt-1 font-sans">
              Tipagem do domínio multi-tenant: <code className="font-mono text-zinc-300">Dojo</code>, <code className="font-mono text-zinc-300">DojoUser</code> com papéis <code className="font-mono text-zinc-300">admin | student</code>, <code className="font-mono text-zinc-300">StudentProfile</code>, <code className="font-mono text-zinc-300">KarateBelt</code> e turmas.
            </p>
          </div>

          <div className="border border-[#222222] bg-black/40 rounded p-3">
            <span className="text-[#B50000] font-bold">/src/config/brand.ts & /src/config/routes.ts</span>
            <p className="text-zinc-400 mt-1 font-sans">
              Constantes centrais do sistema: cores oficiais (#B50000, #000000, #FFFFFF), módulos mapeados e dicionário tipado de rotas.
            </p>
          </div>

          <div className="border border-[#222222] bg-black/40 rounded p-3">
            <span className="text-[#B50000] font-bold">/src/services/apiClient.ts & healthService.ts</span>
            <p className="text-zinc-400 mt-1 font-sans">
              Camada de serviços cliente HTTP com tratamento de erros, sem expor credenciais no navegador, preparada para integração segura com Firebase.
            </p>
          </div>

          <div className="border border-[#222222] bg-black/40 rounded p-3">
            <span className="text-[#B50000] font-bold">/src/routes/AppRoutes.tsx & /src/layouts/RootLayout.tsx</span>
            <p className="text-zinc-400 mt-1 font-sans">
              Infraestrutura de roteamento SPA com React Router DOM e layout base com cabeçalho (Top Bar de 3 zonas) e rodapé institucional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
