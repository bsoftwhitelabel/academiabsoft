/**
 * Mock data for catalog, dashboards, and attendance flows.
 * Mirrors Prisma schema shapes so swap-in is trivial later.
 */

import type {
  CourseModality,
  CertificationLevel,
  AttendanceStatus,
  SignatureState,
} from "@prisma/client";

// ============================================================================
// CATALOG
// ============================================================================

export type MockCourse = {
  id: string;
  slug: string;
  code: string;
  name: string;
  shortName: string;
  area: string;
  areaSlug: string;
  modality: CourseModality;
  durationHours: number;
  priceEur: number | null;
  isFeatured: boolean;
  isPublic: boolean;
  isArchived?: boolean;
  coverImageUrl: string;
  marketingDescription: string;
  certificationLevel: CertificationLevel;
  tags: string[];
  // admin-side stats
  turmasCount?: number;
  formandosCount?: number;
};

export type MockArea = {
  slug: string;
  name: string;
  code: string;
  count: number;
};

export const MOCK_AREAS: MockArea[] = [
  { slug: "all", name: "Todos", code: "*", count: 12 },
  { slug: "saude-bem-estar", name: "Saúde e Bem-Estar", code: "729", count: 4 },
  { slug: "gestao", name: "Gestão e Negócios", code: "345", count: 3 },
  { slug: "tecnologia", name: "Tecnologia", code: "482", count: 2 },
  { slug: "lideranca", name: "Liderança", code: "346", count: 2 },
  { slug: "design", name: "Design", code: "211", count: 1 },
];

