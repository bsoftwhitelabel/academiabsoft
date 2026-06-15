# Mapa de defaults da BD (academia-digital-v2)

Tabelas geridas por Prisma. `id @default(cuid())` e `@updatedAt` são gerados
pelo **cliente Prisma**, não pela BD — a BD não tem default nessas colunas.
Os hooks da app passaram a preencher isto via `src/lib/db-helpers.ts`.

Método: introspecção empírica pelo caminho real (anon key + login admin),
sonda adaptativa de `23502` com tenant/FK pré-semeados para passar o
`WITH CHECK` de RLS (tenant scoping). `information_schema` não é exposto pela
PostgREST; query autoritativa para cross-check no SQL Editor no fim deste doc.

Legenda: **cliente** = NOT NULL sem default, o cliente tem de preencher.
**seed/RLS** = exigido pela policy RLS (tenant scoping). **default** = a BD
preenche (não aparece na sonda). Data: 2026-05-17.

## Coluna updatedAt — existe ou não (decisivo para o helper)

| Tem `updatedAt` (usar `withDbDefaults`) | NÃO tem `updatedAt` (usar `withId`) |
|---|---|
| users, trainees, courses, client_orgs, training_plans, training_actions, training_sessions | trainers, rooms, contracts, course_modules, training_areas |

Enviar `updatedAt` às da direita dá erro `42703 column does not exist`.

## users
- id: NOT NULL, sem default -> **cliente** (cuid)
- tenantId: NOT NULL -> **seed/RLS** (tenant do utilizador)
- email: NOT NULL, sem default -> **cliente** (form)
- role: NOT NULL, sem default -> **cliente** (enum UserRole, ex. "TRAINER")
- firstName: NOT NULL, sem default -> **cliente** (form)
- lastName: NOT NULL, sem default -> **cliente** (form)
- updatedAt: NOT NULL, sem default -> **cliente** (now())
- passwordHash: **NÃO** é NOT NULL na sonda (nullable ou default). Mantém-se o
  placeholder `"supabase_auth_managed"` por robustez/instrução, mas não é
  estritamente exigido pela BD.
- createdAt: default now() -> OK

## trainers (sem updatedAt)
- id: NOT NULL, sem default -> **cliente** (cuid)
- tenantId: NOT NULL -> **seed/RLS** (tenant do utilizador)
- userId: NOT NULL, sem default -> **cliente** (cria user primeiro). UNIQUE.
- ccpNumber/isExternal/eTrainer/regions/... : opcionais
- (sem createdAt/updatedAt na tabela)

## trainees
- id: NOT NULL, sem default -> **cliente** (cuid)
- tenantId: NOT NULL -> **seed/RLS**
- clientOrgId: NOT NULL -> **seed/RLS** (a listagem já é filtrada por entidade)
- firstName: NOT NULL, sem default -> **cliente** (form)
- lastName: NOT NULL, sem default -> **cliente** (form)
- email: **NOT NULL, sem default** -> **cliente** (form). ATENÇÃO: o form
  permitia email vazio; passou a ser obrigatório.
- updatedAt: NOT NULL, sem default -> **cliente** (now())
- createdAt: default now() -> OK

## rooms (sem updatedAt)
- id: NOT NULL, sem default -> **cliente** (cuid)
- tenantId: NOT NULL -> **seed/RLS**
- name: NOT NULL, sem default -> **cliente** (form)
- capacity/address/city/equipment/isActive: opcionais

## courses
- id: NOT NULL, sem default -> **cliente** (cuid)
- tenantId: NOT NULL -> **seed/RLS**
- name: NOT NULL, sem default -> **cliente** (form)
- slug: NOT NULL, sem default -> **cliente** (gerado do name)
- durationHours: NOT NULL, sem default -> **cliente** (form, número)
- format: NOT NULL, sem default -> **cliente** (enum TrainingFormat:
  PRESENCIAL | ELEARNING)
- updatedAt: NOT NULL, sem default -> **cliente** (now())
- status: **NOT NULL COM default (DRAFT)** -> NÃO enviar null explícito
  (viola NOT NULL). Omitir quando vazio; o hook useUpsertCourse remove a
  chave. Enum CourseStatus: DRAFT, PUBLISHED confirmados.
