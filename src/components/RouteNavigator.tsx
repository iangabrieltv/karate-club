import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APP_ROUTES } from '../config/routes.ts';
import { Compass, ExternalLink } from 'lucide-react';

export const RouteNavigator: React.FC = () => {
  const location = useLocation();

  const routes = [
    { path: APP_ROUTES.HOME, label: 'Visão Geral (Fase 1)', type: 'Fundação' },
    { path: APP_ROUTES.ARCHITECTURE, label: 'Arquitetura & Multi-Tenant', type: 'Técnico' },
    { path: APP_ROUTES.ADMIN.ROOT, label: 'Painel do Professor (/admin)', type: 'Scaffolding' },
    { path: APP_ROUTES.ADMIN.STUDENTS, label: 'Gestão de Alunos (/admin/students)', type: 'Scaffolding' },
    { path: APP_ROUTES.ADMIN.GRADUATIONS, label: 'Graduações (/admin/graduations)', type: 'Scaffolding' },
    { path: APP_ROUTES.STUDENT.ROOT, label: 'Portal do Aluno (/student)', type: 'Scaffolding' },
    { path: APP_ROUTES.STUDENT.GRADUATIONS, label: 'Faixas do Aluno (/student/graduations)', type: 'Scaffolding' },
  ];

  return (
    <div className="bg-[#121212] border border-[#222222] rounded-lg p-6">
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
        <Compass className="w-3.5 h-3.5 text-[#B50000]" />
        <span>Roteamento SPA Integrado</span>
        <span aria-hidden="true">·</span>
        <span>React Router DOM v7</span>
      </div>
      <h2 className="text-lg font-bold text-white tracking-tight mb-2">
        Navegador & Testador de Rotas
      </h2>
      <p className="text-xs text-zinc-400 mb-5">
        Verifique a resposta instantânea das rotas fundamentais registradas no sistema.
        A rota atual ativa é destacada abaixo.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {routes.map((r) => {
          const isCurrent = location.pathname === r.path;
          return (
            <Link
              key={r.path}
              to={r.path}
              className={`p-3 rounded border text-xs flex items-center justify-between transition-all ${
                isCurrent
                  ? 'bg-[#B50000]/15 border-[#B50000] text-white font-semibold shadow-sm'
                  : 'bg-black/40 border-[#222222] text-zinc-300 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <div>
                <div className="text-white font-medium mb-0.5">{r.label}</div>
                <div className="font-mono text-[10px] text-zinc-500">{r.path}</div>
              </div>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-[10px] text-zinc-500 uppercase">{r.type}</span>
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