export const MOCK_COURSES: MockCourse[] = [
  {
    id: "c1",
    slug: "gestao-stress-bem-estar",
    code: "WSM-001",
    name: "Gestão de Stress e Bem-Estar no Trabalho",
    shortName: "GSBT",
    area: "Saúde e Bem-Estar",
    areaSlug: "saude-bem-estar",
    modality: "PRESENCIAL",
    durationHours: 1,
    priceEur: 95,
    isFeatured: true,
    isPublic: true,
    coverImageUrl:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop&q=80",
    marketingDescription:
      "Workshop prático de 1h para reconhecer sinais de stress, aplicar técnicas de regulação emocional e desenhar um plano pessoal de bem-estar laboral.",
    certificationLevel: "PARTICIPACAO",
    tags: ["NR1", "Saúde Mental", "Workshop"],
    turmasCount: 8,
    formandosCount: 142,
  },
  {
    id: "c2",
    slug: "mindfulness-produtividade",
    code: "WSM-002",
    name: "Mindfulness e Produtividade Consciente",
    shortName: "MPC",
    area: "Saúde e Bem-Estar",
    areaSlug: "saude-bem-estar",
    modality: "PRESENCIAL",
    durationHours: 1,
    priceEur: 85,
    isFeatured: true,
    isPublic: true,
    coverImageUrl:
      "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=600&fit=crop&q=80",
    marketingDescription:
      "Sessão dirigida a equipas que querem reduzir reatividade, melhorar foco e aumentar a qualidade das decisões num ambiente de alta exigência.",
    certificationLevel: "PARTICIPACAO",
    tags: ["Workshop", "Foco", "Saúde Mental"],
    turmasCount: 5,
    formandosCount: 78,
  },
  {
    id: "c3",
    slug: "inteligencia-emocional",
    code: "WSM-003",
    name: "Inteligência Emocional para Equipas",
    shortName: "IE",
    area: "Saúde e Bem-Estar",
    areaSlug: "saude-bem-estar",
    modality: "BLENDED",
    durationHours: 1,
    priceEur: 95,
    isFeatured: false,
    isPublic: true,
    coverImageUrl:
      "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=800&h=600&fit=crop&q=80",
    marketingDescription:
      "Como reconhecer, nomear e regular emoções no trabalho — com prática estruturada para gestores e colaboradores.",
    certificationLevel: "PARTICIPACAO",
    tags: ["Workshop", "Soft Skills"],
    turmasCount: 6,
    formandosCount: 96,
  },
  {
    id: "c4",
    slug: "primeiros-socorros-saude-mental",
    code: "WSM-004",
    name: "Primeiros Socorros em Saúde Mental",
    shortName: "PSSM",
    area: "Saúde e Bem-Estar",
    areaSlug: "saude-bem-estar",
    modality: "PRESENCIAL",
    durationHours: 4,
    priceEur: 220,
    isFeatured: true,
    isPublic: true,
    coverImageUrl:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&q=80",
    marketingDescription:
      "Prepare a sua equipa para identificar sinais de sofrimento psicológico e dar resposta de primeira linha — alinhado com NR1 e boas práticas europeias.",
    certificationLevel: "APROVEITAMENTO",
    tags: ["NR1", "Obrigatório", "Saúde Mental"],
    turmasCount: 12,
    formandosCount: 215,
  },
  {
    id: "c5",
    slug: "lideranca-agil",
    code: "LID-2026-01",
    name: "Liderança Ágil e Gestão de Pessoas",
    shortName: "LAGP",
    area: "Liderança",
    areaSlug: "lideranca",
    modality: "BLENDED",
    durationHours: 24,
    priceEur: 590,
    isFeatured: false,
    isPublic: true,
    coverImageUrl:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=600&fit=crop&q=80",
    marketingDescription:
      "Programa intensivo para líderes que precisam navegar mudança, dar feedback útil e construir equipas que entregam resultados sem queimar pessoas.",
    certificationLevel: "APROVEITAMENTO",
    tags: ["DGERT", "Liderança"],
    turmasCount: 6,
    formandosCount: 188,
  },
  {
    id: "c6",
    slug: "seguranca-higiene-trabalho",
    code: "SHT-001",
    name: "Segurança e Higiene no Trabalho",
    shortName: "SHT",
    area: "Saúde e Bem-Estar",
    areaSlug: "saude-bem-estar",
    modality: "PRESENCIAL",
    durationHours: 35,
    priceEur: 320,
    isFeatured: false,
    isPublic: true,
    coverImageUrl:
      "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&h=600&fit=crop&q=80",
    marketingDescription:
      "Formação obrigatória DGERT que cobre legislação, avaliação de riscos, EPIs e procedimentos de emergência num único módulo certificado.",
    certificationLevel: "APROVEITAMENTO",
    tags: ["DGERT", "Obrigatório"],
    turmasCount: 12,
    formandosCount: 450,
  },
  {
    id: "c7",
    slug: "analise-dados-bi",
    code: "TEC-2026-03",
    name: "Análise de Dados e Business Intelligence",
    shortName: "ADBI",
    area: "Tecnologia",
    areaSlug: "tecnologia",
    modality: "BLENDED",
    durationHours: 60,
    priceEur: 890,
    isFeatured: false,
    isPublic: true,
    coverImageUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&q=80",
    marketingDescription:
      "Power BI, SQL e fundamentos de modelação dimensional — preparação prática para perfis de analista de dados júnior a sénior.",
    certificationLevel: "APROVEITAMENTO",
    tags: ["Tecnologia", "Power BI", "SQL"],
    turmasCount: 8,
    formandosCount: 312,
  },
  {
    id: "c8",
    slug: "ciberseguranca-organizacional",
    code: "TEC-2026-04",
    name: "Cibersegurança Organizacional",
    shortName: "CIBO",
    area: "Tecnologia",
    areaSlug: "tecnologia",
    modality: "ELEARNING",
    durationHours: 24,
    priceEur: 390,
    isFeatured: false,
    isPublic: true,
    coverImageUrl:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop&q=80",
    marketingDescription:
      "Como proteger dados, identidades e operações da sua organização — engenharia social, MFA, RGPD e resposta a incidentes na prática.",
    certificationLevel: "PARTICIPACAO",
    tags: ["Tecnologia", "RGPD", "Segurança"],
    turmasCount: 4,
    formandosCount: 88,
  },
  {
    id: "c9",
    slug: "comunicacao-eficaz",
    code: "GES-001",
    name: "Comunicação Eficaz em Equipa",
    shortName: "CE",
    area: "Gestão e Negócios",
    areaSlug: "gestao",
    modality: "PRESENCIAL",
    durationHours: 16,
    priceEur: 380,
    isFeatured: false,
    isPublic: true,
    coverImageUrl:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=600&fit=crop&q=80",
    marketingDescription:
      "Modelos de comunicação orientados a resultados — feedback, escuta ativa, gestão de conflitos e reuniões que terminam com decisões claras.",
    certificationLevel: "PARTICIPACAO",
    tags: ["Soft Skills", "Gestão"],
    turmasCount: 7,
    formandosCount: 145,
  },
  {
    id: "c10",
    slug: "gestao-projetos-ageis",
    code: "GES-002",
    name: "Gestão de Projetos Ágeis (Scrum)",
    shortName: "GPA",
    area: "Gestão e Negócios",
    areaSlug: "gestao",
    modality: "BLENDED",
    durationHours: 40,
    priceEur: 590,
    isFeatured: true,
    isPublic: true,
    coverImageUrl:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop&q=80",
    marketingDescription:
      "Do backlog à entrega — Scrum, Kanban e ferramentas para conduzir projetos com entregas previsíveis e equipas autónomas.",
    certificationLevel: "APROVEITAMENTO",
    tags: ["Scrum", "Agile"],
    turmasCount: 5,
    formandosCount: 110,
  },
  {
    id: "c11",
    slug: "primeiros-socorros-laboral",
    code: "SAU-001",
    name: "Primeiros Socorros em Ambiente Laboral",
    shortName: "PSAL",
    area: "Saúde e Bem-Estar",
    areaSlug: "saude-bem-estar",
    modality: "PRESENCIAL",
    durationHours: 8,
    priceEur: 195,
    isFeatured: false,
    isPublic: true,
    coverImageUrl:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=600&fit=crop&q=80",
    marketingDescription:
      "Reanimação cardiopulmonar, gestão de feridas, choque e queimaduras — prática certificada conforme requisitos da ACT.",
    certificationLevel: "APROVEITAMENTO",
    tags: ["DGERT", "Obrigatório"],
    turmasCount: 15,
    formandosCount: 602,
  },
  {
    id: "c12",
    slug: "ui-ux-design",
    code: "DES-2026-01",
    name: "UI/UX Design Masterclass",
    shortName: "UIUX",
    area: "Design",
    areaSlug: "design",
    modality: "ELEARNING",
    durationHours: 30,
    priceEur: 420,
    isFeatured: false,
    isPublic: true,
    coverImageUrl:
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?w=800&h=600&fit=crop&q=80",
    marketingDescription:
      "Princípios de design centrados no utilizador, sistemas de design e protótipos no Figma — aplicado a casos reais de produto.",
    certificationLevel: "PARTICIPACAO",
    tags: ["Design", "Figma"],
    turmasCount: 3,
    formandosCount: 64,
  },
  {
    id: "c13",
    slug: "fundamentos-rede-local",
    code: "TEC-2023-06",
    name: "Fundamentos de Rede Local",
    shortName: "FRL",
    area: "Tecnologia",
    areaSlug: "tecnologia",
    modality: "PRESENCIAL",
    durationHours: 20,
    priceEur: null,
    isFeatured: false,
    isPublic: false,
    isArchived: true,
    coverImageUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop&q=80&sat=-100",
    marketingDescription:
      "Curso descontinuado em 2024 — substituído por Cibersegurança Organizacional.",
    certificationLevel: "PARTICIPACAO",
    tags: ["Arquivado"],
    turmasCount: 4,
    formandosCount: 120,
  },
];

