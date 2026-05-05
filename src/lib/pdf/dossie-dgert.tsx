import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, COLORS } from "./styles";

type Trainee = {
  id: string;
  fullName: string;
  email: string;
  taxId: string | null;
  attendedHours: number;
  totalHours: number;
  attendanceRate: number;
  signedSessions: number;
  totalSessions: number;
};

type SessionRow = {
  number: number;
  title: string | null;
  date: string;
  start: string;
  end: string;
  hours: number;
  presentCount: number;
  totalEnrolled: number;
};

type Trainer = {
  fullName: string;
  ccpNumber: string | null;
  bio: string | null;
};

type Module = {
  order: number;
  name: string;
  durationHours: number;
};

export type DossieDgertData = {
  tenantName: string;
  tenantDgertCode: string;
  entityName: string;
  trainingActionCode: string;
  trainingActionName: string;
  courseName: string;
  courseCode: string;
  modalityLabel: string;
  startDate: string;
  endDate: string;
  totalDurationHours: number;
  location: string;
  objetivosGerais: string | null;
  objetivosEspecificos: string | null;
  metodologia: string | null;
  metodologiaAvaliacao: string | null;
  modules: Module[];
  trainers: Trainer[];
  trainees: Trainee[];
  sessions: SessionRow[];
};

