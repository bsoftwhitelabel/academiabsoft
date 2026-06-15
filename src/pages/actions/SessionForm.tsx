import { useState } from "react"
import { toast } from "sonner"
import { FormModal } from "@/components/forms/FormModal"
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
import { useTrainersLookup } from "@/hooks/useLookups"
import { useCourseModules } from "@/pages/courses/useCourseModules"
import { useUpsertSession } from "./useTrainingActions"
import type { TrainingSession } from "@/types/domain"

const NONE = "__none__"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  trainingActionId: string
  courseId: string | null
  session: TrainingSession | null
}

export function SessionForm({
  open,
  onOpenChange,
  trainingActionId,
  courseId,
  session,
}: Props) {
  const upsert = useUpsertSession()
  const trainers = useTrainersLookup()
  const modules = useCourseModules(courseId || undefined)

  const [sessionDate, setSessionDate] = useState(
    session?.sessionDate?.slice(0, 10) ?? ""
  )
  const [startTime, setStartTime] = useState(session?.startTime ?? "09:00")
  const [endTime, setEndTime] = useState(session?.endTime ?? "13:00")
  const [durationHours, setDurationHours] = useState(
    String(session?.durationHours ?? 4)
  )
  const [trainerId, setTrainerId] = useState<string | null>(
    session?.trainerId ?? null
  )
  const [courseModuleId, setCourseModuleId] = useState<string | null>(
    session?.courseModuleId ?? null
  )
  const [sessionType, setSessionType] = useState<string | null>(
    session?.sessionType ?? null
  )

  async function handleSave() {
    if (!sessionDate) {
      toast.error("Data da sessão obrigatória")
      return
    }
    try {
      await upsert.mutateAsync({
        id: session?.id,
        trainingActionId,
        input: {
          sessionDate: new Date(sessionDate).toISOString(),
          startTime,
          endTime,
          durationHours: Number(durationHours),
          trainerId,
          courseModuleId,
          sessionType,
        },
      })
      toast.success(session ? "Sessão atualizada" : "Sessão criada")
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gravar")
    }
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={session ? "Editar Sessão" : "Nova Sessão"}
      className="max-w-lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data</Label>
            <Input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Duração (horas)</Label>
            <Input
              type="number"
              step="0.5"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Início (HH:MM)</Label>
            <Input
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Fim (HH:MM)</Label>
            <Input
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Módulo</Label>
            <Select
              value={courseModuleId ?? NONE}
              onValueChange={(v) =>
                setCourseModuleId(v === NONE ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sem módulo</SelectItem>
                {(modules.data ?? []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={sessionType ?? NONE}
              onValueChange={(v) => setSessionType(v === NONE ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>—</SelectItem>
                <SelectItem value="TEORICA">Teórica</SelectItem>
                <SelectItem value="PRATICA">Prática</SelectItem>
                <SelectItem value="MISTA">Mista</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Formador</Label>
            <Select
              value={trainerId ?? NONE}
              onValueChange={(v) => setTrainerId(v === NONE ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>—</SelectItem>
                {(trainers.data ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {`${t.users?.firstName ?? ""} ${t.users?.lastName ?? ""}`.trim() ||
                      t.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button disabled={upsert.isPending} onClick={handleSave}>
            {upsert.isPending ? "A gravar..." : "Gravar"}
          </Button>
        </div>
      </div>
    </FormModal>
  )
}
