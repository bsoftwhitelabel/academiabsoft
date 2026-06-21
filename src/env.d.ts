/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Override absoluto da API. Vazio = same-origin (/api via proxy em dev). */
  readonly VITE_API_BASE?: string
  /** Legado; preferir VITE_API_BASE ou omitir ambos. */
  readonly VITE_PDF_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
