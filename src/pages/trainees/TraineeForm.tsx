import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { AlertCircle } from "lucide-react"
import { FormModal } from "@/components/forms/FormModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useDefaultTenantId } from "@/hooks/useDefaultTenant"
import { useUpsertTrainee } from "./useTrainees"
import type { Trainee } from "@/types/domain"

// Campos DGERT mínimos: se faltar algum, mostra badge "!".
const schema = z.object({
  // Geral
  firstName: z.string().min(1, "Nome obrigatório"),
  lastName: z.string().min(1, "Apelido obrigatório"),
  preferredName: z.string().nullable(),
  gender: z.string().nullable(),
  birthDate: z.string().nullable(),
  nationality: z.string().nullable(),
  isActive: z.boolean(),
  // Contactos — email é NOT NULL na BD
  email: z.string().min(1, "Email obrigatório").email("Email inválido"),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  postalCode: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  // Perfil DGERT
  idType: z.string().nullable(),
  idNumber: z.string().nullable(),
  idValidUntil: z.string().nullable(),
  nif: z.string().nullable(),
  ssn: z.string().nullable(),
  // Adicionais
  jobTitle: z.string().nullable(),
  employmentStatus: z.string().nullable(),
  educationLevel: z.string().nullable(),
  educationCourse: z.string().nullable(),
  caeCode: z.string().nullable(),
  gdprConsent: z.boolean(),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : ""
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  trainee: Trainee | null
  clientOrgId: string
}

export function TraineeForm({ open, onOpenChange, trainee, clientOrgId }: Props) {
  const tenant = useDefaultTenantId()
  const upsert = useUpsertTrainee()

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    values: {
      firstName: trainee?.firstName ?? "",
      lastName: trainee?.lastName ?? "",
      preferredName: trainee?.preferredName ?? null,
      gender: trainee?.gender ?? null,
      birthDate: toDateInput(trainee?.birthDate) || null,
      nationality: trainee?.nationality ?? null,
      isActive: trainee?.isActive ?? true,
      email: trainee?.email ?? "",
      phone: trainee?.phone ?? null,
      address: trainee?.address ?? null,
      postalCode: trainee?.postalCode ?? null,
      city: trainee?.city ?? null,
      country: trainee?.country ?? "PT",
      idType: trainee?.idType ?? null,
      idNumber: trainee?.idNumber ?? null,
      idValidUntil: toDateInput(trainee?.idValidUntil) || null,
      nif: trainee?.nif ?? null,
      ssn: trainee?.ssn ?? null,
      jobTitle: trainee?.jobTitle ?? null,
      employmentStatus: trainee?.employmentStatus ?? null,
      educationLevel: trainee?.educationLevel ?? null,
      educationCourse: trainee?.educationCourse ?? null,
      caeCode: trainee?.caeCode ?? null,
      gdprConsent: trainee?.gdprConsent ?? false,
    },
  })

  const w = form.watch()
  const geralPending = !w.birthDate
  const perfilPending = !w.nif || !w.idNumber
  const hasPending = geralPending || perfilPending

  async function onSubmit(values: FormValues) {
    const tenantId = trainee?.tenantId ?? tenant.data
    if (!tenantId) {
      toast.error("Sem tenant resolvido para criar o formando")
      return
    }
    // RGPD: ao consentir, regista a data; ao revogar, limpa-a.
    let gdprConsentAt = trainee?.gdprConsentAt ?? null
    if (values.gdprConsent && !gdprConsentAt) {
      gdprConsentAt = new Date().toISOString()
    } else if (!values.gdprConsent) {
      gdprConsentAt = null
    }
    try {
      await upsert.mutateAsync({
        id: trainee?.id,
        tenantId,
        clientOrgId,
        input: {
          firstName: values.firstName,
          lastName: values.lastName,
          preferredName: values.preferredName,
          gender: values.gender,
          birthDate: values.birthDate
            ? new Date(values.birthDate).toISOString()
            : null,
          nationality: values.nationality,
          isActive: values.isActive,
          email: values.email,
          phone: values.phone,
          address: values.address,
          postalCode: values.postalCode,
          city: values.city,
          country: values.country,
          idType: values.idType,
          idNumber: values.idNumber,
          idValidUntil: values.idValidUntil
            ? new Date(values.idValidUntil).toISOString()
            : null,
          nif: values.nif,
          ssn: values.ssn,
          jobTitle: values.jobTitle,
          employmentStatus: values.employmentStatus,
          educationLevel: values.educationLevel,
          educationCourse: values.educationCourse,
          caeCode: values.caeCode,
          gdprConsent: values.gdprConsent,
          gdprConsentAt,
        },
      })
      toast.success(trainee ? "Formando atualizado" : "Formando criado")
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gravar")
    }
  }

  const err = form.formState.errors

  function field(name: keyof FormInput, label: string, type = "text") {
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Input id={name} type={type} {...form.register(name)} />
        {err[name] && (
          <p className="text-xs text-destructive">
            {String(err[name]?.message)}
          </p>
        )}
      </div>
    )
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={trainee ? "Editar Formando" : "Novo Formando"}
      description="Dados pessoais e profissionais para o Dossier Técnico-Pedagógico (DGERT)."
      className="max-w-3xl"
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {hasPending && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            Perfil incompleto para o DTP: faltam campos obrigatórios DGERT.
          </div>
        )}

        <Tabs defaultValue="geral">
          <TabsList>
            <TabsTrigger value="geral" className="gap-1.5">
              Geral
              {geralPending && (
                <Badge variant="destructive" className="px-1 py-0">
                  !
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="contactos">Contactos</TabsTrigger>
            <TabsTrigger value="perfil" className="gap-1.5">
              Perfil
              {perfilPending && (
                <Badge variant="destructive" className="px-1 py-0">
                  !
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="adicionais">Adicionais</TabsTrigger>
          </TabsList>

          <div className="max-h-[55vh] overflow-y-auto pr-1 pt-2">
            <TabsContent value="geral">
              <div className="grid grid-cols-2 gap-4">
                {field("firstName", "Nome")}
                {field("lastName", "Apelido")}
                {field("preferredName", "Nome preferido")}
                {field("gender", "Género")}
                {field("birthDate", "Data de nascimento", "date")}
                {field("nationality", "Nacionalidade")}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={form.watch("isActive")}
                  onCheckedChange={(v) =>
                    form.setValue("isActive", v === true)
                  }
                />
                <Label htmlFor="isActive">Formando ativo</Label>
              </div>
            </TabsContent>

            <TabsContent value="contactos">
              <div className="grid grid-cols-2 gap-4">
                {field("email", "Email", "email")}
                {field("phone", "Telefone")}
                {field("address", "Morada")}
                {field("postalCode", "Código postal")}
                {field("city", "Cidade")}
                {field("country", "País")}
              </div>
            </TabsContent>

            <TabsContent value="perfil">
              <div className="grid grid-cols-2 gap-4">
                {field("idType", "Tipo de identificação")}
                {field("idNumber", "Nº de identificação")}
                {field("idValidUntil", "Validade do documento", "date")}
                {field("nif", "NIF")}
                {field("ssn", "Segurança Social (NISS)")}
              </div>
            </TabsContent>

            <TabsContent value="adicionais">
              <div className="grid grid-cols-2 gap-4">
                {field("jobTitle", "Função/Cargo")}
                {field("employmentStatus", "Situação face ao emprego")}
                {field("educationLevel", "Nível de escolaridade")}
                {field("educationCourse", "Curso/Formação base")}
                {field("caeCode", "Código CAE")}
              </div>
              <div className="mt-4 space-y-2 rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="gdprConsent"
                    checked={form.watch("gdprConsent")}
                    onCheckedChange={(v) =>
                      form.setValue("gdprConsent", v === true)
                    }
                  />
                  <Label htmlFor="gdprConsent">
                    Consentimento RGPD para tratamento de dados
                  </Label>
                </div>
                {trainee?.gdprConsentAt && form.watch("gdprConsent") && (
                  <p className="text-xs text-muted-foreground">
                    Consentido em{" "}
                    {new Date(trainee.gdprConsentAt).toLocaleDateString("pt-PT")}
                  </p>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={upsert.isPending}>
            {upsert.isPending ? "A gravar..." : "Gravar"}
          </Button>
        </div>
      </form>
    </FormModal>
  )
}
