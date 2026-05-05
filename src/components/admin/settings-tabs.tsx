"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Palette,
  Globe,
  Mail,
  Plug,
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateTenantDomain } from "@/app/[tenantSlug]/admin/settings/actions";

type TenantSettings = {
  slug: string;
  name: string;
  domain: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  dgertCode: string | null;
};

type Props = { tenant: TenantSettings };

const TABS = [
  { id: "branding", label: "Branding", icon: Palette },
  { id: "domain", label: "Domínio", icon: Globe },
  { id: "email", label: "Email & SMTP", icon: Mail },
  { id: "integrations", label: "Integrações", icon: Plug },
  { id: "dgert", label: "DGERT", icon: ShieldCheck },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsTabs({ tenant }: Props) {
  const [active, setActive] = useState<TabId>("branding");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success("Configurações guardadas (demo)", {
      description:
        "Em produção, persiste no Tenant model · invalida cache CDN · recarrega tema.",
    });
  };

  return (
    <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">
      {/* tabs */}
      <div className="rounded-xl border border-border bg-card p-1.5">
        <div className="grid grid-cols-2 gap-1 lg:grid-cols-5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition-all",
                  isActive
                    ? "bg-navy text-white shadow-card-elevated"
                    : "text-ink-muted hover:bg-surface-low hover:text-navy"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {active === "branding" && <BrandingTab tenant={tenant} />}
      {active === "email" && <EmailTab />}
      {active === "integrations" && <IntegrationsTab />}
      {active === "dgert" && <DgertTab tenant={tenant} />}
    </form>
  );
}

/**
 * Wrapper to render Domain tab outside the global demo form
 * (it has its own server-action form + save button).
 */
