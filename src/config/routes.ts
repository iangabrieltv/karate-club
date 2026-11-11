/**
 * Dicionário centralizado e tipado de rotas da aplicação Karate Club
 */

export const APP_ROUTES = {
  HOME: '/',
  ARCHITECTURE: '/architecture',
  ADMIN: {
    ROOT: '/admin',
    DOJO_SETTINGS: '/admin/dojo',
    STUDENTS: '/admin/students',
    CLASSES: '/admin/classes',
    ATTENDANCE: '/admin/attendance',
    FINANCIAL: '/admin/financial',
    GRADUATIONS: '/admin/graduations',
  },
  STUDENT: {
    ROOT: '/student',
    PROFILE: '/student/profile',
    GRADUATIONS: '/student/graduations',
    ATTENDANCE: '/student/attendance',
  },
} as const;
