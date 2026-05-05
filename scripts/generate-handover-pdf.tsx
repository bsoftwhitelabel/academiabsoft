/**
 * Gera PDF de passagem de serviço para Academia Digital.
 * Output: ../Passagem-Servico-Academia-Digital.pdf
 *
 * Run: npx tsx scripts/generate-handover-pdf.tsx
 */
import * as fs from "fs";
import * as path from "path";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToFile,
} from "@react-pdf/renderer";
import * as React from "react";

// ─── Tokens (espelham styles.ts da app) ───────────────────────────────────

const COLORS = {
  navy: "#0B2447",
  navyDeep: "#000F27",
  gold: "#CCA823",
  goldLight: "#FEF6DA",
  text: "#0B1C30",
  textMuted: "#44474E",
  textSubtle: "#74777F",
  border: "#C4C6CF",
  borderLight: "#E2E5EB",
  surfaceLow: "#EFF4FF",
  white: "#FFFFFF",
  emerald: "#059669",
  emeraldBg: "#D1FAE5",
  amber: "#B45309",
  amberBg: "#FEF3C7",
  red: "#BA1A1A",
  redBg: "#FEE2E2",
} as const;

const s = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    lineHeight: 1.5,
  },

  // ── cover ────────────────────────────────────────────────────────────
  coverWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  coverKicker: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.gold,
    letterSpacing: 4,
    marginBottom: 16,
  },
  coverTitle: {
    fontSize: 38,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
    marginBottom: 12,
    textAlign: "center",
  },
  coverSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 60,
    maxWidth: 420,
  },
  coverMetaRow: {
    flexDirection: "row",
    marginBottom: 6,
    fontSize: 11,
  },
  coverMetaLabel: {
    fontFamily: "Helvetica-Bold",
    width: 110,
    color: COLORS.navy,
  },
  coverMetaValue: { color: COLORS.text },
  coverFooter: {
    position: "absolute",
    bottom: 56,
    left: 56,
    right: 56,
    textAlign: "center",
    fontSize: 9,
    color: COLORS.textSubtle,
    fontStyle: "italic",
  },

  // ── headings ─────────────────────────────────────────────────────────
  h1: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.gold,
  },
  h1Kicker: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.gold,
    letterSpacing: 2,
    marginBottom: 4,
  },
  sectionLead: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontStyle: "italic",
    marginBottom: 18,
    lineHeight: 1.5,
  },
  h2: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
    marginTop: 14,
    marginBottom: 8,
  },
  h3: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
    marginTop: 10,
    marginBottom: 6,
  },

  // ── paragraph & list ─────────────────────────────────────────────────
  p: { fontSize: 10, color: COLORS.text, marginBottom: 6, lineHeight: 1.5 },
  pMuted: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 8,
    lineHeight: 1.5,
  },
  bullet: { flexDirection: "row", marginBottom: 4, paddingLeft: 4 },
  bulletDot: {
    width: 12,
    fontSize: 10,
    color: COLORS.gold,
    fontFamily: "Helvetica-Bold",
  },
  bulletText: { flex: 1, fontSize: 10, color: COLORS.text, lineHeight: 1.45 },
  bulletLabel: { fontFamily: "Helvetica-Bold", color: COLORS.navy },

  // ── badges ───────────────────────────────────────────────────────────
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  badgeDone: { backgroundColor: COLORS.emeraldBg, color: COLORS.emerald },
  badgeBlocked: { backgroundColor: COLORS.redBg, color: COLORS.red },
  badgePending: { backgroundColor: COLORS.amberBg, color: COLORS.amber },

  // ── phase header ─────────────────────────────────────────────────────
  phaseHead: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 6,
  },
  phaseNum: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.gold,
  },
  phaseTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
    flex: 1,
    marginLeft: 4,
  },

  // ── tables ───────────────────────────────────────────────────────────
  table: {
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  tableHeadRow: {
    flexDirection: "row",
    backgroundColor: COLORS.navy,
  },
  tableHeadCell: {
    padding: 6,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderLight,
  },
  tableRowAlt: {
    backgroundColor: COLORS.surfaceLow,
  },
  tableCell: {
    padding: 6,
    fontSize: 9.5,
    color: COLORS.text,
  },
  tableCellBold: {
    padding: 6,
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
  },

  // ── info box ─────────────────────────────────────────────────────────
  infoBox: {
    backgroundColor: COLORS.surfaceLow,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    padding: 10,
    marginBottom: 10,
  },
  infoBoxTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
    marginBottom: 4,
  },
  infoBoxBody: {
    fontSize: 9.5,
    color: COLORS.text,
    lineHeight: 1.5,
  },

  // ── footer ───────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 28,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: COLORS.textSubtle,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderLight,
  },
});

