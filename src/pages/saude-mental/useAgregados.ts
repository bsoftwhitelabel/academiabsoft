import { useQuery } from "@tanstack/react-query"
import { psyFetch } from "@/lib/psy/api-client"

export type AgregadoDimensao = {
  dimensionId: string
  codigo: string
  nome: string
  bloco: string | null
  grupo: "Essencial" | "Complementar" | "ComplementarII"
  tipo: "Risco" | "Protetiva"
  impacto: 2 | 3 | 4
  media: number
  pontuacao: number
  classificacao: "Favorável" | "Atenção" | "Risco" | "Risco Elevado"
  prob_valor: 1 | 2 | 3 | 4
  criticidade: number
  prioridade: "P1" | "P2" | "P3" | "P4"
  n_respondentes: number
  n_respostas: number
}

export type AgregadoBanda = { valor: number; banda: string }
export type AgregadoIgrp = AgregadoBanda
export type AgregadoImo = AgregadoBanda & { provisorio: true }
export type AgregadoMatrizCelula = {
  prob: 1 | 2 | 3 | 4
  impacto: 2 | 3 | 4
  n: number
  dimensionIds: string[]
}

export type AgregadoComputeOk = {
  insuficiente: false
  n: number
  minN: number
  dimensoes: AgregadoDimensao[]
  igrp: AgregadoIgrp
  imo: AgregadoImo
  matriz: AgregadoMatrizCelula[]
  top: AgregadoDimensao[]
}
export type AgregadoComputeInsuficiente = {
  insuficiente: true
  n: number
  minN: number
  reason: "N insuficiente"
}
export type AgregadoComputeResult =
  | AgregadoComputeOk
  | AgregadoComputeInsuficiente

export type AgregadosResponse = {
  meta: { campaignId: string; instrumentId: string; estado: string }
  geral: AgregadoComputeResult
  por_area: Record<string, AgregadoComputeResult>
}

export function useAgregados(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["psy", "campaign", campaignId, "agregados"],
    queryFn: () =>
      psyFetch<AgregadosResponse>(`/campaigns/${campaignId}/agregados`),
    enabled: !!campaignId,
    staleTime: 15_000,
  })
}
