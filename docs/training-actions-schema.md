# Schema real — Módulo Central (training_actions / sessions / modules)

Introspecção pelo caminho real (anon key + login admin@oportoforte.com),
2026-05-17. Tipos por amostra + sonda adaptativa de NOT NULL + deteção de
enums por filtro inválido + leitura de valores reais. `information_schema`
não é exposto pela PostgREST; query autoritativa no fim para cross-check.

Legenda NOT NULL: **cliente** = NOT NULL sem default (a app preenche).
**default** = NOT NULL com default na BD (omitir; não enviar null).
**nullable** = aceita null.

---

## training_actions (a "turma" — execução de um curso)

Colunas: `id, tenantId, courseId, planId, clientOrgId, actionCode,
actionNumber, startDate, endDate, roomId, format, financingSystem,
maxTrainees, minTrainees, status, createdAt, updatedAt`

| Coluna | Tipo | NOT NULL | Notas |
|---|---|---|---|
| id | text (cuid) | **cliente** | `withDbDefaults` |
| tenantId | text (cuid) | seed/RLS | tenant do utilizador |
| courseId | text (cuid) | **cliente** | FK `courses` |
| planId | text (cuid) | nullable | FK `training_plans` |
| clientOrgId | text (cuid) | nullable | FK `client_orgs` |
| actionCode | text | nullable | ex. "TS-2026" |
| actionNumber | int | nullable | nº sequencial interno |
| startDate | timestamp | **cliente** | |
| endDate | timestamp | **cliente** | |
| roomId | text (cuid) | nullable | FK `rooms` |
| format | enum `TrainingFormat` | **cliente** | PRESENCIAL \| ELEARNING |
| financingSystem | enum `FinancingSystem` | nullable | valores desconhecidos (todos null nos dados) |
| maxTrainees | int | nullable | |
| minTrainees | int | nullable | |
| status | enum `TrainingStatus` | **default = DRAFT** | DRAFT, SCHEDULED, IN_PROGRESS, COMPLETED. Omitir quando vazio (não enviar null) |
| createdAt | timestamp | default now() | |
| updatedAt | timestamp | **cliente** | tem updatedAt -> `withDbDefaults` |

**Não existe coluna trainerId nem contractId em training_actions.**

## training_sessions (sessões individuais da action)

Colunas: `id, trainingActionId, trainerId, sessionDate, startTime,
endTime, durationHours, checkinOpenAt, checkinCloseAt, checkinQrCode,
checkinQrExpiresAt, isOpen, isClosed, closedAt, closedById, summary,
didacticResources, trainerSignatureUrl, trainerSignedAt, createdAt,
updatedAt, googleEventId`

| Coluna | Tipo | NOT NULL | Notas |
|---|---|---|---|
| id | text (cuid) | **cliente** | `withDbDefaults` |
| trainingActionId | text (cuid) | **cliente** | FK `training_actions` |
| trainerId | text (cuid) | **cliente** | FK `trainers` (1 formador por sessão) |
| sessionDate | timestamp | **cliente** | |
| startTime | **text** | **cliente** | formato "HH:MM" (ex. "09:00", "18:30") — NÃO é tipo time |
| endTime | **text** | **cliente** | "HH:MM" |
| durationHours | numeric | **cliente** | |
| updatedAt | timestamp | **cliente** | tem updatedAt -> `withDbDefaults` |
| checkinOpenAt/checkinCloseAt | timestamp | default | |
| checkinQrCode/checkinQrExpiresAt | text/ts | nullable | |
| isOpen | bool | default (false) | |
| isClosed | bool | default | |
| closedAt/closedById | ts/text | nullable | |
| summary/didacticResources | text | nullable | sumário pedagógico |
| trainerSignatureUrl/trainerSignedAt | text/ts | nullable | |
| createdAt | timestamp | default now() | |
| googleEventId | text | nullable | |

**NÃO existe coluna de módulo (moduleId/courseModuleId) nem de tipo de
sessão (teórica/prática) em training_sessions.**

## course_modules (módulos do curso/template)

Colunas confirmadas: `id, courseId, name, description, durationHours, order`
(NÃO tem tenantId, createdAt, updatedAt, isActive, objectives, content)

| Coluna | Tipo | NOT NULL | Notas |
|---|---|---|---|
| id | text (cuid) | **cliente** | `withId` (sem updatedAt) |
| courseId | text (cuid) | **cliente** | FK `courses` |
| name | text | **cliente** | |
| description | text | nullable | |
| durationHours | numeric | **cliente** | |
| order | int | **cliente** (sem default) | coluna de reordenação |

## training_action_trainers (ponte multi-formador)

Colunas: `id, trainingActionId, trainerId, role` (tabela vazia)
- id: text (cuid) — `withId`
- trainingActionId: FK `training_actions`
- trainerId: FK `trainers`
- role: **text** (não é enum; sem dados para inferir valores — ex. provável
  "PRINCIPAL"/"AUXILIAR"/"COORDENADOR" mas NÃO confirmável, não inventar)
- Sem tenantId/createdAt/updatedAt aparentes.

## enrollments (inscrições formando↔action)

Colunas: `id, trainingActionId, traineeId, enrolledAt, status,
completedAt, finalGrade, passed`
- id text(cuid), trainingActionId FK, traineeId FK
- status: **text livre** (NÃO é enum — domain.ts EnrollmentStatus não é
  imposto pela BD)
- enrolledAt ts, completedAt ts nullable, finalGrade numeric nullable,
  passed bool
