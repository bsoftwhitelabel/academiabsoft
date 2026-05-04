import Link from "next/link";
import { Sparkles } from "lucide-react";
import { MagicLinkRequestForm } from "./request-form";

export const metadata = { title: "Link mágico" };

export default function MagicLinkPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  return (
    <div>
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-700">
        <Sparkles className="h-3 w-3" strokeWidth={2.75} />
        Acesso de formando
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-navy">
        Receba o seu link de acesso
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Sem necessidade de password. Insira o email com que se inscreveu no
        curso e enviaremos um link de acesso direto ao seu portal.
      </p>

      <div className="mt-8">
        <MagicLinkRequestForm tenantSlug={params.tenantSlug} />
      </div>

      <p className="mt-6 text-center text-sm text-ink-muted">
        É administrador ou formador?{" "}
        <Link
          href={`/${params.tenantSlug}/auth/login`}
          className="font-semibold text-navy hover:underline"
        >
          Use email + password
        </Link>
      </p>
    </div>
  );
}
