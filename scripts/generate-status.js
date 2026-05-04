/**
 * Generate Mapa-Sistema-Academia-Digital.xlsx
 *
 * Run with: node scripts/generate-status.js
 *
 * Outputs an Excel file with 8 sheets covering the entire system status:
 * Overview, Routes, Components, Infrastructure, Pending, Bugs Fixed,
 * Credentials, Roadmap.
 */

const ExcelJS = require("exceljs");
const path = require("path");

// ─── Color palette (matches Academia Digital brand) ────────────────────────
const COLORS = {
  navy: "FF0B2447",
  navyDeep: "FF000F27",
  gold: "FFCCA823",
  white: "FFFFFFFF",
  green: "FFC6F0D8",
  greenText: "FF1B5E20",
  red: "FFFFCDD2",
  redText: "FFB71C1C",
  yellow: "FFFFF59D",
  yellowText: "FF5D4037",
  orange: "FFFFCC80",
  orangeText: "FF4E342E",
  blue: "FFBBDEFB",
  blueText: "FF0D47A1",
  altRow: "FFF8F9FA",
  border: "FFE2E5EB",
};

const STATUS = {
  works: { bg: COLORS.green, fg: COLORS.greenText, label: "✅ Funciona" },
  partial: { bg: COLORS.yellow, fg: COLORS.yellowText, label: "🟡 Parcial" },
  broken: { bg: COLORS.red, fg: COLORS.redText, label: "❌ Quebrado" },
  missing: { bg: COLORS.red, fg: COLORS.redText, label: "❌ Falta (404)" },
  pending: { bg: COLORS.orange, fg: COLORS.orangeText, label: "🟠 Pendente" },
  redirect: { bg: COLORS.blue, fg: COLORS.blueText, label: "🔵 Redirect" },
  blocker: { bg: COLORS.red, fg: COLORS.redText, label: "🚨 Bloqueador" },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function applyHeader(row) {
  row.eachCell((cell) => {
    cell.font = { name: "Calibri", bold: true, size: 11, color: { argb: COLORS.white } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.navy } };
    cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    cell.border = {
      bottom: { style: "medium", color: { argb: COLORS.gold } },
    };
  });
  row.height = 28;
}

function applyDataRow(row, isAlt = false) {
  row.eachCell((cell) => {
    if (!cell.font) cell.font = { name: "Calibri", size: 10 };
    cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: COLORS.border } },
      bottom: { style: "thin", color: { argb: COLORS.border } },
      left: { style: "thin", color: { argb: COLORS.border } },
      right: { style: "thin", color: { argb: COLORS.border } },
    };
    if (isAlt && !cell.fill) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.altRow } };
    }
  });
}

function applyStatusCell(cell, status) {
  const s = STATUS[status];
  if (!s) return;
  cell.value = s.label;
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: s.bg } };
  cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: s.fg } };
  cell.alignment = { horizontal: "center", vertical: "middle" };
}

function autoWidth(sheet, padding = 2) {
  sheet.columns.forEach((col) => {
    let max = 10;
    col.eachCell({ includeEmpty: false }, (cell) => {
      const v = String(cell.value ?? "");
      const lines = v.split("\n");
      const longest = Math.max(...lines.map((l) => l.length));
      if (longest > max) max = longest;
    });
    col.width = Math.min(max + padding, 80);
  });
}

// ─── Data ───────────────────────────────────────────────────────────────────

