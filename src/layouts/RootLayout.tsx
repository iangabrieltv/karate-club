import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header.tsx';
import { Footer } from '../components/Footer.tsx';
import { HealthService } from '../services/healthService.ts';
import { SystemHealthResponse } from '../types/api.ts';

export const RootLayout: React.FC = () => {
  const [healthData, setHealthData] = useState<SystemHealthResponse | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const runHealthCheck = async () => {
    setIsCheckingHealth(true);
    setHealthError(null);
    try {
      const data = await HealthService.checkHealth();
      setHealthData(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha na conexão com o servidor backend';
      setHealthError(message);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-[#B50000] selection:text-white">
      <Header
        onTriggerHealthCheck={runHealthCheck}
        isCheckingHealth={isCheckingHealth}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        <Outlet context={{ healthData, isCheckingHealth, healthError, runHealthCheck }} />
      </main>

      <Footer />
    </div>
  );
};
