import { useMemo, useState } from "react"
import { Lock, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useSessionEnrollments } from "./useSessionEnrollments"
import { useSessionCheckIns, type SessionCheckIn } from "./useSessionCheckIns"
import { useToggleCheckIn } from "./useToggleCheckIn"

interface Props {
  sessionId: string
  trainingActionId: string | undefined
  signedAt: string | null | undefined
  canEdit: boolean
  currentUserId: string | null
}

function fmtTime(iso: string | null) {
  if (!iso) return ""
  return new Date(iso).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AttendanceTab({
  sessionId,
  trainingActionId,
  signedAt,
  canEdit,
  currentUserId,
}: Props) {
  const enr = useSessionEnrollments(trainingActionId)
  const ck = useSessionCheckIns(sessionId)
  const toggle = useToggleCheckIn()
  const [pendingTraineeId, setPendingTraineeId] = useState<string | null>(null)

  const signed = !!signedAt
  const editable = canEdit && !signed

  const byTrainee = useMemo(() => {
    const map = new Map<string, SessionCheckIn>()
    for (const c of ck.data ?? []) map.set(c.traineeId, c)
    return map
  }, [ck.data])

  const rows = enr.data ?? []
  const present = rows.filter((r) => r.trainee && byTrainee.has(r.trainee.id)).length
  const total = rows.length
  const pct = total === 0 ? 0 : Math.round((present / total) * 100)

  const bannerTone = signed
    ? "border-muted bg-muted text-muted-foreground"
    : pct >= 75
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : pct >= 50
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-rose-200 bg-rose-50 text-rose-800"

  async function handleToggle(traineeId: string, next: boolean) {
    if (!editable) return
    setPendingTraineeId(traineeId)
    try {
      await toggle.mutateAsync({
        sessionId,
        traineeId,
        isPresent: next,
        currentUserId,
      })
      toast.success(next ? "Presença marcada" : "Presença removida")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao actualizar presença")
    } finally {
      setPendingTraineeId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-md border p-3 text-sm",
          bannerTone
        )}
      >
        <div className="flex items-center gap-2">
          {signed && <Lock className="h-4 w-4 shrink-0" />}
          <span className="font-medium">
            Presenças: {present} de {total} formandos · {pct}%
          </span>
        </div>
        {signed && (
          <span className="text-xs">
            Sumário assinado. Presenças bloqueadas. Contacte o admin para reabrir.
          </span>
        )}
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Presença</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-40">Estado matrícula</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-20 text-center text-muted-foreground"
                >
                  {enr.isLoading
                    ? "A carregar..."
                    : "Não há formandos matriculados."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((e) => {
                const traineeId = e.trainee?.id
                const checkin = traineeId ? byTrainee.get(traineeId) : undefined
                const isChecked = !!checkin
                const isPending =
                  !!traineeId && pendingTraineeId === traineeId
                return (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Checkbox
                            checked={isChecked}
                            disabled={!editable || !traineeId}
                            onCheckedChange={(v) =>
                              traineeId &&
                              handleToggle(traineeId, v === true)
                            }
                            aria-label="Marcar presença"
                          />
                        )}
                        {isChecked && checkin?.checkedInAt && (
                          <span className="text-xs text-muted-foreground">
                            {fmtTime(checkin.checkedInAt)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {`${e.trainee?.firstName ?? ""} ${
                        e.trainee?.lastName ?? ""
                      }`.trim() || "—"}
                    </TableCell>
                    <TableCell>{e.trainee?.email ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{e.status ?? "—"}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
