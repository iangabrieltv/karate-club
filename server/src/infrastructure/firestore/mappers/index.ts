import { Timestamp, FieldValue, DocumentData } from 'firebase-admin/firestore';
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
} from '../../../domain/entities';

/**
 * Utilitário seguro para conversão de Timestamps do Firestore para ISO Strings
 */
export function timestampToIso(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

/**
 * Mappers Bidirecionais: Firestore Document Data <-> Domain Entities
 */

export const UserMapper = {
  toDomain(data: DocumentData): UserEntity {
    return {
      uid: data.uid,
      dojoId: data.dojoId,
      role: data.role,
      name: data.name,
      isActive: Boolean(data.isActive),
      createdAt: timestampToIso(data.createdAt),
      sessionVersion: Number(data.sessionVersion ?? 1),
      studentId: data.studentId,
      username: data.username,
      email: data.email,
    };
  },
  toFirestore(entity: UserEntity): DocumentData {
    return {
      uid: entity.uid,
      dojoId: entity.dojoId,
      role: entity.role,
      name: entity.name,
      isActive: entity.isActive,
      createdAt: Timestamp.fromDate(new Date(entity.createdAt)),
      sessionVersion: entity.sessionVersion,
      studentId: entity.studentId ?? null,
      username: entity.username ?? null,
      email: entity.email ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    };
  },
};

export const DojoMapper = {
  toDomain(data: DocumentData): DojoEntity {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      headmasterName: data.headmasterName,
      city: data.city,
      state: data.state,
      country: data.country,
      isActive: Boolean(data.isActive),
      createdAt: timestampToIso(data.createdAt),
      federation: data.federation,
      style: data.style,
    };
  },
  toFirestore(entity: DojoEntity): DocumentData {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      headmasterName: entity.headmasterName,
      city: entity.city,
      state: entity.state,
      country: entity.country,
      isActive: entity.isActive,
      createdAt: Timestamp.fromDate(new Date(entity.createdAt)),
      federation: entity.federation ?? null,
      style: entity.style ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    };
  },
};

export const StudentMapper = {
  toDomain(data: DocumentData): StudentEntity {
    return {
      id: data.id,
      userId: data.userId,
      dojoId: data.dojoId,
      fullName: data.fullName,
      birthDate: data.birthDate,
      phone: data.phone,
      isMinor: Boolean(data.isMinor),
      guardian: data.guardian,
      assignedClassIds: Array.isArray(data.assignedClassIds) ? data.assignedClassIds : [],
      currentBelt: data.currentBelt,
      currentKyuOrDan: data.currentKyuOrDan,
      enrolledAt: timestampToIso(data.enrolledAt),
      billingDay: Number(data.billingDay),
      tuitionAmountCents: Number(data.tuitionAmountCents),
      individualDiscountCents: Number(data.individualDiscountCents ?? 0),
      currentWeightKg: data.currentWeightKg != null ? Number(data.currentWeightKg) : undefined,
      status: data.status,
      registrationNumber: data.registrationNumber,
      photoUrl: data.photoUrl,
      updatedAt: data.updatedAt ? timestampToIso(data.updatedAt) : undefined,
    };
  },
  toFirestore(entity: StudentEntity): DocumentData {
    return {
      id: entity.id,
      userId: entity.userId,
      dojoId: entity.dojoId,
      fullName: entity.fullName,
      birthDate: entity.birthDate,
      phone: entity.phone,
      isMinor: entity.isMinor,
      guardian: entity.guardian ?? null,
      assignedClassIds: entity.assignedClassIds,
      currentBelt: entity.currentBelt,
      currentKyuOrDan: entity.currentKyuOrDan,
      enrolledAt: Timestamp.fromDate(new Date(entity.enrolledAt)),
      billingDay: entity.billingDay,
      tuitionAmountCents: entity.tuitionAmountCents,
      individualDiscountCents: entity.individualDiscountCents,
      currentWeightKg: entity.currentWeightKg ?? null,
      status: entity.status,
      registrationNumber: entity.registrationNumber,
      photoUrl: entity.photoUrl ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    };
  },
};

