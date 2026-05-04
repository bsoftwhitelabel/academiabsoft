# Deploy — Academia Digital

Guia completo para colocar a plataforma em produção. Tempo estimado: **45 a 60 minutos**.

Stack de produção alvo:

- **Vercel** — hospedagem da app Next.js (frontend + API routes + middleware)
- **Neon** ou **Supabase** — PostgreSQL gerido (escolha um)
- **Resend** — envio de emails transacionais (opcional, mas recomendado)
- **Cloudflare R2** ou **AWS S3** — armazenamento de assinaturas e PDFs (Task posterior)
- **Domínio próprio** — multi-tenant por path, subdomain ou domínio custom

---

## 1 · Provisionar Postgres

### Opção A — Neon (recomendado para Vercel)

1. Criar conta em https://neon.tech
2. New Project → escolher região `eu-central-1` (Frankfurt) ou `eu-west-2` (London) para clientes europeus
3. Copiar a connection string (formato `postgresql://USER:PASS@HOST/DB?sslmode=require`)
4. Adicionar `?pgbouncer=true&connection_limit=1` se for usar Vercel serverless

Connection string final:

```
postgresql://USER:PASS@HOST.neon.tech/academia_digital?sslmode=require&pgbouncer=true&connection_limit=1
```

### Opção B — Supabase

1. Criar projeto em https://supabase.com
2. Settings → Database → Connection string (mode "Transaction" para serverless)
3. Connection string ficará em formato:

```
postgresql://postgres:PASS@aws-0-eu-west-2.pooler.supabase.com:6543/postgres
```

### Aplicar schema + seed

Localmente, com a `DATABASE_URL` da Neon/Supabase em `.env`:

```bash
npm run db:push     # cria tabelas
npm run db:seed     # popula com tenant Oporto Forte
```

Verificar:

```bash
npm run db:studio   # abre Prisma Studio
```

---

## 2 · Resend (emails) — opcional mas recomendado

1. Criar conta em https://resend.com
2. Verificar domínio (ex: `oportoforte.com`) **OU** usar o domínio sandbox `resend.dev`
3. Criar API key em Settings → API Keys
4. Guardar como `RESEND_API_KEY`
5. Sender em `EMAIL_FROM` (ex: `Academia Digital <noreply@oportoforte.com>`)

Sem `RESEND_API_KEY`, o magic-link aparece no log do Vercel (útil para teste; perigoso em produção).

---

## 3 · Push do código para GitHub

```bash
cd "C:/Users/silva/OneDrive/Área de Trabalho/Academia Digital BSOFT/academia-digital"
git init
git branch -M main
git add .
git commit -m "Initial commit: Academia Digital white-label SaaS"
gh repo create neopulse/academia-digital --private --source=. --push
```

(ou usar GitHub web UI se preferir)

⚠️ Confirma que `.env` está no `.gitignore` antes do commit. (Já está — verificado.)

---

## 4 · Conectar Vercel

1. https://vercel.com/new
2. Import Git Repository → seleciona `academia-digital`
3. Framework: **Next.js** (auto-detected)
4. Build settings: deixa o default (`npm run build`, output `.next`)
5. Antes de fazer deploy, **adicionar Environment Variables**:

| Variável | Valor | Onde usar |
|---|---|---|
| `DATABASE_URL` | connection string Neon/Supabase | Production, Preview, Development |
| `AUTH_SECRET` | gera com `openssl rand -base64 48` (mín. 32 chars) | All |
| `AUTH_URL` | `https://academia-digital.vercel.app` (ou domínio) | Production |
| `NEXT_PUBLIC_DEFAULT_TENANT_SLUG` | `oportoforte` | All |
| `NEXT_PUBLIC_BASE_DOMAIN` | `academia-digital.vercel.app` (ou domínio) | All |
| `RESEND_API_KEY` | da Resend | Production, Preview |
| `EMAIL_FROM` | `Academia Digital <noreply@academia-digital.vercel.app>` | All |

6. Click **Deploy**

Em ~2-3 minutos, a aplicação fica em `https://academia-digital.vercel.app`.

---

## 5 · Custom domain

### Cenário 1 — Domínio principal único

`academia.bsoft.io` aponta para o Vercel deployment.

1. Vercel → Project → Settings → Domains → Add `academia.bsoft.io`
2. Configurar DNS no registrar (GoDaddy, Cloudflare, etc.):
   - `CNAME @ cname.vercel-dns.com`
