import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export interface SessionCheckIn {
  id: string
  sessionId: string
  traineeId: string
  status: "CHECKED_IN" | "CHECKED_OUT" | "ABSENT" | "MANUAL"
  checkedInAt: string | null
  checkedOutAt: string | null
  isManual: boolean
  registeredById: string | null
}

export function useSessionCheckIns(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["trainer", "session-checkins", sessionId],
    enabled: !!sessionId,
    queryFn: async (): Promise<SessionCheckIn[]> => {
      const { data, error } = await supabase
        .from("check_ins")
        .select(
          "id,sessionId,traineeId,status,checkedInAt,checkedOutAt,isManual,registeredById"
        )
        .eq("sessionId", sessionId as string)
      if (error) throw error
      return (data ?? []) as unknown as SessionCheckIn[]
    },
  })
}
