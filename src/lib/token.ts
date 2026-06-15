/**
 * Gera um token base64url de ~22 chars derivado de UUIDv4.
 * Usado como identificador opaco da response de questionário no link
 * público /q/{token}. Random vem do crypto nativo (não previsível).
 */
export function generateResponseToken(): string {
  const uuid = crypto.randomUUID().replace(/-/g, "")
  const bytes = new Uint8Array(uuid.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(uuid.substr(i * 2, 2), 16)
  }
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}
