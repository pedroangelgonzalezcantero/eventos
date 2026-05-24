import { StyleSheet, Font } from '@react-pdf/renderer';

// ─── Paleta de colores ───────────────────────────────────────────────
export const COLORS = {
  primary:      '#9f1239',  // rose-800
  primaryLight: '#fef1f2',  // rose-50
  accent:       '#be123c',  // rose-700
  gold:         '#92400e',  // amber-800
  goldBg:       '#fffbeb',  // amber-50
  dark:         '#1c1917',  // stone-900
  medium:       '#57534e',  // stone-600
  light:        '#a8a29e',  // stone-400
  border:       '#e7e5e4',  // stone-200
  bg:           '#fafaf9',  // stone-50
  white:        '#ffffff',
  green:        '#166534',  // green-800
  greenBg:      '#f0fdf4',  // green-50
  amber:        '#92400e',  // amber-800
  amberBg:      '#fffbeb',  // amber-50
  purple:       '#581c87',  // purple-900
  purpleBg:     '#faf5ff',  // purple-50
};

// ─── Estilos globales ────────────────────────────────────────────────
export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: COLORS.white,
    paddingTop: 0,
    paddingBottom: 50,
    paddingHorizontal: 0,
  },

  // ── Cabecera ─────────────────────────────────────────────────────
  headerBand: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 24,
  },
  headerSalon: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#fda4af',       // rose-300
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headerEventName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 22,
    color: COLORS.white,
    marginBottom: 4,
  },
  headerMeta: {
    fontSize: 10,
    color: '#fecdd3',       // rose-200
    marginBottom: 2,
  },
  headerSection: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#fda4af',       // rose-300
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 12,
    paddingTop: 10,
    borderTop: '1pt solid #be123c',
  },

  // ── Cuerpo ────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 40,
    paddingTop: 28,
  },

  // ── Secciones ─────────────────────────────────────────────────────
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: COLORS.primary,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: `2pt solid ${COLORS.primary}`,
  },
  sectionSubtitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: COLORS.medium,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
  },

  // ── Tarjeta ───────────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.bg,
    border: `1pt solid ${COLORS.border}`,
    borderRadius: 6,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: COLORS.dark,
    marginBottom: 6,
  },
  cardText: {
    fontSize: 9.5,
    color: COLORS.medium,
    lineHeight: 1.5,
  },

  // ── Timeline ──────────────────────────────────────────────────────
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  timelineDotText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: COLORS.white,
  },
  timelineLine: {
    width: 1.5,
    backgroundColor: COLORS.border,
    marginHorizontal: 13,
    flex: 1,
    minHeight: 12,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: COLORS.bg,
    border: `1pt solid ${COLORS.border}`,
    borderRadius: 6,
    padding: 10,
    marginLeft: 10,
  },
  timelineTime: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: COLORS.accent,
    marginBottom: 2,
  },
  timelineDesc: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: COLORS.dark,
    marginBottom: 3,
  },
  timelineMeta: {
    fontSize: 9,
    color: COLORS.light,
    marginBottom: 1,
  },

  // ── Tabla ─────────────────────────────────────────────────────────
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 4,
    marginBottom: 1,
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottom: `1pt solid ${COLORS.border}`,
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: COLORS.bg,
    borderBottom: `1pt solid ${COLORS.border}`,
  },
  tableCell: {
    fontSize: 9,
    color: COLORS.dark,
  },
  tableCellBold: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: COLORS.dark,
  },

  // ── Badge ─────────────────────────────────────────────────────────
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 3,
    marginBottom: 2,
  },
  badgeText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
  },

  // ── Separador ─────────────────────────────────────────────────────
  divider: {
    border: `1pt solid ${COLORS.border}`,
    marginVertical: 14,
  },

  // ── Pie de página ─────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `1pt solid ${COLORS.border}`,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: COLORS.light,
  },

  // ── Sumarios ──────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
    border: `1pt solid #fecdd3`,
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 20,
    color: COLORS.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 8,
    color: COLORS.medium,
    textAlign: 'center',
  },

  // ── Info row ──────────────────────────────────────────────────────
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: COLORS.medium,
    width: 110,
  },
  infoValue: {
    fontSize: 9,
    color: COLORS.dark,
    flex: 1,
  },

  // ── Alerta ────────────────────────────────────────────────────────
  alertBox: {
    backgroundColor: COLORS.amberBg,
    border: `1pt solid #fcd34d`,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIcon: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: COLORS.amber,
    marginRight: 6,
  },
  alertText: {
    fontSize: 9,
    color: COLORS.amber,
    flex: 1,
    lineHeight: 1.5,
  },
});

// ─── Formateo de fecha ───────────────────────────────────────────────
export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch { return dateStr; }
}

export function formatCurrency(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