export const AuthCredentialMapper = {
  toDomain(data: DocumentData): StudentAuthCredentialEntity {
    return {
      usernameNormalized: data.usernameNormalized,
      dojoId: data.dojoId,
      studentId: data.studentId,
      userId: data.userId,
      passwordHash: data.passwordHash,
      algorithm: 'argon2id',
      mustChangePassword: Boolean(data.mustChangePassword),
      failedAttempts: Number(data.failedAttempts ?? 0),
      lockedUntil: data.lockedUntil ? timestampToIso(data.lockedUntil) : null,
      lastFailedAt: data.lastFailedAt ? timestampToIso(data.lastFailedAt) : null,
      passwordUpdatedAt: timestampToIso(data.passwordUpdatedAt),
      sessionVersion: Number(data.sessionVersion ?? 1),
      createdAt: timestampToIso(data.createdAt),
    };
  },
  toFirestore(entity: StudentAuthCredentialEntity): DocumentData {
    return {
      usernameNormalized: entity.usernameNormalized,
      dojoId: entity.dojoId,
      studentId: entity.studentId,
      userId: entity.userId,
      passwordHash: entity.passwordHash,
      algorithm: entity.algorithm,
      mustChangePassword: entity.mustChangePassword,
      failedAttempts: entity.failedAttempts,
      lockedUntil: entity.lockedUntil ? Timestamp.fromDate(new Date(entity.lockedUntil)) : null,
      lastFailedAt: entity.lastFailedAt ? Timestamp.fromDate(new Date(entity.lastFailedAt)) : null,
      passwordUpdatedAt: Timestamp.fromDate(new Date(entity.passwordUpdatedAt)),
      sessionVersion: entity.sessionVersion,
      createdAt: Timestamp.fromDate(new Date(entity.createdAt)),
      updatedAt: FieldValue.serverTimestamp(),
    };
  },
};

export const ClassMapper = {
  toDomain(data: DocumentData): ClassEntity {
    return {
      id: data.id,
      dojoId: data.dojoId,
      name: data.name,
      category: data.category,
      schedule: Array.isArray(data.schedule) ? data.schedule : [],
      instructorName: data.instructorName,
      defaultMonthlyTuitionCents: data.defaultMonthlyTuitionCents != null ? Number(data.defaultMonthlyTuitionCents) : undefined,
      maxCapacity: Number(data.maxCapacity ?? 30),
      allowedBelts: data.allowedBelts,
      ageGroup: data.ageGroup,
      isActive: Boolean(data.isActive ?? true),
    };
  },
  toFirestore(entity: ClassEntity): DocumentData {
    return {
      id: entity.id,
      dojoId: entity.dojoId,
      name: entity.name,
      category: entity.category,
      schedule: entity.schedule,
      instructorName: entity.instructorName,
      defaultMonthlyTuitionCents: entity.defaultMonthlyTuitionCents ?? null,
      maxCapacity: entity.maxCapacity,
      allowedBelts: entity.allowedBelts ?? null,
      ageGroup: entity.ageGroup ?? null,
      isActive: entity.isActive,
      updatedAt: FieldValue.serverTimestamp(),
    };
  },
};

export const TuitionMapper = {
  toDomain(data: DocumentData): TuitionEntity {
    return {
      id: data.id,
      studentId: data.studentId,
      dojoId: data.dojoId,
      studentName: data.studentName,
      referenceMonth: data.referenceMonth,
      dueDate: data.dueDate,
      baseAmountCents: Number(data.baseAmountCents),
      discountCents: Number(data.discountCents ?? 0),
      netAmountCents: Number(data.netAmountCents),
      status: data.status,
      payment: data.payment,
      generatedBySenseiUid: data.generatedBySenseiUid,
      createdAt: timestampToIso(data.createdAt),
      updatedAt: data.updatedAt ? timestampToIso(data.updatedAt) : undefined,
    };
  },
  toFirestore(entity: TuitionEntity): DocumentData {
    return {
      id: entity.id,
      studentId: entity.studentId,
      dojoId: entity.dojoId,
      studentName: entity.studentName,
      referenceMonth: entity.referenceMonth,
      dueDate: entity.dueDate,
      baseAmountCents: entity.baseAmountCents,
      discountCents: entity.discountCents,
      netAmountCents: entity.netAmountCents,
      status: entity.status,
      payment: entity.payment ?? null,
      generatedBySenseiUid: entity.generatedBySenseiUid,
      createdAt: Timestamp.fromDate(new Date(entity.createdAt)),
      updatedAt: FieldValue.serverTimestamp(),
    };
  },
};

