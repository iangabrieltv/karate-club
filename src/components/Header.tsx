import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APP_ROUTES } from '../config/routes.ts';
import { ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onTriggerHealthCheck?: () => void;
  isCheckingHealth?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onTriggerHealthCheck, isCheckingHealth }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === APP_ROUTES.HOME) {
      return location.pathname === APP_ROUTES.HOME;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="border-b border-[#222222] bg-black/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single element brand wordmark */}
        <Link
          to={APP_ROUTES.HOME}
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          <span className="w-8 h-8 rounded bg-[#B50000] flex items-center justify-center text-white font-extrabold text-sm tracking-wider shadow-sm">
            KC
          </span>
          <span className="text-white font-extrabold tracking-wide">
            KARATE <span className="text-[#B50000]">CLUB</span>
          </span>
        </Link>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
          <Link
            to={APP_ROUTES.HOME}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              isActive(APP_ROUTES.HOME) && location.pathname === APP_ROUTES.HOME
                ? 'text-white font-semibold'
                : 'hover:text-white'
            }`}
          >
            Visão Geral
          </Link>
          <Link
            to={APP_ROUTES.ARCHITECTURE}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              isActive(APP_ROUTES.ARCHITECTURE)
                ? 'text-white font-semibold'
                : 'hover:text-white'
            }`}
          >
            Arquitetura & Multi-Tenant
          </Link>
          <Link
            to={APP_ROUTES.ADMIN.ROOT}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              isActive(APP_ROUTES.ADMIN.ROOT)
                ? 'text-white font-semibold'
                : 'hover:text-white'
            }`}
          >
            Painel do Professor
          </Link>
          <Link
            to={APP_ROUTES.STUDENT.ROOT}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              isActive(APP_ROUTES.STUDENT.ROOT)
                ? 'text-white font-semibold'
                : 'hover:text-white'
            }`}
          >
            Portal do Aluno
          </Link>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {onTriggerHealthCheck && (
            <button
              onClick={onTriggerHealthCheck}
              disabled={isCheckingHealth}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#B50000] hover:bg-[#990000] active:scale-95 transition-all rounded whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isCheckingHealth ? 'Verificando...' : 'Diagnosticar API'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
