/**
 * Gera documento Word de passagem de servico para Academia Digital.
 * Output: ../Passagem-Servico-Academia-Digital.docx
 */
const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageBreak,
  ShadingType,
} = require("docx");

// ─── Helpers ──────────────────────────────────────────────────────────────

const NAVY = "0B2447";
const GOLD = "CCA823";
const MUTED = "44474E";
const BORDER = "C4C6CF";
const LIGHT_BG = "EFF4FF";
const SUCCESS = "059669";
const WARNING = "B45309";
const DANGER = "BA1A1A";

function H1(text) {
  return new Paragraph({
    children: [
      new TextRun({ text, bold: true, size: 40, color: NAVY }),
    ],
    spacing: { before: 480, after: 240 },
    border: {
      bottom: { color: GOLD, size: 12, style: BorderStyle.SINGLE },
    },
  });
}

function H2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: NAVY })],
    spacing: { before: 360, after: 160 },
  });
}

function H3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, color: NAVY })],
    spacing: { before: 240, after: 120 },
  });
}

function P(text, opts = {}) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: 20,
        color: opts.muted ? MUTED : "000000",
        bold: opts.bold,
        italics: opts.italic,
      }),
    ],
    spacing: { after: 120 },
    alignment: opts.center ? AlignmentType.CENTER : undefined,
  });
}

function Kicker(text, color = GOLD) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 16,
        color,
      }),
    ],
    spacing: { after: 60 },
  });
}

function Bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20 })],
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}

function BulletStrong(label, body) {
  return new Paragraph({
    children: [
      new TextRun({ text: label, bold: true, size: 20, color: NAVY }),
      new TextRun({ text: " — " + body, size: 20 }),
    ],
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}

function Spacer(after = 200) {
  return new Paragraph({ children: [], spacing: { after } });
}

function StatusBadge(status) {
  const map = {
    completed: { label: "CONCLUIDO", color: SUCCESS, bg: "D1FAE5" },
    pending: { label: "PENDENTE", color: WARNING, bg: "FEF3C7" },
    blocked: { label: "BLOQUEADO", color: DANGER, bg: "FEE2E2" },
  };
  const m = map[status];
  return new TextRun({
    text: " " + m.label + " ",
    bold: true,
    size: 14,
    color: m.color,
    shading: { type: ShadingType.SOLID, color: m.bg, fill: m.bg },
  });
}

function tableHeaderCell(text, widthPct) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
    children: [
      new Paragraph({
        children: [
          new TextRun({ text, bold: true, color: "FFFFFF", size: 18 }),
        ],
      }),
    ],
  });
}

function tableCell(text, opts = {}) {
  return new TableCell({
    width: opts.widthPct
      ? { size: opts.widthPct, type: WidthType.PERCENTAGE }
      : undefined,
    shading: opts.shading
      ? { type: ShadingType.SOLID, color: opts.shading, fill: opts.shading }
      : undefined,
    children: [
      new Paragraph({
        children: Array.isArray(text)
          ? text
          : [
              new TextRun({
                text: String(text),
                size: 18,
                color: opts.color ?? "000000",
                bold: opts.bold,
              }),
            ],
      }),
    ],
  });
}

function makeTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: BORDER },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: BORDER },
    },
  });
}

function infoBox(title, body) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.SOLID, color: LIGHT_BG, fill: LIGHT_BG },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: title, bold: true, size: 20, color: NAVY }),
                ],
                spacing: { after: 80 },
              }),
              ...body.map((line) =>
                new Paragraph({
                  children: [new TextRun({ text: line, size: 18 })],
                  spacing: { after: 60 },
                })
              ),
            ],
          }),
        ],
      }),
    ],
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.SINGLE, size: 16, color: GOLD },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
  });
}

// ─── Content ──────────────────────────────────────────────────────────────

