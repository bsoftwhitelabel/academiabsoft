import { useQuery } from "@tanstack/react-query"
import { psyFetch } from "@/lib/psy/api-client"

export type PsyDimensionRow = {
  id: string
  codigo: string
  nome: string
  bloco: string | null
  grupo: "Essencial" | "Complementar" | "ComplementarII"
  tipo: "Risco" | "Protetiva"
  impacto: number
  ordem: number
  questionCount: number
}

export type PsyThresholdRow = {
  tipo: "classificacao" | "igrp" | "criticidade"
  chave: string
  valor: number
}

export type PsyInstrumentResponse = {
  instrument: {
    id: string
    versao: string
    etiquetaValidacao: string
    estado: string
    criadoEm: string
  }
  dimensions: PsyDimensionRow[]
  thresholds: PsyThresholdRow[]
}

export function useInstrument() {
  return useQuery({
    queryKey: ["psy", "instrument"],
    queryFn: () => psyFetch<PsyInstrumentResponse>("/instrument"),
    staleTime: 60_000,
  })
}
