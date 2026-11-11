import React from 'react';

interface StatusCardProps {
  title: string;
  category: string;
  description: string;
  status: 'ready' | 'pending' | 'verified';
  details?: string;
  metric?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  category,
  description,
  status,
  details,
  metric,
}) => {
  const statusLabels = {
    ready: 'Pronto para Integração',
    verified: 'Operacional & Verificado',
    pending: 'Aguardando Fase 2',
  };

  const statusColors = {
    verified: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20',
    ready: 'text-zinc-300 border-zinc-800 bg-zinc-900/40',
    pending: 'text-zinc-500 border-zinc-900 bg-zinc-950/40',
  };

  return (
    <div className="bg-[#121212] border border-[#222222] rounded-lg p-5 flex flex-col justify-between hover:border-zinc-700 transition-colors">
      <div>
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 mb-2">
          <span className="font-medium tracking-wider uppercase">{category}</span>
          {metric && <span className="font-mono tabular-nums text-zinc-400">{metric}</span>}
        </div>
        <h3 className="text-base font-semibold text-white tracking-tight mb-2">{title}</h3>
        <p className="text-xs text-zinc-400 leading-relaxed mb-4">{description}</p>
      </div>

      <div className="pt-3 border-t border-[#222222] flex items-center justify-between text-xs">
        <span className={`px-2 py-0.5 rounded border text-[11px] font-medium ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
        {details && <span className="font-mono text-[11px] text-zinc-500">{details}</span>}
      </div>
    </div>
  );
};
