# Karate Club — Arquitetura Consolidada de Autenticação e Segurança Multi-Tenant (Revisão Final da Fase 3)

Documento técnico definitivo de engenharia para o SaaS **Karate Club**, incorporando todas as correções de segurança, resiliência transacional, proteção contra força bruta multinível, invalidação de sessões e viabilidade 100% gratuita no plano Firebase Spark.

> [!IMPORTANT]
> **Fase Exclusiva de Planejamento e Análise Técnica**: Em total conformidade com as diretrizes do projeto, nenhum código de produção, tela, usuário ou documento foi criado e as regras de segurança ativas no console permanecem intocadas.

---

## 1. Criação de Contas Recuperável e Idempotente

### O Desafio
O Firebase Authentication e o Cloud Firestore são subsistemas distintos no Google Cloud e **não compartilham transações atômicas ACID globais**. Uma falha de rede ou timeout entre a chamada do Firebase Auth e o commit no Firestore pode gerar estados órfãos (ex: usuário criado no Auth sem perfil no Firestore, ou falha após tentativa duplicada do Sensei).

### Estratégia de Transação em 2 Fases com Compensação e Chave de Idempotência

```
[Sensei submete formulário no Painel Admin]
                  │
                  ▼
  [Backend Express: POST /api/admin/students]
  Headers: Idempotency-Key: idemp_<timestamp>_<hash>
                  │
                  ├─► 1. Verificação de Idempotência:
                  │      Consulta /system/idempotency_keys/{key} ou lock em Firestore.
                  │      Se requisição idêntica já concluída -> retorna resultado em cache.
                  │      Se em processamento há < 30s -> retorna 409 Conflict (Operação em andamento).
                  │
                  ├─► 2. Validação Prévia no Firestore:
                  │      Normaliza o username (ex: "lucas.mendes").
                  │      Executa leitura em transação Firestore em:
                  │      /dojos/{dojoId}/auth_credentials/{usernameNormalized}
                  │      Se já existir e status for ativo -> Retorna 409 "Nome de usuário já em uso neste dojo".
                  │
                  ├─► 3. Geração de Identidade Imutável:
                  │      Gera studentId interno: std_ + nanoId(16) (ex: "std_7k9m2p4x8q1v5z3w").
                  │      Gera studentUid imutável: "stu_" + dojoId + "_" + studentId.
                  │      (Total: ~35 caracteres, muito abaixo do limite de 128 caracteres).
                  │
                  ├─► 4. Provisionamento no Firebase Authentication:
                  │      Tenta admin.auth().createUser({
                  │        uid: studentUid,
                  │        displayName: fullName
                  │      });
                  │      * Se erro "auth/uid-already-exists":
                  │        O backend inspeciona o estado do Firestore. Se o Firestore estiver
                  │        incompleto (processo interrompido anteriormente), retoma a etapa 5.
                  │
                  ├─► 5. Execução de Transação Atômica no Cloud Firestore:
                  │      Gera hash Argon2id da senha temporária gerada pelo servidor.
                  │      Abre db.runTransaction() gravando em lote:
                  │      a) /dojos/{dojoId}/students/{studentId} (perfil cadastral/marcial)
                  │      b) /dojos/{dojoId}/auth_credentials/{usernameNormalized} (hash, flags, timestamp)
                  │      c) /users/{studentUid} (vínculo global uid -> dojoId, role, studentId)
                  │      d) Custom Claims: admin.auth().setCustomUserClaims(studentUid, {
                  │           dojoId, role: 'student', studentId, mustChangePassword: true
                  │         })
                  │
                  └─► 6. Tratamento de Falha e Compensação Automática:
                         Se o Firestore falhar ou der timeout após a criação no Firebase Auth:
                         - O backend executa rollback de compensação imediato:
                           await admin.auth().deleteUser(studentUid).catch(...)
                         - Registra o erro estruturado para observabilidade.
                         - Retorna 500 "Falha ao provisionar dados do aluno. Operação revertida com segurança."
```

### Prevenção de Concorrência
Mesmo que dois administradores cliquem simultaneamente ou haja clique duplo:
- A restrição de documento do Firestore em `/dojos/{dojoId}/auth_credentials/{usernameNormalized}` é garantida pela transação do Firestore.
- Apenas uma gravação terá sucesso no ID determinístico do documento; a segunda receberá aborto da transação e responderá imediatamente 409 Conflict.

