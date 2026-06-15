export type Database = {
  public: {
    Tables: Record<string, { Row: any; Insert: any; Update: any }>
    Views: Record<string, { Row: any }>
    Functions: Record<string, any>
    Enums: Record<string, any>
  }
}
