import { Firestore, FieldValue, Timestamp, Query } from 'firebase-admin/firestore';
import {
  IUserRepository,
  IDojoRepository,
  IStudentRepository,
  IStudentAuthCredentialRepository,
  IClassRepository,
  ITuitionRepository,
  IAttendanceRepository,
  IGraduationRepository,
  ICompetitionRepository,
  ICalendarEventRepository,
} from '../../../interfaces';
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
import {
  UserMapper,
  DojoMapper,
  StudentMapper,
  AuthCredentialMapper,
  ClassMapper,
  TuitionMapper,
  AttendanceMapper,
  GraduationMapper,
  CompetitionMapper,
  CalendarEventMapper,
  timestampToIso,
} from '../mappers';

/**
 * 1. FirestoreUserRepository (/users/{uid})
 */
export class FirestoreUserRepository implements IUserRepository {
  constructor(private readonly db: Firestore) {}

  async findById(uid: string): Promise<UserEntity | null> {
    const doc = await this.db.collection('users').doc(uid).get();
    if (!doc.exists) return null;
    return UserMapper.toDomain(doc.data()!);
  }

  async findByDojo(dojoId: string): Promise<UserEntity[]> {
    const snapshot = await this.db.collection('users').where('dojoId', '==', dojoId).get();
    return snapshot.docs.map((doc) => UserMapper.toDomain(doc.data()));
  }

  async save(user: UserEntity): Promise<void> {
    await this.db.collection('users').doc(user.uid).set(UserMapper.toFirestore(user), { merge: true });
  }

