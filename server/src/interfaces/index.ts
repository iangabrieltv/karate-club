import {
  UserEntity,
  DojoEntity,
  StudentEntity,
  StudentAuthCredentialEntity,
  ClassEntity,
  TuitionEntity,
  AttendanceEntity,
  GraduationEntity,
  CompetitionEntity,
  CompetitionTeamEntity,
  CompetitionResultEntity,
  CalendarEventEntity,
} from '../domain/entities';

/**
 * Contratos de Repositório desacoplados de persistência
 */

export interface IUserRepository {
  findById(uid: string): Promise<UserEntity | null>;
  findByDojo(dojoId: string): Promise<UserEntity[]>;
  save(user: UserEntity): Promise<void>;
  updateSessionVersion(uid: string, nextVersion: number): Promise<void>;
}

export interface IDojoRepository {
  findById(id: string): Promise<DojoEntity | null>;
  findBySlug(slug: string): Promise<DojoEntity | null>;
  save(dojo: DojoEntity): Promise<void>;
}

export interface IStudentRepository {
  findById(dojoId: string, studentId: string): Promise<StudentEntity | null>;
  findByDojo(dojoId: string): Promise<StudentEntity[]>;
  findByUserId(dojoId: string, userId: string): Promise<StudentEntity | null>;
  save(student: StudentEntity): Promise<void>;
  updateStatus(dojoId: string, studentId: string, status: StudentEntity['status']): Promise<void>;
}

export interface IStudentAuthCredentialRepository {
  findByUsername(dojoId: string, usernameNormalized: string): Promise<StudentAuthCredentialEntity | null>;
  save(credential: StudentAuthCredentialEntity): Promise<void>;
  incrementFailedAttempts(dojoId: string, usernameNormalized: string, lockedUntil: string | null): Promise<void>;
  resetFailedAttempts(dojoId: string, usernameNormalized: string): Promise<void>;
  updatePasswordHash(dojoId: string, usernameNormalized: string, newHash: string, newSessionVersion: number): Promise<void>;
}

export interface IClassRepository {
  findById(dojoId: string, classId: string): Promise<ClassEntity | null>;
  findByDojo(dojoId: string): Promise<ClassEntity[]>;
  save(classEntity: ClassEntity): Promise<void>;
  delete(dojoId: string, classId: string): Promise<void>;
}

export interface ITuitionRepository {
  findById(dojoId: string, tuitionId: string): Promise<TuitionEntity | null>;
  findByStudent(dojoId: string, studentId: string): Promise<TuitionEntity[]>;
  findByMonth(dojoId: string, referenceMonth: string): Promise<TuitionEntity[]>;
  save(tuition: TuitionEntity): Promise<void>;
}

export interface IAttendanceRepository {
  findById(dojoId: string, attendanceId: string): Promise<AttendanceEntity | null>;
  findByClassAndDate(dojoId: string, classId: string, date: string): Promise<AttendanceEntity[]>;
  findByStudent(dojoId: string, studentId: string): Promise<AttendanceEntity[]>;
  save(attendance: AttendanceEntity): Promise<void>;
}

export interface IGraduationRepository {
  findById(dojoId: string, graduationId: string): Promise<GraduationEntity | null>;
  findByStudent(dojoId: string, studentId: string): Promise<GraduationEntity[]>;
  save(graduation: GraduationEntity): Promise<void>;
}

export interface ICompetitionRepository {
  findById(dojoId: string, competitionId: string): Promise<CompetitionEntity | null>;
  findByDojo(dojoId: string): Promise<CompetitionEntity[]>;
  save(competition: CompetitionEntity): Promise<void>;
  
  // Equipes
  findTeamsByCompetition(dojoId: string, competitionId: string): Promise<CompetitionTeamEntity[]>;
  saveTeam(team: CompetitionTeamEntity): Promise<void>;

  // Resultados
  findResultsByCompetition(dojoId: string, competitionId: string): Promise<CompetitionResultEntity[]>;
  findResultsByStudent(dojoId: string, competitionId: string, studentId: string): Promise<CompetitionResultEntity[]>;
  saveResult(result: CompetitionResultEntity): Promise<void>;
}

export interface ICalendarEventRepository {
  findById(dojoId: string, eventId: string): Promise<CalendarEventEntity | null>;
  findByDojo(dojoId: string, includePrivateForStudents?: boolean): Promise<CalendarEventEntity[]>;
  save(event: CalendarEventEntity): Promise<void>;
  delete(dojoId: string, eventId: string): Promise<void>;
}

/**
 * Contratos de Serviços de Domínio e Segurança
 */

export interface IPasswordHasher {
  hash(plainText: string): Promise<string>;
  verify(plainText: string, hash: string): Promise<boolean>;
}

export interface ITemporaryPasswordGenerator {
  generate(): { plainText: string; entropyBits: number; format: string };
}

export interface IBootstrapSecretValidator {
  validate(providedSecret: string | undefined): boolean;
}

export interface IRateLimiter {
  checkLimit(key: string, maxAttempts: number, windowMs: number): Promise<{ allowed: boolean; remainingAttempts: number; resetAt: Date }>;
}

export interface IAuthService {
  authenticateStudent(
    dojoIdentifier: string,
    username: string,
    passwordPlain: string
  ): Promise<{
    studentUid: string;
    studentId: string;
    dojoId: string;
    mustChangePassword: boolean;
    sessionVersion: number;
  }>;

  changeStudentPassword(
    studentUid: string,
    dojoId: string,
    newPasswordPlain: string
  ): Promise<{ success: boolean; nextSessionVersion: number }>;
}

export interface IStudentProvisioningService {
  provisionStudent(
    dojoId: string,
    senseiUid: string,
    payload: {
      fullName: string;
      birthDate: string;
      phone: string;
      isMinor: boolean;
      guardian?: StudentEntity['guardian'];
      assignedClassIds: string[];
      currentBelt: StudentEntity['currentBelt'];
      currentKyuOrDan: string;
      billingDay: number;
      tuitionAmountCents: number;
      individualDiscountCents: number;
      registrationNumber: string;
      username?: string;
    },
    idempotencyKey: string
  ): Promise<{
    studentId: string;
    studentUid: string;
    username: string;
    temporaryPassword: string;
  }>;
}
