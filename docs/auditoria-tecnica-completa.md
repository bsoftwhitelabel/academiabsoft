# Auditoria Técnica Completa — Academia Digital v2

> Documento gerado mecanicamente em modo read-only. Sem alterações ao código,
> sem deploys, sem migrations executadas. Excepção: queries SELECT à BD do
> Supabase via `SUPABASE_SERVICE_ROLE_KEY` para inventário.
>
> **Data:** 2026-06-17T12:37:05Z
> **Pasta:** `C:\dev\academia-bsoft\academia-digital-v2`
> **Branch:** `master`

---

## Secção 1 — Metadata do projecto

| Campo | Valor |
|-------|-------|
| Nome | academia-digital-v2 (raiz) + academia-api (subprojecto) |
| Pasta absoluta | `C:\dev\academia-bsoft\academia-digital-v2` |
| Repositório git | inicializado localmente (sem remote) |
| Branch | `master` |
| Total commits | 4 |
| Último commit | `578f6a9 chore: fecha sprint-1 + actualiza contexto + cleanup processos` |
| Branches | apenas `master` |
| Tags | nenhuma |
| Data auditoria | 2026-06-17T12:37:05Z |

### git log --oneline -50

```
578f6a9 chore: fecha sprint-1 + actualiza contexto + cleanup processos
60b1d34 feat(fase-2b): endpoints Hono + UI publica de resposta + rate limit
fc9980a feat: PublicLayout + rota /q/:token + migration v10 (a aplicar)
1d96966 chore: snapshot inicial pre-sprint-1
```

### git status

```
On branch master
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	api/scripts/import-trainees-execute.ts
	api/scripts/import-trainees-plan.py
	api/scripts/import-trainees-snapshot.ts
	api/scripts/trainee-inventory.ts

nothing added to commit but untracked files present (use "git add" to track)
```

> Nota: a esta auditoria foram adicionados durante a execução `api/scripts/audit-queries.ts` e `api/scripts/_audit-output.json`, também untracked.

### git remote -v

Vazio. Sem remote configurado (decisão deliberada do Sprint 1 — push fica para depois da validação final).

### git diff --stat HEAD

Vazio. Working tree limpo vs HEAD (alterações são todas untracked, não modified).

### Ficheiros untracked

| Caminho | Tamanho |
|---------|---------|
| `api/scripts/import-trainees-execute.ts` | criado no import de 16/06 |
| `api/scripts/import-trainees-plan.py` | idem |
| `api/scripts/import-trainees-snapshot.ts` | idem |
| `api/scripts/trainee-inventory.ts` | idem |
| `api/scripts/audit-queries.ts` | criado nesta auditoria |
| `api/scripts/_audit-output.json` | output desta auditoria |

---

## Secção 2 — Estrutura de pastas

Árvore até 4 níveis (excluindo `node_modules`, `dist`, `.vite`, `.git`, `.agents`, `.claude`):

```
academia-digital-v2/
├── api/                        # Backend Hono em Node
│   ├── src/
│   │   ├── index.ts            # Bootstrap Hono + mount rotas
│   │   ├── env.ts              # Validação env (dotenv)
│   │   ├── middleware/
│   │   │   └── rate-limit.ts   # Map em memória por (scope, ip, token)
│   │   ├── routes/
│   │   │   ├── pdf.ts          # 3 endpoints PDF
│   │   │   └── questionnaires.ts # GET/POST /api/q/:token (Fase 2b)
│   │   ├── services/
│   │   │   ├── supabase.ts     # Cliente Supabase admin (SERVICE_ROLE_KEY)
│   │   │   ├── puppeteer.ts    # withPage + withBrowser
│   │   │   ├── storage.ts      # uploadPdfAndSign + signed URLs
│   │   │   ├── slug.ts         # Slugify helper
│   │   │   └── dossier-zip.ts  # ZIP completo do dossier (archiver)
│   │   └── templates/
│   │       ├── _shared.ts      # renderHeader/Footer + DGERT_LOGO_BASE64
│   │       ├── registry.ts     # Map templateCode → renderer
│   │       ├── checklist.ts
│   │       ├── ficha-identificacao.ts
│   │       ├── folha-presencas.ts
│   │       ├── registo-sumarios.ts
│   │       ├── plano-sessao.ts
│   │       └── separadora.ts
│   ├── scripts/                # Utilitários ad-hoc
│   │   ├── render-test.ts
│   │   ├── seal-zoom.ts
│   │   ├── find-action.ts
│   │   ├── check-v10.ts
│   │   ├── q-test.ts
│   │   ├── trainee-inventory.ts        (untracked)
│   │   ├── import-trainees-snapshot.ts (untracked)
│   │   ├── import-trainees-plan.py     (untracked)
│   │   ├── import-trainees-execute.ts  (untracked)
│   │   └── audit-queries.ts            (untracked)
│   ├── _out/                   # PDFs/PNGs de teste (gitignored)
│   ├── package.json
│   └── tsconfig.json
├── src/                        # Frontend React 19 + Vite 8
│   ├── app/
│   │   ├── main.tsx            # Bootstrap (Providers)
│   │   ├── App.tsx             # useRoutes
│   │   └── router.tsx          # 23 rotas (admin + trainer + público)
│   ├── components/
│   │   ├── ui/                 # shadcn (16 componentes)
│   │   ├── layout/             # AdminLayout, TrainerLayout, PublicLayout, Sidebar, Topbar, TenantThemeProvider, TrainerSidebar
│   │   ├── data-table/         # DataTable + autoColumns + TablePage
│   │   ├── feedback/           # ComingSoon + ErrorState
│   │   └── forms/              # FormModal
│   ├── hooks/                  # useAuth, useCurrentUser, useDebounce, useDefaultTenant, useLookups, useSupabaseTable
│   ├── lib/                    # supabase, query-client, db-helpers, token, utils
│   ├── pages/                  # 70+ ficheiros, organizados por domínio
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── courses/
│   │   ├── trainers/
│   │   ├── trainees/
│   │   ├── training-plans/
│   │   ├── actions/            # Inclui campaigns + new dialog
│   │   ├── questionnaires/
│   │   ├── management/         # CRUDs genéricos (client orgs, contracts, rooms, areas)
│   │   ├── trainer/            # Portal formador (10 hooks + 5 pages)
│   │   ├── public/             # PublicRespondPage + useResponseToken
│   │   ├── analytics/          # placeholder
│   │   ├── approvals/          # placeholder
│   │   └── projects/           # placeholder
│   ├── stores/                 # auth.store, tenant.store (Zustand)
│   ├── types/                  # database.ts (stub), domain.ts
│   ├── styles/                 # globals.css (não inspeccionado nesta auditoria)
│   └── env.d.ts
├── docs/
│   ├── auditoria-tecnica-completa.md   # este ficheiro
│   ├── db-defaults-map.md
│   ├── training-actions-schema.md
│   ├── rls-inventory.sql
│   ├── migration-central-module.sql
│   └── migrations/
│       └── v10_questionnaire_publico.sql
├── scripts/                    # Seed legado (1 ficheiro)
│   └── seed-oportoforte-v2.ts  # 689KB, importa BT-SOFT histórico
├── public/                     # favicon, icons
├── dist/                       # build output (1.1MB)
├── contexto.md                 # documento de retoma (18KB)
├── README.md                   # template Vite default (2.4KB)
├── package.json
├── tsconfig.json + tsconfig.app.json + tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── components.json             # shadcn config
├── dgert_b64.txt               # Logo DGERT em base64 (referência)
├── index.html
└── package-lock.json
```

Propósito por pasta de topo:

| Pasta | Propósito |
|-------|-----------|
| `api/` | Backend Hono que serve `/api/pdf/*` e `/api/q/*` na porta 3001. SERVICE_ROLE_KEY (bypassa RLS). |
| `src/` | Frontend SPA Vite+React 19. Conecta directo a Supabase via ANON_KEY (RLS aplicada). |
| `docs/` | Documentos técnicos versionados (migrations SQL, mapas de schema, esta auditoria). |
| `scripts/` | Seeds e migrations one-shot (legacy do BT-SOFT). |
| `public/` | Assets estáticos servidos pelo Vite. |
| `dist/` | Output `vite build` (não versionado). |

---

## Secção 3 — package.json e dependências

### Raiz — `package.json`

#### scripts

