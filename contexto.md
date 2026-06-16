# Academia Digital v2 — Contexto de Projecto

Documento de retoma para Claude Code. Lê do início ao fim antes de tocar em código. Contém arquitectura, schema, decisões tomadas, estado actual e roadmap.

## 1. Identidade do projecto

- Nome: Academia Digital v2
- Cliente: Grupo Oporto Forte Internacional (Portugal)
- Fornecedor: Neo Pulse (Macaé-RJ, Brasil), parceria Jonathan Silva + Renato Menezes
- Modelo comercial: Neo Pulse detém IP, Oporto Forte/CIBEA comercializa. 30% receita líquida + 2000€ inicial + 10000€ se sem vendas em 12 meses.
- Contacto principal cliente: Nadja Ferreira (CMO Oporto Forte)
- Stakeholders operacionais: Patrícia (substitui Excel manual), Rui Vieira (formador, dor do Word manual)
- O que é: SaaS White Label de gestão de formação profissional certificada DGERT. Substitui o sistema actual BT-SOFT da Oporto Forte. Multi-tenant (Portugal + Brasil futuro). Modelo White Label para CIBEA revender a outros centros de formação.

## 2. Stack técnica

Front-end (raiz do projecto):
- Vite 8 + React 19 + TypeScript 6
- TanStack Query, TanStack Table
- React Router v6
- Tailwind 3.4 + shadcn/ui
- Zustand (estado UI mínimo)
- react-hook-form + zod
- lucide-react
- react-signature-canvas (assinatura digital)

Back-end (pasta `api/`):
- Hono em Node (porta 3001)
- @hono/node-server
- Puppeteer local + Chromium standalone
- archiver@7 + p-limit@7
- @supabase/supabase-js (SERVICE_ROLE_KEY)
- dotenv, zod, tsx, cuid (necessário para gerar IDs cuid no INSERT)

Base de Dados:
- Supabase (URL: `https://ecqptnirekuiibhmnbaq.supabase.co`)
- Storage bucket privado: `dossier-pdfs`
- Postgres com RLS ON em todas as tabelas core
- Schema Prisma com camelCase, IDs cuid (TEXT)
- `passwordHash` legado (placeholder `'supabase_auth_managed'`)

Localização:
- Path absoluto: `C:\dev\academia-bsoft\academia-digital-v2`
- Estrutura: `src/` (web) + `api/` (back-end Node separado)
- `supabase/` foi apagado (Edge Functions abandonadas — usamos Hono em Node)

Como correr:

```bash
cd C:\dev\academia-bsoft\academia-digital-v2
# Terminal 1
npm run dev:api
# Terminal 2
npm run dev:web
```

Não usar `npm run dev` com concurrently — dá problemas no PowerShell.

Variáveis de ambiente — `api/.env` (gitignored):

```
PORT=3001
SUPABASE_URL=https://ecqptnirekuiibhmnbaq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<eyJ...>
CORS_ORIGIN=http://localhost:5173
PDF_BUCKET=dossier-pdfs
```

`.env.local` (raiz, gitignored):

```
VITE_SUPABASE_URL=https://ecqptnirekuiibhmnbaq.supabase.co
VITE_SUPABASE_ANON_KEY=<anon>
VITE_PDF_API_URL=http://localhost:3001
```

## 3. Regras de escrita e estilo

Idioma: PT-PT na UI. Comentários em código podem ser PT-BR ou PT-PT.
Nunca usar em-dash. Frases curtas. Sem emojis (excepto se o utilizador iniciou). Sem bold excessivo.

## 4. Migrations aplicadas

