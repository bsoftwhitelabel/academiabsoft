import { useMutation, useQueryClient } from "@tanstack/react-query"
import { psyFetch } from "@/lib/psy/api-client"

export type GenerateTokensResponse = {
  generated: number
  perArea: Record<string, number>
  expiraEm: string
}

export function useGenerateTokens(campaignId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (opts?: { expiraEmDias?: number }) =>
      psyFetch<GenerateTokensResponse>(
        `/campaigns/${campaignId}/tokens/generate`,
        {
          method: "POST",
          body: JSON.stringify(opts ?? {}),
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["psy", "campaign", campaignId, "links"],
      })
      qc.invalidateQueries({ queryKey: ["psy", "campaigns"] })
    },
  })
}
