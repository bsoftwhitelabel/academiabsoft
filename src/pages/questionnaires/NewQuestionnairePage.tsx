import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Copy, FilePlus } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDefaultTenantId } from "@/hooks/useDefaultTenant"
import { useQuestionnaires } from "./useQuestionnaires"
import {
  useCloneQuestionnaire,
  useCreateQuestionnaire,
} from "./useQuestionnaireMutations"
import { cn } from "@/lib/utils"

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  targetRole: z.enum(["TRAINEE", "TRAINER"]),
  context: z.enum(["ACTION", "SESSION"]),
  format: z.enum(["PRESENCIAL", "ELEARNING"]),
})
type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

type Mode = "blank" | "clone"

export function NewQuestionnairePage() {
  const navigate = useNavigate()
  const tenant = useDefaultTenantId()
  const list = useQuestionnaires()
  const create = useCreateQuestionnaire()
  const clone = useCloneQuestionnaire()

  const [mode, setMode] = useState<Mode>("blank")
  const [sourceId, setSourceId] = useState<string>("")

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: "",
      targetRole: "TRAINEE",
      context: "ACTION",
      format: "PRESENCIAL",
    },
  })

  async function onSubmitBlank(values: FormValues) {
    if (!tenant.data) {
      toast.error("Sem tenant resolvido")
      return
    }
    try {
      const created = await create.mutateAsync({
        tenantId: tenant.data,
        input: values,
      })
      toast.success("Questionário criado")
      navigate(`/admin/questionarios/${created.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar")
    }
  }

  async function handleClone() {
    if (!sourceId) {
      toast.error("Escolhe um questionário para clonar")
      return
    }
    if (!tenant.data) {
      toast.error("Sem tenant resolvido")
      return
    }
    try {
      const cloned = await clone.mutateAsync({
        sourceId,
        tenantId: tenant.data,
      })
      toast.success("Questionário clonado")
      navigate(`/admin/questionarios/${cloned.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao clonar")
    }
  }

  const err = form.formState.errors
  return (
    <div className="space-y-6">
      <Link
        to="/admin/questionarios"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Questionários
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">Novo Questionário</h1>
        <p className="text-sm text-muted-foreground">
          Cria do zero ou clona um existente para acelerar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("blank")}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4 text-left transition",
            mode === "blank"
              ? "border-primary bg-primary/5"
              : "hover:bg-muted/40"
          )}
        >
          <FilePlus className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Criar do Zero</p>
            <p className="text-sm text-muted-foreground">
              Começa com um questionário vazio e adiciona perguntas.
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMode("clone")}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4 text-left transition",
            mode === "clone"
              ? "border-primary bg-primary/5"
              : "hover:bg-muted/40"
          )}
        >
          <Copy className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Clonar de Existente</p>
            <p className="text-sm text-muted-foreground">
              Cópia integral de um questionário e suas perguntas.
            </p>
          </div>
        </button>
      </div>

      {mode === "blank" ? (
        <form
          onSubmit={form.handleSubmit(onSubmitBlank)}
          className="max-w-2xl space-y-4 rounded-lg border p-6"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Ex.: Avaliação de Satisfação 2026"
              {...form.register("name")}
            />
            {err.name && (
              <p className="text-xs text-destructive">{err.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Destinatário</Label>
              <Select
                value={form.watch("targetRole")}
                onValueChange={(v) =>
                  form.setValue("targetRole", v as FormValues["targetRole"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRAINEE">Formando</SelectItem>
                  <SelectItem value="TRAINER">Formador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contexto</Label>
              <Select
                value={form.watch("context")}
                onValueChange={(v) =>
                  form.setValue("context", v as FormValues["context"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTION">Acção</SelectItem>
                  <SelectItem value="SESSION">Sessão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select
                value={form.watch("format")}
                onValueChange={(v) =>
                  form.setValue("format", v as FormValues["format"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                  <SelectItem value="ELEARNING">E-Learning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/questionarios")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "A criar..." : "Criar e Adicionar Perguntas"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="max-w-2xl space-y-4 rounded-lg border p-6">
          <div className="space-y-2">
            <Label>Questionário original</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    list.isLoading
                      ? "A carregar..."
                      : "Escolhe um questionário..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {(list.data ?? []).map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.name} · {q.questionCount} perg.
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              É criada uma cópia com sufixo "(cópia)" no nome, mantendo todas
              as perguntas.
            </p>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/questionarios")}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={clone.isPending || !sourceId}
              onClick={handleClone}
            >
              {clone.isPending ? "A clonar..." : "Clonar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
