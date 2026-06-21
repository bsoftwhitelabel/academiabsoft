/**
 * Testes que protegem o invariante de anonimato A1:
 *   psy_responses (e psy_answers) NUNCA contêm referência a identidade,
 *   nem por coluna nem por chave estrangeira.
 *
 * Dois ângulos:
 *   1. Schema check: parse v11_psy_riscos_psicossociais.sql, valida
 *      colunas esperadas e ausência de proibidas em psy_responses,
 *      psy_answers e psy_dispatch_tokens.
 *   2. Code check: buildPsyResponseRow / buildPsyAnswerRows não emitem
 *      chaves de identidade. (Validação estrutural via Object.keys.)
 */
import { test } from "node:test"
import { strict as assert } from "node:assert"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import {
  buildPsyAnswerRows,
  buildPsyResponseRow,
} from "./builders.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const V11_PATH = resolve(
  __dirname,
  "../../..",
  "docs",
  "migrations",
  "v11_psy_riscos_psicossociais.sql"
)

function extractCreateTableBlock(sql: string, table: string): string {
  const re = new RegExp(
    `CREATE TABLE IF NOT EXISTS public\\.${table}\\s*\\(([\\s\\S]*?)\\);`,
    "i"
  )
  const m = sql.match(re)
  if (!m) throw new Error(`CREATE TABLE para ${table} não encontrado na v11`)
  return m[1]
}

const FORBIDDEN_IN_RESPONSES = [
  "token",
  "tokenid",
  "dispatchtoken",
  "email",
  "ip",
  "useragent",
  "user_agent",
  "respondentip",
  "userid",
  "traineeid",
  "trainerid",
  "nome",
  "name",
  "nif",
  "phone",
  "telefone",
]

const EXPECTED_IN_RESPONSES = [
  "id",
  '"campaignId"',
  '"areaId"',
  '"instrumentVersao"',
  '"submetidoEm"',
]

test("schema (v11): psy_responses só tem id/campaignId/areaId/instrumentVersao/submetidoEm", () => {
  const sql = readFileSync(V11_PATH, "utf-8")
  const cols = extractCreateTableBlock(sql, "psy_responses").toLowerCase()
  for (const f of FORBIDDEN_IN_RESPONSES) {
    assert.equal(
      cols.includes(f),
      false,
      `psy_responses NÃO pode conter "${f}"`
    )
  }
  const colsRaw = extractCreateTableBlock(sql, "psy_responses")
  for (const e of EXPECTED_IN_RESPONSES) {
    assert.ok(
      colsRaw.includes(e),
      `psy_responses deve conter ${e}`
    )
  }
})

test("schema (v11): psy_answers só tem id/responseId/questionId/valor", () => {
  const sql = readFileSync(V11_PATH, "utf-8")
  const cols = extractCreateTableBlock(sql, "psy_answers").toLowerCase()
  for (const f of [
    "token",
    "email",
    "ip",
    "useragent",
    "user_agent",
    "userid",
    "traineeid",
  ]) {
    assert.equal(
      cols.includes(f),
      false,
      `psy_answers NÃO pode conter "${f}"`
    )
  }
  const colsRaw = extractCreateTableBlock(sql, "psy_answers")
  for (const e of ["id", '"responseId"', '"questionId"', "valor"]) {
    assert.ok(colsRaw.includes(e), `psy_answers deve conter ${e}`)
  }
})

test("schema (v11): psy_dispatch_tokens NÃO tem coluna ip/userAgent", () => {
  const sql = readFileSync(V11_PATH, "utf-8")
  const cols = extractCreateTableBlock(sql, "psy_dispatch_tokens").toLowerCase()
  for (const f of ["respondentip", " ip ", "useragent", "user_agent", "fingerprint"]) {
    assert.equal(
      cols.includes(f),
      false,
      `psy_dispatch_tokens NÃO pode conter "${f.trim()}"`
    )
  }
})

test("buildPsyResponseRow: chaves SÃO exactamente {id, campaignId, areaId, instrumentVersao}", () => {
  const row = buildPsyResponseRow({
    campaignId: "c1",
    areaId: "a1",
    instrumentVersao: "v1",
  })
  const keys = Object.keys(row).sort()
  assert.deepEqual(keys, ["areaId", "campaignId", "id", "instrumentVersao"])
  assert.match(row.id, /^[a-z0-9]+$/, "id é cuid")
})

test("buildPsyAnswerRows: chaves SÃO exactamente {id, responseId, questionId, valor}", () => {
  const rows = buildPsyAnswerRows("r1", [
    { questionId: "q1", valor: 3 },
    { questionId: "q2", valor: 5 },
  ])
  assert.equal(rows.length, 2)
  for (const r of rows) {
    assert.deepEqual(
      Object.keys(r).sort(),
      ["id", "questionId", "responseId", "valor"]
    )
  }
})

test("buildPsyAnswerRows: rejeita valor fora 1..5", () => {
  assert.throws(
    () => buildPsyAnswerRows("r1", [{ questionId: "q1", valor: 0 }]),
    /valor inválido/
  )
  assert.throws(
    () => buildPsyAnswerRows("r1", [{ questionId: "q1", valor: 6 }]),
    /valor inválido/
  )
  assert.throws(
    () => buildPsyAnswerRows("r1", [{ questionId: "q1", valor: 3.5 }]),
    /valor inválido/
  )
})