const ROUTES = [
  // Public
  { url: "/", type: "Redirect", access: "Público", status: "redirect", desc: "Redireciona para /oportoforte/catalog", group: "PÚBLICO" },
  { url: "/[tenant]", type: "Redirect", access: "Público", status: "redirect", desc: "Redireciona para /[tenant]/catalog", group: "PÚBLICO" },
  { url: "/[tenant]/catalog", type: "Página", access: "Público", status: "works", desc: "Catálogo público com 12 cursos · filtros por área · search · cards featured (gold border)", group: "PÚBLICO" },
  { url: "/[tenant]/catalog/[courseSlug]", type: "Página", access: "Público", status: "works", desc: "Detalhe do curso · módulos · próximas edições · sidebar inscrição · cursos relacionados", group: "PÚBLICO" },
  { url: "/[tenant]/catalog/workshops", type: "Página", access: "Público", status: "works", desc: "Landing dedicada Saúde Mental · 9 blocos · 40 workshops · 3 pacotes (€320/€890/€2400)", group: "PÚBLICO" },

  // Auth
  { url: "/[tenant]/auth/login", type: "Página", access: "Público", status: "works", desc: "Login email + password (admin/trainer)", group: "AUTH" },
  { url: "/[tenant]/auth/magic-link", type: "Página", access: "Público", status: "works", desc: "Pedir link mágico (formando)", group: "AUTH" },
  { url: "/[tenant]/auth/magic-link/verify?token=...", type: "Route handler", access: "Público", status: "works", desc: "Verifica JWT do magic-link e cria sessão", group: "AUTH" },
  { url: "/[tenant]/auth/logout", type: "Route handler", access: "Qualquer", status: "works", desc: "Limpa cookie de sessão e redireciona para catálogo", group: "AUTH" },

  // Trainee (Formando)
  { url: "/[tenant]/portal", type: "Redirect", access: "TRAINEE", status: "redirect", desc: "Redireciona para /portal/dashboard", group: "FORMANDO" },
  { url: "/[tenant]/portal/dashboard", type: "Página", access: "TRAINEE", status: "works", desc: "Painel completo · sessão em curso · 3 KPIs · cursos ativos · timeline · próximo marco", group: "FORMANDO" },
  { url: "/[tenant]/portal/sessions/[id]/checkin", type: "Página", access: "TRAINEE", status: "works", desc: "Fluxo 4-estados com canvas de assinatura digital (touch + mouse)", group: "FORMANDO" },
  { url: "/[tenant]/portal/courses", type: "Página", access: "TRAINEE", status: "missing", desc: "Lista todos os cursos do formando · sidebar item", group: "FORMANDO" },
  { url: "/[tenant]/portal/calendar", type: "Página", access: "TRAINEE", status: "missing", desc: "Calendário visual de sessões · sidebar item", group: "FORMANDO" },
  { url: "/[tenant]/portal/certificates", type: "Página", access: "TRAINEE", status: "missing", desc: "Certificados emitidos · sidebar item", group: "FORMANDO" },
  { url: "/[tenant]/portal/settings", type: "Página", access: "TRAINEE", status: "missing", desc: "Configurações de perfil · sidebar item", group: "FORMANDO" },
  { url: "/[tenant]/portal/history", type: "Página", access: "TRAINEE", status: "missing", desc: "Histórico de formação · bottom-nav mobile item", group: "FORMANDO" },
  { url: "/[tenant]/portal/profile", type: "Página", access: "TRAINEE", status: "missing", desc: "Perfil do formando · bottom-nav mobile item", group: "FORMANDO" },
  { url: "/[tenant]/portal/checkin", type: "Página", access: "TRAINEE", status: "missing", desc: "Scan QR para check-in · FAB QR mobile", group: "FORMANDO" },

  // Trainer (Formador)
  { url: "/[tenant]/trainer", type: "Redirect", access: "TRAINER", status: "blocker", desc: "Redireciona para /trainer/sessions (página NÃO existe → 404 após login)", group: "FORMADOR" },
  { url: "/[tenant]/trainer/sessions", type: "Página", access: "TRAINER", status: "blocker", desc: "🚨 BLOCKER · login do trainer cai aqui e dá 404 · precisa criar lista de turmas", group: "FORMADOR" },
  { url: "/[tenant]/trainer/sessions/[id]/attendance", type: "Página", access: "TRAINER", status: "works", desc: "Controlo de presenças · donut chart · lista 12 formandos · dropdown PDFs DGERT", group: "FORMADOR" },
  { url: "/[tenant]/trainer/dashboard", type: "Página", access: "TRAINER", status: "missing", desc: "Painel formador · sidebar item", group: "FORMADOR" },
  { url: "/[tenant]/trainer/courses", type: "Página", access: "TRAINER", status: "missing", desc: "Cursos do formador · sidebar item", group: "FORMADOR" },
  { url: "/[tenant]/trainer/trainers", type: "Página", access: "TRAINER", status: "missing", desc: "Lista de formadores · sidebar item", group: "FORMADOR" },
  { url: "/[tenant]/trainer/trainees", type: "Página", access: "TRAINER", status: "missing", desc: "Lista de formandos do trainer · sidebar item", group: "FORMADOR" },
  { url: "/[tenant]/trainer/classes", type: "Página", access: "TRAINER", status: "missing", desc: "Classes/turmas · sidebar item", group: "FORMADOR" },
  { url: "/[tenant]/trainer/reports", type: "Página", access: "TRAINER", status: "missing", desc: "Relatórios formador · sidebar item", group: "FORMADOR" },
  { url: "/[tenant]/trainer/settings", type: "Página", access: "TRAINER", status: "missing", desc: "Configurações formador · sidebar item", group: "FORMADOR" },

  // Admin
  { url: "/[tenant]/admin", type: "Redirect", access: "ADMIN", status: "redirect", desc: "Redireciona para /admin/courses", group: "ADMIN" },
  { url: "/[tenant]/admin/courses", type: "Página", access: "ADMIN", status: "works", desc: "Gestão de cursos · 3 filtros · grid 4-col · 9 cursos seeded · arquivado · paginação", group: "ADMIN" },
  { url: "/[tenant]/admin/courses/new", type: "Página", access: "ADMIN", status: "works", desc: "Criar novo curso · formulário 4-tabs (Info / Objetivos / Módulos / Marketing)", group: "ADMIN" },
  { url: "/[tenant]/admin/dashboard", type: "Página", access: "ADMIN", status: "missing", desc: "Dashboard com KPIs (€ faturado · formandos · taxa conclusão) · sidebar item", group: "ADMIN" },
  { url: "/[tenant]/admin/trainees", type: "Página", access: "ADMIN", status: "missing", desc: "Gestão de formandos · 25 seeded · sidebar item · badge 1.075", group: "ADMIN" },
  { url: "/[tenant]/admin/trainers", type: "Página", access: "ADMIN", status: "missing", desc: "Gestão de formadores · 6 seeded · sidebar item", group: "ADMIN" },
  { url: "/[tenant]/admin/reports", type: "Página", access: "ADMIN", status: "missing", desc: "Relatórios DGERT · sidebar item", group: "ADMIN" },
  { url: "/[tenant]/admin/settings", type: "Página", access: "ADMIN", status: "missing", desc: "Settings white-label (logo · cor · domínio) · sidebar item", group: "ADMIN" },

  // API PDFs
  { url: "/api/pdf/folha-presencas/[sessionId]", type: "API", access: "Server", status: "works", desc: "Gera Folha de Presenças DGERT (PDF download) · header tri-logo · assinaturas SVG", group: "API" },
  { url: "/api/pdf/ficha-inscricao/[traineeId]", type: "API", access: "Server", status: "works", desc: "Gera Ficha de Inscrição DGERT (PDF) · IMP_06 · campos identificação + RGPD", group: "API" },
  { url: "/api/pdf/ata-reuniao/[trainingActionId]", type: "API", access: "Server", status: "works", desc: "Gera Ata Reunião Pedagógica (PDF) · IMP_20 · indicadores + decisões", group: "API" },
];

