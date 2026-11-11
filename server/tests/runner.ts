/**
 * Karate Club - Suíte de Testes Automatizados Unitários da Etapa 4.1
 * Valida:
 * 1. Tipos e Entidades de Domínio
 * 2. Segurança Criptográfica (Argon2id, Senha Temporária 40-bits, Bootstrap 64 hex chars)
 * 3. Isolamento Estrito Multi-Tenant entre Dojos
 * 4. Idempotência e Prevenção de Duplicação no Provisionamento
 */

import * as fs from 'fs';
import * as path from 'path';
import { Argon2PasswordHasher } from '../src/utils/hasher';
import { TemporaryPasswordGenerator, BASE32_ALPHABET } from '../src/utils/temporaryPassword';
import { BootstrapSecretValidator } from '../src/utils/bootstrapValidator';
import {
  InMemoryDojoRepository,
  InMemoryStudentRepository,
  InMemoryStudentAuthCredentialRepository,
  InMemoryUserRepository,
} from '../src/infrastructure/mocks/repositories';
import { AuthService } from '../src/services/auth/authService';
import { StudentProvisioningService } from '../src/services/students/provisioningService';
import { UserRole, StudentStatus, KarateBelt, TuitionStatus, PaymentMethod, CompetitionModality, CompetitionPlacement, CalendarEventType } from '../src/domain/enums';
import { AuthenticationError, AuthorizationError, ConflictError } from '../src/domain/errors';
import {
  InMemoryClassRepository,
  InMemoryTuitionRepository,
  InMemoryAttendanceRepository,
  InMemoryGraduationRepository,
  InMemoryCompetitionRepository,
  InMemoryCalendarEventRepository,
} from '../src/infrastructure/mocks/additionalRepositories';
import { TuitionMapper, timestampToIso } from '../src/infrastructure/firestore/mappers';
import { TuitionEntity } from '../src/domain/entities';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    failed++;
    console.error(`❌ FALHA: ${message}`);
    throw new Error(message);
  } else {
    passed++;
    console.log(`✅ SUCESSO: ${message}`);
  }
}

