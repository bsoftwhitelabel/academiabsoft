"use client";

import { FileDown, ChevronDown, ScrollText, FileSignature, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type Props = {
  sessionId: string;
  trainingActionId: string;
  /** Arbitrary trainee id used for the Ficha Inscrição demo */
  sampleTraineeId: string;
};

export function DgertDocumentsMenu({
  sessionId,
  trainingActionId,
  sampleTraineeId,
}: Props) {
  const items = [
    {
      icon: ScrollText,
      label: "Folha de Presenças",
      sublabel: `Sessão atual · IMP_10`,
      href: `/api/pdf/folha-presencas/${sessionId}`,
      primary: true,
    },
    {
      icon: FileSignature,
      label: "Ficha de Inscrição",
      sublabel: `1.º formando · IMP_06`,
      href: `/api/pdf/ficha-inscricao/${sampleTraineeId}`,
    },
    {
      icon: ClipboardCheck,
      label: "Ata de Reunião Pedagógica",
      sublabel: `Resumo da turma · IMP_20`,
      href: `/api/pdf/ata-reuniao/${trainingActionId}`,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-10 gap-1.5 border-border bg-card text-navy hover:bg-surface-low"
        >
          <FileDown className="h-4 w-4" />
          Documentos DGERT
          <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
          Gerar PDF
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.label} asChild className="cursor-pointer">
              <a
                href={item.href}
                target="_blank"
                rel="noopener"
                className="flex items-start gap-3 py-2.5"
              >
                <div
                  className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md ${
                    item.primary
                      ? "bg-navy text-white"
                      : "bg-surface-mid text-navy"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-navy">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-ink-subtle">
                    {item.sublabel}
                  </div>
                </div>
              </a>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <div className="px-2 py-2 text-[10px] leading-relaxed text-ink-subtle">
          Os documentos são gerados com cabeçalho tri-logo (formação · cliente ·
          DGERT) e assinaturas digitais embebidas.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
