import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout.tsx';
import { FoundationOverview } from '../pages/FoundationOverview.tsx';
import { ArchitectureDetail } from '../pages/ArchitectureDetail.tsx';
import { AdminScaffolding } from '../pages/AdminScaffolding.tsx';
import { StudentScaffolding } from '../pages/StudentScaffolding.tsx';
import { NotFound } from '../pages/NotFound.tsx';
import { APP_ROUTES } from '../config/routes.ts';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<FoundationOverview />} />
          <Route path="architecture" element={<ArchitectureDetail />} />
          
          {/* Rotas Scaffolding do Painel do Professor */}
          <Route path="admin" element={<AdminScaffolding />} />
          <Route path="admin/:subRoute" element={<AdminScaffolding />} />
          
          {/* Rotas Scaffolding do Portal do Aluno */}
          <Route path="student" element={<StudentScaffolding />} />
          <Route path="student/:subRoute" element={<StudentScaffolding />} />

          {/* Rota 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
