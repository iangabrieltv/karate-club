/**
 * Identidade visual e constantes de marca do Karate Club
 * Paleta oficial:
 * - Vermelho principal: #B50000
 * - Preto: #000000
 * - Branco: #FFFFFF
 */

export const BRAND_CONFIG = {
  name: 'Karate Club',
  tagline: 'Sistema Profissional de Gestão para Dojos de Karatê',
  version: '1.0.0-phase1',
  phase: 'Fase 1: Fundação do Projeto',
  colors: {
    primaryRed: '#B50000',
    primaryRedHover: '#990000',
    primaryBlack: '#000000',
    primaryWhite: '#FFFFFF',
    surfaceDark: '#0A0A0A',
    cardDark: '#121212',
    borderDark: '#222222',
    textMuted: '#A1A1AA',
  },
  roles: {
    ADMIN: 'admin',
    STUDENT: 'student',
  } as const,
  modules: [
    { id: 'auth', name: 'Autenticação & Perfis', futureReady: true },
    { id: 'dojo', name: 'Configuração do Dojo', futureReady: true },
    { id: 'students', name: 'Gestão de Alunos', futureReady: true },
    { id: 'classes', name: 'Turmas & Horários', futureReady: true },
    { id: 'attendance', name: 'Controle de Frequência', futureReady: true },
    { id: 'financial', name: 'Módulo Financeiro', futureReady: true },
    { id: 'graduations', name: 'Graduações & Faixas', futureReady: true },
    { id: 'competitions', name: 'Competições & Eventos', futureReady: true },
    { id: 'calendar', name: 'Calendário de Treinos', futureReady: true },
    { id: 'reports', name: 'Relatórios & Métricas', futureReady: true },
    { id: 'student_portal', name: 'Portal do Aluno', futureReady: true },
  ],
};