const COMPONENTS = [
  { cat: "UI shadcn", name: "button", file: "ui/button.tsx", status: "works" },
  { cat: "UI shadcn", name: "card", file: "ui/card.tsx", status: "works" },
  { cat: "UI shadcn", name: "input", file: "ui/input.tsx", status: "works" },
  { cat: "UI shadcn", name: "label", file: "ui/label.tsx", status: "works" },
  { cat: "UI shadcn", name: "badge", file: "ui/badge.tsx", status: "works" },
  { cat: "UI shadcn", name: "avatar", file: "ui/avatar.tsx", status: "works" },
  { cat: "UI shadcn", name: "progress", file: "ui/progress.tsx", status: "works" },
  { cat: "UI shadcn", name: "separator", file: "ui/separator.tsx", status: "works" },
  { cat: "UI shadcn", name: "dialog", file: "ui/dialog.tsx", status: "works" },
  { cat: "UI shadcn", name: "sheet", file: "ui/sheet.tsx", status: "works" },
  { cat: "UI shadcn", name: "dropdown-menu", file: "ui/dropdown-menu.tsx", status: "works" },
  { cat: "UI shadcn", name: "select", file: "ui/select.tsx", status: "works" },
  { cat: "UI shadcn", name: "tabs", file: "ui/tabs.tsx", status: "works" },
  { cat: "UI shadcn", name: "tooltip", file: "ui/tooltip.tsx", status: "works" },
  { cat: "UI shadcn", name: "skeleton", file: "ui/skeleton.tsx", status: "works" },
  { cat: "UI shadcn", name: "scroll-area", file: "ui/scroll-area.tsx", status: "works" },
  { cat: "UI shadcn", name: "popover", file: "ui/popover.tsx", status: "works" },
  { cat: "UI shadcn", name: "sonner", file: "ui/sonner.tsx", status: "works" },

  { cat: "Marketing", name: "site-header", file: "marketing/site-header.tsx", status: "works" },
  { cat: "Marketing", name: "site-footer", file: "marketing/site-footer.tsx", status: "works" },

  { cat: "Catalog", name: "hero-section", file: "catalog/hero-section.tsx", status: "works" },
  { cat: "Catalog", name: "catalog-filters (Client)", file: "catalog/catalog-filters.tsx", status: "works" },
  { cat: "Catalog", name: "course-card", file: "catalog/course-card.tsx", status: "works" },
  { cat: "Catalog", name: "corporate-cta", file: "catalog/corporate-cta.tsx", status: "works" },

  { cat: "Dashboard", name: "dashboard-sidebar (Client) · refatorado para receber role+slug", file: "dashboard/dashboard-sidebar.tsx", status: "works" },
  { cat: "Dashboard", name: "dashboard-topbar", file: "dashboard/dashboard-topbar.tsx", status: "works" },
  { cat: "Dashboard", name: "dashboard-shell + PageHeader", file: "dashboard/dashboard-shell.tsx", status: "works" },
  { cat: "Dashboard", name: "stat-card", file: "dashboard/stat-card.tsx", status: "works" },

  { cat: "Trainee", name: "active-session-banner", file: "trainee/active-session-banner.tsx", status: "works" },
  { cat: "Trainee", name: "course-progress-card", file: "trainee/course-progress-card.tsx", status: "works" },
  { cat: "Trainee", name: "activity-timeline", file: "trainee/activity-timeline.tsx", status: "works" },
  { cat: "Trainee", name: "milestone-card", file: "trainee/milestone-card.tsx", status: "works" },
  { cat: "Trainee", name: "bottom-nav (Client) · mobile only", file: "trainee/bottom-nav.tsx", status: "works" },

  { cat: "Admin", name: "course-grid-card (Client) · use client adicionado", file: "admin/course-grid-card.tsx", status: "works" },
  { cat: "Admin", name: "course-filter-bar (Client)", file: "admin/course-filter-bar.tsx", status: "works" },
  { cat: "Admin", name: "course-form (Client) · 4 tabs", file: "admin/course-form.tsx", status: "works" },

  { cat: "Trainer", name: "attendance-donut · SVG puro", file: "trainer/attendance-donut.tsx", status: "works" },
  { cat: "Trainer", name: "attendance-summary (Client)", file: "trainer/attendance-summary.tsx", status: "works" },
  { cat: "Trainer", name: "attendance-list (Client)", file: "trainer/attendance-list.tsx", status: "works" },
  { cat: "Trainer", name: "attendance-page-client (Client) · orchestrator", file: "trainer/attendance-page-client.tsx", status: "works" },
  { cat: "Trainer", name: "dgert-documents-menu (Client) · dropdown 3 PDFs", file: "trainer/dgert-documents-menu.tsx", status: "works" },

  { cat: "Signature", name: "signature-pad (Client) · canvas touch + mouse", file: "signature/signature-pad.tsx", status: "works" },
  { cat: "Signature", name: "checkin-flow (Client) · state machine 4 estados", file: "signature/checkin-flow.tsx", status: "works" },

  { cat: "Auth", name: "login-form (Client) · useFormState", file: "auth/login/login-form.tsx", status: "works" },
  { cat: "Auth", name: "request-form (Client) · magic-link", file: "auth/magic-link/request-form.tsx", status: "works" },

  { cat: "PDF", name: "DgertDocument · wrapper tri-logo header", file: "lib/pdf/dgert-document.tsx", status: "works" },
  { cat: "PDF", name: "FolhaPresencasPdf · IMP_10", file: "lib/pdf/folha-presencas.tsx", status: "works" },
  { cat: "PDF", name: "FichaInscricaoPdf · IMP_06", file: "lib/pdf/ficha-inscricao.tsx", status: "works" },
  { cat: "PDF", name: "AtaReuniaoPdf · IMP_20", file: "lib/pdf/ata-reuniao.tsx", status: "works" },
];

const INFRASTRUCTURE = [
  { sys: "Repositório", provider: "GitHub", url: "https://github.com/bsoftwhitelabel/academiab2", plan: "Free (privado)", status: "works", notes: "Branch main · 4 commits · auto-deploy ligado à Vercel" },
  { sys: "Hospedagem", provider: "Vercel", url: "https://academiab2.vercel.app", plan: "Hobby (free)", status: "works", notes: "Region fra1 · auto-deploy do GitHub · env vars Production+Preview" },
  { sys: "Base de dados", provider: "Supabase", url: "ecqptnirekuiibhmnbaq.supabase.co", plan: "Free", status: "works", notes: "Schema isolado 'academia' · seed Oporto Forte · pooler us-west-2" },
  { sys: "DNS / Domínio", provider: "Vercel", url: "academiab2.vercel.app", plan: "Hobby", status: "works", notes: "Domínio próprio (formacao.bsoft.io) · pendente configurar" },
  { sys: "Email", provider: "Resend", url: "—", plan: "Free", status: "missing", notes: "API key não configurada · magic-links aparecem em logs (dev fallback)" },
  { sys: "Storage (assinaturas)", provider: "Cloudflare R2", url: "—", plan: "Free", status: "missing", notes: "Não configurado · assinaturas atualmente em memória, perdem em refresh" },
  { sys: "Monitoring", provider: "Vercel Logs", url: "—", plan: "Hobby", status: "works", notes: "Runtime logs por function · sem alertas · sem retention longa" },
  { sys: "Analytics", provider: "—", url: "—", plan: "—", status: "missing", notes: "Sem analytics ainda · Vercel Analytics (pago) ou GA4 candidatos" },
  { sys: "Local dev", provider: "Docker + Postgres 16", url: "localhost:5432", plan: "Free", status: "works", notes: "docker-compose up -d · alternativa à Supabase para dev" },
];

