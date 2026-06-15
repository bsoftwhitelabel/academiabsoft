import { AlertTriangle } from "lucide-react"

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex h-[calc(100vh-14rem)] items-center justify-center">
      <div className="max-w-md space-y-3 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Erro ao carregar</h2>
        <p className="text-sm text-muted-foreground">
          {message ?? "Não foi possível obter os dados."}
        </p>
      </div>
    </div>
  )
}