// ─── Building blocks ──────────────────────────────────────────────────────

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.bullet}>
      <Text style={s.bulletDot}>·</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  );
}

function BulletStrong({ label, body }: { label: string; body: string }) {
  return (
    <View style={s.bullet}>
      <Text style={s.bulletDot}>·</Text>
      <Text style={s.bulletText}>
        <Text style={s.bulletLabel}>{label}</Text>
        {" — " + body}
      </Text>
    </View>
  );
}

function Badge({ kind }: { kind: "done" | "blocked" | "pending" }) {
  const cls =
    kind === "done"
      ? s.badgeDone
      : kind === "blocked"
      ? s.badgeBlocked
      : s.badgePending;
  const label =
    kind === "done"
      ? "CONCLUIDO"
      : kind === "blocked"
      ? "BLOQUEADO"
      : "PENDENTE";
  return <Text style={[s.badge, cls]}>{label}</Text>;
}

function PhaseHead({
  num,
  title,
  status,
}: {
  num: string;
  title: string;
  status: "done" | "blocked" | "pending";
}) {
  return (
    <View style={s.phaseHead} wrap={false}>
      <Text style={s.phaseNum}>FASE {num}</Text>
      <Text style={s.phaseTitle}> · {title}</Text>
      <Badge kind={status} />
    </View>
  );
}

function SectionTitle({
  index,
  title,
  lead,
}: {
  index: string;
  title: string;
  lead?: string;
}) {
  return (
    <View>
      <Text style={s.h1Kicker}>SECAO {index}</Text>
      <Text style={s.h1}>{title}</Text>
      {lead && <Text style={s.sectionLead}>{lead}</Text>}
    </View>
  );
}

function InfoBox({ title, body }: { title: string; body: string }) {
  return (
    <View style={s.infoBox} wrap={false}>
      <Text style={s.infoBoxTitle}>{title}</Text>
      <Text style={s.infoBoxBody}>{body}</Text>
    </View>
  );
}

