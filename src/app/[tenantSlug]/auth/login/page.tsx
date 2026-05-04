import { ShieldCheck } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar" };

export default function LoginPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  return (
    <div>
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-navy/8 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-navy">
        <ShieldCheck className="h-3 w-3" strokeWidth={2.75} />
        Acesso administrador & formador
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-navy">
        Bem-vindo de volta
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Use as credenciais da sua conta de gestão. Os formandos entram através
        de link mágico enviado para o email.
      </p>

      <div className="mt-8">
        <LoginForm tenantSlug={params.tenantSlug} />
      </div>
    </div>
  );
}
