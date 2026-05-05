"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { submitWorkshopLead } from "@/app/[tenantSlug]/catalog/workshops/actions";

const PROGRAMMES = [
  "Pacote 1 bloco · 8 workshops",
  "Pacote 3 blocos · 24 workshops",
  "Programa integrado 6 meses · 40 workshops",
  "Custom · gostaria de conversar",
];

const SIZES = [
  "1-10 colaboradores",
  "11-50",
  "51-200",
  "201-500",
  "500+",
];

type Props = {
  tenantSlug: string;
  defaultProgramme?: string;
};

export function WorkshopLeadForm({ tenantSlug, defaultProgramme }: Props) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("tenantSlug", tenantSlug);
    startTransition(async () => {
      const res = await submitWorkshopLead(fd);
      if (res.ok) {
        toast.success(res.message);
        setDone(true);
      } else {
        toast.error(res.error);
      }
    });
  };

  if (done) {
    return (
      <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 p-8 text-center ring-1 ring-emerald-200/60">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
        <h3 className="text-xl font-bold text-navy">Pedido recebido</h3>
        <p className="mt-2 text-sm text-ink-muted">
          Vamos contactá-lo em 48h com uma proposta personalizada para a sua
          equipa.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-4 text-xs font-bold text-blue-600 hover:underline"
        >
          Submeter outro pedido
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Nome completo" required>
          <Input
            name="fullName"
            placeholder="Maria Silva"
            required
            disabled={pending}
            autoComplete="name"
          />
        </Field>
        <Field label="Email profissional" required>
          <Input
            type="email"
            name="email"
            placeholder="maria@empresa.pt"
            required
            disabled={pending}
            autoComplete="email"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Empresa" required>
          <Input
            name="company"
            placeholder="Decathlon Portugal"
            required
            disabled={pending}
            autoComplete="organization"
          />
        </Field>
        <Field label="Telefone (opcional)">
          <Input
            type="tel"
            name="phone"
            placeholder="+351 912 345 678"
            disabled={pending}
            autoComplete="tel"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Dimensão da equipa">
          <select
            name="companySize"
            defaultValue=""
            disabled={pending}
            className="form-input"
          >
            <option value="">Selecionar…</option>
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Programa de interesse">
          <select
            name="programme"
            defaultValue={defaultProgramme ?? ""}
            disabled={pending}
            className="form-input"
          >
            <option value="">Selecionar…</option>
            {PROGRAMMES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Como podemos ajudar?">
        <textarea
          name="message"
          placeholder="Contexto da equipa, objetivos, prazos, restrições…"
          rows={4}
          disabled={pending}
          className="form-input resize-none"
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
          <ShieldCheck className="h-3 w-3" />
          Os dados são usados apenas para responder ao seu pedido.
        </p>
        <Button
          type="submit"
          disabled={pending}
          className={cn(
            "h-11 gap-1.5 bg-navy text-white hover:bg-navy/90",
            pending && "cursor-wait"
          )}
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              A enviar…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Enviar pedido
            </>
          )}
        </Button>
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
