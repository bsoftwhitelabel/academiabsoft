"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Props = {
  attendanceId: string;
  traineeName: string;
  sessionLabel: string;
};

export function InvalidateSignatureButton({
  attendanceId,
  traineeName,
  sessionLabel,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!reason.trim()) {
      setError("Indica o motivo.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/signatures/${attendanceId}/invalidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? `Falhou (HTTP ${res.status})`);
      }
      setOpen(false);
      setReason("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 border-red-200 bg-red-50/50 text-[11px] font-bold text-red-700 hover:bg-red-100"
        >
          <Ban className="h-3 w-3" strokeWidth={2.5} />
          Invalidar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invalidar assinatura</DialogTitle>
          <DialogDescription className="text-xs">
            <strong>{traineeName}</strong> · {sessionLabel}
            <br />
            Esta ação fica registada no audit trail e <em>não pode ser
            revertida</em>. O formando terá de re-assinar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="reason" className="text-xs">
            Motivo (obrigatório)
          </Label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex.: assinatura duplicada por engano, formando coagido, erro técnico..."
            className="min-h-[100px] w-full resize-none rounded-md border border-border bg-card p-2 text-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
            disabled={submitting}
          />
          {error && (
            <p className="rounded-md bg-red-50 p-2 text-xs font-bold text-red-700">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !reason.trim()}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                A invalidar…
              </>
            ) : (
              <>
                <Ban className="mr-1.5 h-3.5 w-3.5" />
                Confirmar invalidação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
