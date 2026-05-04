/**
 * Academia Digital — Database Seed
 *
 * Idempotent (deletes all rows then re-inserts) so it can run multiple times
 * during development. NOT safe to run in production.
 *
 * Run with:
 *   npm run db:seed
 *
 * The data here mirrors a realistic Grupo Oporto Forte tenant: 6 client
 * entities, 12 DGERT-aligned training areas, 13 courses, 8 trainers, 25
 * trainees, 6 training actions (turmas) including the canonical T001
 * "Segurança e Higiene" with 5 sessions and matching attendance state.
 */

import {
  PrismaClient,
  CourseModality,
  CourseStatus,
  CertificationLevel,
  TrainingActionStatus,
  SessionStatus,
  AttendanceStatus,
  SignatureState,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_PASSWORD = "Admin@2026";
const TRAINER_PASSWORD = "Trainer@2026";

async function main() {
  console.log("🌱 Seeding database...\n");

  await reset();

  // ─── 1. TENANT ────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.create({
    data: {
      slug: "oportoforte",
      name: "Grupo Oporto Forte",
      dgertCode: "20255-DGERT",
      primaryColor: "#0B2447",
      accentColor: "#CCA823",
      settings: {
        catalogPublicTitle: "Formação Profissional Certificada DGERT",
        defaultCertificationFooter:
          "Entidade formadora certificada pela DGERT desde 2010.",
      },
    },
  });
  console.log(`✓ Tenant created: ${tenant.name} (${tenant.slug})`);

  // ─── 2. TRAINING AREAS (12 DGERT-aligned) ─────────────────────────────────
  const areaSeed = [
    { code: "729", name: "Saúde e Bem-Estar" },
    { code: "345", name: "Gestão e Administração" },
    { code: "482", name: "Tecnologias da Informação" },
    { code: "346", name: "Liderança e Recursos Humanos" },
    { code: "211", name: "Design e Produção Visual" },
    { code: "862", name: "Saúde e Segurança no Trabalho" },
    { code: "145", name: "Formação de Formadores" },
    { code: "347", name: "Trabalho e Ambiente" },
    { code: "380", name: "Direito Laboral" },
    { code: "581", name: "Construção e Engenharia Civil" },
    { code: "851", name: "Conservação Ambiental" },
    { code: "462", name: "Marketing e Publicidade" },
  ];
  const areas = await Promise.all(
    areaSeed.map((a) =>
      prisma.trainingArea.create({
        data: { ...a, tenantId: tenant.id },
      })
    )
  );
  const areaByCode = new Map(areas.map((a) => [a.code, a]));
  console.log(`✓ ${areas.length} training areas`);

  // ─── 3. CLIENT ENTITIES ────────────────────────────────────────────────────
  const entities = await Promise.all(
    [
      {
        name: "Decathlon Portugal",
        code: "ENT-001",
        taxId: "PT502889378",
        cae: "47640",
        city: "Maia",
        contactEmail: "rh@decathlon.pt",
      },
      {
        name: "ZF Automotive Portugal",
        code: "ENT-002",
        taxId: "PT502123456",
        cae: "29320",
        city: "Ponte de Lima",
        contactEmail: "training@zf.com",
      },
      {
        name: "Logistics Corp",
        code: "ENT-003",
        taxId: "PT508765432",
        cae: "52100",
        city: "Porto",
        contactEmail: "rh@logisticscorp.pt",
      },
      {
        name: "Global Tech Solutions",
        code: "ENT-004",
        taxId: "PT510987654",
        cae: "62010",
        city: "Lisboa",
        contactEmail: "people@globaltech.pt",
      },
      {
        name: "Retail Pro",
        code: "ENT-005",
        taxId: "PT509876543",
        cae: "47190",
        city: "Braga",
        contactEmail: "formacao@retailpro.pt",
      },
      {
        name: "EDP Renováveis",
        code: "ENT-006",
        taxId: "PT500700050",
        cae: "35110",
        city: "Porto",
        contactEmail: "rh@edpr.com",
      },
    ].map((e) => prisma.entity.create({ data: { ...e, tenantId: tenant.id } }))
  );
  console.log(`✓ ${entities.length} client entities`);

  // ─── 4. COURSES + MODULES ─────────────────────────────────────────────────
  const coursesSeed = [
    {
      slug: "gestao-stress-bem-estar",
      code: "WSM-001",
      name: "Gestão de Stress e Bem-Estar no Trabalho",
      shortName: "GSBT",
      areaCode: "729",
      modality: CourseModality.PRESENCIAL,
      durationHours: 1,
      priceEur: 95,
      isFeatured: true,
      isPublic: true,
      certificationLevel: CertificationLevel.PARTICIPACAO,
      coverImageUrl:
        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop&q=80",
      marketingDescription:
        "Workshop prático de 1h para reconhecer sinais de stress, aplicar técnicas de regulação emocional e desenhar um plano pessoal de bem-estar laboral.",
    },
    {
      slug: "mindfulness-produtividade",
      code: "WSM-002",
      name: "Mindfulness e Produtividade Consciente",
      shortName: "MPC",
      areaCode: "729",
      modality: CourseModality.PRESENCIAL,
      durationHours: 1,
      priceEur: 85,
      isFeatured: true,
      isPublic: true,
      certificationLevel: CertificationLevel.PARTICIPACAO,
      coverImageUrl:
        "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=600&fit=crop&q=80",
      marketingDescription:
        "Sessão dirigida a equipas que querem reduzir reatividade, melhorar foco e aumentar a qualidade das decisões num ambiente de alta exigência.",
    },
    {
      slug: "primeiros-socorros-saude-mental",
      code: "WSM-004",
      name: "Primeiros Socorros em Saúde Mental",
      shortName: "PSSM",
      areaCode: "729",
      modality: CourseModality.PRESENCIAL,
      durationHours: 4,
      priceEur: 220,
      isFeatured: true,
      isPublic: true,
      certificationLevel: CertificationLevel.APROVEITAMENTO,
      coverImageUrl:
        "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&q=80",
      marketingDescription:
        "Prepare a sua equipa para identificar sinais de sofrimento psicológico e dar resposta de primeira linha — alinhado com NR1 e boas práticas europeias.",
    },
    {
      slug: "seguranca-higiene-trabalho",
      code: "SHT-001",
      name: "Segurança e Higiene no Trabalho",
      shortName: "SHT",
      areaCode: "862",
      modality: CourseModality.PRESENCIAL,
      durationHours: 35,
      priceEur: 320,
      isFeatured: false,
      isPublic: true,
      certificationLevel: CertificationLevel.APROVEITAMENTO,
      coverImageUrl:
        "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&h=600&fit=crop&q=80",
      marketingDescription:
        "Formação obrigatória DGERT que cobre legislação, avaliação de riscos, EPIs e procedimentos de emergência num único módulo certificado.",
    },
    {
      slug: "lideranca-agil",
      code: "LID-2026-01",
      name: "Liderança Ágil e Gestão de Pessoas",
      shortName: "LAGP",
      areaCode: "346",
      modality: CourseModality.BLENDED,
      durationHours: 24,
      priceEur: 590,
      isFeatured: false,
      isPublic: true,
      certificationLevel: CertificationLevel.APROVEITAMENTO,
      coverImageUrl:
        "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=600&fit=crop&q=80",
      marketingDescription:
        "Programa intensivo para líderes que precisam navegar mudança, dar feedback útil e construir equipas que entregam resultados sem queimar pessoas.",
    },
    {
      slug: "ciberseguranca-organizacional",
      code: "TEC-2026-04",
      name: "Cibersegurança Organizacional",
      shortName: "CIBO",
      areaCode: "482",
      modality: CourseModality.ELEARNING,
      durationHours: 24,
      priceEur: 390,
      isFeatured: false,
      isPublic: true,
      certificationLevel: CertificationLevel.PARTICIPACAO,
      coverImageUrl:
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop&q=80",
      marketingDescription:
        "Como proteger dados, identidades e operações da sua organização — engenharia social, MFA, RGPD e resposta a incidentes na prática.",
    },
    {
      slug: "comunicacao-eficaz",
      code: "GES-001",
      name: "Comunicação Eficaz em Equipa",
      shortName: "CE",
      areaCode: "345",
      modality: CourseModality.PRESENCIAL,
      durationHours: 16,
      priceEur: 380,
      isFeatured: false,
      isPublic: true,
      certificationLevel: CertificationLevel.PARTICIPACAO,
      coverImageUrl:
        "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=600&fit=crop&q=80",
      marketingDescription:
        "Modelos de comunicação orientados a resultados — feedback, escuta ativa, gestão de conflitos e reuniões que terminam com decisões claras.",
    },
    {
      slug: "primeiros-socorros-laboral",
      code: "SAU-001",
      name: "Primeiros Socorros em Ambiente Laboral",
      shortName: "PSAL",
      areaCode: "729",
      modality: CourseModality.PRESENCIAL,
      durationHours: 8,
      priceEur: 195,
      isFeatured: false,
      isPublic: true,
      certificationLevel: CertificationLevel.APROVEITAMENTO,
      coverImageUrl:
        "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=600&fit=crop&q=80",
      marketingDescription:
        "Reanimação cardiopulmonar, gestão de feridas, choque e queimaduras — prática certificada conforme requisitos da ACT.",
    },
    {
      slug: "fundamentos-rede-local",
      code: "TEC-2023-06",
      name: "Fundamentos de Rede Local",
      shortName: "FRL",
      areaCode: "482",
      modality: CourseModality.PRESENCIAL,
      durationHours: 20,
      priceEur: null,
      isFeatured: false,
      isPublic: false,
      certificationLevel: CertificationLevel.PARTICIPACAO,
      status: CourseStatus.ARCHIVED,
      coverImageUrl:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop&q=80&sat=-100",
      marketingDescription:
        "Curso descontinuado em 2024 — substituído por Cibersegurança Organizacional.",
    },
  ];

  const courses = await Promise.all(
    coursesSeed.map(({ areaCode, ...c }) =>
      prisma.course.create({
        data: {
          ...c,
          tenantId: tenant.id,
          trainingAreaId: areaByCode.get(areaCode)?.id,
          modules: {
            create: buildModules(c.name, c.durationHours),
          },
        },
      })
    )
  );
  const courseBySlug = new Map(courses.map((c) => [c.slug, c]));
  console.log(`✓ ${courses.length} courses (with modules)`);

  // ─── 5. USERS: ADMIN + TRAINERS + TRAINEES ────────────────────────────────
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const trainerHash = await bcrypt.hash(TRAINER_PASSWORD, 10);

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "admin@oportoforte.pt",
      fullName: "Dr. Silva Neves",
      preferredName: "Silva",
      role: UserRole.ADMIN,
      passwordHash: adminHash,
      emailVerifiedAt: new Date(),
      avatarUrl:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&q=80",
    },
  });
  console.log(`✓ Admin user: ${admin.email}`);

  // trainers
  const trainerSeed = [
    {
      email: "ricardo.santos@oportoforte.pt",
      fullName: "Ricardo Santos",
      ccpNumber: "CCP-22456",
      yearsPresentialExp: 12,
      bio: "Especialista em segurança ocupacional e formação corporativa.",
    },
    {
      email: "ana.pereira@oportoforte.pt",
      fullName: "Ana Pereira",
      ccpNumber: "CCP-19831",
      yearsPresentialExp: 8,
      bio: "Psicóloga organizacional e facilitadora de workshops de saúde mental.",
    },
    {
      email: "carlos.soares@oportoforte.pt",
      fullName: "Carlos Soares",
      ccpNumber: "CCP-17204",
      yearsPresentialExp: 15,
      bio: "Coach executivo focado em liderança e gestão de equipas.",
    },
    {
      email: "patricia.martins@oportoforte.pt",
      fullName: "Patrícia Martins",
      ccpNumber: "CCP-23890",
      yearsPresentialExp: 6,
      bio: "Engenheira informática especialista em cibersegurança.",
    },
    {
      email: "joao.ferreira@oportoforte.pt",
      fullName: "João Ferreira",
      ccpNumber: "CCP-15678",
      yearsPresentialExp: 18,
      bio: "Médico do trabalho com 18 anos de prática em saúde ocupacional.",
    },
    {
      email: "diogo.ribeiro@oportoforte.pt",
      fullName: "Diogo Ribeiro",
      ccpNumber: "CCP-21115",
      yearsPresentialExp: 9,
      bio: "Designer e especialista em comunicação visual.",
    },
  ];
  const trainers = await Promise.all(
    trainerSeed.map((t) =>
      prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: t.email,
          fullName: t.fullName,
          role: UserRole.TRAINER,
          passwordHash: trainerHash,
          emailVerifiedAt: new Date(),
          trainerProfile: {
            create: {
              tenantId: tenant.id,
              ccpNumber: t.ccpNumber,
              yearsPresentialExp: t.yearsPresentialExp,
              bio: t.bio,
              isExternal: false,
            },
          },
        },
        include: { trainerProfile: true },
      })
    )
  );
  console.log(`✓ ${trainers.length} trainers`);

  // trainees — distributed across entities
  const traineeSeed: Array<{
    fullName: string;
    email: string;
    entityIdx: number;
    avatarUrl?: string;
  }> = [
    { fullName: "Ana Martins", email: "ana.martins@exemplo.pt", entityIdx: 0,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&q=80" },
    { fullName: "Ricardo Branco", email: "r.branco@corporativo.pt", entityIdx: 0 },
    { fullName: "Carlos Mendes", email: "c.mendes@servicos.com", entityIdx: 0,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80" },
    { fullName: "Sofia Ferreira", email: "sofia.f@academic.pt", entityIdx: 1 },
    { fullName: "João Santos", email: "j.santos@exemplo.pt", entityIdx: 1 },
    { fullName: "Inês Costa", email: "ines.costa@logistica.pt", entityIdx: 2,
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&q=80" },
    { fullName: "Pedro Almeida", email: "pedro.a@empresa.pt", entityIdx: 2 },
    { fullName: "Marta Silva", email: "m.silva@cliente.pt", entityIdx: 2 },
    { fullName: "Diogo Pereira", email: "diogo.p@empresa.pt", entityIdx: 3 },
    { fullName: "Beatriz Sousa", email: "b.sousa@exemplo.pt", entityIdx: 3 },
    { fullName: "Tiago Rodrigues", email: "t.rodrigues@logistica.pt", entityIdx: 3 },
    { fullName: "Raquel Mina", email: "raquel.mina@oportoforte.pt", entityIdx: 4 },
    { fullName: "Maryluz Oliveira", email: "maryluz.oliveira@oportoforte.pt", entityIdx: 4,
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&q=80" },
    { fullName: "Tomás Cardoso", email: "tomas.c@retailpro.pt", entityIdx: 4 },
    { fullName: "Catarina Lima", email: "c.lima@retailpro.pt", entityIdx: 4 },
    { fullName: "Henrique Faria", email: "h.faria@globaltech.pt", entityIdx: 3 },
    { fullName: "Margarida Cruz", email: "m.cruz@globaltech.pt", entityIdx: 3 },
    { fullName: "Bruno Tavares", email: "b.tavares@edpr.com", entityIdx: 5 },
    { fullName: "Vasco Mendes", email: "v.mendes@edpr.com", entityIdx: 5 },
    { fullName: "Helena Reis", email: "h.reis@decathlon.pt", entityIdx: 0 },
    { fullName: "Rui Coelho", email: "rui.c@zf.com", entityIdx: 1 },
    { fullName: "Isabel Nunes", email: "i.nunes@zf.com", entityIdx: 1 },
    { fullName: "Filipa Brito", email: "f.brito@logisticscorp.pt", entityIdx: 2 },
    { fullName: "Gonçalo Matos", email: "g.matos@logisticscorp.pt", entityIdx: 2 },
    { fullName: "Sónia Vieira", email: "s.vieira@edpr.com", entityIdx: 5 },
  ];

  const trainees = await Promise.all(
    traineeSeed.map((t) =>
      prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: t.email,
          fullName: t.fullName,
          avatarUrl: t.avatarUrl,
          role: UserRole.TRAINEE,
          traineeProfile: {
            create: {
              tenantId: tenant.id,
              entityId: entities[t.entityIdx].id,
              employmentStatus: "EMPLOYED",
              profession: "Colaborador",
              qualification: "Licenciatura",
            },
          },
        },
        include: { traineeProfile: true },
      })
    )
  );
  console.log(`✓ ${trainees.length} trainees`);

  // ─── 6. TRAINING ACTIONS (turmas) ──────────────────────────────────────────
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysAgo = (d: number) => new Date(today.getTime() - d * 24 * 3600 * 1000);
  const daysAhead = (d: number) => new Date(today.getTime() + d * 24 * 3600 * 1000);

  const turmas = [
    {
      code: "T001",
      courseSlug: "seguranca-higiene-trabalho",
      entityIdx: 0,
      trainerIdx: 0,
      startDate: daysAgo(20),
      endDate: daysAhead(15),
      modality: CourseModality.PRESENCIAL,
      location: "Instalações do Cliente — Decathlon Maia",
      room: "Auditório principal",
      status: TrainingActionStatus.IN_PROGRESS,
      sessionCount: 5,
      currentSession: 3,
    },
    {
      code: "T002",
      courseSlug: "lideranca-agil",
      entityIdx: 1,
      trainerIdx: 2,
      startDate: daysAgo(8),
      endDate: daysAhead(40),
      modality: CourseModality.BLENDED,
      location: "Instalações do Cliente — ZF Ponte de Lima",
      room: "Sala de formação 1",
      status: TrainingActionStatus.IN_PROGRESS,
      sessionCount: 6,
      currentSession: 2,
    },
    {
      code: "T003",
      courseSlug: "mindfulness-produtividade",
      entityIdx: 3,
      trainerIdx: 1,
      startDate: daysAhead(5),
      endDate: daysAhead(5),
      modality: CourseModality.PRESENCIAL,
      location: "Online — Microsoft Teams",
      room: null,
      status: TrainingActionStatus.SCHEDULED,
      sessionCount: 1,
      currentSession: 0,
    },
    {
      code: "T004",
      courseSlug: "ciberseguranca-organizacional",
      entityIdx: 2,
      trainerIdx: 3,
      startDate: daysAgo(45),
      endDate: daysAgo(2),
      modality: CourseModality.ELEARNING,
      location: "Online — Moodle",
      room: null,
      status: TrainingActionStatus.COMPLETED,
      sessionCount: 4,
      currentSession: 4,
    },
    {
      code: "T005",
      courseSlug: "comunicacao-eficaz",
      entityIdx: 4,
      trainerIdx: 5,
      startDate: daysAhead(10),
      endDate: daysAhead(20),
      modality: CourseModality.PRESENCIAL,
      location: "Instalações Oporto Forte — Porto",
      room: "Sala BV Areosa",
      status: TrainingActionStatus.SCHEDULED,
      sessionCount: 2,
      currentSession: 0,
    },
    {
      code: "T006",
      courseSlug: "primeiros-socorros-laboral",
      entityIdx: 5,
      trainerIdx: 4,
      startDate: daysAgo(2),
      endDate: daysAhead(8),
      modality: CourseModality.PRESENCIAL,
      location: "Instalações do Cliente — EDP Renováveis",
      room: "Auditório técnico",
      status: TrainingActionStatus.IN_PROGRESS,
      sessionCount: 4,
      currentSession: 1,
    },
  ];

  const trainingActions = await Promise.all(
    turmas.map(async (t) => {
      const course = courseBySlug.get(t.courseSlug)!;
      const trainer = trainers[t.trainerIdx].trainerProfile!;
      return prisma.trainingAction.create({
        data: {
          tenantId: tenant.id,
          courseId: course.id,
          entityId: entities[t.entityIdx].id,
          code: t.code,
          startDate: t.startDate,
          endDate: t.endDate,
          durationHours: course.durationHours,
          modality: t.modality,
          location: t.location,
          room: t.room,
          status: t.status,
          maxTrainees: 25,
          trainers: {
            create: { trainerId: trainer.id, isPrimary: true },
          },
        },
      });
    })
  );
  console.log(`✓ ${trainingActions.length} training actions (turmas)`);

  // ─── 7. SESSIONS ───────────────────────────────────────────────────────────
  let totalSessions = 0;
  for (let i = 0; i < trainingActions.length; i++) {
    const ta = trainingActions[i];
    const meta = turmas[i];
    const sessions = [];
    const dayStep = Math.max(
      1,
      Math.floor(
        (ta.endDate.getTime() - ta.startDate.getTime()) /
          (meta.sessionCount * 24 * 3600 * 1000)
      )
    );

    for (let n = 1; n <= meta.sessionCount; n++) {
      const sStart = new Date(ta.startDate.getTime() + (n - 1) * dayStep * 24 * 3600 * 1000);
      sStart.setHours(18, 30, 0, 0);
      const sEnd = new Date(sStart.getTime() + 4 * 3600 * 1000);

      let status: SessionStatus = SessionStatus.UPCOMING;
      if (n < meta.currentSession) status = SessionStatus.CLOSED;
      else if (n === meta.currentSession) status = SessionStatus.IN_PROGRESS;

      sessions.push(
        prisma.session.create({
          data: {
            trainingActionId: ta.id,
            number: n,
            scheduledStart: sStart,
            scheduledEnd: sEnd,
            actualStart: status !== SessionStatus.UPCOMING ? sStart : null,
            actualEnd: status === SessionStatus.CLOSED ? sEnd : null,
            status,
          },
        })
      );
    }
    const created = await Promise.all(sessions);
    totalSessions += created.length;
  }
  console.log(`✓ ${totalSessions} sessions`);

  // ─── 8. ENROLLMENTS ────────────────────────────────────────────────────────
  // T001 (Decathlon) gets 12 trainees including the canonical attendance roster
  const t001 = trainingActions[0];
  const t001Trainees = trainees.slice(0, 12);
  await Promise.all(
    t001Trainees.map((u) =>
      prisma.enrollment.create({
        data: {
          trainingActionId: t001.id,
          traineeId: u.traineeProfile!.id,
        },
      })
    )
  );

  // Other turmas: 8 random trainees each
  for (let i = 1; i < trainingActions.length; i++) {
    const ta = trainingActions[i];
    const sample = [...trainees].sort(() => Math.random() - 0.5).slice(0, 8);
    await Promise.all(
      sample.map((u) =>
        prisma.enrollment.create({
          data: {
            trainingActionId: ta.id,
            traineeId: u.traineeProfile!.id,
          },
        })
      )
    );
  }
  const totalEnrollments = await prisma.enrollment.count();
  console.log(`✓ ${totalEnrollments} enrollments`);

  // ─── 9. ATTENDANCE for T001 session 3 (current/in-progress) ───────────────
  const t001Sessions = await prisma.session.findMany({
    where: { trainingActionId: t001.id },
    orderBy: { number: "asc" },
  });
  const session3 = t001Sessions[2];

  const t001Enrollments = await prisma.enrollment.findMany({
    where: { trainingActionId: t001.id },
    orderBy: { enrolledAt: "asc" },
  });

  // Attendance state matches the AttendanceTrainee mock for visual consistency
  const attendanceStates: Array<{
    status: AttendanceStatus;
    signatureState: SignatureState;
    checkedInAt: string | null;
  }> = [
    { status: "PRESENT", signatureState: "SIGNED", checkedInAt: "18:35" },
    { status: "PENDING", signatureState: "NOT_ENABLED", checkedInAt: null },
    { status: "PRESENT", signatureState: "SIGNED", checkedInAt: "18:42" },
    { status: "PENDING", signatureState: "NOT_ENABLED", checkedInAt: null },
    { status: "PRESENT", signatureState: "ENABLED", checkedInAt: "18:50" },
    { status: "CHECKED_IN", signatureState: "NOT_ENABLED", checkedInAt: "18:31" },
    { status: "PRESENT", signatureState: "SIGNED", checkedInAt: "18:33" },
    { status: "PRESENT", signatureState: "SIGNED", checkedInAt: "18:36" },
    { status: "ABSENT", signatureState: "NOT_ENABLED", checkedInAt: null },
    { status: "MANUAL_PRESENT", signatureState: "ENABLED", checkedInAt: "18:40" },
    { status: "ABSENT", signatureState: "NOT_ENABLED", checkedInAt: null },
    { status: "EARLY_LEAVE", signatureState: "ENABLED", checkedInAt: "18:30" },
  ];

  await Promise.all(
    t001Enrollments.map((enr, i) =>
      prisma.attendance.create({
        data: {
          sessionId: session3.id,
          enrollmentId: enr.id,
          traineeId: enr.traineeId,
          status: attendanceStates[i].status,
          signatureState: attendanceStates[i].signatureState,
          checkedInAt: attendanceStates[i].checkedInAt
            ? new Date(`2026-03-27T${attendanceStates[i].checkedInAt}:00`)
            : null,
        },
      })
    )
  );
  console.log(`✓ ${t001Enrollments.length} attendance records for T001 session 3`);

  // ─── CREDENTIALS SUMMARY ───────────────────────────────────────────────────
  console.log("\n🎉 Seed completed successfully\n");
  console.log("📝 Login credentials:");
  console.log(`   Admin   → admin@oportoforte.pt / ${ADMIN_PASSWORD}`);
  console.log(`   Trainer → ricardo.santos@oportoforte.pt / ${TRAINER_PASSWORD}`);
  console.log(`   Trainee → maryluz.oliveira@oportoforte.pt (magic-link, sem password)\n`);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────
function buildModules(courseName: string, totalHours: number) {
  if (totalHours <= 1) {
    return [{ order: 1, name: "Workshop completo", durationHours: 1 }];
  }
  if (totalHours <= 8) {
    return [
      { order: 1, name: "Fundamentos teóricos", durationHours: Math.ceil(totalHours * 0.4) },
      { order: 2, name: "Prática supervisionada", durationHours: Math.floor(totalHours * 0.6) },
    ];
  }
  return [
    { order: 1, name: "Enquadramento e legislação", durationHours: Math.ceil(totalHours * 0.2) },
    { order: 2, name: "Métodos e técnicas", durationHours: Math.ceil(totalHours * 0.4) },
    { order: 3, name: "Prática integrada", durationHours: Math.ceil(totalHours * 0.3) },
    { order: 4, name: "Avaliação final", durationHours: Math.floor(totalHours * 0.1) },
  ];
}

async function reset() {
  console.log("🧹 Cleaning existing data...");
  // Order matters: leaves first, roots last.
  await prisma.signature.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.session.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.document.deleteMany();
  await prisma.trainingActionTrainer.deleteMany();
  await prisma.trainingAction.deleteMany();
  await prisma.courseModule.deleteMany();
  await prisma.course.deleteMany();
  await prisma.trainee.deleteMany();
  await prisma.trainer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.entity.deleteMany();
  await prisma.trainingArea.deleteMany();
  await prisma.tenant.deleteMany();
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
