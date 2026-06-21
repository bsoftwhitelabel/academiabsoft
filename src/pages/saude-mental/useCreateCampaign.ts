import { useMutation, useQueryClient } from "@tanstack/react-query"
import { psyFetch } from "@/lib/psy/api-client"

export type CreateCampaignInput = {
  clientOrgId: string
  comprimento: "curto" | "medio" | "longo"
  inicio?: string | null
  fim?: string | null
  metaAmostragemPct?: number | null
  areas: Array<{ area: string; esperados: number }>
}

export type CreateCampaignResponse = {
  ok: true
  campaignId: string
}

export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCampaignInput) =>
      psyFetch<CreateCampaignResponse>("/campaigns", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["psy", "campaigns"] })
    },
  })
}
