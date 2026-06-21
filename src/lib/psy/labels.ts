/**
 * Helpers de exibição (labels + cores) para o módulo Saúde Mental.
 *
 * IMPORTANTE: o cálculo do motor vive no BACKEND (api/src/psy/motor.ts).
 * O cliente recebe os agregados já com `banda` em texto e `valor` numérico.
 * Este ficheiro SÓ formata/colora; NUNCA importa o motor, NUNCA recebe
 * psy_responses ou psy_answers cruas, NUNCA recalcula nada sobre respostas.
 */

// ============================================================================
// Grupo (psy_dimensions.grupo)
// ============================================================================

export type PsyGroup = "Essencial" | "Complementar" | "ComplementarII"

export const PSY_GROUP_LABELS: Record<PsyGroup, string> = {
  Essencial: "Essencial",
  Complementar: "Complementar",
  ComplementarII: "Complementar II",
}

/**
 * Label para o grupo de uma dimensão. O canónico guardado na BD usa
 * "ComplementarII" sem espaço (CHECK constraint da v11); a UI mostra
 * sempre com espaço.
 */
export function labelPsyGroup(grupo: string): string {
  return PSY_GROUP_LABELS[grupo as PsyGroup] ?? grupo
}

// ============================================================================
// IGRP, Índice Geral de Risco Psicossocial. Alto é MAU.
// O backend devolve em `agregados.igrp.banda`.
// ============================================================================

export type BandaIgrp = "Baixo" | "Médio" | "Alto" | "Muito Alto"

/**
 * Token Tailwind para cor de texto da banda IGRP. Compatível com o tema
 * (light/dark) através de tokens semânticos quando aplicável.
 */
export function colorBandaIgrp(banda: string): string {
  switch (banda) {
    case "Baixo":
      return "text-emerald-700"
    case "Médio":
      return "text-amber-700"
    case "Alto":
      return "text-orange-700"
    case "Muito Alto":
      return "text-destructive"
    default:
      return "text-foreground"
  }
}

// ============================================================================
// IMO, Índice de Maturidade Organizacional. Alto é BOM.
// Bandas PROVISÓRIAS, sempre acompanhadas do sufixo abaixo quando
// `agregados.imo.provisorio === true`.
// ============================================================================

export type BandaImo =
  | "Maturidade Baixa"
  | "Maturidade Média"
  | "Maturidade Alta"
  | "Maturidade Muito Alta"

/**
 * Token Tailwind para cor de texto da banda IMO. Escala invertida em
 * relação ao IGRP: maturidade alta = verde, baixa = vermelho.
 */
export function colorBandaImo(banda: string): string {
  switch (banda) {
    case "Maturidade Baixa":
      return "text-destructive"
    case "Maturidade Média":
      return "text-orange-700"
    case "Maturidade Alta":
      return "text-amber-700"
    case "Maturidade Muito Alta":
      return "text-emerald-700"
    default:
      return "text-foreground"
  }
}

/**
 * Sufixo a anexar visualmente sempre que a banda IMO for mostrada e o
 * agregado vier marcado com `provisorio = true`.
 */
export const IMO_BANDA_PROVISORIO_SUFIXO = "(provisório)"

// ============================================================================
// N insuficiente
// ============================================================================

/**
 * Texto a mostrar quando o backend devolve `{ insuficiente: true, ... }` em
 * vez de agregados. Tipicamente para áreas com menos de 5 respondentes.
 */
export const N_INSUFICIENTE_LABEL = "Amostra insuficiente"
