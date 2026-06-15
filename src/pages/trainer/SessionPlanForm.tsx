import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useUpdateSessionPlan } from "./useUpdateSessionPlan"
import type { TrainerSessionDetail } from "./useTrainerSession"

const schema = z.object({
  planObjetivos: z.string().nullable(),
  planIntroducao: z.string().nullable(),
  planDesenvolvimento: z.string().nullable(),
  planConclusao: z.string().nullable(),
  planAvaliacao: z.string().nullable(),
})
type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

const SUGESTOES = [
  "Videoprojetor",
  "Computador",
  "Quadro",
  "Manual do Formando",
  "Material Prático",
  "Equipamentos de Segurança",
]

interface Props {
  session: TrainerSessionDetail
  onClose: () => void
  onSaved?: () => void
}

export function SessionPlanForm({ session, onClose, onSaved }: Props) {
  const upsert = useUpdateSessionPlan()
  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    values: {
      planObjetivos: session.planObjetivos ?? null,
      planIntroducao: session.planIntroducao ?? null,
      planDesenvolvimento: session.planDesenvolvimento ?? null,
      planConclusao: session.planConclusao ?? null,
      planAvaliacao: session.planAvaliacao ?? null,
    },
  })

  const [recursos, setRecursos] = useState<string[]>(
    session.didacticResources ?? []
  )
  const [newRecurso, setNewRecurso] = useState("")

  function addRecurso(value?: string) {
    const v = (value ?? newRecurso).trim()
    if (!v) return
    setRecursos((cur) => (cur.includes(v) ? cur : [...cur, v]))
    setNewRecurso("")
  }
  function removeRecurso(v: string) {
    setRecursos((cur) => cur.filter((x) => x !== v))
  }

  async function onSubmit(values: FormValues) {
    try {
      await upsert.mutateAsync({
        sessionId: session.id,
        planObjetivos: values.planObjetivos || null,
        planIntroducao: values.planIntroducao || null,
        planDesenvolvimento: values.planDesenvolvimento || null,
        planConclusao: values.planConclusao || null,
        planAvaliacao: values.planAvaliacao || null,
        didacticResources: recursos.length ? recursos : null,
      })
      toast.success("Plano guardado")
      onSaved?.()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao guardar")
    }
  }

  function TextSection({
    name,
    label,
  }: {
    name: keyof FormInput
    label: string
  }) {
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Textarea id={name} rows={5} {...form.register(name)} />
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <TextSection name="planObjetivos" label="Objectivos" />
      <TextSection name="planIntroducao" label="Introdução" />
      <TextSection name="planDesenvolvimento" label="Desenvolvimento" />
      <TextSection name="planConclusao" label="Conclusão" />
      <TextSection name="planAvaliacao" label="Forma de Avaliação" />

      <div className="space-y-2">
        <Label>Recursos / Materiais Pedagógicos</Label>
        <div className="flex flex-wrap gap-2">
          {recursos.length === 0 && (
            <span className="text-xs italic text-muted-foreground">
              Sem recursos selecionados
            </span>
          )}
          {recursos.map((r) => (
            <Badge
              key={r}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {r}
              <button
                type="button"
                onClick={() => removeRecurso(r)}
                className="hover:text-destructive"
                aria-label={`Remover ${r}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Adicionar recurso..."
            value={newRecurso}
            onChange={(e) => setNewRecurso(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addRecurso()
              }
            }}
          />
          <Button type="button" variant="outline" onClick={() => addRecurso()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {SUGESTOES.filter((s) => !recursos.includes(s)).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addRecurso(s)}
              className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={upsert.isPending}>
          {upsert.isPending ? "A guardar..." : "Guardar"}
        </Button>
      </div>
    </form>
  )
}
