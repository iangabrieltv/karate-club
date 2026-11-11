# Karate Club — Backend Modular & Camada de Persistência (Etapas 4.1 e 4.2)

Arquitetura desacoplada, tipada e com suporte completo à persistência Cloud Firestore do **Karate Club**, construída para suportar o modelo multi-tenant isolado por dojos com injeção de dependências, adaptadores Firestore, mappers bidirecionais, idempotência com travas de concorrência (*in-flight locks*) e mocks em memória.

---

## 1. Arquitetura em Camadas

```
server/
├── src/
│   ├── app.ts                                    # Fábrica da aplicação Express e rotas públicas
│   ├── domain/                                   # Entidades puras, Enums e Hierarquia de Erros
│   │   ├── entities.ts                           # 10 Entidades de Domínio (User, Dojo, Student, etc.)
│   │   ├── enums.ts                              # Papéis, faixas, estados, modalidades
│   │   └── errors.ts                             # Erros padronizados (ValidationError, ConflictError, etc.)
│   ├── interfaces/                               # Contratos TypeScript das Interfaces de Repositório
│   │   └── index.ts                              # IUserRepository, IStudentRepository, ITuitionRepository...
│   ├── infrastructure/
│   │   ├── firestore/                            # Camada de Persistência Firestore (Etapa 4.2)
│   │   │   ├── config/firebaseAdmin.ts           # Inicialização Singleton Admin SDK (ADC / Emulador)
│   │   │   ├── mappers/index.ts                  # Mappers bidirecionais e conversão de Timestamps
│   │   │   └── repositories/
│   │   │       └── firestoreRepositories.ts      # 10 Repositórios Firestore concretos
│   │   └── mocks/                                # Repositórios em Memória Volátil
│   │       ├── repositories.ts                   # Mocks essenciais (User, Dojo, Student, Credential)
│   │       └── additionalRepositories.ts         # Mocks de subcoleções (Class, Tuition, Attendance...)
│   ├── services/                                 # Regras de Negócio e Casos de Uso
│   │   ├── auth/authService.ts                   # Autenticação, bloqueio progressivo e troca de senha
│   │   └── students/provisioningService.ts       # Provisionamento com idempotência e in-flight lock
│   ├── middlewares/errorHandler.ts               # Tratamento centralizado de erros HTTP
│   └── utils/                                    # Criptografia, senhas e bootstrap
│       ├── bootstrapValidator.ts                 # Validação de segredo de 64 hex em tempo constante
│       ├── hasher.ts                             # Hashing seguro Argon2id (memoryCost: 32MB)
│       └── temporaryPassword.ts                  # Senha temporária Base32 (40 bits de entropia)
└── tests/
    └── runner.ts                                 # Suíte automatizada com 38 testes aprovados
```

---

## 2. In-Flight Locks e Idempotência Concorrente

Na Etapa 4.2, o serviço `StudentProvisioningService` implementa um mecanismo de controle de concorrência com **trava em voo (*in-flight lock*)**:

- **Histórico Concluído (`completedJobs`)**: Armazena o resultado de operações processadas com sucesso indexadas por `Idempotency-Key` e `payloadHash`. Requisições repetidas subsequentes retornam imediatamente a mesma credencial temporária e dados do aluno.
- **Trava em Voo (`inFlightLocks`)**: Um mapa em memória de promessas ativas `Map<string, { promise, payloadHash }>`. Quando múltiplas requisições simultâneas chegam com a mesma chave (ex.: via `Promise.all`):
  - A primeira requisição registra a promessa de execução na trava.
  - As requisições simultâneas subsequentes detectam a trava ativa, validam se o payload é idêntico e aguardam a mesma promessa em andamento.
  - Todas as chamadas concorrentes resolvem simultaneamente retornando o mesmo `studentId` e credencial, impedindo a duplicação no banco de dados.
  - Se uma requisição simultânea tentar usar a mesma chave com payload diferente, o sistema dispara imediatamente um `ConflictError`.
  - A trava é liberada no bloco `finally`, garantindo que falhas transitórias não bloqueiem retentativas legítimas.

---

## 3. Formato Determinístico de IDs de Mensalidade

Para evitar a cobrança em duplicidade de uma mesma competência para o mesmo aluno:
- O identificador único da entidade `TuitionEntity` é determinístico:
  ```
  tui_{studentId}_{referenceMonth}
  ```
  Exemplo: `tui_std_abc123_2026-05`.
- Se um Sensei tentar gerar novamente a cobrança para o mesmo aluno e mês, a chave única no Firestore atua como salvaguarda matemática contra duplicidade.
- Todos os valores monetários (`baseAmountCents`, `discountCents`, `netAmountCents`) são persistidos estritamente como **centavos inteiros** (`number`), eliminando discrepâncias de arredondamento de ponto flutuante.

---

## 4. Regras de Segurança do Firestore (`/firestore.rules`)

O arquivo `/firestore.rules` foi estruturado com auditoria consolidada:
- **Default Deny**: `match /{document=**} { allow read, write: if false; }`.
- **Validação de Sessão Discente**:
  - `sVer` presente no token, inteiro positivo e idêntico a `users.sessionVersion`.
  - `mustChangePassword == false` no token ou usuário para acesso operacional.
  - Aluno só pode consultar seus próprios registros (`studentId == request.auth.token.studentId`).
- **Listagem Segura**:
  - As coleções `/tuitions`, `/attendance`, `/graduations` exigem filtro estrito por `studentId` do próprio aluno.
  - A subcoleção `/results` exige que o `studentId` do aluno esteja no array `studentIds`.
  - A subcoleção `/calendar_events` exige que `isPublicForStudents == true`.
  - A subcoleção `/student_credentials` é terminantemente bloqueada para qualquer acesso client (`allow read, write: if false`), sendo acessível apenas pelo Backend Admin SDK.

---

## 5. Execução em Modo Emulador vs. Mocks

- **Ambiente sem Java**: O Firebase Local Emulator Suite requer Java runtime. Neste container de desenvolvimento (`java: not found`), o sistema opera com desacoplamento total via os repositórios Mock e testes unitários de mappers.
- **Configuração do Admin SDK**: A inicialização em `server/src/infrastructure/firestore/config/firebaseAdmin.ts` suporta tanto Application Default Credentials (ADC) em produção Google Cloud quanto o emulador local via `FIRESTORE_EMULATOR_HOST`. Não há dependência forçada de `FIREBASE_SERVICE_ACCOUNT_JSON`.

---

## 6. Comandos e Testes

- `npm test`: Executa os **38 testes unitários automatizados** cobrindo segurança criptográfica, isolamento multi-tenant, concorrência com `Promise.all`, regras determinísticas de ID, subcoleções e mappers Firestore.
- `npm run build`: Compila o bundle de produção do frontend (`vite build`).
- `npm run lint`: Valida tipos e conformidade TypeScript (`tsc --noEmit`).
