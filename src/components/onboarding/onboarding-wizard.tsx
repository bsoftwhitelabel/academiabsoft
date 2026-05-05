"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { submitOnboarding, type EntitiesPayload } from "@/app/[tenantSlug]/onboarding/actions";

type Step = 1 | 2 | 3;

const STEPS: { id: Step; label: string; icon: typeof User }[] = [
  { id: 1, label: "Os teus dados", icon: User },
  { id: 2, label: "Empresa", icon: Building2 },
  { id: 3, label: "Confirmação", icon: CheckCircle2 },
];

type Props = {
  tenantSlug: string;
  entities: EntitiesPayload;
};

export function OnboardingWizard({ tenantSlug, entities }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState({
    fullName: "",
    email: "",
    phone: "",
    taxId: "",
    birthDate: "",
    entityChoice: entities.length > 0 ? "existing" : "new",
    entityId: "",
    newEntityName: "",
    newEntityCity: "",
    agreedTerms: false,
  });

  function update<K extends keyof typeof draft>(
    key: K,
    value: (typeof draft)[K]
  ) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function validateStep1(): string | null {
    if (!draft.fullName || draft.fullName.trim().length < 2)
      return "Indica o nome completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email))
      return "Email inválido.";
    return null;
  }

  function validateStep2(): string | null {
    if (draft.entityChoice === "existing" && !draft.entityId)
      return "Seleciona a empresa.";
    if (draft.entityChoice === "new" && !draft.newEntityName.trim())
      return "Indica o nome da nova empresa.";
    return null;
  }

  function next() {
    const err = step === 1 ? validateStep1() : step === 2 ? validateStep2() : null;
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  }

  function prev() {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft.agreedTerms) {
      toast.error("Tens de aceitar os termos para continuar.");
      return;
    }
    const fd = new FormData();
    Object.entries(draft).forEach(([k, v]) => {
      if (typeof v === "boolean") {
        if (v) fd.append(k, "on");
      } else if (v) {
        fd.append(k, v as string);
      }
    });
    fd.append("tenantSlug", tenantSlug);

    startTransition(async () => {
      const res = await submitOnboarding(fd);
      // submitOnboarding redirects on success; we only see an error if it fails.
      if (res && !res.ok) {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* stepper */}
      <ol className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = s.id === step;
          const done = s.id < step;
          return (
            <li key={s.id} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => done && setStep(s.id)}
                disabled={!done}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                  active && "bg-navy text-white shadow-card-elevated",
                  done && "bg-emerald-100 text-emerald-700",
                  !active && !done && "bg-surface-mid text-ink-faint"
                )}
                aria-label={s.label}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </button>
              <div className={cn("min-w-0", i === STEPS.length - 1 ? "" : "flex-1")}>
                <p
                  className={cn(
                    "truncate text-[10px] font-bold uppercase tracking-wider",
                    active ? "text-navy" : "text-ink-subtle"
                  )}
                >
                  Passo {s.id}
                </p>
                <p
                  className={cn(
                    "truncate text-xs font-bold",
                    active ? "text-navy" : "text-ink-muted"
                  )}
                >
                  {s.label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 rounded-full",
                    done ? "bg-emerald-300" : "bg-surface-mid"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* step content */}
      <div className="rounded-xl bg-surface-low/40 p-5">
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Nome completo" required>
                <Input
                  value={draft.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="Maria Silva"
                  autoComplete="name"
                  disabled={pending}
                />
              </Field>
              <Field label="Email" required>
                <Input
                  type="email"
                  value={draft.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="maria@empresa.pt"
                  autoComplete="email"
                  disabled={pending}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Telefone">
                <Input
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+351 …"
                  autoComplete="tel"
                  disabled={pending}
                />
              </Field>
              <Field label="NIF">
                <Input
                  value={draft.taxId}
                  onChange={(e) => update("taxId", e.target.value)}
                  placeholder="123456789"
                  inputMode="numeric"
                  disabled={pending}
                />
              </Field>
              <Field label="Data nascimento">
                <Input
                  type="date"
                  value={draft.birthDate}
                  onChange={(e) => update("birthDate", e.target.value)}
                  disabled={pending}
                />
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-ink-muted">
              Liga a tua conta a uma empresa-cliente para que os certificados
              fiquem associados. Se a tua empresa ainda não existe na
              plataforma, podes registá-la (ficará pendente de aprovação).
            </p>

            <div className="space-y-2">
              {entities.length > 0 && (
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 transition-colors",
                    draft.entityChoice === "existing"
                      ? "border-navy ring-1 ring-navy/20"
                      : "border-border hover:bg-surface-low/40"
                  )}
                >
                  <input
                    type="radio"
                    name="entityChoice"
                    value="existing"
                    checked={draft.entityChoice === "existing"}
                    onChange={() => update("entityChoice", "existing")}
                    className="mt-0.5 h-4 w-4 accent-navy"
                    disabled={pending}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-navy">
                      Empresa já registada
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      Seleciona da lista de empresas-cliente desta plataforma.
                    </p>
                    {draft.entityChoice === "existing" && (
                      <select
                        value={draft.entityId}
                        onChange={(e) => update("entityId", e.target.value)}
                        className="form-input mt-3"
                        disabled={pending}
                      >
                        <option value="">Selecionar…</option>
                        {entities.map((ent) => (
                          <option key={ent.id} value={ent.id}>
                            {ent.name}
                            {ent.city ? ` — ${ent.city}` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>
              )}

              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 transition-colors",
                  draft.entityChoice === "new"
                    ? "border-navy ring-1 ring-navy/20"
                    : "border-border hover:bg-surface-low/40"
                )}
              >
                <input
                  type="radio"
                  name="entityChoice"
                  value="new"
                  checked={draft.entityChoice === "new"}
                  onChange={() => update("entityChoice", "new")}
                  className="mt-0.5 h-4 w-4 accent-navy"
                  disabled={pending}
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-navy">Nova empresa</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Vamos criar o registo · um admin valida depois.
                  </p>
                  {draft.entityChoice === "new" && (
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Field label="Nome da empresa" required>
                        <Input
                          value={draft.newEntityName}
                          onChange={(e) =>
                            update("newEntityName", e.target.value)
                          }
                          placeholder="Decathlon Portugal"
                          disabled={pending}
                          autoComplete="organization"
                        />
                      </Field>
                      <Field label="Cidade">
                        <Input
                          value={draft.newEntityCity}
                          onChange={(e) =>
                            update("newEntityCity", e.target.value)
                          }
                          placeholder="Maia"
                          disabled={pending}
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </label>

              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 transition-colors",
                  draft.entityChoice === "none"
                    ? "border-navy ring-1 ring-navy/20"
                    : "border-border hover:bg-surface-low/40"
                )}
              >
                <input
                  type="radio"
                  name="entityChoice"
                  value="none"
                  checked={draft.entityChoice === "none"}
                  onChange={() => update("entityChoice", "none")}
                  className="mt-0.5 h-4 w-4 accent-navy"
                  disabled={pending}
                />
                <div>
                  <p className="text-sm font-bold text-navy">
                    Inscrição individual
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Não estou ligado a uma empresa-cliente.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                Resumo do pedido
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label="Nome" value={draft.fullName} />
                <Row label="Email" value={draft.email} />
                {draft.phone && <Row label="Telefone" value={draft.phone} />}
                {draft.taxId && <Row label="NIF" value={draft.taxId} />}
                <Row
                  label="Empresa"
                  value={
                    draft.entityChoice === "existing"
                      ? entities.find((e) => e.id === draft.entityId)?.name ??
                        "—"
                      : draft.entityChoice === "new"
                      ? `${draft.newEntityName} (nova)`
                      : "Inscrição individual"
                  }
                />
              </dl>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3">
              <input
                type="checkbox"
                checked={draft.agreedTerms}
                onChange={(e) => update("agreedTerms", e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-navy"
                disabled={pending}
              />
              <span className="text-xs text-ink-muted">
                Aceito o tratamento dos meus dados pessoais para emissão de
                certificados DGERT, conforme o RGPD. Posso retirar o
                consentimento a qualquer momento.
              </span>
            </label>

            <div className="rounded-lg bg-blue-50/40 p-3 text-xs text-blue-800 ring-1 ring-blue-200/60">
              Vais receber um magic-link no email indicado. Toca nele para
              entrares no portal — não precisas de password.
            </div>
          </div>
        )}
      </div>

      {/* nav */}
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={prev}
          disabled={step === 1 || pending}
          className="gap-1.5 border-border bg-card text-navy hover:bg-surface-low"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        {step < 3 ? (
          <Button
            type="button"
            onClick={next}
            disabled={pending}
            className="gap-1.5 bg-navy text-white hover:bg-navy/90"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={pending || !draft.agreedTerms}
            className="gap-1.5 bg-navy text-white hover:bg-navy/90"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                A criar conta…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Criar conta
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
        {label}
      </dt>
      <dd className="text-sm font-bold text-navy">{value}</dd>
    </div>
  );
}
