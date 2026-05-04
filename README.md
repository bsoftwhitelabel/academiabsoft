# Academia Digital — White-label SaaS

Plataforma multi-tenant de gestão de formação profissional certificada DGERT.

- **Stack**: Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Prisma · PostgreSQL
- **Multi-tenant**: path (`/oportoforte/...`), subdomain (`oportoforte.app.com`), custom domain (`formacao.oportoforte.com`)
- **White-label**: logo, paleta e domínio configuráveis por tenant; logo do cliente nos PDFs DGERT

## Setup local

### 1. Pré-requisitos

- Node.js 18+ (recomendado 20+)
- Docker Desktop (para Postgres local) **OU** uma DATABASE_URL hospedada (Neon, Supabase, Railway)

### 2. Instalar dependências

```bash
npm install
```

### 3. Variáveis de ambiente

```bash
cp .env.example .env
# edita .env conforme necessário (DATABASE_URL é o único obrigatório)
```

### 4. Iniciar Postgres

**Opção A — Docker (recomendado):**

```bash
docker compose up -d
```

Postgres fica disponível em `postgresql://postgres:postgres@localhost:5432/academia_digital`.

**Opção B — Postgres já instalado:**
Cria a base de dados e ajusta `DATABASE_URL` em `.env`.

**Opção C — Hospedado:**
Cola a connection string fornecida pelo Neon/Supabase em `DATABASE_URL`.

### 5. Schema + Seed

```bash
npm run db:push    # cria as tabelas a partir do prisma/schema.prisma
npm run db:seed    # popula com tenant Oporto Forte + dados realistas
```

### 6. Dev server

```bash
npm run dev
```

Abre http://localhost:3000 — redireciona para `/oportoforte/catalog`.

## Rotas

| Rota | Tela | Acesso |
|---|---|---|
| `/[tenant]/catalog` | Catálogo público | Anónimo |
| `/[tenant]/catalog/workshops` | Landing Workshops Saúde Mental | Anónimo |
| `/[tenant]/portal/dashboard` | Painel do formando | TRAINEE |
| `/[tenant]/admin/courses` | Gestão de cursos | ADMIN |
| `/[tenant]/trainer/sessions/[id]/attendance` | Controlo de presenças | TRAINER |

## Scripts úteis

```bash
npm run dev          # dev server
npm run build        # production build
npm run lint         # ESLint check
npm run db:push      # sync schema → db (sem migrations)
npm run db:migrate   # criar migration nova (dev)
npm run db:seed      # seed Oporto Forte
npm run db:reset     # reset + re-seed (⚠️ apaga tudo)
npm run db:studio    # Prisma Studio em http://localhost:5555
```

## Estrutura de dados (seed)

Após `db:seed` ficas com:

- **1 Tenant**: Grupo Oporto Forte
- **6 Entities**: Decathlon, ZF Automotive, Logistics Corp, Global Tech, Retail Pro, EDP Renováveis
- **12 Training Areas**: códigos DGERT (729, 345, 482, ...)
- **9 Courses** (8 ativos + 1 arquivado) com módulos
- **1 Admin** (Dr. Silva Neves)
- **6 Trainers** com CCP
- **25 Trainees** distribuídos pelas entities
- **6 Training Actions (turmas)** — T001 (Decathlon, em curso), T002, T003, T004 (concluída), T005, T006
- **22 Sessions** distribuídas pelas turmas
- **52 Enrollments**
- **12 Attendance records** para T001 sessão 3 (a "viva" no demo)

## Multi-tenant — como funciona

1. **Path-based** (default): `/oportoforte/catalog` — `tenantSlug` é segmento dinâmico
2. **Subdomain**: `oportoforte.localhost:3000` — middleware reescreve para `/oportoforte/...`
3. **Custom domain**: `formacao.oportoforte.com` — middleware lookup por `Tenant.domain` e reescreve

Adicionar um novo cliente white-label:

```sql
INSERT INTO "Tenant" (slug, name, primaryColor, accentColor, domain)
VALUES ('faculdade-x', 'Faculdade X', '#003366', '#FFA500', 'cursos.faculdadex.pt');
```

A partir desse momento, `cursos.faculdadex.pt` mostra o catálogo deles, com a paleta deles, sem alterações de código.

## Estado de implementação

- [x] **Multi-tenant** path/subdomain/custom-domain via middleware
- [x] **Catálogo público** (12 cursos · 6 áreas · filtros)
- [x] **Workshops landing** dedicada (9 blocos · 40 workshops)
- [x] **Course detail** com módulos + edições + sidebar de inscrição
- [x] **Trainee portal** desktop + mobile responsivo
- [x] **Check-in flow** com canvas de assinatura digital (4 estados)
- [x] **Admin** gestão de cursos com filtros/grid/criação
- [x] **Trainer attendance** com donut chart + lista + check-in
- [x] **Auth custom** (login email/password admin & trainer · magic-link Resend para formando)
- [x] **PDFs DGERT** (Folha de Presenças · Ficha de Inscrição · Ata de Reunião) com logo tri-header
- [x] **Seed Postgres** com dados realistas Oporto Forte
- [x] **Docker compose** para dev local
- [x] **Deploy guide** completo ([DEPLOY.md](./DEPLOY.md))

## Próximos passos (após primeiro deploy)

- [ ] Persistência das assinaturas em Cloudflare R2 / S3
- [ ] Migrar layouts/páginas de mock para queries Prisma 100%
- [ ] Endpoint `POST /api/tenants` para criar clientes white-label self-service
- [ ] Calendário sincronizado com Google Calendar / Outlook
- [ ] WhatsApp Business API para notificações
- [ ] Dashboard analítico com métricas DGERT (taxa adesão, NPS, conclusões)

## Documentação

- [DEPLOY.md](./DEPLOY.md) — Guia de deploy Vercel + Neon + custom domain
- `prisma/schema.prisma` — Schema da base de dados (14 modelos)
- `src/lib/auth/jwt.ts` — Detalhes da implementação JWT
