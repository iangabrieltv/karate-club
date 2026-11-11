import {
  UserRole,
  StudentStatus,
  KarateBelt,
  TuitionStatus,
  PaymentMethod,
  CompetitionModality,
  CompetitionPlacement,
  CalendarEventType,
} from './enums';

/**
 * 7.1. User - Representa a identidade de acesso ao sistema
 */
export interface UserEntity {
  uid: string;
  dojoId: string;
  role: UserRole;
  name: string;
  isActive: boolean;
  createdAt: string;
  sessionVersion: number;
  studentId?: string;
  username?: string;
  email?: string;
}

/**
 * 7.2. Dojo - Representa uma academia / dojo
 */
export interface DojoEntity {
  id: string;
  name: string;
  slug: string;
  headmasterName: string;
  city: string;
  state: string;
  country: string;
  isActive: boolean;
  createdAt: string;
  federation?: string;
  style?: string;
}

/**
 * Responsável legal por aluno menor de idade
 */
export interface StudentGuardianVO {
  fullName: string;
  phone: string;
  relationship: string;
  email?: string;
}

/**
 * 7.3. Student - Perfil esportivo, pedagógico e cadastral do aluno
 */
export interface StudentEntity {
  id: string;
  userId: string;
  dojoId: string;
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  phone: string;
  isMinor: boolean;
  guardian?: StudentGuardianVO;
  assignedClassIds: string[];
  currentBelt: KarateBelt;
  currentKyuOrDan: string;
  enrolledAt: string;
  billingDay: number; // 1 - 31
  tuitionAmountCents: number; // Inteiro em centavos
  individualDiscountCents: number; // Inteiro em centavos
  currentWeightKg?: number;
  status: StudentStatus;
  registrationNumber: string;
  photoUrl?: string;
  updatedAt?: string;
}

/**
 * Item da grade de horários da turma
 */
export interface ClassScheduleItemVO {
  dayOfWeek: number; // 0=Domingo, 1=Segunda, ..., 6=Sábado
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

/**
 * 7.4. Class - Turma de karatê
 */
export interface ClassEntity {
  id: string;
  dojoId: string;
  name: string;
  category: 'kids' | 'teens' | 'adults' | 'all';
  schedule: ClassScheduleItemVO[];
  instructorName: string;
  defaultMonthlyTuitionCents?: number;
  maxCapacity: number;
  allowedBelts?: KarateBelt[];
  ageGroup?: string;
  isActive: boolean;
}

/**
 * Confirmação manual de pagamento
 */
export interface TuitionPaymentVO {
  paidAt: string;
  paidAmountCents: number;
  paymentMethod: PaymentMethod;
  receiptNumber?: string;
  receivedBySenseiUid: string;
  notes?: string;
}

/**
 * 7.5. Tuition - Mensalidade com valores em centavos e snapshot imutável
 */
export interface TuitionEntity {
  id: string; // Determinístico: tui_{studentId}_{referenceMonth}
  studentId: string;
  dojoId: string;
  studentName: string;
  referenceMonth: string; // YYYY-MM
  dueDate: string; // YYYY-MM-DD
  baseAmountCents: number; // Centavos
  discountCents: number; // Centavos
  netAmountCents: number; // Centavos
  status: TuitionStatus;
  payment?: TuitionPaymentVO;
  generatedBySenseiUid: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 7.6. Attendance - Registro de chamada e presença
 */
export interface AttendanceEntity {
  id: string;
  dojoId: string;
  classId: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  present: boolean;
  registeredByUserId: string;
  createdAt: string;
  notes?: string;
}

/**
 * 7.7. Graduation - Exame de faixa e graduação marcial
 */
export interface GraduationEntity {
  id: string;
  dojoId: string;
  studentId: string;
  belt: KarateBelt;
  kyuOrDan: string;
  examinationDate: string; // YYYY-MM-DD
  examinerSensei: string;
  evaluationNotes?: string;
  certificateNumber?: string;
  createdAt: string;
}

/**
 * Categoria de competição
 */
export interface CompetitionCategoryVO {
  id: string;
  name: string;
  modality: CompetitionModality;
  minAge?: number;
  maxAge?: number;
  minWeightKg?: number;
  maxWeightKg?: number;
  allowedBelts?: KarateBelt[];
}

/**
 * Equipe de competição
 */
export interface CompetitionTeamEntity {
  id: string;
  dojoId: string;
  competitionId: string;
  categoryId: string;
  teamName: string;
  memberStudentIds: string[];
}

/**
 * Resultado de competição (Individual ou Equipe)
 */
export interface CompetitionResultEntity {
  id: string;
  dojoId: string;
  competitionId: string;
  categoryId: string;
  modality: CompetitionModality;
  isTeamResult: boolean;
  teamId?: string;
  studentIds: string[];
  placement: CompetitionPlacement;
  notes?: string;
  registeredAt: string;
}

/**
 * 7.8. Competition - Registro de campeonato ou torneio
 */
export interface CompetitionEntity {
  id: string;
  dojoId: string;
  name: string;
  organizer?: string;
  location: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  description?: string;
  categories: CompetitionCategoryVO[];
  participatingStudentIds: string[];
  status: 'upcoming' | 'ongoing' | 'finished' | 'cancelled';
  createdAt: string;
}

/**
 * 7.9. CalendarEvent - Evento institucional do calendário
 */
export interface CalendarEventEntity {
  id: string;
  dojoId: string;
  title: string;
  type: CalendarEventType;
  startDate: string; // ISO ou YYYY-MM-DD
  endDate?: string;
  description?: string;
  location?: string;
  targetClassIds?: string[];
  isPublicForStudents: boolean;
}

/**
 * Credencial Privada de Aluno (Subcoleção auth_credentials)
 */
export interface StudentAuthCredentialEntity {
  usernameNormalized: string;
  dojoId: string;
  studentId: string;
  userId: string;
  passwordHash: string; // PHC Argon2id
  algorithm: 'argon2id';
  mustChangePassword: boolean;
  failedAttempts: number;
  lockedUntil: string | null;
  lastFailedAt: string | null;
  passwordUpdatedAt: string;
  sessionVersion: number;
  createdAt: string;
}