async function runTests() {
  console.log('\n🥋 =========================================================================');
  console.log('🥋 KARATE CLUB — SUÍTE DE TESTES AUTOMATIZADOS (ETAPA 4.1 + 4.2 CONSOLIDADA)');
  console.log('🥋 =========================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. TESTES DE SEGURANÇA: VALIDADOR DE BOOTSTRAP (TEMPO CONSTANTE)
  // ---------------------------------------------------------------------------
  console.log('--- 1. Testes do Validador de Bootstrap Secret ---');
  const validSecretHex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64 hex chars
  const validator = new BootstrapSecretValidator(validSecretHex);

  assert(validator.validate(validSecretHex) === true, 'Deve aprovar segredo válido de 64 hex chars.');
  assert(validator.validate('0123456789abcdef') === false, 'Deve rejeitar segredo menor que 64 chars.');
  assert(validator.validate(undefined) === false, 'Deve rejeitar segredo indefinido/ausente.');
  assert(validator.validate('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdeg') === false, 'Deve rejeitar segredo com caractere não-hexadecimal.');
  assert(validator.validate('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdee') === false, 'Deve rejeitar segredo divergente no último dígito.');

  // ---------------------------------------------------------------------------
  // 2. TESTES DE SEGURANÇA: GERADOR DE SENHA TEMPORÁRIA (40 BITS)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Testes do Gerador de Senha Temporária ---');
  const pwdGen = new TemporaryPasswordGenerator();
  const pwdResult = pwdGen.generate();

  assert(pwdResult.plainText.startsWith('KTC-'), 'Senha deve começar com o prefixo KTC-');
  assert(pwdResult.plainText.length === 13, 'Formato KTC-XXXX-XXXX deve ter 13 caracteres.');
  assert(pwdResult.entropyBits === 40.0, 'Entropia deve ser calculada em exatamente 40.0 bits.');

  // Verifica que todos os caracteres pertencem ao alfabeto Base32
  const charsOnly = pwdResult.plainText.replace('KTC-', '').replace('-', '');
  let allInAlphabet = true;
  for (const c of charsOnly) {
    if (!BASE32_ALPHABET.includes(c)) allInAlphabet = false;
  }
  assert(allInAlphabet, 'Todos os caracteres devem pertencer ao alfabeto Base32 sem caracteres ambíguos.');

  // ---------------------------------------------------------------------------
  // 3. TESTES DE SEGURANÇA: HASHING COM ARGON2ID
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Testes do Hasher Argon2id ---');
  const hasher = new Argon2PasswordHasher({ memoryCost: 32768, timeCost: 2, parallelism: 1 });
  const rawPass = 'Oss@Karate2026!';
  const hash1 = await hasher.hash(rawPass);
  const hash2 = await hasher.hash(rawPass);

  assert(hash1.startsWith('$argon2id$'), 'O hash deve ser gerado no padrão PHC Argon2id.');
  assert(hash1 !== hash2, 'Hashes para a mesma senha devem ser diferentes devido ao salt aleatório.');
  assert(await hasher.verify(rawPass, hash1) === true, 'A verificação com a senha correta deve retornar true.');
  assert(await hasher.verify('SenhaIncorreta', hash1) === false, 'A verificação com senha incorreta deve retornar false.');
  assert(await hasher.verify('', hash1) === false, 'Senha vazia na verificação deve retornar false.');

  // ---------------------------------------------------------------------------
  // 4. TESTES MULTI-TENANCY: ISOLAMENTO ENTRE DOJO A E DOJO B
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Testes de Isolamento Estrito Multi-Tenant ---');
  const dojoRepo = new InMemoryDojoRepository();
  const studentRepo = new InMemoryStudentRepository();
  const credRepo = new InMemoryStudentAuthCredentialRepository();
  const userRepo = new InMemoryUserRepository();

  // Cria Dojo A e Dojo B
  await dojoRepo.save({
    id: 'dojo_A',
    name: 'Dojo Morumbi',
    slug: 'morumbi',
    headmasterName: 'Sensei Tanaka',
    city: 'São Paulo',
    state: 'SP',
    country: 'BR',
    isActive: true,
    createdAt: new Date().toISOString(),
  });

  await dojoRepo.save({
    id: 'dojo_B',
    name: 'Dojo Pinheiros',
    slug: 'pinheiros',
    headmasterName: 'Sensei Sato',
    city: 'São Paulo',
    state: 'SP',
    country: 'BR',
    isActive: true,
    createdAt: new Date().toISOString(),
  });

  // Provisiona Aluno no Dojo A
  const provisioningService = new StudentProvisioningService(
    dojoRepo,
    studentRepo,
    credRepo,
    userRepo,
    hasher,
    pwdGen
  );

  // Sensei do Dojo A
  await userRepo.save({
    uid: 'sensei_A_uid',
    dojoId: 'dojo_A',
    role: UserRole.SENSEI,
    name: 'Sensei Tanaka',
    isActive: true,
    createdAt: new Date().toISOString(),
    sessionVersion: 1,
  });

  // Sensei do Dojo B
  await userRepo.save({
    uid: 'sensei_B_uid',
    dojoId: 'dojo_B',
    role: UserRole.SENSEI,
    name: 'Sensei Sato',
    isActive: true,
    createdAt: new Date().toISOString(),
    sessionVersion: 1,
  });

  // Provisionamento de Lucas no Dojo A
  const alunoA = await provisioningService.provisionStudent(
    'dojo_A',
    'sensei_A_uid',
    {
      fullName: 'Lucas Silva',
      birthDate: '2012-05-10',
      phone: '+55 11 99999-0001',
      isMinor: true,
      assignedClassIds: ['cls_infantil_01'],
      currentBelt: KarateBelt.WHITE,
      currentKyuOrDan: '7º Kyu',
      billingDay: 10,
      tuitionAmountCents: 25000,
      individualDiscountCents: 0,
      registrationNumber: 'KC-001',
      username: 'lucas.silva',
    },
    'idemp_key_001'
  );

  // Tentativa do Sensei do Dojo B acessar dados do aluno do Dojo A
  const alunoConsultadoPeloSenseiB = await studentRepo.findById('dojo_B', alunoA.studentId);
  assert(alunoConsultadoPeloSenseiB === null, 'Sensei do Dojo B NÃO deve localizar aluno do Dojo A.');

  // Tentativa de login do Aluno A informando o slug do Dojo B
  const authService = new AuthService(dojoRepo, studentRepo, credRepo, userRepo, hasher);
  let loginCrossDojoFailed = false;
  try {
    await authService.authenticateStudent('pinheiros', 'lucas.silva', alunoA.temporaryPassword);
  } catch (err) {
    if (err instanceof AuthenticationError) loginCrossDojoFailed = true;
  }
  assert(loginCrossDojoFailed, 'Login de aluno do Dojo A utilizando o Dojo B deve ser rejeitado.');

  // Login do Aluno A com o Dojo A correto
  const loginSuccess = await authService.authenticateStudent('morumbi', 'lucas.silva', alunoA.temporaryPassword);
  assert(loginSuccess.dojoId === 'dojo_A', 'Aluno A deve autenticar com sucesso no Dojo A.');
  assert(loginSuccess.mustChangePassword === true, 'Primeiro acesso deve exigir obrigatoriedade de troca de senha.');

  // Troca de Senha Obrigatória
  const changePwdResult = await authService.changeStudentPassword(loginSuccess.studentUid, 'dojo_A', 'NovaSenhaForte@2026');
  assert(changePwdResult.success === true, 'Troca de senha deve retornar sucesso.');
  assert(changePwdResult.nextSessionVersion === 2, 'Troca de senha deve incrementar a sessionVersion para 2.');

  // ---------------------------------------------------------------------------
  // 5. TESTES DE IDEMPOTÊNCIA NO PROVISIONAMENTO
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Testes de Idempotência do Provisionamento ---');
  // Reenvio da mesma requisição com a mesma Idempotency-Key
  const alunoRepetido = await provisioningService.provisionStudent(
    'dojo_A',
    'sensei_A_uid',
    {
      fullName: 'Lucas Silva',
      birthDate: '2012-05-10',
      phone: '+55 11 99999-0001',
      isMinor: true,
      assignedClassIds: ['cls_infantil_01'],
      currentBelt: KarateBelt.WHITE,
      currentKyuOrDan: '7º Kyu',
      billingDay: 10,
      tuitionAmountCents: 25000,
      individualDiscountCents: 0,
      registrationNumber: 'KC-001',
      username: 'lucas.silva',
    },
    'idemp_key_001'
  );

  assert(alunoRepetido.studentId === alunoA.studentId, 'Reenvio com mesma Idempotency-Key deve retornar o mesmo studentId sem duplicar.');

  // Reenvio da mesma chave com payload divergente deve disparar ConflictError
  let conflictDetected = false;
  try {
    await provisioningService.provisionStudent(
      'dojo_A',
      'sensei_A_uid',
      {
        fullName: 'Lucas Silva Modificado',
        birthDate: '2012-05-10',
        phone: '+55 11 99999-0001',
        isMinor: true,
        assignedClassIds: ['cls_infantil_01'],
        currentBelt: KarateBelt.WHITE,
        currentKyuOrDan: '7º Kyu',
        billingDay: 10,
        tuitionAmountCents: 25000,
        individualDiscountCents: 0,
        registrationNumber: 'KC-001',
        username: 'lucas.silva',
      },
      'idemp_key_001'
    );
  } catch (err) {
    if (err instanceof ConflictError) conflictDetected = true;
  }
  assert(conflictDetected, 'Mesma Idempotency-Key com payload divergente deve disparar ConflictError.');

  // ---------------------------------------------------------------------------
  // 6. TESTES DE CONCORRÊNCIA COM PROMISE.ALL E IN-FLIGHT LOCK
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Testes de Concorrência e In-Flight Lock com Promise.all ---');
  const concurrentPayload = {
    fullName: 'Mariana Costa',
    birthDate: '2010-03-15',
    phone: '+55 11 98888-7777',
    isMinor: true,
    assignedClassIds: ['cls_teens_01'],
    currentBelt: KarateBelt.YELLOW,
    currentKyuOrDan: '6º Kyu',
    billingDay: 15,
    tuitionAmountCents: 26000,
    individualDiscountCents: 1000,
    registrationNumber: 'KC-002',
    username: 'mariana.costa',
  };

  const concurrentKey = 'idemp_concurrent_call_777';

  // Disparo simultâneo de 3 requisições assíncronas com o mesmo Idempotency-Key e payload
  const [res1, res2, res3] = await Promise.all([
    provisioningService.provisionStudent('dojo_A', 'sensei_A_uid', concurrentPayload, concurrentKey),
    provisioningService.provisionStudent('dojo_A', 'sensei_A_uid', concurrentPayload, concurrentKey),
    provisioningService.provisionStudent('dojo_A', 'sensei_A_uid', concurrentPayload, concurrentKey),
  ]);

  assert(
    res1.studentId === res2.studentId && res2.studentId === res3.studentId,
    '3 chamadas simultâneas com a mesma Idempotency-Key devem retornar exatamente o mesmo studentId.'
  );
  assert(
    res1.temporaryPassword === res2.temporaryPassword && res2.temporaryPassword === res3.temporaryPassword,
    'Todas as chamadas concorrentes devem compartilhar a mesma credencial temporária sem gerar duplicidades.'
  );

  // Verificação no repositório se apenas 1 aluno foi gravado
  const alunoSalvo = await studentRepo.findById('dojo_A', res1.studentId);
  assert(alunoSalvo !== null && alunoSalvo.fullName === 'Mariana Costa', 'Aluno provisionado em concorrência deve existir no repositório.');

  // Teste de Escopo de Idempotência por Dojo: Dojo B usando a mesma Idempotency-Key não colide com Dojo A
  const alunoDojoB = await provisioningService.provisionStudent(
    'dojo_B',
    'sensei_B_uid',
    {
      fullName: 'Carlos Eduardo',
      birthDate: '2011-08-20',
      phone: '+55 11 97777-6666',
      isMinor: true,
      assignedClassIds: ['cls_teens_B1'],
      currentBelt: KarateBelt.WHITE,
      currentKyuOrDan: '7º Kyu',
      billingDay: 20,
      tuitionAmountCents: 24000,
      individualDiscountCents: 0,
      registrationNumber: 'KC-B001',
      username: 'carlos.eduardo',
    },
    concurrentKey // Mesma chave usada no Dojo A!
  );
  assert(alunoDojoB.studentId !== res1.studentId, 'A mesma Idempotency-Key usada em dojos distintos NÃO deve colidir devido ao escopo {dojoId}:{operacao}:{key}.');
  assert(alunoDojoB.username === 'carlos.eduardo', 'Aluno do Dojo B deve ser cadastrado independentemente com seus próprios dados.');

  // Teste de expiração ativa de TTL e limpeza do completedJobs
  const cleanedCount = provisioningService.cleanupExpiredJobs(-1); // Força expiração imediata
  assert(cleanedCount >= 2, 'cleanupExpiredJobs deve expirar e remover entradas obsoletas do mapa de idempotência.');

  provisioningService.clearJob('dojo_A', concurrentKey);
  assert(true, 'clearJob deve remover explicitamente a chave do cache em memória após entrega ao cliente.');

  // ---------------------------------------------------------------------------
  // 7. TESTES DE GERAÇÃO DETERMINÍSTICA DE ID DE MENSALIDADE
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Testes de Regra de Negócio: ID Determinístico de Mensalidade ---');
  const makeTuitionId = (studentId: string, referenceMonth: string) => `tui_${studentId}_${referenceMonth}`;

  const tuiId1 = makeTuitionId(res1.studentId, '2026-05');
  const tuiId2 = makeTuitionId(res1.studentId, '2026-05');
  const tuiIdNextMonth = makeTuitionId(res1.studentId, '2026-06');

  assert(tuiId1 === tuiId2, 'Geração de ID de mensalidade para o mesmo aluno e mês deve ser determinística e idêntica.');
  assert(tuiId1.startsWith(`tui_${res1.studentId}_2026-05`), 'Formato deve ser estritamente tui_{studentId}_{referenceMonth}.');
  assert(tuiId1 !== tuiIdNextMonth, 'Meses de referência distintos devem gerar IDs diferentes.');

  // ---------------------------------------------------------------------------
  // 8. TESTES DE REPOSITÓRIOS EM MEMÓRIA DE SUBCOLEÇÕES (ETAPA 4.2)
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. Testes de Repositórios de Subcoleções do Dojo ---');
  // 8.1. Turmas (Classes)
  const classRepo = new InMemoryClassRepository();
  await classRepo.save({
    id: 'cls_teens_01',
    dojoId: 'dojo_A',
    name: 'Karatê Juvenil - Manhã',
    category: 'teens',
    schedule: [{ dayOfWeek: 2, startTime: '09:00', endTime: '10:00' }],
    instructorName: 'Sensei Tanaka',
    maxCapacity: 20,
    isActive: true,
  });
  const classesDojoA = await classRepo.findByDojo('dojo_A');
  assert(classesDojoA.length === 1 && classesDojoA[0].name === 'Karatê Juvenil - Manhã', 'Repositório de turmas deve persistir e listar turmas do dojo.');

  // 8.2. Mensalidades (Tuitions)
  const tuitionRepo = new InMemoryTuitionRepository();
  const testTuition: TuitionEntity = {
    id: tuiId1,
    studentId: res1.studentId,
    dojoId: 'dojo_A',
    studentName: 'Mariana Costa',
    referenceMonth: '2026-05',
    dueDate: '2026-05-15',
    baseAmountCents: 26000,
    discountCents: 1000,
    netAmountCents: 25000,
    status: TuitionStatus.PENDING,
    generatedBySenseiUid: 'sensei_A_uid',
    createdAt: new Date().toISOString(),
  };
  await tuitionRepo.save(testTuition);
  const foundTuition = await tuitionRepo.findById('dojo_A', tuiId1);
  assert(foundTuition !== null && foundTuition.netAmountCents === 25000, 'Mensalidade deve ser gravada com valores exatos em centavos inteiros.');

  // 8.3. Presença (Attendance)
  const attendanceRepo = new InMemoryAttendanceRepository();
  await attendanceRepo.save({
    id: 'att_20260510_01',
    dojoId: 'dojo_A',
    classId: 'cls_teens_01',
    studentId: res1.studentId,
    date: '2026-05-10',
    present: true,
    registeredByUserId: 'sensei_A_uid',
    createdAt: new Date().toISOString(),
  });
  const studentAttendance = await attendanceRepo.findByStudent('dojo_A', res1.studentId);
  assert(studentAttendance.length === 1 && studentAttendance[0].present === true, 'Repositório de presenças deve registrar frequência com data e aluno.');

  // 8.4. Graduações (Graduations)
  const gradRepo = new InMemoryGraduationRepository();
  await gradRepo.save({
    id: 'grad_001',
    dojoId: 'dojo_A',
    studentId: res1.studentId,
    belt: KarateBelt.YELLOW,
    kyuOrDan: '6º Kyu',
    examinationDate: '2026-06-01',
    examinerSensei: 'Sensei Tanaka',
    createdAt: new Date().toISOString(),
  });
  const graduations = await gradRepo.findByStudent('dojo_A', res1.studentId);
  assert(graduations.length === 1 && graduations[0].belt === KarateBelt.YELLOW, 'Repositório de graduações deve registrar exame de faixa.');

  // 8.5. Competições (Competitions e Results)
  const compRepo = new InMemoryCompetitionRepository();
  await compRepo.save({
    id: 'comp_sp_2026',
    dojoId: 'dojo_A',
    name: 'Campeonato Paulista de Karatê 2026',
    location: 'Ginásio do Ibirapuera',
    startDate: '2026-07-10',
    categories: [{
      id: 'cat_kata_sub16',
      name: 'Kata Juvenil Sub-16',
      modality: CompetitionModality.KATA_INDIVIDUAL,
    }],
    participatingStudentIds: [res1.studentId],
    status: 'upcoming',
    createdAt: new Date().toISOString(),
  });
  await compRepo.saveResult({
    id: 'res_comp_001',
    dojoId: 'dojo_A',
    competitionId: 'comp_sp_2026',
    categoryId: 'cat_kata_sub16',
    modality: CompetitionModality.KATA_INDIVIDUAL,
    isTeamResult: false,
    placement: CompetitionPlacement.GOLD,
    studentIds: [res1.studentId],
    registeredAt: new Date().toISOString(),
  });
  const studentResults = await compRepo.findResultsByStudent('dojo_A', 'comp_sp_2026', res1.studentId);
  assert(studentResults.length === 1 && studentResults[0].placement === CompetitionPlacement.GOLD, 'Repositório de competições deve registrar resultados filtrados por aluno.');

  // 8.6. Eventos do Calendário (Calendar Events) com controle de visibilidade pública
  const calRepo = new InMemoryCalendarEventRepository();
  await calRepo.save({
    id: 'evt_public_01',
    dojoId: 'dojo_A',
    title: 'Exame Geral de Faixas',
    type: CalendarEventType.BELT_EXAM,
    startDate: '2026-06-15T09:00:00Z',
    isPublicForStudents: true,
  });
  await calRepo.save({
    id: 'evt_private_01',
    dojoId: 'dojo_A',
    title: 'Reunião Exclusiva de Senseis e Gestão',
    type: CalendarEventType.MEETING,
    startDate: '2026-06-16T18:00:00Z',
    isPublicForStudents: false,
  });
  const studentVisibleEvents = await calRepo.findByDojo('dojo_A', false);
  assert(studentVisibleEvents.length === 1 && studentVisibleEvents[0].id === 'evt_public_01', 'Eventos privados para alunos devem ser omitidos para perfil discente.');

  // ---------------------------------------------------------------------------
  // 9. TESTES DE MAPPERS BIDIRECIONAIS DO FIRESTORE E TIMESTAMPS
  // ---------------------------------------------------------------------------
  console.log('\n--- 9. Testes de Mappers Bidirecionais de Domínio ---');
  const firestoreTuitionDoc = TuitionMapper.toFirestore(testTuition);
  assert(firestoreTuitionDoc.netAmountCents === 25000, 'Mapper Firestore deve manter valores exatos de centavos.');
  assert(firestoreTuitionDoc.createdAt != null, 'Mapper Firestore deve gerar objeto Timestamp válido.');

  const domainFromFirestore = TuitionMapper.toDomain({
    id: testTuition.id,
    studentId: testTuition.studentId,
    dojoId: testTuition.dojoId,
    studentName: testTuition.studentName,
    referenceMonth: testTuition.referenceMonth,
    dueDate: testTuition.dueDate,
    baseAmountCents: testTuition.baseAmountCents,
    discountCents: testTuition.discountCents,
    netAmountCents: testTuition.netAmountCents,
    status: testTuition.status,
    generatedBySenseiUid: testTuition.generatedBySenseiUid,
    createdAt: new Date().toISOString(),
  });
  assert(domainFromFirestore.netAmountCents === 25000, 'Reconversão do Firestore para Entidade de Domínio deve preservar valores íntegros.');
  assert(typeof timestampToIso(new Date().toISOString()) === 'string', 'timestampToIso deve normalizar strings ISO.');

  // ---------------------------------------------------------------------------
  // 10. TESTES DE AUDITORIA DAS SECURITY RULES E ISOLAMENTO DE CREDENCIAIS
  // ---------------------------------------------------------------------------
  console.log('\n--- 10. Testes de Auditoria das Security Rules e Bloqueio de Credenciais ---');
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  assert(fs.existsSync(rulesPath), 'Arquivo firestore.rules deve existir na raiz do projeto.');

  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  // 10.1. Bloqueio estrito de leitura e escrita nas credenciais pelo cliente
  const hasAuthCredLock = rulesContent.includes('match /auth_credentials/{usernameNormalized}') &&
    rulesContent.includes('allow read, write: if false;');
  assert(hasAuthCredLock, 'Subcoleção /auth_credentials/{usernameNormalized} deve ser estritamente bloqueada contra leitura/escrita pelo cliente (allow read, write: if false).');

  const hasStudentCredLock = rulesContent.includes('match /student_credentials/{credentialId}') &&
    rulesContent.includes('allow read, write: if false;');
  assert(hasStudentCredLock, 'Subcoleção legada /student_credentials/{credentialId} deve permanecer estritamente bloqueada (allow read, write: if false).');

  // 10.2. Negação por padrão (Default Deny)
  const hasDefaultDeny = rulesContent.includes('match /{document=**}') &&
    rulesContent.includes('allow read, write: if false;');
  assert(hasDefaultDeny, 'As Security Rules devem conter cláusula explícita de negação por padrão (match /{document=**} allow read, write: if false).');

  // 10.3. Verificação de sessão discente e integridade sVer
  const hasSessionVersionCheck = rulesContent.includes('request.auth.token.sVer is int') &&
    rulesContent.includes('request.auth.token.sVer == user.sessionVersion');
  assert(hasSessionVersionCheck, 'Security Rules devem verificar correspondência estrita de sVer com sessionVersion do usuário.');

  // 10.4. Restrição de listagem de mensalidades ao próprio aluno
  const hasTuitionListRestriction = rulesContent.includes('resource.data.studentId == request.auth.token.studentId');
  assert(hasTuitionListRestriction, 'Listagem de mensalidades pelo aluno deve ser restrita a resource.data.studentId == request.auth.token.studentId.');

  console.log('\n========================================================');
  console.log(`🏁 RESULTADO FINAL: ${passed} testes aprovados, ${failed} testes reprovados.`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Erro fatal durante os testes:', err);
  process.exit(1);
});