const PENDING = [
  // Bloqueadores
  { cat: "BLOCKER", item: "/trainer/sessions (lista de turmas)", priority: "🔴 CRÍTICO", effort: "1h", blocks: "Login do trainer cai em 404 ao redirecionar", notes: "Sem isto, nenhum trainer consegue chegar à página de presenças" },
  { cat: "BLOCKER", item: "Validar deploy d8b731b funciona", priority: "🔴 CRÍTICO", effort: "5min", blocks: "Tudo · estamos em meio do debug", notes: "Confirmar admin login funciona após último fix de Server/Client boundary" },

  // Alta prioridade (DEMO)
  { cat: "ALTO", item: "/admin/dashboard com KPIs", priority: "🟠 ALTO", effort: "3h", blocks: "Demo à Nadja precisa disto · primeira impressão admin", notes: "KPIs: 25 formandos, 6 turmas, taxa conclusão, € faturado" },
  { cat: "ALTO", item: "/admin/trainees · listagem", priority: "🟠 ALTO", effort: "2h", blocks: "Sidebar admin tem item ativo apontando aqui", notes: "Mostra os 25 formandos seeded · filtros por entidade" },
  { cat: "ALTO", item: "/admin/trainers · listagem", priority: "🟠 ALTO", effort: "2h", blocks: "Sidebar admin", notes: "Mostra os 6 trainers com CCP · idade · experiência" },
  { cat: "ALTO", item: "/portal/courses · cursos do formando", priority: "🟠 ALTO", effort: "2h", blocks: "Sidebar trainee", notes: "Lista cursos completos (não só ativos) · estado por curso" },
  { cat: "ALTO", item: "/portal/certificates · certificados emitidos", priority: "🟠 ALTO", effort: "2h", blocks: "Sidebar trainee", notes: "Cards com certificados · download PDF · QR de validação" },
  { cat: "ALTO", item: "/trainer/dashboard · landing trainer", priority: "🟠 ALTO", effort: "2h", blocks: "Sidebar trainer", notes: "Sessões de hoje · taxa adesão média · próximas turmas" },

  // Média prioridade
  { cat: "MÉDIO", item: "/admin/reports · relatórios DGERT", priority: "🟡 MÉDIO", effort: "4h", blocks: "Sidebar admin", notes: "Relatórios mensais · taxa conclusão · NPS · custo por hora formada" },
  { cat: "MÉDIO", item: "/portal/calendar · calendário visual", priority: "🟡 MÉDIO", effort: "4h", blocks: "Sidebar trainee", notes: "Vista mensal/semanal das sessões agendadas" },
  { cat: "MÉDIO", item: "/admin/settings · white-label config", priority: "🟡 MÉDIO", effort: "3h", blocks: "Posicionamento white-label", notes: "Upload logo, cor primária, accent, domínio próprio" },
  { cat: "MÉDIO", item: "/portal/settings · perfil formando", priority: "🟡 MÉDIO", effort: "1h", blocks: "Sidebar trainee", notes: "Atualização de dados pessoais (RGPD)" },
  { cat: "MÉDIO", item: "Resend API key + verificação domínio", priority: "🟡 MÉDIO", effort: "30min + DNS", blocks: "Magic-links em produção (envio real)", notes: "Sem isto, magic-link só aparece em logs · não chega ao formando" },
  { cat: "MÉDIO", item: "Cloudflare R2 setup · persistência das assinaturas", priority: "🟡 MÉDIO", effort: "2h", blocks: "Assinaturas reais persistentes (atualmente perdem em refresh)", notes: "Bucket R2 + AWS SDK · upload no checkin-flow" },
  { cat: "MÉDIO", item: "Cron job para certificados auto-emitidos", priority: "🟡 MÉDIO", effort: "2h", blocks: "Pipeline DGERT completo", notes: "Após turma concluída, emitir certificados em PDF + email" },

  // Baixa prioridade
  { cat: "BAIXO", item: "/portal/history · histórico formando", priority: "🟢 BAIXO", effort: "1h", blocks: "Bottom-nav mobile", notes: "Lista cronológica de sessões + presenças assinadas" },
  { cat: "BAIXO", item: "/portal/profile · perfil mobile", priority: "🟢 BAIXO", effort: "30min", blocks: "Bottom-nav mobile", notes: "Igual a /portal/settings mas mobile-first" },
  { cat: "BAIXO", item: "/portal/checkin · scan QR", priority: "🟢 BAIXO", effort: "1h", blocks: "FAB QR mobile", notes: "Componente de leitura QR + redirect para sessão" },
  { cat: "BAIXO", item: "/trainer/courses, /trainers, /trainees, /classes, /reports, /settings", priority: "🟢 BAIXO", effort: "5h total", blocks: "Sidebar trainer (vários itens 404)", notes: "Páginas placeholder ou completas · pode ser \"Em breve\"" },
  { cat: "BAIXO", item: "Custom domain (formacao.bsoft.io)", priority: "🟢 BAIXO", effort: "DNS + 1h Vercel config", blocks: "Branding white-label", notes: "Configurar DNS CNAME · adicionar domínio na Vercel" },
  { cat: "BAIXO", item: "API self-service para criar tenants", priority: "🟢 BAIXO", effort: "3h", blocks: "Escala white-label", notes: "POST /api/tenants para clientes novos sem SQL manual" },
  { cat: "BAIXO", item: "Tests automatizados (Vitest + Playwright)", priority: "🟢 BAIXO", effort: "1 sprint", blocks: "Confiança em refactoring", notes: "Cobertura de fluxos críticos · login · presença · PDF" },
  { cat: "BAIXO", item: "Dark mode toggle", priority: "🟢 BAIXO", effort: "1h", blocks: "—", notes: "Tokens já preparados · falta toggle no topbar" },
];

const BUGS_FIXED = [
  { num: 1, bug: "Prisma 7.8 quebrou sintaxe `url = env(...)`", cause: "Breaking change Prisma 7", fix: "Downgrade para Prisma 6", commit: "—", date: "2026-05-04 (setup)" },
  { num: 2, bug: "Build falhou: 'cn' e 'useState' unused", cause: "Imports não removidos após refactor", fix: "Remover imports", commit: "—", date: "2026-05-04 (Task 5)" },
  { num: 3, bug: "Build falhou: 'DashboardShell' unused na course detail", cause: "Import esquecido", fix: "Remover import", commit: "—", date: "2026-05-04 (Task 2)" },
  { num: 4, bug: "API PDF route.ts com JSX falhou compilar", cause: ".ts não suporta JSX", fix: "Renomear para .tsx", commit: "—", date: "2026-05-04 (Task 4)" },
  { num: 5, bug: "ESLint flagou _request unused", cause: "Default config sem argsIgnorePattern", fix: "Atualizar .eslintrc.json com pattern ^_", commit: "—", date: "2026-05-04 (Task 4)" },
  { num: 6, bug: "Workshops page _params unused", cause: "Mesmo do bug 5", fix: "Renomear params para _params", commit: "—", date: "2026-05-04 (Task 5)" },
  { num: 7, bug: "🚨 .gitignore ignorava só .env*.local mas não .env", cause: "Default create-next-app", fix: "Adicionar .env, .env.local, .env.production e !.env.example", commit: "—", date: "2026-05-04 (Task 6)" },
  { num: 8, bug: "Supabase tinha tabelas de outro projeto (200+ rows)", cause: "Tentativa anterior em outro tool", fix: "Schema isolado 'academia' (?schema=academia)", commit: "—", date: "2026-05-04 (Setup Supabase)" },
  { num: 9, bug: "Prisma seed timeout (Connection limit)", cause: "Promise.all paralelo + free tier connection limit", fix: "connection_limit=5 + pool_timeout=60", commit: "—", date: "2026-05-04 (Setup Supabase)" },
  { num: 10, bug: "Push para GitHub deu 403 (account errada)", cause: "Git Credential Manager guardado neopulsegroup", fix: "Remote URL com bsoftwhitelabel@ explícito", commit: "ff5a509", date: "2026-05-04 (GitHub push)" },
  { num: 11, bug: "Vercel: Can't reach db.PROJECT.supabase.co:5432", cause: "Direct connection não funciona em serverless", fix: "Mudar para Pooler URL", commit: "—", date: "2026-05-04 (Vercel deploy)" },
  { num: 12, bug: "Pooler: 'Tenant or user not found'", cause: "Username 'postgres' em vez de 'postgres.PROJECT_REF'", fix: "URL com username completo", commit: "—", date: "2026-05-04 (Vercel deploy)" },
  { num: 13, bug: "Pooler: 'Can't reach aws-0-REGION...'", cause: "Placeholder REGION ficou literal", fix: "URL real do dashboard Supabase (us-west-2)", commit: "—", date: "2026-05-04 (Vercel deploy)" },
  { num: 14, bug: "AUTH_SECRET must be set", cause: "Env var faltava ou < 32 chars", fix: "Adicionar valor 32+ chars · marcar Production+Preview", commit: "—", date: "2026-05-04 (Vercel deploy)" },
  { num: 15, bug: "Schema.prisma sem directUrl", cause: "Pgbouncer transaction mode + migrações futuras", fix: "Adicionar directUrl = env('DIRECT_URL')", commit: "85cbf97", date: "2026-05-04 (Vercel deploy)" },
  { num: 16, bug: "course-grid-card: 'Event handlers cannot be passed'", cause: "Server Component com onClick", fix: "Adicionar 'use client' directive", commit: "cf8f3b5", date: "2026-05-04 (Vercel deploy)" },
  { num: 17, bug: "DashboardSidebar: 'Functions cannot be passed directly'", cause: "Server passa Lucide icons (forwardRef) para Client component", fix: "Refactor: items map dentro do Client component, layouts passam só role+slug", commit: "d8b731b", date: "2026-05-04 (Vercel deploy)" },
];

