import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APP_ROUTES } from '../config/routes.ts';
import { Shield, ArrowLeft, Layers, CheckCircle2 } from 'lucide-react';

export const AdminScaffolding: React.FC = () => {
  const location = useLocation();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link to={APP_ROUTES.HOME} className="hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" />
          <span>Voltar para Visão Geral</span>
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-white font-medium">Ambiente do Professor</span>
      </div>

      <div className="bg-[#121212] border border-[#222222] rounded-lg p-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-mono text-[#B50000] mb-2">
            <Shield className="w-4 h-4" />
            <span>ROTA RESERVADA: {location.pathname}</span>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight mb-3">
            Painel Administrativo do Professor (Sensei)
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">
            Esta rota está estruturada e mapeada no <strong className="text-white">React Router DOM</strong>.
            Em estrita conformidade com as restrições da Fase 1, não introduzimos dados simulados ou
            telas definitivas antes do alinhamento dos layouts do Google Stitch e da integração do Firebase Authentication.
          </p>

          <div className="border border-[#222222] bg-black/60 rounded p-4 mb-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Planejamento para as Próximas Etapas:
            </h3>
            <ul className="text-xs text-zinc-400 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fluxo de autenticação segura para Senseis com papel <code className="text-zinc-300">admin</code>.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gestão completa de alunos vinculados ao <code className="text-[#B50000]">dojoId</code> do professor.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Turmas, chamada de presença, exames de faixas e financeiro do dojo.</span>
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={APP_ROUTES.HOME}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#B50000] hover:bg-[#990000] rounded transition-colors inline-block"
            >
              Voltar ao Painel da Fase 1
            </Link>
            <Link
              to={APP_ROUTES.STUDENT.ROOT}
              className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-black border border-[#222222] rounded transition-colors inline-block"
            >
              Testar Rota do Aluno
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