  async updateSessionVersion(uid: string, nextVersion: number): Promise<void> {
    await this.db.collection('users').doc(uid).update({
      sessionVersion: nextVersion,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

/**
 * 2. FirestoreDojoRepository (/dojos/{dojoId})
 */
export class FirestoreDojoRepository implements IDojoRepository {
  constructor(private readonly db: Firestore) {}

  async findById(id: string): Promise<DojoEntity | null> {
    const doc = await this.db.collection('dojos').doc(id).get();
    if (!doc.exists) return null;
    return DojoMapper.toDomain(doc.data()!);
  }

  async findBySlug(slug: string): Promise<DojoEntity | null> {
    const snapshot = await this.db.collection('dojos').where('slug', '==', slug).limit(1).get();
    if (snapshot.empty || !snapshot.docs[0]) return null;
    return DojoMapper.toDomain(snapshot.docs[0].data());
  }

  async save(dojo: DojoEntity): Promise<void> {
    await this.db.collection('dojos').doc(dojo.id).set(DojoMapper.toFirestore(dojo), { merge: true });
  }
}

/**
 * 3. FirestoreStudentRepository (/dojos/{dojoId}/students/{studentId})
 */
export class FirestoreStudentRepository implements IStudentRepository {
  constructor(private readonly db: Firestore) {}

  private col(dojoId: string) {
    return this.db.collection('dojos').doc(dojoId).collection('students');
  }

  async findById(dojoId: string, studentId: string): Promise<StudentEntity | null> {
    const doc = await this.col(dojoId).doc(studentId).get();
    if (!doc.exists) return null;
    return StudentMapper.toDomain(doc.data()!);
  }

  async findByDojo(dojoId: string): Promise<StudentEntity[]> {
    const snapshot = await this.col(dojoId).get();
    return snapshot.docs.map((doc) => StudentMapper.toDomain(doc.data()));
  }

  async findByUserId(dojoId: string, userId: string): Promise<StudentEntity | null> {
    const snapshot = await this.col(dojoId).where('userId', '==', userId).limit(1).get();
    if (snapshot.empty || !snapshot.docs[0]) return null;
    return StudentMapper.toDomain(snapshot.docs[0].data());
  }

  async save(student: StudentEntity): Promise<void> {
    await this.col(student.dojoId).doc(student.id).set(StudentMapper.toFirestore(student), { merge: true });
  }

  async updateStatus(dojoId: string, studentId: string, status: StudentEntity['status']): Promise<void> {
    await this.col(dojoId).doc(studentId).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

/**
 * 4. FirestoreStudentAuthCredentialRepository (/dojos/{dojoId}/auth_credentials/{usernameNormalized})
 */
export class FirestoreStudentAuthCredentialRepository implements IStudentAuthCredentialRepository {
  constructor(private readonly db: Firestore) {}

  private col(dojoId: string) {
    return this.db.collection('dojos').doc(dojoId).collection('auth_credentials');
  }

  async findByUsername(dojoId: string, usernameNormalized: string): Promise<StudentAuthCredentialEntity | null> {
    const doc = await this.col(dojoId).doc(usernameNormalized.toLowerCase().trim()).get();
    if (!doc.exists) return null;
    return AuthCredentialMapper.toDomain(doc.data()!);
  }

  async save(credential: StudentAuthCredentialEntity): Promise<void> {
    await this.col(credential.dojoId)
      .doc(credential.usernameNormalized.toLowerCase().trim())
      .set(AuthCredentialMapper.toFirestore(credential), { merge: true });
  }

  async incrementFailedAttempts(dojoId: string, usernameNormalized: string, lockedUntil: string | null): Promise<void> {
    const docRef = this.col(dojoId).doc(usernameNormalized.toLowerCase().trim());
    await docRef.update({
      failedAttempts: FieldValue.increment(1),
      lockedUntil: lockedUntil ? Timestamp.fromDate(new Date(lockedUntil)) : null,
      lastFailedAt: FieldValue.serverTimestamp(),
    });
  }

  async resetFailedAttempts(dojoId: string, usernameNormalized: string): Promise<void> {
    const docRef = this.col(dojoId).doc(usernameNormalized.toLowerCase().trim());
    await docRef.update({
      failedAttempts: 0,
      lockedUntil: null,
      lastFailedAt: null,
    });
  }

  async updatePasswordHash(
    dojoId: string,
    usernameNormalized: string,
    newHash: string,
    newSessionVersion: number
  ): Promise<void> {
    const docRef = this.col(dojoId).doc(usernameNormalized.toLowerCase().trim());
    await docRef.update({
      passwordHash: newHash,
      mustChangePassword: false,
      sessionVersion: newSessionVersion,
      passwordUpdatedAt: FieldValue.serverTimestamp(),
    });
  }
}

/**
 * 5. FirestoreClassRepository (/dojos/{dojoId}/classes/{classId})
 */
export class FirestoreClassRepository implements IClassRepository {
  constructor(private readonly db: Firestore) {}

  private col(dojoId: string) {
    return this.db.collection('dojos').doc(dojoId).collection('classes');
  }

  async findById(dojoId: string, classId: string): Promise<ClassEntity | null> {
    const doc = await this.col(dojoId).doc(classId).get();
    if (!doc.exists) return null;
    return ClassMapper.toDomain(doc.data()!);
  }

  async findByDojo(dojoId: string): Promise<ClassEntity[]> {
    const snapshot = await this.col(dojoId).get();
    return snapshot.docs.map((doc) => ClassMapper.toDomain(doc.data()));
  }

  async save(classEntity: ClassEntity): Promise<void> {
    await this.col(classEntity.dojoId).doc(classEntity.id).set(ClassMapper.toFirestore(classEntity), { merge: true });
  }

  async delete(dojoId: string, classId: string): Promise<void> {
    await this.col(dojoId).doc(classId).delete();
  }
}

/**
 * 6. FirestoreTuitionRepository (/dojos/{dojoId}/tuitions/{tuitionId})
 * ID DETERMINÍSTICO ANTI-DUPLICIDADE: tui_{studentId}_{referenceMonth}
 */
export class FirestoreTuitionRepository implements ITuitionRepository {
  constructor(private readonly db: Firestore) {}

  private col(dojoId: string) {
    return this.db.collection('dojos').doc(dojoId).collection('tuitions');
  }

  async findById(dojoId: string, tuitionId: string): Promise<TuitionEntity | null> {
    const doc = await this.col(dojoId).doc(tuitionId).get();
    if (!doc.exists) return null;
    return TuitionMapper.toDomain(doc.data()!);
  }

  async findByStudent(dojoId: string, studentId: string): Promise<TuitionEntity[]> {
    const snapshot = await this.col(dojoId).where('studentId', '==', studentId).get();
    return snapshot.docs.map((doc) => TuitionMapper.toDomain(doc.data()));
  }

  async findByMonth(dojoId: string, referenceMonth: string): Promise<TuitionEntity[]> {
    const snapshot = await this.col(dojoId).where('referenceMonth', '==', referenceMonth).get();
    return snapshot.docs.map((doc) => TuitionMapper.toDomain(doc.data()));
  }

  async save(tuition: TuitionEntity): Promise<void> {
    await this.col(tuition.dojoId).doc(tuition.id).set(TuitionMapper.toFirestore(tuition), { merge: true });
  }
}

/**
 * 7. FirestoreAttendanceRepository (/dojos/{dojoId}/attendance/{attendanceId})
 */
export class FirestoreAttendanceRepository implements IAttendanceRepository {
  constructor(private readonly db: Firestore) {}

  private col(dojoId: string) {
    return this.db.collection('dojos').doc(dojoId).collection('attendance');
  }

  async findById(dojoId: string, attendanceId: string): Promise<AttendanceEntity | null> {
    const doc = await this.col(dojoId).doc(attendanceId).get();
    if (!doc.exists) return null;
    return AttendanceMapper.toDomain(doc.data()!);
  }

  async findByClassAndDate(dojoId: string, classId: string, date: string): Promise<AttendanceEntity[]> {
    const snapshot = await this.col(dojoId).where('classId', '==', classId).where('date', '==', date).get();
    return snapshot.docs.map((doc) => AttendanceMapper.toDomain(doc.data()));
  }

  async findByStudent(dojoId: string, studentId: string): Promise<AttendanceEntity[]> {
    const snapshot = await this.col(dojoId).where('studentId', '==', studentId).get();
    return snapshot.docs.map((doc) => AttendanceMapper.toDomain(doc.data()));
  }

  async save(attendance: AttendanceEntity): Promise<void> {
    await this.col(attendance.dojoId).doc(attendance.id).set(AttendanceMapper.toFirestore(attendance), { merge: true });
  }
}

/**
 * 8. FirestoreGraduationRepository (/dojos/{dojoId}/graduations/{graduationId})
 */
export class FirestoreGraduationRepository implements IGraduationRepository {
  constructor(private readonly db: Firestore) {}

  private col(dojoId: string) {
    return this.db.collection('dojos').doc(dojoId).collection('graduations');
  }

  async findById(dojoId: string, graduationId: string): Promise<GraduationEntity | null> {
    const doc = await this.col(dojoId).doc(graduationId).get();
    if (!doc.exists) return null;
    return GraduationMapper.toDomain(doc.data()!);
  }

  async findByStudent(dojoId: string, studentId: string): Promise<GraduationEntity[]> {
    const snapshot = await this.col(dojoId).where('studentId', '==', studentId).get();
    return snapshot.docs.map((doc) => GraduationMapper.toDomain(doc.data()));
  }

  async save(graduation: GraduationEntity): Promise<void> {
    await this.col(graduation.dojoId).doc(graduation.id).set(GraduationMapper.toFirestore(graduation), { merge: true });
  }
}

/**
 * 9. FirestoreCompetitionRepository (/dojos/{dojoId}/competitions/{competitionId})
 */
export class FirestoreCompetitionRepository implements ICompetitionRepository {
  constructor(private readonly db: Firestore) {}

  private col(dojoId: string) {
    return this.db.collection('dojos').doc(dojoId).collection('competitions');
  }

  async findById(dojoId: string, competitionId: string): Promise<CompetitionEntity | null> {
    const doc = await this.col(dojoId).doc(competitionId).get();
    if (!doc.exists) return null;
    return CompetitionMapper.toDomain(doc.data()!);
  }

  async findByDojo(dojoId: string): Promise<CompetitionEntity[]> {
    const snapshot = await this.col(dojoId).get();
    return snapshot.docs.map((doc) => CompetitionMapper.toDomain(doc.data()));
  }

  async save(competition: CompetitionEntity): Promise<void> {
    await this.col(competition.dojoId).doc(competition.id).set(CompetitionMapper.toFirestore(competition), { merge: true });
  }

  async findTeamsByCompetition(dojoId: string, competitionId: string): Promise<CompetitionTeamEntity[]> {
    const snapshot = await this.col(dojoId).doc(competitionId).collection('teams').get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        dojoId: data.dojoId,
        competitionId: data.competitionId,
        categoryId: data.categoryId,
        teamName: data.teamName,
        memberStudentIds: Array.isArray(data.memberStudentIds) ? data.memberStudentIds : [],
      };
    });
  }

  async saveTeam(team: CompetitionTeamEntity): Promise<void> {
    await this.col(team.dojoId)
      .doc(team.competitionId)
      .collection('teams')
      .doc(team.id)
      .set(team, { merge: true });
  }

  async findResultsByCompetition(dojoId: string, competitionId: string): Promise<CompetitionResultEntity[]> {
    const snapshot = await this.col(dojoId).doc(competitionId).collection('results').get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        dojoId: data.dojoId,
        competitionId: data.competitionId,
        categoryId: data.categoryId,
        modality: data.modality,
        isTeamResult: Boolean(data.isTeamResult),
        teamId: data.teamId,
        studentIds: Array.isArray(data.studentIds) ? data.studentIds : [],
        placement: data.placement,
        notes: data.notes,
        registeredAt: timestampToIso(data.registeredAt),
      };
    });
  }