1. v1 — RLS base: bridge `authUserId` em `public.users`, 5 helper functions (`current_user_id`, `current_user_tenant`, `current_user_role`, `is_super_admin`, `is_tenant_manager`), 52 policies em 13 tabelas core.
2. v2 — `training_actions.contractId` FK + `training_sessions.courseModuleId` FK + enum `SessionType` (TEORICA / PRATICA / MISTA).
3. v2.1 — Cleanup: drop `training_sessions.moduleId` residual.
4. v3 — RLS para `enrollments` (5 policies inc. TRAINEE) e `training_action_trainers` (4 policies); ALTER `training_actions` com 4 campos DGERT (`entidadeFormadora`, `iniciativaFormacao`, `tipologiaHorario`, `localFormacao`); enum `EnrollmentStatus` (PENDING / CONFIRMED / ATTENDED / COMPLETED / NO_SHOW / CANCELLED).
5. v4 — Plano de sessão: 5 colunas em `training_sessions` (`planObjetivos`, `planIntroducao`, `planDesenvolvimento`, `planConclusao`, `planAvaliacao`) TEXT nullable.
6. v5 — RLS apertada para `training_sessions.SELECT`: TRAINER vê só as próprias sessões; TENANT_ADMIN/STAFF veem tudo do tenant; TRAINEE vê sessões das actions onde está matriculado. Helper `is_trainer()`.
7. v6 — RLS para `check_ins` (4 policies CRUD). TRAINER marca presenças, TRAINEE pode auto check-in via QR (futuro), TENANT_ADMIN CRUD do tenant.
8. v7 — Avaliação Automatizada: 11 policies em 4 tabelas (`questionnaires`, `questionnaire_questions`, `questionnaire_answers`, `questionnaire_responses`); seed de 2 questionários-template DGERT.
9. v8 — Fix: policy INSERT em `questionnaire_responses` (omissão na v7).
10. v9 — `questionnaire_responses.respondedAt` nullable. Modelo: NULL = pendente, NOT NULL = respondido. Reset das 4 responses antigas.
11. v10 — `questionnaire_responses` ganha 3 colunas nullable: `expiresAt` (timestamp), `respondentIp` (text), `respondentUserAgent` (text). Suporta a página pública `/q/:token` com auditoria + expiração opcional. Ficheiro: `docs/migrations/v10_questionnaire_publico.sql`.

## 5. Tabelas-chave e relações

Hierarquia:

```
tenants
  client_orgs (clientes finais do tenant)
  courses (templates) -> course_modules
  training_plans
    training_actions (execução, cliente + datas + contrato)
      training_sessions
        check_ins (presenças por sessão)
```

Pessoas:

```
users (auth + role + tenant)
  trainers -> training_action_trainers (ponte multi-formador)
  trainees -> enrollments
  client_orgs (admin do cliente, futuro CLIENT_HR role)
```

Avaliação:

```
questionnaires (templates por tenant)
  questionnaire_questions (com order)
  questionnaire_responses (1 por respondente, token único)
    questionnaire_answers (1 por pergunta respondida)
```

Roles: SUPER_ADMIN, TENANT_ADMIN, TENANT_STAFF, TRAINER, TRAINEE, CLIENT_HR (futuro).

Campos importantes:

- `users.authUserId` UUID -> `auth.users.id`
- `users.passwordHash` TEXT NOT NULL — placeholder `'supabase_auth_managed'`
- `trainees.firstName/lastName` — nomes vivem aqui, não em `users`
- `trainees.userId` é maioritariamente NULL
- `training_actions.actionCode` (não `code`)
- `training_sessions.trainerSignatureUrl` PNG base64
- `training_sessions.trainerSignedAt` — sumário imutável após preencher
- `questionnaire_responses.token` TEXT NOT NULL UNIQUE
- `questionnaire_responses.respondedAt` nullable (v9)
- `questionnaire_responses.expiresAt` nullable (v10)
- `questionnaire_responses.respondentIp` nullable (v10)
- `questionnaire_responses.respondentUserAgent` nullable (v10)

FKs não catalogadas no PostgREST:

- `questionnaire_responses.traineeId` -> `trainees.id`
- `questionnaire_responses.trainerId` -> `trainers.id`

Não usar embed: `from("questionnaire_responses").select("*, trainees(...)")` não funciona. Fazer lookup manual.

## 6. Credenciais de teste

- Admin: `admin@oportoforte.com` / `Admin123!` — TENANT_ADMIN, tenantId `cmok6xvlq0000pc43lyagc2pb`
- Trainer: `trainer.test@oportoforte.com` / `Test123!` — TRAINER, mesmo tenantId, trainers.id `cmok8l5r000024s43enwdtlev`, 22 sessões atribuídas

Tenants existentes:

- `cmok6xvlq0000pc43lyagc2pb` — Grupo Oporto Forte (principal)
- `cmokapnym0000a443ubspljtn` — TechPort Formação (multi-tenant test)

## 7. Estado actual — o que ESTÁ feito