- Sem tenantId/createdAt/updatedAt.
- **INSERT bloqueado por RLS para TENANT_ADMIN** (admin@oportoforte.com ->
  `42501`). Igual ao caso training_areas: a policy de escrita de enrollments
  não cobre este role. "Adicionar Formando" não vai persistir para este
  utilizador sem ajuste de RLS (fora de scope: "NÃO mexas em RLS").

---

## Enums

| Enum | Tabela.coluna | Valores |
|---|---|---|
| `TrainingStatus` | training_actions.status | DRAFT (default), SCHEDULED, IN_PROGRESS, COMPLETED |
| `TrainingFormat` | training_actions.format, courses.format | PRESENCIAL, ELEARNING |
| `FinancingSystem` | training_actions.financingSystem | desconhecidos (todos null; precisa enum_range no SQL Editor) |
| (texto) | enrollments.status | livre, sem enum |
| (texto) | training_action_trainers.role | livre, sem enum |

## Grafo de FKs

- training_actions.courseId -> courses.id
- training_actions.planId -> training_plans.id (nullable)
- training_actions.clientOrgId -> client_orgs.id (nullable)
- training_actions.roomId -> rooms.id (nullable)
- training_sessions.trainingActionId -> training_actions.id
- training_sessions.trainerId -> trainers.id
- course_modules.courseId -> courses.id
- training_action_trainers.trainingActionId -> training_actions.id
- training_action_trainers.trainerId -> trainers.id
- enrollments.trainingActionId -> training_actions.id
- enrollments.traineeId -> trainees.id
- contracts.clientOrgId -> client_orgs.id  (único link de contracts)

---

## GAPS schema vs prompt (decisões necessárias antes de codar)

1. **Contrato obrigatório sem onde gravar.** `training_actions` NÃO tem
   `contractId`; `contracts` NÃO tem `trainingActionId`/`actionId`. O único
   elo de contracts é `clientOrgId`. A regra "associar contrato antes de
   gravar a action" não tem coluna de persistência. Opções: (A) gate só de
   UI (exigir escolher um contrato do cliente para activar Gravar, mas a
   escolha não fica gravada na action); (B) usar uma tabela ponte/coluna
   nova (precisa migration — fora de "não mexas em RLS" mas é schema);
   (C) adiar a regra.
2. **Sessão sem módulo.** Step 2 pede "Módulo (select dos módulos do
   curso)" por sessão, mas training_sessions não tem moduleId. Não inventar.
3. **Sessão sem tipo.** Step 2 pede "Tipo (Teórica/Prática)" por sessão;
   não existe coluna. Não inventar.
4. **Formador da action é multi via ponte** (training_action_trainers),
   não há trainerId em training_actions. A coluna "Formador" da listagem
   deriva da ponte (ou das sessões).
5. **enrollments INSERT bloqueado por RLS** para TENANT_ADMIN — Tab
   Formandos "Adicionar" não persistirá sem ajuste RLS (fora de scope).

---

## Migration v2 aplicada (2026-05-17) — estado real

- `training_actions.contractId` text, FK -> contracts.id, nullable, ON DELETE
  SET NULL. (36 ações históricas ficam com contractId NULL -> badge "Sem
  contrato" na listagem, sem bloquear.)
- `training_sessions.courseModuleId` text, FK -> course_modules.id, nullable.
- `training_sessions.sessionType` enum `SessionType`: **TEORICA, PRATICA,
  MISTA** (3 valores; o prompt só pedia 2).
- **Atenção:** `training_sessions` ficou também com uma coluna `moduleId`
  (FK course_modules, do rascunho inicial da migration). Duas FKs para
  course_modules tornam o embed implícito ambíguo (PGRST201). Workaround
  no código: `course_modules!courseModuleId(name)`. Recomendação opcional:
  migration de limpeza `ALTER TABLE training_sessions DROP COLUMN "moduleId"`.
- `training_sessions` NÃO tem `roomId` (só a action tem `roomId`); sala é
  ao nível da ação, não da sessão. Não foi inventada.
- `training_actions` NÃO tem colunas para "Entidade Formadora",
  "Iniciativa", "Tipologia de Horário", "Local de Formação" -> não
  persistidas (não inventadas). Decisão futura se forem necessárias.

## Migration v3 aplicada (2026-05-18) — estado atual

- `training_sessions.moduleId` **REMOVIDO**. Só resta `courseModuleId` ->
  embed simples `course_modules(name)` (sem hint).
- `training_actions` +4 colunas TEXT nullable: `entidadeFormadora`,
  `iniciativaFormacao`, `tipologiaHorario`, `localFormacao`. Opcionais
  (histórico fica null). UI guarda códigos em texto: tipologiaHorario
  LABORAL/POS_LABORAL/MISTO; localFormacao INSTALACOES_CLIENTE/
  INSTALACOES_PROPRIAS/ONLINE/OUTRO.
- `enrollments.status` agora é enum **`EnrollmentStatus`**: PENDING,
  CONFIRMED, ATTENDED, COMPLETED, NO_SHOW, CANCELLED. (Default da app no
  insert: PENDING. "ENROLLED" já não é válido.)
- RLS ativo em `enrollments` e `training_action_trainers` **e permite
  escrita ao TENANT_ADMIN** (validado e2e: insert/update/delete OK).
  O aviso de RLS na Tab Formandos foi removido.

## Query autoritativa (SQL Editor, cross-check opcional)

```sql
SELECT table_name, column_name, is_nullable, column_default, data_type, udt_name
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name IN ('training_actions','training_sessions','course_modules',
                      'training_action_trainers','enrollments')
ORDER BY table_name, ordinal_position;

SELECT t.typname, e.enumlabel
FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid
WHERE t.typname IN ('TrainingStatus','TrainingFormat','FinancingSystem')
ORDER BY t.typname, e.enumsortorder;
```