  async findResultsByStudent(dojoId: string, competitionId: string, studentId: string): Promise<CompetitionResultEntity[]> {
    const snapshot = await this.col(dojoId)
      .doc(competitionId)
      .collection('results')
      .where('studentIds', 'array-contains', studentId)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        dojoId: data.dojoId,
        competitionId: data.competitionId,
        categoryId: data.categoryId,
        modality: data.modality,
        isTeamResult: Boolean(data.isTeamResult),
        teamId: data.teamId,
        studentIds: Array.isArray(data.studentIds) ? data.studentIds : [],
        placement: data.placement,
        notes: data.notes,
        registeredAt: timestampToIso(data.registeredAt),
      };
    });
  }

  async saveResult(result: CompetitionResultEntity): Promise<void> {
    await this.col(result.dojoId)
      .doc(result.competitionId)
      .collection('results')
      .doc(result.id)
      .set(result, { merge: true });
  }
}

/**
 * 10. FirestoreCalendarEventRepository (/dojos/{dojoId}/calendar_events/{eventId})
 */
export class FirestoreCalendarEventRepository implements ICalendarEventRepository {
  constructor(private readonly db: Firestore) {}

  private col(dojoId: string) {
    return this.db.collection('dojos').doc(dojoId).collection('calendar_events');
  }

  async findById(dojoId: string, eventId: string): Promise<CalendarEventEntity | null> {
    const doc = await this.col(dojoId).doc(eventId).get();
    if (!doc.exists) return null;
    return CalendarEventMapper.toDomain(doc.data()!);
  }

  async findByDojo(dojoId: string, includePrivateForStudents = true): Promise<CalendarEventEntity[]> {
    let queryRef: Query = this.col(dojoId);
    if (!includePrivateForStudents) {
      queryRef = queryRef.where('isPublicForStudents', '==', true);
    }
    const snapshot = await queryRef.get();
    return snapshot.docs.map((doc) => CalendarEventMapper.toDomain(doc.data()));
  }

  async save(event: CalendarEventEntity): Promise<void> {
    await this.col(event.dojoId).doc(event.id).set(CalendarEventMapper.toFirestore(event), { merge: true });
  }

  async delete(dojoId: string, eventId: string): Promise<void> {
    await this.col(dojoId).doc(eventId).delete();
  }
}
