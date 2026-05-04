import { View, Text } from "@react-pdf/renderer";
import { DgertDocument, SignatureGlyph, seedFromString } from "./dgert-document";
import { styles, COLORS } from "./styles";

type Props = {
  tenantName: string;
  entityName: string;
  dgertCode: string;
  // course
  courseName: string;
  courseCode: string;
  courseDurationHours: number;
  courseModality: string;
  trainingActionCode: string;
  startDate: string;
  endDate: string;
  // trainee
  traineeFullName: string;
  traineeEmail: string;
  traineeDocumentNumber: string;
  traineeNif: string;
  traineeBirthDate: string;
  traineeAddress: string;
  traineeProfession: string;
  traineeQualification: string;
};

export function FichaInscricaoPdf(props: Props) {
  return (
    <DgertDocument
      header={{
        tenantName: props.tenantName,
        entityName: props.entityName,
        dgertCode: props.dgertCode,
      }}
      kicker="Dossier Técnico-Pedagógico · Documento 06"
      title="Ficha de Inscrição"
      subtitle={`${props.courseName} · Turma ${props.trainingActionCode}`}
      docCode="IMP_06_DTP_FichaInscricao v3.0"
    >
      {/* course meta */}
      <View style={styles.metaGrid}>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Curso</Text>
          <Text style={styles.metaValue}>{props.courseCode}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Duração</Text>
          <Text style={styles.metaValue}>{props.courseDurationHours}h</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Modalidade</Text>
          <Text style={styles.metaValue}>{props.courseModality}</Text>
        </View>
        <View style={[styles.metaCell, styles.metaCellLast]}>
          <Text style={styles.metaLabel}>Período</Text>
          <Text style={styles.metaValue}>
            {props.startDate} → {props.endDate}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>1 · Identificação do formando</Text>

      <View style={styles.fieldRow}>
        <View style={[styles.field, { flex: 2 }]}>
          <Text style={styles.fieldLabel}>Nome Completo</Text>
          <Text style={styles.fieldValue}>{props.traineeFullName}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Data de Nascimento</Text>
          <Text style={styles.fieldValue}>{props.traineeBirthDate}</Text>
        </View>
      </View>

      <View style={styles.fieldRow}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Cartão de Cidadão / Passaporte</Text>
          <Text style={styles.fieldValue}>{props.traineeDocumentNumber}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>NIF</Text>
          <Text style={styles.fieldValue}>{props.traineeNif}</Text>
        </View>
      </View>

      <View style={styles.fieldRow}>
        <View style={[styles.field, { flex: 2 }]}>
          <Text style={styles.fieldLabel}>Morada Completa</Text>
          <Text style={styles.fieldValue}>{props.traineeAddress}</Text>
        </View>
      </View>

      <View style={styles.fieldRow}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Profissão</Text>
          <Text style={styles.fieldValue}>{props.traineeProfession}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Habilitações Académicas</Text>
          <Text style={styles.fieldValue}>{props.traineeQualification}</Text>
        </View>
      </View>

      <View style={styles.fieldRow}>
        <View style={[styles.field, { flex: 2 }]}>
          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.fieldValue}>{props.traineeEmail}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Empresa</Text>
          <Text style={styles.fieldValue}>{props.entityName}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>2 · Termo de consentimento RGPD</Text>
      <Text
        style={{
          fontSize: 9,
          lineHeight: 1.55,
          color: COLORS.textMuted,
          textAlign: "justify",
          marginBottom: 16,
        }}
      >
        Declaro ter conhecimento que os dados pessoais recolhidos serão usados
        para os efeitos de gestão da formação profissional, emissão de
        certificado e cumprimento das obrigações legais previstas no SIGO
        (Portaria n.º 474/2010) e no RGPD (Regulamento UE 2016/679). Autorizo o
        tratamento destes dados pela {props.tenantName} e pela entidade
        cliente {props.entityName} para os fins descritos.
      </Text>

      <Text style={styles.sectionLabel}>3 · Assinatura</Text>
      <View style={styles.sigBlock}>
        <View style={styles.sigCell}>
          <View style={{ alignItems: "center", marginBottom: 4 }}>
            <SignatureGlyph seed={seedFromString(props.traineeFullName)} />
          </View>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Formando</Text>
          <Text style={styles.sigName}>{props.traineeFullName}</Text>
        </View>
        <View style={styles.sigCell}>
          <View style={{ height: 32 }} />
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Pelo organismo formador</Text>
          <Text style={styles.sigName}>Dr. Silva Neves · {props.tenantName}</Text>
        </View>
      </View>
    </DgertDocument>
  );
}
