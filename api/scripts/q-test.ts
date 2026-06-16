import { config as loadEnv } from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { createClient } from "@supabase/supabase-js"

// dotenv não encontra api/.env quando o script corre a partir da raiz.
// Carregamos explicitamente o ficheiro relativo a este script.
const here = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(here, "..", ".env") })

// Script utilitário para smoke test da rota pública /api/q/:token.
// Cria uma response de teste atada ao questionário-template DGERT já
// seedado (q_dgert_satisfacao_v1), verifica respostas inseridas e limpa
// no fim.
//
// Uso:
//   npx tsx api/scripts/q-test.ts setup
//   npx tsx api/scripts/q-test.ts verify
//   npx tsx api/scripts/q-test.ts cleanup
//   npx tsx api/scripts/q-test.ts list-questions    # mostra IDs e tipos
//   npx tsx api/scripts/q-test.ts find-action       # top 3 actions com >=2 formandos

const TEST_RESPONSE_ID = "test_resp_e2e_1"
const TEST_TOKEN = "TEST_TOKEN_E2E_2026A"
const TEST_QUESTIONNAIRE_ID = "q_dgert_satisfacao_v1"

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("FALTA SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no api/.env")
  process.exit(1)
}
const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function setup() {
  const { data: q, error: qErr } = await sb
    .from("questionnaires")
    .select("id, name")
    .eq("id", TEST_QUESTIONNAIRE_ID)
    .maybeSingle()
  if (qErr) {
    console.log(JSON.stringify({ ok: false, op: "setup", stage: "check-questionnaire", error: qErr.message }))
    process.exit(1)
  }
  if (!q) {
    console.log(JSON.stringify({ ok: false, op: "setup", stage: "check-questionnaire", error: `Seed ${TEST_QUESTIONNAIRE_ID} nao encontrado. Verificar v7.` }))
    process.exit(1)
  }
  const { error } = await sb
    .from("questionnaire_responses")
    .upsert(
      {
        id: TEST_RESPONSE_ID,
        questionnaireId: TEST_QUESTIONNAIRE_ID,
        trainingActionId: null,
        traineeId: null,
        trainerId: null,
        token: TEST_TOKEN,
        respondedAt: null,
      },
      { onConflict: "id" }
    )
  if (error) {
    console.log(JSON.stringify({ ok: false, op: "setup", error: error.message }))
    process.exit(1)
  }
  console.log(
    JSON.stringify({
      ok: true,
      op: "setup",
      id: TEST_RESPONSE_ID,
      token: TEST_TOKEN,
      questionnaire: q.name,
    })
  )
}

async function listQuestions() {
  const { data, error } = await sb
    .from("questionnaire_questions")
    .select("id, type, scaleMin, scaleMax, isRequired, order")
    .eq("questionnaireId", TEST_QUESTIONNAIRE_ID)
    .order("order", { ascending: true })
  if (error) {
    console.log(JSON.stringify({ ok: false, op: "list", error: error.message }))
    process.exit(1)
  }
  console.log(JSON.stringify({ ok: true, op: "list", count: data?.length ?? 0, questions: data }, null, 2))
}

async function verify() {
  const { count, error } = await sb
    .from("questionnaire_answers")
    .select("*", { count: "exact", head: true })
    .eq("responseId", TEST_RESPONSE_ID)
  if (error) {
    console.log(JSON.stringify({ ok: false, op: "verify", error: error.message }))
    process.exit(1)
  }
  console.log(JSON.stringify({ ok: true, op: "verify", answers: count }))
}

async function findAction() {
  const { data: enrolls, error } = await sb
    .from("enrollments")
    .select("trainingActionId, status")
    .neq("status", "CANCELLED")
    .limit(2000)
  if (error) {
    console.log(JSON.stringify({ ok: false, op: "find-action", error: error.message }))
    process.exit(1)
  }
  const counts = new Map<string, number>()
  for (const e of enrolls ?? []) {
    counts.set(e.trainingActionId, (counts.get(e.trainingActionId) ?? 0) + 1)
  }
  const ranked = [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
  const actionIds = ranked.map(([id]) => id)
  const { data: actions, error: aErr } = await sb
    .from("training_actions")
    .select("id, actionCode")
    .in("id", actionIds)
  if (aErr) {
    console.log(JSON.stringify({ ok: false, op: "find-action", error: aErr.message }))
    process.exit(1)
  }
  const byId = new Map((actions ?? []).map((a: { id: string; actionCode: string }) => [a.id, a.actionCode]))
  const out = ranked.map(([id, n]) => ({ id, actionCode: byId.get(id) ?? "?", enrollments: n }))
  console.log(JSON.stringify({ ok: true, op: "find-action", top: out }, null, 2))
}

async function cleanup() {
  const { error: e1 } = await sb
    .from("questionnaire_answers")
    .delete()
    .eq("responseId", TEST_RESPONSE_ID)
  const { error: e2 } = await sb
    .from("questionnaire_responses")
    .delete()
    .eq("id", TEST_RESPONSE_ID)
  console.log(
    JSON.stringify({
      ok: !e1 && !e2,
      op: "cleanup",
      answersErr: e1?.message ?? null,
      responseErr: e2?.message ?? null,
    })
  )
}

const op = process.argv[2]
switch (op) {
  case "setup":
    await setup()
    break
  case "verify":
    await verify()
    break
  case "cleanup":
    await cleanup()
    break
  case "list-questions":
    await listQuestions()
    break
  case "find-action":
    await findAction()
    break
  default:
    console.error(
      "Usage: q-test.ts <setup|verify|cleanup|list-questions|find-action>"
    )
    process.exit(1)
}
