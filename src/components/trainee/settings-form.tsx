"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Download,
  Trash2,
  Mail,
  Lock,
  Globe,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  updateTraineeSettings,
  requestDataExport,
  requestAccountDeletion,
} from "@/app/[tenantSlug]/portal/settings/actions";

type Initial = {
  fullName: string;
  preferredName: string;
  email: string;
  phone: string;
  documentNumber: string;
  taxId: string;
  birthDate: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  profession: string;
  qualification: string;
  entityName: string;
  emailVerified: boolean;
};

export function TraineeSettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [consentResearch, setConsentResearch] = useState(true);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateTraineeSettings(fd);
      if (res.ok) {
        toast.success(res.message ?? "Dados guardados.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleExportData = () => {
    startTransition(async () => {
      const res = await requestDataExport();
      if (res.ok) {
        toast.info("Exportação RGPD iniciada", {
          description: res.message,
        });
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        "Confirmar pedido de eliminação? Os seus dados serão anonimizados em 30 dias (período de grace para auditoria DGERT)."
      )
    ) {
      startTransition(async () => {
        const res = await requestAccountDeletion();
        if (res.ok) {
          toast.error("Pedido de eliminação registado", {
            description: res.message,
          });
        } else {
          toast.error(res.error);
        }
      });
    }
  };

  return (
    <form
      id="trainee-settings-form"
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Identification */}
      <Section
        title="Identificação"
        description="Dados usados para emissão de certificados DGERT · obrigatórios SIGO"
      >
        <Grid>
          <Field label="Nome completo" required className="md:col-span-2">
            <input
              required
              name="fullName"
              defaultValue={initial.fullName}
              className="form-input"
            />
          </Field>
          <Field label="Nome preferido (opcional)">
            <input
              name="preferredName"
              defaultValue={initial.preferredName}
              placeholder="Como gosta de ser chamado(a)"
              className="form-input"
            />
          </Field>
          <Field label="Data de nascimento">
            <input
              type="date"
              name="birthDate"
              defaultValue={initial.birthDate}
              className="form-input"
            />
          </Field>
          <Field label="Número de identificação (CC)">
            <input
              name="documentNumber"
              defaultValue={initial.documentNumber}
              placeholder="Ex: 12345678 9 ZZ0"
              className="form-input font-mono"
            />
          </Field>
          <Field label="NIF">
            <input
              name="taxId"
              defaultValue={initial.taxId}
              placeholder="500 000 000"
              className="form-input font-mono"
            />
          </Field>
          <Field label="Empresa">
            <input
              disabled
              value={initial.entityName}
              className="form-input bg-surface-low/40 text-ink-muted"
            />
          </Field>
          <Field label="Profissão">
            <input
              name="profession"
              defaultValue={initial.profession}
              className="form-input"
            />
          </Field>
        </Grid>
      </Section>

      {/* Contact */}
      <Section
        title="Contactos"
        description="Email é a chave de acesso · alterações requerem nova verificação"
      >
        <Grid>
          <Field label="Email" required>
            <div className="relative">
              <input
                required
                type="email"
                name="email"
                defaultValue={initial.email}
                className="form-input pr-24 font-mono"
              />
              <span
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1",
                  initial.emailVerified
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
                    : "bg-amber-50 text-amber-700 ring-amber-200/60"
                )}
              >
                {initial.emailVerified ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" strokeWidth={2.75} />
                    Verificado
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" />
                    Não verificado
                  </>
                )}
              </span>
            </div>
          </Field>
          <Field label="Telefone / Telemóvel">
            <input
              type="tel"
              name="phone"
              defaultValue={initial.phone}
              placeholder="+351 9XX XXX XXX"
              className="form-input font-mono"
            />
          </Field>
        </Grid>
      </Section>

      {/* Address */}
      <Section title="Morada" description="Necessária para certificado físico (impressão)">
        <Grid>
          <Field label="Morada" className="md:col-span-2">
            <input
              name="address"
              defaultValue={initial.address}
              placeholder="Rua, nº, andar"
              className="form-input"
            />
          </Field>
          <Field label="Localidade">
            <input
              name="city"
              defaultValue={initial.city}
              className="form-input"
            />
          </Field>
          <Field label="Código postal">
            <input
              name="postalCode"
              defaultValue={initial.postalCode}
              placeholder="0000-000"
              className="form-input font-mono"
            />
          </Field>
          <Field label="País">
            <select
              name="country"
              defaultValue={initial.country}
              className="form-input"
            >
              <option value="Portugal">Portugal</option>
              <option value="Brasil">Brasil</option>
              <option value="Angola">Angola</option>
              <option value="Moçambique">Moçambique</option>
              <option value="Cabo Verde">Cabo Verde</option>
              <option value="Outro">Outro</option>
            </select>
          </Field>
          <Field label="Habilitação académica">
            <select
              name="qualification"
              defaultValue={initial.qualification}
              className="form-input"
            >
              <option value="">—</option>
              <option value="Básico">9ª Classe / Básico</option>
              <option value="Secundário">12º / Secundário</option>
              <option value="Licenciatura">Licenciatura</option>
              <option value="Mestrado">Mestrado</option>
              <option value="Doutoramento">Doutoramento</option>
              <option value="Outro">Outro</option>
            </select>
          </Field>
        </Grid>
      </Section>

      {/* RGPD */}
      <Section
        title="Privacidade · RGPD"
        description="Direitos garantidos pelo Regulamento UE 2016/679 (GDPR)"
        accent="emerald"
      >
        <div className="space-y-3">
          <ConsentToggle
            checked={true}
            disabled
            label="Tratamento de dados para gestão da formação"
            description="Obrigatório por força do art. 6.º do RGPD e Portaria n.º 474/2010 (SIGO/DGERT). Não pode ser desativado enquanto estiver inscrito num curso."
          />
          <ConsentToggle
            checked={consentMarketing}
            onChange={setConsentMarketing}
            label="Comunicações de marketing"
            description="Receber novidades sobre novos cursos, workshops e descontos."
          />
          <ConsentToggle
            checked={consentResearch}
            onChange={setConsentResearch}
            label="Inclusão em estudos pedagógicos anonimizados"
            description="Os seus dados podem ser usados anonimamente para melhorar a qualidade da formação."
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar todos os meus dados (JSON)
          </button>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-wider text-navy transition-colors hover:bg-surface-low"
          >
            <Globe className="h-3.5 w-3.5" />
            Política de privacidade
          </a>
        </div>
      </Section>

      {/* Security */}
      <Section
        title="Segurança"
        description="Como acede à plataforma · protege a sua conta"
      >
        <div className="space-y-3">
          <SecurityRow
            icon={Mail}
            title="Acesso por magic-link"
            value="Ativo"
            description="Sem password · cada login envia link seguro de uso único para o seu email"
            status="ok"
          />
          <SecurityRow
            icon={Lock}
            title="Autenticação de dois fatores (2FA)"
            value="Não configurada"
            description="Adiciona uma camada extra de segurança · em breve via app autenticadora"
            status="pending"
          />
        </div>
      </Section>

      {/* Danger zone */}
      <Section
        title="Eliminação da conta"
        description="Direito ao esquecimento (Art. 17.º RGPD)"
        accent="red"
      >
        <p className="mb-4 text-xs leading-relaxed text-ink-muted">
          Pode pedir a eliminação da sua conta a qualquer momento. Os seus dados
          ficam <strong>anonimizados em 30 dias</strong>, mas as folhas de
          presença assinadas e certificados emitidos têm de ser retidos por{" "}
          <strong>5 anos</strong> conforme exigência DGERT/SIGO. Após esse
          prazo, são igualmente anonimizados.
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-700 transition-colors hover:bg-red-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Pedir eliminação da conta
        </button>
      </Section>
    </form>
  );
}

