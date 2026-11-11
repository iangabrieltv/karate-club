/**
 * Karate Club - Arquitetura Multi-Tenant & Modelagem Consolidada do Firestore (Fase 3 Final)
 * Modelagem refinada contemplando competições com Kata/Kumite individual e em equipe,
 * consultas via array-contains sem duplicação, ID determinístico anti-duplicidade em mensalidades,
 * e separação estrita de papéis administrativos e de plataforma.
 */

export type UserRole = 'admin' | 'student' | 'platform_superadmin';

export interface AuthClaims {
  dojoId: string;
  role: UserRole;
  studentId?: string; // Presente quando role === 'student'
}

export interface Dojo {
  id: string; // Document ID em /dojos/{dojoId}
  name: string;
  slug: string;
  headmasterName: string; // Sensei responsável
  federation?: string; // ex: CBK / WKF / JKA
  style?: string; // ex: Shotokan, Goju-Ryu, Shito-Ryu, Wado-Ryu
  city: string;
  state: string;
  country: string;
  createdAt: string;
  isActive: boolean;
  settings?: {
    defaultCurrency?: string;
    beltGraduationSystem?: string;
  };
}

export interface DojoUser {
  uid: string; // Firebase Auth UID (Document ID em /users/{uid})
  dojoId: string; // Vínculo multi-tenant obrigatório
  email: string;
  name: string;
  role: UserRole;
  studentId?: string; // Presente quando role === 'student'
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

export type KarateBelt =
  | 'branca'
  | 'amarela'
  | 'vermelha'
  | 'laranja'
  | 'verde'
  | 'roxa'
  | 'marrom'
  | 'preta_1dan'
  | 'preta_2dan'
  | 'preta_3dan'
  | 'preta_superior';

export interface StudentGuardian {
  fullName: string;
  phone: string;
  relationship: string; // ex: 'Mãe', 'Pai', 'Tutor Legal'
  email?: string;
}

export interface StudentProfile {
  id: string; // Document ID em /dojos/{dojoId}/students/{studentId}
  userId: string; // Firebase Auth UID
  dojoId: string;
  fullName: string;
  photoUrl?: string; // Foto opcional (avatar com iniciais quando ausente)
  birthDate: string; // YYYY-MM-DD
  phone: string;
  isMinor: boolean;
  guardian?: StudentGuardian; // Presente quando isMinor === true
  assignedClassIds: string[]; // Uma ou mais turmas
  currentBelt: KarateBelt;
  currentKyuOrDan: string; // ex: '4º Kyu', '1º Dan'
  enrolledAt: string; // ISO string
  billingDay: number; // Dia individual de vencimento (1 a 31)
  tuitionAmountCents: number; // Mensalidade individual em centavos
  individualDiscountCents: number; // Desconto individual em centavos
  currentWeightKg?: number; // Peso atual em kg para categorias de luta
  status: 'active' | 'inactive' | 'suspended';
  registrationNumber: string; // Código de matrícula marcial
  updatedAt?: string;
}

export interface ClassScheduleItem {
  dayOfWeek: number; // 0=Domingo, 1=Segunda, ..., 6=Sábado
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface ClassSession {
  id: string; // Document ID em /dojos/{dojoId}/classes/{classId}
  dojoId: string;
  name: string;
  category: 'kids' | 'teens' | 'adults' | 'all';
  schedule: ClassScheduleItem[];
  instructorName: string;
  defaultMonthlyTuitionCents?: number;
  maxCapacity: number;
  activeStudentCount?: number;
}

export interface BeltGraduation {
  id: string; // Document ID em /dojos/{dojoId}/graduations/{graduationId}
  dojoId: string;
  studentId: string; // Vínculo estrito para que o aluno consulte apenas seu próprio histórico
  belt: KarateBelt;
  kyuOrDan: string;
  examinationDate: string; // YYYY-MM-DD
  examinerSensei: string;
  evaluationNotes?: string;
  certificateNumber?: string;
  createdAt: string;
}

export interface TuitionPaymentDetails {
  paidAt?: string;
  paidAmountCents?: number;
  paymentMethod?: 'pix' | 'credit_card' | 'cash' | 'bank_transfer';
  receiptNumber?: string;
  receivedBySenseiUid?: string;
  notes?: string;
}

export interface TuitionRecord {
  id: string; // ID DETERMINÍSTICO ANTI-DUPLICIDADE: tui_{studentId}_{referenceMonth}
  dojoId: string;
  studentId: string;
  studentName: string; // Snapshot histórico do nome
  referenceMonth: string; // Mês de competência (YYYY-MM, ex: '2026-11')
  dueDate: string; // YYYY-MM-DD (gerado com base no billingDay individual)
  baseAmountCents: number; // Snapshot histórico da mensalidade base
  discountCents: number; // Snapshot histórico do desconto individual
  netAmountCents: number; // baseAmountCents - discountCents
  status: 'pending' | 'paid' | 'overdue' | 'waived';
  payment?: TuitionPaymentDetails;
  historicalSnapshot?: {
    classNames?: string[];
    currentBelt?: KarateBelt;
  };
  generatedBySenseiUid: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string; // Document ID em /dojos/{dojoId}/attendance/{attendanceId}
  dojoId: string;
  classId: string;
  studentId: string; // Vínculo estrito com o aluno
  date: string; // YYYY-MM-DD
  present: boolean;
  registeredByUserId: string;
  notes?: string;
}

// =============================================================================
// Modelagem Completa de Competições & Resultados (Individual e Equipe)
// =============================================================================

export type CompetitionModality =
  | 'kata_individual'
  | 'kumite_individual'
  | 'kata_team'
  | 'kumite_team';

export interface CompetitionCategory {
  id: string; // ex: 'cat_kumite_sub14_masc_45'
  name: string; // ex: 'Kumite Individual Sub-14 Masculino -45kg'
  modality: CompetitionModality;
  minAge?: number;
  maxAge?: number;
  minWeightKg?: number;
  maxWeightKg?: number;
  allowedBelts?: KarateBelt[];
}

export interface CompetitionTeam {
  id: string; // Document ID em /dojos/{dojoId}/competitions/{competitionId}/teams/{teamId}
  dojoId: string;
  competitionId: string;
  categoryId: string;
  teamName: string; // ex: 'Equipe Kata Infantil Morumbi A'
  memberStudentIds: string[]; // Lista de studentIds dos atletas da equipe
}

export interface CompetitionRecord {
  id: string; // Document ID em /dojos/{dojoId}/competitions/{competitionId}
  dojoId: string;
  name: string;
  federation?: string;
  date: string; // YYYY-MM-DD
  location: string;
  categories: CompetitionCategory[]; // Categorias cadastradas manualmente pelo Sensei
  participatingStudentIds: string[]; // Atletas inscritos no torneio
  createdAt: string;
}

export interface CompetitionResult {
  id: string; // Document ID em /dojos/{dojoId}/competitions/{competitionId}/results/{resultId}
  dojoId: string;
  competitionId: string;
  competitionName: string; // Snapshot do nome da competição
  categoryId: string;
  categoryName: string; // Snapshot do nome da categoria
  modality: CompetitionModality;
  isTeamResult: boolean;
  teamId?: string;
  teamName?: string;
  // studentIds contém o atleta individual OU todos os atletas da equipe!
  // Permite que o perfil do aluno consulte via .where('studentIds', 'array-contains', studentId)
  // sem precisar duplicar o registro de resultado em múltiplos lugares!
  studentIds: string[];
  placement: 'gold' | 'silver' | 'bronze' | 'participant' | 'none';
  notes?: string;
  registeredAt: string;
}

export interface DojoEvent {
  id: string; // Document ID em /dojos/{dojoId}/events/{eventId}
  dojoId: string;
  title: string;
  type: 'seminar' | 'gasshuku' | 'belt_exam' | 'holiday' | 'special_training';
  startDate: string;
  endDate?: string;
  location?: string;
  description?: string;
  isPublicForStudents: boolean;
}

export interface StudentAuthCredential {
  usernameNormalized: string; // Document ID em /dojos/{dojoId}/auth_credentials/{usernameNormalized}
  dojoId: string;
  studentId: string; // ID interno imutável
  userId: string; // Firebase Auth UID: "stu_" + dojoId + "_" + studentId
  passwordHash: string; // Formato padrão Argon2id ($argon2id$v=19$m=65536,t=3,p=4$...)
  algorithm: 'argon2id';
  mustChangePassword: boolean;
  failedAttempts: number;
  lockedUntil: string | null; // ISO string de bloqueio ou null
  lastFailedAt: string | null;
  passwordUpdatedAt: string; // ISO string do momento em que a senha foi alterada
  minTokenIssuedAt: number; // Unix timestamp em segundos para revogação instantânea de sessões
  createdAt: string;
}

export interface SystemBootstrapLock {
  id: 'bootstrap_lock';
  completed: boolean;
  completedAt: string;
  adminUid: string;
  dojoId: string;
  serverInstanceId: string;
}

/**
 * Utilitários tipados de caminhos canônicos no Firestore
 */
export const FIRESTORE_PATHS = {
  user: (uid: string) => `/users/${uid}` as const,
  dojo: (dojoId: string) => `/dojos/${dojoId}` as const,
  authCredentials: (dojoId: string) => `/dojos/${dojoId}/auth_credentials` as const,
  authCredentialDoc: (dojoId: string, usernameNormalized: string) =>
    `/dojos/${dojoId}/auth_credentials/${usernameNormalized}` as const,
  students: (dojoId: string) => `/dojos/${dojoId}/students` as const,
  student: (dojoId: string, studentId: string) => `/dojos/${dojoId}/students/${studentId}` as const,
  classes: (dojoId: string) => `/dojos/${dojoId}/classes` as const,
  classDoc: (dojoId: string, classId: string) => `/dojos/${dojoId}/classes/${classId}` as const,
  attendance: (dojoId: string) => `/dojos/${dojoId}/attendance` as const,
  graduations: (dojoId: string) => `/dojos/${dojoId}/graduations` as const,
  tuitions: (dojoId: string) => `/dojos/${dojoId}/tuitions` as const,
  tuitionDeterministicId: (studentId: string, referenceMonth: string) =>
    `tui_${studentId}_${referenceMonth}` as const,
  competitions: (dojoId: string) => `/dojos/${dojoId}/competitions` as const,
  competitionDoc: (dojoId: string, competitionId: string) =>
    `/dojos/${dojoId}/competitions/${competitionId}` as const,
  competitionResults: (dojoId: string, competitionId: string) =>
    `/dojos/${dojoId}/competitions/${competitionId}/results` as const,
  events: (dojoId: string) => `/dojos/${dojoId}/events` as const,
  systemBootstrapLock: () => `/system/bootstrap_lock` as const,
};

