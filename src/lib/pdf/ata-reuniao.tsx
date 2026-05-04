import { View, Text } from "@react-pdf/renderer";
import { DgertDocument, SignatureGlyph, seedFromString } from "./dgert-document";
import { styles, COLORS } from "./styles";

type Props = {
  tenantName: string;
  entityName: string;
  dgertCode: string;
  trainingActionCode: string;
  courseName: string;
  startDate: string;
  endDate: string;
  totalSessions: number;
  attendedSessions: number;
  totalTrainees: number;
  averageAttendance: number;
  trainerName: string;
  notes?: string;
};

export function AtaReuniaoPdf(props: Props) {
  return (
    <DgertDocument
      header={{
        tenantName: props.tenantName,
        entityName: props.entityName,
        dgertCode: props.dgertCode,
      }}
      kicker="Dossier Técnico-Pedagógico · Documento 20"
      title="Ata de Reunião Pedagógica"
      subtitle={`${props.courseName} · Turma ${props.trainingActionCode}`}
      docCode="IMP_20_DTP_AtaReuniao v3.0"
    >
      <View style={styles.metaGrid}>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Turma</Text>
          <Text style={styles.metaValue}>{props.trainingActionCode}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Início</Text>
          <Text style={styles.metaValue}>{props.startDate}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Fim</Text>
          <Text style={styles.metaValue}>{props.endDate}</Text>
        </View>
        <View style={[styles.metaCell, styles.metaCellLast]}>
          <Text style={styles.metaLabel}>Coordenador</Text>
          <Text style={styles.metaValue}>Dr. Silva Neves</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>1 · Sumário executivo</Text>
      <Text style={styles.ataParagraph}>
        Aos{" "}
        <Text style={styles.ataNumeric}>{props.endDate}</Text>, no contexto da
        ação de formação <Text style={styles.ataNumeric}>{props.courseName}</Text>{" "}
        promovida pela {props.tenantName} para a entidade cliente{" "}
        {props.entityName}, reuniu-se o coordenador pedagógico com o formador{" "}
        {props.trainerName} para análise da execução pedagógica.
      </Text>

      <Text style={styles.sectionLabel}>2 · Indicadores de execução</Text>
      <View style={styles.metaGrid}>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Sessões</Text>
          <Text style={styles.metaValue}>
            {props.attendedSessions} / {props.totalSessions}
          </Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Formandos</Text>
          <Text style={styles.metaValue}>{props.totalTrainees}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Adesão Média</Text>
          <Text
            style={[
              styles.metaValue,
              { color: props.averageAttendance >= 80 ? COLORS.emerald : COLORS.amber },
            ]}
          >
            {props.averageAttendance}%
          </Text>
        </View>
        <View style={[styles.metaCell, styles.metaCellLast]}>
          <Text style={styles.metaLabel}>Estado DGERT</Text>
          <Text style={[styles.metaValue, { color: COLORS.emerald }]}>Em curso</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>3 · Apreciação pedagógica</Text>
      <Text style={styles.ataParagraph}>
        O formador reportou execução conforme o programa aprovado pela DGERT,
        com cobertura integral dos objetivos específicos previstos no plano de
        sessão. A adesão dos formandos manteve-se acima da meta operacional
        (75%) e os recursos didáticos foram utilizados conforme planeado, sem
        ocorrências relevantes.
      </Text>
      {props.notes && (
        <Text style={styles.ataParagraph}>
          <Text style={styles.ataNumeric}>Notas adicionais: </Text>
          {props.notes}
        </Text>
      )}

      <Text style={styles.sectionLabel}>4 · Decisões e ações</Text>
      <View style={{ marginBottom: 16 }}>
        <BulletItem
          label="Validação"
          text="Plano de sessão validado conforme calendário aprovado."
        />
        <BulletItem
          label="Materiais"
          text="Recursos didáticos digitalizados e disponibilizados no Moodle."
        />
        <BulletItem
          label="Próximos passos"
          text="Agendamento da reunião de avaliação final após a sessão de encerramento."
        />
      </View>

      <Text style={styles.sectionLabel}>5 · Validação e assinaturas</Text>
      <View style={styles.sigBlock}>
        <View style={styles.sigCell}>
          <View style={{ alignItems: "center", marginBottom: 4 }}>
            <SignatureGlyph seed={seedFromString(props.trainerName)} />
          </View>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Formador</Text>
          <Text style={styles.sigName}>{props.trainerName}</Text>
        </View>
        <View style={styles.sigCell}>
          <View style={{ alignItems: "center", marginBottom: 4 }}>
            <SignatureGlyph seed={seedFromString("Silva Neves")} />
          </View>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Coordenador Pedagógico</Text>
          <Text style={styles.sigName}>Dr. Silva Neves · {props.tenantName}</Text>
        </View>
      </View>
    </DgertDocument>
  );
}

function BulletItem({ label, text }: { label: string; text: string }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 6 }}>
      <Text
        style={{
          fontFamily: "Helvetica-Bold",
          color: COLORS.gold,
          fontSize: 9,
          width: 80,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <Text style={{ flex: 1, fontSize: 10, lineHeight: 1.5 }}>{text}</Text>
    </View>
  );
}