export function SettingsTabsWithDomain({ tenant }: Props) {
  const [active, setActive] = useState<TabId>("branding");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success("Configurações guardadas (demo)", {
      description:
        "Em produção, persiste no Tenant model · invalida cache CDN · recarrega tema.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-1.5">
        <div className="grid grid-cols-2 gap-1 lg:grid-cols-5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition-all",
                  isActive
                    ? "bg-navy text-white shadow-card-elevated"
                    : "text-ink-muted hover:bg-surface-low hover:text-navy"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {active === "domain" ? (
        <DomainTab tenant={tenant} />
      ) : (
        <form
          id="settings-form"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {active === "branding" && <BrandingTab tenant={tenant} />}
          {active === "email" && <EmailTab />}
          {active === "integrations" && <IntegrationsTab />}
          {active === "dgert" && <DgertTab tenant={tenant} />}
        </form>
      )}
    </div>
  );
}

// ─── Branding tab ─────────────────────────────────────────────────────────
function BrandingTab({ tenant }: { tenant: TenantSettings }) {
  const [primary, setPrimary] = useState(tenant.primaryColor ?? "#0B2447");
  const [accent, setAccent] = useState(tenant.accentColor ?? "#CCA823");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Section title="Logo" description="Recomendado: PNG transparente, mínimo 240×64px, máximo 2MB.">
          <div className="flex items-start gap-4">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl border-2 border-dashed border-border bg-surface-low/40">
              {tenant.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.logoUrl} alt="logo" className="max-h-20 max-w-20 object-contain" />
              ) : (
                <Upload className="h-6 w-6 text-ink-faint" />
              )}
            </div>
            <div className="flex-1">
              <input
                type="url"
                name="logoUrl"
                placeholder="https://..."
                defaultValue={tenant.logoUrl ?? ""}
                className="form-input"
              />
              <p className="mt-2 text-[11px] text-ink-subtle">
                Cole a URL pública do logo · upload direto via Cloudflare R2 em breve.
              </p>
            </div>
          </div>
        </Section>

        <Section
          title="Paleta de cores"
          description="Aplicada em buttons, badges, links, gradientes do hero. Atualiza CDN cache automaticamente."
        >
          <div className="grid grid-cols-2 gap-4">
            <ColorField label="Cor primária" name="primaryColor" value={primary} onChange={setPrimary} />
            <ColorField label="Cor de acento" name="accentColor" value={accent} onChange={setAccent} />
          </div>
        </Section>

        <Section title="Tipografia" description="A fonte do tenant. Pode usar qualquer Google Font.">
          <select name="fontFamily" defaultValue="Inter" className="form-input">
            <option value="Inter">Inter (default)</option>
            <option value="Manrope">Manrope</option>
            <option value="DM Sans">DM Sans</option>
            <option value="IBM Plex Sans">IBM Plex Sans</option>
            <option value="Roboto">Roboto</option>
          </select>
        </Section>
      </div>

      {/* preview card */}
      <aside className="lg:col-span-1">
        <div className="sticky top-6 rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
            Pré-visualização
          </h3>
          <div
            className="rounded-xl p-5 text-white"
            style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}DD 100%)` }}
          >
            <span
              className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{ backgroundColor: accent, color: primary }}
            >
              Certificação
            </span>
            <h4 className="text-lg font-bold leading-tight">{tenant.name}</h4>
            <p className="mt-1 text-xs opacity-80">Plataforma white-label DGERT</p>
            <button
              type="button"
              className="mt-4 rounded-md px-3 py-1.5 text-xs font-bold"
              style={{ backgroundColor: accent, color: primary }}
            >
              Ver Catálogo →
            </button>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
            Esta é a aparência que o teu cliente vê no hero do catálogo público.
          </p>
        </div>
      </aside>
    </div>
  );
}

// ─── Domain tab ───────────────────────────────────────────────────────────
function DomainTab({ tenant }: { tenant: TenantSettings }) {
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState(tenant.domain ?? "");
  const initial = tenant.domain ?? "";
  const dirty = draft.trim() !== initial;
  const subdomain = draft.split(".")[0] || "subdomain";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateTenantDomain(fd);
      if (res.ok) {
        toast.success(res.message ?? "Guardado.");
      } else {
        toast.error(res.error);
      }
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copiado`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section
        title="URL atual"
        description="É a URL onde os teus clientes acedem hoje."
      >
        <div className="rounded-lg border border-border bg-surface-low/40 p-4 font-mono text-sm text-navy">
          https://academiab2.vercel.app/<strong className="text-gold-700">{tenant.slug}</strong>/catalog
        </div>
        {tenant.domain && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200/60">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Domínio guardado: <span className="font-mono">{tenant.domain}</span>
          </div>
        )}
      </Section>

      <Section
        title="Domínio personalizado"
        description="Aponta um domínio teu (ex: formacao.oportoforte.com) para o tenant. SSL via Vercel."
      >
        <input
          type="text"
          name="domain"
          placeholder="formacao.oportoforte.com"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="form-input font-mono"
          disabled={pending}
        />
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/40 p-4">
          <h4 className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-blue-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            Passos para ativar
          </h4>
          <ol className="ml-4 list-decimal space-y-1 text-xs leading-relaxed text-ink-muted">
            <li>Guarda o domínio aqui em baixo (cria registo DB).</li>
            <li>
              Adiciona o domínio no painel Vercel (
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener"
                className="font-bold text-blue-700 hover:underline"
              >
                Project Settings → Domains
              </a>
              ).
            </li>
            <li>Configura o registo DNS abaixo no teu registrar (Cloudflare, GoDaddy, etc.).</li>
            <li>Aguarda propagação DNS (5min — 24h) e verifica em Vercel.</li>
          </ol>
          <p className="mt-3 mb-2 text-xs leading-relaxed text-ink-muted">
            Registo DNS necessário (1 CNAME):
          </p>
          <table className="w-full text-xs">
            <thead className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
              <tr className="text-left">
                <th className="py-1">Type</th>
                <th>Name</th>
                <th>Value</th>
                <th>TTL</th>
                <th className="text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="font-mono text-ink-muted">
              <tr>
                <td className="py-1">CNAME</td>
                <td>{subdomain}</td>
                <td>cname.vercel-dns.com</td>
                <td>3600</td>
                <td className="py-1 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard("cname.vercel-dns.com", "Valor CNAME")
                    }
                    className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 hover:bg-blue-200"
                  >
                    <Copy className="h-2.5 w-2.5" />
                    Copiar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          {dirty && (
            <button
              type="button"
              onClick={() => setDraft(initial)}
              disabled={pending}
              className="rounded-md border border-border bg-card px-4 py-2 text-xs font-bold text-ink-muted transition-colors hover:bg-surface-low"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={!dirty || pending}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
              dirty && !pending
                ? "bg-navy text-white hover:bg-navy/90"
                : "cursor-not-allowed bg-surface-mid text-ink-faint"
            )}
          >
            {pending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                A guardar…
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Guardar domínio
              </>
            )}
          </button>
        </div>
      </Section>

      <Section
        title="Como funciona o multi-tenant"
        description="O middleware da app já está pronto para resolver custom domains automaticamente."
      >
        <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface-low/40 p-3">
            <p className="mb-1 font-bold text-navy">Path-based</p>
            <p className="font-mono text-ink-muted">/oportoforte/catalog</p>
            <p className="mt-1 text-[10px] text-ink-subtle">
              Acesso direto via slug.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-low/40 p-3">
            <p className="mb-1 font-bold text-navy">Subdomain</p>
            <p className="font-mono text-ink-muted">
              oportoforte.academia.bsoft.io
            </p>
            <p className="mt-1 text-[10px] text-ink-subtle">
              Wildcard CNAME automático.
            </p>
          </div>
          <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50/40 p-3 ring-1 ring-emerald-200/60">
            <p className="mb-1 font-bold text-emerald-700">
              Custom domain ✓ esta aba
            </p>
            <p className="font-mono text-ink-muted">
              formacao.oportoforte.com
            </p>
            <p className="mt-1 text-[10px] text-ink-subtle">
              White-label completo.
            </p>
          </div>
        </div>
      </Section>
    </form>
  );
}