// ─── helpers ───────────────────────────────────────────────────────────────
function Section({
  title,
  description,
  children,
  accent,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  accent?: "emerald" | "red";
}) {
  return (
    <section
      className={cn(
        "rounded-xl border bg-card p-6",
        accent === "emerald"
          ? "border-emerald-200/60 bg-emerald-50/20"
          : accent === "red"
          ? "border-red-200/60 bg-red-50/20"
          : "border-border"
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        {accent === "emerald" && (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
          </div>
        )}
        {accent === "red" && (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-100 text-red-700">
            <Trash2 className="h-4 w-4" />
          </div>
        )}
        <div>
          <h3 className="text-base font-bold text-navy">{title}</h3>
          {description && (
            <p className="mt-1 text-xs text-ink-muted">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function ConsentToggle({
  checked,
  onChange,
  disabled,
  label,
  description,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  description: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
        disabled
          ? "border-emerald-200/60 bg-emerald-50/40 cursor-not-allowed"
          : "border-border bg-card hover:bg-surface-low/60"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-emerald-600"
      />
      <div className="flex-1">
        <p className="text-sm font-bold text-navy">
          {label}
          {disabled && (
            <span className="ml-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Obrigatório
            </span>
          )}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
          {description}
        </p>
      </div>
    </label>
  );
}

function SecurityRow({
  icon: Icon,
  title,
  value,
  description,
  status,
}: {
  icon: typeof Mail;
  title: string;
  value: string;
  description: string;
  status: "ok" | "pending";
}) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-surface-low/30 p-4">
      <div
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
          status === "ok"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-bold text-navy">{title}</h4>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              status === "ok"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            )}
          >
            {value}
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-muted">{description}</p>
      </div>
    </div>
  );
}
