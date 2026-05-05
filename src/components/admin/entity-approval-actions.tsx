"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import {
  approveEntity,
  rejectEntity,
} from "@/app/[tenantSlug]/admin/entities/actions";

type Props = {
  entityId: string;
  entityName: string;
};

export function EntityApprovalActions({ entityId, entityName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  function handleApprove() {
    startTransition(async () => {
      const res = await approveEntity(entityId);
      if (res.ok) {
        toast.success(res.message ?? "Empresa aprovada.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleReject() {
    if (!reason.trim()) {
      toast.error("Indica o motivo de rejeição.");
      return;
    }
    startTransition(async () => {
      const res = await rejectEntity(entityId, reason);
      if (res.ok) {
        toast.success(res.message ?? "Empresa rejeitada.");
        setRejectOpen(false);
        setReason("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            className="h-8 gap-1 border-red-200 bg-red-50/40 text-[11px] font-bold text-red-700 hover:bg-red-100"
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
            Rejeitar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar empresa</DialogTitle>
            <DialogDescription className="text-xs">
              <strong>{entityName}</strong> será removida. Os formandos
              associados ficam sem empresa (não são apagados).
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
              placeholder="Ex.: empresa duplicada, dados insuficientes, fora do scope…"
              className="min-h-[100px] w-full resize-none rounded-md border border-border bg-card p-2 text-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              disabled={pending}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleReject}
              disabled={pending || !reason.trim()}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {pending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  A rejeitar…
                </>
              ) : (
                <>
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        size="sm"
        onClick={handleApprove}
        disabled={pending}
        className="h-8 gap-1 bg-emerald-600 text-[11px] font-bold text-white hover:bg-emerald-700"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Check className="h-3 w-3" strokeWidth={2.75} />
        )}
        Aprovar
      </Button>
    </div>
  );
}