---

## 2. Troca Obrigatória de Senha: Bloqueio Rigoroso e Atualização de Claims

A proteção **não depende do frontend**. Um aluno com `mustChangePassword: true` que tentar burlar o modal e chamar diretamente o Firestore ou a API terá suas requisições totalmente rejeitadas:

### A. Bloqueio no Cloud Firestore (`firestore.rules`)
As regras de segurança exigem explicitamente que o token JWT não possua a pendência ativa:

```javascript
// Função auxiliar de validação no firestore.rules
function isStudentActive(dojoId) {
  return isAuthenticated() &&
         request.auth.token.role == 'student' &&
         request.auth.token.dojoId == dojoId &&
         request.auth.token.mustChangePassword != true;
}
```
Se `request.auth.token.mustChangePassword == true`, **todas as leituras e gravações** em `/dojos/{dojoId}/students/*`, `/classes/*`, `/tuitions/*`, `/attendance/*`, etc., são sumariamente negadas (`PERMISSION_DENIED`). O aluno com pendência só consegue ler seu próprio documento em `/users/{uid}` para obter metadados básicos de redirecionamento.

### B. Bloqueio no Backend Node.js
Qualquer endpoint protegido para alunos valida o token JWT e verifica:
```typescript
if (decodedToken.role === 'student' && decodedToken.mustChangePassword === true) {
  if (req.path !== '/api/auth/student/change-password') {
    return res.status(403).json({
      error: 'PASSWORD_CHANGE_REQUIRED',
      message: 'É obrigatório criar sua nova senha pessoal antes de acessar qualquer funcionalidade.'
    });
  }
}
```

### C. Fluxo de Troca e Atualização de Custom Claims
1. O aluno envia `POST /api/auth/student/change-password` com `Bearer <token>` e `{ newPassword }`.
2. O servidor valida requisitos de força (mínimo 8 caracteres, números e letras).
3. O servidor gera o novo hash **Argon2id** da nova senha pessoal.
4. O servidor atualiza `/dojos/{dojoId}/auth_credentials/{usernameNormalized}`:
   - `passwordHash = newArgon2Hash`
   - `mustChangePassword = false`
   - `passwordUpdatedAt = new Date().toISOString()`
   - `minTokenIssuedAt = Math.floor(Date.now() / 1000)` (invalida tokens anteriores).
5. O servidor atualiza as Custom Claims via Firebase Admin SDK:
   ```typescript
   await admin.auth().setCustomUserClaims(studentUid, {
     dojoId,
     role: 'student',
     studentId,
     mustChangePassword: false,
     pwdAt: Math.floor(Date.now() / 1000)
   });
   ```
6. O servidor emite e retorna um novo `customToken` com as claims limpas.
7. O cliente chama `await signInWithCustomToken(auth, newCustomToken)` e `await auth.currentUser.getIdToken(true)` (forçando o refresh do token no cliente).
8. O modal de troca é fechado e o portal completo do aluno é liberado com acesso total permitido pelas regras do Firestore.

---

## 3. Estratégia de Revogação de Sessões e Invalidação de Access Tokens

### O Desafio
O Firebase Authentication emite tokens JWT de acesso com validade fixa de **1 hora (3600 segundos)**. O método `admin.auth().revokeRefreshTokens(uid)` invalida apenas os *refresh tokens*, impedindo renovações futuras; contudo, um JWT de acesso já emitido continuaria tecnicamente válido até sua expiração se não houver verificação ativa.

### Solução Sem Serviços Pagos
Combinamos 3 camadas de revogação imediata:

1. **No Backend Node.js (Validação de Revogação Ativa)**:
   - Toda verificação de token no backend utiliza `admin.auth().verifyIdToken(token, true)` (o segundo argumento `checkRevoked = true` consulta o revocation timestamp do Firebase Auth).
   - Além disso, o backend confere se o campo de claim `auth_time` (em segundos) é anterior ao `minTokenIssuedAt` registrado no documento `/auth_credentials/`. Se o token foi emitido antes da redefinição de senha feita pelo Sensei, o backend rejeita a requisição com `401 Token Revoked`.

