import { useRef, useState } from "react"
import { toast } from "sonner"
import SignatureCanvas from "react-signature-canvas"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useUpdateSessionSummary } from "./useUpdateSessionSummary"
import type { TrainerSessionDetail } from "./useTrainerSession"

interface Props {
  session: TrainerSessionDetail
  onClose: () => void
  onSaved?: () => void
}

export function SessionSummaryForm({ session, onClose, onSaved }: Props) {
  const upsert = useUpdateSessionSummary()
  const sigRef = useRef<SignatureCanvas | null>(null)
  const [summary, setSummary] = useState(session.summary ?? "")
  const [acknowledged, setAcknowledged] = useState(false)

  async function handleDraft() {
    try {
      await upsert.mutateAsync({
        sessionId: session.id,
        summary: summary.trim() || null,
      })
      toast.success("Rascunho guardado")
      onSaved?.()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao guardar")
    }
  }

  async function handleSignAndSave() {
    if (!acknowledged) {
      toast.error("Confirma que tomaste conhecimento da imutabilidade")
      return
    }
    const canvas = sigRef.current
    if (!canvas || canvas.isEmpty()) {
      toast.error("Desenha a assinatura antes de guardar")
      return
    }
    // PNG data URI; vai directo para training_sessions.trainerSignatureUrl
    const png = canvas.toDataURL("image/png")
    try {
      await upsert.mutateAsync({
        sessionId: session.id,
        summary: summary.trim() || null,
        signaturePngBase64: png,
      })
      toast.success("Sumário assinado")
      onSaved?.()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao assinar")
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="summary">Sumário da Sessão</Label>
        <Textarea
          id="summary"
          rows={8}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="O que foi abordado nesta sessão..."
        />
      </div>

      <div className="rounded-lg border p-4">
        <Label>Assinatura Digital</Label>
        <div className="mt-2 inline-block">
          <SignatureCanvas
            ref={sigRef}
            canvasProps={{
              width: 500,
              height: 200,
              className: "rounded border bg-white",
            }}
          />
        </div>
        <div className="mt-2 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => sigRef.current?.clear()}
          >
            Limpar
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Ao assinar, o sumário fica bloqueado para edição.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="ack"
          checked={acknowledged}
          onCheckedChange={(v) => setAcknowledged(v === true)}
        />
        <Label htmlFor="ack" className="text-sm font-normal">
          Estou ciente de que, ao assinar, o sumário fica imutável.
        </Label>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleDraft}
          disabled={upsert.isPending}
        >
          {upsert.isPending ? "A guardar..." : "Guardar Rascunho"}
        </Button>
        <Button
          type="button"
          onClick={handleSignAndSave}
          disabled={upsert.isPending || !acknowledged}
        >
          {upsert.isPending ? "A assinar..." : "Guardar e Assinar"}
        </Button>
      </div>
    </div>
  )
}