// ─── Email tab ─────────────────────────────────────────────────────────────
function EmailTab() {
  return (
    <div className="space-y-6">
      <Section title="Provider" description="O serviço usado para enviar magic-links e notificações.">
        <select name="emailProvider" defaultValue="resend" className="form-input">
          <option value="resend">Resend (recomendado)</option>
          <option value="sendgrid">SendGrid</option>
          <option value="postmark">Postmark</option>
          <option value="smtp">SMTP custom</option>
        </select>
      </Section>

      <Section title="API Key" description="Chave do provider · armazenada encriptada · só admins veem mascarada.">
        <input
          type="password"
          name="emailApiKey"
          placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
          className="form-input font-mono"
        />
      </Section>

      <Section title="Sender" description="Quem aparece como remetente nos emails.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Nome">
            <input
              type="text"
              name="emailFromName"
              defaultValue="Academia Digital"
              className="form-input"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              name="emailFromAddress"
              placeholder="noreply@bsoft.io"
              className="form-input font-mono"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="DNS verification (SPF/DKIM)"
        description="Sem isto os emails caem em spam. O Resend gera os registos automaticamente após adicionar o domínio no dashboard deles."
      >
        <div className="grid grid-cols-3 gap-3 text-center">
          <Pill state="error" label="SPF" />
          <Pill state="error" label="DKIM" />
          <Pill state="error" label="DMARC" />
        </div>
        <a
          href="https://resend.com/domains"
          target="_blank"
          rel="noopener"
          className="mt-3 inline-block text-xs font-bold text-blue-600 hover:text-navy"
        >
          Configurar no Resend →
        </a>
      </Section>
    </div>
  );
}

// ─── Integrations tab ──────────────────────────────────────────────────────
function IntegrationsTab() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <IntegrationCard
        name="Cloudflare R2"
        description="Storage para assinaturas digitais · PDFs gerados · uploads de logos."
        status="off"
        category="Storage"
      />
      <IntegrationCard
        name="Resend"
        description="Email transacional · magic-links · notificações de sessão."
        status="off"
        category="Email"
      />
      <IntegrationCard
        name="Google Calendar"
        description="Sincronização bidirecional · cada formando vê sessões no calendário pessoal."
        status="off"
        category="Calendário"
      />
      <IntegrationCard
        name="Microsoft Outlook"
        description="Sincronização bidirecional · alternativa ao Google Calendar."
        status="off"
        category="Calendário"
      />
      <IntegrationCard
        name="WhatsApp Business API"
        description="Lembretes 24h e 2h antes da sessão · canal preferido em PT/BR."
        status="off"
        category="Notificações"
      />
      <IntegrationCard
        name="HubSpot CRM"
        description="Sincroniza inscrições e leads do catálogo público."
        status="off"
        category="CRM"
      />
      <IntegrationCard
        name="Vendus"
        description="Sistema de faturação português · emite recibos automaticamente."
        status="off"
        category="Faturação"
      />
      <IntegrationCard
        name="Moodle v4"
        description="LMS para cursos e-learning · sync de utilizadores e progresso."
        status="off"
        category="LMS"
      />
    </div>
  );
}

