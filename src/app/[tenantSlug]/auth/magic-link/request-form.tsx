"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  Loader2,
  Mail,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { requestMagicLinkAction, type MagicLinkState } from "./actions";

type Props = { tenantSlug: string };

export function MagicLinkRequestForm({ tenantSlug }: Props) {
  const [state, action] = useFormState<MagicLinkState | undefined, FormData>(
    requestMagicLinkAction,
    undefined
  );

  if (state?.status === "sent") {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-bold text-navy">
            Link enviado para <span className="font-mono">{state.email}</span>
          </h3>
          <p className="mt-2 text-sm text-ink-muted">{state.message}</p>
        </div>

        {state.devUrl && (
          <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gold-700">
              Link de desenvolvimento
            </p>
            <a
              href={state.devUrl}
              className="flex items-center gap-2 break-all rounded-lg bg-card p-3 font-mono text-xs text-navy hover:bg-surface-low"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              {state.devUrl}
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="tenantSlug" value={tenantSlug} />

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">
          Email
        </span>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={state?.email}
            placeholder="o.seu.email@empresa.pt"
            className="form-input pl-9"
          />
        </div>
      </label>

      {state?.status === "error" && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <SubmitButton />

      <p className="text-center text-xs text-ink-subtle">
        O link expira em 1 hora e só pode ser usado uma vez por sessão.
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-navy text-sm font-bold text-white transition-all hover:bg-navy/90 disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mail className="h-4 w-4" strokeWidth={2.5} />
      )}
      {pending ? "A enviar..." : "Enviar link mágico"}
    </button>
  );
}