export function getCourses(opts?: {
  area?: string;
  query?: string;
  featuredOnly?: boolean;
  includeArchived?: boolean;
}): MockCourse[] {
  let list = MOCK_COURSES.filter((c) =>
    opts?.includeArchived ? true : c.isPublic
  );
  if (opts?.area && opts.area !== "all") {
    list = list.filter((c) => c.areaSlug === opts.area);
  }
  if (opts?.query) {
    const q = opts.query.toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.marketingDescription.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  if (opts?.featuredOnly) {
    list = list.filter((c) => c.isFeatured);
  }
  return list;
}

export function getCourseBySlug(slug: string): MockCourse | undefined {
  return MOCK_COURSES.find((c) => c.slug === slug);
}

// ============================================================================
// TRAINEE DASHBOARD
// ============================================================================

export const MOCK_TRAINEE = {
  id: "t-maryluz",
  fullName: "Maryluz Oliveira",
  preferredName: "Maryluz",
  role: "Trainee de Operações",
  avatarUrl:
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&q=80",
  email: "maryluz.oliveira@oportoforte.pt",
};

export type ActiveSession = {
  id: string;
  trainingActionId: string;
  courseName: string;
  courseSlug: string;
  scheduledStart: string;
  scheduledEnd: string;
  dateLabel: string;
  modality: CourseModality;
  location: string;
  trainerName: string;
  isLive: boolean;
};

export const MOCK_ACTIVE_SESSION: ActiveSession = {
  id: "s-001",
  trainingActionId: "ta-001",
  courseName: "Segurança e Higiene no Trabalho",
  courseSlug: "seguranca-higiene-trabalho",
  scheduledStart: "18:30",
  scheduledEnd: "22:30",
  dateLabel: "Hoje, 27 Mar",
  modality: "PRESENCIAL",
  location: "Instalações do Cliente — Decathlon Maia",
  trainerName: "Ricardo Santos",
  isLive: true,
};

export type TraineeStat = {
  key: string;
  label: string;
  value: string;
  icon: "task" | "timer" | "award";
  trend?: string;
};

export const MOCK_TRAINEE_STATS: TraineeStat[] = [
  { key: "completed", label: "Cursos Concluídos", value: "4", icon: "task" },
  { key: "hours", label: "Horas Acumuladas", value: "125h", icon: "timer" },
  { key: "certs", label: "Certificados", value: "3", icon: "award" },
];

export type TraineeActiveCourse = {
  id: string;
  name: string;
  category: string;
  group: string;
  progress: number;
  imageUrl: string;
  sessionsAttended: number;
  sessionsTotal: number;
  nextSessionLabel: string;
  href: string;
};

export const MOCK_TRAINEE_COURSES: TraineeActiveCourse[] = [
  {
    id: "tc-1",
    name: "Manutenção Industrial Avançada",
    category: "Técnico",
    group: "Turma B12",
    progress: 60,
    imageUrl:
      "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=200&h=200&fit=crop&q=80",
    sessionsAttended: 3,
    sessionsTotal: 5,
    nextSessionLabel: "Hoje 18:30",
    href: "#",
  },
  {
    id: "tc-2",
    name: "Inglês Técnico para Logística",
    category: "Idiomas",
    group: "Remoto A2",
    progress: 85,
    imageUrl:
      "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=200&h=200&fit=crop&q=80",
    sessionsAttended: 8,
    sessionsTotal: 10,
    nextSessionLabel: "Amanhã 14:00",
    href: "#",
  },
  {
    id: "tc-3",
    name: "Cibersegurança Organizacional",
    category: "Tecnologia",
    group: "Turma A04",
    progress: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&h=200&fit=crop&q=80",
    sessionsAttended: 1,
    sessionsTotal: 4,
    nextSessionLabel: "Sex, 29 Mar",
    href: "#",
  },
];

export type ActivityItem = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "evaluation" | "material" | "presence" | "certificate";
};