Bloco PDF do Dossier DGERT — COMPLETO

6 templates em `api/src/templates/`:

- `checklist.ts` — capa, 9 secções
- `ficha-identificacao.ts` — 1 PDF por formando, RGPD com tenant dinâmico
- `folha-presencas.ts` — 1 por sessão
- `registo-sumarios.ts` — agregado por action, com assinatura digital
- `plano-sessao.ts` — 1 por sessão, 6 secções
- `separadora.ts` — 9 separadoras + exporta `SECCOES_DTP`

Helpers em `_shared.ts`: `renderHeader`, `renderFooter`, `DGERT_LOGO_BASE64`, `SHARED_STYLES`, `esc()`, `fmtDate()`.

3 padrões de geração:

- `POST /api/pdf/generate` — singular
- `POST /api/pdf/generate-mass` — por formando ou sessão, com discriminador `kind`
- `POST /api/pdf/generate-dossier` — ZIP completo, cache 24h, ~12s primeira vez

Portal do Formador — COMPLETO

- Routing por role + sidebar adaptada (`TrainerLayout`, `TrainerSidebar`)
- Dashboard com KPIs (Próxima Sessão / Sessões Mês / Horas / Total)
- Listagem de sessões filtrada por RLS v5
- Detail com 3 tabs: Plano, Sumário, Formandos
- Plano com 5 campos editáveis
- Sumário com assinatura digital (`react-signature-canvas`) imutável após assinar
- Marcação de presenças (`check_ins` com `status=MANUAL`)
- Banner cores (verde/amarelo/vermelho) + bloqueio temporal

Avaliação Automatizada — Fase 1 + 2a + 2b COMPLETAS

Fase 1 — Gestão de Questionários (admin):

- `src/pages/questionnaires/` — CRUD + clone + drag-reorder de perguntas
- Sidebar admin: novo item "Questionários"
- Seeds DGERT na v7:
  - `q_dgert_satisfacao_v1` — 13 perguntas, escala 1-4 mapeada a Insuficiente/Suficiente/Bom/Excelente
  - `q_dgert_avalformandos_v1` — 6 perguntas, escala 1-5

Fase 2a — Campanhas de Avaliação (admin):

- `src/pages/actions/CampaignsTab.tsx` + hooks (`useActionCampaigns`, `useCampaignResponses`, `useCampaignMutations`)
- Cartões expansíveis com tabela de respondentes
- Banner cores por percentagem (50% verde, etc.)
- "Copiar Todos os Links" formatado
- Idempotência: cria só links para quem ainda não tinha
- Tokens base64url 22 chars via `src/lib/token.ts`

Fase 2b — Página Pública de Resposta + Endpoints Hono (COMPLETA, validada end-to-end):

- Endpoint `GET /api/q/:token` em `api/src/routes/questionnaires.ts`
  - Valida regex token `[A-Za-z0-9_-]{10,64}`
  - Devolve `status: pending | done | expired`
  - No estado pending devolve questionnaire + questions ordenadas + respondentName + actionCode
  - Resolve respondentName via trainees -> trainers (fallback users)
  - Rate limit 30 leituras/h/IP/token
- Endpoint `POST /api/q/:token`
  - Body Zod com `answers: [{ questionId, scaleValue?, textValue? }]`
  - Valida idempotência (409 se já respondido), expiração (410)
  - Valida cada answer contra type/scale da pergunta, detecta duplicates no payload, exige required
  - Insert bulk em `questionnaire_answers` (IDs cuid gerados no Hono)
  - Update `questionnaire_responses.respondedAt` + `respondentIp` + `respondentUserAgent`
  - Rate limit 3 tentativas/h/IP/token
- Rate limit em `api/src/middleware/rate-limit.ts` (Map em memória, janela fixa 1h, cleanup a cada call)
- Rota web pública `/q/:token` em `src/app/router.tsx` com `PublicLayout` (sem sidebar, footer condicional)
- `PublicLayout` exporta context para a página esconder o footer em estado 404/410
- `PublicRespondPage` com 5 estados: Loading (skeleton), Invalid (404), Expired (410), Done (banner verde + timestamp), Pending (form completo)
  - SCALE 1-4: radio cards com labels Insuficiente/Suficiente/Bom/Excelente
  - SCALE 1-5: radio cards numéricos + legenda extremos
  - TEXT: textarea com contador 0/5000
  - Botão submit disabled enquanto required em falta; banner amarelo lista as em falta