function KeyValueTable({
  headers,
  rows,
  widths,
}: {
  headers: [string, string] | [string, string, string];
  rows: Array<string[]>;
  widths: number[];
}) {
  return (
    <View style={s.table}>
      <View style={s.tableHeadRow}>
        {headers.map((h, i) => (
          <Text
            key={i}
            style={[s.tableHeadCell, { width: `${widths[i]}%` }]}
          >
            {h}
          </Text>
        ))}
      </View>
      {rows.map((row, i) => (
        <View
          key={i}
          style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}
          wrap={false}
        >
          {row.map((cell, j) => (
            <Text
              key={j}
              style={[
                j === 0 ? s.tableCellBold : s.tableCell,
                { width: `${widths[j]}%` },
              ]}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function PageFooter() {
  return (
    <View style={s.footer} fixed>
      <Text>Academia Digital · BSoft White Label · Passagem de Servico</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Pag. ${pageNumber} / ${totalPages}`
        }
      />
    </View>
  );
}

// ─── Document ─────────────────────────────────────────────────────────────

const today = new Date().toLocaleDateString("pt-PT", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function HandoverPdf() {
  return (
    <Document
      title="Passagem de Servico - Academia Digital"
      author="BSoft White Label"
      subject="Estado actual do projeto Academia Digital"
      creator="Academia Digital · DGERT compliant"
    >
      {/* ─────── Cover ─────── */}
      <Page size="A4" style={s.page}>
        <View style={s.coverWrap}>
          <Text style={s.coverKicker}>PASSAGEM DE SERVIÇO</Text>
          <Text style={s.coverTitle}>Academia Digital</Text>
          <Text style={s.coverSubtitle}>
            Plataforma SaaS multi-tenant de gestão de formação certificada DGERT
          </Text>

          <View style={{ marginTop: 24 }}>
            <View style={s.coverMetaRow}>
              <Text style={s.coverMetaLabel}>Cliente</Text>
              <Text style={s.coverMetaValue}>
                Grupo Oporto Forte Internacional
              </Text>
            </View>
            <View style={s.coverMetaRow}>
              <Text style={s.coverMetaLabel}>Modelo</Text>
              <Text style={s.coverMetaValue}>
                Joint Venture · BSoft × Oporto Forte
              </Text>
            </View>
            <View style={s.coverMetaRow}>
              <Text style={s.coverMetaLabel}>Documento</Text>
              <Text style={s.coverMetaValue}>{today}</Text>
            </View>
            <View style={s.coverMetaRow}>
              <Text style={s.coverMetaLabel}>Estado</Text>
              <Text style={s.coverMetaValue}>
                10 fases concluídas · 3 em standby · 4 a aguardar input externo
              </Text>
            </View>
          </View>
        </View>

        <Text style={s.coverFooter}>
          Documento gerado automaticamente a partir do estado actual do
          repositório · build verde · 50+ rotas activas em produção
        </Text>
      </Page>

      {/* ─────── 1. Sumário Executivo ─────── */}
      <Page size="A4" style={s.page}>
        <SectionTitle
          index="01"
          title="Sumário Executivo"
          lead="Academia Digital é uma plataforma SaaS white-label desenvolvida em Next.js 14 para gestão completa de formação profissional certificada DGERT em Portugal. Foi projetada desde o primeiro dia como multi-tenant — uma única instalação serve múltiplos clientes finais."
        />

        <Text style={s.h2}>Objetivo do projeto</Text>
        <Text style={s.p}>
          Digitalizar todo o ciclo de vida da formação certificada — desde a
          publicação do catálogo público até à emissão dos certificados DGERT —
          garantindo conformidade auditável em tempo real e reduzindo o trabalho
          administrativo manual.
        </Text>

        <Text style={s.h2}>Diferenciais entregues</Text>
        <Bullet>
          Multi-tenant nativo (path-based + subdomain + custom domain)
        </Bullet>
        <Bullet>
          Assinatura digital DGERT-compliant com audit trail e endpoint de
          invalidação
        </Bullet>
        <Bullet>
          Geração automática de PDFs DGERT (Folha de presenças, Ficha de
          inscrição, Ata de reunião, Dossier técnico-pedagógico completo)
        </Bullet>
        <Bullet>
          Portal self-service do formando com check-in QR e calendário próprio
        </Bullet>
        <Bullet>
          Notificações in-app contextuais por role — sem necessidade de tabela
          dedicada, sempre actualizadas
        </Bullet>
        <Bullet>
          Auth custom edge-compatible (jose JWT) sem dependência de NextAuth
        </Bullet>

        <PageFooter />
      </Page>

      {/* ─────── 2. Stack Técnico ─────── */}
      <Page size="A4" style={s.page}>
        <SectionTitle index="02" title="Stack Técnico" />

        <Text style={s.h3}>Frontend & runtime</Text>
        <KeyValueTable
          headers={["Camada", "Tecnologia"]}
          widths={[30, 70]}
          rows={[
            ["Framework", "Next.js 14.2.35 (App Router)"],
            ["Linguagem", "TypeScript 5"],
            [
              "Styling",
              "Tailwind CSS 3.4 + tokens custom (navy/gold/surface)",
            ],
            ["Componentes", "shadcn/ui · 18 primitives · lucide-react"],
            ["Estado client", "React Server Components + Zustand pontual"],
          ]}
        />

        <Text style={s.h3}>Backend & dados</Text>
        <KeyValueTable
          headers={["Camada", "Tecnologia"]}
          widths={[30, 70]}
          rows={[
            ["ORM", "Prisma 6.19 (NÃO Prisma 7 — sintaxe quebrou)"],
            [
              "Base de dados",
              "Supabase Postgres · us-west-2 · schema 'academia'",
            ],
            ["Connection", "Pooler URL transaction mode (porta 6543)"],
            ["Auth", "Custom · jose (JWT edge-compat) + bcryptjs"],
            ["E-mail", "Resend SDK · fallback console em dev"],
            ["PDFs", "@react-pdf/renderer (não Puppeteer)"],
            [
              "Assinatura",
              "react-signature-canvas + SHA hash (tamper detection)",
            ],
          ]}
        />

        <Text style={s.h3}>Infraestrutura</Text>
        <KeyValueTable
          headers={["Recurso", "Detalhe"]}
          widths={[30, 70]}
          rows={[
            ["Hosting", "Vercel · Hobby tier · região fra1"],
            ["Repositório", "github.com/bsoftwhitelabel/academiab2 (main)"],
            ["URL produção", "https://academiab2.vercel.app"],
            ["DB", "Supabase projecto ecqptnirekuiibhmnbaq"],
            ["CI/CD", "Auto-deploy via GitHub push para main"],
          ]}
        />

        <PageFooter />
      </Page>

      {/* ─────── 3. Etapas Concluídas ─────── */}
      <Page size="A4" style={s.page}>
        <SectionTitle
          index="03"
          title="Etapas Concluídas"
          lead="Foram entregues 5 fases principais cobrindo desde a fundação da plataforma até funcionalidades avançadas DGERT. Todas estão em produção (build verde · 44 rotas activas)."
        />

        <PhaseHead num="1" title="Fundação da plataforma" status="done" />
        <Bullet>
          Multi-tenant routing (path-based + subdomain + custom domain)
        </Bullet>
        <Bullet>
          Auth 3 roles (ADMIN/OWNER, TRAINER, TRAINEE) com JWT edge-compatible
        </Bullet>
        <Bullet>
          Schema Prisma com 14 modelos + isolamento &apos;academia&apos; no
          Supabase
        </Bullet>
        <Bullet>
          Login/logout, magic-link para formandos, sessões 7 dias
        </Bullet>
        <Bullet>
          Deploy Vercel com Pooler URL Supabase (resolveu falhas connection
          serverless)
        </Bullet>

        <PhaseHead
          num="2"
          title="Dashboards & navegação"
          status="done"
        />
        <Bullet>
          6 dashboards Prisma reais (admin, trainer, portal × 2 cada)
        </Bullet>
        <Bullet>
          14 placeholders ComingSoon para evitar 404s no sidebar
        </Bullet>
        <Bullet>
          18 componentes shell (CourseGridCard, StatCard, DashboardShell,
          NotificationBell, MobileBottomNav…)
        </Bullet>
        <Bullet>
          Catálogo público com filtros (área, modalidade, nível)
        </Bullet>

        <PhaseHead
          num="3.1-3.6"
          title="Páginas reais (substituição de placeholders)"
          status="done"
        />
        <Bullet>/admin/reports — relatórios executivos com queries reais</Bullet>
        <Bullet>
          /admin/settings — white-label (logo, cores, código DGERT)
        </Bullet>
        <Bullet>
          /admin/courses — listagem real + filtros + paginação (migrada de
          mock)
        </Bullet>
        <Bullet>
          /admin/courses/new e [slug]/edit — formulário criar/editar
        </Bullet>
        <Bullet>
          /portal/calendar, /portal/settings, /portal/profile, /portal/history
        </Bullet>
        <Bullet>
          /trainer/courses, /trainees, /trainers, /classes, /reports, /settings
        </Bullet>

        <PageFooter />
      </Page>

      {/* ─────── 3. Etapas Concluídas (cont) ─────── */}
      <Page size="A4" style={s.page}>
        <Text style={s.h1Kicker}>SECAO 03 (CONT.)</Text>
        <Text style={s.h1}>Etapas Concluídas</Text>

        <PhaseHead
          num="4.4"
          title="Dossier técnico-pedagógico DGERT"
          status="done"
        />
        <Bullet>
          PDF agrupado de 5 páginas: capa + programa + formadores + formandos +
          sessões
        </Bullet>
        <Bullet>
          Endpoint /api/pdf/dossie-dgert/[trainingActionId] com auth + tenant
          boundary
        </Bullet>
        <Bullet>
          Inclui taxa de presença, horas atendidas, assinaturas, módulos
          curriculares
        </Bullet>
        <Bullet>
          Botão de download em cada turma da página /trainer/sessions
        </Bullet>

        <PhaseHead
          num="4.5"
          title="Notificações in-app"
          status="done"
        />
        <Bullet>
          Sino no topbar com badge de contagem e estado urgente (vermelho)
        </Bullet>
        <Bullet>
          Notificações derivadas de Prisma — sem nova tabela, sempre actualizadas
        </Bullet>
        <Bullet>
          Trainee: sessões em &lt;24h + assinaturas pendentes
        </Bullet>
        <Bullet>
          Trainer: sessões em &lt;24h com #formandos esperados
        </Bullet>
        <Bullet>
          Admin: turmas a terminar em &lt;7d + novas inscrições &lt;24h
        </Bullet>

        <PhaseHead
          num="4.6"
          title="Invalidação de assinaturas DGERT"
          status="done"
        />
        <Bullet>
          POST /api/signatures/[attendanceId]/invalidate (auth + tenant + role)
        </Bullet>
        <Bullet>
          Permitido para ADMIN/OWNER ou TRAINER assignado à turma
        </Bullet>
        <Bullet>
          Requer motivo obrigatório · audit no campo postClassReason
        </Bullet>
        <Bullet>
          /admin/signatures — auditoria com filtros + estatísticas + botão
          invalidar
        </Bullet>

        <PhaseHead num="Extra" title="Performance & UX" status="done" />
        <Bullet>
          loading.tsx em /admin, /trainer, /portal (skeleton instantâneo)
        </Bullet>
        <Bullet>experimental.staleTimes 30s/180s para cache RSC</Bullet>
        <Bullet>
          Admin agora aterra em /admin/dashboard após login (era /courses)
        </Bullet>
        <Bullet>
          Bug crítico resolvido: middleware passa sessão via headers (eliminou
          redirect-loop em pages com getSession)
        </Bullet>

        <PageFooter />
      </Page>

      {/* ─────── 3 (cont). Sprint mais recente ─────── */}
      <Page size="A4" style={s.page}>
        <Text style={s.h1Kicker}>SECAO 03 (CONT.)</Text>
        <Text style={s.h1}>Etapas Concluídas — sprint mais recente</Text>

        <PhaseHead num="4.1" title="Custom domain (UI)" status="done" />
        <Bullet>
          /admin/settings → aba Domínio com input + validação (formato + uniqueness)
        </Bullet>
        <Bullet>
          Server action updateTenantDomain persiste em tenant.domain
        </Bullet>
        <Bullet>
          Botão Copiar valor CNAME · passos numerados para ativação
        </Bullet>
        <Bullet>
          Middleware já resolvia custom domains automaticamente — UI agora persiste
        </Bullet>

        <PhaseHead num="4.2" title="Captação leads workshops" status="done" />
        <Bullet>
          /catalog/workshops#contact: form completo (nome, email, empresa,
          telefone, dimensão, programa, mensagem)
        </Bullet>
        <Bullet>
          Server action submitWorkshopLead com validação + email HTML rico
        </Bullet>
        <Bullet>
          Fallback console em dev (RESEND_API_KEY ausente) · pronto para produção
        </Bullet>

        <PhaseHead num="4.3" title="Onboarding wizard" status="done" />
        <Bullet>
          /onboarding (público) com 3 passos: dados pessoais · empresa · confirmação
        </Bullet>
        <Bullet>
          Cria User + Trainee + (opcional) Entity novo · envia magic-link
        </Bullet>
        <Bullet>
          Empresas novas ficam isActive=false · admin valida em /admin/entities
        </Bullet>

        <PhaseHead num="A" title="Admin entity approval" status="done" />
        <Bullet>
          /admin/entities com filtros (pendentes/ativas/todas)
        </Bullet>
        <Bullet>
          Server actions approveEntity + rejectEntity (com motivo · audit trail)
        </Bullet>
        <Bullet>
          Notificação no sino quando há empresas pendentes
        </Bullet>

        <PhaseHead num="B" title="Catalog público real" status="done" />
        <Bullet>
          /catalog: lista cursos isPublic+ACTIVE com filtros area+search via Prisma
        </Bullet>
        <Bullet>
          /catalog/[slug]: course + modules + upcoming editions + related (todos reais)
        </Bullet>
        <Bullet>
          CTA "Inscrever-me" agora aponta para /onboarding (fecha o ciclo)
        </Bullet>

        <PhaseHead num="C" title="PDFs DGERT reais" status="done" />
        <Bullet>
          /api/pdf/ficha-inscricao/[traineeId]: trainee + tenant + último enrollment
        </Bullet>
        <Bullet>
          /api/pdf/folha-presencas/[sessionId]: trainees inscritos + status real
        </Bullet>
        <Bullet>
          /api/pdf/ata-reuniao/[trainingActionId]: métricas reais (sessões, attendance)
        </Bullet>

        <PhaseHead num="5.x" title="Billing preview" status="done" />
        <Bullet>
          /admin/billing com 4 plan tiers + usage real-time
        </Bullet>
        <Bullet>
          getTenantUsage() de Prisma · getTenantPlan() lê tier de tenant.settings JSON
        </Bullet>
        <Bullet>
          Sem migration ainda — Stripe Connect entra após sign-off comercial
        </Bullet>

        <PageFooter />
      </Page>

      {/* ─────── 4. Etapas Pendentes ─────── */}
      <Page size="A4" style={s.page}>
        <SectionTitle
          index="04"
          title="Etapas em Standby & Bloqueadas"
          lead="As fases 3.7/3.8/3.9 foram colocadas em STANDBY a pedido do cliente. As restantes aguardam input externo (DNS, conteúdo, regras comerciais)."
        />

        <PhaseHead
          num="3.7"
          title="Cron certificados pós-turma"
          status="pending"
        />
        <Text style={s.pMuted}>
          Geração e envio automático de certificado DGERT por e-mail quando uma
          turma muda para status COMPLETED. STANDBY a pedido do cliente.
        </Text>
        <BulletStrong
          label="Standby"
          body="Despriorizado nesta sprint · depende de 3.9"
        />
        <BulletStrong
          label="Plano técnico"
          body="Cron Vercel diário (vercel.json) → query trainingAction.status=COMPLETED não certificada → renderiza PDF → envia via Resend → marca certificate.deliveredAt"
        />

        <PhaseHead
          num="3.8"
          title="Cloudflare R2 (storage assinaturas)"
          status="pending"
        />
        <Text style={s.pMuted}>
          Atualmente as assinaturas digitais ficam em memória (datauri PNG).
          Para produção real precisam ser persistidas em object storage. STANDBY
          a pedido do cliente.
        </Text>
        <BulletStrong
          label="Standby"
          body="Despriorizado nesta sprint"
        />
        <BulletStrong
          label="Plano técnico"
          body="@aws-sdk/client-s3 (R2 é S3-compatible) → upload PNG no checkin → guardar imageUrl no Signature.imageUrl"
        />

        <PhaseHead
          num="3.9"
          title="Resend API + DNS verification"
          status="pending"
        />
        <Text style={s.pMuted}>
          Magic-links de formando dependem de envio real de e-mail. Em
          desenvolvimento são impressos no console. STANDBY a pedido do cliente.
        </Text>
        <BulletStrong
          label="Standby"
          body="Despriorizado nesta sprint"
        />
        <BulletStrong
          label="Plano técnico"
          body="RESEND_API_KEY no Vercel → registar domínio → ajustar from address em src/lib/auth/email.ts"
        />

        <PageFooter />
      </Page>

      {/* ─────── 4. Etapas Pendentes (cont) ─────── */}
      <Page size="A4" style={s.page}>
        <Text style={s.h1Kicker}>SECAO 04 (CONT.)</Text>
        <Text style={s.h1}>Etapas Pendentes — bloqueios externos</Text>

        <PhaseHead
          num="4.1"
          title="Custom domain — ativação DNS"
          status="blocked"
        />
        <Text style={s.pMuted}>
          Cada cliente final terá o seu domínio próprio (ex.:
          formacao.oportoforte.com) servido pela mesma instância Vercel.
        </Text>
        <BulletStrong
          label="Bloqueio externo"
          body="Acesso ao DNS da Oporto Forte (precisa Nadja Ferreira)"
        />
        <BulletStrong
          label="Plano técnico"
          body="Adicionar domínio no Vercel → CNAME → setting tenant.domain no Postgres → middleware já está pronto para resolver"
        />
        <BulletStrong
          label="Esforço estimado"
          body="1-2 horas após DNS configurado"
        />

        <PhaseHead
          num="4.2"
          title="Workshops — conteúdo final (40 reais)"
          status="blocked"
        />
        <Text style={s.pMuted}>
          A landing /catalog/workshops e o formulário de leads já estão LIVE
          com mock content. Falta substituir o mock por 40 workshops reais.
        </Text>
        <BulletStrong
          label="Bloqueio externo"
          body="Conteúdo Nadja: nome, descrição, duração, formador, preço por workshop"
        />
        <BulletStrong
          label="Como aplicar"
          body="Editar src/lib/workshops-data.ts → substituir os 9 blocks/40 workshops → commit + deploy. Forma é trivial, só falta input."
        />

        <PhaseHead
          num="5.x final"
          title="Faturação Stripe Connect"
          status="blocked"
        />
        <Text style={s.pMuted}>
          O preview /admin/billing está pronto com 4 plan tiers e usage real.
          Falta integrar pagamentos reais e split JV.
        </Text>
        <BulletStrong
          label="Bloqueio externo"
          body="Regras comerciais BSoft × Oporto Forte (split %, planos finais, ciclo de fatura)"
        />
        <BulletStrong
          label="Plano técnico"
          body="Schema TenantPlan + UsageCounter → integração Stripe Connect (split payments) → webhook → painel /admin/billing já existe"
        />
        <BulletStrong
          label="Esforço estimado"
          body="1-2 semanas após regras definidas"
        />

        <PhaseHead
          num="—"
          title="Migrar /trainer/sessions/[id]/attendance de mock"
          status="pending"
        />
        <Text style={s.pMuted}>
          Página crítica do trainer (~32 kB) ainda usa MOCK_ATTENDANCE_SESSION.
          Próximo grande deliverable interno.
        </Text>
        <BulletStrong
          label="Esforço estimado"
          body="2-3 dias (página mais complexa do projeto)"
        />

        <PageFooter />
      </Page>

      {/* ─────── 5. Acessos & Credenciais ─────── */}
      <Page size="A4" style={s.page}>
        <SectionTitle
          index="05"
          title="Acessos & Credenciais"
          lead="AVISO DE SEGURANÇA: Estes acessos são de demo/desenvolvimento. Devem ser rotacionados antes do go-live em produção real com clientes finais."
        />

        <Text style={s.h3}>URLs do projecto</Text>
        <KeyValueTable
          headers={["Recurso", "URL"]}
          widths={[30, 70]}
          rows={[
            ["Aplicação produção", "https://academiab2.vercel.app"],
            [
              "Repositório GitHub",
              "github.com/bsoftwhitelabel/academiab2",
            ],
            ["Vercel dashboard", "vercel.com/dashboard (academiab2)"],
            [
              "Supabase dashboard",
              "supabase.com/dashboard/project/ecqptnirekuiibhmnbaq",
            ],
            [
              "Excel mapping",
              "Mapa-Sistema-Academia-Digital-v2.xlsx",
            ],
            [
              "Google Sheet",
              "docs.google.com/.../1ziww0xVZm8mJSfOomWWHHD7fvGquUQMqHTsNDQoMP7M",
            ],
          ]}
        />

        <Text style={s.h3}>Credenciais demo (rotacionar!)</Text>
        <KeyValueTable
          headers={["Role", "E-mail", "Password / fluxo"]}
          widths={[20, 50, 30]}
          rows={[
            ["ADMIN", "admin@oportoforte.pt", "Admin@2026"],
            [
              "TRAINER",
              "ricardo.santos@oportoforte.pt",
              "Trainer@2026",
            ],
            [
              "TRAINEE",
              "maryluz.oliveira@oportoforte.pt",
              "Magic-link",
            ],
          ]}
        />

        <Text style={s.h3}>Variáveis de ambiente Vercel</Text>
        <Text style={s.pMuted}>
          Configurar em Production scope. Falta apenas RESEND_API_KEY e R2_*.
        </Text>
        <Bullet>
          DATABASE_URL — Supabase Pooler URL (porta 6543, pgbouncer=true,
          schema=academia)
        </Bullet>
        <Bullet>
          DIRECT_URL — Supabase direct connection (apenas migrations, porta
          5432)
        </Bullet>
        <Bullet>
          AUTH_SECRET — string aleatória 32+ chars (openssl rand -base64 32)
        </Bullet>
        <Bullet>
          NEXT_PUBLIC_BASE_DOMAIN — domínio base (ex.: academia.bsoft.io)
        </Bullet>
        <Bullet>
          NEXT_PUBLIC_DEFAULT_TENANT_SLUG — slug default (oportoforte)
        </Bullet>
        <Bullet>RESEND_API_KEY — pendente</Bullet>
        <Bullet>
          R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT —
          pendentes
        </Bullet>

        <PageFooter />
      </Page>

      {/* ─────── 6. Lições aprendidas ─────── */}
      <Page size="A4" style={s.page}>
        <SectionTitle
          index="06"
          title="Lições Aprendidas e Pontos de Atenção"
          lead="Bugs e armadilhas resolvidos durante o desenvolvimento que merecem atenção em manutenção futura."
        />

        <InfoBox
          title="Prisma 7 quebra a sintaxe"
          body={
            "A versão 7 do Prisma alterou a sintaxe de datasource. NÃO atualizar — manter na versão 6.19.x. Se aparecer erro 'url = env(...) no longer supported', voltar a Prisma 6."
          }
        />

        <InfoBox
          title="Supabase pooler URL é mandatório"
          body={
            "Direct connection (porta 5432) falha em ambiente serverless Vercel. Usar SEMPRE Pooler URL: postgres.PROJECT_REF:PWD@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=academia&connection_limit=1. Username DEVE ser postgres.PROJECT_REF (com ponto e ID), não apenas postgres."
          }
        />

        <InfoBox
          title="Server/Client component boundaries"
          body={
            "Lucide icons são forwardRef — não podem ser passados como props de Server para Client Component. Solução adoptada: ITEMS map definido DENTRO do Client Component; Server passa apenas role + slug. Sintoma do erro: 'Functions cannot be passed directly to Client Components'."
          }
        />

        <InfoBox
          title="getSession no Node runtime falhava"
          body={
            "Bug crítico: middleware (Edge) validava JWT mas getSession() em Server Components (Node) retornava null. Solução: middleware anexa session aos request headers (x-session-*); getSession lê headers primeiro, com fallback ao cookie. Referência: src/middleware.ts e src/lib/auth/session.ts."
          }
        />

        <InfoBox
          title="PDF não pode usar Puppeteer em serverless"
          body={
            "Puppeteer/Chromium incompatível com Vercel Serverless Functions (>50MB). Solução: @react-pdf/renderer (puro JS, declarativo, mantém estilo DGERT). Tipografia limitada — usar fonts built-in (Helvetica) ou registar custom."
          }
        />

        <PageFooter />
      </Page>

      {/* ─────── 7. Próximos passos ─────── */}
      <Page size="A4" style={s.page}>
        <SectionTitle
          index="07"
          title="Próximos Passos Recomendados"
          lead="Ordem sugerida para destravar entregas pendentes, priorizando o que oferece maior valor comercial com menor esforço."
        />

        <Text style={s.h3}>Curto prazo (próximas 2 semanas)</Text>
        <BulletStrong
          label="Resend API + DNS (Fase 3.9)"
          body="destrava magic-links em produção e Fase 3.7"
        />
        <BulletStrong
          label="Custom domain Oporto Forte (Fase 4.1)"
          body="elemento white-label crítico para go-live"
        />
        <BulletStrong
          label="Catálogo Workshops Saúde Mental (Fase 4.2)"
          body="produto mais urgente da Nadja, alavanca venda directa"
        />

        <Text style={s.h3}>Médio prazo (mês 1)</Text>
        <BulletStrong
          label="Cloudflare R2 (Fase 3.8)"
          body="persistir assinaturas — sem isto, restart serverless perde dados"
        />
        <BulletStrong
          label="Cron certificados (Fase 3.7)"
          body="automatizar entrega DGERT pós-turma"
        />
        <BulletStrong
          label="Onboarding flow (Fase 4.3)"
          body="essencial para escalar inscrições self-service"
        />

        <Text style={s.h3}>Médio-longo prazo (mês 2-3)</Text>
        <BulletStrong
          label="Faturação multi-tenant (Fase 5.x)"
          body="monetizar a plataforma — exige decisões comerciais BSoft × Oporto Forte"
        />
        <BulletStrong
          label="Auditoria DGERT extra"
          body="exportação completa para inspeções (queue + ZIP)"
        />
        <BulletStrong
          label="App mobile dedicada"
          body="atualmente PWA-friendly; futuro nativo se demanda crescer"
        />

        <Text style={s.h2}>Como executar uma entrega</Text>
        <Bullet>Criar branch a partir de main (ex.: feat/resend)</Bullet>
        <Bullet>
          Implementar — código está em src/app, src/components, src/lib
        </Bullet>
        <Bullet>
          Testar localmente com &apos;npm run dev&apos; (Supabase remoto via
          Pooler URL)
        </Bullet>
        <Bullet>
          &apos;npm run build&apos; — Vercel faz o mesmo no deploy
        </Bullet>
        <Bullet>
          Push para main → Vercel auto-deploy ~2 minutos
        </Bullet>
        <Bullet>
          Verificar https://academiab2.vercel.app + monitorar Vercel logs
        </Bullet>

        <PageFooter />
      </Page>
    </Document>
  );
}

// ─── Output ───────────────────────────────────────────────────────────────

const outDir = path.resolve(__dirname, "..", "..");
const outPath = path.join(outDir, "Passagem-Servico-Academia-Digital.pdf");

(async () => {
  await renderToFile(<HandoverPdf />, outPath);
  const stat = fs.statSync(outPath);
  console.log("OK: " + outPath);
  console.log("Bytes: " + stat.size);
})();
