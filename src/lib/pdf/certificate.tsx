import {
  Document,
  Page,
  View,
  Text,
  Svg,
  Path,
  Circle,
  G,
  Rect,
} from "@react-pdf/renderer";
import { COLORS } from "./styles";

export type CertificateData = {
  // tenant
  tenantName: string;
  tenantDgertCode: string;
  // entity (optional)
  entityName: string | null;
  // course
  courseName: string;
  courseCode: string;
  courseDurationHours: number;
  certificationLevel: "PARTICIPACAO" | "APROVEITAMENTO" | "COMPETENCIAS";
  // trainee
  traineeFullName: string;
  traineeDocumentNumber: string | null;
  traineeTaxId: string | null;
  // edition
  trainingActionCode: string;
  startDate: string;
  endDate: string;
  // certificate
  certificateNumber: string;
  verificationCode: string;
  issuedAt: string;
  // trainer
  trainerName: string;
  trainerCcpNumber: string | null;
};

const LEVEL_LABEL = {
  PARTICIPACAO: "PARTICIPAÇÃO",
  APROVEITAMENTO: "APROVEITAMENTO",
  COMPETENCIAS: "COMPETÊNCIAS",
} as const;

export function CertificatePdf({ data }: { data: CertificateData }) {
  const verifyUrl = `https://academiab2.vercel.app/verify/${data.verificationCode}`;

  return (
    <Document
      title={`Certificado ${data.certificateNumber} · ${data.traineeFullName}`}
      author={data.tenantName}
      subject="Certificado DGERT"
      creator="Academia Digital"
      producer="Academia Digital · DGERT compliant"
    >
      <Page
        size="A4"
        orientation="landscape"
        style={{
          padding: 40,
          backgroundColor: COLORS.white,
          fontFamily: "Helvetica",
        }}
      >
        {/* outer gold frame */}
        <View
          style={{
            flex: 1,
            borderWidth: 3,
            borderColor: COLORS.gold,
            padding: 8,
          }}
        >
          {/* inner navy frame */}
          <View
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: COLORS.navy,
              padding: 32,
              position: "relative",
            }}
          >
            {/* corner ornaments */}
            <CornerOrnament position="topLeft" />
            <CornerOrnament position="topRight" />
            <CornerOrnament position="bottomLeft" />
            <CornerOrnament position="bottomRight" />

            {/* header */}
            <View style={{ alignItems: "center", marginTop: 4 }}>
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Helvetica-Bold",
                  color: COLORS.gold,
                  letterSpacing: 4,
                  marginBottom: 4,
                }}
              >
                CERTIFICAÇÃO PROFISSIONAL
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: "Helvetica-Bold",
                  color: COLORS.navy,
                  marginBottom: 2,
                }}
              >
                {data.tenantName}
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  color: COLORS.textMuted,
                  letterSpacing: 1,
                }}
              >
                Entidade Formadora certificada DGERT {data.tenantDgertCode}
              </Text>
            </View>

            {/* divider */}
            <View
              style={{
                marginVertical: 18,
                height: 1,
                backgroundColor: COLORS.gold,
                opacity: 0.4,
                width: "60%",
                alignSelf: "center",
              }}
            />

            {/* preamble */}
            <Text
              style={{
                fontSize: 12,
                color: COLORS.textMuted,
                textAlign: "center",
                marginBottom: 14,
              }}
            >
              Certifica-se que
            </Text>

            {/* name */}
            <Text
              style={{
                fontSize: 32,
                fontFamily: "Helvetica-Bold",
                color: COLORS.navy,
                textAlign: "center",
                marginBottom: 6,
              }}
            >
              {data.traineeFullName}
            </Text>

            {/* identification */}
            <Text
              style={{
                fontSize: 9,
                color: COLORS.textSubtle,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              {[
                data.traineeDocumentNumber
                  ? `Documento ${data.traineeDocumentNumber}`
                  : null,
                data.traineeTaxId ? `NIF ${data.traineeTaxId}` : null,
              ]
                .filter(Boolean)
                .join("  ·  ")}
            </Text>

            {/* statement */}
            <Text
              style={{
                fontSize: 12,
                color: COLORS.text,
                textAlign: "center",
                lineHeight: 1.6,
                marginBottom: 16,
                paddingHorizontal: 60,
              }}
            >
              concluiu, com{" "}
              <Text style={{ fontFamily: "Helvetica-Bold", color: COLORS.gold }}>
                {LEVEL_LABEL[data.certificationLevel]}
              </Text>
              , a ação de formação
            </Text>

            {/* course name */}
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Helvetica-Bold",
                color: COLORS.navy,
                textAlign: "center",
                marginBottom: 10,
                paddingHorizontal: 40,
              }}
            >
              {data.courseName}
            </Text>

            {/* details */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 24,
                marginBottom: 20,
              }}
            >
              <DetailItem label="Código" value={data.courseCode} />
              <DetailItem
                label="Duração"
                value={`${data.courseDurationHours}h`}
              />
              <DetailItem
                label="Período"
                value={`${data.startDate} – ${data.endDate}`}
              />
              {data.entityName && (
                <DetailItem label="Cliente" value={data.entityName} />
              )}
            </View>

            {/* signatures + verification */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginTop: "auto",
                paddingTop: 18,
              }}
            >
              {/* trainer signature */}
              <View style={{ alignItems: "center", width: 200 }}>
                <View
                  style={{
                    height: 32,
                    borderBottomWidth: 0.5,
                    borderBottomColor: COLORS.text,
                    width: "100%",
                  }}
                />
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: "Helvetica-Bold",
                    color: COLORS.navy,
                    marginTop: 4,
                  }}
                >
                  {data.trainerName}
                </Text>
                <Text style={{ fontSize: 7, color: COLORS.textSubtle }}>
                  Formador
                  {data.trainerCcpNumber ? ` · CCP ${data.trainerCcpNumber}` : ""}
                </Text>
              </View>

              {/* QR placeholder */}
              <View style={{ alignItems: "center" }}>
                <QrPlaceholder code={data.verificationCode} />
                <Text
                  style={{
                    fontSize: 7,
                    color: COLORS.textSubtle,
                    marginTop: 4,
                    fontFamily: "Helvetica-Bold",
                    letterSpacing: 0.6,
                  }}
                >
                  VERIFICAR EM
                </Text>
                <Text
                  style={{
                    fontSize: 7,
                    color: COLORS.gold,
                    fontFamily: "Helvetica-Bold",
                  }}
                >
                  {verifyUrl.replace(/^https?:\/\//, "")}
                </Text>
              </View>

              {/* tenant seal */}
              <View style={{ alignItems: "center", width: 200 }}>
                <View
                  style={{
                    height: 32,
                    borderBottomWidth: 0.5,
                    borderBottomColor: COLORS.text,
                    width: "100%",
                  }}
                />
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: "Helvetica-Bold",
                    color: COLORS.navy,
                    marginTop: 4,
                  }}
                >
                  {data.tenantName}
                </Text>
                <Text style={{ fontSize: 7, color: COLORS.textSubtle }}>
                  Entidade Formadora · DGERT {data.tenantDgertCode}
                </Text>
              </View>
            </View>

            {/* footer meta */}
            <View
              style={{
                marginTop: 12,
                paddingTop: 8,
                borderTopWidth: 0.5,
                borderTopColor: COLORS.borderLight,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: 7, color: COLORS.textSubtle }}>
                Certificado nº{" "}
                <Text style={{ fontFamily: "Helvetica-Bold", color: COLORS.navy }}>
                  {data.certificateNumber}
                </Text>{" "}
                · emitido em {data.issuedAt}
              </Text>
              <Text style={{ fontSize: 7, color: COLORS.textSubtle }}>
                Acção de formação {data.trainingActionCode} · IMP_30_DTP_Certificado v3.0
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text
        style={{
          fontSize: 7,
          color: COLORS.textSubtle,
          letterSpacing: 0.6,
          fontFamily: "Helvetica-Bold",
        }}
      >
        {label.toUpperCase()}
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: COLORS.text,
          fontFamily: "Helvetica-Bold",
          marginTop: 2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function CornerOrnament({
  position,
}: {
  position: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
}) {
  const isLeft = position.endsWith("Left");
  const isTop = position.startsWith("top");
  return (
    <View
      style={{
        position: "absolute",
        ...(isTop ? { top: 8 } : { bottom: 8 }),
        ...(isLeft ? { left: 8 } : { right: 8 }),
      }}
    >
      <Svg width="36" height="36" viewBox="0 0 36 36">
        <G>
          <Path
            d={
              isTop && isLeft
                ? "M 0 0 L 32 0 M 0 0 L 0 32 M 0 0 L 18 18"
                : isTop && !isLeft
                ? "M 36 0 L 4 0 M 36 0 L 36 32 M 36 0 L 18 18"
                : !isTop && isLeft
                ? "M 0 36 L 32 36 M 0 36 L 0 4 M 0 36 L 18 18"
                : "M 36 36 L 4 36 M 36 36 L 36 4 M 36 36 L 18 18"
            }
            stroke={COLORS.gold}
            strokeWidth="0.6"
            fill="none"
          />
        </G>
      </Svg>
    </View>
  );
}