const CREDENTIALS = [
  { type: "Login admin", login: "admin@oportoforte.pt", pass: "Admin@2026", access: "ADMIN", notes: "Acesso total · gestão cursos/formandos/trainers · após login → /admin/courses" },
  { type: "Login trainer", login: "ricardo.santos@oportoforte.pt", pass: "Trainer@2026", access: "TRAINER", notes: "Após login → /trainer/sessions (página em falta · 404 atual)" },
  { type: "Login trainer", login: "ana.pereira@oportoforte.pt", pass: "Trainer@2026", access: "TRAINER", notes: "Mesmo de cima · 6 trainers no total" },
  { type: "Magic-link trainee", login: "maryluz.oliveira@oportoforte.pt", pass: "(nenhuma)", access: "TRAINEE", notes: "Sem password · usa magic-link · link aparece nos Vercel logs (sem Resend)" },
  { type: "Magic-link trainee", login: "ana.martins@exemplo.pt", pass: "(nenhuma)", access: "TRAINEE", notes: "Mesmo · 25 trainees no total seeded" },
  { type: "GitHub", login: "bsoftwhitelabel", pass: "(via browser auth)", access: "Owner", notes: "Push via Git Credential Manager · token guardado no Windows" },
  { type: "Vercel", login: "(team mktbsoftwhitelabel-3845s-projects)", pass: "(via browser auth)", access: "Owner", notes: "Plan Hobby (free) · 100 GB bandwidth/mês" },
  { type: "Supabase", login: "(via dashboard)", pass: "BSoftWL2026@#@!", access: "DB owner", notes: "DB password · usada na DATABASE_URL (URL-encoded como %40%23%40%21)" },
];