export const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: "a-1",
    title: "Avaliação Final concluída",
    description: "Módulo: Gestão de Inventário · Nota: 18/20",
    timestamp: "2h atrás",
    type: "evaluation",
  },
  {
    id: "a-2",
    title: "Novo material de estudo disponível",
    description: 'Curso: Segurança e Higiene · "Manual de EPIs v2.pdf"',
    timestamp: "Ontem às 16:45",
    type: "material",
  },
  {
    id: "a-3",
    title: "Presença confirmada",
    description: "Sessão: Workshop de Automação Industrial",
    timestamp: "25 Mar · 19:15",
    type: "presence",
  },
];

export const MOCK_MILESTONE = {
  level: "Certificação Nível 1",
  description:
    "Faltam apenas 15 horas de formação técnica para desbloquear o certificado.",
  targetHours: 140,
  currentHours: 125,
};

// ============================================================================
// TRAINER ATTENDANCE
// ============================================================================

export type AttendanceTrainee = {
  id: string;
  fullName: string;
  email: string;
  initials: string;
  avatarUrl: string | null;
  status: AttendanceStatus;
  signatureState: SignatureState;
  checkedInAt: string | null;
  isOnline?: boolean;
};

export type AttendanceSession = {
  id: string;
  trainingActionCode: string;
  courseName: string;
  sessionNumber: number;
  totalSessions: number;
  scheduledStart: string;
  scheduledEnd: string;
  dateLabel: string;
  trainees: AttendanceTrainee[];
};

