import { useQuery } from "@tanstack/react-query"
import { psyFetch } from "@/lib/psy/api-client"

export type CampaignLinkToken = {
  id: string
  estado: "pendente" | "enviado" | "usado"
  expiraEm: string | null
  usadoEm: string | null
  url: string
}

export type CampaignAreaLinks = {
  areaId: string
  area: string
  esperados: number
  tokens: CampaignLinkToken[]
  counts: { total: number; pendente: number; enviado: number; usado: number }
}

export type CampaignLinksResponse = {
  areas: CampaignAreaLinks[]
}

export function useCampaignLinks(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["psy", "campaign", campaignId, "links"],
    queryFn: () =>
      psyFetch<CampaignLinksResponse>(`/campaigns/${campaignId}/links`),
    enabled: !!campaignId,
    staleTime: 10_000,
  })
}
