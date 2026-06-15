import { useEffect, useMemo, useState } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeft,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  Settings2,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/feedback/ErrorState"
import { useQuestionnaire } from "./useQuestionnaire"
import {
  useDeleteQuestion,
  useReorderQuestions,
} from "./useQuestionnaireMutations"
import { QuestionForm } from "./QuestionForm"
import { QuestionnaireForm } from "./QuestionnaireForm"
import type {
  Questionnaire,
  QuestionnaireQuestion,
} from "@/types/domain"

const ROLE_LABEL: Record<string, string> = {
  TRAINEE: "Formando",
  TRAINER: "Formador",
}
const CTX_LABEL: Record<string, string> = {
  ACTION: "Acção",
  SESSION: "Sessão",
}
const FORMAT_LABEL: Record<string, string> = {
  PRESENCIAL: "Presencial",
  ELEARNING: "E-Learning",
}

export function QuestionnaireDetailPage() {
  const { questionnaireId } = useParams<{ questionnaireId: string }>()
  const q = useQuestionnaire(questionnaireId)
  const reorder = useReorderQuestions()
  const del = useDeleteQuestion()

  const [editOpen, setEditOpen] = useState(false)
  const [questionOpen, setQuestionOpen] = useState(false)
  const [editing, setEditing] = useState<QuestionnaireQuestion | null>(null)
  const [localOrder, setLocalOrder] = useState<QuestionnaireQuestion[]>([])
  const [dragId, setDragId] = useState<string | null>(null)

  const serverQuestions = useMemo(() => q.data?.questions ?? [], [q.data])
  useEffect(() => setLocalOrder(serverQuestions), [serverQuestions])

  async function persistOrder(next: QuestionnaireQuestion[]) {
    if (!questionnaireId) return
    setLocalOrder(next)
    try {
      await reorder.mutateAsync({
        questionnaireId,
        orderedIds: next.map((x) => x.id),
      })
      toast.success("Ordem atualizada")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro a reordenar")
      setLocalOrder(serverQuestions)
    }
  }

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return
    const from = localOrder.findIndex((m) => m.id === dragId)
    const to = localOrder.findIndex((m) => m.id === targetId)
    if (from < 0 || to < 0) return
    const next = [...localOrder]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setDragId(null)
    persistOrder(next)
  }

  async function handleDelete(id: string) {
    if (!questionnaireId) return
    if (!window.confirm("Apagar esta pergunta?")) return
    try {
      await del.mutateAsync({ id, questionnaireId })
      toast.success("Pergunta apagada")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao apagar")
    }
  }

  if (q.isError) {
    return <ErrorState message={(q.error as Error)?.message} />
  }

  const questionnaire = q.data
  const nextOrder = localOrder.length + 1

  return (
    <div className="space-y-6">
      <Link
        to="/admin/questionarios"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Questionários
      </Link>

      {q.isLoading || !questionnaire ? (
        <p className="text-sm text-muted-foreground">A carregar...</p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">{questionnaire.name}</h1>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="secondary">
                  {ROLE_LABEL[questionnaire.targetRole]}
                </Badge>
                <Badge variant="outline">
                  {CTX_LABEL[questionnaire.context]}
                </Badge>
                <Badge variant="outline">
                  {FORMAT_LABEL[questionnaire.format] ?? questionnaire.format}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setEditOpen(true)}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Perguntas{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ({localOrder.length})
                </span>
              </h2>
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setQuestionOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Pergunta
              </Button>
            </div>

            <div className="space-y-2">
              {localOrder.length === 0 ? (
                <div className="rounded-md border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                  Sem perguntas. Clica em "Adicionar Pergunta" para começar.
                </div>
              ) : (
                localOrder.map((qq, idx) => (
                  <div
                    key={qq.id}
                    draggable
                    onDragStart={() => setDragId(qq.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(qq.id)}
                    className={
                      "flex items-start gap-3 rounded-md border bg-background p-3 transition" +
                      (dragId === qq.id ? " opacity-50" : "")
                    }
                  >
                    <GripVertical className="mt-0.5 h-5 w-5 cursor-grab text-muted-foreground" />
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {idx + 1}.
                        </span>
                        <Badge
                          variant={qq.type === "SCALE" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {qq.type === "SCALE"
                            ? `Escala ${qq.scaleMin}-${qq.scaleMax}`
                            : "Resposta aberta"}
                        </Badge>
                        {qq.isRequired && (
                          <Badge variant="outline" className="text-[10px]">
                            Obrigatória
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{qq.text}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(qq)
                          setQuestionOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(qq.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {questionOpen && questionnaireId && (
            <QuestionForm
              open={questionOpen}
              onOpenChange={setQuestionOpen}
              questionnaireId={questionnaireId}
              question={editing}
              nextOrder={nextOrder}
            />
          )}

          {editOpen && (
            <QuestionnaireForm
              open={editOpen}
              onOpenChange={setEditOpen}
              questionnaire={questionnaire as Questionnaire}
            />
          )}
        </>
      )}
    </div>
  )
}