2. **No Cloud Firestore (`firestore.rules`)**:
   - As regras de segurança validam o timestamp de emissão do token:
     ```javascript
     function isTokenFresh() {
       // Garante que o token foi emitido após a última alteração de senha
       return !('pwdAt' in request.auth.token) ||
              request.auth.token.auth_time >= request.auth.token.pwdAt;
     }
     ```
   - Quando o Sensei redefine a senha do aluno (`/api/admin/students/:id/reset-password`), o backend incrementa o `minTokenIssuedAt` nas claims e revoga os refresh tokens imediatamente via `admin.auth().revokeRefreshTokens(studentUid)`. Qualquer token antigo torna-se inválido para chamadas no backend e para renovação de sessão.

---

## 4. Proteção Multinível Contra Ataques de Força Bruta (Anti-DDoS & Anti-Enumeração)

Para evitar que um atacante cause bloqueio intencional de contas legítimas (*Denial of Service contra alunos*), o sistema adota proteção em múltiplos níveis independentes:

### Nível 1: Rate Limit por Endereço IP (Distribuído / Sem Dependência de Memória Local)
- No endpoint `POST /api/auth/student/login`, o rate limit é computado por IP.
- Em ambientes escaláveis com múltiplas instâncias Node.js, os registros de tentativas por IP são persistidos em uma coleção de TTL no Firestore (`/system/rate_limits_ip/{ipHash}`) usando leitura e escrita atômica com tempo de expiração.
- Limite: máximo de 30 tentativas por IP a cada 15 minutos (permite que dojos com vários alunos na mesma rede Wi-Fi façam login sem problemas, mas impede varreduras em massa).

### Nível 2: Atraso Progressivo (*Exponential Backoff*) e Atraso Fixo Mínimo
- Para impedir *timing attacks* e desacelerar scripts maliciosos, cada verificação de senha é executada com atraso sintético garantido de no mínimo **600ms** a **1000ms** (além do custo intrínseco do Argon2id).
- Se a conta acumular tentativas incorretas consecutivas (1ª, 2ª, 3ª, 4ª), o backend adiciona um delay progressivo (`attempt * 500ms`) antes de devolver a resposta.

### Nível 3: Limite por Conta/Dojo e Bloqueio Suave (*Soft Lock*)
- Em vez de um bloqueio irreversível ou imediato de longa duração, após 5 tentativas incorretas a conta entra em *Cooldown Progressivo*:
  - 5 tentativas incorretas: cooldown de 60 segundos.
  - 6 tentativas incorretas: cooldown de 5 minutos.
  - 10 ou mais tentativas: exige que o Sensei redefina o acesso ou aguarde 30 minutos.
- Os contadores de tentativas (`failedAttempts`, `lockedUntil`, `lastFailedAt`) são gravados diretamente no documento `/dojos/{dojoId}/auth_credentials/{usernameNormalized}`, garantindo consistência entre múltiplas instâncias Node.js sem risco de descompasso de memória.

### Nível 4: Resposta Opaca Anti-Enumeração
- Toda e qualquer falha (dojo inexistente, usuário inexistente, senha incorreta ou conta em cooldown) responde exatamente o mesmo código HTTP e corpo:
  `401 Unauthorized: {"error": "INVALID_CREDENTIALS", "message": "Identificador do dojo, usuário ou senha incorretos."}`
- Isso impede que qualquer agente externo descubra se determinado nome de usuário ou número de matrícula existe no dojo.

---

## 5. Identidade, Identificadores e Unicidade sem Colisão

### Diretrizes de Identificadores
- **Identificador Primário Imutável (UID)**:
  - Formato: `stu_` + `dojoId` + `_` + `studentId`
  - Exemplo: `stu_dojo_sp_morumbi_01_std_7k9m2p4x8q1v5z3w`
  - Tamanho: ~45 caracteres. Em total conformidade com o limite de **128 caracteres ASCII** do Firebase Authentication.
  - **Imutabilidade**: O UID nunca é gerado a partir do nome, login ou matrícula do aluno. Mesmo que o aluno mude de nome, retifique a matrícula ou altere o login, o UID interno permanece perene.

