import { IAuthService, IPasswordHasher } from '../../interfaces';
import {
  IDojoRepository,
  IStudentRepository,
  IStudentAuthCredentialRepository,
  IUserRepository,
} from '../../interfaces';
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from '../../domain/errors';
import { StudentStatus } from '../../domain/enums';

export class AuthService implements IAuthService {
  constructor(
    private readonly dojoRepo: IDojoRepository,
    private readonly studentRepo: IStudentRepository,
    private readonly credRepo: IStudentAuthCredentialRepository,
    private readonly userRepo: IUserRepository,
    private readonly hasher: IPasswordHasher
  ) {}

  async authenticateStudent(
    dojoIdentifier: string,
    username: string,
    passwordPlain: string
  ): Promise<{
    studentUid: string;
    studentId: string;
    dojoId: string;
    mustChangePassword: boolean;
    sessionVersion: number;
  }> {
    if (!dojoIdentifier || !username || !passwordPlain) {
      throw new ValidationError('Identificador do dojo, usuário e senha são obrigatórios.');
    }

    // 1. Localiza o dojo por slug ou id
    let dojo = await this.dojoRepo.findBySlug(dojoIdentifier);
    if (!dojo) {
      dojo = await this.dojoRepo.findById(dojoIdentifier);
    }

    if (!dojo || !dojo.isActive) {
      // Resposta genérica para evitar enumeração
      throw new AuthenticationError('Credenciais incorretas ou dojo inativo.');
    }

    const usernameNormalized = username.toLowerCase().trim();

    // 2. Busca a credencial privada
    const cred = await this.credRepo.findByUsername(dojo.id, usernameNormalized);
    if (!cred) {
      throw new AuthenticationError('Credenciais incorretas ou usuário não encontrado.');
    }

    // 3. Verifica bloqueio temporário por tentativas
    if (cred.lockedUntil) {
      const lockDate = new Date(cred.lockedUntil);
      if (lockDate > new Date()) {
        throw new AuthenticationError('Conta temporariamente bloqueada por tentativas excedidas. Aguarde alguns instantes.');
      }
    }

    // 4. Valida a senha usando o Hasher
    const isValid = await this.hasher.verify(passwordPlain, cred.passwordHash);
    if (!isValid) {
      const nextAttempts = cred.failedAttempts + 1;
      let lockedUntil: string | null = null;

      if (nextAttempts >= 5) {
        // Bloqueio temporário de 60 segundos
        lockedUntil = new Date(Date.now() + 60 * 1000).toISOString();
      }

      await this.credRepo.incrementFailedAttempts(dojo.id, usernameNormalized, lockedUntil);
      throw new AuthenticationError('Credenciais incorretas.');
    }

    // 5. Verifica se o perfil do aluno está ativo no dojo
    const student = await this.studentRepo.findById(dojo.id, cred.studentId);
    if (!student || student.status !== StudentStatus.ACTIVE) {
      throw new AuthorizationError('Acesso negado: matrícula do aluno não está ativa neste dojo.');
    }

    // 6. Verifica se o usuário geral está ativo
    const user = await this.userRepo.findById(cred.userId);
    if (!user || !user.isActive) {
      throw new AuthorizationError('Acesso negado: conta do usuário desativada.');
    }

    // Sucesso: reseta tentativas e retorna dados da sessão
    await this.credRepo.resetFailedAttempts(dojo.id, usernameNormalized);

    return {
      studentUid: cred.userId,
      studentId: cred.studentId,
      dojoId: dojo.id,
      mustChangePassword: cred.mustChangePassword,
      sessionVersion: cred.sessionVersion,
    };
  }

  async changeStudentPassword(
    studentUid: string,
    dojoId: string,
    newPasswordPlain: string
  ): Promise<{ success: boolean; nextSessionVersion: number }> {
    if (!newPasswordPlain || newPasswordPlain.length < 8) {
      throw new ValidationError('A nova senha deve possuir pelo menos 8 caracteres.');
    }

    const user = await this.userRepo.findById(studentUid);
    if (!user || user.dojoId !== dojoId) {
      throw new NotFoundError('Usuário não localizado no dojo informado.');
    }

    if (!user.studentId || !user.username) {
      throw new ValidationError('Este usuário não possui perfil de aluno com credenciais associadas.');
    }

    const nextSessionVersion = user.sessionVersion + 1;
    const newHash = await this.hasher.hash(newPasswordPlain);

    await this.credRepo.updatePasswordHash(dojoId, user.username, newHash, nextSessionVersion);
    await this.userRepo.updateSessionVersion(studentUid, nextSessionVersion);

    return {
      success: true,
      nextSessionVersion,
    };
  }
}
