import { Navigate, type RouteObject } from "react-router-dom"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { TrainerLayout } from "@/components/layout/TrainerLayout"
import { PublicLayout } from "@/components/layout/PublicLayout"
import { LoginPage } from "@/pages/auth/LoginPage"
import { PublicRespondPage } from "@/pages/public/PublicRespondPage"
import { TrainerDashboardPage } from "@/pages/trainer/TrainerDashboardPage"
import { TrainerSessionsPage } from "@/pages/trainer/TrainerSessionsPage"
import { TrainerSessionDetailPage } from "@/pages/trainer/TrainerSessionDetailPage"
import { TrainerMaterialsPage } from "@/pages/trainer/TrainerMaterialsPage"
import { DashboardPage } from "@/pages/dashboard/DashboardPage"
import { TrainingPlansPage } from "@/pages/training-plans/TrainingPlansPage"
import { TrainingPlanEditPage } from "@/pages/training-plans/TrainingPlanEditPage"
import { CoursesPage } from "@/pages/courses/CoursesPage"
import { CourseDetailPage } from "@/pages/courses/CourseDetailPage"
import { TrainingActionsPage } from "@/pages/actions/TrainingActionsPage"
import { TrainingActionDetailPage } from "@/pages/actions/TrainingActionDetailPage"
import { TrainersPage } from "@/pages/trainers/TrainersPage"
import { TraineesPage } from "@/pages/trainees/TraineesPage"
import { QuestionnairesPage } from "@/pages/questionnaires/QuestionnairesPage"
import { NewQuestionnairePage } from "@/pages/questionnaires/NewQuestionnairePage"
import { QuestionnaireDetailPage } from "@/pages/questionnaires/QuestionnaireDetailPage"
import { ManagementPage } from "@/pages/management/ManagementPage"
import { ClientOrgsPage } from "@/pages/management/ClientOrgsPage"
import { ContractsPage } from "@/pages/management/ContractsPage"
import { TrainingAreasPage } from "@/pages/management/TrainingAreasPage"
import { RoomsPage } from "@/pages/management/RoomsPage"
import { AnalyticsPage } from "@/pages/analytics/AnalyticsPage"
import { ApprovalsPage } from "@/pages/approvals/ApprovalsPage"
import { ProjectsPage } from "@/pages/projects/ProjectsPage"
import { SaudeMentalIndex } from "@/pages/saude-mental/SaudeMentalIndex"
import { CampanhasPage } from "@/pages/saude-mental/CampanhasPage"
import { NovaCampanhaPage } from "@/pages/saude-mental/NovaCampanhaPage"
import { CampanhaDetalhePage } from "@/pages/saude-mental/CampanhaDetalhePage"
import { InstrumentoPage } from "@/pages/saude-mental/InstrumentoPage"
import { PsyRespondPage } from "@/pages/public/PsyRespondPage"

// AdminLayout chama useAuth(), que redireciona para /login sem sessão.
// É o gate de proteção de todas as rotas /admin.
export const routes: RouteObject[] = [
  { path: "/", element: <Navigate to="/admin/dashboard" replace /> },
  { path: "/login", element: <LoginPage /> },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "training-plans", element: <TrainingPlansPage /> },
      { path: "training-plans/:id", element: <TrainingPlanEditPage /> },
      { path: "courses", element: <CoursesPage /> },
      { path: "courses/:id", element: <CourseDetailPage /> },
      { path: "actions", element: <TrainingActionsPage /> },
      { path: "actions/:id", element: <TrainingActionDetailPage /> },
      { path: "trainers", element: <TrainersPage /> },
      { path: "trainees", element: <TraineesPage /> },
      { path: "questionarios", element: <QuestionnairesPage /> },
      { path: "questionarios/novo", element: <NewQuestionnairePage /> },
      {
        path: "questionarios/:questionnaireId",
        element: <QuestionnaireDetailPage />,
      },
      { path: "management", element: <ManagementPage /> },
      { path: "management/client-orgs", element: <ClientOrgsPage /> },
      { path: "management/contracts", element: <ContractsPage /> },
      { path: "management/training-areas", element: <TrainingAreasPage /> },
      { path: "management/rooms", element: <RoomsPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "approvals", element: <ApprovalsPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "saude-mental", element: <SaudeMentalIndex /> },
      { path: "saude-mental/campanhas", element: <CampanhasPage /> },
      { path: "saude-mental/campanhas/nova", element: <NovaCampanhaPage /> },
      { path: "saude-mental/campanhas/:id", element: <CampanhaDetalhePage /> },
      { path: "saude-mental/instrumento", element: <InstrumentoPage /> },
    ],
  },
  {
    path: "/trainer",
    element: <TrainerLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <TrainerDashboardPage /> },
      { path: "sessions", element: <TrainerSessionsPage /> },
      { path: "sessions/:sessionId", element: <TrainerSessionDetailPage /> },
      { path: "materials", element: <TrainerMaterialsPage /> },
    ],
  },
  {
    path: "q",
    element: <PublicLayout />,
    children: [
      { path: ":token", element: <PublicRespondPage /> },
      { path: "psy/:token", element: <PsyRespondPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/admin/dashboard" replace /> },
]
