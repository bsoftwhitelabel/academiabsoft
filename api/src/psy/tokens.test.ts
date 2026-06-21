import { test } from "node:test"
import { strict as assert } from "node:assert"
import { generateToken, isValidPsyTokenFormat, PSY_TOKEN_RE } from "./tokens.js"

test("generateToken: 43 chars URL-safe (base64url de 32 bytes)", () => {
  for (let i = 0; i < 50; i++) {
    const t = generateToken()
    assert.equal(t.length, 43, `comprimento esperado 43, got ${t.length}`)
    assert.match(t, /^[A-Za-z0-9_-]+$/, `charset URL-safe`)
  }
})

test("generateToken: entropia (1000 únicos)", () => {
  const set = new Set<string>()
  for (let i = 0; i < 1000; i++) set.add(generateToken())
  assert.equal(set.size, 1000)
})

test("generateToken: passa PSY_TOKEN_RE", () => {
  for (let i = 0; i < 20; i++) {
    assert.equal(isValidPsyTokenFormat(generateToken()), true)
  }
})

test("PSY_TOKEN_RE: fronteiras de comprimento (32..64)", () => {
  assert.equal(PSY_TOKEN_RE.test("a".repeat(31)), false, "31 rejeitado")
  assert.equal(PSY_TOKEN_RE.test("a".repeat(32)), true, "32 aceito")
  assert.equal(PSY_TOKEN_RE.test("a".repeat(64)), true, "64 aceito")
  assert.equal(PSY_TOKEN_RE.test("a".repeat(65)), false, "65 rejeitado")
})

test("PSY_TOKEN_RE: charset (URL-safe apenas)", () => {
  assert.equal(PSY_TOKEN_RE.test("A".repeat(32)), true)
  assert.equal(PSY_TOKEN_RE.test("0".repeat(32)), true)
  assert.equal(PSY_TOKEN_RE.test("_-_-".repeat(8)), true)
  assert.equal(PSY_TOKEN_RE.test("a".repeat(31) + "!"), false, "char inválido !")
  assert.equal(PSY_TOKEN_RE.test("a".repeat(31) + " "), false, "espaço inválido")
  assert.equal(PSY_TOKEN_RE.test("a".repeat(31) + "/"), false, "slash inválido")
  assert.equal(PSY_TOKEN_RE.test("a".repeat(31) + "+"), false, "+ inválido (base64 normal, não URL-safe)")
})