const ENV_VARS = [
  { name: "DATABASE_URL", env: "Production+Preview", configured: "works", notes: "Pooler us-west-2 · port 6543 · pgbouncer=true · schema=academia" },
  { name: "DIRECT_URL", env: "Production+Preview", configured: "works", notes: "Pooler us-west-2 · port 5432 · para migrações futuras" },
  { name: "AUTH_SECRET", env: "Production+Preview", configured: "works", notes: "32+ chars · usado pelo jose para assinar JWTs" },
  { name: "AUTH_URL", env: "Production+Preview", configured: "works", notes: "https://academiab2.vercel.app · usado em magic-link URLs" },
  { name: "NEXT_PUBLIC_DEFAULT_TENANT_SLUG", env: "Production+Preview", configured: "works", notes: "oportoforte · default no middleware" },
  { name: "NEXT_PUBLIC_BASE_DOMAIN", env: "Production+Preview", configured: "works", notes: "academiab2.vercel.app · usado para subdomain rewrite" },
  { name: "RESEND_API_KEY", env: "—", configured: "missing", notes: "🟠 Não configurado · magic-link só em logs · adicionar para envio real" },
  { name: "EMAIL_FROM", env: "—", configured: "missing", notes: "🟠 Sender de emails · ex: 'Academia Digital <noreply@bsoft.io>'" },
  { name: "STORAGE_ENDPOINT, ACCESS_KEY, etc.", env: "—", configured: "missing", notes: "🟠 Cloudflare R2 não configurado · assinaturas em memória" },
  { name: "NEXT_PUBLIC_SUPABASE_URL", env: "—", configured: "pending", notes: "Opcional · só se usares Supabase JS client (não usamos)" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", env: "—", configured: "pending", notes: "Mesmo · publishable key da Supabase" },
];

const ROADMAP = [
  // Fase 1: Validação imediata
  { phase: "FASE 1 · Hoje", item: "Confirmar deploy d8b731b funciona em produção", priority: "🔴 CRÍTICO", effort: "5min", deps: "—", status: "pending" },
  { phase: "FASE 1 · Hoje", item: "Testar admin login + /admin/courses carrega", priority: "🔴 CRÍTICO", effort: "5min", deps: "Deploy OK", status: "pending" },
  { phase: "FASE 1 · Hoje", item: "Testar magic-link trainee (logs)", priority: "🔴 CRÍTICO", effort: "10min", deps: "Deploy OK", status: "pending" },
  { phase: "FASE 1 · Hoje", item: "Criar /trainer/sessions (lista turmas)", priority: "🔴 CRÍTICO", effort: "1h", deps: "Deploy OK", status: "pending" },

  // Fase 2: Demo ready
  { phase: "FASE 2 · Esta semana", item: "Criar /admin/dashboard com KPIs", priority: "🟠 ALTO", effort: "3h", deps: "Fase 1 completa", status: "pending" },
  { phase: "FASE 2 · Esta semana", item: "Criar /admin/trainees · listagem 25 formandos", priority: "🟠 ALTO", effort: "2h", deps: "—", status: "pending" },
  { phase: "FASE 2 · Esta semana", item: "Criar /admin/trainers · listagem 6 trainers", priority: "🟠 ALTO", effort: "2h", deps: "—", status: "pending" },
  { phase: "FASE 2 · Esta semana", item: "Criar /trainer/dashboard · sessões hoje", priority: "🟠 ALTO", effort: "2h", deps: "—", status: "pending" },
  { phase: "FASE 2 · Esta semana", item: "Criar /portal/courses · cursos do formando", priority: "🟠 ALTO", effort: "2h", deps: "—", status: "pending" },
  { phase: "FASE 2 · Esta semana", item: "Criar /portal/certificates · certificados", priority: "🟠 ALTO", effort: "2h", deps: "—", status: "pending" },
  { phase: "FASE 2 · Esta semana", item: "Setup Resend API + verificar domínio", priority: "🟠 ALTO", effort: "1h + DNS wait", deps: "Domínio decidido", status: "pending" },

  // Fase 3: Robustez
  { phase: "FASE 3 · Próximas 2 semanas", item: "Cloudflare R2 setup · persistir assinaturas", priority: "🟡 MÉDIO", effort: "2h", deps: "—", status: "pending" },
  { phase: "FASE 3 · Próximas 2 semanas", item: "Cron certificados auto-emitidos pós-turma", priority: "🟡 MÉDIO", effort: "2h", deps: "Resend OK", status: "pending" },
  { phase: "FASE 3 · Próximas 2 semanas", item: "Páginas /admin/reports, /admin/settings", priority: "🟡 MÉDIO", effort: "4h+3h", deps: "—", status: "pending" },
  { phase: "FASE 3 · Próximas 2 semanas", item: "Páginas /portal/calendar, /settings", priority: "🟡 MÉDIO", effort: "4h+1h", deps: "—", status: "pending" },
  { phase: "FASE 3 · Próximas 2 semanas", item: "Sidebar items trainer restantes (placeholders)", priority: "🟡 MÉDIO", effort: "3h", deps: "—", status: "pending" },

  // Fase 4: White-label
  { phase: "FASE 4 · 1 mês", item: "Custom domain (formacao.bsoft.io)", priority: "🟢 BAIXO", effort: "DNS + 1h", deps: "—", status: "pending" },
  { phase: "FASE 4 · 1 mês", item: "API self-service para criar novos tenants", priority: "🟢 BAIXO", effort: "3h", deps: "Auth admin OK", status: "pending" },
  { phase: "FASE 4 · 1 mês", item: "Onboarding wizard tenant (logo · cor · domínio)", priority: "🟢 BAIXO", effort: "6h", deps: "API tenants OK", status: "pending" },
  { phase: "FASE 4 · 1 mês", item: "Vercel Edge Config para multi-tenant routing prod", priority: "🟢 BAIXO", effort: "2h", deps: "Domains setup", status: "pending" },

  // Fase 5: Maturação
  { phase: "FASE 5 · 2 meses", item: "Tests E2E (Playwright) cobertura crítica", priority: "🟢 BAIXO", effort: "1 sprint", deps: "Estável", status: "pending" },
  { phase: "FASE 5 · 2 meses", item: "Sentry para monitoring de erros", priority: "🟢 BAIXO", effort: "1h", deps: "—", status: "pending" },
  { phase: "FASE 5 · 2 meses", item: "Vercel Analytics + GA4", priority: "🟢 BAIXO", effort: "1h", deps: "Pro plan se quiser Vercel Analytics", status: "pending" },
  { phase: "FASE 5 · 2 meses", item: "Calendar sync (Google Cal · Outlook)", priority: "🟢 BAIXO", effort: "1 sprint", deps: "OAuth setup", status: "pending" },
  { phase: "FASE 5 · 2 meses", item: "WhatsApp Business API · notificações", priority: "🟢 BAIXO", effort: "1 sprint", deps: "Twilio/360dialog", status: "pending" },
];

// ─── Build Workbook ─────────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
wb.creator = "Academia Digital · BSoft White Label";
wb.created = new Date();
wb.lastModifiedBy = "Neo Pulse";

// ─── Sheet 1: Overview ──────────────────────────────────────────────────────
const overview = wb.addWorksheet("📊 Visão Geral", {
  properties: { tabColor: { argb: COLORS.navy } },
});

overview.mergeCells("A1:F1");
overview.getCell("A1").value = "Academia Digital · Mapa do Sistema";
overview.getCell("A1").font = { name: "Calibri", bold: true, size: 22, color: { argb: COLORS.white } };
overview.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.navy } };
overview.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
overview.getRow(1).height = 56;

overview.mergeCells("A2:F2");
overview.getCell("A2").value = `Snapshot · ${new Date().toLocaleDateString("pt-PT", { dateStyle: "long" })} · BSoft White Label SaaS`;
overview.getCell("A2").font = { name: "Calibri", italic: true, size: 11, color: { argb: COLORS.gold } };
overview.getCell("A2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.navyDeep } };
overview.getCell("A2").alignment = { horizontal: "center" };
overview.getRow(2).height = 22;

overview.getCell("A4").value = "Métrica";
overview.getCell("B4").value = "Valor";
overview.getCell("C4").value = "Detalhe";
applyHeader(overview.getRow(4));

const stats = [
  ["Total de rotas", `=COUNTA(Rotas!A:A)-1`, "Soma de todas as URLs do sistema"],
  ["Rotas funcionais", `=COUNTIF(Rotas!D:D,"✅ Funciona")`, "Páginas/APIs que rodam"],
  ["Redirects", `=COUNTIF(Rotas!D:D,"🔵 Redirect")`, "Rotas que redirecionam"],
  ["Rotas em falta (404)", `=COUNTIF(Rotas!D:D,"❌ Falta (404)")`, "Sidebar items sem página"],
  ["Bloqueadores", `=COUNTIF(Rotas!D:D,"🚨 Bloqueador")`, "Impedem fluxo crítico"],
  ["Componentes criados", `=COUNTA(Componentes!A:A)-1`, "Files em src/components"],
  ["Bugs resolvidos", `=COUNTA('Bugs Resolvidos'!A:A)-1`, "Sessão 04 Maio 2026"],
  ["Itens pendentes", `=COUNTA(Pendentes!A:A)-1`, "Trabalho mapeado"],
  ["Sistemas externos", `=COUNTA(Infraestrutura!A:A)-1`, "GitHub, Vercel, Supabase, etc."],
];

stats.forEach((row, i) => {
  overview.getRow(5 + i).values = ["", ...row];
  applyDataRow(overview.getRow(5 + i), i % 2 === 0);
  overview.getCell(`B${5 + i}`).font = { name: "Calibri", bold: true, size: 12, color: { argb: COLORS.navy } };
  overview.getCell(`B${5 + i}`).alignment = { horizontal: "center" };
});

// Section 2: links rápidos
overview.getCell("A15").value = "🔗 Links rápidos";
overview.mergeCells("A15:F15");
overview.getCell("A15").font = { name: "Calibri", bold: true, size: 14, color: { argb: COLORS.white } };
overview.getCell("A15").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.navy } };
overview.getCell("A15").alignment = { horizontal: "left", vertical: "middle", indent: 1 };
overview.getRow(15).height = 28;

