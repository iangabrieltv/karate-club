import {
  IUserRepository,
  IDojoRepository,
  IStudentRepository,
  IStudentAuthCredentialRepository,
} from '../../interfaces';
import {
  UserEntity,
  DojoEntity,
  StudentEntity,
  StudentAuthCredentialEntity,
} from '../../domain/entities';

/**
 * Repositórios Voláteis em Memória para Testes e Desenvolvimento Desacoplado
 * ATENÇÃO: Os dados armazenados nestes mocks são voláteis e residem exclusivamente
 * na memória RAM do processo Node.js. Eles são zerados ao reiniciar a aplicação.
 */

export class InMemoryUserRepository implements IUserRepository {
  private users = new Map<string, UserEntity>();

  async findById(uid: string): Promise<UserEntity | null> {
    return this.users.get(uid) ?? null;
  }

  async findByDojo(dojoId: string): Promise<UserEntity[]> {
    return Array.from(this.users.values()).filter((u) => u.dojoId === dojoId);
  }

  async save(user: UserEntity): Promise<void> {
    this.users.set(user.uid, { ...user });
  }

  async updateSessionVersion(uid: string, nextVersion: number): Promise<void> {
    const existing = this.users.get(uid);
    if (existing) {
      existing.sessionVersion = nextVersion;
      this.users.set(uid, existing);
    }
  }

  clear(): void {
    this.users.clear();
  }
}

export class InMemoryDojoRepository implements IDojoRepository {
  private dojos = new Map<string, DojoEntity>();

  async findById(id: string): Promise<DojoEntity | null> {
    return this.dojos.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<DojoEntity | null> {
    return Array.from(this.dojos.values()).find((d) => d.slug === slug) ?? null;
  }

  async save(dojo: DojoEntity): Promise<void> {
    this.dojos.set(dojo.id, { ...dojo });
  }

  clear(): void {
    this.dojos.clear();
  }
}

export class InMemoryStudentRepository implements IStudentRepository {
  private students = new Map<string, StudentEntity>();

  private getKey(dojoId: string, studentId: string): string {
    return `${dojoId}:${studentId}`;
  }

  async findById(dojoId: string, studentId: string): Promise<StudentEntity | null> {
    return this.students.get(this.getKey(dojoId, studentId)) ?? null;
  }

  async findByDojo(dojoId: string): Promise<StudentEntity[]> {
    return Array.from(this.students.values()).filter((s) => s.dojoId === dojoId);
  }

  async findByUserId(dojoId: string, userId: string): Promise<StudentEntity | null> {
    return Array.from(this.students.values()).find(
      (s) => s.dojoId === dojoId && s.userId === userId
    ) ?? null;
  }

  async save(student: StudentEntity): Promise<void> {
    this.students.set(this.getKey(student.dojoId, student.id), { ...student });
  }

  async updateStatus(dojoId: string, studentId: string, status: StudentEntity['status']): Promise<void> {
    const key = this.getKey(dojoId, studentId);
    const existing = this.students.get(key);
    if (existing) {
      existing.status = status;
      this.students.set(key, existing);
    }
  }

  clear(): void {
    this.students.clear();
  }
}

export class InMemoryStudentAuthCredentialRepository implements IStudentAuthCredentialRepository {
  private credentials = new Map<string, StudentAuthCredentialEntity>();

  private getKey(dojoId: string, usernameNormalized: string): string {
    return `${dojoId}:${usernameNormalized.toLowerCase().trim()}`;
  }

  async findByUsername(dojoId: string, usernameNormalized: string): Promise<StudentAuthCredentialEntity | null> {
    return this.credentials.get(this.getKey(dojoId, usernameNormalized)) ?? null;
  }

  async save(credential: StudentAuthCredentialEntity): Promise<void> {
    this.credentials.set(this.getKey(credential.dojoId, credential.usernameNormalized), {
      ...credential,
    });
  }

  async incrementFailedAttempts(dojoId: string, usernameNormalized: string, lockedUntil: string | null): Promise<void> {
    const key = this.getKey(dojoId, usernameNormalized);
    const existing = this.credentials.get(key);
    if (existing) {
      existing.failedAttempts += 1;
      existing.lockedUntil = lockedUntil;
      existing.lastFailedAt = new Date().toISOString();
      this.credentials.set(key, existing);
    }
  }

  async resetFailedAttempts(dojoId: string, usernameNormalized: string): Promise<void> {
    const key = this.getKey(dojoId, usernameNormalized);
    const existing = this.credentials.get(key);
    if (existing) {
      existing.failedAttempts = 0;
      existing.lockedUntil = null;
      this.credentials.set(key, existing);
    }
  }

  async updatePasswordHash(
    dojoId: string,
    usernameNormalized: string,
    newHash: string,
    newSessionVersion: number
  ): Promise<void> {
    const key = this.getKey(dojoId, usernameNormalized);
    const existing = this.credentials.get(key);
    if (existing) {
      existing.passwordHash = newHash;
      existing.mustChangePassword = false;
      existing.passwordUpdatedAt = new Date().toISOString();
      existing.sessionVersion = newSessionVersion;
      this.credentials.set(key, existing);
    }
  }

  clear(): void {
    this.credentials.clear();
  }
}