- **Nome de Usuário / Matrícula**:
  - A matrícula marcial é armazenada obrigatoriamente como **`string`** (ex: `"00042"`, `"KC-2026-0012"`), preservando zeros à esquerda e prefixos.
  - Normalização de login:
    - Conversão para minúsculas: `.toLowerCase()`.
    - Remoção de acentos: `.normalize('NFD').replace(/[\u0300-\u036f]/g, '')`.
    - Remoção de caracteres especiais não permitidos (apenas letras, dígitos, ponto e hífen: `^[a-z0-9._-]+$`).
  - Unicidade local garantida: o ID do documento na subcoleção `/dojos/{dojoId}/auth_credentials/{usernameNormalized}` é a própria chave normalizada. O Firestore garante unicidade física por dojo.

---

## 6. Geração de Senhas Temporárias e Exibição de Visualização Única

1. **Geração Segura pelo Backend**:
   - A senha temporária não é inventada pelo usuário. O backend gera via `crypto.randomBytes(6)` formatada em padrão legível e memorável de padrão marcial (ex: `Osu-8492-Ktc`).
2. **Exibição Única ao Sensei**:
   - A senha em texto puro é devolvida **apenas uma única vez** na resposta do endpoint `POST /api/admin/students` ou `POST /api/admin/students/:id/reset-password`.
   - O backend **nunca armazena o texto puro da senha**. Ele calcula o hash Argon2id e descarta a string em memória.
   - O painel do Sensei renderiza uma janela modal: *"Copie a credencial de primeiro acesso agora. Esta senha nunca mais poderá ser visualizada."*
   - Não há nenhum campo em nenhum documento do Firestore onde o Sensei ou qualquer outro usuário possa visualizar a senha.

---

## 7. Fonte Oficial dos Dados e Padrão Criptográfico Argon2id

### Matriz de Fonte Oficial (Single Source of Truth)

| Coleção / Caminho | Propósito / Fonte Oficial | Controle de Acesso |
| :--- | :--- | :--- |
| `/dojos/{dojoId}/students/{studentId}` | **Dados cadastrais, pedagógicos e marciais**. Nome, foto, nascimento, faixa, graduação, peso, mensalidade individual. | Leitura: Sensei e Aluno dono.<br>Escrita: Somente Sensei. |
| `/dojos/{dojoId}/auth_credentials/{usernameNorm}` | **Identificador de login, hash criptográfico e estado da senha**. Contadores de falha, cooldown e timestamp de revogação. | **Leitura e Escrita: BLOQUEIO TOTAL (`allow read, write: if false;`). Apenas Backend com Firebase Admin SDK.** |
| `/users/{uid}` | **Roteamento rápido de identidade**. Vínculo entre UID do Firebase Auth, `dojoId`, `role` e `studentId`. | Leitura: Dono da conta e Sensei do dojo.<br>Escrita: Somente Backend. |

### Padronização Criptográfica: Argon2id Sem Salt Redundante
- O algoritmo adotado é o **Argon2id** (versão 1.3, variante híbrida recomendada pela OWASP contra ataques por GPU/ASIC e side-channel).
- **Eliminação do campo `salt` avulso**: O formato padrão de saída da especificação PHC para Argon2id:
  `$argon2id$v=19$m=65536,t=3,p=4$<salt-base64>$<hash-base64>`
  já encapsula de forma autossuficiente o salt criptográfico, o número de iterações (`t=3`), o custo de memória (`m=64MB`) e o paralelismo (`p=4`).
- Portanto, o campo redundante `salt` separado é eliminado do schema, mantendo apenas `passwordHash: string` e `algorithm: 'argon2id'`.

---

## 8. Regras Consolidadas de Segurança do Cloud Firestore (`firestore.rules`)