export const MOCK_ATTENDANCE_SESSION: AttendanceSession = {
  id: "session-3-of-5",
  trainingActionCode: "T001",
  courseName: "Segurança e Higiene no Trabalho",
  sessionNumber: 3,
  totalSessions: 5,
  scheduledStart: "18:30",
  scheduledEnd: "22:30",
  dateLabel: "27 Mar 2026",
  trainees: [
    {
      id: "att-1",
      fullName: "Ana Martins",
      email: "ana.martins@exemplo.pt",
      initials: "AM",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&q=80",
      status: "PRESENT",
      signatureState: "SIGNED",
      checkedInAt: "18:35",
      isOnline: true,
    },
    {
      id: "att-2",
      fullName: "Ricardo Branco",
      email: "r.branco@corporativo.pt",
      initials: "RB",
      avatarUrl: null,
      status: "PENDING",
      signatureState: "NOT_ENABLED",
      checkedInAt: null,
    },
    {
      id: "att-3",
      fullName: "Carlos Mendes",
      email: "c.mendes@servicos.com",
      initials: "CM",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80",
      status: "PRESENT",
      signatureState: "SIGNED",
      checkedInAt: "18:42",
    },
    {
      id: "att-4",
      fullName: "Sofia Ferreira",
      email: "sofia.f@academic.pt",
      initials: "SF",
      avatarUrl: null,
      status: "PENDING",
      signatureState: "NOT_ENABLED",
      checkedInAt: null,
    },
    {
      id: "att-5",
      fullName: "João Santos",
      email: "j.santos@exemplo.pt",
      initials: "JS",
      avatarUrl: null,
      status: "PRESENT",
      signatureState: "ENABLED",
      checkedInAt: "18:50",
    },
    {
      id: "att-6",
      fullName: "Inês Costa",
      email: "ines.costa@logistica.pt",
      initials: "IC",
      avatarUrl:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&q=80",
      status: "CHECKED_IN",
      signatureState: "NOT_ENABLED",
      checkedInAt: "18:31",
      isOnline: true,
    },
    {
      id: "att-7",
      fullName: "Pedro Almeida",
      email: "pedro.a@empresa.pt",
      initials: "PA",
      avatarUrl: null,
      status: "PRESENT",
      signatureState: "SIGNED",
      checkedInAt: "18:33",
    },
    {
      id: "att-8",
      fullName: "Marta Silva",
      email: "m.silva@cliente.pt",
      initials: "MS",
      avatarUrl: null,
      status: "PRESENT",
      signatureState: "SIGNED",
      checkedInAt: "18:36",
    },
    {
      id: "att-9",
      fullName: "Diogo Pereira",
      email: "diogo.p@empresa.pt",
      initials: "DP",
      avatarUrl: null,
      status: "ABSENT",
      signatureState: "NOT_ENABLED",
      checkedInAt: null,
    },
    {
      id: "att-10",
      fullName: "Beatriz Sousa",
      email: "b.sousa@exemplo.pt",
      initials: "BS",
      avatarUrl: null,
      status: "MANUAL_PRESENT",
      signatureState: "ENABLED",
      checkedInAt: "18:40 (manual)",
    },
    {
      id: "att-11",
      fullName: "Tiago Rodrigues",
      email: "t.rodrigues@logistica.pt",
      initials: "TR",
      avatarUrl: null,
      status: "ABSENT",
      signatureState: "NOT_ENABLED",
      checkedInAt: null,
    },
    {
      id: "att-12",
      fullName: "Raquel Mina",
      email: "raquel.mina@oportoforte.pt",
      initials: "RM",
      avatarUrl:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&q=80&hue=20",
      status: "EARLY_LEAVE",
      signatureState: "ENABLED",
      checkedInAt: "18:30 → saída 21:15",
    },
  ],
};

export function computeAttendanceMetrics(session: AttendanceSession) {
  const total = session.trainees.length;
  const present = session.trainees.filter(
    (t) =>
      t.status === "PRESENT" ||
      t.status === "CHECKED_IN" ||
      t.status === "MANUAL_PRESENT" ||
      t.status === "EARLY_LEAVE"
  ).length;
  const absent = session.trainees.filter((t) => t.status === "ABSENT").length;
  const pending = session.trainees.filter((t) => t.status === "PENDING").length;
  const adherence = total > 0 ? (present / total) * 100 : 0;
  return {
    total,
    present,
    absent,
    pending,
    adherence: Math.round(adherence * 10) / 10,
    avgCheckinMin: 12,
  };
}
