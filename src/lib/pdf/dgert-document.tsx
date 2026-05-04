import { Document, Page, View, Text, Svg, Path } from "@react-pdf/renderer";
import { styles, COLORS } from "./styles";

export type DgertHeaderProps = {
  tenantName: string;
  entityName: string;
  dgertCode: string;
};

export type DgertDocumentProps = {
  /** Top-of-page kicker (e.g. "DOSSIER TÉCNICO-PEDAGÓGICO") */
  kicker: string;
  /** Main title shown below the kicker */
  title: string;
  /** Sub-line under the title */
  subtitle?: string;
  /** Three-logo header info */
  header: DgertHeaderProps;
  /** Footer doc reference (e.g. "IMP_04_DTP_FolhaPresencas v3.0") */
  docCode: string;
  /** Page body */
  children: React.ReactNode;
};

export function DgertDocument({
  kicker,
  title,
  subtitle,
  header,
  docCode,
  children,
}: DgertDocumentProps) {
  const generatedAt = new Date().toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Document
      title={title}
      author={header.tenantName}
      subject={kicker}
      creator="Academia Digital"
      producer="Academia Digital · DGERT compliant"
    >
      <Page size="A4" style={styles.page}>
        <DgertHeader {...header} />

        <View style={styles.docTitleWrap}>
          <Text style={styles.docKicker}>{kicker}</Text>
          <Text style={styles.docTitle}>{title}</Text>
          {subtitle && <Text style={styles.docSubtitle}>{subtitle}</Text>}
        </View>

        <View>{children}</View>

        <View style={styles.footer} fixed>
          <Text>
            <Text style={styles.footerStrong}>{header.tenantName}</Text> ·
            DGERT {header.dgertCode} · {docCode}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Pág. ${pageNumber}/${totalPages} · Gerado ${generatedAt}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

function DgertHeader({ tenantName, entityName, dgertCode }: DgertHeaderProps) {
  const tenantInitials = initials(tenantName);
  const entityInitials = initials(entityName);

  return (
    <View style={styles.header} fixed>
      {/* Tenant logo (formação) */}
      <View style={[styles.logoBox, styles.logoBoxNavy]}>
        <Text style={styles.logoText}>{tenantInitials}</Text>
        <Text style={[styles.logoTextMuted, { color: COLORS.goldLight }]}>
          Formação
        </Text>
      </View>

      {/* Client entity logo */}
      <View style={[styles.logoBox, styles.logoBoxClient]}>
        <Text style={[styles.logoText, { color: COLORS.navy, fontSize: 10 }]}>
          {entityInitials}
        </Text>
        <Text style={styles.logoTextMuted}>Cliente</Text>
      </View>

      {/* DGERT logo */}
      <View style={[styles.logoBox, styles.logoBoxDgert]}>
        <Text style={styles.logoTextDgertNum}>DGERT</Text>
        <Text style={styles.logoTextDgertLabel}>{dgertCode}</Text>
      </View>
    </View>
  );
}

/**
 * Generates a stylised signature curve. The seed varies the path so each
 * person's signature looks distinct but consistent.
 */
export function SignatureGlyph({ seed = 0, color = COLORS.navy }: { seed?: number; color?: string }) {
  const a = 5 + (seed % 8);
  const b = 18 + ((seed * 3) % 12);
  const c = 22 + ((seed * 5) % 10);
  const d = 35 + ((seed * 7) % 15);
  const path = `M 5 22 Q ${a} 6, ${a + 8} 22 T ${b + 5} 24 Q ${c + 8} 8, ${c + 16} 26 T ${d + 32} 24 L ${d + 38} 22`;
  return (
    <Svg width="110" height="32" viewBox="0 0 120 36">
      <Path d={path} stroke={color} strokeWidth="1.4" fill="none" />
      <Path
        d={`M ${a + 18} 26 L ${a + 22} 30`}
        stroke={color}
        strokeWidth="1.2"
        fill="none"
      />
    </Svg>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Maps a string to a stable numeric seed for SignatureGlyph variation.
 */
export function seedFromString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
