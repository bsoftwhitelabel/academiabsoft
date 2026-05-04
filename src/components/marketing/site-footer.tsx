import Link from "next/link";
import { GraduationCap, Globe, MessageCircle, HelpCircle } from "lucide-react";

type Props = {
  tenantSlug: string;
  tenantName: string;
};

export function SiteFooter({ tenantSlug, tenantName }: Props) {
  return (
    <footer className="border-t border-navy/40 bg-navy text-surface-low">
      <div className="mx-auto max-w-container px-4 py-12 md:px-8 md:py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link
              href={`/${tenantSlug}/catalog`}
              className="mb-4 flex items-center gap-2.5 text-white"
            >
              <GraduationCap className="h-6 w-6" strokeWidth={2.5} />
              <span className="text-xl font-bold tracking-tight">
                {tenantName}
              </span>
            </Link>
            <p className="mb-6 max-w-md text-sm leading-relaxed text-surface-low/80">
              Entidade formadora certificada pela DGERT. Excelência na
              formação profissional desde 2010, focada no desenvolvimento real
              de competências.
            </p>
            <div className="flex gap-4 text-surface-low/60">
              <Link
                href="#"
                aria-label="Site institucional"
                className="transition-colors hover:text-white"
              >
                <Globe className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                aria-label="Comunidade"
                className="transition-colors hover:text-white"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                aria-label="Suporte"
                className="transition-colors hover:text-white"
              >
                <HelpCircle className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <FooterColumn title="Institucional" items={institutionalLinks} />
          <FooterColumn title="Suporte" items={supportLinks} />
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-surface-low/60">
          © {new Date().getFullYear()} {tenantName}. Todos os direitos
          reservados.
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white">
        {title}
      </h4>
      <ul className="space-y-2.5 text-sm">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="text-surface-low/80 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const institutionalLinks = [
  { label: "Sobre Nós", href: "#" },
  { label: "Certificações DGERT", href: "#" },
  { label: "Formadores", href: "#" },
  { label: "Contactos", href: "#" },
];

const supportLinks = [
  { label: "Perguntas Frequentes", href: "#" },
  { label: "Termos e Condições", href: "#" },
  { label: "Política de Privacidade", href: "#" },
  { label: "Livro de Reclamações", href: "#" },
];
