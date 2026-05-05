"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, LogIn, AlertCircle } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

type Props = {
  tenantSlug: string;
};

export function LoginForm({ tenantSlug }: Props) {
  const [state, action] = useFormState<LoginState | undefined, FormData>(
    loginAction,
    undefined
  );

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="tenantSlug" value={tenantSlug} />

      <Field label="Email">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state?.email}
          placeholder="admin@oportoforte.pt"
          className="form-input"
        />
      </Field>

      <Field label="Password">
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="form-input"
        />
      </Field>

      {state?.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <SubmitButton />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
            Sou formando
          </span>
        </div>
      </div>

      <Link
        href={`/${tenantSlug}/auth/magic-link`}
        className="block w-full rounded-lg border border-border bg-card px-4 py-3 text-center text-sm font-semibold text-navy transition-all hover:bg-surface-low"
      >
        Receber link mágico no email
      </Link>

      <p className="pt-2 text-center text-xs text-ink-muted">
        Ainda não tens conta?{" "}
        <Link
          href={`/${tenantSlug}/onboarding`}
          className="font-bold text-blue-600 hover:underline"
        >
          Inscreve-te aqui
        </Link>
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
        <LogIn className="h-4 w-4" strokeWidth={2.5} />
      )}
      {pending ? "A verificar..." : "Entrar"}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">
        {label}
      </span>
      {children}
    </label>
  );
}
