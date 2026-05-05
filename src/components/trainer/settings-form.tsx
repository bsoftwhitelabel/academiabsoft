"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, CalendarDays, Plug } from "lucide-react";
import { cn } from "@/lib/utils";

type Initial = {
  fullName: string;
  email: string;
  phone: string;
  ccpNumber: string;
  yearsPresentialExp: number;
  yearsDistanceExp: number;
  bio: string;
  isExternal: boolean;
  isElearning: boolean;
};

const AREAS = [
  "729 Saúde e Bem-Estar",
  "345 Gestão e Administração",
  "482 Tecnologias da Informação",
  "346 Liderança e RH",
  "211 Design",
  "862 Segurança no Trabalho",
  "145 Formação de Formadores",
  "347 Trabalho e Ambiente",
  "380 Direito Laboral",
  "581 Construção e Engenharia",
  "851 Conservação Ambiental",
  "462 Marketing e Publicidade",
];

const WEEKDAYS = [
  { key: "mon", label: "Seg" },
  { key: "tue", label: "Ter" },
  { key: "wed", label: "Qua" },
  { key: "thu", label: "Qui" },
  { key: "fri", label: "Sex" },
  { key: "sat", label: "Sáb" },
  { key: "sun", label: "Dom" },
];

export function TrainerSettingsForm({ initial }: { initial: Initial }) {
  const [availability, setAvailability] = useState<Record<string, boolean>>({
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: false,
    sun: false,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success("Preferências guardadas (demo)", {
      description: "Em produção, persiste em Trainer model + sincroniza calendário",
    });
  };

  return (
    <form
      id="trainer-settings-form"
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* CCP */}
      <Section
        title="Certificação CCP"
        description="Certificado de Competências Pedagógicas · obrigatório DGERT"
        accent="emerald"
      >
        <Grid>
          <Field label="Número CCP" required>
            <input
              required
              name="ccpNumber"
              defaultValue={initial.ccpNumber}
              placeholder="CCP-XXXXX"
              className="form-input font-mono"
            />
          </Field>
          <Field label="Validade">
            <input
              type="date"
              name="ccpExpiresAt"
              className="form-input"
            />
          </Field>
        </Grid>
      </Section>

      {/* Profile */}
      <Section title="Perfil profissional" description="Aparece em comunicações e no catálogo público">
        <Grid>
          <Field label="Nome completo" required className="md:col-span-2">
            <input
              required
              name="fullName"
              defaultValue={initial.fullName}
              className="form-input"
            />
          </Field>
          <Field label="Email" required>
            <input
              required
              type="email"
              name="email"
              defaultValue={initial.email}
              className="form-input font-mono"
            />
          </Field>
          <Field label="Telefone">
            <input
              type="tel"
              name="phone"
              defaultValue={initial.phone}
              placeholder="+351 9XX XXX XXX"
              className="form-input font-mono"
            />
          </Field>
          <Field label="Anos exp. presencial">
            <input
              type="number"
              min={0}
              name="yearsPresentialExp"
              defaultValue={initial.yearsPresentialExp}
              className="form-input"
            />
          </Field>
          <Field label="Anos exp. e-learning">
            <input
              type="number"
              min={0}
              name="yearsDistanceExp"
              defaultValue={initial.yearsDistanceExp}
              className="form-input"
            />
          </Field>
          <Field label="Bio (200 chars)" className="md:col-span-2">
            <textarea
              name="bio"
              rows={3}
              maxLength={200}
              defaultValue={initial.bio}
              placeholder="Sou especialista em segurança ocupacional com 12 anos de experiência..."
              className="form-input"
            />
          </Field>
        </Grid>
      </Section>

      {/* Tipologia */}
      <Section title="Tipologia" description="Define como apareces no catálogo e dossiers DGERT">
        <Grid>
          <CheckboxField
            name="isExternal"
            label="Formador externo"
            description="Marca como freelancer/consultor (não funcionário interno)"
            defaultChecked={initial.isExternal}
          />
          <CheckboxField
            name="isElearning"
            label="Formador e-learning"
            description="Habilitado para conduzir cursos online/híbridos"
            defaultChecked={initial.isElearning}
          />
        </Grid>
      </Section>

      {/* Areas */}
      <Section
        title="Áreas de especialidade"
        description="Critério de matching para atribuição automática a turmas"
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {AREAS.map((a, i) => (
            <label
              key={a}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-low/40 px-3 py-2 text-xs font-medium transition-colors hover:bg-surface-low"
            >
              <input
                type="checkbox"
                name="areas[]"
                value={a}
                defaultChecked={i < 3}
                className="h-3.5 w-3.5 accent-navy"
              />
              <span className="text-navy">{a}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Availability */}
      <Section
        title="Disponibilidade semanal"
        description="Dias em que estás disponível para sessões · usado pela auto-atribuição"
        accent="blue"
      >
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => {
            const isOn = availability[d.key];
            return (
              <button
                type="button"
                key={d.key}
                onClick={() =>
                  setAvailability({ ...availability, [d.key]: !isOn })
                }
                className={cn(
                  "h-12 w-16 rounded-lg border-2 text-sm font-bold uppercase tracking-wider transition-all",
                  isOn
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-border bg-card text-ink-muted hover:bg-surface-low"
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        <Grid className="mt-5">
          <Field label="Hora início">
            <input
              type="time"
              name="availabilityStart"
              defaultValue="09:00"
              className="form-input"
            />
          </Field>
          <Field label="Hora fim">
            <input
              type="time"
              name="availabilityEnd"
              defaultValue="18:00"
              className="form-input"
            />
          </Field>
        </Grid>
      </Section>

      {/* Calendar sync */}
      <Section
        title="Sincronização de calendário"
        description="Em breve · integração com Google Calendar e Outlook"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <IntegrationButton
            icon={CalendarDays}
            name="Google Calendar"
            description="Sincronização bidirecional · 5 min de configuração"
          />
          <IntegrationButton
            icon={CalendarDays}
            name="Microsoft Outlook"
            description="Sincronização bidirecional · OAuth"
          />
        </div>
      </Section>
    </form>
  );
}

// ─── helpers ───────────────────────────────────────────────────────────────
function Section({
  title,
  description,
  accent,
  children,
}: {
  title: string;
  description?: string;
  accent?: "emerald" | "blue";
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border bg-card p-6",
        accent === "emerald"
          ? "border-emerald-200/60 bg-emerald-50/20"
          : accent === "blue"
          ? "border-blue-200/60 bg-blue-50/20"
          : "border-border"
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        {accent === "emerald" && (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
            <BadgeCheck className="h-4 w-4" />
          </div>
        )}
        {accent === "blue" && (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-700">
            <CalendarDays className="h-4 w-4" />
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

function Grid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2", className)}>
      {children}
    </div>
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

function CheckboxField({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface-low/40 p-4 transition-colors hover:bg-surface-low">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 accent-navy"
      />
      <div>
        <p className="text-sm font-bold text-navy">{label}</p>
        <p className="mt-0.5 text-xs text-ink-muted">{description}</p>
      </div>
    </label>
  );
}

function IntegrationButton({
  icon: Icon,
  name,
  description,
}: {
  icon: typeof CalendarDays;
  name: string;
  description: string;
}) {
  return (
    <button
      type="button"
      className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-navy/15 hover:bg-surface-low/60"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-navy">{name}</p>
        <p className="mt-0.5 text-xs text-ink-muted">{description}</p>
        <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 group-hover:text-navy">
          <Plug className="h-3 w-3" />
          Em breve
        </span>
      </div>
    </button>
  );
}