export function DossieDgertPdf({ data }: { data: DossieDgertData }) {
  const generatedAt = new Date().toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Document
      title={`Dossie DGERT - ${data.trainingActionCode}`}
      author={data.tenantName}
      subject="Dossier Tecnico-Pedagogico DGERT"
      creator="Academia Digital"
      producer="Academia Digital · DGERT compliant"
    >
      {/* === PAGE 1: COVER === */}
      <Page size="A4" style={styles.page}>
        <Header data={data} />

        <View style={{ marginTop: 60, alignItems: "center" }}>
          <Text style={[styles.docKicker, { fontSize: 11, marginBottom: 6 }]}>
            Dossier Tecnico-Pedagogico DGERT
          </Text>
          <Text style={[styles.docTitle, { fontSize: 22, textAlign: "center" }]}>
            {data.courseName}
          </Text>
          <Text
            style={[styles.docSubtitle, { textAlign: "center", marginTop: 6 }]}
          >
            Turma {data.trainingActionCode} · {data.entityName}
          </Text>
        </View>

        <View style={{ marginTop: 60 }}>
          <CoverField label="Codigo da Acao" value={data.trainingActionCode} />
          <CoverField label="Curso" value={`${data.courseCode} · ${data.courseName}`} />
          <CoverField label="Modalidade" value={data.modalityLabel} />
          <CoverField
            label="Periodo"
            value={`${data.startDate} a ${data.endDate}`}
          />
          <CoverField
            label="Duracao"
            value={`${data.totalDurationHours} horas`}
          />
          <CoverField label="Local" value={data.location} />
          <CoverField
            label="Cliente"
            value={data.entityName}
          />
          <CoverField
            label="Formandos inscritos"
            value={String(data.trainees.length)}
          />
          <CoverField
            label="Formadores"
            value={data.trainers.map((t) => t.fullName).join(" · ")}
          />
        </View>

        <View
          style={{
            marginTop: 60,
            padding: 12,
            backgroundColor: COLORS.surfaceLow,
            borderRadius: 4,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              color: COLORS.textMuted,
              lineHeight: 1.5,
            }}
          >
            Este dossier consolida toda a documentacao tecnico-pedagogica da
            acao de formacao, em conformidade com os requisitos da DGERT.
            Contem programa formativo, registos de presencas, dados de
            formandos e formadores, e indicadores de execucao.
          </Text>
        </View>

        <Footer
          tenantName={data.tenantName}
          dgertCode={data.tenantDgertCode}
          generatedAt={generatedAt}
        />
      </Page>

      {/* === PAGE 2: PROGRAMA FORMATIVO === */}
      <Page size="A4" style={styles.page}>
        <Header data={data} />

        <SectionTitle index={1} title="Programa Formativo" />

        {data.objetivosGerais && (
          <Subsection title="Objetivos gerais">
            <Text style={para}>{data.objetivosGerais}</Text>
          </Subsection>
        )}

        {data.objetivosEspecificos && (
          <Subsection title="Objetivos especificos">
            <Text style={para}>{data.objetivosEspecificos}</Text>
          </Subsection>
        )}

        {data.metodologia && (
          <Subsection title="Metodologia">
            <Text style={para}>{data.metodologia}</Text>
          </Subsection>
        )}

        {data.metodologiaAvaliacao && (
          <Subsection title="Metodologia de avaliacao">
            <Text style={para}>{data.metodologiaAvaliacao}</Text>
          </Subsection>
        )}

        <Subsection title={`Modulos (${data.modules.length})`}>
          <View style={styles.table}>
            <View style={styles.thead}>
              <Text style={[styles.th, { width: 28, textAlign: "center" }]}>
                #
              </Text>
              <Text style={[styles.th, { flex: 4 }]}>Modulo</Text>
              <Text style={[styles.th, { width: 60, textAlign: "right" }]}>
                Horas
              </Text>
            </View>
            {data.modules.map((m) => (
              <View key={m.order} style={tableRow}>
                <Text style={[tableCell, { width: 28, textAlign: "center" }]}>
                  {m.order}
                </Text>
                <Text style={[tableCell, { flex: 4 }]}>{m.name}</Text>
                <Text style={[tableCell, { width: 60, textAlign: "right" }]}>
                  {m.durationHours}h
                </Text>
              </View>
            ))}
            <View style={[tableRow, { backgroundColor: COLORS.surfaceMid }]}>
              <Text style={[tableCell, { width: 28 }]}> </Text>
              <Text style={[tableCell, { flex: 4, fontWeight: 700 }]}>
                Total
              </Text>
              <Text
                style={[
                  tableCell,
                  { width: 60, textAlign: "right", fontWeight: 700 },
                ]}
              >
                {data.totalDurationHours}h
              </Text>
            </View>
          </View>
        </Subsection>

        <Footer
          tenantName={data.tenantName}
          dgertCode={data.tenantDgertCode}
          generatedAt={generatedAt}
        />
      </Page>

      {/* === PAGE 3: FORMADORES === */}
      <Page size="A4" style={styles.page}>
        <Header data={data} />
        <SectionTitle index={2} title="Equipa Formativa" />

        <View style={styles.table}>
          <View style={styles.thead}>
            <Text style={[styles.th, { flex: 2 }]}>Formador</Text>
            <Text style={[styles.th, { width: 80 }]}>CCP</Text>
            <Text style={[styles.th, { flex: 3 }]}>Bio</Text>
          </View>
          {data.trainers.length === 0 ? (
            <View style={tableRow}>
              <Text
                style={[
                  tableCell,
                  { flex: 6, color: COLORS.textMuted, fontStyle: "italic" },
                ]}
              >
                Sem formadores associados a esta turma.
              </Text>
            </View>
          ) : (
            data.trainers.map((t, i) => (
              <View key={i} style={tableRow}>
                <Text style={[tableCell, { flex: 2, fontWeight: 700 }]}>
                  {t.fullName}
                </Text>
                <Text style={[tableCell, { width: 80 }]}>
                  {t.ccpNumber ?? "—"}
                </Text>
                <Text
                  style={[
                    tableCell,
                    { flex: 3, color: COLORS.textMuted, fontSize: 8.5 },
                  ]}
                >
                  {t.bio ?? "—"}
                </Text>
              </View>
            ))
          )}
        </View>

        <Footer
          tenantName={data.tenantName}
          dgertCode={data.tenantDgertCode}
          generatedAt={generatedAt}
        />
      </Page>

      {/* === PAGE 4: FORMANDOS === */}
      <Page size="A4" style={styles.page}>
        <Header data={data} />
        <SectionTitle
          index={3}
          title={`Lista de Formandos (${data.trainees.length})`}
        />

        <View style={styles.table}>
          <View style={styles.thead}>
            <Text style={[styles.th, { width: 28, textAlign: "center" }]}>
              #
            </Text>
            <Text style={[styles.th, { flex: 2.4 }]}>Nome</Text>
            <Text style={[styles.th, { flex: 1.4 }]}>NIF</Text>
            <Text style={[styles.th, { width: 56, textAlign: "center" }]}>
              Horas
            </Text>
            <Text style={[styles.th, { width: 56, textAlign: "center" }]}>
              Taxa
            </Text>
            <Text style={[styles.th, { width: 56, textAlign: "center" }]}>
              Assin.
            </Text>
          </View>
          {data.trainees.map((t, i) => (
            <View key={t.id} style={tableRow}>
              <Text style={[tableCell, { width: 28, textAlign: "center" }]}>
                {i + 1}
              </Text>
              <Text style={[tableCell, { flex: 2.4, fontWeight: 700 }]}>
                {t.fullName}
              </Text>
              <Text
                style={[
                  tableCell,
                  { flex: 1.4, color: COLORS.textMuted, fontSize: 8.5 },
                ]}
              >
                {t.taxId ?? "—"}
              </Text>
              <Text style={[tableCell, { width: 56, textAlign: "center" }]}>
                {t.attendedHours}/{t.totalHours}
              </Text>
              <Text
                style={[
                  tableCell,
                  {
                    width: 56,
                    textAlign: "center",
                    fontWeight: 700,
                    color:
                      t.attendanceRate >= 90
                        ? COLORS.emerald
                        : t.attendanceRate >= 70
                        ? COLORS.amber
                        : COLORS.red,
                  },
                ]}
              >
                {Math.round(t.attendanceRate)}%
              </Text>
              <Text style={[tableCell, { width: 56, textAlign: "center" }]}>
                {t.signedSessions}/{t.totalSessions}
              </Text>
            </View>
          ))}
        </View>

        <Footer
          tenantName={data.tenantName}
          dgertCode={data.tenantDgertCode}
          generatedAt={generatedAt}
        />
      </Page>

      {/* === PAGE 5: SESSOES === */}
      <Page size="A4" style={styles.page}>
        <Header data={data} />
        <SectionTitle
          index={4}
          title={`Mapa de Sessoes (${data.sessions.length})`}
        />

        <View style={styles.table}>
          <View style={styles.thead}>
            <Text style={[styles.th, { width: 28, textAlign: "center" }]}>
              #
            </Text>
            <Text style={[styles.th, { flex: 1.4 }]}>Data</Text>
            <Text style={[styles.th, { width: 80 }]}>Horario</Text>
            <Text style={[styles.th, { flex: 2 }]}>Titulo</Text>
            <Text style={[styles.th, { width: 50, textAlign: "center" }]}>
              Horas
            </Text>
            <Text style={[styles.th, { width: 70, textAlign: "center" }]}>
              Presencas
            </Text>
          </View>
          {data.sessions.map((s) => (
            <View key={s.number} style={tableRow}>
              <Text style={[tableCell, { width: 28, textAlign: "center" }]}>
                {s.number}
              </Text>
              <Text style={[tableCell, { flex: 1.4 }]}>{s.date}</Text>
              <Text
                style={[
                  tableCell,
                  { width: 80, fontSize: 8.5, color: COLORS.textMuted },
                ]}
              >
                {s.start}–{s.end}
              </Text>
              <Text style={[tableCell, { flex: 2 }]}>{s.title ?? "—"}</Text>
              <Text style={[tableCell, { width: 50, textAlign: "center" }]}>
                {s.hours}h
              </Text>
              <Text
                style={[
                  tableCell,
                  { width: 70, textAlign: "center", fontWeight: 700 },
                ]}
              >
                {s.presentCount}/{s.totalEnrolled}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={{
            marginTop: 24,
            padding: 12,
            backgroundColor: COLORS.surfaceLow,
            borderRadius: 4,
          }}
        >
          <Text style={{ fontSize: 9, lineHeight: 1.5 }}>
            Folhas de presenca individuais por sessao estao disponiveis em
            anexo separado e/ou no portal trainer.
          </Text>
        </View>

        <Footer
          tenantName={data.tenantName}
          dgertCode={data.tenantDgertCode}
          generatedAt={generatedAt}
        />
      </Page>
    </Document>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────

function Header({ data }: { data: DossieDgertData }) {
  return (
    <View style={styles.header} fixed>
      <View style={[styles.logoBox, styles.logoBoxNavy]}>
        <Text style={styles.logoText}>{initials(data.tenantName)}</Text>
        <Text style={[styles.logoTextMuted, { color: COLORS.goldLight }]}>
          Formacao
        </Text>
      </View>
      <View style={[styles.logoBox, styles.logoBoxClient]}>
        <Text style={[styles.logoText, { color: COLORS.navy, fontSize: 10 }]}>
          {initials(data.entityName)}
        </Text>
        <Text style={styles.logoTextMuted}>Cliente</Text>
      </View>
      <View style={[styles.logoBox, styles.logoBoxDgert]}>
        <Text style={styles.logoTextDgertNum}>DGERT</Text>
        <Text style={styles.logoTextDgertLabel}>{data.tenantDgertCode}</Text>
      </View>
    </View>
  );
}

function Footer({
  tenantName,
  dgertCode,
  generatedAt,
}: {
  tenantName: string;
  dgertCode: string;
  generatedAt: string;
}) {
  return (
    <View style={styles.footer} fixed>
      <Text>
        <Text style={styles.footerStrong}>{tenantName}</Text> · DGERT{" "}
        {dgertCode} · IMP_00_DTP_DossierCompleto v1.0
      </Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Pag. ${pageNumber}/${totalPages} · Gerado ${generatedAt}`
        }
      />
    </View>
  );
}

function SectionTitle({ index, title }: { index: number; title: string }) {
  return (
    <View
      style={{
        marginTop: 8,
        marginBottom: 14,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gold,
      }}
    >
      <Text
        style={{
          fontSize: 8,
          color: COLORS.gold,
          fontWeight: 700,
          letterSpacing: 1,
          marginBottom: 2,
        }}
      >
        SECAO {String(index).padStart(2, "0")}
      </Text>
      <Text style={{ fontSize: 16, color: COLORS.navy, fontWeight: 700 }}>
        {title}
      </Text>
    </View>
  );
}

function Subsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          color: COLORS.navy,
          marginBottom: 6,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function CoverField({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        paddingVertical: 7,
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.borderLight,
      }}
    >
      <Text
        style={{
          width: 140,
          fontSize: 8.5,
          color: COLORS.textSubtle,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          fontWeight: 700,
        }}
      >
        {label}
      </Text>
      <Text
        style={{ flex: 1, fontSize: 10, color: COLORS.text, fontWeight: 700 }}
      >
        {value}
      </Text>
    </View>
  );
}

const para = {
  fontSize: 9.5,
  lineHeight: 1.5,
  color: COLORS.textMuted,
};

const tableRow = {
  flexDirection: "row" as const,
  borderBottomWidth: 0.5,
  borderBottomColor: COLORS.borderLight,
  paddingVertical: 6,
  paddingHorizontal: 4,
};

const tableCell = {
  fontSize: 9,
  color: COLORS.text,
  paddingHorizontal: 4,
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
