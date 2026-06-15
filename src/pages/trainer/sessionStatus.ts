export type SessionStatus = "Concluída" | "Hoje" | "Agendada" | "—"

function dayStart(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function sessionStatus(iso: string | null): SessionStatus {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  const today = dayStart(new Date())
  const that = dayStart(d)
  if (that < today) return "Concluída"
  if (that === today) return "Hoje"
  return "Agendada"
}

export function statusBadgeClass(s: SessionStatus): string {
  switch (s) {
    case "Hoje":
      return "bg-amber-100 text-amber-800 border-amber-200"
    case "Agendada":
      return "bg-blue-100 text-blue-700 border-blue-200"
    case "Concluída":
      return "bg-gray-100 text-gray-700 border-gray-200"
    default:
      return "bg-gray-100 text-gray-500 border-gray-200"
  }
}
