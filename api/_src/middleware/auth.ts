/**
 * Middleware de autenticação para rotas admin.
 *
 * Valida o JWT do Supabase Auth presente em `Authorization: Bearer <jwt>` e
 * injecta `c.var.user = { authUserId, userId, tenantId }`.
 *
 * Bridge `auth.users <-> public.users`:
 *   - `auth.users.id` é UUID, vem do JWT como `userData.user.id`.
 *   - `public.users.id` é cuid (TEXT). NÃO é o mesmo que o uuid do Auth.
 *   - A coluna que liga ambos é `public.users.authUserId` (uuid).
 *   - Lookup correcto: `.eq("authUserId", authUserId)`.
 *
 * Exposições no contexto:
 *   - `authUserId`: o uuid do Supabase Auth (sub do JWT).
 *   - `userId`:     o cuid de `public.users.id` (FK alvo em colunas como
 *                   `psy_instruments.criadoPor`, `audit_logs.userId`, etc).
 *   - `tenantId`:   o tenant do utilizador.
 *
 * Erros:
 *   - Sem header / formato inválido / JWT inválido: 401.
 *   - User autenticado mas sem entrada em `public.users` (ou sem tenant): 403.
 *
 * NÃO logues identificadores do utilizador (userId, email) no output do
 * handler. Mantém os logs livres de PII.
 */
import type { MiddlewareHandler } from "hono"
import { assertSupabaseEnv } from "../env.js"
import { getSupabaseAdmin } from "../services/supabase.js"

export type AuthUser = {
  authUserId: string
  userId: string
  tenantId: string
}

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser
  }
}

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const header = c.req.header("Authorization")
  if (!header || !header.startsWith("Bearer ")) {
    return c.json({ error: "Autenticacao obrigatoria" }, 401)
  }
  const jwt = header.slice(7).trim()
  if (!jwt) return c.json({ error: "Autenticacao obrigatoria" }, 401)

  const configErr = assertSupabaseEnv()
  if (configErr) {
    console.error("[auth] config:", configErr)
    return c.json({ error: "Servidor sem configuracao Supabase" }, 503)
  }

  const sb = getSupabaseAdmin()

  const { data: userData, error: userErr } = await sb.auth.getUser(jwt)
  if (userErr || !userData?.user) {
    return c.json({ error: "Sessao invalida" }, 401)
  }
  const authUserId = userData.user.id

  // Resolve public.users (id, tenantId) via authUserId. NÃO usar .eq("id"...)
  // porque public.users.id é cuid, não o uuid do Auth.
  const { data: row, error: rowErr } = await sb
    .from("users")
    .select("id, tenantId")
    .eq("authUserId", authUserId)
    .maybeSingle()
  if (rowErr) {
    return c.json({ error: "Erro a resolver utilizador" }, 500)
  }
  const userRow = row as { id?: string; tenantId?: string } | null
  if (!userRow) {
    return c.json({ error: "User nao registado em public.users" }, 403)
  }
  if (!userRow.tenantId || !userRow.id) {
    return c.json({ error: "User sem tenant" }, 403)
  }

  c.set("user", {
    authUserId,
    userId: userRow.id,
    tenantId: userRow.tenantId,
  })
  return next()
}