3. Atualizar `NEXT_PUBLIC_BASE_DOMAIN=academia.bsoft.io`
4. Redeploy
5. Em < 5 min, `https://academia.bsoft.io/oportoforte/catalog` funciona

### Cenário 2 — Multi-tenant por subdomain

Cada cliente fica em `<tenantSlug>.academia.bsoft.io`.

1. Vercel → Domains → Add wildcard `*.academia.bsoft.io`
2. DNS:
   - `CNAME * cname.vercel-dns.com`
3. `NEXT_PUBLIC_BASE_DOMAIN=academia.bsoft.io`
4. Middleware já trata o rewrite: `oportoforte.academia.bsoft.io` → `/oportoforte/...`

### Cenário 3 — White-label custom domain por cliente

`formacao.oportoforte.com` aponta para o tenant `oportoforte`.

1. Vercel → Domains → Add `formacao.oportoforte.com`
2. Cliente configura DNS:
   - `CNAME formacao cname.vercel-dns.com`
3. No DB, atualizar o tenant:
   ```sql
   UPDATE "Tenant"
   SET "domain" = 'formacao.oportoforte.com'
   WHERE slug = 'oportoforte';
   ```
4. Atualizar middleware para resolver `Tenant.domain` (TODO: requer Edge KV — Vercel Edge Config ou Upstash)

---

## 6 · Pós-deploy checklist

- [ ] `https://[domain]/` redireciona para `/oportoforte/catalog`
- [ ] Catálogo público abre sem login e mostra os 9 cursos seeded
- [ ] `/oportoforte/catalog/workshops` mostra os 9 blocos × 40 workshops
- [ ] `/oportoforte/auth/login` aceita `admin@oportoforte.pt` / `Admin@2026`
- [ ] Após login admin, redireciona para `/oportoforte/admin/courses`
- [ ] `/oportoforte/auth/magic-link` envia email (verificar Resend logs OU log do Vercel)
- [ ] `/oportoforte/portal/dashboard` (após magic-link) mostra dashboard do formando
- [ ] `/oportoforte/trainer/sessions/s-001/attendance` mostra controlo de presenças
- [ ] Dropdown "Documentos DGERT" descarrega 3 PDFs válidos
- [ ] Acessar `/oportoforte/admin/courses` sem cookie redireciona para `/auth/login`
- [ ] Logout em `/oportoforte/auth/logout` limpa session

---

## 7 · Adicionar novos tenants (white-label)

### Via SQL (rápido)

```sql
INSERT INTO "Tenant" (id, slug, name, "primaryColor", "accentColor", "createdAt", "updatedAt")
VALUES (
  'tenant_faculdade_x',
  'faculdade-x',
  'Faculdade X',
  '#003366',
  '#FFA500',
  NOW(),
  NOW()
);
```

A partir desse momento, `https://[domain]/faculdade-x/catalog` mostra o catálogo deles, com a paleta deles, sem alterações de código.

### Via API (futuro)

A construir: endpoint admin `POST /api/tenants` para self-service.

---

## 8 · Migrações futuras

Sempre que mudar o schema:

```bash
# local
npm run db:migrate -- --name <nome-da-mudança>

# produção
git push                     # CI / Vercel deploy
# em local, com DATABASE_URL apontando para produção:
npm run db:push              # ou prisma migrate deploy
```

---

## 9 · Observabilidade básica (recomendado)

1. **Vercel Analytics** (incluído) — Web Vitals + page views
2. **Vercel Logs** (incluído) — runtime logs por função
3. **Sentry** (opcional) — `@sentry/nextjs` para erros
4. **Posthog** (opcional) — produto analytics no front

---

## 10 · Custos esperados (estimativa)

| Item | Plano | Custo/mês |
|---|---|---|
| Vercel Pro | Pro | ~€20 |
| Neon | Free → Launch | €0 → €20 |
| Resend | Free → Pro | €0 → €20 (3k → 50k emails) |
| Domínio `.com` | — | ~€1/mês amortizado |
| **TOTAL inicial** | | **€20–€60/mês** |

Mais adiante quando começar a escalar:

- Cloudflare R2 (storage) — €0.015/GB
- Upstash Redis (Edge cache, sessions) — Free tier generoso
- Sentry — €25/mês (10k errors)

---

## Suporte

Em caso de problema durante deploy, partilhar:

1. Output completo de `npm run build`
2. Logs do Vercel deployment
3. Output de `npm run db:push`

— Neo Pulse
