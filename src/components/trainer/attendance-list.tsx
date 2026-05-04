"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowDownUp, BadgeCheck, Clock4, X, LogIn } from "lucide-react";
import type { AttendanceTrainee } from "@/lib/mock-data";
import type { AttendanceStatus, SignatureState } from "@prisma/client";

type Props = {
  trainees: AttendanceTrainee[];
};

export function AttendanceList({ trainees }: Props) {
  const [order, setOrder] = useState<"name" | "status">("name");

  const sorted = [...trainees].sort((a, b) => {
    if (order === "name") return a.fullName.localeCompare(b.fullName);
    return signatureStateOrder(a.signatureState) - signatureStateOrder(b.signatureState);
  });

  return (
    <div className="rounded-2xl border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
          Listagem de Formandos
        </h3>
        <button
          onClick={() => setOrder(order === "name" ? "status" : "name")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-navy"
        >
          <ArrowDownUp className="h-3.5 w-3.5" />
          Ordenar
        </button>
      </header>
      <ul className="divide-y divide-border">
        {sorted.map((trainee) => (
          <AttendanceRow key={trainee.id} trainee={trainee} />
        ))}
      </ul>
    </div>
  );
}

function AttendanceRow({ trainee }: { trainee: AttendanceTrainee }) {
  return (
    <li className="flex items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-surface-low/50">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar trainee={trainee} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-navy">
            {trainee.fullName}
          </p>
          <p className="truncate text-xs text-ink-subtle">{trainee.email}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <SignaturePill
          state={trainee.signatureState}
          status={trainee.status}
          checkedInAt={trainee.checkedInAt}
        />
        <RowAction
          status={trainee.status}
          signatureState={trainee.signatureState}
        />
      </div>
    </li>
  );
}

function Avatar({ trainee }: { trainee: AttendanceTrainee }) {
  if (trainee.avatarUrl) {
    return (
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
        <Image
          src={trainee.avatarUrl}
          alt={trainee.fullName}
          fill
          sizes="40px"
          className="object-cover"
        />
        {trainee.isOnline && (
          <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
        )}
      </div>
    );
  }
  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-mid text-xs font-bold text-navy ring-1 ring-border">
      {trainee.initials}
    </div>
  );
}

function SignaturePill({
  state,
  status,
  checkedInAt,
}: {
  state: SignatureState;
  status: AttendanceStatus;
  checkedInAt: string | null;
}) {
  if (state === "SIGNED") {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200/50">
          <BadgeCheck className="h-3 w-3" strokeWidth={2.75} />
          Assinado digitalmente
        </span>
        {checkedInAt && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-subtle">
            Entrada: {checkedInAt}
          </span>
        )}
      </div>
    );
  }
  if (state === "ENABLED") {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-gold-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-700 ring-1 ring-gold-200/60">
          Assinatura habilitada
        </span>
        {checkedInAt && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-subtle">
            {checkedInAt}
          </span>
        )}
      </div>
    );
  }
  if (status === "CHECKED_IN" || status === "MANUAL_PRESENT") {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 ring-1 ring-blue-200/50">
          <Clock4 className="h-3 w-3" strokeWidth={2.5} />
          {status === "MANUAL_PRESENT" ? "Manual" : "Check-in feito"}
        </span>
        {checkedInAt && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-subtle">
            {checkedInAt}
          </span>
        )}
      </div>
    );
  }
  if (status === "ABSENT") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700 ring-1 ring-red-200/50">
        <X className="h-3 w-3" strokeWidth={2.75} />
        Ausente
      </span>
    );
  }
  // PENDING
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-mid px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted ring-1 ring-border">
      Pendente
    </span>
  );
}

function RowAction({
  status,
  signatureState,
}: {
  status: AttendanceStatus;
  signatureState: SignatureState;
}) {
  if (signatureState === "SIGNED" || signatureState === "ENABLED") {
    return (
      <button className="text-xs font-bold uppercase tracking-wider text-red-600 transition-colors hover:text-red-700">
        Anular
      </button>
    );
  }
  if (status === "PENDING") {
    return (
      <button className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-card-elevated transition-colors hover:bg-blue-700">
        <LogIn className="h-3 w-3" />
        Check-in
      </button>
    );
  }
  if (status === "ABSENT") {
    return (
      <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted hover:bg-surface-low">
        Marcar manual
      </button>
    );
  }
  return (
    <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-700">
      Habilitar assinatura
    </button>
  );
}

function signatureStateOrder(state: SignatureState): number {
  return { SIGNED: 0, ENABLED: 1, NOT_ENABLED: 2, INVALIDATED: 3 }[state];
}
