// Tipos de domínio derivados do schema REAL introspectado no Supabase.
// Colunas camelCase (Prisma). Nenhum nome inventado (regra 3 e 4).

export type ActionStatus = "DRAFT" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED"
export type TrainingFormat = "PRESENCIAL" | "ELEARNING"
// enum BD EnrollmentStatus (migration v3)
export type EnrollmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ATTENDED"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELLED"

export interface Course {
  id: string
  tenantId: string
  name: string
  slug: string | null
  code: string | null
  sigla: string | null
  durationHours: number | null
  areaId: string | null
  format: TrainingFormat | null
  certType: string | null
  shortDescription: string | null
  fullDescription: string | null
  objectives: string | null
  specificObjectives: string | null
  methodology: string | null
  evaluationMethod: string | null
  targetAudience: string | null
  prerequisites: string | null
  status: string | null
  qualificationLevel: string | null
  createdAt: string
  updatedAt: string
}

export interface TrainingAction {
  id: string
  tenantId: string
  courseId: string | null
  planId: string | null
  clientOrgId: string | null
  actionCode: string | null
  actionNumber: number | null
  startDate: string | null
  endDate: string | null
  roomId: string | null
  format: TrainingFormat | null
  financingSystem: string | null
  maxTrainees: number | null
  minTrainees: number | null
  status: ActionStatus | null
  contractId: string | null
  entidadeFormadora: string | null
  iniciativaFormacao: string | null
  tipologiaHorario: string | null
  localFormacao: string | null
  createdAt: string
  updatedAt: string
}

export type SessionType = "TEORICA" | "PRATICA" | "MISTA"

// course_modules: sem tenantId/createdAt/updatedAt -> usar withId.
export interface CourseModule {
  id: string
  courseId: string
  name: string
  description: string | null
  durationHours: number
  order: number
}

// training_sessions. startTime/endTime são texto "HH:MM" (não tipo time).
export interface TrainingSession {
  id: string
  trainingActionId: string
  trainerId: string | null
  courseModuleId: string | null
  sessionType: SessionType | null
  sessionDate: string
  startTime: string
  endTime: string
  durationHours: number
  isOpen: boolean
  isClosed: boolean
  summary: string | null
  createdAt: string
  updatedAt: string
}

// enrollments: status é texto livre (não enum). INSERT bloqueado por RLS
// para TENANT_ADMIN (ver docs/training-actions-schema.md).
export interface Enrollment {
  id: string
  trainingActionId: string
  traineeId: string
  enrolledAt: string | null
  status: EnrollmentStatus | null
  completedAt: string | null
  finalGrade: number | null
  passed: boolean | null
}

// Ponte multi-formador. role é texto livre.
export interface TrainingActionTrainer {
  id: string
  trainingActionId: string
  trainerId: string
  role: string | null
}

export interface TrainingPlan {
  id: string
  tenantId: string
  name: string
  year: number | null
  startDate: string | null
  endDate: string | null
  isInternal: boolean
  budget: number | null
  status: string | null
  createdAt: string
  updatedAt: string
}

export interface Trainee {
  id: string
  tenantId: string
  userId: string | null
  clientOrgId: string | null
  firstName: string | null
  lastName: string | null
  preferredName: string | null
  gender: string | null
  birthDate: string | null
  nationality: string | null
  idType: string | null
  idNumber: string | null
  idValidUntil: string | null
  nif: string | null
  ssn: string | null
  email: string | null
  phone: string | null
  address: string | null
  postalCode: string | null
  city: string | null
  country: string | null
  jobTitle: string | null
  employmentStatus: string | null
  educationLevel: string | null
  educationCourse: string | null
  caeCode: string | null
  gdprConsent: boolean | null
  gdprConsentAt: string | null
  isActive: boolean | null
  createdAt: string
  updatedAt: string
}

export interface ClientOrg {
  id: string
  tenantId: string
  name: string
  code: string | null
  nif: string | null
  address: string | null
  city: string | null
  country: string | null
  postalCode: string | null
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  isActive: boolean | null
  createdAt: string
  updatedAt: string
}

export interface TrainingArea {
  id: string
  citeCode: string | null
  name: string
  description: string | null
  isActive: boolean | null
  parentId: string | null
  catalogVisible: boolean | null
  catalogOrder: number | null
}

// Tabela `users` (Prisma). Dados pessoais do formador vivem aqui,
// ligados por trainers.userId. passwordHash omitido de propósito (nunca exposto na UI).
export interface User {
  id: string
  tenantId: string
  email: string
  role: string
  isActive: boolean | null
  firstName: string | null
  lastName: string | null
  phone: string | null
  avatarUrl: string | null
  clientHrOrgId: string | null
  notifEmail: boolean | null
  notifWhatsApp: boolean | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

// Tabela `trainers`. Sem coluna status: o workflow PENDING > ACTIVE
// mapeia para users.isActive (false = pendente, true = aprovado).
export interface Trainer {
  id: string
  tenantId: string
  userId: string
  ccpNumber: string | null
  isExternal: boolean
  eTrainer: boolean
  preferredSchedule: string | null
  yearsExperiencePresential: number
  yearsExperienceDistance: number
  vatRate: number | null
  regions: string[] | null
}

// Shape do join PostgREST trainers?select=*,users(*)
export interface TrainerWithUser extends Trainer {
  users: User | null
}

// Tabela `contracts` (schema mínimo real introspectado: sem tenantId/status/title).
export interface Contract {
  id: string
  clientOrgId: string | null
  startDate: string | null
  endDate: string | null
  value: number | null
  fileUrl: string | null
  description: string | null
  createdAt: string
}

// Tabela `rooms`.
export interface Room {
  id: string
  tenantId: string
  name: string
  capacity: number | null
  address: string | null
  city: string | null
  equipment: string | null
  isActive: boolean | null
}

// Avaliação Automatizada — Fase 1
export type QuestionType = "SCALE" | "TEXT"
export type QuestionnaireTargetRole = "TRAINEE" | "TRAINER"
export type QuestionnaireContext = "ACTION" | "SESSION"

export interface Questionnaire {
  id: string
  tenantId: string
  name: string
  // reusa enum TrainingFormat para coerência (PRESENCIAL/ELEARNING)
  format: TrainingFormat
  targetRole: QuestionnaireTargetRole
  context: QuestionnaireContext
}

export interface QuestionnaireQuestion {
  id: string
  questionnaireId: string
  text: string
  type: QuestionType
  // Quando type=TEXT, scaleMin/scaleMax ficam 0 (convenção acordada).
  scaleMin: number
  scaleMax: number
  order: number
  isRequired: boolean
}