- Hook `useResponseToken.ts`: TanStack Query com `staleTime: Infinity`, sem retry, sem refetch on focus
- Validado end-to-end admin -> formando -> admin (Sprint 1 Bloco 3): criar campanha em DEC-2026-001 (Decathlon), formando responde via link incógnito, admin vê contador 1/2 + status "Respondido" com timestamp
- Smoke test utilitário em `api/scripts/q-test.ts` (subcomandos setup, verify, cleanup, list-questions, find-action)
- Diagnóstico colunas em `api/scripts/check-v10.ts`

Outras features já existentes:

- CRUD completo de: courses, course_modules, training_plans, training_actions, training_sessions, trainers, trainees, client_orgs, contracts, rooms, training_areas
- Dashboard admin com KPIs reais (turmas activas, formações este mês, docs pendentes, total formandos)
- Auth via Supabase + ponte authUserId
- White Label via CSS variables (`TenantThemeProvider` global em `main.tsx`)
- Login com toggle mostrar/esconder password

## 8. Estado actual — o que NÃO está feito

Próximas fases da Avaliação Automatizada:

- Fase 3 — Avaliação dos Formandos pelo Formador: trainer aplica `q_dgert_avalformandos_v1` a cada formando da action. Form no portal trainer, não público. Cada response é 1 formando avaliado.
- Fase 4 — Relatório Consolidado: agrega respostas, calcula médias ponderadas por curso/action. PDF exportável (vai à secção 7 do Dossier DGERT — Avaliação). Substitui o `Relatório_Avaliaçao.xlsx` manual da Patrícia.

Blocos pendentes:

- Templates restantes do Dossier — 18 documentos: contrato, certificados, relatório final do formador, relatório assiduidade, CVs, CCPs.
- Portal do Formando — check-in via QR (`check_ins.ipAddress/userAgent/isManual` já existem), ver certificados, responder questionários autenticado.
- Envio automático de emails — Resend ou SendGrid para magic links de campanhas.
- Aprovações e workflows — `approval_requests` existe no schema, sem UI.
- Catálogo público + form "Tenho Interesse".
- Production: deploy plataforma, CI/CD, backups, monitoring, rate limit distribuído.
- LGPD: política privacidade externa, DPO, direito ao apagamento, retenção.

## 9. Decisões arquitecturais importantes

Estrutura monorepo: NÃO. `api/` é projecto Node independente na raiz. 70+ ficheiros do web ficaram intactos.

Geração de PDFs: Hono em Node com Chromium local. Edge Functions usam Deno e não rodam Chromium localmente.

Storage e cache: Bucket privado `dossier-pdfs`, signed URLs 1h. Cache 24h para ZIPs por action.

Schema de avaliação: NÃO há tabela `evaluation_campaigns`. A "campanha" é virtual, derivada de `GROUP BY questionnaire_responses(trainingActionId, questionnaireId)`.

Magic links de resposta: escrita via endpoint Hono server-side com SERVICE_ROLE_KEY, NÃO via policies RLS com token. Mais seguro, mais auditável, evita policy frágil tentando ler token do JWT.

Drag-reorder: HTML5 nativo. Zero deps adicionais.

Logo DGERT: embedado como SVG base64 no template (`_shared.ts`). NÃO vem da BD. Selo regulatório igual para todos os tenants. Campo `tenants.dgertLogoUrl` está deprecated.

Assinatura digital: `react-signature-canvas` v1.1.0-alpha.2 (suporta React 19). `toDataURL("image/png")` guarda em `training_sessions.trainerSignatureUrl`.

UI de form dinâmico (Fase 2b): `useState<AnswerMap>` em vez de react-hook-form. Perguntas são carregadas da API, register dinâmico de RHF seria mais verbose.

Token regex tolerante `[A-Za-z0-9_-]{10,64}` para aceitar tanto base64url de 22 chars (gerador interno) como tokens de teste manuais.

Rate limit em memória: Map por (scope, ip, token), janela 1h. Suficiente para localhost dev. Em produção real (multi-instância) substituir por Redis ou store persistente.

## 10. Regras de UI e UX

