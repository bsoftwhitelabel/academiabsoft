import { Link } from "react-router-dom"
import {
  Building2,
  Briefcase,
  FileSignature,
  GraduationCap,
  Coins,
  MapPin,
  DoorOpen,
  CalendarClock,
  Ruler,
  ArrowRight,
  type LucideIcon,
} from "lucide-react"

interface SubModule {
  label: string
  icon: LucideIcon
  to: string | null
  table: string | null
}

// to definido = CRUD implementado. null = aguarda confirmação de schema.
const modules: SubModule[] = [
  { label: "Empresas", icon: Building2, to: null, table: null },
  {
    label: "Entidades Cliente",
    icon: Briefcase,
    to: "/admin/management/client-orgs",
    table: "client_orgs",
  },
  {
    label: "Contratos",
    icon: FileSignature,
    to: "/admin/management/contracts",
    table: "contracts",
  },
  {
    label: "Áreas de Formação",
    icon: GraduationCap,
    to: "/admin/management/training-areas",
    table: "training_areas",
  },
  { label: "Tipos de Custo", icon: Coins, to: null, table: null },
  { label: "Locais", icon: MapPin, to: null, table: null },
  {
    label: "Salas",
    icon: DoorOpen,
    to: "/admin/management/rooms",
    table: "rooms",
  },
  { label: "Tipologias de Horário", icon: CalendarClock, to: null, table: null },
  { label: "Escalas de Avaliação", icon: Ruler, to: null, table: null },
]

export function ManagementPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Gestão</h1>
        <p className="text-sm text-muted-foreground">
          Submódulos de configuração. Os de tabela confirmada têm CRUD
          completo. Os restantes entram após confirmação do schema.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => {
          const inner = (
            <>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                <m.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium">{m.label}</p>
                <p className="text-xs text-muted-foreground">
                  {m.to
                    ? `Tabela ${m.table}. CRUD ativo.`
                    : "Tabela ainda não encontrada no banco."}
                </p>
              </div>
              {m.to && (
                <ArrowRight className="h-4 w-4 self-center text-muted-foreground" />
              )}
            </>
          )

          return m.to ? (
            <Link
              key={m.label}
              to={m.to}
              className="flex items-start gap-4 rounded-lg border bg-background p-5 transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              {inner}
            </Link>
          ) : (
            <div
              key={m.label}
              className="flex items-start gap-4 rounded-lg border bg-background p-5 opacity-60"
            >
              {inner}
            </div>
          )
        })}
      </div>
    </div>
  )
}
