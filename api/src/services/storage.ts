import { getSupabaseAdmin } from "./supabase.js"
import { env } from "../env.js"

// Upload genérico de um buffer + URL assinado 1h. Reutilizável por PDFs
// individuais e pelo ZIP do dossier.
export async function uploadBufferToStorage(
  buffer: Uint8Array,
  path: string,
  contentType: string
): Promise<{ path: string; url: string }> {
  const supabase = getSupabaseAdmin()
  const up = await supabase.storage
    .from(env.PDF_BUCKET)
    .upload(path, buffer, { contentType, upsert: true })
  if (up.error) {
    throw new Error(
      `Upload falhou (bucket '${env.PDF_BUCKET}' existe?): ${up.error.message}`
    )
  }
  const signed = await supabase.storage
    .from(env.PDF_BUCKET)
    .createSignedUrl(path, 3600)
  if (signed.error || !signed.data) {
    throw new Error(`Assinatura de URL falhou: ${signed.error?.message}`)
  }
  return { path, url: signed.data.signedUrl }
}

// Upload do PDF para o bucket privado + URL assinado 1h.
// Caminho: {tenantId}/{actionId}/{fileBase}_{timestamp}.pdf
export async function uploadPdfAndSign(args: {
  tenantId: string
  actionId: string
  templateCode: string
  fileBase?: string
  bytes: Uint8Array
}): Promise<{ url: string; path: string }> {
  const base = args.fileBase ?? args.templateCode
  const path = `${args.tenantId}/${args.actionId}/${base}_${Date.now()}.pdf`
  return uploadBufferToStorage(args.bytes, path, "application/pdf")
}

// Lista ZIPs antigos do dossier desta acção (para cache / limpeza).
export async function listOldZips(
  tenantId: string,
  actionId: string
): Promise<Array<{ name: string; path: string; createdAt: string }>> {
  const supabase = getSupabaseAdmin()
  const folder = `${tenantId}/${actionId}`
  const { data, error } = await supabase.storage
    .from(env.PDF_BUCKET)
    .list(folder, { limit: 1000 })
  if (error) throw new Error(`List falhou: ${error.message}`)
  return (data ?? [])
    .filter((f) => /^dossier_completo_.*\.zip$/.test(f.name))
    .map((f) => ({
      name: f.name,
      path: `${folder}/${f.name}`,
      // FileObject.created_at pode vir undefined nalguns providers; cai
      // para updated_at e por fim epoch (trata como antigo).
      createdAt:
        (f as { created_at?: string; updated_at?: string }).created_at ??
        (f as { updated_at?: string }).updated_at ??
        new Date(0).toISOString(),
    }))
}

export async function signExisting(
  path: string
): Promise<string> {
  const supabase = getSupabaseAdmin()
  const signed = await supabase.storage
    .from(env.PDF_BUCKET)
    .createSignedUrl(path, 3600)
  if (signed.error || !signed.data) {
    throw new Error(`Assinatura de URL falhou: ${signed.error?.message}`)
  }
  return signed.data.signedUrl
}

export async function deleteFile(path: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.storage
    .from(env.PDF_BUCKET)
    .remove([path])
  if (error) throw new Error(`Delete falhou: ${error.message}`)
}