/**
 * Stylized QR-like square as visual placeholder for the actual QR code
 * (rendering real QR in @react-pdf requires an extra dependency or a
 * pre-rendered PNG — keep visual identity for now).
 */
function QrPlaceholder({ code }: { code: string }) {
  // Generate a deterministic 7×7 pattern from the code for visual variety
  const cells: boolean[] = [];
  let h = 0;
  for (let i = 0; i < code.length; i++) {
    h = (h * 31 + code.charCodeAt(i)) >>> 0;
  }
  for (let i = 0; i < 49; i++) {
    cells.push(((h >> (i % 31)) & 1) === 1);
  }
  // Force corner finder patterns
  const finder = [0, 1, 2, 3, 7, 8, 9, 14, 15, 16, 21, 28, 33, 34, 35, 40, 41, 42, 47];
  for (const idx of finder) cells[idx] = true;

  return (
    <View
      style={{
        width: 60,
        height: 60,
        backgroundColor: COLORS.white,
        padding: 4,
        borderWidth: 0.5,
        borderColor: COLORS.border,
      }}
    >
      <Svg width="52" height="52" viewBox="0 0 7 7">
        <Rect x="0" y="0" width="7" height="7" fill={COLORS.white} />
        {cells.map((on, i) =>
          on ? (
            <Rect
              key={i}
              x={i % 7}
              y={Math.floor(i / 7)}
              width="1"
              height="1"
              fill={COLORS.navy}
            />
          ) : null
        )}
        {/* corner finder squares */}
        <Rect x="0" y="0" width="2" height="2" fill={COLORS.navy} />
        <Rect x="5" y="0" width="2" height="2" fill={COLORS.navy} />
        <Rect x="0" y="5" width="2" height="2" fill={COLORS.navy} />
        <Circle cx="1" cy="1" r="0.3" fill={COLORS.white} />
        <Circle cx="6" cy="1" r="0.3" fill={COLORS.white} />
        <Circle cx="1" cy="6" r="0.3" fill={COLORS.white} />
      </Svg>
    </View>
  );
}
