import type { LucideIcon } from "lucide-react"

interface Props {
  title: string
  icon: LucideIcon
  description?: string
}

export function ComingSoon({ title, icon: Icon, description }: Props) {
  return (
    <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
      <div className="max-w-md space-y-3 text-center">
        <Icon className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {description ?? "Em desenvolvimento."}
        </p>
      </div>
    </div>
  )
}