- Sidebar admin: Dashboard / Planos / Cursos / Acções / Formadores / Formandos / Questionários / Gestão. Secção "Em Breve": Relatórios / Aprovações / Projectos.
- Sidebar trainer: Dashboard / Minhas Sessões / Materiais (coming soon).
- Topbar partilhada com título dinâmico via `resolveTitle`.
- Cor primária: verde institucional `#046b39` (Oporto Forte). Variável CSS, customizável por tenant via White Label.
- Linguagem: PT-PT. Botões: "Guardar", "Apagar", "Acção". Estados: "Pendente", "Respondido", "Assinada".
- Toast minimal: 1 linha. Erros têm 2 segundos a mais que sucesso.
- Modais grandes (Sheet) para edição. Modais pequenos (Dialog) para confirmação.
- Empty states sempre presentes.
- Páginas públicas (PublicLayout): header minimal, max-width 720px, footer "Entidade Formadora Certificada DGERT · {ano}". Footer escondido em estados de erro 404/410.

## 11. Sequência sugerida de retoma

1. Confirma estado dos servidores: `npm run dev:api` num terminal, `npm run dev:web` noutro.
2. Confirma `api/.env`: precisa de `SUPABASE_SERVICE_ROLE_KEY` real.
3. Não rodar migrations sem confirmar com o utilizador. v1-v10 já estão aplicadas.
4. Próximo passo natural: Fase 3 da Avaliação Automatizada (trainer avalia formandos no portal).
5. Padrões a seguir:
   - Hooks em pastas próprias por domínio (`src/pages/<dominio>/use<Nome>.ts`)
   - Mutations invalidam queryKeys explicitamente
   - Componentes funcionais com React 19, sem `React.FC`
   - PT-PT na UI sempre
   - Toasts minimal
   - Não adicionar libs novas sem necessidade clara
   - Validar com `npm run build` antes de fechar uma fase
6. Se precisares de schema: roda introspecção SQL (`information_schema.columns`) antes de assumir nomes ou tipos.
7. Se houver erro 42501 RLS: falta policy, não é problema de código. Reportar e pedir migration.
8. Se houver erro 23502 NOT NULL: ver schema, ou omitir do payload, ou pedir migration para nullable.
9. Templates PDF: refactor de header/footer só via `_shared.ts`. Nunca duplicar.
10. Reportar sempre: ficheiros tocados, decisões face à spec, smoke tests, edge cases.

## 12. Convenções específicas que NÃO podem ser quebradas

- NUNCA mexer em RLS sem reportar primeiro ao utilizador. Sempre escrever migration SQL para o utilizador rodar manualmente. Nunca rodar migration directamente.
- NUNCA pedir nem aceitar SUPABASE_SERVICE_ROLE_KEY ou PAT no chat. Utilizador preenche em `api/.env` localmente.
- NUNCA mover/eliminar `supabase/` se aparecer.
- NUNCA criar dados em produção sem confirmação. Seeds em SQL.
- NUNCA tocar nos templates PDF 1-6 fechados, alvo de regressão. Refactor só do header/footer partilhado.
- NUNCA assumir que `users.name` existe. São `firstName` + `lastName` separados.
- NUNCA assumir que `training_actions.code` existe. É `actionCode`.
- NUNCA usar `course_modules!moduleId` em queries. É `course_modules!courseModuleId`.
- `questionnaire_responses.respondedAt` é nullable desde v9. NULL=pendente, NOT NULL=respondido.
- `questionnaire_responses` tem desde v10: `expiresAt`, `respondentIp`, `respondentUserAgent` (todos nullable). `expiresAt < now()` = 410.

## 13. Sprint 1 — fechado

Bloco 1: git init + 2 commits, .gitignore endurecido (apanhou `.token` + `auth.json` com JWT real fora do index), `PublicLayout` + rota stub `/q/:token`, migration v10 SQL preparada.

Bloco 2: endpoints Hono GET/POST `/api/q/:token`, middleware rate limit em memória, UI completa de resposta na PublicRespondPage, hook `useResponseToken`. Smoke tests 7 via curl + 1 via Chrome.

Bloco 3: validação end-to-end admin -> formando -> admin contra action real (DEC-2026-001 · Decathlon). Campanha primeira deixada na BD como evidência para demo da Patrícia. Cleanup processos node zombie. Commit fecha sprint.

Fim do contexto.
