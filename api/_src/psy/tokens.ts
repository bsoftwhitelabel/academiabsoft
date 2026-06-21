/**
 * Tokens de uso único para o módulo psy. Gerados no backend via crypto.
 *
 * Formato: 43 caracteres base64url (32 bytes = 256 bits de entropia),
 * URL-safe. O CHECK constraint em psy_dispatch_tokens.token exige >=32 chars.
 *
 * Nada de IP, userAgent ou outro identificador associado ao gerador.
 */
import { randomBytes } from "node:crypto"

/** Regex de validação de format. Aceita 32 a 64 chars do alfabeto URL-safe. */
export const PSY_TOKEN_RE = /^[A-Za-z0-9_-]{32,64}$/

/**
 * Gera um token URL-safe de 43 chars (32 bytes = 256 bits de entropia).
 * Comprimento e charset compatíveis com PSY_TOKEN_RE e com o CHECK na BD.
 */
export function generateToken(): string {
  return randomBytes(32).toString("base64url")
}

/** True se o formato passa. Não valida existência na BD. */
export function isValidPsyTokenFormat(s: string): boolean {
  return PSY_TOKEN_RE.test(s)
}
