import {
  IClassRepository,
  ITuitionRepository,
  IAttendanceRepository,
  IGraduationRepository,
  ICompetitionRepository,
  ICalendarEventRepository,
} from '../../interfaces';
import {
  ClassEntity,
  TuitionEntity,
  AttendanceEntity,
  GraduationEntity,
  CompetitionEntity,
  CompetitionTeamEntity,
  CompetitionResultEntity,
  CalendarEventEntity,
} from '../../domain/entities';

export class InMemoryClassRepository implements IClassRepository {
  private classes = new Map<string, ClassEntity>();

  private getKey(dojoId: string, classId: string) {
    return `${dojoId}:${classId}`;
  }

  async findById(dojoId: string, classId: string): Promise<ClassEntity | null> {
    return this.classes.get(this.getKey(dojoId, classId)) ?? null;
  }

  async findByDojo(dojoId: string): Promise<ClassEntity[]> {
    return Array.from(this.classes.values()).filter((c) => c.dojoId === dojoId);
  }

  async save(classEntity: ClassEntity): Promise<void> {
    this.classes.set(this.getKey(classEntity.dojoId, classEntity.id), { ...classEntity });
  }

  async delete(dojoId: string, classId: string): Promise<void> {
    this.classes.delete(this.getKey(dojoId, classId));
  }

  clear() {
    this.classes.clear();
  }
}

export class InMemoryTuitionRepository implements ITuitionRepository {
  private tuitions = new Map<string, TuitionEntity>();

  private getKey(dojoId: string, tuitionId: string) {
    return `${dojoId}:${tuitionId}`;
  }

  async findById(dojoId: string, tuitionId: string): Promise<TuitionEntity | null> {
    return this.tuitions.get(this.getKey(dojoId, tuitionId)) ?? null;
  }

  async findByStudent(dojoId: string, studentId: string): Promise<TuitionEntity[]> {
    return Array.from(this.tuitions.values()).filter(
      (t) => t.dojoId === dojoId && t.studentId === studentId
    );
  }

  async findByMonth(dojoId: string, referenceMonth: string): Promise<TuitionEntity[]> {
    return Array.from(this.tuitions.values()).filter(
      (t) => t.dojoId === dojoId && t.referenceMonth === referenceMonth
    );
  }

  async save(tuition: TuitionEntity): Promise<void> {
    this.tuitions.set(this.getKey(tuition.dojoId, tuition.id), { ...tuition });
  }

  clear() {
    this.tuitions.clear();
  }
}

export class InMemoryAttendanceRepository implements IAttendanceRepository {
  private records = new Map<string, AttendanceEntity>();

  private getKey(dojoId: string, id: string) {
    return `${dojoId}:${id}`;
  }

  async findById(dojoId: string, attendanceId: string): Promise<AttendanceEntity | null> {
    return this.records.get(this.getKey(dojoId, attendanceId)) ?? null;
  }

  async findByClassAndDate(dojoId: string, classId: string, date: string): Promise<AttendanceEntity[]> {
    return Array.from(this.records.values()).filter(
      (r) => r.dojoId === dojoId && r.classId === classId && r.date === date
    );
  }

  async findByStudent(dojoId: string, studentId: string): Promise<AttendanceEntity[]> {
    return Array.from(this.records.values()).filter(
      (r) => r.dojoId === dojoId && r.studentId === studentId
    );
  }

  async save(attendance: AttendanceEntity): Promise<void> {
    this.records.set(this.getKey(attendance.dojoId, attendance.id), { ...attendance });
  }

  clear() {
    this.records.clear();
  }
}

export class InMemoryGraduationRepository implements IGraduationRepository {
  private records = new Map<string, GraduationEntity>();

  private getKey(dojoId: string, id: string) {
    return `${dojoId}:${id}`;
  }

  async findById(dojoId: string, graduationId: string): Promise<GraduationEntity | null> {
    return this.records.get(this.getKey(dojoId, graduationId)) ?? null;
  }

  async findByStudent(dojoId: string, studentId: string): Promise<GraduationEntity[]> {
    return Array.from(this.records.values()).filter(
      (r) => r.dojoId === dojoId && r.studentId === studentId
    );
  }

  async save(graduation: GraduationEntity): Promise<void> {
    this.records.set(this.getKey(graduation.dojoId, graduation.id), { ...graduation });
  }

  clear() {
    this.records.clear();
  }
}

export class InMemoryCompetitionRepository implements ICompetitionRepository {
  private comps = new Map<string, CompetitionEntity>();
  private teams = new Map<string, CompetitionTeamEntity>();
  private results = new Map<string, CompetitionResultEntity>();

  private getKey(dojoId: string, id: string) {
    return `${dojoId}:${id}`;
  }

  async findById(dojoId: string, competitionId: string): Promise<CompetitionEntity | null> {
    return this.comps.get(this.getKey(dojoId, competitionId)) ?? null;
  }

  async findByDojo(dojoId: string): Promise<CompetitionEntity[]> {
    return Array.from(this.comps.values()).filter((c) => c.dojoId === dojoId);
  }

  async save(competition: CompetitionEntity): Promise<void> {
    this.comps.set(this.getKey(competition.dojoId, competition.id), { ...competition });
  }

  async findTeamsByCompetition(dojoId: string, competitionId: string): Promise<CompetitionTeamEntity[]> {
    return Array.from(this.teams.values()).filter(
      (t) => t.dojoId === dojoId && t.competitionId === competitionId
    );
  }

  async saveTeam(team: CompetitionTeamEntity): Promise<void> {
    this.teams.set(this.getKey(team.dojoId, team.id), { ...team });
  }

  async findResultsByCompetition(dojoId: string, competitionId: string): Promise<CompetitionResultEntity[]> {
    return Array.from(this.results.values()).filter(
      (r) => r.dojoId === dojoId && r.competitionId === competitionId
    );
  }

  async findResultsByStudent(dojoId: string, competitionId: string, studentId: string): Promise<CompetitionResultEntity[]> {
    return Array.from(this.results.values()).filter(
      (r) => r.dojoId === dojoId && r.competitionId === competitionId && r.studentIds.includes(studentId)
    );
  }

  async saveResult(result: CompetitionResultEntity): Promise<void> {
    this.results.set(this.getKey(result.dojoId, result.id), { ...result });
  }

  clear() {
    this.comps.clear();
    this.teams.clear();
    this.results.clear();
  }
}

export class InMemoryCalendarEventRepository implements ICalendarEventRepository {
  private events = new Map<string, CalendarEventEntity>();

  private getKey(dojoId: string, id: string) {
    return `${dojoId}:${id}`;
  }

  async findById(dojoId: string, eventId: string): Promise<CalendarEventEntity | null> {
    return this.events.get(this.getKey(dojoId, eventId)) ?? null;
  }

  async findByDojo(dojoId: string, includePrivateForStudents = true): Promise<CalendarEventEntity[]> {
    return Array.from(this.events.values()).filter((e) => {
      if (e.dojoId !== dojoId) return false;
      if (!includePrivateForStudents && !e.isPublicForStudents) return false;
      return true;
    });
  }

  async save(event: CalendarEventEntity): Promise<void> {
    this.events.set(this.getKey(event.dojoId, event.id), { ...event });
  }

  async delete(dojoId: string, eventId: string): Promise<void> {
    this.events.delete(this.getKey(dojoId, eventId));
  }

  clear() {
    this.events.clear();
  }
}
