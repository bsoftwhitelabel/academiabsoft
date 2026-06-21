import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { env } from "../env.js"

// Cliente com SERVICE_ROLE_KEY: bypassa RLS no servidor (contexto de
// confiança). Criado lazy para o servidor poder arrancar sem a key
// (smoke test /health) — só a rota de PDF é que precisa dela.
let client: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}
