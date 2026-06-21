# Deploy no Vercel

Setup actual: **frontend Vite** + **backend Hono em Serverless Function única**,
ambos no mesmo projecto Vercel, mesmo origin. Sem CORS em produção.

## Arquitectura

```
Browser  ─────►  Vercel CDN (frontend estático Vite, /dist)
              │
              └─►  /api/*  ──►  api/index.ts (Serverless Function Node.js)
                                  │
                                  └─►  Hono app (api/src/app.ts)
                                        ├─ /api/health
                                        ├─ /api/q/...            (público, rate-limit)
                                        ├─ /api/q/psy/:token     (público, rate-limit)
                                        ├─ /api/psy/...          (admin, requireAuth)
                                        └─ /api/pdf/*            (501 em serverless)
```

A função `api/index.ts` apanha **todas as rotas `/api/*`** via rewrites no
`vercel.json` e delega para a app Hono. Há uma única função (cold start
partilhado, simples de raciocinar).

## Importar no Vercel

1. **Conectar repo**
   - Dashboard Vercel → Add New → Project
   - Importar `bsoftwhitelabel/academiabsoft` (branch `main`)
   - Framework: detectado automaticamente como **Vite**

2. **Build & Output**
   - Build Command: `npm run build` (do `vercel.json`)
   - Output Directory: `dist`
   - Install Command: `npm install && npm --prefix api install --omit=optional`
   - Estes valores já estão fixados no `vercel.json`; o Vercel obedece.

3. **Environment Variables** (definir as 3 ambientes: Production, Preview, Development)

| Variável | Onde se usa | Valor de exemplo |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend (bundle) | `https://ecqptnirekuiibhmnbaq.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Frontend (bundle) | `eyJ…` (anon key, pública) |
| `SUPABASE_URL` | Backend (function) | igual ao VITE_ |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend (function) | `eyJ…` (service_role, NUNCA expor ao cliente) |
| `APP_ORIGIN` | Backend (CORS) | `https://academiabsoft.vercel.app` (ou o teu domínio custom) |
| `PUBLIC_APP_ORIGIN` | Backend (links psy) | igual ao APP_ORIGIN |
| `NODE_ENV` | Backend | Vercel define automaticamente para `production` |

**NÃO definir** em Vercel: `DATABASE_URL` (só usada por scripts locais),
`PORT` (Vercel define), `CORS_ORIGIN` (legado, substituído por APP_ORIGIN),
`PSY_SEED_TENANT_ID` (só seeds locais).

4. **Region**: `fra1` (Frankfurt) já configurada no `vercel.json` — mais próxima de PT.

5. **Domínio custom** (opcional): Settings → Domains. Depois actualizar
   `APP_ORIGIN` e `PUBLIC_APP_ORIGIN` para o domínio novo.

## Validar após deploy

```bash
# 1. Health
curl https://<deploy>.vercel.app/api/health
# Esperado: {"ok":true,"service":"academia-api","runtime":"vercel","ts":"..."}

# 2. Auth obrigatória (esperado 401)
curl https://<deploy>.vercel.app/api/psy/campaigns

# 3. CORS preflight de outra origin (esperado 204 sem allow-origin)
curl -i -X OPTIONS https://<deploy>.vercel.app/api/psy/campaigns \
  -H "Origin: https://evil.example.com" \
  -H "Access-Control-Request-Method: POST"
```

## Limitações conhecidas

### Rota PDF (`/api/pdf/*`) devolve 501

`puppeteer` + Chromium full pesa > 250 MB unzipped — passa o limite de Vercel
Serverless (50 MB unzipped, 250 MB compressed). O app salta a rota em
serverless e responde 501 com mensagem explicativa.

Para activar PDF em Vercel: substituir `puppeteer` por `puppeteer-core` +
`@sparticuz/chromium` (≈ 50 MB) e editar `api/src/app.ts` para montar a rota
mesmo em serverless. PR separado.

### PostgREST schema cache

O cache do PostgREST do Supabase tem TTL ~10 min. Após uma migração nova
(ex: v13 a adicionar tabela), os primeiros pedidos podem dar `PGRST205`.
Forçar reload via SQL Editor: `NOTIFY pgrst, 'reload schema';`

### Cold start

Função única em região `fra1`: primeiro pedido ~ 1-2s. Pedidos seguintes
servidos warm (~ 50-200 ms). Para produção com pico baixo de tráfego, este
modelo é aceitável; para sustained traffic, considerar Vercel Pro com
[Fluid Compute](https://vercel.com/docs/functions/fluid-compute) ou migrar
para outro provider stateful.

### Migrações e seeds

`api/scripts/*` (apply-v12, seed-psy-nr1, seed-psy-fixture-responses,
audit-users-tenant, etc) **não vão para Vercel** (estão no `.vercelignore`).
Correr sempre localmente, com `DATABASE_URL` em `api/.env`. Ver
`api/.env.example`.

## Rollback rápido no Vercel

Se um deploy partir produção: Deployments → escolher deploy anterior →
"Promote to Production". Sem mexer em código.

## Estrutura do projecto vs Vercel

```
academia-digital-v2/
├── src/                  ← frontend Vite (build → dist/)
├── api/
│   ├── index.ts          ← ÚNICA Serverless Function (handler Hono)
│   ├── src/
│   │   ├── app.ts        ← Hono app (shared Node + Vercel)
│   │   ├── index.ts      ← bootstrap Node local (npm run dev:api)
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── ...
│   ├── scripts/          ← NÃO vai para Vercel (.vercelignore)
│   └── seed/             ← idem
├── docs/                 ← idem
├── vercel.json
├── .vercelignore
└── package.json
```

Vercel apenas reconhece **ficheiros directamente em `api/`** como functions.
Os ficheiros em `api/src/`, `api/scripts/`, etc, não são endpoints — são
módulos importados pelo `api/index.ts`.
