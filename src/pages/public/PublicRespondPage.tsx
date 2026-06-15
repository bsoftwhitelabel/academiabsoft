import { useParams } from "react-router-dom"

export function PublicRespondPage() {
  const { token } = useParams<{ token: string }>()

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-xl font-semibold mb-2">Resposta a Questionário</h1>
        <p className="text-sm text-muted-foreground">
          Token recebido: <code className="font-mono">{token}</code>
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Página de resposta em desenvolvimento (bloco 2).
      </div>
    </div>
  )
}
