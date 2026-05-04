import { View, Text } from "@react-pdf/renderer";
import { DgertDocument, SignatureGlyph, seedFromString } from "./dgert-document";
import { styles, COLORS } from "./styles";
import type { AttendanceTrainee, AttendanceSession } from "@/lib/mock-data";

type Props = {
  session: AttendanceSession;
  tenantName: string;
  entityName: string;
  dgertCode: string;
  trainerName: string;
  location: string;
};

export function FolhaPresencasPdf({
  session,
  tenantName,
  entityName,
  dgertCode,
  trainerName,
  location,
}: Props) {
  return (
    <DgertDocument
      header={{ tenantName, entityName, dgertCode }}
      kicker="Dossier Técnico-Pedagógico · Documento 10"
      title="Folha de Presenças"
      subtitle={`${session.courseName} · Turma ${session.trainingActionCode} · Sessão ${session.sessionNumber} de ${session.totalSessions}`}
      docCode="IMP_10_DTP_FolhaPresencas v3.0"
    >
      {/* meta block: 4 cells */}
      <View style={styles.metaGrid}>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Data</Text>
          <Text style={styles.metaValue}>{session.dateLabel}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Horário</Text>
          <Text style={styles.metaValue}>
            {session.scheduledStart} – {session.scheduledEnd}
          </Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Local</Text>
          <Text style={styles.metaValue}>{location}</Text>
        </View>
        <View style={[styles.metaCell, styles.metaCellLast]}>
          <Text style={styles.metaLabel}>Formador</Text>
          <Text style={styles.metaValue}>{trainerName}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Registo de presenças (DGERT)</Text>

      <View style={styles.table}>
        <View style={styles.thead}>
          <Text style={[styles.th, { width: 24, textAlign: "center" }]}>#</Text>
          <Text style={[styles.th, { flex: 2.4 }]}>Formando</Text>
          <Text style={[styles.th, { flex: 1.5 }]}>Empresa</Text>
          <Text style={[styles.th, { width: 50, textAlign: "center" }]}>
            Entrada
          </Text>
          <Text style={[styles.th, { width: 50, textAlign: "center" }]}>
            Saída
          </Text>
          <Text style={[styles.th, { flex: 1.4, textAlign: "center" }]}>
            Assinatura
          </Text>
        </View>

        {session.trainees.map((t, i) => (
          <Row key={t.id} trainee={t} index={i + 1} entityName={entityName} />
        ))}
      </View>

      <Text
        style={{
          fontSize: 8,
          color: COLORS.textMuted,
          marginTop: 8,
          fontStyle: "italic",
        }}
      >
        Os formandos sem registo de saída concluíram a sessão completa. As
        ausências sem justificativa estão assinaladas conforme o Art.º 4 do
        Regulamento Geral DGERT.
      </Text>

      <Text style={styles.sectionLabel}>Confirmação do formador</Text>
      <View style={styles.sigBlock}>
        <View style={styles.sigCell}>
          <View style={{ alignItems: "center", marginBottom: 4 }}>
            <SignatureGlyph seed={seedFromString(trainerName)} />
          </View>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Formador</Text>
          <Text style={styles.sigName}>{trainerName}</Text>
        </View>
        <View style={styles.sigCell}>
          <View style={{ height: 32 }} />
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Coordenador Pedagógico</Text>
          <Text style={styles.sigName}>Dr. Silva Neves · {tenantName}</Text>
        </View>
      </View>
    </DgertDocument>
  );
}

function Row({
  trainee,
  index,
  entityName,
}: {
  trainee: AttendanceTrainee;
  index: number;
  entityName: string;
}) {
  const isEven = index % 2 === 0;
  const showSignature =
    trainee.signatureState === "SIGNED" ||
    trainee.signatureState === "ENABLED";
  const isAbsent = trainee.status === "ABSENT";
  const isPending = trainee.status === "PENDING";

  return (
    <View style={[styles.tr, isEven ? styles.trEven : {}]}>
      <Text style={[styles.td, { width: 24, textAlign: "center" }]}>
        {index}
      </Text>
      <Text
        style={[
          styles.td,
          { flex: 2.4, fontFamily: "Helvetica-Bold", color: COLORS.navy },
        ]}
      >
        {trainee.fullName}
      </Text>
      <Text style={[styles.td, { flex: 1.5, color: COLORS.textMuted }]}>
        {entityName}
      </Text>
      <Text
        style={[
          styles.td,
          { width: 50, textAlign: "center", fontFamily: "Helvetica-Bold" },
        ]}
      >
        {isAbsent || isPending ? "—" : trainee.checkedInAt ?? "—"}
      </Text>
      <Text style={[styles.td, { width: 50, textAlign: "center" }]}>
        {trainee.status === "EARLY_LEAVE"
          ? "21:15"
          : isAbsent || isPending
          ? "—"
          : "22:30"}
      </Text>
      <View
        style={[
          styles.td,
          { flex: 1.4, alignItems: "center", justifyContent: "center" },
        ]}
      >
        {showSignature ? (
          <SignatureGlyph seed={seedFromString(trainee.id)} />
        ) : isAbsent ? (
          <Text style={styles.pillAbsent}>Ausente</Text>
        ) : isPending ? (
          <Text style={styles.pillNeutral}>Pendente</Text>
        ) : (
          <Text style={styles.pillNeutral}>Manual</Text>
        )}
      </View>
    </View>
  );
}
