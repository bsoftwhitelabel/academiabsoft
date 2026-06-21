/**
 * Cria utilizador SUPER_ADMIN: Supabase Auth + public.users.
 * Uso: npx tsx api/scripts/create-super-admin.ts
 * Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em api/.env
 */
import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import cuid from "cuid"

const EMAIL = "renato@oportoforte.com"
const PASSWORD = "Portugal89"
const TENANT_ID = "cmok6xvlq0000pc43lyagc2pb" // Grupo Oporto Forte

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Falta SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em api/.env")
  process.exit(1)
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  const { data: existing } = await sb
    .from("users")
    .select("id, authUserId, role")
    .eq("email", EMAIL)
    .maybeSingle()

  if (existing?.id) {
    console.log(`public.users já existe: id=${existing.id} role=${existing.role}`)
    if (existing.role !== "SUPER_ADMIN") {
      const { error } = await sb
        .from("users")
        .update({ role: "SUPER_ADMIN", updatedAt: new Date().toISOString() })
        .eq("id", existing.id)
      if (error) throw error
      console.log("Role actualizada para SUPER_ADMIN")
    }
    if (existing.authUserId) {
      const { error } = await sb.auth.admin.updateUserById(existing.authUserId, {
        password: PASSWORD,
        email_confirm: true,
      })
      if (error) throw error
      console.log("Password Auth actualizada")
      return
    }
  }

  const { data: authData, error: authErr } = await sb.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  })
  if (authErr) throw authErr
  const authUserId = authData.user.id

  if (existing?.id) {
    const { error } = await sb
      .from("users")
      .update({
        authUserId,
        role: "SUPER_ADMIN",
        isActive: true,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", existing.id)
    if (error) throw error
    console.log(`Ligado authUserId a users.id=${existing.id}`)
    return
  }

  const now = new Date().toISOString()
  const { data: row, error: insertErr } = await sb
    .from("users")
    .insert({
      id: cuid(),
      tenantId: TENANT_ID,
      authUserId,
      email: EMAIL,
      role: "SUPER_ADMIN",
      firstName: "Renato",
      lastName: "Menezes",
      isActive: true,
      passwordHash: "supabase_auth_managed",
      updatedAt: now,
    })
    .select("id")
    .single()

  if (insertErr) throw insertErr
  console.log(`SUPER_ADMIN criado: users.id=${row.id} authUserId=${authUserId}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
