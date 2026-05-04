import { StyleSheet } from "@react-pdf/renderer";

export const COLORS = {
  navy: "#0B2447",
  navyDeep: "#000F27",
  navyLight: "#1A3A6B",
  gold: "#CCA823",
  goldLight: "#E9C33F",
  goldSubtle: "#FEF6DA",
  text: "#0B1C30",
  textMuted: "#44474E",
  textSubtle: "#74777F",
  border: "#C4C6CF",
  borderLight: "#E2E5EB",
  surfaceLow: "#EFF4FF",
  surfaceMid: "#E5EEFF",
  white: "#FFFFFF",
  emerald: "#059669",
  red: "#BA1A1A",
  amber: "#B45309",
} as const;

export const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },

  // ── header ────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderBottomStyle: "solid",
  },
  logoBox: {
    width: 90,
    height: 36,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  logoBoxNavy: {
    backgroundColor: COLORS.navy,
  },
  logoBoxClient: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "solid",
  },
  logoBoxDgert: {
    backgroundColor: COLORS.surfaceMid,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderStyle: "solid",
  },
  logoText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
  },
  logoTextMuted: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  logoTextDgertNum: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
  },
  logoTextDgertLabel: {
    fontSize: 7,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  // ── document title ────────────────────────────────────────────────────
  docTitleWrap: {
    marginBottom: 16,
  },
  docKicker: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.gold,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  docTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
    letterSpacing: 0.2,
  },
  docSubtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  // ── meta block ────────────────────────────────────────────────────────
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "solid",
    borderRadius: 4,
  },
  metaCell: {
    width: "25%",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
    borderRightStyle: "solid",
  },
  metaCellLast: {
    borderRightWidth: 0,
  },
  metaLabel: {
    fontSize: 7,
    color: COLORS.textSubtle,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 10,
    color: COLORS.navy,
    fontFamily: "Helvetica-Bold",
  },

  // ── attendance table ──────────────────────────────────────────────────
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "solid",
    borderRadius: 4,
    overflow: "hidden",
  },
  thead: {
    flexDirection: "row",
    backgroundColor: COLORS.navy,
    color: COLORS.white,
  },
  th: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tr: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderLight,
    borderTopStyle: "solid",
    minHeight: 38,
    alignItems: "center",
  },
  trEven: {
    backgroundColor: COLORS.surfaceLow,
  },
  td: {
    fontSize: 9,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },

  // ── section label ─────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 18,
    marginBottom: 8,
  },

  // ── footer ────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderLight,
    borderTopStyle: "solid",
    fontSize: 7,
    color: COLORS.textSubtle,
  },
  footerStrong: {
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
  },

  // ── signature lines (formador / coordenador) ──────────────────────────
  sigBlock: {
    flexDirection: "row",
    gap: 28,
    marginTop: 32,
  },
  sigCell: {
    flex: 1,
  },
  sigLine: {
    height: 0.5,
    backgroundColor: COLORS.text,
    marginBottom: 6,
  },
  sigLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sigName: {
    fontSize: 9,
    color: COLORS.text,
    marginTop: 1,
  },

  // ── pill / badges ─────────────────────────────────────────────────────
  pillSigned: {
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 0.5,
    borderColor: COLORS.emerald,
    borderStyle: "solid",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: COLORS.emerald,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  pillAbsent: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: COLORS.red,
    backgroundColor: "#FEE2E2",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  pillNeutral: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textMuted,
    backgroundColor: COLORS.surfaceLow,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  // ── identification fields (Ficha de Inscrição) ────────────────────────
  fieldRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  field: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.text,
    borderBottomStyle: "solid",
    paddingBottom: 3,
  },
  fieldLabel: {
    fontSize: 7,
    color: COLORS.textSubtle,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  fieldValue: {
    fontSize: 10,
    color: COLORS.text,
  },

  // ── ata reuniao ───────────────────────────────────────────────────────
  ataParagraph: {
    fontSize: 10,
    lineHeight: 1.5,
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "justify",
  },
  ataNumeric: {
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
  },
});
