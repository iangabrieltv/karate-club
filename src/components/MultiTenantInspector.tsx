import React, { useState } from 'react';
import { BRAND_CONFIG } from '../config/brand.ts';
import { Layers, Shield, KeyRound, Building2 } from 'lucide-react';

export const MultiTenantInspector: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'model' | 'subcollections' | 'roles' | 'modules'>('model');

  return (
    <div className="bg-[#121212] border border-[#222222] rounded-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#222222]">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Layers className="w-3.5 h-3.5 text-[#B50000]" />
            <span>Fundação Multi-Tenant Karate Club</span>
            <span aria-hidden="true">·</span>
            <span>Fase 3: Modelagem Firestore & Custom Claims</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Topologia de Isolamento por Dojo (<span className="text-[#B50000] font-mono">/dojos/&#123;dojoId&#125;/*</span>)
          </h2>
        </div>

        {/* Segmented filter controls with real click handlers */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-black rounded border border-[#222222]">
          <button
            onClick={() => setActiveTab('model')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'model'
                ? 'bg-[#B50000] text-white font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Modelo de Dados
          </button>
          <button
            onClick={() => setActiveTab('subcollections')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'subcollections'
                ? 'bg-[#B50000] text-white font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Subcoleções Firestore
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-[#B50000] text-white font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Custom Claims & RBAC
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'modules'
                ? 'bg-[#B50000] text-white font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Módulos Planejados
          </button>
        </div>
      </div>

      {activeTab === 'model' && (
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">
            Cada dojo opera em um espaço isolado. Toda coleção ou tabela administrativa conterá
            a chave obrigatória <code className="text-[#B50000] bg-black px-1.5 py-0.5 rounded font-mono text-xs">dojoId</code>,
            garantindo que alunos e professores acessem estritamente os dados do seu próprio dojô.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-black/60 border border-[#222222] rounded p-4">
              <div className="flex items-center gap-2 text-white text-xs font-semibold mb-2">
                <Building2 className="w-4 h-4 text-[#B50000]" />
                <span>Entidade: Dojo</span>
              </div>
              <ul className="text-xs font-mono text-zinc-400 space-y-1">
                <li><span className="text-zinc-500">id:</span> string (Primary Key)</li>
                <li><span className="text-zinc-500">name:</span> string</li>
                <li><span className="text-zinc-500">slug:</span> string</li>
                <li><span className="text-zinc-500">headmasterName:</span> string</li>
                <li><span className="text-zinc-500">isActive:</span> boolean</li>
              </ul>
            </div>

            <div className="bg-black/60 border border-[#222222] rounded p-4">
              <div className="flex items-center gap-2 text-white text-xs font-semibold mb-2">
                <Shield className="w-4 h-4 text-[#B50000]" />
                <span>Entidade: DojoUser</span>
              </div>
              <ul className="text-xs font-mono text-zinc-400 space-y-1">
                <li><span className="text-zinc-500">id:</span> string (Auth UID)</li>
                <li className="text-[#B50000] font-semibold"><span className="text-zinc-500">dojoId:</span> string (Tenant FK)</li>
                <li><span className="text-zinc-500">email:</span> string</li>
                <li><span className="text-zinc-500">role:</span> 'admin' | 'student'</li>
              </ul>
            </div>

            <div className="bg-black/60 border border-[#222222] rounded p-4">
              <div className="flex items-center gap-2 text-white text-xs font-semibold mb-2">
                <KeyRound className="w-4 h-4 text-[#B50000]" />
                <span>Entidade: StudentProfile</span>
              </div>
              <ul className="text-xs font-mono text-zinc-400 space-y-1">
                <li><span className="text-zinc-500">id:</span> string</li>
                <li className="text-[#B50000] font-semibold"><span className="text-zinc-500">dojoId:</span> string (Tenant FK)</li>
                <li><span className="text-zinc-500">currentBelt:</span> KarateBelt</li>
                <li><span className="text-zinc-500">status:</span> 'active' | ...</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subcollections' && (
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">
            Topologia de subcoleções aninhadas sob <code className="text-[#B50000] font-mono bg-black px-1.5 py-0.5 rounded">/dojos/&#123;dojoId&#125;</code>.
            As regras de segurança validam que <code className="text-white font-mono text-xs">request.auth.token.dojoId == dojoId</code> em tempo real via Custom Claims.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-black/60 border border-[#222222] p-3.5 rounded">
              <span className="text-[#B50000] font-bold block mb-1">/dojos/&#123;dojoId&#125;/students</span>
              <p className="text-zinc-400 font-sans text-xs">Perfis marciais e dados cadastrais. Alunos leem apenas seu próprio registro; Senseis leem e editam todos.</p>
            </div>

            <div className="bg-black/60 border border-[#222222] p-3.5 rounded">
              <span className="text-[#B50000] font-bold block mb-1">/dojos/&#123;dojoId&#125;/classes</span>
              <p className="text-zinc-400 font-sans text-xs">Turmas, horários e faixas etárias. Alunos consultam treinos; Senseis gerenciam horários e vagas.</p>
            </div>

            <div className="bg-black/60 border border-[#222222] p-3.5 rounded">
              <span className="text-[#B50000] font-bold block mb-1">/dojos/&#123;dojoId&#125;/tuitions</span>
              <p className="text-zinc-400 font-sans text-xs">Mensalidades e pagamentos. Alunos apenas leem suas faturas; Senseis controlam baixas e valores.</p>
            </div>

            <div className="bg-black/60 border border-[#222222] p-3.5 rounded">
              <span className="text-[#B50000] font-bold block mb-1">/dojos/&#123;dojoId&#125;/attendance</span>
              <p className="text-zinc-400 font-sans text-xs">Frequência em treinos. Registros de presença imutáveis para alunos; lançamento exclusivo do Sensei.</p>
            </div>

            <div className="bg-black/60 border border-[#222222] p-3.5 rounded">
              <span className="text-[#B50000] font-bold block mb-1">/dojos/&#123;dojoId&#125;/graduations</span>
              <p className="text-zinc-400 font-sans text-xs">Histórico de graduações e exames de faixa outorgados pelo Sensei responsável.</p>
            </div>

            <div className="bg-black/60 border border-[#222222] p-3.5 rounded">
              <span className="text-[#B50000] font-bold block mb-1">/users/&#123;uid&#125; (Coleção Rasa)</span>
              <p className="text-zinc-400 font-sans text-xs">Mapeamento rápido de autenticação. Vincula o Auth UID ao dojoId e papel correspondente.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/60 border border-[#222222] rounded p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Papel: Sensei / Administrador</h4>
              <span className="text-[11px] font-mono text-[#B50000] bg-[#B50000]/10 px-2 py-0.5 rounded border border-[#B50000]/30">
                role: 'admin'
              </span>
            </div>
            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
              Gestão integral do dojo. Capacidade de gerenciar matrículas, turmas, frequências,
              exames de faixa (graduações), relatórios e finanças dentro do seu <code className="text-zinc-300">dojoId</code>.
            </p>
            <div className="text-xs text-zinc-500 font-mono">
              Destino no roteamento: <span className="text-zinc-300">/admin/*</span>
            </div>
          </div>

          <div className="bg-black/60 border border-[#222222] rounded p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Papel: Aluno</h4>
              <span className="text-[11px] font-mono text-zinc-300 bg-zinc-800/40 px-2 py-0.5 rounded border border-zinc-700">
                role: 'student'
              </span>
            </div>
            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
              Acesso ao portal individual. Consulta do histórico de graduações, faixas obtidas,
              frequência nos treinos e avisos do dojo.
            </p>
            <div className="text-xs text-zinc-500 font-mono">
              Destino no roteamento: <span className="text-zinc-300">/student/*</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'modules' && (
        <div>
          <p className="text-xs text-zinc-400 mb-4">
            Mapeamento dos 11 módulos fundamentais estabelecidos na especificação, estruturados
            para desenvolvimento incremental sem introduzir falsas integrações antes da Fase 2.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {BRAND_CONFIG.modules.map((mod) => (
              <div
                key={mod.id}
                className="bg-black/50 border border-[#222222] rounded p-3 text-xs flex flex-col justify-between"
              >
                <span className="text-white font-medium mb-1">{mod.name}</span>
                <span className="text-[10px] text-zinc-500 font-mono">Pronto p/ Firebase</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
