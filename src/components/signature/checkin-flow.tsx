"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  PenLine,
  ShieldCheck,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignaturePad } from "./signature-pad";

type State =
  | "PENDING"        // not yet checked in
  | "CHECKED_IN"     // self check-in done, waiting trainer
  | "READY_TO_SIGN"  // trainer enabled signature
  | "SIGNED";        // signature submitted

type Props = {
  initialState?: State;
  sessionTitle: string;
  scheduledStart: string;
  scheduledEnd: string;
  /** Demo mode shows a button to advance trainer's actions client-side */
  demoMode?: boolean;
};

export function CheckinFlow({
  initialState = "PENDING",
  sessionTitle,
  scheduledStart,
  scheduledEnd,
  demoMode = true,
}: Props) {
  const [state, setState] = useState<State>(initialState);
  const [signature, setSignature] = useState<string | null>(null);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const doCheckIn = async () => {
    setPending(true);
    await delay(700);
    const time = new Date().toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setCheckedInAt(time);
    setState("CHECKED_IN");
    setPending(false);
    toast.success("Check-in registado", {
      description: `Entrada às ${time}. Aguarde a liberação do formador.`,
    });
  };

  // Demo helper: simulate the trainer enabling signature for this trainee.
  const trainerEnableDemo = async () => {
    setPending(true);
    await delay(900);
    setState("READY_TO_SIGN");
    setPending(false);
    toast.info("O formador habilitou a sua assinatura.", {
      description: "Pode assinar a sua presença agora.",
    });
  };

  const handleSign = async (dataUrl: string) => {
    setPending(true);
    await delay(600);
    const time = new Date().toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setSignature(dataUrl);
    setSignedAt(time);
    setState("SIGNED");
    setPending(false);
    toast.success("Presença assinada digitalmente", {
      description: `Registo concluído às ${time}. Será gerada folha de presenças.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* timeline of states */}
      <Timeline state={state} />

      {/* state-specific cards */}
      {state === "PENDING" && (
        <Card variant="action">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gold-50 text-gold-700">
              <PenLine className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-h3 font-bold text-navy">
                Confirmar a sua presença
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                <strong className="text-navy">{sessionTitle}</strong> · {scheduledStart}–{scheduledEnd}
                <br />
                O check-in informa ao formador que está aqui. A assinatura
                oficial é habilitada por ele no final da sessão.
              </p>
              <Button
                onClick={doCheckIn}
                disabled={pending}
                size="lg"
                className="mt-5 h-11 bg-gold text-navy hover:bg-gold-light"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                )}
                Fazer Check-in Agora
              </Button>
            </div>
          </div>
        </Card>
      )}

      {state === "CHECKED_IN" && (
        <Card variant="info">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-h3 font-bold text-navy">
                Check-in confirmado às {checkedInAt}
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                Está marcado como <strong className="text-navy">presente</strong>.
                A assinatura oficial será habilitada quando o formador encerrar
                a sessão.
              </p>
              {demoMode && (
                <Button
                  variant="outline"
                  onClick={trainerEnableDemo}
                  disabled={pending}
                  className="mt-4 border-dashed text-xs"
                >
                  {pending && <Loader2 className="h-3 w-3 animate-spin" />}
                  <Sparkles className="h-3 w-3" />
                  Demo · simular liberação pelo formador
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {state === "READY_TO_SIGN" && (
        <Card variant="ready">
          <div className="mb-5 flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold-700">
              <PenLine className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-h3 font-bold text-navy">
                Assinatura habilitada
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                O formador validou a sua presença. Assine no quadro abaixo para
                concluir o registo da sessão.
              </p>
            </div>
          </div>
          <SignaturePad onSign={handleSign} />
        </Card>
      )}

      {state === "SIGNED" && (
        <Card variant="success">
          <div className="mb-5 flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-h3 font-bold text-navy">
                Presença assinada digitalmente às {signedAt}
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                A sua assinatura foi registada. A folha de presenças DGERT desta
                sessão será gerada automaticamente após o encerramento da
                sessão.
              </p>
            </div>
          </div>
          {signature && (
            <SignaturePad
              onSign={() => undefined}
              existingDataUrl={signature}
            />
          )}
        </Card>
      )}
    </div>
  );
}

function Card({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "action" | "info" | "ready" | "success";
}) {
  const styles = {
    action: "border-gold/30 bg-card",
    info: "border-blue-200 bg-blue-50/30",
    ready: "border-gold/40 bg-gold/5",
    success: "border-emerald-200 bg-emerald-50/30",
  };
  return (
    <div className={`rounded-2xl border p-6 ${styles[variant]}`}>{children}</div>
  );
}

function Timeline({ state }: { state: State }) {
  const steps = [
    { key: "PENDING", label: "Check-in" },
    { key: "CHECKED_IN", label: "Confirmação" },
    { key: "READY_TO_SIGN", label: "Liberação" },
    { key: "SIGNED", label: "Assinatura" },
  ] as const;

  const currentIdx = steps.findIndex((s) => s.key === state);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <ol className="grid grid-cols-4 gap-2">
        {steps.map((step, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <li key={step.key} className="flex flex-col items-center gap-2">
              <div
                className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold transition-all ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                    ? "bg-navy text-white ring-4 ring-navy/15"
                    : "bg-surface-mid text-ink-faint"
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  isCurrent ? "text-navy" : "text-ink-muted"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