const quickLinks = [
  ["Site em produção", "https://academiab2.vercel.app"],
  ["Catálogo público", "https://academiab2.vercel.app/oportoforte/catalog"],
  ["Workshops Saúde Mental", "https://academiab2.vercel.app/oportoforte/catalog/workshops"],
  ["Login admin/trainer", "https://academiab2.vercel.app/oportoforte/auth/login"],
  ["Magic-link formando", "https://academiab2.vercel.app/oportoforte/auth/magic-link"],
  ["GitHub repo", "https://github.com/bsoftwhitelabel/academiab2"],
  ["Vercel dashboard", "https://vercel.com/mktbsoftwhitelabel-3845s-projects/academiab2"],
  ["Supabase project", "https://supabase.com/dashboard/project/ecqptnirekuiibhmnbaq"],
];

quickLinks.forEach((row, i) => {
  const r = 16 + i;
  overview.getCell(`A${r}`).value = row[0];
  overview.getCell(`B${r}`).value = { text: row[1], hyperlink: row[1] };
  overview.getCell(`B${r}`).font = { name: "Calibri", color: { argb: COLORS.blueText }, underline: true, size: 10 };
  overview.mergeCells(`B${r}:F${r}`);
  applyDataRow(overview.getRow(r), i % 2 === 0);
  overview.getCell(`A${r}`).font = { name: "Calibri", bold: true, size: 10 };
});

// Section 3: status atual
overview.getCell("A26").value = "📌 Estado atual (snapshot)";
overview.mergeCells("A26:F26");
overview.getCell("A26").font = { name: "Calibri", bold: true, size: 14, color: { argb: COLORS.white } };
overview.getCell("A26").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.navy } };
overview.getCell("A26").alignment = { horizontal: "left", vertical: "middle", indent: 1 };
overview.getRow(26).height = 28;

const statusItems = [
  ["✅ Stack base completa", "Next.js 14 · TypeScript · Tailwind · shadcn/ui · Prisma 6 · Auth custom"],
  ["✅ DB Supabase ligada", "Schema isolado 'academia' · pooler us-west-2 · 25 trainees seeded"],
  ["✅ Build passa", "21 rotas geradas · 0 erros TypeScript"],
  ["✅ Deploy Vercel ativo", "academiab2.vercel.app · auto-deploy do GitHub"],
  ["✅ PDFs DGERT funcionam", "Folha Presenças · Ficha Inscrição · Ata Reunião"],
  ["⚠️ Sidebar com items 404", "20+ links em sidebars apontam para páginas em falta"],
  ["🚨 /trainer/sessions falta", "Login do trainer cai em 404 · BLOCKER demo trainer"],
  ["⚠️ Resend não configurado", "Magic-links só em logs (não chegam ao formando real)"],
  ["⚠️ Assinaturas em memória", "Não persistem em refresh · falta R2/S3"],
];

statusItems.forEach((row, i) => {
  const r = 27 + i;
  overview.getCell(`A${r}`).value = row[0];
  overview.getCell(`B${r}`).value = row[1];
  overview.mergeCells(`B${r}:F${r}`);
  applyDataRow(overview.getRow(r), i % 2 === 0);
  overview.getCell(`A${r}`).font = { name: "Calibri", bold: true, size: 10 };
});

overview.columns = [
  { width: 32 }, { width: 50 }, { width: 30 }, { width: 18 }, { width: 18 }, { width: 18 },
];

// ─── Sheet 2: Rotas ─────────────────────────────────────────────────────────
const routes = wb.addWorksheet("Rotas", {
  properties: { tabColor: { argb: COLORS.gold } },
});

routes.getRow(1).values = ["URL", "Tipo", "Acesso", "Status", "Descrição", "Grupo"];
applyHeader(routes.getRow(1));
routes.views = [{ state: "frozen", ySplit: 1 }];

ROUTES.forEach((r, i) => {
  const row = routes.addRow([r.url, r.type, r.access, "", r.desc, r.group]);
  applyDataRow(row, i % 2 === 0);
  row.getCell(1).font = { name: "Consolas", size: 9, color: { argb: COLORS.navy } };
  applyStatusCell(row.getCell(4), r.status);
});

routes.columns = [
  { width: 56 }, { width: 16 }, { width: 14 }, { width: 18 }, { width: 80 }, { width: 14 },
];
routes.autoFilter = { from: { row: 1, column: 1 }, to: { row: ROUTES.length + 1, column: 6 } };

// ─── Sheet 3: Componentes ───────────────────────────────────────────────────
const comps = wb.addWorksheet("Componentes", {
  properties: { tabColor: { argb: COLORS.gold } },
});

comps.getRow(1).values = ["Categoria", "Componente", "Ficheiro", "Status"];
applyHeader(comps.getRow(1));
comps.views = [{ state: "frozen", ySplit: 1 }];

COMPONENTS.forEach((c, i) => {
  const row = comps.addRow([c.cat, c.name, c.file, ""]);
  applyDataRow(row, i % 2 === 0);
  row.getCell(3).font = { name: "Consolas", size: 9 };
  applyStatusCell(row.getCell(4), c.status);
});

comps.columns = [{ width: 18 }, { width: 50 }, { width: 50 }, { width: 18 }];
comps.autoFilter = { from: { row: 1, column: 1 }, to: { row: COMPONENTS.length + 1, column: 4 } };

// ─── Sheet 4: Infraestrutura ────────────────────────────────────────────────
const infra = wb.addWorksheet("Infraestrutura", {
  properties: { tabColor: { argb: COLORS.gold } },
});

infra.getRow(1).values = ["Sistema", "Provider", "URL", "Plano", "Status", "Notas"];
applyHeader(infra.getRow(1));
infra.views = [{ state: "frozen", ySplit: 1 }];

INFRASTRUCTURE.forEach((it, i) => {
  const row = infra.addRow([it.sys, it.provider, it.url, it.plan, "", it.notes]);
  applyDataRow(row, i % 2 === 0);
  if (it.url.startsWith("http") || it.url.includes(".com") || it.url.includes(".app")) {
    row.getCell(3).value = { text: it.url, hyperlink: it.url.startsWith("http") ? it.url : `https://${it.url}` };
    row.getCell(3).font = { name: "Calibri", color: { argb: COLORS.blueText }, underline: true, size: 9 };
  }
  applyStatusCell(row.getCell(5), it.status);
});

infra.columns = [
  { width: 22 }, { width: 18 }, { width: 42 }, { width: 16 }, { width: 18 }, { width: 60 },
];