const today = new Date().toLocaleDateString("pt-PT", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const cover = [
  new Paragraph({ children: [], spacing: { before: 2400 } }),
  new Paragraph({
    children: [
      new TextRun({
        text: "PASSAGEM DE SERVIÇO",
        bold: true,
        size: 28,
        color: GOLD,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
  }),
  new Paragraph({
    children: [
      new TextRun({
        text: "Academia Digital",
        bold: true,
        size: 80,
        color: NAVY,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
  }),
  new Paragraph({
    children: [
      new TextRun({
        text: "Plataforma SaaS multi-tenant de gestão de formação certificada DGERT",
        size: 24,
        color: MUTED,
        italics: true,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 1200 },
  }),
  new Paragraph({
    children: [
      new TextRun({ text: "Cliente: ", bold: true, size: 22 }),
      new TextRun({
        text: "Grupo Oporto Forte Internacional",
        size: 22,
        color: NAVY,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [
      new TextRun({ text: "Modelo: ", bold: true, size: 22 }),
      new TextRun({ text: "Joint Venture · BSoft × Oporto Forte", size: 22 }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [
      new TextRun({ text: "Documento gerado: ", bold: true, size: 22 }),
      new TextRun({ text: today, size: 22 }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 1200 },
  }),
  new Paragraph({
    children: [
      new TextRun({
        text: "Estado: 5 fases concluídas · 7 fases bloqueadas a aguardar input externo",
        size: 20,
        color: MUTED,
        italics: true,
      }),
    ],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ─── 1. Sumario Executivo ─────────────────────────────────────────────────

const sumario = [
  H1("1. Sumário Executivo"),
  P("A Academia Digital é uma plataforma SaaS white-label desenvolvida em Next.js 14 para gestão completa de formação profissional certificada DGERT em Portugal. Foi projetada desde o primeiro dia como multi-tenant — uma única instalação serve múltiplos clientes finais (entidades formadoras), cada um com a sua marca, domínio próprio e dossier técnico-pedagógico isolado.", { muted: false }),
  Spacer(140),
  H3("Objetivo do projeto"),
  P("Digitalizar todo o ciclo de vida da formação certificada — desde a publicação do catálogo público até à emissão dos certificados DGERT — garantindo conformidade auditável em tempo real e reduzindo o trabalho administrativo manual."),
  Spacer(140),
  H3("Diferenciais entregues"),
  Bullet("Multi-tenant nativo (path-based + subdomain + custom domain)"),
  Bullet("Assinatura digital DGERT-compliant com audit trail e endpoint de invalidação"),
  Bullet("Geração automática de PDFs DGERT (Folha de presenças, Ficha de inscrição, Ata de reunião, Dossier técnico-pedagógico completo)"),
  Bullet("Portal self-service do formando com check-in QR e calendário próprio"),
  Bullet("Notificações in-app contextuais por role (sem necessidade de tabela dedicada — sempre actualizadas)"),
  Bullet("Auth custom edge-compatible (jose JWT) sem dependência de NextAuth"),
  new Paragraph({ children: [new PageBreak()] }),
];

// ─── 2. Stack Técnico ─────────────────────────────────────────────────────

const stack = [
  H1("2. Stack Técnico"),
  Spacer(80),
  H3("Frontend & runtime"),
  makeTable([
    new TableRow({
      children: [tableHeaderCell("Camada", 30), tableHeaderCell("Tecnologia", 70)],
    }),
    ...[
      ["Framework", "Next.js 14.2.35 (App Router)"],
      ["Linguagem", "TypeScript 5"],
      ["Styling", "Tailwind CSS 3.4 + tokens custom (navy/gold/surface)"],
      ["Componentes", "shadcn/ui · 18 primitives · lucide-react"],
      ["Estado client", "React Server Components + Zustand (apenas onde necessário)"],
    ].map(
      ([k, v]) =>
        new TableRow({
          children: [tableCell(k, { bold: true, widthPct: 30 }), tableCell(v, { widthPct: 70 })],
        })
    ),
  ]),
  Spacer(160),
  H3("Backend & dados"),
  makeTable([
    new TableRow({
      children: [tableHeaderCell("Camada", 30), tableHeaderCell("Tecnologia", 70)],
    }),
    ...[
      ["ORM", "Prisma 6.19 (NÃO Prisma 7 — sintaxe quebrou)"],
      ["Base de dados", "Supabase Postgres · região us-west-2 · schema isolado 'academia'"],
      ["Connection", "Pooler URL (transaction mode 6543) com pgbouncer=true"],
      ["Auth", "Custom · jose (JWT edge-compat) + bcryptjs"],
      ["E-mail", "Resend SDK (com fallback para console em dev)"],
      ["PDFs", "@react-pdf/renderer (NÃO Puppeteer — incompatível serverless)"],
      ["Assinatura", "react-signature-canvas (PNG + SHA hash para tamper detection)"],
    ].map(
      ([k, v]) =>
        new TableRow({
          children: [tableCell(k, { bold: true, widthPct: 30 }), tableCell(v, { widthPct: 70 })],
        })
    ),
  ]),
  Spacer(160),
  H3("Infraestrutura"),
  makeTable([
    new TableRow({
      children: [tableHeaderCell("Recurso", 30), tableHeaderCell("Detalhe", 70)],
    }),
    ...[
      ["Hosting", "Vercel · Hobby tier · região fra1"],
      ["Repositório", "GitHub: bsoftwhitelabel/academiab2 (branch main)"],
      ["URL produção", "https://academiab2.vercel.app"],
      ["DB", "Supabase projecto ecqptnirekuiibhmnbaq"],
      ["CI/CD", "Auto-deploy via GitHub push para main"],
    ].map(
      ([k, v]) =>
        new TableRow({
          children: [tableCell(k, { bold: true, widthPct: 30 }), tableCell(v, { widthPct: 70 })],
        })
    ),
  ]),
  new Paragraph({ children: [new PageBreak()] }),
];

// ─── 3. Etapas Concluídas ─────────────────────────────────────────────────

function phaseHeader(num, title, status) {
  return new Paragraph({
    children: [
      new TextRun({
        text: "FASE " + num + "  ·  ",
        bold: true,
        size: 22,
        color: GOLD,
      }),
      new TextRun({ text: title, bold: true, size: 22, color: NAVY }),
      new TextRun({ text: "    " }),
      StatusBadge(status),
    ],
    spacing: { before: 240, after: 120 },
  });
}

const completed = [
  H1("3. Etapas Concluídas"),
  P("Foram entregues 5 fases principais, cobrindo desde a fundação da plataforma até funcionalidades avançadas DGERT. Todas estão em produção (build verde · 44 rotas activas).", { muted: true }),
  Spacer(200),

  phaseHeader("1", "Fundação da plataforma", "completed"),
  Bullet("Multi-tenant routing (path-based + subdomain + custom domain via middleware)"),
  Bullet("Auth 3 roles (ADMIN/OWNER, TRAINER, TRAINEE) com JWT edge-compatible"),
  Bullet("Schema Prisma com 14 modelos + isolamento 'academia' no Supabase"),
  Bullet("Login/logout, magic-link para formandos, sessões 7 dias"),
  Bullet("Deploy Vercel com Pooler URL Supabase (resolveu falhas connection serverless)"),

  phaseHeader("2", "Dashboards & navegação", "completed"),
  Bullet("6 dashboards Prisma reais (admin, trainer, portal × 2 cada)"),
  Bullet("14 placeholders ComingSoon para evitar 404s no sidebar"),
  Bullet("CourseGridCard, StatCard, DashboardShell, NotificationBell, MobileBottomNav (18 componentes shell)"),
  Bullet("Catálogo público de cursos com filtros (área, modalidade, nível)"),

  phaseHeader("3.1-3.6", "Páginas reais (substituição de placeholders)", "completed"),
  Bullet("/admin/reports — relatórios executivos com queries reais"),
  Bullet("/admin/settings — white-label (logo, cores primária/accent, código DGERT)"),
  Bullet("/admin/courses — listagem real com Prisma + filtros + paginação (migrada de mock)"),
  Bullet("/admin/courses/new e /admin/courses/[slug]/edit — formulário criar/editar"),
  Bullet("/portal/calendar — calendário do formando com eventos próximos"),
  Bullet("/portal/settings, /portal/profile, /portal/history — área self-service"),
  Bullet("/trainer/courses, /trainer/trainees, /trainer/trainers, /trainer/classes, /trainer/reports, /trainer/settings"),

  phaseHeader("4.4", "Dossier técnico-pedagógico DGERT", "completed"),
  Bullet("PDF agrupado de 5 páginas: capa + programa + formadores + formandos + sessões"),
  Bullet("Endpoint /api/pdf/dossie-dgert/[trainingActionId] com auth e tenant boundary"),
  Bullet("Inclui taxa de presença por formando, horas atendidas, assinaturas, módulos curriculares"),
  Bullet("Botão de download em cada turma da página /trainer/sessions"),

  phaseHeader("4.5", "Notificações in-app", "completed"),
  Bullet("Sino no topbar com badge de contagem e estado urgente (vermelho)"),
  Bullet("Notificações derivadas de Prisma — sem nova tabela, sempre actualizadas"),
  Bullet("Trainee: sessões em <24h + assinaturas pendentes"),
  Bullet("Trainer: sessões em <24h com #formandos esperados"),
  Bullet("Admin: turmas a terminar em <7d + novas inscrições <24h"),

  phaseHeader("4.6", "Invalidação de assinaturas DGERT", "completed"),
  Bullet("POST /api/signatures/[attendanceId]/invalidate (auth + tenant + role check)"),
  Bullet("Permitido para ADMIN/OWNER ou TRAINER assignado à turma"),
  Bullet("Requer motivo obrigatório · audit no campo postClassReason"),
  Bullet("/admin/signatures — página de auditoria com filtros (assinadas/invalidadas/todas) e estatísticas"),
  Bullet("Componente reutilizável InvalidateSignatureButton (Dialog + form)"),

  phaseHeader("Extra", "Performance & UX", "completed"),
  Bullet("loading.tsx em /admin, /trainer, /portal (skeleton + pill 'A carregar' instantâneo)"),
  Bullet("experimental.staleTimes 30s/180s para cache RSC mais agressivo"),
  Bullet("Admin agora aterra em /admin/dashboard após login (era /admin/courses)"),
  Bullet("Bug crítico resolvido: middleware passa sessão via headers (eliminou redirect-loop em pages com getSession)"),

  new Paragraph({ children: [new PageBreak()] }),
];

// ─── 4. Etapas Pendentes ──────────────────────────────────────────────────

const pending = [
  H1("4. Etapas Pendentes"),
  P("As fases abaixo estão prontas a executar — cada uma tem o requisito externo claramente identificado. Todas têm desenho técnico decidido.", { muted: true }),
  Spacer(160),

  phaseHeader("3.7", "Cron certificados pós-turma", "blocked"),
  P("Geração e envio automático de certificado DGERT por e-mail quando uma turma muda para status COMPLETED.", { muted: true }),
  BulletStrong("Bloqueio", "Depende da Fase 3.9 (Resend) estar activa"),
  BulletStrong("Plano técnico", "Cron Vercel diário (vercel.json) → query trainingAction.status=COMPLETED não certificada → renderiza PDF certificado → envia via Resend → marca certificate.deliveredAt"),
  BulletStrong("Esforço estimado", "1-2 dias após Resend pronto"),

  phaseHeader("3.8", "Cloudflare R2 (storage assinaturas)", "blocked"),
  P("Atualmente as assinaturas digitais ficam em memória (datauri PNG). Para produção real precisam ser persistidas em object storage com URLs assinadas.", { muted: true }),
  BulletStrong("Bloqueio externo", "Acesso à conta Cloudflare + criação de bucket R2 + Access Key ID + Secret Access Key + endpoint URL"),
  BulletStrong("Plano técnico", "Adicionar @aws-sdk/client-s3 (R2 é S3-compatible) → upload PNG no checkin → guardar imageUrl no Signature.imageUrl → URLs com expiração"),
  BulletStrong("Esforço estimado", "1 dia após keys disponíveis"),

  phaseHeader("3.9", "Resend API + DNS verification", "blocked"),
  P("Magic-links de formando dependem de envio real de e-mail. Atualmente em desenvolvimento são impressos no console.", { muted: true }),
  BulletStrong("Bloqueio externo", "Conta Resend → API key → verificação DNS do domínio (SPF, DKIM)"),
  BulletStrong("Plano técnico", "RESEND_API_KEY no Vercel → registar domínio (oportoforte.pt ou bsoft.io) → ajustar from address em src/lib/auth/email.ts"),
  BulletStrong("Esforço estimado", "Algumas horas (já está implementado, só falta API key)"),

  phaseHeader("4.1", "Custom domain (white-label)", "blocked"),
  P("Cada cliente final terá o seu domínio próprio (ex.: formacao.oportoforte.com) servido pela mesma instância Vercel.", { muted: true }),
  BulletStrong("Bloqueio externo", "Acesso ao DNS da Oporto Forte (precisa Nadja Ferreira)"),
  BulletStrong("Plano técnico", "Adicionar domínio no Vercel → CNAME apontar para cname.vercel-dns.com → setting tenant.domain no Postgres → middleware já está pronto para resolver"),
  BulletStrong("Esforço estimado", "1-2 horas após DNS configurado"),

  phaseHeader("4.2", "Catálogo Workshops Saúde Mental", "blocked"),
  P("40 workshops em 9 blocos temáticos para a Oporto Forte. É o produto comercial mais urgente (pedido directo da Nadja).", { muted: true }),
  BulletStrong("Bloqueio externo", "Conteúdo a fornecer pela Nadja: nome, descrição, duração, formador, preço por workshop"),
  BulletStrong("Plano técnico", "Adicionar tabela WorkshopBlock (relação 1-N com Course existente) → seed dos 40 workshops → página /catalog/workshops já criada (placeholder)"),
  BulletStrong("Esforço estimado", "2-3 dias após receber conteúdo estruturado"),

  phaseHeader("4.3", "Onboarding fluxo formando-empresa", "blocked"),
  P("Quando um formando se inscreve, precisa ser ligado a uma entidade-cliente (empresa). Regras de auto-aprovação versus aprovação HR.", { muted: true }),
  BulletStrong("Bloqueio externo", "Definição de regras de negócio com Nadja: auto-criar empresa? quem pode auto-aprovar? limites?"),
  BulletStrong("Plano técnico", "Wizard 3 passos: dados pessoais → empresa (nova ou existente) → confirmação → magic-link de acesso"),
  BulletStrong("Esforço estimado", "3-4 dias após regras definidas"),

  phaseHeader("5.x", "Faturação / billing por tenant", "blocked"),
  P("Joint Venture entre BSoft e Oporto Forte exige split automático de receitas. Cada tenant tem o seu plano e contador de uso.", { muted: true }),
  BulletStrong("Bloqueio externo", "Regras comerciais ainda em negociação BSoft × Oporto Forte"),
  BulletStrong("Plano técnico", "Schema TenantPlan + UsageCounter → integração Stripe Connect (split payments) → painel /admin/billing"),
  BulletStrong("Esforço estimado", "1-2 semanas após regras definidas"),

  new Paragraph({ children: [new PageBreak()] }),
];

// ─── 5. Acessos & Credenciais ─────────────────────────────────────────────

const acessos = [
  H1("5. Acessos & Credenciais"),
  P("AVISO DE SEGURANÇA: Estes acessos são de demo/desenvolvimento. Devem ser rotacionados antes do go-live em produção real com clientes finais.", { italic: true, muted: false }),
  Spacer(160),

  H3("URLs do projecto"),
  makeTable([
    new TableRow({
      children: [tableHeaderCell("Recurso", 30), tableHeaderCell("URL", 70)],
    }),
    ...[
      ["Aplicação produção", "https://academiab2.vercel.app"],
      ["Repositório GitHub", "https://github.com/bsoftwhitelabel/academiab2"],
      ["Vercel dashboard", "https://vercel.com/dashboard (project: academiab2)"],
      ["Supabase dashboard", "https://supabase.com/dashboard/project/ecqptnirekuiibhmnbaq"],
      ["Excel mapping", "Mapa-Sistema-Academia-Digital-v2.xlsx (na pasta do projeto)"],
      ["Google Sheet status", "docs.google.com/spreadsheets/d/1ziww0xVZm8mJSfOomWWHHD7fvGquUQMqHTsNDQoMP7M"],
    ].map(
      ([k, v]) =>
        new TableRow({
          children: [tableCell(k, { bold: true, widthPct: 30 }), tableCell(v, { widthPct: 70 })],
        })
    ),
  ]),
  Spacer(200),

  H3("Credenciais demo (rotacionar!)"),
  makeTable([
    new TableRow({
      children: [
        tableHeaderCell("Role", 20),
        tableHeaderCell("E-mail", 50),
        tableHeaderCell("Password / fluxo", 30),
      ],
    }),
    ...[
      ["ADMIN", "admin@oportoforte.pt", "Admin@2026"],
      ["TRAINER", "ricardo.santos@oportoforte.pt", "Trainer@2026"],
      ["TRAINEE", "maryluz.oliveira@oportoforte.pt", "Magic-link (sem password)"],
    ].map(
      ([role, email, pwd]) =>
        new TableRow({
          children: [
            tableCell(role, { bold: true, color: NAVY, widthPct: 20 }),
            tableCell(email, { widthPct: 50 }),
            tableCell(pwd, { widthPct: 30 }),
          ],
        })
    ),
  ]),
  Spacer(200),

  H3("Variáveis de ambiente Vercel"),
  P("Estas variáveis devem estar configuradas em Production scope na Vercel. Falta apenas RESEND_API_KEY e R2_*."),
  Bullet("DATABASE_URL — Supabase Pooler URL (transaction mode 6543, pgbouncer=true, schema=academia)"),
  Bullet("DIRECT_URL — Supabase direct connection (apenas para migrations, port 5432)"),
  Bullet("AUTH_SECRET — string aleatória 32+ chars (gerar com `openssl rand -base64 32`)"),
  Bullet("NEXT_PUBLIC_BASE_DOMAIN — domínio base (ex.: academia.bsoft.io)"),
  Bullet("NEXT_PUBLIC_DEFAULT_TENANT_SLUG — slug default (oportoforte)"),
  Bullet("RESEND_API_KEY — pendente"),
  Bullet("R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT — pendentes"),

  new Paragraph({ children: [new PageBreak()] }),
];

// ─── 6. Bugs & gotchas ────────────────────────────────────────────────────

const gotchas = [
  H1("6. Lições Aprendidas e Pontos de Atenção"),
  P("Bugs e armadilhas resolvidos durante o desenvolvimento que merecem atenção em manutenção futura.", { muted: true }),
  Spacer(140),

  infoBox("Prisma 7 quebra a sintaxe", [
    "A versão 7 do Prisma alterou a sintaxe de datasource. NÃO atualizar — manter na versão 6.19.x.",
    "Se aparecer erro 'url = env(...) no longer supported', voltar a Prisma 6.",
  ]),
  Spacer(140),

  infoBox("Supabase pooler URL é mandatório", [
    "Direct connection (porta 5432) falha em ambiente serverless Vercel.",
    "Usar SEMPRE Pooler URL: postgres.PROJECT_REF:PWD@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=academia&connection_limit=1",
    "Username DEVE ser postgres.PROJECT_REF (com ponto e ID), não apenas postgres.",
  ]),
  Spacer(140),

  infoBox("Server/Client component boundaries", [
    "Lucide icons são forwardRef — não podem ser passados como props de Server para Client Component.",
    "Solução adoptada: ITEMS map definido DENTRO do Client Component; Server passa apenas role + slug.",
    "Sintoma do erro: 'Functions cannot be passed directly to Client Components'.",
  ]),
  Spacer(140),

  infoBox("getSession no Node runtime falhava", [
    "Bug crítico: middleware (Edge) validava JWT mas getSession() em Server Components (Node) retornava null.",
    "Solução: middleware anexa session aos request headers (x-session-*); getSession lê headers primeiro, com fallback ao cookie.",
    "Referência: src/middleware.ts e src/lib/auth/session.ts",
  ]),
  Spacer(140),

  infoBox("PDF não pode usar Puppeteer em serverless", [
    "Puppeteer/Chromium incompatível com Vercel Serverless Functions (>50MB).",
    "Solução: @react-pdf/renderer (puro JS, declarativo, mantém estilo DGERT).",
    "Tipografia limitada — usar fonts built-in (Helvetica) ou registar custom.",
  ]),

  new Paragraph({ children: [new PageBreak()] }),
];

// ─── 7. Próximos passos recomendados ──────────────────────────────────────

const proximos = [
  H1("7. Próximos Passos Recomendados"),
  P("Ordem sugerida para destravar entregas pendentes, priorizando o que oferece maior valor comercial com menor esforço.", { muted: true }),
  Spacer(160),

  H3("Curto prazo (próximas 2 semanas)"),
  BulletStrong("Resend API key + DNS verification (Fase 3.9)", "destrava magic-links em produção e Fase 3.7"),
  BulletStrong("Custom domain Oporto Forte (Fase 4.1)", "elemento white-label crítico para go-live comercial"),
  BulletStrong("Catálogo Workshops Saúde Mental (Fase 4.2)", "produto mais urgente da Nadja, alavanca venda directa"),
  Spacer(160),

  H3("Médio prazo (mês 1)"),
  BulletStrong("Cloudflare R2 (Fase 3.8)", "persistir assinaturas — sem isto, restart serverless perde dados"),
  BulletStrong("Cron certificados (Fase 3.7)", "automatizar entrega DGERT pós-turma"),
  BulletStrong("Onboarding flow (Fase 4.3)", "essencial para escalar inscrições self-service"),
  Spacer(160),

  H3("Médio-longo prazo (mês 2-3)"),
  BulletStrong("Faturação multi-tenant (Fase 5.x)", "monetizar a plataforma — exige decisões comerciais BSoft × Oporto Forte"),
  BulletStrong("Auditoria DGERT extra", "exportação completa para inspeções (queue + ZIP)"),
  BulletStrong("App mobile dedicada", "atualmente é PWA-friendly; futuro nativo se demanda crescer"),
  Spacer(280),

  H3("Como executar uma entrega"),
  P("1. Criar branch a partir de main (ex.: feat/resend)"),
  P("2. Implementar — código está em src/app, src/components, src/lib"),
  P("3. Testar localmente com 'npm run dev' (Supabase remoto via Pooler URL)"),
  P("4. 'npm run build' — Vercel faz o mesmo no deploy"),
  P("5. Push para main → Vercel auto-deploy ~2 minutos"),
  P("6. Verificar https://academiab2.vercel.app + monitorar Vercel logs"),
];

// ─── Build document ───────────────────────────────────────────────────────

const doc = new Document({
  creator: "BSoft White Label · Academia Digital",
  title: "Passagem de Serviço · Academia Digital",
  description: "Estado actual do projeto Academia Digital para passagem de serviço",
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22 },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      children: [
        ...cover,
        ...sumario,
        ...stack,
        ...completed,
        ...pending,
        ...acessos,
        ...gotchas,
        ...proximos,
      ],
    },
  ],
});

// ─── Output ───────────────────────────────────────────────────────────────

const outDir = path.resolve(__dirname, "..", "..");
const outPath = path.join(outDir, "Passagem-Servico-Academia-Digital.docx");

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("OK: " + outPath);
  console.log("Bytes: " + buf.length);
});
