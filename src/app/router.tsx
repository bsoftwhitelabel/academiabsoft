import { Navigate, type RouteObject } from "react-router-dom"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { TrainerLayout } from "@/components/layout/TrainerLayout"
import { LoginPage } from "@/pages/auth/LoginPage"
import { TrainerDashboardPage } from "@/pages/trainer/TrainerDashboardPage"
import { TrainerSessionsPage } from "@/pages/trainer/TrainerSessionsPage"
import { TrainerSessionDetailPage } from "@/pages/trainer/TrainerSessionDetailPage"
import { TrainerMaterialsPage } from "@/pages/trainer/TrainerMaterialsPage"
import { DashboardPage } from "@/pages/dashboard/DashboardPage"
import { TrainingPlansPage } from "@/pages/training-plans/TrainingPlansPage"
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
  { path: "*", element: <Navigate to="/admin/dashboard" replace /> },
]
