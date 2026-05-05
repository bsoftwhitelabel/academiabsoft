"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  GraduationCap,
  Target,
  Layers,
  ImageIcon,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MOCK_AREAS } from "@/lib/mock-data";

const TABS = [
  { id: "info", label: "Informação Geral", icon: GraduationCap },
  { id: "objectives", label: "Objetivos", icon: Target },
  { id: "modules", label: "Módulos", icon: Layers },
  { id: "marketing", label: "Marketing & Catálogo", icon: ImageIcon },
] as const;

type TabId = (typeof TABS)[number]["id"];

export type CourseFormInitial = {
  name?: string;
  shortName?: string;
  code?: string;
  areaSlug?: string;
  modality?: string;
  durationHours?: number;
  certificationLevel?: string;
  priceEur?: number | null;
  destinatarios?: string;
  objetivosGerais?: string;
  objetivosEspecificos?: string;
  metodologia?: string;
  metodologiaAvaliacao?: string;
  modules?: { name: string; hours: number }[];
  coverImageUrl?: string;
  marketingDescription?: string;
  tagsRaw?: string;
  isPublic?: boolean;
  isFeatured?: boolean;
};

export function CourseFormClient({
  initial,
  mode = "create",
}: {
  initial?: CourseFormInitial;
  mode?: "create" | "edit";
}) {
  const [active, setActive] = useState<TabId>("info");
  const [modules, setModules] = useState(
    initial?.modules ?? [{ name: "Enquadramento e legislação", hours: 4 }]
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success(mode === "edit" ? "Curso atualizado" : "Curso criado", {
      description:
        "Demonstração: este formulário não persiste dados (server action em FASE 4).",
    });
  };

  return (
    <form id="course-form" onSubmit={handleSubmit} className="space-y-6">
      {/* tabs */}
      <div className="rounded-xl border border-border bg-card p-1.5">
        <div className="grid grid-cols-2 gap-1 lg:grid-cols-4">
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

      <div className="rounded-xl border border-border bg-card p-6 md:p-8">
        {active === "info" && (
          <Grid>
            <Field label="Nome do curso" required className="md:col-span-2">
              <input
                required
                name="name"
                defaultValue={initial?.name ?? ""}
                placeholder="ex: Segurança e Higiene no Trabalho"
                className="form-input"
              />
            </Field>
            <Field label="Sigla">
              <input
                name="shortName"
                defaultValue={initial?.shortName ?? ""}
                placeholder="SHT"
                className="form-input"
              />
            </Field>
            <Field label="Código interno" required>
              <input
                required
                name="code"
                defaultValue={initial?.code ?? ""}
                placeholder="ex: SHT-2026-001"
                className="form-input font-mono"
              />
            </Field>
            <Field label="Área de Formação" required>
              <select
                required
                name="areaSlug"
                className="form-input"
                defaultValue={initial?.areaSlug ?? ""}
              >
                <option value="" disabled>
                  Selecione uma área
                </option>
                {MOCK_AREAS.filter((a) => a.slug !== "all").map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Modalidade" required>
              <select
                required
                name="modality"
                className="form-input"
                defaultValue={initial?.modality ?? ""}
              >
                <option value="" disabled>
                  Selecione modalidade
                </option>
                <option value="PRESENCIAL">Presencial</option>
                <option value="ELEARNING">E-learning</option>
                <option value="BLENDED">Híbrido (B-Learning)</option>
              </select>
            </Field>
            <Field label="Duração (horas)" required>
              <input
                required
                type="number"
                min={1}
                name="durationHours"
                defaultValue={initial?.durationHours ?? ""}
                placeholder="35"
                className="form-input"
              />
            </Field>
            <Field label="Tipo de certificação" required>
              <select
                required
                name="certificationLevel"
                className="form-input"
                defaultValue={initial?.certificationLevel ?? ""}
              >
                <option value="" disabled>
                  Selecione
                </option>
                <option value="PARTICIPACAO">Participação</option>
                <option value="APROVEITAMENTO">Aproveitamento</option>
                <option value="COMPETENCIAS">Competências</option>
              </select>
            </Field>
            <Field label="Preço (€)">
              <input
                type="number"
                min={0}
                step="0.01"
                name="priceEur"
                defaultValue={initial?.priceEur ?? ""}
                placeholder="320.00"
                className="form-input"
              />
            </Field>
          </Grid>
        )}

        {active === "objectives" && (
          <div className="space-y-5">
            <Field label="Destinatários e pré-requisitos">
              <textarea
                name="destinatarios"
                rows={3}
                defaultValue={initial?.destinatarios ?? ""}
                placeholder="Ex: Trabalhadores em ambiente industrial..."
                className="form-input"
              />
            </Field>
            <Field label="Objetivos gerais" required>
              <textarea
                required
                name="objetivosGerais"
                rows={4}
                defaultValue={initial?.objetivosGerais ?? ""}
                placeholder="Após o curso, o formando será capaz de..."
                className="form-input"
              />
            </Field>
            <Field label="Objetivos específicos" required>
              <textarea
                required
                name="objetivosEspecificos"
                rows={5}
                defaultValue={initial?.objetivosEspecificos ?? ""}
                placeholder="Identificar..., aplicar..., implementar..."
                className="form-input"
              />
            </Field>
            <Field label="Metodologia de formação" required>
              <textarea
                required
                name="metodologia"
                rows={3}
                defaultValue={initial?.metodologia ?? ""}
                placeholder="Sessões teóricas alternadas com casos práticos..."
                className="form-input"
              />
            </Field>
            <Field label="Metodologia de avaliação">
              <textarea
                name="metodologiaAvaliacao"
                rows={3}
                defaultValue={initial?.metodologiaAvaliacao ?? ""}
                placeholder="Avaliação contínua + prova final..."
                className="form-input"
              />
            </Field>
          </div>
        )}

        {active === "modules" && (
          <div className="space-y-4">
            <p className="text-sm text-ink-muted">
              Defina a estrutura modular do curso. As horas devem somar a duração total.
            </p>
            <div className="space-y-3">
              {modules.map((mod, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[auto_1fr_120px_auto] items-center gap-3 rounded-xl border border-border p-3"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-navy text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  <input
                    value={mod.name}
                    onChange={(e) =>
                      setModules((m) =>
                        m.map((x, idx) =>
                          idx === i ? { ...x, name: e.target.value } : x
                        )
                      )
                    }
                    placeholder="Nome do módulo"
                    className="form-input"
                  />
                  <input
                    type="number"
                    min={1}
                    value={mod.hours}
                    onChange={(e) =>
                      setModules((m) =>
                        m.map((x, idx) =>
                          idx === i
                            ? { ...x, hours: Number(e.target.value) }
                            : x
                        )
                      )
                    }
                    placeholder="Horas"
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setModules((m) => m.filter((_, idx) => idx !== i))
                    }
                    className="grid h-9 w-9 place-items-center rounded-md text-ink-faint hover:bg-red-50 hover:text-red-600"
                    aria-label="Remover módulo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModules((m) => [...m, { name: "", hours: 4 }])}
              className="border-dashed"
            >
              <Plus className="h-4 w-4" />
              Adicionar módulo
            </Button>
          </div>
        )}

        {active === "marketing" && (
          <Grid>
            <Field label="Imagem de capa (URL)" className="md:col-span-2">
              <input
                name="coverImageUrl"
                type="url"
                defaultValue={initial?.coverImageUrl ?? ""}
                placeholder="https://images.unsplash.com/..."
                className="form-input"
              />
            </Field>
            <Field label="Descrição de marketing" className="md:col-span-2">
              <textarea
                name="marketingDescription"
                rows={4}
                defaultValue={initial?.marketingDescription ?? ""}
                placeholder="Breve descrição apelativa para o catálogo público (máx. 280 caracteres)."
                className="form-input"
              />
            </Field>
            <Field label="Tags (separadas por vírgula)" className="md:col-span-2">
              <input
                name="tagsRaw"
                defaultValue={initial?.tagsRaw ?? ""}
                placeholder="DGERT, Obrigatório, Saúde Ocupacional"
                className="form-input"
              />
            </Field>
            <CheckboxField
              name="isPublic"
              label="Publicar no catálogo público"
              defaultChecked={initial?.isPublic}
            />
            <CheckboxField
              name="isFeatured"
              label="Destacar como curso em foco"
              defaultChecked={initial?.isFeatured}
            />
          </Grid>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-low/40 p-4 text-sm">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        <p className="text-ink-muted">
          {mode === "edit"
            ? <>As alterações ficam num rascunho até clicares em <strong className="text-navy">Guardar alterações</strong>.</>
            : <>As alterações são guardadas como rascunho até clicares em <strong className="text-navy">Guardar curso</strong>.</>}
        </p>
      </div>
    </form>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>;
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
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
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface-low/40 px-4 py-3 transition-colors hover:bg-surface-low">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-border accent-navy"
      />
      <span className="text-sm font-semibold text-navy">{label}</span>
    </label>
  );
}
