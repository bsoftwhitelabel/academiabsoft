// Encontra uma action com inscrições para testar o /generate-mass.
import { getSupabaseAdmin } from "../src/services/supabase.js"

const sb = getSupabaseAdmin()
const { data, error } = await sb
  .from("enrollments")
  .select("trainingActionId,traineeId,trainees(firstName,lastName)")
  .limit(50)
if (error) {
  console.error("ERR", error.message)
  process.exit(1)
}
const byAction = new Map<string, number>()
for (const r of (data ?? []) as { trainingActionId: string }[]) {
  byAction.set(r.trainingActionId, (byAction.get(r.trainingActionId) ?? 0) + 1)
}
const ranked = [...byAction.entries()].sort((a, b) => b[1] - a[1])
console.log("ACTIONS_WITH_ENROLLMENTS=" + JSON.stringify(ranked.slice(0, 5)))
if (ranked[0]) console.log("PICK=" + ranked[0][0] + " count=" + ranked[0][1])