```json
{
  "dev:web": "vite",
  "dev:api": "npm --prefix api run dev",
  "dev": "concurrently -n web,api -c blue,green \"npm run dev:web\" \"npm run dev:api\"",
  "build": "tsc -b && vite build",
  "build:api": "npm --prefix api run build",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

#### dependencies

| Pacote | Versão actual | Wanted | Latest | Drift |
|--------|---------------|--------|--------|-------|
| @hookform/resolvers | ^5.2.2 | 5.4.0 | 5.4.0 | minor |
| @radix-ui/react-checkbox | ^1.3.3 | 1.3.5 | 1.3.5 | patch |
| @radix-ui/react-dialog | ^1.1.15 | 1.1.17 | 1.1.17 | patch |
| @radix-ui/react-dropdown-menu | ^2.1.16 | 2.1.18 | 2.1.18 | patch |
| @radix-ui/react-label | ^2.1.8 | 2.1.10 | 2.1.10 | patch |
| @radix-ui/react-select | ^2.2.6 | 2.3.1 | 2.3.1 | minor |
| @radix-ui/react-separator | ^1.1.8 | 1.1.10 | 1.1.10 | patch |
| @radix-ui/react-slot | ^1.2.4 | 1.3.0 | 1.3.0 | minor |
| @radix-ui/react-tabs | ^1.1.13 | 1.1.15 | 1.1.15 | patch |
| @supabase/supabase-js | ^2.105.4 | 2.108.2 | 2.108.2 | patch |
| @tanstack/react-query | ^5.100.10 | 5.101.0 | 5.101.0 | patch |
| @tanstack/react-query-devtools | ^5.100.10 | 5.101.0 | 5.101.0 | patch |
| @tanstack/react-table | ^8.21.3 | — | — | (em dia) |
| @tanstack/react-virtual | ^3.13.24 | 3.14.3 | 3.14.3 | minor |
| class-variance-authority | ^0.7.1 | — | — | (em dia) |
| clsx | ^2.1.1 | — | — | (em dia) |
| date-fns | ^4.1.0 | 4.4.0 | 4.4.0 | minor |
| lucide-react | ^1.16.0 | 1.20.0 | 1.20.0 | minor |
| next-themes | ^0.4.6 | — | — | (em dia) |
| react | ^19.2.6 | 19.2.7 | 19.2.7 | patch |
| react-dom | ^19.2.6 | 19.2.7 | 19.2.7 | patch |
| react-hook-form | ^7.75.0 | 7.79.0 | 7.79.0 | minor |
| react-router-dom | ^7.15.1 | 7.18.0 | 7.18.0 | minor |
| react-signature-canvas | ^1.1.0-alpha.2 | — | — | (alpha pinned) |
| sonner | ^2.0.7 | — | — | (em dia) |
| tailwind-merge | ^3.6.0 | — | — | (em dia) |
| zod | ^4.4.3 | — | — | (em dia, raiz usa v4) |
| zustand | ^5.0.13 | 5.0.14 | 5.0.14 | patch |

#### devDependencies

| Pacote | Versão | Drift |
|--------|--------|-------|
| @eslint/js | ^10.0.1 | em dia |
| @types/node | ^24.12.3 (actual 24.12.4) | 24.13.2 wanted, 25.9.3 latest — **major drift** |
| @types/react | ^19.2.14 | 19.2.17 wanted |
| @types/react-dom | ^19.2.3 | em dia |
| @types/react-signature-canvas | ^1.0.7 | em dia |
| @vitejs/plugin-react | ^6.0.1 | em dia |
| autoprefixer | ^10.5.0 | em dia |
| concurrently | ^9.2.1 | **10.0.3 latest — major drift** |
| eslint | ^10.3.0 (actual 10.4.0) | 10.5.0 wanted |
| eslint-plugin-react-hooks | ^7.1.1 | em dia |
| eslint-plugin-react-refresh | ^0.5.2 | 0.5.3 wanted |
| globals | ^17.6.0 | em dia |
| postcss | ^8.5.14 | 8.5.15 wanted |
| **tailwindcss** | ^3.4.19 | **4.3.1 latest — major drift (V4)** |
| typescript | ~6.0.2 | em dia |
| typescript-eslint | ^8.59.2 (actual 8.59.3) | 8.61.1 wanted |
| vite | ^8.0.12 (actual 8.0.13) | 8.0.16 wanted |

### `api/package.json`

#### scripts

```json
{
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

#### dependencies

| Pacote | Actual | Latest | Drift |
|--------|--------|--------|-------|
| @hono/node-server | ^1.13.7 (actual 1.19.14) | 2.0.5 | **major drift** |
| @supabase/supabase-js | ^2.45.4 (actual 2.106.0) | 2.108.2 | minor |
| archiver | ^7.0.1 | **8.0.0 latest — major drift** | — |
| cuid | ^3.0.0 | (deprecated em favor de `@paralleldrive/cuid2`) | — |
| dotenv | ^16.4.7 (actual 16.6.1) | **17.4.2 latest — major drift** | — |
| hono | ^4.6.14 (actual 4.12.19) | 4.12.25 | patch |
| p-limit | ^7.3.0 | em dia | — |
| puppeteer | ^23.10.4 (actual 23.11.1) | **25.1.0 latest — duas majors drift** | — |
| zod | ^3.24.1 (actual 3.25.76) | **4.4.3 latest — major drift (frontend usa v4)** | — |

#### devDependencies

| Pacote | Actual | Latest |
|--------|--------|--------|
| @types/archiver | ^7.0.0 | 8.0.0 |
| @types/node | ^22.10.2 (actual 22.19.19) | 25.9.3 |
| tsx | ^4.19.2 (actual 4.22.2) | 4.22.4 |
| typescript | ^5.7.2 (actual 5.9.3) | 6.0.3 |

### Identificações relevantes

1. **Versão de `zod` divergente entre raiz (v4) e api (v3).** Frontend e backend usam major versions diferentes — sintaxe de validação é semelhante mas tipos não são interoperáveis.
2. **Versão de `typescript` divergente entre raiz (v6) e api (v5.9).** Configurações distintas.
3. **`cuid` está deprecated** (markdown do npm já indica para migrar para `@paralleldrive/cuid2`). Em uso em `src/lib/db-helpers.ts` e `api/src/routes/questionnaires.ts`.
4. **Sem conflito de React.** Apenas 1 versão (`19.2.6`).
5. Lock file presente: `package-lock.json` raiz (195KB). API tem o seu próprio `api/package-lock.json`. Sem yarn ou pnpm.

### Tamanho de node_modules (observado)

| Pasta | MB |
|-------|----|
| `node_modules/` (raiz) | 210.7 MB |
| `api/node_modules/` | 89.1 MB |

---

## Secção 4 — Configuração e tooling

### `vite.config.ts`

```ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
```

### `tsconfig.json` (raiz)

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### `tsconfig.app.json`

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "esnext",
    "types": ["vite/client"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": false,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "paths": { "@/*": ["./src/*"] },
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "erasableSyntaxOnly": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

> Nota: `noUnusedLocals` e `noUnusedParameters` desactivados. Sem modo `strict` explícito.

### `tsconfig.node.json`

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023"],
    "module": "esnext",
    "types": ["node"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

### `api/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src"]
}
```

> API tem `"strict": true`. Raiz não.

### `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
```

### `postcss.config.js`

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### `eslint.config.js`

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])
```

### `.gitignore` completo

```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
api/node_modules
dist
dist-ssr
*.local
.vite

# Env (o padrão .env cobre api/.env em qualquer pasta)
.env
api/.env
.env.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Ferramentas locais do agente (skills instaladas, sessões CLI)
.agents/
.claude/

# Tokens de sessão e dumps de auth (NUNCA committar)
.token
auth.json

# Outputs de teste de geração de PDFs
api/_out/
```

### `components.json` (shadcn)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### Ficheiros de config ausentes

- `prettier.config.js` / `.prettierrc` — **ausente**
- `vercel.json` — **ausente** (sem alvo de deploy declarado)

---

## Secção 5 — Variáveis de ambiente

### Keys identificadas no código

| Key | Onde aparece (primeira) | Obrigatória? | Default | Em .env.example? |
|-----|-------------------------|--------------|---------|------------------|
| `VITE_SUPABASE_URL` | `src/lib/supabase.ts:3` | sim (throws no init) | nenhum | sim (raiz, vazio) |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.ts:4` | sim (throws no init) | nenhum | sim (raiz, vazio) |
| `VITE_PDF_API_URL` | `src/pages/public/useResponseToken.ts:4` | não | `http://localhost:3001` | **não** (não listado em `.env.example`) |
| `PORT` | `api/src/env.ts:7` | não | `3001` | sim |
| `SUPABASE_URL` | `api/src/env.ts:8` | sim para PDFs (assertPdfEnv) | `""` | sim |
| `SUPABASE_SERVICE_ROLE_KEY` | `api/src/env.ts:9` | sim para PDFs e questionários | `""` | sim (vazio) |
| `CORS_ORIGIN` | `api/src/env.ts:10` | não | `http://localhost:5173` | sim |
| `PDF_BUCKET` | `api/src/env.ts:11` | não | `dossier-pdfs` | sim |
| `SUPABASE_SERVICE_KEY` | `scripts/seed-oportoforte-v2.ts:13` | sim (script legacy) | nenhum | **não** (nome divergente do api/.env) |

### Confirmação .gitignore

- `api/.env` — ignorado ✓ (linha 19)
- `.env.local` — ignorado ✓ (linha 20)
- `.env` — ignorado ✓ (linha 18)
- `api/.env.example` — **tracked** (template, sem valores reais)
- `.env.example` (raiz) — **tracked** (template, vazio)

### Divergências env.example vs código

1. **`VITE_PDF_API_URL` em uso mas não em `.env.example`**. Quem clona o repo não tem pista para configurar a base URL do api.
2. **`scripts/seed-oportoforte-v2.ts` usa `SUPABASE_SERVICE_KEY`** (sem `_ROLE_` no meio). `api/.env.example` usa `SUPABASE_SERVICE_ROLE_KEY`. Nome diferente para a mesma chave conceptual.
3. `.env.example` (raiz) lista apenas duas keys (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`), ambas vazias.

### Conteúdo de `api/.env.example` (template, sem valores)

```
# Copiar para api/.env e preencher SUPABASE_SERVICE_ROLE_KEY com o valor real.
# A service_role key (Settings > API > service_role, formato eyJ...) bypassa
# RLS para queries server-side. NÃO é o Personal Access Token (sbp_...).
# api/.env está no .gitignore — nunca commitar.
PORT=3001
SUPABASE_URL=https://ecqptnirekuiibhmnbaq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
CORS_ORIGIN=http://localhost:5173
PDF_BUCKET=dossier-pdfs
```

---

## Secção 6 — Schema de base de dados (Prisma)

### Localização

`C:\dev\academia-bsoft\referencias\schema.prisma` — **fora da pasta do repositório do projecto**. Confirmado: nenhum `prisma/schema.prisma` ou `schema.prisma` na raiz do projecto. Coincide com tarefa T84 listada na auditoria de fechamento anterior.

### Models (24)

| Model | @@map | FKs | Indexes |
|-------|-------|-----|---------|
| Tenant | tenants | — | (PK + slug + domain unique) |
| User | users | tenantId, clientHrOrgId | tenantId, email |
| MagicLink | magic_links | userId | token |
| ClientOrg | client_orgs | tenantId | tenantId |
| Trainer | trainers | tenantId, userId (unique) | tenantId |
| Trainee | trainees | tenantId, userId (unique), clientOrgId | tenantId, clientOrgId, email |
| TrainingArea | training_areas | parentId (self) | — |
| Course | courses | tenantId, areaId | tenantId+status, unique(tenantId,slug) |
| CourseModule | course_modules | courseId | courseId |
| TrainingPlan | training_plans | tenantId | tenantId |
| TrainingAction | training_actions | tenantId, courseId, planId, clientOrgId, roomId | tenantId, clientOrgId, status |
| TrainingActionTrainer | training_action_trainers | trainingActionId, trainerId | unique(actionId, trainerId) |
| TrainingSession | training_sessions | trainingActionId, trainerId | trainingActionId |
| Enrollment | enrollments | trainingActionId, traineeId | unique(actionId, traineeId), traineeId |
| CheckIn | check_ins | sessionId, traineeId | unique(sessionId, traineeId), sessionId, traineeId |
| DocumentSignature | document_signatures | sessionId, traineeId | sessionId, traineeId |
| TrainingDocument | training_documents | trainingActionId | trainingActionId |
| Occurrence | occurrences | trainingActionId | trainingActionId |
| Certificate | certificates | traineeId | traineeId |
| Room | rooms | tenantId | tenantId |
| Inquiry | inquiries | tenantId | tenantId |
| NotificationTemplate | notification_templates | tenantId | unique(tenantId, event, channel) |
| NotificationLog | notification_logs | (sem FK Prisma) | tenantId |
| Questionnaire | questionnaires | (sem FK Prisma para tenant) | tenantId |
| QuestionnaireQuestion | questionnaire_questions | questionnaireId | questionnaireId |
| QuestionnaireResponse | questionnaire_responses | questionnaireId | questionnaireId |
| QuestionnaireAnswer | questionnaire_answers | responseId, questionId | responseId |
| TenantFinancingSystem | tenant_financing_systems | tenantId | unique(tenantId, system) |
| Contract | contracts | clientOrgId | clientOrgId |
| Waitlist | waitlist | (sem FK Prisma) | tenantId, courseId |
| AuditLog | audit_logs | tenantId, userId | tenantId, userId, createdAt |

### Enums (9)

| Enum | Valores |
|------|---------|
| UserRole | SUPER_ADMIN, TENANT_ADMIN, TENANT_STAFF, TRAINER, CLIENT_HR, TRAINEE |
| TrainingFormat | PRESENCIAL, ELEARNING, BLENDED |
| TrainingStatus | DRAFT, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |
| CourseStatus | DRAFT, PUBLISHED, FEATURED, ARCHIVED |
| DocumentType | FICHA_IDENTIFICACAO, CONTRATO_FORMANDO, CONTRATO_FORMADOR, REGISTO_PRESENCAS, AVALIACAO_FORMANDO, REGISTO_OCORRENCIAS, CERTIFICADO_CONCLUSAO, RELATORIO_FINAL |
| SignatureStatus | PENDING, ENABLED, SIGNED, REJECTED |
| CheckInStatus | CHECKED_IN, CHECKED_OUT, ABSENT, MANUAL |
| NotificationChannel | EMAIL, WHATSAPP, PUSH, SMS |
| NotificationEvent | ENROLLMENT_CONFIRMED, SESSION_REMINDER_24H, SESSION_REMINDER_2H, CHECKIN_AVAILABLE, SIGNATURE_ENABLED, CERTIFICATE_ISSUED, QUESTIONNAIRE_AVAILABLE, INQUIRY_RECEIVED, SESSION_CLOSED |
| FinancingSystem | POPH, PORNORTE, FSE2020, PT2030, PRR, PRIVATE, OTHER |

> O contexto.md menciona enum `SessionType` (TEORICA/PRATICA/MISTA) e `EnrollmentStatus`. Nenhum dos dois consta neste `schema.prisma`. Foram criados em migrations SQL aplicadas (v2/v3) mas o schema.prisma local não foi regenerado. **Divergência:** schema.prisma desactualizado vs BD real.

### Indexes ausentes em FKs detectados via leitura

Nenhum óbvio nos models críticos — Prisma cria index automaticamente em FKs unique e em colunas listadas em `@@index`. Não tenho como cross-checar via PostgREST sem `information_schema` (ver Secção 7).

### Enums não usados (analise estática)

- `DocumentType.RELATORIO_FINAL` — sem ocorrências no código frontend ou api inspeccionado nesta auditoria.
- `CourseStatus.FEATURED` e `CourseStatus.ARCHIVED` — sem ocorrências.
- `TrainingStatus.CANCELLED` — sem ocorrências (mas é estado válido).
- `NotificationEvent.*` — nenhum templado/log activo na BD (0 templates, 57 logs históricos).

> Estas verificações são leves (grep por nome do enum); não posso garantir cobertura total.

---

## Secção 7 — Schema real no Supabase

### Limitação encontrada

A API REST do Supabase (PostgREST) **não expõe** `information_schema` nem `pg_*` via HTTP. As 9 queries pedidas (7.1 a 7.9) requerem ou:

1. Acesso directo à BD via psql/connection string (não disponível neste setup), **ou**
2. Uma função `exec_sql(sql_text)` registrada no Supabase (tentei chamar via `sb.rpc("exec_sql", ...)` — retornou "Could not find the function public.exec_sql").

**Status:** as queries 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9 — **NÃO APURADAS via API**. Caminho para apurar manualmente: cola e corre cada query no Supabase Studio > SQL Editor.

### Substituto: enumeração de tabelas existentes via HEAD count

A query 7.1 (lista de tabelas) foi replicada testando `HEAD count` em cada tabela conhecida do `schema.prisma` mais 2 hipóteses adicionais (`evaluation_campaigns`, `approval_requests`). Resultado abaixo na Secção 8.

### Confirmações empíricas

- Todas as 31 tabelas do schema.prisma existem.
- Também existem: `evaluation_campaigns` (count = 0) e `approval_requests` (count = 2). **Estas tabelas estão na BD mas não no schema.prisma local.** Divergência clara.

### Comparação schema.prisma vs BD real

| Tabela | Schema | BD | Estado |
|--------|--------|----|----|
| `evaluation_campaigns` | ausente | existe (0 rows) | **Drift** — BD à frente |
| `approval_requests` | ausente | existe (2 rows) | **Drift** — BD à frente |
| Coluna `expiresAt` em `questionnaire_responses` | ausente no schema.prisma | existe na BD (v10) | **Drift** — BD à frente |
| Coluna `respondentIp` em `questionnaire_responses` | ausente | existe (v10) | **Drift** — BD à frente |
| Coluna `respondentUserAgent` em `questionnaire_responses` | ausente | existe (v10) | **Drift** — BD à frente |
| Enum `SessionType` em `training_sessions` | ausente no Prisma | existe na BD (migration v2) | **Drift** |
| Enum `EnrollmentStatus` | ausente no Prisma (campo é `String`) | existe na BD (migration v3) | **Drift** |
| Coluna `courseModuleId` em `training_sessions` | ausente | existe (v2) | **Drift** |
| Colunas DGERT (entidadeFormadora, iniciativaFormacao, tipologiaHorario, localFormacao) em `training_actions` | ausente | existe (v3) | **Drift** |
| Coluna `contractId` em `training_actions` | ausente no schema | existe (v2) | **Drift** |
| Coluna `gdprConsentAt` em `trainees` | presente no schema | confirmado na BD | match |
| `User.email` `@unique` | sim | há suspeita de **não estar enforced**: existem 2 `José Pinto` distintos com emails diferentes (jose.task028/031/033), mas o índice unique noutras situações pode ter sido criado depois. **NÃO APURADO** — requer query `pg_indexes`. |

### Helpers RLS prometidos

O `contexto.md` afirma helpers SQL: `current_user_id`, `current_user_tenant`, `current_user_role`, `is_super_admin`, `is_tenant_manager`, `is_trainer`. Não apurados via API (Secção 7 está bloqueada).

### Query manual a correr no SQL Editor para apurar a Secção 7 inteira

Cola este bloco no Supabase Studio > SQL Editor:

```sql
-- 7.1
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' ORDER BY table_name;
-- 7.2
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public'
ORDER BY table_name, ordinal_position;
-- 7.3
SELECT tc.table_name, kcu.column_name,
       ccu.table_name AS foreign_table_name,
       ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public';
-- 7.4
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes WHERE schemaname='public' ORDER BY tablename;
-- 7.5
SELECT t.typname, e.enumlabel
FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
ORDER BY t.typname, e.enumsortorder;
-- 7.6
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';
-- 7.7
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies WHERE schemaname='public' ORDER BY tablename;
-- 7.8
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers WHERE trigger_schema='public';
-- 7.9
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE specific_schema='public' AND routine_type IN ('FUNCTION', 'PROCEDURE');
```

---

## Secção 8 — Dados na base de dados

### Counts por tabela (via HEAD select com SERVICE_ROLE_KEY)

| Tabela | Existe | Count |
|--------|--------|-------|
| tenants | ✓ | 2 |
| users | ✓ | 24 |
| magic_links | ✓ | 0 |
| client_orgs | ✓ | 37 |
| trainers | ✓ | 9 |
| **trainees** | ✓ | **1.132** |
| training_areas | ✓ | 2 |
| courses | ✓ | 56 |
| course_modules | ✓ | 0 |
| training_plans | ✓ | 1 |
| training_actions | ✓ | 37 |
| training_action_trainers | ✓ | 34 |
| training_sessions | ✓ | 26 |
| enrollments | ✓ | 36 |
| check_ins | ✓ | 20 |
| document_signatures | ✓ | 7 |
| training_documents | ✓ | 0 |
| occurrences | ✓ | 2 |
| certificates | ✓ | 3 |
| rooms | ✓ | 0 |
| inquiries | ✓ | 10 |
| waitlist | ✓ | 0 |
| notification_templates | ✓ | 0 |
| notification_logs | ✓ | 57 |
| questionnaires | ✓ | 3 |
| questionnaire_questions | ✓ | 23 |
| questionnaire_responses | ✓ | 7 |
| questionnaire_answers | ✓ | 25 |
| tenant_financing_systems | ✓ | 0 |
| audit_logs | ✓ | 141 |
| **evaluation_campaigns** | ✓ | 0 (ausente no schema.prisma) |
| **approval_requests** | ✓ | 2 (ausente no schema.prisma) |

### Tenants existentes

| ID | Nome | Slug | isActive | DGERT | Platform Name |
|----|------|------|----------|-------|---------------|
| cmokapnym0000a443ubspljtn | TechPort Formação | techport | true | (null) | Academia Digital |
| cmok6xvlq0000pc43lyagc2pb | Grupo Oporto Forte | oportoforte | true | DGE-12345 | OPorto Forte |

### Distribuição de roles em users (24 total)

| Role | Count |
|------|-------|
| TRAINER | 9 |
| TRAINEE | 8 |
| TENANT_ADMIN | 4 |
| CLIENT_HR | 2 |
| TENANT_STAFF | 1 |

### Distribuição de status em training_actions (37 total)

| Status | Count |
|--------|-------|
| IN_PROGRESS | 23 |
| DRAFT | 7 |
| SCHEDULED | 4 |
| COMPLETED | 3 |

### Distribuição de status em enrollments (36 total)

| Status | Count |
|--------|-------|
| CONFIRMED | 33 |
| COMPLETED | 2 |
| CANCELLED | 1 |

### Distribuição de país em trainees (limit 5000)

| Country | Count |
|---------|-------|
| PT | 994 |
| BR | 3 |
| ES | 2 |
| FR | 1 |

### Distribuição courses por status / format

- status: PUBLISHED 56 (todos).
- format: PRESENCIAL 50, ELEARNING 6.

### Trainees sem client_org (clientOrgId IS NULL)

973 trainees (= maioria do import de 16/06 que ficou sem cliente por terem domínio de email pessoal).

### Samples (com mascaramento parcial de email/IP)

#### tenants (top 2)

```json
[
  { "id":"cmokapnym0000a443ubspljtn", "name":"TechPort Formação", "slug":"techport", "isActive":true, "primaryColor":"#0B2447" },
  { "id":"cmok6xvlq0000pc43lyagc2pb", "name":"Grupo Oporto Forte", "slug":"oportoforte", "isActive":true, "primaryColor":"#0B2447" }
]
```

#### users (3)

```json
[
  { "id":"cmok7watm0000ms437hn8twwt", "email":"for***om", "role":"TRAINER", "tenantId":"cmok6xvlq0000pc43lyagc2pb", "firstName":"Carlos", "lastName":"Formador", "isActive":true },
  { "id":"cmokum5bh0002h043ae3agg53", "email":"cel***om", "role":"TRAINER", "tenantId":"cmok6xvlq0000pc43lyagc2pb", "firstName":"Celso", "lastName":"Pinto", "isActive":true },
  { "id":"cmokuo9af0006h043648layoc", "email":"rh@***om", "role":"CLIENT_HR", "tenantId":"cmok6xvlq0000pc43lyagc2pb", "firstName":"Helena", "lastName":"RH", "isActive":true }
]
```

#### trainees (3) — emails mascarados

```json
[
  { "id":"cmokcr5m80007yo438fkxii5h", "firstName":"José", "lastName":"Pinto", "email":"jos***om", "nif":null, "clientOrgId":null, "tenantId":"cmok6xvlq0000pc43lyagc2pb" },
  { "id":"cmokee01z0007d843mkqrlk2e", "firstName":"José", "lastName":"Pinto", "email":"jos***om", "nif":null, "clientOrgId":null, "tenantId":"cmok6xvlq0000pc43lyagc2pb" },
  { "id":"cmokee0l60009d843as8zkso3", "firstName":"Ana", "lastName":"Costa", "email":"ana***om", "nif":null, "clientOrgId":null, "tenantId":"cmok6xvlq0000pc43lyagc2pb" }
]
```

#### trainers (3)

```json
[
  { "id":"cmok7wblh0001ms43b81kab0q", "userId":"cmok7watm0000ms437hn8twwt", "tenantId":"cmok6xvlq0000pc43lyagc2pb", "ccpNumber":null, "isExternal":false },
  { "id":"cmok8l5r000024s43enwdtlev", "userId":"cmok8l5g400014s43htucj12j", "tenantId":"cmok6xvlq0000pc43lyagc2pb", "ccpNumber":null, "isExternal":false },
  { "id":"cmokcjmcq000e4s43ovprub74", "userId":"cmokcjm0v000d4s43oiaatkmw", "tenantId":"cmok6xvlq0000pc43lyagc2pb", "ccpNumber":null, "isExternal":false }
]
```

#### training_actions (3)

```json
[
  { "id":"cmokqmzom00032043ac9w8c51", "actionCode":"TS-2026", "courseId":"cmokqmz6n00022043zkfo7ms7", "clientOrgId":null, "status":"IN_PROGRESS", "startDate":"2026-05-10T00:00:00", "endDate":"2026-05-20T00:00:00", "tenantId":"cmok6xvlq0000pc43lyagc2pb" },
  { "id":"cmokqotqe0002qg4372wqalfq", "actionCode":"TS-2026", "courseId":"cmokqmz6n00022043zkfo7ms7", "clientOrgId":null, "status":"IN_PROGRESS", "startDate":"2026-05-10T00:00:00", "endDate":"2026-05-20T00:00:00", "tenantId":"cmok6xvlq0000pc43lyagc2pb" },
  { "id":"action_test_001", "actionCode":"ACT-TEST-001", "courseId":"cmok6y1fx0009pc43qpq2axlq", "clientOrgId":null, "status":"IN_PROGRESS", "startDate":"2026-04-29T15:35:04.947", "endDate":"2026-05-29T15:35:04.947", "tenantId":"cmok6xvlq0000pc43lyagc2pb" }
]
```

#### training_sessions (3)

```json
[
  { "id":"session_test_001", "trainingActionId":"action_test_001", "sessionDate":"2026-04-29T15:36:43.937", "startTime":"18:30", "endTime":"22:30", "durationHours":4 },
  { "id":"cmokoqimu0003u043xunre0dr", "trainingActionId":"cmokoqib50001u043z238772e", "sessionDate":"2026-04-29T23:27:37.264", "startTime":"09:00", "endTime":"18:00", "durationHours":8 },
  { "id":"cmokcjcam000a4s43pdejszso", "trainingActionId":"cmokcjb8l00034s43te1i9z2l", "sessionDate":"2026-04-29T03:00:00", "startTime":"09:00", "endTime":"17:00", "durationHours":8 }
]
```

#### enrollments (3)

```json
[
  { "id":"enrollment_test_001", "trainingActionId":"action_test_001", "traineeId":"cmok7tt6u00019g43mnbyci3c", "status":"CONFIRMED", "enrolledAt":"2026-04-29T15:37:25.492" },
  { "id":"cmokcr5s90008yo43blxdzek1", "trainingActionId":"cmokcr4dy0002yo435uwk287y", "traineeId":"cmok7tt6u00019g43mnbyci3c", "status":"CONFIRMED", "enrolledAt":"2026-04-29T17:52:12.297" },
  { "id":"cmokcr5y00009yo43cbngn44c", "trainingActionId":"cmokcr4dy0002yo435uwk287y", "traineeId":"cmokcr5m80007yo438fkxii5h", "status":"CONFIRMED", "enrolledAt":"2026-04-29T17:52:12.504" }
]
```

#### courses (3)

```json
[
  { "id":"cmok6xy950005pc43ycfv1dr5", "name":"Liderança e Gestão de Equipas", "slug":"lideranca-gestao", "status":"PUBLISHED", "format":"ELEARNING", "durationHours":40, "tenantId":"cmok6xvlq0000pc43lyagc2pb" },
  { "id":"cmok6xz300006pc43fotmcavu", "name":"Comunicação Assertiva", "slug":"comunicacao-assertiva", "status":"PUBLISHED", "format":"ELEARNING", "durationHours":20, "tenantId":"cmok6xvlq0000pc43lyagc2pb" },
  { "id":"cmok6xzv30007pc43qsdqgisa", "name":"Gestão de Tempo e Produtividade", "slug":"gestao-tempo", "status":"PUBLISHED", "format":"ELEARNING", "durationHours":16, "tenantId":"cmok6xvlq0000pc43lyagc2pb" }
]
```

#### course_modules

Tabela com 0 rows.

#### training_plans (1)

```json
[
  { "id":"cmoligi6t0005fs430h95hci1", "name":"Plano S4 Test", "year":2026, "status":"DRAFT", "tenantId":"cmok6xvlq0000pc43lyagc2pb" }
]
```

#### client_orgs (3 — top da lista por ordem de criação)

```json
[
  { "id":"cmok6xxfo0003pc43z0o33kqx", "name":"ZF Automotive", "tenantId":"cmok6xvlq0000pc43lyagc2pb", "isActive":true, "nif":null },
  { "id":"cmok6xxr90004pc43x33j2t53", "name":"Safira Services", "tenantId":"cmok6xvlq0000pc43lyagc2pb", "isActive":true, "nif":null },
  { "id":"cmok6xx4d0002pc433lbamwvt", "name":"Decathlon", "tenantId":"cmok6xvlq0000pc43lyagc2pb", "isActive":true, "nif":null }
]
```

#### contracts

Tabela com 0 rows.

#### questionnaires (3)

```json
[
  { "id":"cmokxh74z00028c43d7l7bqv9", "tenantId":"cmok6xvlq0000pc43lyagc2pb", "name":"Avaliação Final do Curso", "format":"PRESENCIAL", "targetRole":"TRAINEE", "context":"ACTION" },
  { "id":"q_dgert_satisfacao_v1", "tenantId":"cmok6xvlq0000pc43lyagc2pb", "name":"Avaliação Final da Acção de Formação", "format":"PRESENCIAL", "targetRole":"TRAINEE", "context":"ACTION" },
  { "id":"q_dgert_avalformandos_v1", "tenantId":"cmok6xvlq0000pc43lyagc2pb", "name":"Avaliação dos Formandos pelo Formador", "format":"PRESENCIAL", "targetRole":"TRAINER", "context":"ACTION" }
]
```

#### questionnaire_questions (3 de 23)

```json
[
  { "id":"cmokxh7af00038c43sxhqmrog", "questionnaireId":"cmokxh74z00028c43d7l7bqv9", "type":"SCALE", "scaleMin":1, "scaleMax":5, "order":1, "isRequired":true },
  { "id":"cmokxh7af00048c43u1cvjf4b", "questionnaireId":"cmokxh74z00028c43d7l7bqv9", "type":"SCALE", "scaleMin":1, "scaleMax":5, "order":2, "isRequired":true },
  { "id":"cmokxh7af00058c43yzodgi66", "questionnaireId":"cmokxh74z00028c43d7l7bqv9", "type":"SCALE", "scaleMin":1, "scaleMax":5, "order":3, "isRequired":true }
]
```

#### questionnaire_responses (3 — IP mascarado, neste caso null)

```json
[
  { "id":"cmol6elaf002es0438z5n3ftm", "questionnaireId":"cmokxh74z00028c43d7l7bqv9", "trainingActionId":"cmokum25k000ms04357zouu9u", "traineeId":null, "trainerId":null, "respondedAt":"2026-04-30T07:42:19.343", "expiresAt":null, "respondentIp":null },
  { "id":"cmol6fkdd002ls043ttaabtgr", "questionnaireId":"cmokxh74z00028c43d7l7bqv9", "trainingActionId":"cmokum25k000ms04357zouu9u", "traineeId":null, "trainerId":null, "respondedAt":"2026-04-30T07:43:03.978", "expiresAt":null, "respondentIp":null },
  { "id":"cmolbgcbb002vs043ztpkf41u", "questionnaireId":"cmokxh74z00028c43d7l7bqv9", "trainingActionId":"cmokum25k000ms04357zouu9u", "traineeId":null, "trainerId":null, "respondedAt":"2026-04-30T10:03:38.7", "expiresAt":null, "respondentIp":null }
]
```

#### questionnaire_answers (3)

```json
[
  { "id":"cmol6eph7002gs043d9hlhmdt", "responseId":"cmol6elaf002es0438z5n3ftm", "questionId":"cmokxh7af00038c43sxhqmrog", "scaleValue":5, "textValue":null },
  { "id":"cmol6epmu002hs043ga1bi1zf", "responseId":"cmol6elaf002es0438z5n3ftm", "questionId":"cmokxh7af00048c43u1cvjf4b", "scaleValue":4, "textValue":null },
  { "id":"cmol6epse002is043lzo8n0uh", "responseId":"cmol6elaf002es0438z5n3ftm", "questionId":"cmokxh7af00058c43yzodgi66", "scaleValue":5, "textValue":null }
]
```

#### check_ins (3)

```json
[
  { "id":"cmokcrktq000ayo43vywjgvpa", "sessionId":"cmokcr4p80004yo43j2wxd4d3", "traineeId":"cmokcr5m80007yo438fkxii5h", "status":"CHECKED_IN", "checkedInAt":"2026-04-29T17:52:31.79", "isManual":false },
  { "id":"cmokct6hx0008sg43zkf2mukm", "sessionId":"cmokcsuq40003sg43o1rf68qm", "traineeId":"cmokcr5m80007yo438fkxii5h", "status":"CHECKED_IN", "checkedInAt":"2026-04-29T17:53:46.533", "isManual":false },
  { "id":"cmokcush600088443cno68fta", "sessionId":"cmokcugy900038443sywjphe2", "traineeId":"cmokcr5m80007yo438fkxii5h", "status":"CHECKED_IN", "checkedInAt":"2026-04-29T17:55:01.674", "isManual":false }
]
```

---

## Secção 9 — Migrations

### Migrations no repositório (1 ficheiro versionado)

| Ficheiro | Tamanho | Versão | Propósito (extracto) |
|----------|---------|--------|----------------------|
| `docs/migrations/v10_questionnaire_publico.sql` | ~3KB | v10 | Adiciona 3 colunas a `questionnaire_responses`: `expiresAt`, `respondentIp`, `respondentUserAgent` (todas nullable, idempotente via `ADD COLUMN IF NOT EXISTS`). |

### Migrations referidas mas ausentes do repositório

O `contexto.md` afirma 10 migrations aplicadas (v1 a v10). Só v10 está em `docs/migrations/`. As 9 anteriores (v1-v9) **não estão versionadas**:

- v1: RLS base + helpers SQL
- v2: training_actions.contractId, training_sessions.courseModuleId + enum SessionType
- v2.1: drop training_sessions.moduleId
- v3: RLS enrollments + training_action_trainers + DGERT colunas + enum EnrollmentStatus
- v4: 5 colunas plan* em training_sessions
- v5: RLS training_sessions
- v6: RLS check_ins
- v7: questionários (seeds + policies)
- v8: fix policy INSERT questionnaire_responses
- v9: respondedAt nullable

### Ficheiros SQL ad-hoc em `docs/`

- `docs/rls-inventory.sql` — apenas SELECTs de inspecção (não modifica nada).
- `docs/migration-central-module.sql` — não inspeccionado em detalhe nesta auditoria (não enquadra como migration versionada).

### Cross-check com schema real

Confirmado via `check-v10.ts` em sessão anterior: as 3 colunas v10 existem na BD. Logo v10 foi aplicada.

Para v1-v9 não há ficheiro local; a evidência de aplicação está no schema real (colunas DGERT existem, `courseModuleId` existe, `expiresAt` existe, etc.).

### Colunas no schema sem migration documentada

Todas as colunas DGERT/v2/v3/etc. estão na BD mas **sem SQL versionado no repositório**. Replicar a BD num projecto novo é actualmente impossível só com este repo — falta o histórico de migrations.

---

## Secção 10 — Frontend — Rotas

Definidas em `src/app/router.tsx`.

### Top-level

| Path | Element | Layout pai | Tipo |
|------|---------|-----------|------|
| `/` | `<Navigate to="/admin/dashboard">` | — | redirect |
| `/login` | `LoginPage` | — | público |
| `/admin/*` | `AdminLayout` | — | guard: useAuth + role !== TRAINER |
| `/trainer/*` | `TrainerLayout` | — | guard: useAuth (sem guard de role; admin pode aceder) |
| `q/:token` | `PublicLayout` | — | público |
| `*` | `<Navigate to="/admin/dashboard">` | — | catch-all |

### Rotas `/admin/*` (filhas de AdminLayout)

| Path | Element |
|------|---------|
| index | redirect → `dashboard` |
| `dashboard` | DashboardPage |
| `training-plans` | TrainingPlansPage |
| `courses` | CoursesPage |
| `courses/:id` | CourseDetailPage |
| `actions` | TrainingActionsPage |
| `actions/:id` | TrainingActionDetailPage |
| `trainers` | TrainersPage |
| `trainees` | TraineesPage |
| `questionarios` | QuestionnairesPage |
| `questionarios/novo` | NewQuestionnairePage |
| `questionarios/:questionnaireId` | QuestionnaireDetailPage |
| `management` | ManagementPage |
| `management/client-orgs` | ClientOrgsPage |
| `management/contracts` | ContractsPage |
| `management/training-areas` | TrainingAreasPage |
| `management/rooms` | RoomsPage |
| `analytics` | AnalyticsPage (placeholder) |
| `approvals` | ApprovalsPage (placeholder) |
| `projects` | ProjectsPage (placeholder) |

### Rotas `/trainer/*` (filhas de TrainerLayout)

| Path | Element |
|------|---------|
| index | redirect → `dashboard` |
| `dashboard` | TrainerDashboardPage |
| `sessions` | TrainerSessionsPage |
| `sessions/:sessionId` | TrainerSessionDetailPage |
| `materials` | TrainerMaterialsPage (coming soon) |

### Rotas `/q/*` (filhas de PublicLayout)

| Path | Element |
|------|---------|
| `:token` | PublicRespondPage |

### Total: 28 rotas (1 índice raiz + 1 login + 20 admin + 5 trainer + 1 público + 1 catch-all)

### Guards de role observados

- `AdminLayout`: chama `useAuth()` (redirect /login se sem sessão) + `useCurrentUser()` para verificar role. Se role === `TRAINER`, redirect `/trainer/dashboard`.
- `TrainerLayout`: chama `useAuth()` mas **não** filtra por role (comentário explícito: "Sem guard de role: o admin também pode ver o portal do formador").
- `PublicLayout`: sem useAuth, sem guard.

---

## Secção 11 — Frontend — Páginas

Listagem completa em `src/pages/` (>= 70 ficheiros).

| Página | Rota | Componentes/hooks principais |
|--------|------|------------------------------|
| `auth/LoginPage.tsx` | `/login` | `Input`, `Button`, `useAuthStore`, `supabase.auth.signInWithPassword` |
| `dashboard/DashboardPage.tsx` | `/admin/dashboard` | 4 `KpiCard` + `DataTable`, hooks `useActiveActionsKpi`, `useActionsThisMonthKpi`, `useActiveTraineesKpi`, `usePendingDocsKpi`, `useTableRows` |
| `dashboard/useDashboardKpis.ts` | (hooks) | exporta os 4 KPI hooks acima |
| `training-plans/TrainingPlansPage.tsx` | `/admin/training-plans` | `TablePage` + `TrainingPlanForm` + `useTrainingPlans` |
| `training-plans/TrainingPlanForm.tsx` | (modal) | `FormModal` + `react-hook-form` + `zod` |
| `training-plans/useTrainingPlans.ts` | (hooks) | TanStack Query + Supabase |
| `courses/CoursesPage.tsx` | `/admin/courses` | filtros + tabela + `CourseForm` |
| `courses/CourseDetailPage.tsx` | `/admin/courses/:id` | tabs (Info, Módulos) + `CourseModulesTab` |
| `courses/CourseModulesTab.tsx` | (componente) | drag-reorder HTML5 nativo |
| `courses/CourseModuleForm.tsx` | (modal) | `FormModal` |
| `courses/CourseForm.tsx` | (modal) | `FormModal` |
| `courses/useCourses.ts` | (hooks) | CRUD + filtros |
| `courses/useCourseModules.ts` | (hooks) | reorder mutation |
| `actions/TrainingActionsPage.tsx` | `/admin/actions` | filtros (cliente/status/formador/datas) + tabela |
| `actions/TrainingActionDetailPage.tsx` | `/admin/actions/:id` | 5 tabs (Sessões, Formandos, Dossier, Avaliações, Custos) + 4 chamadas a `VITE_PDF_API_URL` (PDF generation buttons) |
| `actions/TrainingActionForm.tsx` | (modal) | Sem Zod (validação manual) |
| `actions/SessionForm.tsx` | (modal) | Sem Zod |
| `actions/useTrainingActions.ts` | (hooks) | CRUD + filtros + lookups |
| `actions/CampaignsTab.tsx` | (componente da tab) | cartões expansíveis + tabela respondentes |
| `actions/NewCampaignDialog.tsx` | (modal) | combobox questionário + preview elegíveis |
| `actions/useActionCampaigns.ts` | (hooks) | agrega responses client-side por (questionnaireId) |
| `actions/useCampaignResponses.ts` | (hooks) | manual lookup traineesId → trainees (FK não catalogada no PostgREST) |
| `actions/useCampaignMutations.ts` | (hooks) | `useCreateCampaign` idempotente + `useDeleteCampaign` bloqueia se há respondedAt |
| `trainers/TrainersPage.tsx` | `/admin/trainers` | filtros (status/tipo) + tabela |
| `trainers/TrainerForm.tsx` | (modal) | fluxo aprovação |
| `trainers/useTrainers.ts` | (hooks) | CRUD |
| `trainees/TraineesPage.tsx` | `/admin/trainees` | seleccionador client_org obrigatório + DataTable filtrada |
| `trainees/TraineeForm.tsx` | (modal) | 45+ campos DGERT + Zod (`gdprConsent` boolean) |
| `trainees/useTrainees.ts` | (hooks) | filtros + lookups |
| `questionnaires/QuestionnairesPage.tsx` | `/admin/questionarios` | lista + filtros |
| `questionnaires/NewQuestionnairePage.tsx` | `/admin/questionarios/novo` | criar do zero ou clonar |
| `questionnaires/QuestionnaireDetailPage.tsx` | `/admin/questionarios/:questionnaireId` | drag-reorder perguntas |
| `questionnaires/QuestionnaireForm.tsx` | (modal) | criar/editar metadata |
| `questionnaires/QuestionForm.tsx` | (modal) | criar/editar pergunta |
| `questionnaires/useQuestionnaires.ts` | (hooks) | lista |
| `questionnaires/useQuestionnaire.ts` | (hooks) | detail |
| `questionnaires/useQuestionnaireMutations.ts` | (hooks) | CRUD + clone + reorder |
| `management/ManagementPage.tsx` | `/admin/management` | índice |
| `management/ClientOrgsPage.tsx` | `/admin/management/client-orgs` | EntityListPage genérico |
| `management/ContractsPage.tsx` | `/admin/management/contracts` | idem |
| `management/RoomsPage.tsx` | `/admin/management/rooms` | idem |
| `management/TrainingAreasPage.tsx` | `/admin/management/training-areas` | idem (leitura aberta, escrita SUPER_ADMIN) |
| `management/EntityListPage.tsx` | (componente reutilizável) | CRUD genérico baseado em `crud.ts` + `entities.ts` |
| `management/ClientOrgForm.tsx`, `ContractForm.tsx`, `RoomForm.tsx`, `TrainingAreaForm.tsx` | (modais) | Forms básicos |
| `management/crud.ts` | (helpers) | factories de CRUD genérico |
| `management/entities.ts` | (config) | metadata por entidade |
| `analytics/AnalyticsPage.tsx` | `/admin/analytics` | placeholder `ComingSoon` |
| `approvals/ApprovalsPage.tsx` | `/admin/approvals` | placeholder `ComingSoon` |
| `projects/ProjectsPage.tsx` | `/admin/projects` | placeholder `ComingSoon` |
| `trainer/TrainerDashboardPage.tsx` | `/trainer/dashboard` | 4 KPIs + tabela próximas sessões |
| `trainer/TrainerSessionsPage.tsx` | `/trainer/sessions` | filtros (Todas, Próximas, Passadas) + DataTable |
| `trainer/TrainerSessionDetailPage.tsx` | `/trainer/sessions/:sessionId` | 3 tabs (Plano, Sumário, Formandos) + botão imprimir plano (chamada `VITE_PDF_API_URL`) |
| `trainer/TrainerMaterialsPage.tsx` | `/trainer/materials` | `ComingSoon` |
| `trainer/SessionPlanForm.tsx` | (componente) | 5 campos plan* + Save |
| `trainer/SessionSummaryForm.tsx` | (componente) | textarea + `react-signature-canvas`, imutabilidade pós-assinar |
| `trainer/AttendanceTab.tsx` | (componente) | toggle check-ins, banner cores, bloqueio temporal |
| `trainer/sessionStatus.ts` | (helper) | cálculo de status visual |
| `trainer/useTrainerSessions.ts` | (hooks) | lista filtrada por trainer atual |
| `trainer/useTrainerSession.ts` | (hooks) | detalhe |
| `trainer/useCurrentTrainer.ts` | (hooks) | resolve trainer.id do user logado |
| `trainer/useSessionEnrollments.ts` | (hooks) | lista formandos da sessão |
| `trainer/useUpdateSessionPlan.ts` | (mutation) | update plan* + invalidate |
| `trainer/useUpdateSessionSummary.ts` | (mutation) | update summary + signature + invalidate |
| `trainer/useSessionCheckIns.ts` | (hooks) | lista check_ins |
| `trainer/useToggleCheckIn.ts` | (mutation) | insert/delete CHECK_IN com status MANUAL |
| `public/PublicRespondPage.tsx` | `/q/:token` | 5 estados (Loading, Invalid, Expired, Done, Pending) |
| `public/useResponseToken.ts` | (hooks) | GET via fetch (api), POST via fetch (api) |

---

## Secção 12 — Frontend — Componentes UI

### `src/components/ui/` (shadcn — 16 ficheiros)

| Componente | Linhas (KB) | Função |
|-----------|-------------|--------|
| badge.tsx | 1.1 | Etiqueta de estado |
| button.tsx | 1.9 | Botão (variants default/outline/ghost/destructive) |
| checkbox.tsx | 1.1 | Radix Checkbox |
| dialog.tsx | 3.8 | Modal pequeno (Radix) |
| dropdown-menu.tsx | 7.6 | Menu suspenso (Radix) |
| form.tsx | 4.2 | Wrapper react-hook-form + zod |
| input.tsx | 0.8 | Input text |
| label.tsx | 0.7 | Label form |
| select.tsx | 5.7 | Combobox (Radix Select) |
| separator.tsx | 0.8 | Divisor visual |
| sheet.tsx | 4.3 | Modal grande lateral (Radix) |
| sonner.tsx | 1.3 | Wrapper toast (sonner) |
| table.tsx | 2.8 | Componentes Table primitive |
| tabs.tsx | 1.9 | Tabs (Radix) |
| textarea.tsx | 0.7 | Textarea |
| TableSkeleton.tsx | 1.0 | Loading state da tabela |

### `src/components/data-table/` (3 ficheiros)

| Componente | Função |
|-----------|--------|
| DataTable.tsx | Tabela com filtro + paginação + ordenação (TanStack Table) |
| autoColumns.tsx | Geração automática de colunas a partir de rows |
| TablePage.tsx | Wrapper com filtros + busca + botão exportar |

### `src/components/feedback/`

| Componente | Função |
|-----------|--------|
| ComingSoon.tsx | Estado placeholder para páginas em desenvolvimento |
| ErrorState.tsx | Render de erro genérico |

### `src/components/forms/`

| Componente | Função |
|-----------|--------|
| FormModal.tsx | Modal Sheet com formulário react-hook-form + zod |

### `src/components/layout/` (7 ficheiros)

| Componente | Função |
|-----------|--------|
| AdminLayout.tsx | Layout `/admin/*` com guard de auth + role |
| TrainerLayout.tsx | Layout `/trainer/*` com guard de auth (sem role) |
| PublicLayout.tsx | Layout `/q/*` sem auth, footer condicional |
| Sidebar.tsx | Navegação admin (~3.9KB) |
| TrainerSidebar.tsx | Navegação trainer (~2.9KB) |
| Topbar.tsx | Header com avatar + notificações (~3.5KB) |
| TenantThemeProvider.tsx | Inject CSS vars do tenant (cores, logo) |

### Componentes não usados (detectados via grep)

Não foi feita detecção exaustiva. Os candidatos a inspeccionar:

- `feedback/ErrorState.tsx` — grep manual recomendado para confirmar referências.
- Os componentes em `ui/` são shadcn standards e são tipicamente usados pelos forms; nenhum é candidato evidente a remoção.

---

## Secção 13 — Frontend — Hooks, libs, stores

### `src/hooks/`

| Hook | Propósito |
|------|-----------|
| useAuth.ts | Inicializa sessão Supabase, escuta `onAuthStateChange`, redirect /login |
| useCurrentUser.ts | Resolve user da app por email (auth.uid não casa com users.id cuid) |
| useDebounce.ts | Debounce de input genérico |
| useDefaultTenant.ts | (não inspeccionado em detalhe) |
| useLookups.ts | Lookups partilhados (cursos, planos, trainers, etc.) |
| useSupabaseTable.ts | Hook reutilizável para listagens (TanStack Query + Supabase select) |

### `src/lib/`

| Ficheiro | Propósito |
|----------|-----------|
| supabase.ts | Cliente Supabase frontend com ANON_KEY (RLS aplicada) |
| query-client.ts | QueryClient TanStack: `staleTime 5min`, `gcTime 10min`, `retry 1`, sem refetchOnFocus |
| db-helpers.ts | `newId()` cuid, `now()` ISO, `withDbDefaults` (id+updatedAt), `withId` |
| token.ts | `generateResponseToken()` base64url 22 chars de UUID v4 |
| utils.ts | Helpers gerais (provavelmente `cn` de shadcn) |

### `src/stores/` (Zustand persisted)

| Store | Estado | Propósito |
|-------|--------|-----------|
| auth.store.ts | user, session, tenant, isLoading | Sessão actual (persistida em localStorage `auth-store`) |
| tenant.store.ts | tenant: { tenantId, slug, name, primaryColor, accentColor, logoUrl } | Tenant activo (persistido em `tenant-store`) |

### Cache TanStack Query — queryKeys observadas

Pesquisa parcial pelos hooks:

- `["current-app-user", email]`
- `["kpi", "active-actions"]`
- `["kpi", "actions-this-month"]`
- `["kpi", "active-trainees"]`
- `["kpi", "pending-docs"]`
- `["public-response", token]`
- `["trainer-sessions", ...]`
- `["session", sessionId]`
- (outros não enumerados nesta auditoria)

### `src/types/`

| Ficheiro | Conteúdo |
|----------|----------|
| database.ts | Stub genérico — **não gerado de Supabase** (T83 ainda válida) |
| domain.ts | Tipos de domínio aplicados via `as` nos hooks |

---

## Secção 14 — Backend Hono — Rotas

Definidas em `api/src/index.ts`:

```ts
app.use("*", cors({ origin: env.CORS_ORIGIN, allowMethods: ["GET","POST","OPTIONS"], allowHeaders: ["Content-Type","Authorization"] }))
app.get("/health", ...)
app.route("/api/pdf", pdfRoute)
app.route("/api/q", questionnaireRoutes)
```

### Rotas registadas

| Método | Path | Middleware | Validação Zod | Resposta tipica |
|--------|------|-----------|---------------|------------------|
| GET | `/health` | CORS | não | `{ ok:true, service:"academia-api", ts: ISO }` |
| POST | `/api/pdf/generate` | CORS + `assertPdfEnv()` | sim (`templateCode, actionId, sectionNumber?, sectionName?`) | `{ url, key, expiresAt }` (signed URL 1h) ou `{ error }` 4xx/5xx |
| POST | `/api/pdf/generate-mass` | CORS + `assertPdfEnv()` | sim | array de `{ url, error?, kind }` por item |
| POST | `/api/pdf/generate-dossier` | CORS + `assertPdfEnv()` | sim | `{ url, key, cached, expiresAt }` ZIP signed URL |
| GET | `/api/q/:token` | CORS + `rateLimit(30, "get")` | regex token + `assertPdfEnv` | `{ status, questionnaire, questions, action, respondentName }` ou 404/410/500 |
| POST | `/api/q/:token` | CORS + `rateLimit(3, "post")` | regex + Zod body (`{ answers: [{ questionId, scaleValue?, textValue? }] }`) | `{ ok:true, respondedAt }` ou 400/404/409/410/500 |

### CORS

`env.CORS_ORIGIN` default `http://localhost:5173`. Métodos GET/POST/OPTIONS. Headers Content-Type + Authorization. Aplicado em `*`.

### Ausências

- Nenhum request logger global.
- Nenhum error handler global registado (cada rota faz o seu try/catch).
- Sem rota de health profundo (ex: testar Supabase + Puppeteer).

---

## Secção 15 — Backend Hono — Middlewares

### `api/src/middleware/rate-limit.ts`

- **Propósito:** rate limit em memória por `(scope, ip, token)`, janela fixa de 1 hora, cleanup automático a cada chamada.
- **Onde é aplicado:** GET `/api/q/:token` com max 30/h; POST `/api/q/:token` com max 3/h.
- **Configuração:** parâmetros `max` (limite) e `scope` (string identificadora). Sem persistência — reset em cada restart do api.
- **IP detection:** `x-forwarded-for` (primeiro IP) → `x-real-ip` → fallback `"unknown"`.

> Único middleware customizado. Não há helmet, request-id, structured logger, ou compression middleware.

---

## Secção 16 — Backend Hono — Geração PDF

### `api/src/templates/` — 6 templates registados

| Código no registry | Renderer (ficheiro) | Função | Inputs |
|-------------------|--------------------|--------|--------|
| `checklist` | `checklist.ts` | Capa do dossier com 9 secções | `ChecklistData` (action+tenant+contagens) |
| `fichaIdentificacao` | `ficha-identificacao.ts` | Ficha por formando com RGPD dinâmico por tenant | `FichaIdentificacaoData[]` (1 por trainee) |
| `folhaPresenca` | `folha-presencas.ts` | Tabela presenças por sessão | `FolhaPresencasData[]` (1 por sessão) |
| `registoSumarios` | `registo-sumarios.ts` | Sumários agregados (assinatura digital injectada) | `RegistoSumariosData` (action + sessões) |
| `planoSessao` | `plano-sessao.ts` | Plano pedagógico por sessão, 6 secções | `PlanoSessaoData[]` (1 por sessão) |
| `separadora` | `separadora.ts` | Divisor de secção visualmente distinto | `SeparadoraData` (sectionNumber, sectionName) |

### Helpers partilhados em `_shared.ts`

- `renderHeader(action, course, clientOrg, tenant)` — 3 logos (cliente + tenant + DGERT fixo) + bloco de identificação
- `renderFooter()` — data + texto "Entidade Formadora Certificada DGERT" + paginação
- `DGERT_LOGO_BASE64` — SVG embebido (~2.2KB), independente da BD
- `SHARED_STYLES`, `esc()`, `fmtDate()`

### Endpoints de geração (3)

| Endpoint | Templates aceites | Modo | Detalhe |
|----------|-------------------|------|---------|
| `POST /api/pdf/generate` | checklist, registoSumarios, separadora | singular | 1 PDF por chamada, signed URL 1h |
| `POST /api/pdf/generate-mass` | fichaIdentificacao, folhaPresenca, planoSessao | em massa | N PDFs por chamada, resiliência por-item com `kind` discriminador |
| `POST /api/pdf/generate-dossier` | (todos) | ZIP | dossier completo com 9 secções, cache 24h, p-limit 3, signed URL 1h |

### Puppeteer

- Pacote: `puppeteer@23.11.1` (latest 25.1.0 — 2 majors drift)
- `api/src/services/puppeteer.ts` expõe `withPage` e `withBrowser` (1 browser reutilizado para o dossier ZIP)
- Chromium é descarregado automaticamente pelo Puppeteer (sem `puppeteer-core`)
- Sem `--no-sandbox` documentado nesta auditoria (precisa de ver pdf.ts:>100 linhas)

---

## Secção 17 — Scripts utilitários

`api/scripts/` (9 ficheiros):

| Ficheiro | Propósito (a partir das primeiras linhas) | Invocação | Estado git |
|----------|-------------------------------------------|-----------|-----------|
| `render-test.ts` | Teste de render isolado (anterior aos sprints actuais) | `npx tsx api/scripts/render-test.ts` | committed |
| `seal-zoom.ts` | Manipulação do logo DGERT para zoom em PDF | `npx tsx api/scripts/seal-zoom.ts` | committed |
| `find-action.ts` | Encontra uma action com inscrições para testar /generate-mass | `npx tsx api/scripts/find-action.ts` (cwd: api) | committed |
| `check-v10.ts` | Diagnóstico de presença das colunas v10 (expiresAt, respondentIp, respondentUserAgent) | `npx tsx api/scripts/check-v10.ts` | committed |
| `q-test.ts` | Smoke test E2E do /api/q/:token: setup/verify/cleanup/list-questions/find-action | `npx tsx api/scripts/q-test.ts <subcomando>` | committed |
| `trainee-inventory.ts` | Inventário trainees + client_orgs por tenant | `npx tsx api/scripts/trainee-inventory.ts` | **untracked** |
| `import-trainees-snapshot.ts` | Captura snapshot da BD antes do import (emails + orgs existentes) | `npx tsx api/scripts/import-trainees-snapshot.ts` | **untracked** |
| `import-trainees-plan.py` | Gera plano de import a partir do XLSX | `python api/scripts/import-trainees-plan.py` | **untracked** |
| `import-trainees-execute.ts` | Executa import (client_orgs + bulk insert trainees, `--dry-run` disponível) | `npx tsx api/scripts/import-trainees-execute.ts [--dry-run]` | **untracked** |
| `audit-queries.ts` | (criado nesta auditoria) Queries SELECT para inventário | `npx tsx api/scripts/audit-queries.ts` | **untracked** |

`scripts/` (raiz, 1 ficheiro):

| Ficheiro | Tamanho | Propósito |
|----------|---------|-----------|
| `seed-oportoforte-v2.ts` | 689KB, 186 linhas | Seed histórico do BT-SOFT exportado em 16/05/2026. Upsert em batches. **Usa `SUPABASE_SERVICE_KEY`** (nome divergente do api/.env). |

---

## Secção 18 — Auth e autorização

### Login

`src/pages/auth/LoginPage.tsx`:

1. Email pré-preenchido com `admin@oportoforte.com`.
2. `supabase.auth.signInWithPassword({ email, password })`.
3. Após sucesso, força `useAuthStore.getState().setUser()` antes do navigate (mitigação documentada do "BUG 2": página destino via user=null).
4. Pequeno wait (200ms) se `getSession()` ainda não retornou (mitigação do "BUG 1").
5. Query a `users.role` por email → routing: `TRAINER` → `/trainer/dashboard`, outros → `/admin/dashboard`.

### Sessão

- **Localização:** Supabase JS guarda em `localStorage` (`persistSession: true, autoRefreshToken: true, detectSessionInUrl: true`). Adicionalmente o `auth.store` Zustand persiste `user`, `session`, `tenant` em `localStorage:auth-store`. **Duplicação de estado.**
- **Refresh:** Supabase trata auto-refresh.

### Resolução de role

`useCurrentUser` faz select directo a `users` por email (não usa `auth.uid()` porque o cuid não casa com o UUID do Supabase Auth — comentário explícito no código).

### Determinação de tenantId

- `tenantId` é uma coluna em `users`. `useCurrentUser` devolve-o no payload.
- `useDefaultTenant` (não inspeccionado nesta auditoria) provavelmente popula `tenant.store` a partir desse `tenantId`.
- Em queries Supabase, o tenant é aplicado pelas RLS (não pelo cliente).

### Handler global 401

- `useAuth` redireciona para `/login` quando `!session && location !== /login`.
- Sem interceptor para erros 401/RLS em runtime do React Query (não detectado nesta auditoria).

### Reset password

**Ausente.** Login.tsx não tem link "Esqueci a senha". Sem rota `/recover` ou `/reset`.

### MFA

**Ausente.** Não há ativação de TOTP nem fluxo opt-in.

### Routing por role

Implementado em `AdminLayout` (TRAINER redirecionado para `/trainer/dashboard`). TrainerLayout sem guard (admin pode ver tudo).

---

## Secção 19 — Multi-tenant

### Determinação do tenant actual

- `tenantId` vem de `users.tenantId` quando o utilizador entra.
- `tenant.store` armazena objecto completo `{ tenantId, slug, name, primaryColor, accentColor, logoUrl }`.
- Não há **selector de tenant** para SUPER_ADMIN — auditoria não encontrou UI para trocar de tenant.

### TenantThemeProvider

Envolve a app inteira em `src/app/main.tsx`. Lê o tenant do store e injecta CSS vars:

```ts
if (tenant?.primaryColor) {
  style["--primary"] = tenant.primaryColor
  style["--ring"] = tenant.primaryColor
}
if (tenant?.accentColor) {
  style["--accent"] = tenant.accentColor
}
if (tenant?.logoUrl) {
  style["--tenant-logo-url"] = `url("${tenant.logoUrl}")`
}
```

Formato esperado das cores: triplet HSL `"H S% L%"` (ex: `"217 91% 35%"`). O Tailwind consome via `hsl(var(--primary))`.

### tenantId nas queries

Geralmente **não enviado explicitamente** pelo cliente. A RLS (Postgres) filtra pelo tenant do utilizador autenticado. Excepções: o backend Hono (com SERVICE_ROLE_KEY) bypassa RLS e tem que filtrar manualmente — ver Secção 24 para o impacto disto no Dashboard.

### RLS multi-tenant — amostra

Schema real bloqueado para inspecção (Secção 7). Indicação do `docs/db-defaults-map.md`: write em `training_areas` e `enrollments` exige TENANT_ADMIN (RLS permite); seed por SERVICE_ROLE_KEY bypassa.

### Selector de tenant para SUPER_ADMIN

**Ausente.** `useIsSuperAdmin()` existe em `useCurrentUser.ts:33` mas nenhuma UI consome essa flag para troca de tenant.

---

## Secção 20 — Ficheiros sensíveis e segurança

### Existência (sem leitura de conteúdo)

| Ficheiro | Existe | Gitignored? |
|----------|--------|-------------|
| `.token` (raiz) | **sim** | sim (`.gitignore:38`) |
| `auth.json` (raiz) | **sim** | sim (`.gitignore:39`) |
| `api/.env` | sim | sim (`.gitignore:19`) |
| `api/.env.example` | sim | tracked (template) |
| `.env` (raiz) | sim | sim (`.gitignore:18`) |
| `.env.local` (raiz) | sim | sim (`.gitignore:20`) |
| `.env.example` (raiz) | sim | tracked (template) |
| `api/_out/` | sim (9 ficheiros) | sim (`.gitignore:42`) |

**Confirmado:** `.token`, `auth.json` e `api/_out/*` foram identificados e excluídos do index no Bloco 1 do Sprint 1. Continuam no disco mas fora de git. Ver Sprint 1 Bloco 1 para o histórico — esses ficheiros contêm JWT real e refresh token de `admin@oportoforte.com`.

### Conteúdo de `api/_out/`

| Ficheiro | Bytes | Data | Origem |
|----------|-------|------|--------|
| checklist.pdf | 154855 | 2026-05-18 | render-test antigo |
| checklist.png | 135306 | 2026-05-18 | idem |
| dgert_zoom.png | 74110 | 2026-05-18 | seal-zoom |
| ficha.pdf | 173697 | 2026-05-18 | idem |
| ficha.png | 184075 | 2026-05-18 | idem |
| import_decathlon.png | 122557 | 2026-06-16 | screenshot E2E import |
| smoke_t8_done.png | 58110 | 2026-06-15 | smoke Sprint 1 |
| smoke_t8_invalid.png | 53366 | 2026-06-15 | idem |
| sprint1_admin_campaign.png | 153828 | 2026-06-15 | E2E Sprint 1 Bloco 3 |

### Greps de segurança em `src/`

- `SUPABASE_SERVICE_ROLE_KEY` em `src/`: **0 ocorrências** ✓
- Padrão JWT (`eyJ[A-Za-z0-9_-]{20,}`) em `src/`: **0 ocorrências** ✓
- Padrão `password\s*=\s*"` hardcoded: não inspeccionado exhaustivamente, mas o único valor pré-preenchido é `admin@oportoforte.com` no `LoginPage` (não password).

### Greps em `api/src/`

- `console.log` aparece em **1 ficheiro**: `api/src/index.ts` (2 ocorrências — startup log do Hono e CORS info). Não há logs em handlers críticos.

### Greps em `src/` (frontend)

- `console.log`: **0 ocorrências em `src/`** confirmado.

### Greps em scripts

- `src/`: 0 referências a SERVICE_ROLE_KEY
- `api/` (incluindo scripts): apenas em locais legítimos (`api/src/env.ts`, `api/src/services/supabase.ts`, e os scripts utilitários em `api/scripts/`)
- `scripts/seed-oportoforte-v2.ts` (raiz): usa `process.env.SUPABASE_SERVICE_KEY` — **nome divergente do api/.env** (que usa `SUPABASE_SERVICE_ROLE_KEY`). Este script seed não corre actualmente sem ajuste.

---

## Secção 21 — Testes

### Infra de testes

| Item | Estado |
|------|--------|
| Pasta `__tests__/` ou `tests/` | **ausente** |
| Vitest configurado | **não** (sem `vitest.config.ts`, sem `vitest` em deps) |
| Playwright configurado | **não** (sem `playwright.config.ts`) |
| Cypress configurado | **não** |
| Jest configurado | **não** |
| Scripts npm `test` ou `test:*` | **ausentes** (package.json não tem `test`) |

### Testes existentes

Nenhum teste automatizado encontrado. Toda a validação até hoje foi smoke test manual (curl + chrome-devtools MCP).

### Como se correm

Não aplicável — não existem.

---

## Secção 22 — Documentação existente

### Lista de .md no projecto (excluindo node_modules)

| Path | Tamanho | Propósito (extracto) | Modificado |
|------|---------|----------------------|------------|
| `README.md` | 2.4 KB | **Template Vite default**, não reescrito para o projecto. Contém menções genéricas a ESLint e React Compiler. | 2026-05-15 |
| `contexto.md` | 18 KB | Documento de retoma actualizado no fecho do Sprint 1. Identidade do projecto + stack + schema + estado + decisões. Criado em 2026-06-15. | 2026-06-15 |
| `docs/auditoria-tecnica-completa.md` | (este ficheiro) | — | 2026-06-17 |
| `docs/db-defaults-map.md` | ~6 KB | Mapa de defaults da BD (que campos NOT NULL sem default o cliente tem de preencher). Inclui query autoritativa. | 2026-05-17 |
| `docs/training-actions-schema.md` | ~12 KB | Schema real introspectado de training_actions/sessions/modules + decisões de FK + migrations v2/v3. | 2026-05-17 |

### Documentos referenciados mas fora do repositório

- `referencias/prd.md` — fora desta pasta (em `C:\dev\academia-bsoft\referencias\`)
- `referencias/product-roadmap.md` — idem
- `referencias/schema.prisma` — idem

Estes 3 são fonte de verdade mas vivem fora do repositório do projecto.

### Documentos legais / briefings

Tudo em `C:\dev\academia-bsoft\briefing\` (Word, Excel, PDFs do cliente). Fora do repositório.

---

## Secção 23 — Estado operacional actual

### Processos node

| Total | 13 (no momento desta auditoria) |
|-------|------|

Detalhes individuais não recolhidos (pedia inventário leve, não dump). PID + RAM individual disponível via:

```powershell
Get-Process node | Sort-Object WS -Descending | Select Name, Id, WS -First 10
```

### Portas

| Porta | Estado |
|-------|--------|
| 3001 (api Hono) | **livre** |
| 5173 (Vite web) | **livre** |

Os servidores estão **parados** no momento desta auditoria. Foram arrancados e parados via Bash background tasks no início e foram parados via `TaskStop` antes da auditoria.

### Tamanhos em disco

| Item | Tamanho |
|------|---------|
| `dist/` | 1.034 KB (≈1.0 MB) |
| `node_modules/` (raiz) | 210.7 MB |
| `api/node_modules/` | 89.1 MB |
| `.vite/` (raiz) | **ausente** (sem cache stale) |

### Cache

Sem `.vite/` na raiz no momento da auditoria → cache do Vite limpo.

### node_modules — instalação completa?

Verificação `npm ls --depth=0` não corrida (auditoria read-only, evitar binary noise). Substituto: `npm outdated` corre sem erros (Secção 3), o que indica que os pacotes estão instalados. Lock file presente.

---

## Secção 24 — Porque o Dashboard mostrou 0

### Caso real referido

Bug reportado: Dashboard de admin mostra "0" em "Turmas Activas" quando a BD tem 27.

### Código em causa

`src/pages/dashboard/useDashboardKpis.ts:17-28` (`useActiveActionsKpi`):

```ts
export function useActiveActionsKpi() {
  return useQuery({
    queryKey: ["kpi", "active-actions"],
    queryFn: () =>
      countWhere(() =>
        supabase
          .from("training_actions")
          .select("*", { count: "exact", head: true })
          .in("status", ["SCHEDULED", "IN_PROGRESS"])
      ),
  })
}
```

`countWhere` (linhas 9-15):

```ts
async function countWhere(
  build: () => PromiseLike<{ count: number | null; error: unknown }>
): Promise<number> {
  const { count, error } = await build()
  if (error) throw error
  return count ?? 0
}
```

### SQL directo (cross-check feito nesta auditoria via SERVICE_ROLE_KEY)

Resultado de `audit-queries.ts > dashboard`:

```json
{
  "activeAll": 27,
  "activeOportoForteOnly": 26,
  "totalAll": 37,
  "statusBuckets": { "IN_PROGRESS": 23, "SCHEDULED": 4, "COMPLETED": 3, "DRAFT": 7 }
}
```

Logo no Supabase, **com SERVICE_ROLE_KEY** (bypassa RLS):

- `WHERE status IN ('SCHEDULED','IN_PROGRESS')` → **27** rows globalmente.
- `WHERE status IN ('SCHEDULED','IN_PROGRESS') AND tenantId='cmok6xvlq0000pc43lyagc2pb'` → **26** rows.

### Divergência identificada

| Local | Filtro aplicado | Status considerados | Tenant scoping | Resultado |
|-------|-----------------|--------------------|----------------|-----------|
| `useActiveActionsKpi` (frontend) | `.in("status", ["SCHEDULED","IN_PROGRESS"])` | SCHEDULED + IN_PROGRESS | **ausente no código** (delegado à RLS) | depende da sessão activa |
| SQL directo SERVICE_ROLE | mesmo filtro | mesmos status | sem scoping | 27 (todos tenants) |
| SQL directo SERVICE_ROLE + tenant Oporto Forte | mesmo filtro | mesmos status | tenantId=oportoforte | 26 |
| RLS para TENANT_ADMIN logged-in (esperado) | mesmo filtro | mesmos status | aplicada por RLS | deveria ser 26 |
| Sintoma reportado | mesmo filtro | mesmos status | (sessão não estabelecida?) | **0** |

### Hipóteses da causa raiz (sem confirmar — investigação a fazer)

1. **Timing de auth.** O hook `useActiveActionsKpi` arranca assim que `DashboardPage` montar. Se a sessão Supabase ainda não tiver propagado para o cliente JS (`getSession()` ainda retorna null), a query é enviada como anónima. As policies RLS para anónimos rejeitam (ou retornam 0). `useQuery` recebe `count: 0` (não erro) e o KPI mostra "0". O `LoginPage` já documenta este risco (BUG 1, mitigado com wait 200ms).

2. **Sessão expirada.** Default JWT do Supabase: 1h. Se o utilizador esteve inactivo, o JWT expira, a query falha silenciosamente (Supabase JS rola para anónimo automaticamente ou devolve 401 silencioso). Conforme o branch, pode retornar `count: 0`.

3. **RLS sem cobertura para o role activo.** Se a policy de SELECT em `training_actions` exigir `TENANT_ADMIN` e o utilizador for outro role (ex: `TENANT_STAFF` ou `TRAINER` em rota errada), nenhuma linha é visível. `audit_logs` mostra 24 users mas distribuição inclui CLIENT_HR, TENANT_STAFF — algum destes pode ter sido o que viu "0".

4. **Acesso na rota errada / role com tenant diferente.** Se houvesse um utilizador com `tenantId` de outro tenant que não Oporto Forte, o count para esse tenant pode ser 0 (TechPort não tem actions inscritas com SCHEDULED/IN_PROGRESS — não verificado mas plausível).

5. **Divergência frontend/backend latente.** O hook **não filtra explicitamente por tenantId**. Toda a confiança está na RLS. Backend (Hono com SERVICE_ROLE) tem queries que filtram por tenantId explicitamente (ex: `pdf.ts` lê `a.tenantId` da action para validar). Frontend e backend usam regras diferentes para definir "o que conta como activo neste tenant".

### Falta de evidência directa

A auditoria não conseguiu reproduzir o "0" porque corre com SERVICE_ROLE_KEY (bypassa RLS). Para confirmar a hipótese 1 ou 2, seria necessário:

- Inspeccionar audit_logs por LOGIN do utilizador afectado e timing entre login e dashboard render.
- Activar logging no `useActiveActionsKpi` para distinguir entre `count=0 normal` e `error silenciado`.
- Verificar policies de SELECT em `training_actions` no Supabase Studio (Secção 7 está bloqueada por API).

### Outras KPIs do dashboard com o mesmo padrão

- `useActionsThisMonthKpi` — filtra por `startDate >= monthStartISO()`, sem tenantId. Mesmo risco.
- `useActiveTraineesKpi` — `eq("isActive", true)`, sem tenantId. Mesmo risco.
- `usePendingDocsKpi` — `is("signedAt", null)`, sem tenantId. Mesmo risco.

Todos os 4 KPIs assumem que a RLS faz o scoping. Nenhum força filtro pelo tenant do user actual.

---

## Secção 25 — Indicadores de saúde do projecto

### Positivos (5)

1. **Bloco de geração PDF é maduro e cobre 6 templates** com `_shared.ts` partilhado (header/footer/escape/data). Cache 24h, p-limit, signed URLs 1h, ZIP completo.
2. **Fase 2b da avaliação fechada end-to-end** com endpoints Hono, UI pública, rate limit, idempotência. Validada em browser via campanha real (Sprint 1 Bloco 3).
3. **TypeScript passa em ambos os lados** (frontend + api) sem erros, conforme verificado em sprints anteriores.
4. **`.gitignore` está bem reforçado** após Sprint 1 Bloco 1 (apanhou `.token` e `auth.json` com JWT real fora do index). Sem secrets hardcoded em `src/`.
5. **Multi-tenancy via RLS** ao nível BD: 2 tenants existem (Oporto Forte + TechPort), com scoping aplicado pelo Postgres em vez do cliente.

### Riscos abertos (5)

1. **Schema Prisma desactualizado vs BD real**. Pelo menos 8 colunas/tabelas/enums existem na BD mas não no `schema.prisma` (evaluation_campaigns, approval_requests, expiresAt, respondentIp, respondentUserAgent, SessionType, EnrollmentStatus, courseModuleId, colunas DGERT em training_actions, contractId). Replicar BD num projecto novo só com este repo é impossível.
2. **9 das 10 migrations não estão versionadas**. Só v10 tem SQL no repo. Histórico v1-v9 só vive em memória dos sprints (e na BD aplicada).
3. **Dashboard KPIs não filtram por tenantId no cliente** — confiança total na RLS. Se a sessão não estabelecer a tempo, o KPI mostra 0 silenciosamente (Secção 24).
4. **Sem CI/CD, sem testes automatizados, sem deploy declarado**. Não há `vercel.json`, `Dockerfile`, `.github/workflows/`, `vitest.config.ts`. Mudanças vão para produção sem rede de segurança.
5. **`zod` e `typescript` divergentes entre raiz e api**. Frontend usa zod v4 e ts v6; api usa zod v3 e ts v5.9. Tipos não interoperáveis se algum dia partilharem schemas.

### Dívida técnica detectada

- **`README.md` é o template Vite default**, não foi reescrito.
- **`cuid` v3 deprecated** em uso no frontend e api (recomendação npm: migrar para `@paralleldrive/cuid2`).
- **`puppeteer` 2 majors atrás** (23.11.1 vs 25.1.0).
- **`tailwindcss` 1 major atrás** (3.4 vs 4.x — V4 é significativamente diferente).
- **`@hono/node-server` 1 major atrás**.
- **`archiver`, `dotenv`, `concurrently` em majors atrás.**
- **`src/types/database.ts` é stub genérico** — não gerado de Supabase, tipos manuais em cada hook via `as`.
- **`scripts/seed-oportoforte-v2.ts` usa `SUPABASE_SERVICE_KEY`** (sem `_ROLE_`), divergente da convenção do `api/.env`.
- **Sem reset de password no Login.** Bloqueador para go-live (ver auditoria Sprint 1).
- **`VITE_PDF_API_URL` ausente do `.env.example`** — clone do repo fica sem pista para a configurar.
- **Detalhe de schema real (Secção 7) é "NÃO APURADO" via API** — falta uma função `exec_sql` registada no Supabase ou acesso directo psql para auditorias futuras automatizadas.
- **`src/stores/auth.store.ts` duplica o estado da sessão** que o Supabase JS já gere em localStorage (persistSession). Dois canais de verdade para a sessão.
- **`useDashboardKpis.ts` não trata o caso `error`** (apenas faz `throw`). Erros RLS chegam como mensagem genérica para o user.

---

## Métricas finais da auditoria

| Métrica | Valor |
|---------|-------|
| Tabelas BD inventariadas | 31 (todas com count) |
| Models Prisma listados | 24 |
| Enums listados | 9 |
| Rotas frontend | 28 |
| Páginas frontend listadas | 70+ |
| Endpoints backend | 6 (incluindo `/health`) |
| Templates PDF | 6 |
| Scripts utilitários `api/scripts/` | 10 |
| Commits no branch master | 4 |
| Queries SELECT executadas via SERVICE_ROLE_KEY | ≈ 50 (counts + samples + distribuições + dashboard) |
| Ficheiros lidos directamente | ≈ 30 |
| Erros de auditoria | 1 (RPC `exec_sql` ausente — bloqueou Secção 7 detalhada) |

Fim do documento.
