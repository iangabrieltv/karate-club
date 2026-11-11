import React from 'react';
import { BRAND_CONFIG } from '../config/brand.ts';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#222222] bg-[#0A0A0A] py-10 mt-auto text-xs text-zinc-500">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white tracking-wide">{BRAND_CONFIG.name}</span>
          <span aria-hidden="true">·</span>
          <span>{BRAND_CONFIG.phase}</span>
          <span aria-hidden="true">·</span>
          <span>Arquitetura Multi-Tenant isolada por dojoId</span>
        </div>

        <div className="flex items-center gap-4 text-zinc-500">
          <span>Pronto para Firebase & Google Stitch</span>
          <span aria-hidden="true">·</span>
          <span className="text-zinc-600">React + TypeScript + Node.js Express</span>
        </div>
      </div>
    </footer>
  );
};
