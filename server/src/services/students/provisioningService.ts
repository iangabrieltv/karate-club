import {
  IStudentProvisioningService,
  IPasswordHasher,
  ITemporaryPasswordGenerator,
} from '../../interfaces';
import {
  IDojoRepository,
  IStudentRepository,
  IStudentAuthCredentialRepository,
  IUserRepository,
} from '../../interfaces';
import { StudentEntity, UserEntity, StudentAuthCredentialEntity } from '../../domain/entities';
import { UserRole, StudentStatus } from '../../domain/enums';
import { ConflictError, NotFoundError, ValidationError } from '../../domain/errors';

export class StudentProvisioningService implements IStudentProvisioningService {
  public static readonly IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas de janela para retentativas HTTP
  private completedJobs = new Map<string, { studentId: string; studentUid: string; username: string; temporaryPassword: string; payloadHash: string; createdAt: number }>();
  private inFlightLocks = new Map<string, { promise: Promise<{ studentId: string; studentUid: string; username: string; temporaryPassword: string }>; payloadHash: string }>();

  constructor(
    private readonly dojoRepo: IDojoRepository,
    private readonly studentRepo: IStudentRepository,
    private readonly credRepo: IStudentAuthCredentialRepository,
    private readonly userRepo: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly passwordGenerator: ITemporaryPasswordGenerator
  ) {}

  /**
   * Limpa trabalhos expirados do mapa de idempotência para desalocação de memória e senhas temporárias
   */
  cleanupExpiredJobs(maxAgeMs: number = StudentProvisioningService.IDEMPOTENCY_TTL_MS): number {
    const now = Date.now();
    let removed = 0;
    for (const [key, job] of this.completedJobs.entries()) {
      if (now - job.createdAt > maxAgeMs) {
        this.completedJobs.delete(key);
        removed++;
      }
    }
    return removed;
  }

  /**
   * Remove imediatamente a chave após confirmação de entrega ao aluno
   */
  clearJob(dojoId: string, idempotencyKey: string): void {
    const scopedKey = `${dojoId}:provision_student:${idempotencyKey}`;
    this.completedJobs.delete(scopedKey);
  }

  async provisionStudent(
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
  }> {
    if (!idempotencyKey) {
      throw new ValidationError('Idempotency-Key é obrigatória.');
    }

    // Chave com escopo estrito por tenant (dojoId) e operação para evitar colisões entre dojos
    const scopedKey = `${dojoId}:provision_student:${idempotencyKey}`;
    const payloadHash = JSON.stringify({ dojoId, ...payload });

    // 1. Verificação de Idempotência: Trabalho já concluído anteriormente com validação de TTL
    const existingJob = this.completedJobs.get(scopedKey);
    if (existingJob) {
      if (Date.now() - existingJob.createdAt > StudentProvisioningService.IDEMPOTENCY_TTL_MS) {
        // Expirado: remove do mapa para não manter senhas temporárias indefinidamente
        this.completedJobs.delete(scopedKey);
      } else {
        if (existingJob.payloadHash !== payloadHash) {
          throw new ConflictError('A mesma Idempotency-Key já foi processada com um payload diferente.');
        }
        return {
          studentId: existingJob.studentId,
          studentUid: existingJob.studentUid,
          username: existingJob.username,
          temporaryPassword: existingJob.temporaryPassword,
        };
      }
    }

    // 2. Verificação de Concorrência: Requisição simultânea em andamento (in-flight lock por tenant)
    const inFlight = this.inFlightLocks.get(scopedKey);
    if (inFlight) {
      if (inFlight.payloadHash !== payloadHash) {
        throw new ConflictError('Requisição concorrente com a mesma Idempotency-Key e payload diferente.');
      }
      // Aguarda e compartilha o resultado da operação já em execução
      return inFlight.promise;
    }

    // 3. Criação da Promessa em Voo e Execução Segura
    const executeProvisioning = async () => {
      // Validação do Dojo e do Sensei
      const dojo = await this.dojoRepo.findById(dojoId);
      if (!dojo || !dojo.isActive) {
        throw new NotFoundError('Dojo não encontrado ou inativo.');
      }

      const sensei = await this.userRepo.findById(senseiUid);
      if (!sensei || sensei.dojoId !== dojoId || (sensei.role !== UserRole.ADMIN && sensei.role !== UserRole.SENSEI)) {
        throw new ValidationError('Apenas o Sensei ou Administrador do próprio dojo pode cadastrar alunos.');
      }

      // Normalização do Username
      const rawUsername = payload.username || payload.fullName.toLowerCase().replace(/\s+/g, '.').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const usernameNormalized = rawUsername.toLowerCase().trim();

      // Verificação de Duplicidade no Dojo
      const existingCred = await this.credRepo.findByUsername(dojoId, usernameNormalized);
      if (existingCred) {
        throw new ConflictError(`O nome de usuário ou matrícula "${usernameNormalized}" já está em uso neste dojo.`);
      }

      // Geração de IDs Imutáveis
      const studentId = `std_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const studentUid = `stu_${dojoId}_${studentId}`;

      // Geração de Senha Temporária de 40 bits
      const { plainText: tempPassword } = this.passwordGenerator.generate();
      const passwordHash = await this.hasher.hash(tempPassword);

      // Persistência Coordenada
      const now = new Date().toISOString();

      const studentEntity: StudentEntity = {
        id: studentId,
        userId: studentUid,
        dojoId,
        fullName: payload.fullName,
        birthDate: payload.birthDate,
        phone: payload.phone,
        isMinor: payload.isMinor,
        guardian: payload.guardian,
        assignedClassIds: payload.assignedClassIds,
        currentBelt: payload.currentBelt,
        currentKyuOrDan: payload.currentKyuOrDan,
        enrolledAt: now,
        billingDay: payload.billingDay,
        tuitionAmountCents: payload.tuitionAmountCents,
        individualDiscountCents: payload.individualDiscountCents,
        status: StudentStatus.ACTIVE,
        registrationNumber: payload.registrationNumber,
      };

      const userEntity: UserEntity = {
        uid: studentUid,
        dojoId,
        role: UserRole.STUDENT,
        name: payload.fullName,
        isActive: true,
        createdAt: now,
        sessionVersion: 1,
        studentId,
        username: usernameNormalized,
      };

      const credEntity: StudentAuthCredentialEntity = {
        usernameNormalized,
        dojoId,
        studentId,
        userId: studentUid,
        passwordHash,
        algorithm: 'argon2id',
        mustChangePassword: true,
        failedAttempts: 0,
        lockedUntil: null,
        lastFailedAt: null,
        passwordUpdatedAt: now,
        sessionVersion: 1,
        createdAt: now,
      };

      await this.studentRepo.save(studentEntity);
      await this.userRepo.save(userEntity);
      await this.credRepo.save(credEntity);

      const result = {
        studentId,
        studentUid,
        username: usernameNormalized,
        temporaryPassword: tempPassword,
      };

      // Grava no histórico de idempotência concluída com timestamp
      this.completedJobs.set(scopedKey, { ...result, payloadHash, createdAt: Date.now() });

      return result;
    };

    const taskPromise = executeProvisioning();
    this.inFlightLocks.set(scopedKey, { promise: taskPromise, payloadHash });

    try {
      return await taskPromise;
    } finally {
      this.inFlightLocks.delete(scopedKey);
    }
  }
}