// ─── DGERT tab ─────────────────────────────────────────────────────────────
function DgertTab({ tenant }: { tenant: TenantSettings }) {
  return (
    <div className="space-y-6">
      <Section
        title="Código de entidade"
        description="O código atribuído pela DGERT à tua organização. Aparece em todos os documentos PDF."
      >
        <input
          type="text"
          name="dgertCode"
          placeholder="20255"
          defaultValue={tenant.dgertCode ?? ""}
          className="form-input font-mono"
        />
      </Section>

      <Section
        title="Áreas certificadas"
        description="Códigos CITE/DGERT em que a tua entidade está certificada."
      >
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {[
            "729 Saúde",
            "345 Gestão",
            "482 Tecnologia",
            "346 RH",
            "211 Design",
            "862 Segurança",
            "145 Formadores",
            "347 Trabalho",
            "380 Direito",
            "581 Construção",
            "851 Ambiente",
            "462 Marketing",
          ].map((a) => (
            <label
              key={a}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-low/40 px-3 py-2 text-xs font-medium hover:bg-surface-low"
            >
              <input
                type="checkbox"
                defaultChecked
                className="h-3.5 w-3.5 accent-navy"
              />
              <span className="text-navy">{a}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section
        title="Política de assinatura"
        description="Quando o formador pode habilitar a assinatura digital do formando."
      >
        <select name="signaturePolicy" defaultValue="end" className="form-input">
          <option value="end">No final da sessão (DGERT recomendado)</option>
          <option value="any">A qualquer momento durante a sessão</option>
          <option value="manual">Apenas mediante autorização escrita</option>
        </select>
      </Section>
    </div>
  );
}

// ─── helpers ───────────────────────────────────────────────────────────────
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-base font-bold text-navy">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-ink-muted">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">
        {label}
      </span>
      {children}
    </label>
  );
}

function ColorField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-lg border border-border"
          aria-label={`${label} swatch`}
        />
        <input
          type="text"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="form-input flex-1 font-mono"
        />
      </div>
    </Field>
  );
}

function IntegrationCard({
  name,
  description,
  status,
  category,
}: {
  name: string;
  description: string;
  status: "on" | "off";
  category: string;
}) {
  return (
    <article
      className={cn(
        "flex items-start gap-4 rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5",
        status === "on" ? "border-emerald-300/60 ring-1 ring-emerald-200/60" : "border-border"
      )}
    >
      <div
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1",
          status === "on"
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
            : "bg-surface-low text-ink-muted ring-border"
        )}
      >
        <Plug className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-navy">{name}</h4>
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-subtle">
              {category}
            </p>
          </div>
          <Pill state={status === "on" ? "success" : "neutral"} label={status === "on" ? "Ativo" : "Inativo"} />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">{description}</p>
        <button
          type="button"
          className="mt-3 text-xs font-bold text-blue-600 hover:text-navy"
        >
          {status === "on" ? "Configurar →" : "Ativar →"}
        </button>
      </div>
    </article>
  );
}

function Pill({
  state,
  label,
}: {
  state: "success" | "error" | "neutral";
  label: string;
}) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
    error: "bg-red-50 text-red-700 ring-red-200/60",
    neutral: "bg-slate-100 text-slate-600 ring-slate-200/60",
  };
  const Icon = state === "success" ? CheckCircle2 : state === "error" ? AlertCircle : null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1",
        styles[state]
      )}
    >
      {Icon && <Icon className="h-3 w-3" strokeWidth={2.75} />}
      {label}
    </span>
  );
}
