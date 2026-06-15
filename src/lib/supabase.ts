import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error("Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias")
}

// Cliente sem generic de schema: não há tipos gerados (npx supabase gen types).
// Os tipos de domínio são aplicados explicitamente em cada hook via `as`.
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
