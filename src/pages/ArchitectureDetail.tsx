import React from 'react';
import { MultiTenantInspector } from '../components/MultiTenantInspector.tsx';
import { Layers, Database, Shield, Lock, Cpu, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../config/routes.ts';

export const ArchitectureDetail: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
          <Link to={APP_ROUTES.HOME} className="hover:text-white transition-colors">
            Início
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-white font-medium">Arquitetura & Multi-Tenant</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Arquitetura Multi-Tenant & Diretrizes de Engenharia
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-3xl leading-relaxed">
          Detalhamento da fundação técnica concebida para suportar múltiplos dojos simultaneamente,
          com garantia de isolamento de dados e compatibilidade nativa com Firebase.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121212] border border-[#222222] rounded-lg p-5">
          <div className="flex items-center gap-2 text-[#B50000] mb-3">
            <Database className="w-4 h-4" />
            <h3 className="text-sm font-bold text-white">Chave de Partição: dojoId</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Nenhum dado é órfão no Karate Club. Toda leitura e gravação no futuro Firestore será
            filtrada e validada com regras de segurança atreladas ao <code className="text-[#B50000] font-mono">dojoId</code> do usuário logado.
          </p>
        </div>

        <div className="bg-[#121212] border border-[#222222] rounded-lg p-5">
          <div className="flex items-center gap-2 text-[#B50000] mb-3">
            <Lock className="w-4 h-4" />
            <h3 className="text-sm font-bold text-white">RBAC (Role-Based Access)</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Separação estrita entre os papéis <code className="text-zinc-300 font-mono">admin</code> (Senseis/professores gestores)
            e <code className="text-zinc-300 font-mono">student</code> (alunos). Nenhum aluno pode ler dados administrativos.
          </p>
        </div>

        <div className="bg-[#121212] border border-[#222222] rounded-lg p-5">
          <div className="flex items-center gap-2 text-[#B50000] mb-3">
            <Cpu className="w-4 h-4" />
            <h3 className="text-sm font-bold text-white">Full-Stack Node.js</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            O backend Node.js com Express encapsula rotas privadas de validação, integração com
            o ecossistema e operações administrativas sem expor credenciais sensíveis no navegador.
          </p>
        </div>
      </div>

      <MultiTenantInspector />

      <div className="bg-[#121212] border border-[#222222] rounded-lg p-6">
        <h2 className="text-base font-bold text-white tracking-tight mb-3">
          Regras de Segurança & Integridade Adotadas
        </h2>
        <ul className="space-y-2 text-xs text-zinc-400">
          <li className="flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Zero Segredos no Cliente:</strong> Nenhuma chave privada ou credencial administrativa é embutida no frontend.</span>
          </li>
          <li className="flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Zero Dados Falsos Mascarados:</strong> Não simulamos registros no LocalStorage nem criamos formulários fictícios de banco de dados.</span>
          </li>
          <li className="flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Tipagem Estrita com TypeScript:</strong> Todas as interfaces do domínio estão catalogadas em <code className="font-mono text-zinc-300">src/types/</code>.</span>
          </li>
          <li className="flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Layouts Finais via Google Stitch:</strong> A interface aguarda os layouts de alta fidelidade do Google Stitch para evitar retrabalho visual.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