export const AttendanceMapper = {
  toDomain(data: DocumentData): AttendanceEntity {
    return {
      id: data.id,
      dojoId: data.dojoId,
      classId: data.classId,
      studentId: data.studentId,
      date: data.date,
      present: Boolean(data.present),
      registeredByUserId: data.registeredByUserId,
      createdAt: timestampToIso(data.createdAt),
      notes: data.notes,
    };
  },
  toFirestore(entity: AttendanceEntity): DocumentData {
    return {
      id: entity.id,
      dojoId: entity.dojoId,
      classId: entity.classId,
      studentId: entity.studentId,
      date: entity.date,
      present: entity.present,
      registeredByUserId: entity.registeredByUserId,
      createdAt: Timestamp.fromDate(new Date(entity.createdAt)),
      notes: entity.notes ?? null,
    };
  },
};

export const GraduationMapper = {
  toDomain(data: DocumentData): GraduationEntity {
    return {
      id: data.id,
      dojoId: data.dojoId,
      studentId: data.studentId,
      belt: data.belt,
      kyuOrDan: data.kyuOrDan,
      examinationDate: data.examinationDate,
      examinerSensei: data.examinerSensei,
      evaluationNotes: data.evaluationNotes,
      certificateNumber: data.certificateNumber,
      createdAt: timestampToIso(data.createdAt),
    };
  },
  toFirestore(entity: GraduationEntity): DocumentData {
    return {
      id: entity.id,
      dojoId: entity.dojoId,
      studentId: entity.studentId,
      belt: entity.belt,
      kyuOrDan: entity.kyuOrDan,
      examinationDate: entity.examinationDate,
      examinerSensei: entity.examinerSensei,
      evaluationNotes: entity.evaluationNotes ?? null,
      certificateNumber: entity.certificateNumber ?? null,
      createdAt: Timestamp.fromDate(new Date(entity.createdAt)),
    };
  },
};

export const CompetitionMapper = {
  toDomain(data: DocumentData): CompetitionEntity {
    return {
      id: data.id,
      dojoId: data.dojoId,
      name: data.name,
      organizer: data.organizer,
      location: data.location,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description,
      categories: Array.isArray(data.categories) ? data.categories : [],
      participatingStudentIds: Array.isArray(data.participatingStudentIds) ? data.participatingStudentIds : [],
      status: data.status ?? 'upcoming',
      createdAt: timestampToIso(data.createdAt),
    };
  },
  toFirestore(entity: CompetitionEntity): DocumentData {
    return {
      id: entity.id,
      dojoId: entity.dojoId,
      name: entity.name,
      organizer: entity.organizer ?? null,
      location: entity.location,
      startDate: entity.startDate,
      endDate: entity.endDate ?? null,
      description: entity.description ?? null,
      categories: entity.categories,
      participatingStudentIds: entity.participatingStudentIds,
      status: entity.status,
      createdAt: Timestamp.fromDate(new Date(entity.createdAt)),
      updatedAt: FieldValue.serverTimestamp(),
    };
  },
};

export const CalendarEventMapper = {
  toDomain(data: DocumentData): CalendarEventEntity {
    return {
      id: data.id,
      dojoId: data.dojoId,
      title: data.title,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description,
      location: data.location,
      targetClassIds: data.targetClassIds,
      isPublicForStudents: Boolean(data.isPublicForStudents),
    };
  },
  toFirestore(entity: CalendarEventEntity): DocumentData {
    return {
      id: entity.id,
      dojoId: entity.dojoId,
      title: entity.title,
      type: entity.type,
      startDate: entity.startDate,
      endDate: entity.endDate ?? null,
      description: entity.description ?? null,
      location: entity.location ?? null,
      targetClassIds: entity.targetClassIds ?? null,
      isPublicForStudents: entity.isPublicForStudents,
      updatedAt: FieldValue.serverTimestamp(),
    };
  },
};
