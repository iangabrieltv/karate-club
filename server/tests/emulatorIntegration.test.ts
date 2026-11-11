/**
 * Karate Club - Suíte de Testes de Integração Real com Firebase Local Emulator Suite
 * 
 * Executa contra o Cloud Firestore Emulator (localhost:8080)
 * 1. Validação Real das Firestore Security Rules (@firebase/rules-unit-testing)
 * 2. Validação Real dos Dez Adaptadores de Repositório Firestore
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { getFirestore, doc, getDoc, updateDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getFirestoreDb } from '../src/infrastructure/firestore/config/firebaseAdmin';
import {
  FirestoreUserRepository,
  FirestoreDojoRepository,
  FirestoreStudentRepository,
  FirestoreStudentAuthCredentialRepository,
  FirestoreClassRepository,
  FirestoreTuitionRepository,
  FirestoreAttendanceRepository,
  FirestoreGraduationRepository,
  FirestoreCompetitionRepository,
  FirestoreCalendarEventRepository,
} from '../src/infrastructure/firestore/repositories/firestoreRepositories';
import {
  UserRole,
  StudentStatus,
  KarateBelt,
  TuitionStatus,
  PaymentMethod,
  CompetitionModality,
  CompetitionPlacement,
  CalendarEventType,
} from '../src/domain/enums';

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

async function runEmulatorIntegrationSuite() {
  console.log('\n🥋 =========================================================================');
  console.log('🥋 KARATE CLUB — SUÍTE DE INTEGRAÇÃO REAL COM FIRESTORE EMULATOR');
  console.log('🥋 =========================================================================\n');

  const projectId = 'test-karate-club';
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');

  console.log('--- 1. Inicializando Ambiente de Testes do Firestore Emulator ---');
  const testEnv: RulesTestEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules,
    },
  });

  // Limpa o banco de testes antes de começar
  await testEnv.clearFirestore();

  // ---------------------------------------------------------------------------
  // SEED DE DADOS ADMINISTRATIVOS (com regras de segurança desativadas)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Populando Dados de Teste no Emulador ---');
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    // 1. Dojos
    await setDoc(doc(db, 'dojos/dojo_A'), {
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

    await setDoc(doc(db, 'dojos/dojo_B'), {
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

    // 2. Perfis de Usuários (/users/{uid})
    await setDoc(doc(db, 'users/sensei_a_uid'), {
      uid: 'sensei_a_uid',
      dojoId: 'dojo_A',
      role: 'sensei',
      name: 'Sensei Tanaka',
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
    });

    await setDoc(doc(db, 'users/sensei_b_uid'), {
      uid: 'sensei_b_uid',
      dojoId: 'dojo_B',
      role: 'sensei',
      name: 'Sensei Sato',
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
    });

    await setDoc(doc(db, 'users/alice_uid'), {
      uid: 'alice_uid',
      dojoId: 'dojo_A',
      role: 'student',
      name: 'Alice Silva',
      studentId: 'std_alice',
      isActive: true,
      sessionVersion: 1,
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
    });

    await setDoc(doc(db, 'users/bob_uid'), {
      uid: 'bob_uid',
      dojoId: 'dojo_A',
      role: 'student',
      name: 'Bob Souza',
      studentId: 'std_bob',
      isActive: true,
      sessionVersion: 1,
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
    });

    await setDoc(doc(db, 'users/inactive_uid'), {
      uid: 'inactive_uid',
      dojoId: 'dojo_A',
      role: 'student',
      name: 'Inactive Student',
      studentId: 'std_inactive',
      isActive: false, // Inativo!
      sessionVersion: 1,
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
    });

    // 3. Alunos (/dojos/{dojoId}/students/{studentId})
    await setDoc(doc(db, 'dojos/dojo_A/students/std_alice'), {
      id: 'std_alice',
      userId: 'alice_uid',
      dojoId: 'dojo_A',
      fullName: 'Alice Silva',
      status: 'active',
      birthDate: '2010-01-01',
      phone: '+55 11 90000-0001',
      isMinor: true,
      assignedClassIds: ['cls_01'],
      currentBelt: 'branca',
      currentKyuOrDan: '7º Kyu',
      enrolledAt: new Date().toISOString(),
      billingDay: 10,
      tuitionAmountCents: 25000,
      individualDiscountCents: 0,
      registrationNumber: 'KC-A01',
    });

    await setDoc(doc(db, 'dojos/dojo_A/students/std_bob'), {
      id: 'std_bob',
      userId: 'bob_uid',
      dojoId: 'dojo_A',
      fullName: 'Bob Souza',
      status: 'active',
      birthDate: '2009-02-02',
      phone: '+55 11 90000-0002',
      isMinor: true,
      assignedClassIds: ['cls_01'],
      currentBelt: 'amarela',
      currentKyuOrDan: '6º Kyu',
      enrolledAt: new Date().toISOString(),
      billingDay: 10,
      tuitionAmountCents: 25000,
      individualDiscountCents: 0,
      registrationNumber: 'KC-A02',
    });

    await setDoc(doc(db, 'dojos/dojo_A/students/std_inactive'), {
      id: 'std_inactive',
      userId: 'inactive_uid',
      dojoId: 'dojo_A',
      fullName: 'Inactive Student',
      status: 'inactive',
      birthDate: '2008-03-03',
      phone: '+55 11 90000-0003',
      isMinor: false,
      assignedClassIds: [],
      currentBelt: 'branca',
      currentKyuOrDan: '7º Kyu',
      enrolledAt: new Date().toISOString(),
      billingDay: 10,
      tuitionAmountCents: 25000,
      individualDiscountCents: 0,
      registrationNumber: 'KC-A03',
    });

    // 4. Credenciais (/dojos/{dojoId}/auth_credentials/{usernameNormalized})
    await setDoc(doc(db, 'dojos/dojo_A/auth_credentials/alice.silva'), {
      usernameNormalized: 'alice.silva',
      dojoId: 'dojo_A',
      studentId: 'std_alice',
      userId: 'alice_uid',
      passwordHash: '$argon2id$mock_hash_alice',
      algorithm: 'argon2id',
      mustChangePassword: false,
      failedAttempts: 0,
      lockedUntil: null,
      sessionVersion: 1,
    });

    // 5. Turmas
    await setDoc(doc(db, 'dojos/dojo_A/classes/cls_01'), {
      id: 'cls_01',
      dojoId: 'dojo_A',
      name: 'Turma Infantil A',
      category: 'kids',
      schedule: [{ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }],
      instructorName: 'Sensei Tanaka',
      maxCapacity: 20,
      isActive: true,
    });

    // 6. Mensalidades
    await setDoc(doc(db, 'dojos/dojo_A/tuitions/tui_std_alice_2026-05'), {
      id: 'tui_std_alice_2026-05',
      studentId: 'std_alice',
      dojoId: 'dojo_A',
      studentName: 'Alice Silva',
      referenceMonth: '2026-05',
      dueDate: '2026-05-10',
      baseAmountCents: 25000,
      discountCents: 0,
      netAmountCents: 25000,
      status: 'pending',
      generatedBySenseiUid: 'sensei_a_uid',
      createdAt: new Date().toISOString(),
    });

    await setDoc(doc(db, 'dojos/dojo_A/tuitions/tui_std_bob_2026-05'), {
      id: 'tui_std_bob_2026-05',
      studentId: 'std_bob',
      dojoId: 'dojo_A',
      studentName: 'Bob Souza',
      referenceMonth: '2026-05',
      dueDate: '2026-05-10',
      baseAmountCents: 25000,
      discountCents: 0,
      netAmountCents: 25000,
      status: 'pending',
      generatedBySenseiUid: 'sensei_a_uid',
      createdAt: new Date().toISOString(),
    });

    // 7. Frequência / Presença
    await setDoc(doc(db, 'dojos/dojo_A/attendance/att_alice_01'), {
      id: 'att_alice_01',
      dojoId: 'dojo_A',
      classId: 'cls_01',
      studentId: 'std_alice',
      date: '2026-05-10',
      present: true,
      registeredByUserId: 'sensei_a_uid',
      createdAt: new Date().toISOString(),
    });

    await setDoc(doc(db, 'dojos/dojo_A/attendance/att_bob_01'), {
      id: 'att_bob_01',
      dojoId: 'dojo_A',
      classId: 'cls_01',
      studentId: 'std_bob',
      date: '2026-05-10',
      present: true,
      registeredByUserId: 'sensei_a_uid',
      createdAt: new Date().toISOString(),
    });

    // 8. Graduações
    await setDoc(doc(db, 'dojos/dojo_A/graduations/grad_alice_01'), {
      id: 'grad_alice_01',
      dojoId: 'dojo_A',
      studentId: 'std_alice',
      belt: 'amarela',
      kyuOrDan: '6º Kyu',
      examinationDate: '2026-06-01',
      examinerSensei: 'Sensei Tanaka',
      createdAt: new Date().toISOString(),
    });

    await setDoc(doc(db, 'dojos/dojo_A/graduations/grad_bob_01'), {
      id: 'grad_bob_01',
      dojoId: 'dojo_A',
      studentId: 'std_bob',
      belt: 'verde',
      kyuOrDan: '5º Kyu',
      examinationDate: '2026-06-01',
      examinerSensei: 'Sensei Tanaka',
      createdAt: new Date().toISOString(),
    });

    // 9. Competições e Resultados
    await setDoc(doc(db, 'dojos/dojo_A/competitions/comp_01'), {
      id: 'comp_01',
      dojoId: 'dojo_A',
      name: 'Campeonato Paulista 2026',
      location: 'São Paulo',
      startDate: '2026-07-01',
      categories: [{ id: 'cat_01', name: 'Kata Sub-16', modality: 'kata_individual' }],
      participatingStudentIds: ['std_alice', 'std_bob'],
      status: 'upcoming',
      createdAt: new Date().toISOString(),
    });

    await setDoc(doc(db, 'dojos/dojo_A/competitions/comp_01/results/res_alice'), {
      id: 'res_alice',
      dojoId: 'dojo_A',
      competitionId: 'comp_01',
      categoryId: 'cat_01',
      modality: 'kata_individual',
      isTeamResult: false,
      studentIds: ['std_alice'],
      placement: 'gold',
      registeredAt: new Date().toISOString(),
    });

    await setDoc(doc(db, 'dojos/dojo_A/competitions/comp_01/results/res_bob'), {
      id: 'res_bob',
      dojoId: 'dojo_A',
      competitionId: 'comp_01',
      categoryId: 'cat_01',
      modality: 'kata_individual',
      isTeamResult: false,
      studentIds: ['std_bob'],
      placement: 'silver',
      registeredAt: new Date().toISOString(),
    });

    // 10. Calendário
    await setDoc(doc(db, 'dojos/dojo_A/calendar_events/evt_public'), {
      id: 'evt_public',
      dojoId: 'dojo_A',
      title: 'Exame de Faixa',
      type: 'belt_exam',
      startDate: '2026-06-15T09:00:00Z',
      isPublicForStudents: true,
    });

    await setDoc(doc(db, 'dojos/dojo_A/calendar_events/evt_private'), {
      id: 'evt_private',
      dojoId: 'dojo_A',
      title: 'Reunião Restrita de Senseis',
      type: 'meeting',
      startDate: '2026-06-16T18:00:00Z',
      isPublicForStudents: false,
    });
  });

  // ---------------------------------------------------------------------------
  // CONTEXTOS DE AUTENTICAÇÃO SIMULADOS (com claims validadas)
  // ---------------------------------------------------------------------------
  const aliceContext = testEnv.authenticatedContext('alice_uid', {
    role: 'student',
    studentId: 'std_alice',
    sVer: 1,
    mustChangePassword: false,
  });

  const bobContext = testEnv.authenticatedContext('bob_uid', {
    role: 'student',
    studentId: 'std_bob',
    sVer: 1,
    mustChangePassword: false,
  });

  const senseiAContext = testEnv.authenticatedContext('sensei_a_uid', {
    role: 'sensei',
  });

  const senseiBContext = testEnv.authenticatedContext('sensei_b_uid', {
    role: 'sensei',
  });

  const inactiveUserContext = testEnv.authenticatedContext('inactive_uid', {
    role: 'student',
    studentId: 'std_inactive',
    sVer: 1,
    mustChangePassword: false,
  });

  const aliceDivergentSessionContext = testEnv.authenticatedContext('alice_uid', {
    role: 'student',
    studentId: 'std_alice',
    sVer: 999, // Divergente da sessionVersion = 1
    mustChangePassword: false,
  });

  // ---------------------------------------------------------------------------
  // 3. EXECUÇÃO DOS 12 TESTES REAIS DAS SECURITY RULES
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Testes Reais das Firestore Security Rules contra o Emulator ---');

  // 3.1. Aluno não consegue acessar dados de outro dojo
  await assertFails(
    getDoc(doc(aliceContext.firestore(), 'dojos/dojo_B/students/std_fake'))
  );
  assert(true, '1. Aluno do Dojo A é bloqueado ao tentar acessar subcoleção do Dojo B.');

  // 3.2. Aluno não consegue consultar o cadastro de outro aluno
  await assertFails(
    getDoc(doc(aliceContext.firestore(), 'dojos/dojo_A/students/std_bob'))
  );
  assert(true, '2. Aluno Alice é bloqueada ao consultar prontuário de Bob.');

  // 3.2 (Positivo). Aluno consulta o próprio cadastro
  await assertSucceeds(
    getDoc(doc(aliceContext.firestore(), 'dojos/dojo_A/students/std_alice'))
  );
  assert(true, '2+ Aluno Alice acessa com sucesso seu próprio prontuário.');

  // 3.3. Aluno só consegue consultar suas próprias mensalidades
  await assertFails(
    getDoc(doc(aliceContext.firestore(), 'dojos/dojo_A/tuitions/tui_std_bob_2026-05'))
  );
  assert(true, '3. Aluno Alice é bloqueada ao tentar ler mensalidade de Bob.');

  await assertSucceeds(
    getDoc(doc(aliceContext.firestore(), 'dojos/dojo_A/tuitions/tui_std_alice_2026-05'))
  );
  assert(true, '3+ Aluno Alice acessa com sucesso sua própria mensalidade.');

  // 3.4. Aluno só consegue consultar sua própria frequência
  await assertFails(
    getDoc(doc(aliceContext.firestore(), 'dojos/dojo_A/attendance/att_bob_01'))
  );
  assert(true, '4. Aluno Alice é bloqueada ao tentar ler frequência de Bob.');

  await assertSucceeds(
    getDoc(doc(aliceContext.firestore(), 'dojos/dojo_A/attendance/att_alice_01'))
  );
  assert(true, '4+ Aluno Alice acessa com sucesso seu próprio registro de presença.');

  // 3.5. Aluno só consegue consultar suas graduações
  await assertFails(
    getDoc(doc(aliceContext.firestore(), 'dojos/dojo_A/graduations/grad_bob_01'))
  );
  assert(true, '5. Aluno Alice é bloqueada ao tentar ler exame de graduação de Bob.');

  await assertSucceeds(
    getDoc(doc(aliceContext.firestore(), 'dojos/dojo_A/graduations/grad_alice_01'))
  );
  assert(true, '5+ Aluno Alice acessa com sucesso seu próprio histórico de graduação.');

  // 3.6. Aluno só consegue consultar resultados de competições das quais participa
  await assertFails(
    getDoc(doc(aliceContext.firestore(), 'dojos/dojo_A/competitions/comp_01/results/res_bob'))
  );
  assert(true, '6. Aluno Alice é bloqueada ao acessar resultado de competição exclusivo de Bob.');

  await assertSucceeds(
    getDoc(doc(aliceContext.firestore(), 'dojos/dojo_A/competitions/comp_01/results/res_alice'))
  );
  assert(true, '6+ Aluno Alice acessa resultado da competição da qual participou.');

  // 3.7. Aluno não consegue acessar eventos privados
  await assertFails(
    getDoc(doc(aliceContext.firestore(), 'dojos/dojo_A/calendar_events/evt_private'))
  );
  assert(true, '7. Aluno Alice é bloqueada ao tentar ler evento de calendário privado.');

  await assertSucceeds(
    getDoc(doc(aliceContext.firestore(), 'dojos/dojo_A/calendar_events/evt_public'))
  );
  assert(true, '7+ Aluno Alice acessa evento de calendário público para alunos.');

  // 3.8. Aluno não consegue ler ou escrever em auth_credentials
  await assertFails(
    getDoc(doc(aliceContext.firestore(), 'dojos/dojo_A/auth_credentials/alice.silva'))
  );
  await assertFails(
    setDoc(doc(aliceContext.firestore(), 'dojos/dojo_A/auth_credentials/hack'), { malicious: true })
  );
  assert(true, '8. Aluno Alice tem leitura e escrita bloqueadas em /auth_credentials (allow read, write: if false).');

  // 3.9. Aluno não consegue alterar dados administrativos
  await assertFails(
    updateDoc(doc(aliceContext.firestore(), 'dojos/dojo_A/classes/cls_01'), { name: 'Nome Alterado' })
  );
  await assertFails(
    setDoc(doc(aliceContext.firestore(), 'dojos/dojo_A/tuitions/tui_fake'), { netAmountCents: 0 })
  );
  assert(true, '9. Aluno Alice é impedida de alterar turmas ou criar mensalidades arbitrariamente.');

  // 3.10. Sensei não consegue acessar dados de outro dojo
  await assertFails(
    getDoc(doc(senseiAContext.firestore(), 'dojos/dojo_B/students/std_fake'))
  );
  assert(true, '10. Sensei do Dojo A é bloqueado ao tentar acessar alunos do Dojo B.');

  await assertSucceeds(
    getDoc(doc(senseiAContext.firestore(), 'dojos/dojo_A/students/std_alice'))
  );
  assert(true, '10+ Sensei do Dojo A acessa com sucesso os alunos de seu próprio dojo.');

  // 3.11. Usuário inativo não consegue utilizar as permissões de aluno
  await assertFails(
    getDoc(doc(inactiveUserContext.firestore(), 'dojos/dojo_A/students/std_inactive'))
  );
  assert(true, '11. Usuário inativo é rejeitado pelas Security Rules (isUserActive == false).');

  // 3.12. Sessão com sessionVersion divergente deve ser rejeitada
  await assertFails(
    getDoc(doc(aliceDivergentSessionContext.firestore(), 'dojos/dojo_A/students/std_alice'))
  );
  assert(true, '12. Sessão com sVer desatualizado é rejeitada pelas Security Rules (sVer != sessionVersion).');

  // 3.13. Consultas de Listagem (getDocs): Aluno NÃO pode listar a coleção inteira de alunos
  await assertFails(
    getDocs(collection(aliceContext.firestore(), 'dojos/dojo_A/students'))
  );
  assert(true, '13. Aluno é bloqueado ao tentar listar toda a coleção de alunos (getDocs).');

  // 3.13 (Positivo). Sensei do dojo CONSEGUE listar todos os alunos do seu dojo
  const senseiStudentsList = await assertSucceeds(
    getDocs(collection(senseiAContext.firestore(), 'dojos/dojo_A/students'))
  );
  assert(senseiStudentsList.docs.length >= 2, '13+ Sensei lista com sucesso os alunos cadastrados no seu dojo.');

  // 3.14. Consultas de Mensalidades (getDocs): Consulta não filtrada por studentId DEVE FALHAR
  await assertFails(
    getDocs(collection(aliceContext.firestore(), 'dojos/dojo_A/tuitions'))
  );
  assert(true, '14. Aluno é bloqueado ao listar mensalidades sem filtro estrito por studentId.');

  // 3.14 (Positivo). Consulta filtrada estritamente pelo studentId do próprio aluno DEVE TER SUCESSO
  const aliceTuitionsList = await assertSucceeds(
    getDocs(query(collection(aliceContext.firestore(), 'dojos/dojo_A/tuitions'), where('studentId', '==', 'std_alice')))
  );
  assert(aliceTuitionsList.docs.length === 1, '14+ Aluno consulta suas mensalidades com query filtrada (where studentId == auth.token.studentId).');

  // 3.15. Aluno tentando listar mensalidades de OUTRO aluno com filtro (studentId == std_bob) DEVE FALHAR
  await assertFails(
    getDocs(query(collection(aliceContext.firestore(), 'dojos/dojo_A/tuitions'), where('studentId', '==', 'std_bob')))
  );
  assert(true, '15. Aluno é bloqueado ao tentar listar mensalidades de outro aluno via query.');

  // 3.16. Calendário: Consulta não filtrada por isPublicForStudents DEVE FALHAR
  await assertFails(
    getDocs(collection(aliceContext.firestore(), 'dojos/dojo_A/calendar_events'))
  );
  assert(true, '16. Aluno é bloqueado ao listar eventos sem filtro de visibilidade pública.');

  // 3.16 (Positivo). Consulta filtrada por isPublicForStudents == true DEVE TER SUCESSO
  const publicEventsList = await assertSucceeds(
    getDocs(query(collection(aliceContext.firestore(), 'dojos/dojo_A/calendar_events'), where('isPublicForStudents', '==', true)))
  );
  assert(publicEventsList.docs.length === 1, '16+ Aluno lista eventos públicos com query filtrada (where isPublicForStudents == true).');

  // ---------------------------------------------------------------------------
  // 4. TESTES DOS REPOSITÓRIOS CONCRETOS CONTRA O FIRESTORE EMULATOR
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Testes dos Dez Adaptadores de Repositório contra o Emulator ---');

  // Configura a conexão do Firebase Admin SDK com o Emulador
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  process.env.FIREBASE_PROJECT_ID = projectId;

  const adminDb = getFirestoreDb();

  // 4.1. FirestoreUserRepository
  const userRepo = new FirestoreUserRepository(adminDb);
  const foundUser = await userRepo.findById('alice_uid');
  assert(foundUser !== null && foundUser.name === 'Alice Silva', 'Repo User: localiza usuário por UID no emulador.');
  await userRepo.updateSessionVersion('alice_uid', 2);
  const updatedUser = await userRepo.findById('alice_uid');
  assert(updatedUser !== null && updatedUser.sessionVersion === 2, 'Repo User: atualiza sessionVersion atomicamente.');

  // 4.2. FirestoreDojoRepository
  const dojoRepo = new FirestoreDojoRepository(adminDb);
  const foundDojo = await dojoRepo.findById('dojo_A');
  assert(foundDojo !== null && foundDojo.name === 'Dojo Morumbi', 'Repo Dojo: localiza dojo por ID no emulador.');
  const foundSlug = await dojoRepo.findBySlug('morumbi');
  assert(foundSlug !== null && foundSlug.id === 'dojo_A', 'Repo Dojo: localiza dojo por slug.');

  // 4.3. FirestoreStudentRepository
  const studentRepo = new FirestoreStudentRepository(adminDb);
  const foundStudent = await studentRepo.findById('dojo_A', 'std_alice');
  assert(foundStudent !== null && foundStudent.fullName === 'Alice Silva', 'Repo Student: localiza prontuário de aluno.');
  await studentRepo.updateStatus('dojo_A', 'std_alice', StudentStatus.SUSPENDED);
  const updatedStudent = await studentRepo.findById('dojo_A', 'std_alice');
  assert(updatedStudent !== null && updatedStudent.status === StudentStatus.SUSPENDED, 'Repo Student: atualiza status do aluno.');

  // 4.4. FirestoreStudentAuthCredentialRepository
  const credRepo = new FirestoreStudentAuthCredentialRepository(adminDb);
  const foundCred = await credRepo.findByUsername('dojo_A', 'alice.silva');
  assert(foundCred !== null && foundCred.algorithm === 'argon2id', 'Repo Credential: localiza credencial com hash Argon2id.');
  await credRepo.incrementFailedAttempts('dojo_A', 'alice.silva', null);
  const incrementedCred = await credRepo.findByUsername('dojo_A', 'alice.silva');
  assert(incrementedCred !== null && incrementedCred.failedAttempts === 1, 'Repo Credential: incrementa tentativas falhas atomicamente.');
  await credRepo.resetFailedAttempts('dojo_A', 'alice.silva');
  const resetCred = await credRepo.findByUsername('dojo_A', 'alice.silva');
  assert(resetCred !== null && resetCred.failedAttempts === 0, 'Repo Credential: reseta tentativas falhas.');

  // 4.5. FirestoreClassRepository
  const classRepo = new FirestoreClassRepository(adminDb);
  const foundClass = await classRepo.findById('dojo_A', 'cls_01');
  assert(foundClass !== null && foundClass.name === 'Turma Infantil A', 'Repo Class: localiza turma cadastrada.');
  const dojoClasses = await classRepo.findByDojo('dojo_A');
  assert(dojoClasses.length >= 1, 'Repo Class: lista turmas do dojo.');

  // 4.6. FirestoreTuitionRepository (ID determinístico e valores em centavos)
  const tuitionRepo = new FirestoreTuitionRepository(adminDb);
  const foundTuition = await tuitionRepo.findById('dojo_A', 'tui_std_alice_2026-05');
  assert(foundTuition !== null && foundTuition.netAmountCents === 25000, 'Repo Tuition: preserva valores exatos em centavos inteiros.');
  const monthTuitions = await tuitionRepo.findByMonth('dojo_A', '2026-05');
  assert(monthTuitions.length === 2, 'Repo Tuition: localiza mensalidades do mês de referência.');

  // 4.7. FirestoreAttendanceRepository
  const attendanceRepo = new FirestoreAttendanceRepository(adminDb);
  const studentAtt = await attendanceRepo.findByStudent('dojo_A', 'std_alice');
  assert(studentAtt.length >= 1 && studentAtt[0].present === true, 'Repo Attendance: registra e consulta frequência por aluno.');

  // 4.8. FirestoreGraduationRepository
  const gradRepo = new FirestoreGraduationRepository(adminDb);
  const studentGrads = await gradRepo.findByStudent('dojo_A', 'std_alice');
  assert(studentGrads.length >= 1 && studentGrads[0].belt === 'amarela', 'Repo Graduation: consulta histórico de faixas.');

  // 4.9. FirestoreCompetitionRepository
  const compRepo = new FirestoreCompetitionRepository(adminDb);
  const foundComp = await compRepo.findById('dojo_A', 'comp_01');
  assert(foundComp !== null && foundComp.name === 'Campeonato Paulista 2026', 'Repo Competition: localiza torneio.');
  const compResults = await compRepo.findResultsByStudent('dojo_A', 'comp_01', 'std_alice');
  assert(compResults.length >= 1 && compResults[0].placement === CompetitionPlacement.GOLD, 'Repo Competition: localiza medalha de ouro via array-contains.');

  // 4.10. FirestoreCalendarEventRepository
  const calRepo = new FirestoreCalendarEventRepository(adminDb);
  const publicEvents = await calRepo.findByDojo('dojo_A', false); // includePrivateForStudents = false
  assert(publicEvents.length === 1 && publicEvents[0].id === 'evt_public', 'Repo Calendar: omite eventos restritos de gestão para perfil discente.');

  // Tratamento de documentos inexistentes
  const nonExistent = await studentRepo.findById('dojo_A', 'std_inexistente');
  assert(nonExistent === null, 'Repo Tratamento: documento inexistente retorna null com segurança sem lançar exceções.');

  console.log('\n=========================================================================');
  console.log(`🏁 RESULTADO FINAL DA INTEGRAÇÃO: ${passed} testes aprovados, ${failed} testes reprovados.`);
  console.log('=========================================================================\n');

  // Finaliza o ambiente de testes
  await testEnv.cleanup();

  if (failed > 0) {
    process.exit(1);
  }
}

runEmulatorIntegrationSuite().catch((err) => {
  console.error('Erro fatal durante a suíte de integração com emulator:', err);
  process.exit(1);
});