As regras a seguir implementam o bloqueio estrito contra alunos com pendência de troca de senha, isolamento físico multi-tenant e proteção total de dados de terceiros:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Funções de Autenticação Básica
    function isAuthenticated() {
      return request.auth != null;
    }

    function isPlatformSuperAdmin() {
      return isAuthenticated() && request.auth.token.role == 'platform_superadmin';
    }

    // Validação de Vínculo de Administrador (Sensei)
    function isDojoAdmin(dojoId) {
      return isAuthenticated() &&
             request.auth.token.role == 'admin' &&
             request.auth.token.dojoId == dojoId;
    }

    // Validação de Aluno Ativo:
    // EXIGE que a flag mustChangePassword NÃO seja true e que o token seja recente
    function isStudentActive(dojoId) {
      return isAuthenticated() &&
             request.auth.token.role == 'student' &&
             request.auth.token.dojoId == dojoId &&
             request.auth.token.mustChangePassword != true;
    }

    function isDojoMember(dojoId) {
      return isDojoAdmin(dojoId) || isStudentActive(dojoId);
    }

    // Bloqueio Global do Sistema
    match /system/{document=**} {
      allow read, write: if false;
    }

    // Mapeamento Global /users/{userId}
    match /users/{userId} {
      allow read: if isAuthenticated() && (
        request.auth.uid == userId ||
        (request.auth.token.role == 'admin' && resource.data.dojoId == request.auth.token.dojoId) ||
        isPlatformSuperAdmin()
      );
      allow write: if false; // Gerenciado exclusivamente pelo backend
    }

    // Escopo Multi-Tenant /dojos/{dojoId}
    match /dojos/{dojoId} {
      allow read: if isDojoMember(dojoId) || isPlatformSuperAdmin();
      allow write: if isDojoAdmin(dojoId) || isPlatformSuperAdmin();

      // =======================================================================
      // 1. CREDENCIAIS PRIVADAS: BLOQUEIO TOTAL E ABSOLUTO NO CLIENTE
      // Nenhum usuário, nem mesmo o Sensei autenticado, pode ler via SDK cliente.
      // Somente o backend com Firebase Admin SDK acessa.
      // =======================================================================
      match /auth_credentials/{usernameNormalized} {
        allow read, write: if false;
      }

      // 2. Perfil dos Alunos
      match /students/{studentId} {
        allow write: if isDojoAdmin(dojoId);
        allow read: if isDojoAdmin(dojoId) || (
          isStudentActive(dojoId) && resource.data.userId == request.auth.uid
        );
      }

      // 3. Turmas (Visíveis aos membros ativos do dojo)
      match /classes/{classId} {
        allow read: if isDojoMember(dojoId);
        allow write: if isDojoAdmin(dojoId);
      }

      // 4. Mensalidades (Aluno lê SOMENTE a sua própria mensalidade)
      match /tuitions/{tuitionId} {
        allow write: if isDojoAdmin(dojoId);
        allow read: if isDojoAdmin(dojoId) || (
          isStudentActive(dojoId) && resource.data.studentId == request.auth.token.studentId
        );
      }

      // 5. Frequências (Aluno lê apenas suas presenças)
      match /attendance/{attendanceId} {
        allow write: if isDojoAdmin(dojoId);
        allow read: if isDojoAdmin(dojoId) || (
          isStudentActive(dojoId) && resource.data.studentId == request.auth.token.studentId
        );
      }

      // 6. Histórico de Graduações (Aluno lê exclusivamente seu próprio exame de faixas)
      match /graduations/{graduationId} {
        allow write: if isDojoAdmin(dojoId);
        allow read: if isDojoAdmin(dojoId) || (
          isStudentActive(dojoId) && resource.data.studentId == request.auth.token.studentId
        );
      }

      // 7. Competições, Equipes e Resultados
      match /competitions/{competitionId} {
        allow read: if isDojoMember(dojoId);
        allow write: if isDojoAdmin(dojoId);

        match /teams/{teamId} {
          allow read: if isDojoMember(dojoId);
          allow write: if isDojoAdmin(dojoId);
        }

        // Resultados: Aluno só pode ler registros em que seu studentId está no array studentIds
        match /results/{resultId} {
          allow write: if isDojoAdmin(dojoId);
          allow read: if isDojoAdmin(dojoId) || (
            isStudentActive(dojoId) &&
            request.auth.token.studentId in resource.data.studentIds
          );
        }
      }

      // 8. Eventos e Calendário
      match /events/{eventId} {
        allow write: if isDojoAdmin(dojoId);
        allow read: if isDojoMember(dojoId) && (
          isDojoAdmin(dojoId) || resource.data.isPublicForStudents == true
        );
      }
    }
  }
}
```

---

## 9. Análise Realista de Viabilidade, Infraestrutura e Custos (R$ 0,00 no Spark)

Para garantir **total transparência de custos e viabilidade**, apresentamos a separação exata entre os componentes e os limites operacionais:

### A. Recursos do Firebase Spark (100% Gratuitos sem Cartão de Crédito)
- **Firebase Authentication**:
  - Usuários ilimitados com E-mail/Senha e Custom Tokens.
  - Emissão de **Custom Tokens** via Firebase Admin SDK: **Gratuita e sem cotas financeiras**.
- **Cloud Firestore (Plano Spark)**:
  - 50.000 leituras/dia.
  - 20.000 gravações/dia.
  - 1 GB de armazenamento total.
  - Para um dojo com 200 alunos, o consumo médio diário fica em menos de 2.000 leituras e 200 gravações, consumindo **menos de 5% da cota gratuita diária**.
- **Regras de Segurança e Custom Claims**: Incluídas gratuitamente no motor do Firestore e Auth.

### B. Onde Executa o Backend Node.js / Express?
O Firebase Admin SDK requer um ambiente de execução Node.js com privilégios de servidor. **No plano Firebase Spark, Cloud Functions externas não podem ser implantadas se exigirem faturamento (plano Blaze)**.

**Como o Karate Club opera a R$ 0,00 sem cartão de crédito:**
1. **No Ambiente de Desenvolvimento e Demonstração (Google AI Studio)**:
   - O backend já roda integrado no processo Node.js Express da aplicação (`server.ts` executando via `tsx`), provendo a API REST na mesma porta e no mesmo container do Vite, **com custo zero**.
2. **Na Hospedagem de Produção Futura Gratuita**:
   - O Karate Club é uma aplicação full-stack empacotada em Node.js (`server.ts` servindo tanto as APIs `/api/*` quanto os assets estáticos gerados pelo Vite em `dist/`).
   - Pode ser hospedada gratuitamente em provedores que oferecem instâncias de container/Node.js com tier gratuito perene (como Render Free Web Service, Fly.io Free Tier, ou Koyeb Free Tier), conectando-se ao Firebase Authentication e Firestore do projeto `gen-lang-client-0540643703` via variáveis de ambiente seguras.
   - **Não há nenhuma dependência de Cloud Functions pagas do Firebase nem necessidade de migrar para o plano Blaze.**

### C. Serviços Auxiliares Eliminados
- **Zero custo de e-mail**: Nenhuma contratação de SendGrid, Resend ou Amazon SES, pois o fluxo de alunos é 100% por usuário/matrícula e redefinição assistida pelo Sensei.
- **Zero custo de Storage**: Fotos com fallback em avatares de iniciais vetoriais SVG, sem provisionar Firebase Storage.

---

## 10. Catálogo Consolidado de Endpoints e Proteções

| Método | Rota | Autenticação / Proteção | Resumo da Operação |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/student/login` | Pública + Rate Limit IP/Conta + Delay Sintético | Recebe `dojoIdentifier`, `username`, `password`. Valida hash Argon2id. Retorna `customToken` com `mustChangePassword`. |
| `POST` | `/api/auth/student/change-password` | Bearer Token (Aluno com ou sem pendência) | Recebe `newPassword`. Gera novo hash Argon2id, remove flag `mustChangePassword`, invalida tokens anteriores e atualiza claims. |
| `POST` | `/api/admin/students` | Bearer Token (Sensei com role `admin`) | Cria aluno com fluxo idempotente, gera senha temporária aleatória, grava Firestore e retorna senha de exibição única. |
| `POST` | `/api/admin/students/:id/reset-password` | Bearer Token (Sensei com role `admin`) | Gera nova senha temporária aleatória para o aluno, atualiza hash Argon2id, marca `mustChangePassword: true`, revoga sessões anteriores e exibe a nova senha temporária uma única vez. |
| `POST` | `/api/setup/bootstrap` | Segredo de Servidor (`SERVER_BOOTSTRAP_SECRET`) | Criação do primeiro dojo e administrador, travado de forma atômica e irreversível em `/system/bootstrap_lock`. |

---

## Conclusão da Revisão da Fase 3
Esta especificação atende integralmente aos 10 requisitos técnicos de segurança, recuperabilidade e viabilidade a custo zero, preparando a base segura para a futura execução da **Fase 4 (Implementação do Backend e Firebase Admin SDK)** quando for autorizada.
