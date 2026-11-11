import React from 'react';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../config/routes.ts';
import { ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="bg-[#121212] border border-[#222222] rounded-lg p-12 text-center max-w-xl mx-auto my-12">
      <span className="text-4xl font-extrabold text-[#B50000] font-mono block mb-2">404</span>
      <h1 className="text-xl font-bold text-white mb-2">Página não encontrada</h1>
      <p className="text-xs text-zinc-400 mb-6">
        A rota solicitada não existe ou ainda não foi mapeada na estrutura da Fase 1.
      </p>
      <Link
        to={APP_ROUTES.HOME}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#B50000] hover:bg-[#990000] rounded transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Retornar à Visão Geral</span>
      </Link>
    </div>
  );
};