// Sub-section: Env vars
const envStart = INFRASTRUCTURE.length + 4;
infra.getCell(`A${envStart - 1}`).value = "🔐 Variáveis de Ambiente Vercel";
infra.mergeCells(`A${envStart - 1}:F${envStart - 1}`);
infra.getCell(`A${envStart - 1}`).font = { name: "Calibri", bold: true, size: 13, color: { argb: COLORS.white } };
infra.getCell(`A${envStart - 1}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.navy } };
infra.getRow(envStart - 1).height = 26;

infra.getRow(envStart).values = ["Nome", "Ambiente", "—", "—", "Status", "Notas"];
applyHeader(infra.getRow(envStart));

ENV_VARS.forEach((e, i) => {
  const row = infra.addRow([e.name, e.env, "—", "—", "", e.notes]);
  applyDataRow(row, i % 2 === 0);
  row.getCell(1).font = { name: "Consolas", size: 9, bold: true };
  applyStatusCell(row.getCell(5), e.configured);
});

// ─── Sheet 5: Pendentes ─────────────────────────────────────────────────────
const pending = wb.addWorksheet("Pendentes", {
  properties: { tabColor: { argb: "FFFF6B6B" } },
});

pending.getRow(1).values = ["Categoria", "Item", "Prioridade", "Esforço", "Bloqueia", "Notas"];
applyHeader(pending.getRow(1));
pending.views = [{ state: "frozen", ySplit: 1 }];

PENDING.forEach((p, i) => {
  const row = pending.addRow([p.cat, p.item, p.priority, p.effort, p.blocks, p.notes]);
  applyDataRow(row, i % 2 === 0);
  // colour the cat cell
  if (p.cat === "BLOCKER") {
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.red } };
    row.getCell(1).font = { name: "Calibri", bold: true, color: { argb: COLORS.redText } };
  } else if (p.cat === "ALTO") {
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.orange } };
    row.getCell(1).font = { name: "Calibri", bold: true, color: { argb: COLORS.orangeText } };
  } else if (p.cat === "MÉDIO") {
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.yellow } };
    row.getCell(1).font = { name: "Calibri", bold: true, color: { argb: COLORS.yellowText } };
  }
});

pending.columns = [
  { width: 14 }, { width: 50 }, { width: 16 }, { width: 14 }, { width: 50 }, { width: 60 },
];
pending.autoFilter = { from: { row: 1, column: 1 }, to: { row: PENDING.length + 1, column: 6 } };

// ─── Sheet 6: Bugs Resolvidos ───────────────────────────────────────────────
const bugs = wb.addWorksheet("Bugs Resolvidos", {
  properties: { tabColor: { argb: COLORS.green } },
});

bugs.getRow(1).values = ["#", "Bug", "Causa raiz", "Fix aplicado", "Commit", "Quando"];
applyHeader(bugs.getRow(1));
bugs.views = [{ state: "frozen", ySplit: 1 }];

BUGS_FIXED.forEach((b, i) => {
  const row = bugs.addRow([b.num, b.bug, b.cause, b.fix, b.commit, b.date]);
  applyDataRow(row, i % 2 === 0);
  row.getCell(1).font = { name: "Calibri", bold: true, color: { argb: COLORS.greenText } };
  row.getCell(1).alignment = { horizontal: "center" };
  if (b.commit !== "—") {
    row.getCell(5).font = { name: "Consolas", size: 9, color: { argb: COLORS.blueText } };
  }
});

bugs.columns = [
  { width: 6 }, { width: 50 }, { width: 50 }, { width: 50 }, { width: 14 }, { width: 28 },
];

// ─── Sheet 7: Credenciais ──────────────────────────────────────────────────
const creds = wb.addWorksheet("Credenciais", {
  properties: { tabColor: { argb: "FFA855F7" } },
});

creds.mergeCells("A1:E1");
creds.getCell("A1").value = "⚠️ DEMO ONLY — Rotacionar todas as passwords antes de produção";
creds.getCell("A1").font = { name: "Calibri", bold: true, size: 11, color: { argb: COLORS.redText } };
creds.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.yellow } };
creds.getCell("A1").alignment = { horizontal: "center" };
creds.getRow(1).height = 28;

creds.getRow(2).values = ["Tipo", "Login / Email", "Password", "Acesso", "Notas"];
applyHeader(creds.getRow(2));
creds.views = [{ state: "frozen", ySplit: 2 }];

CREDENTIALS.forEach((c, i) => {
  const row = creds.addRow([c.type, c.login, c.pass, c.access, c.notes]);
  applyDataRow(row, i % 2 === 0);
  row.getCell(2).font = { name: "Consolas", size: 9 };
  row.getCell(3).font = { name: "Consolas", size: 9 };
});

creds.columns = [
  { width: 22 }, { width: 38 }, { width: 24 }, { width: 14 }, { width: 60 },
];

// ─── Sheet 8: Roadmap ──────────────────────────────────────────────────────
const roadmap = wb.addWorksheet("Próximas Etapas", {
  properties: { tabColor: { argb: "FF14B8A6" } },
});

roadmap.getRow(1).values = ["Fase", "Item", "Prioridade", "Esforço", "Dependências", "Status"];
applyHeader(roadmap.getRow(1));
roadmap.views = [{ state: "frozen", ySplit: 1 }];

ROADMAP.forEach((r, i) => {
  const row = roadmap.addRow([r.phase, r.item, r.priority, r.effort, r.deps, ""]);
  applyDataRow(row, i % 2 === 0);
  if (r.phase.includes("FASE 1")) {
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.red } };
    row.getCell(1).font = { name: "Calibri", bold: true, color: { argb: COLORS.redText } };
  } else if (r.phase.includes("FASE 2")) {
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.orange } };
    row.getCell(1).font = { name: "Calibri", bold: true, color: { argb: COLORS.orangeText } };
  } else if (r.phase.includes("FASE 3")) {
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.yellow } };
    row.getCell(1).font = { name: "Calibri", bold: true, color: { argb: COLORS.yellowText } };
  } else if (r.phase.includes("FASE 4") || r.phase.includes("FASE 5")) {
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.blue } };
    row.getCell(1).font = { name: "Calibri", bold: true, color: { argb: COLORS.blueText } };
  }
  applyStatusCell(row.getCell(6), r.status);
});

roadmap.columns = [
  { width: 22 }, { width: 50 }, { width: 14 }, { width: 16 }, { width: 32 }, { width: 18 },
];
roadmap.autoFilter = { from: { row: 1, column: 1 }, to: { row: ROADMAP.length + 1, column: 6 } };

// ─── Save ──────────────────────────────────────────────────────────────────
const outPath = path.join(
  "C:",
  "Users",
  "silva",
  "OneDrive",
  "Área de Trabalho",
  "Academia Digital BSOFT",
  "Mapa-Sistema-Academia-Digital.xlsx"
);

wb.xlsx.writeFile(outPath).then(() => {
  console.log(`\n✅ Excel gerado: ${outPath}`);
  console.log(`   ${wb.worksheets.length} sheets`);
  console.log(`   Routes: ${ROUTES.length}`);
  console.log(`   Components: ${COMPONENTS.length}`);
  console.log(`   Infrastructure items: ${INFRASTRUCTURE.length} + ${ENV_VARS.length} env vars`);
  console.log(`   Pending items: ${PENDING.length}`);
  console.log(`   Bugs fixed: ${BUGS_FIXED.length}`);
  console.log(`   Roadmap items: ${ROADMAP.length}`);
});
