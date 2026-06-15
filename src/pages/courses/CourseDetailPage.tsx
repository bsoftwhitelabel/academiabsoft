import { useParams, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ErrorState } from "@/components/feedback/ErrorState"
import { useCourse } from "./useCourseModules"
import { CourseModulesTab } from "./CourseModulesTab"

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const courseQ = useCourse(id)

  if (courseQ.isError) {
    return <ErrorState message={(courseQ.error as Error)?.message} />
  }

  const course = courseQ.data

  return (
    <div className="space-y-6">
      <Link
        to="/admin/courses"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Cursos
      </Link>

      {courseQ.isLoading ? (
        <p className="text-sm text-muted-foreground">A carregar curso...</p>
      ) : !course ? (
        <ErrorState message="Curso não encontrado." />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{course.name}</h1>
            {course.status && (
              <Badge variant="secondary">{course.status}</Badge>
            )}
            {course.format && <Badge variant="outline">{course.format}</Badge>}
          </div>

          <Tabs defaultValue="modulos">
            <TabsList>
              <TabsTrigger value="info">Informação</TabsTrigger>
              <TabsTrigger value="modulos">Módulos</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="pt-4">
              <div className="grid max-w-2xl grid-cols-2 gap-4 text-sm">
                <Field label="Código" value={course.code} />
                <Field label="Sigla" value={course.sigla} />
                <Field
                  label="Duração (horas)"
                  value={course.durationHours?.toString() ?? null}
                />
                <Field label="Formato" value={course.format} />
                <Field label="Estado" value={course.status} />
                <Field
                  label="Descrição curta"
                  value={course.shortDescription}
                />
              </div>
            </TabsContent>

            <TabsContent value="modulos" className="pt-4">
              <CourseModulesTab course={course} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{value || "—"}</p>
    </div>
  )
}
