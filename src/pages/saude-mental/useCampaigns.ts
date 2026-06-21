import { useQuery } from "@tanstack/react-query"
import { psyFetch } from "@/lib/psy/api-client"

export type PsyCampaignRow = {
  id: string
  clientOrgId: string
  clientOrgName: string
  comprimento: "curto" | "medio" | "longo"
  inicio: string | null
  fim: string | null
  metaAmostragemPct: number | null
  estado: "rascunho" | "em_curso" | "encerrada"
  criadoEm: string
  esperados: number
  respostas: number
  tokens: { total: number; usados: number }
}

export type PsyCampaignsResponse = {
  campaigns: PsyCampaignRow[]
}

export function useCampaigns() {
  return useQuery({
    queryKey: ["psy", "campaigns"],
    queryFn: () => psyFetch<PsyCampaignsResponse>("/campaigns"),
    staleTime: 30_000,
  })
}