- areaId/code/sigla/shortDescription: opcionais (nullable)
- createdAt: default now() -> OK

## client_orgs
- id: NOT NULL, sem default -> **cliente** (cuid)
- tenantId: NOT NULL -> **seed/RLS**
- name: NOT NULL, sem default -> **cliente** (form)
- updatedAt: NOT NULL, sem default -> **cliente** (now())
- createdAt: default now() -> OK

## contracts (sem updatedAt, sem tenantId)
- id: NOT NULL, sem default -> **cliente** (cuid)
- clientOrgId: NOT NULL -> **seed/RLS** (RLS deriva tenant via client_orgs)
- startDate: **NOT NULL, sem default** -> **cliente** (form). ATENÇÃO: o form
  tinha startDate opcional; passou a ser obrigatório.
- endDate/value/fileUrl/description: opcionais
- createdAt: default now() -> OK

## training_plans
- id: NOT NULL, sem default -> **cliente** (cuid)
- tenantId: NOT NULL -> **seed/RLS**
- name: NOT NULL, sem default -> **cliente** (form)
- startDate: NOT NULL, sem default -> **cliente** (form)
- endDate: NOT NULL, sem default -> **cliente** (form)
- updatedAt: NOT NULL, sem default -> **cliente** (now())
- createdAt: default now() -> OK

## training_areas (sem updatedAt)
- **RLS: escrita bloqueada para TENANT_ADMIN.** Decisão 3: só `SUPER_ADMIN`
  escreve. Com admin@oportoforte.com (TENANT_ADMIN) qualquer
  create/update/delete devolve `42501`. Comportamento esperado, não bug.
  O TrainingAreasPage só funciona para escrita autenticado como SUPER_ADMIN.
- id: NOT NULL, sem default -> **cliente** (cuid) [quando SUPER_ADMIN]
- name: NOT NULL, sem default -> **cliente**
- leitura: aberta a authenticated (Decisão 3)

## training_actions (sem form de criação na UI)
- id: NOT NULL, sem default -> **cliente** (cuid)
- tenantId: NOT NULL -> **seed/RLS**
- courseId: NOT NULL, sem default -> **cliente** (FK courses)
- startDate: NOT NULL, sem default -> **cliente**
- endDate: NOT NULL, sem default -> **cliente**
- format: NOT NULL, sem default -> **cliente** (enum TrainingFormat)
- updatedAt: NOT NULL, sem default -> **cliente** (now())
- TrainingActionsPage é só leitura/filtros; não há create/edit/delete na UI.

## course_modules (sem updatedAt, sem form na UI)
- id: NOT NULL, sem default -> **cliente** (cuid)
- courseId: NOT NULL -> **seed/RLS** (FK courses; RLS deriva tenant via course)
- name: NOT NULL, sem default -> **cliente**
- durationHours: NOT NULL, sem default -> **cliente** (número)
- order: NOT NULL, sem default -> **cliente** (número; nome é palavra
  reservada SQL mas ok no corpo JSON do insert)
- Sem CRUD na UI (stub).

## training_sessions (sem form na UI)
- id: NOT NULL, sem default -> **cliente** (cuid)
- trainingActionId: NOT NULL -> **seed/RLS** (FK training_actions)
- trainerId: NOT NULL, sem default -> **cliente** (FK trainers)
- sessionDate: NOT NULL, sem default -> **cliente**
- startTime: NOT NULL, sem default -> **cliente**
- endTime: NOT NULL, sem default -> **cliente**
- durationHours: NOT NULL, sem default -> **cliente** (número)
- updatedAt: NOT NULL, sem default -> **cliente** (now())
- Sem CRUD na UI.

---

## Query autoritativa (correr no SQL Editor para cross-check)

```sql
SELECT table_name, column_name, is_nullable, column_default, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'users','trainers','trainees','rooms','courses','client_orgs',
    'contracts','training_plans','training_areas','training_actions',
    'course_modules','training_sessions'
  )
ORDER BY table_name, ordinal_position;
```

Colunas com `is_nullable = 'NO'` e `column_default IS NULL` são as que o
cliente tem de preencher (acima marcadas como **cliente**).
