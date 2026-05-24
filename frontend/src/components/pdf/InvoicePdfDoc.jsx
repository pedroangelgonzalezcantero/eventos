import React from 'react';
import { Document, View, Text } from '@react-pdf/renderer';
import { styles, COLORS, formatCurrency } from './pdfStyles';
import { PdfPage } from './PdfPageBase';

/**
 * PDF Facturación
 * data = { event, invoice: { invoiceNumber, totalAmount, paidAmount, pendingAmount, description, breakdown, signed, signedAt, payments: [] } }
 */
export default function InvoicePdfDoc({ data }) {
  const { event, invoice } = data;

  const pctPaid = invoice && invoice.totalAmount > 0
    ? Math.round((invoice.paidAmount / invoice.totalAmount) * 100)
    : 0;

  const METHOD_LABELS = {
    TRANSFERENCIA: 'Transferencia', EFECTIVO: 'Efectivo',
    TARJETA: 'Tarjeta', BIZUM: 'Bizum',
  };

  return (
    <Document title={`Facturación - ${event?.clientName}`} author="Sistema de Eventos" subject="Factura y pagos">
      <PdfPage event={event} sectionLabel="Facturación y pagos" sectionIcon="💶">

        {!invoice ? (
          <View style={[styles.alertBox]}>
            <Text style={styles.alertIcon}>⚠</Text>
            <Text style={styles.alertText}>No hay presupuesto registrado para este evento.</Text>
          </View>
        ) : (
          <>
            {/* Referencia y estado */}
            <View style={[styles.card, { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight, marginBottom: 20 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[styles.cardTitle, { flex: 1, color: COLORS.primary }]}>
                  Referencia: {invoice.invoiceNumber}
                </Text>
                {invoice.signed && (
                  <View style={[styles.badge, { backgroundColor: '#bbf7d0' }]}>
                    <Text style={[styles.badgeText, { color: COLORS.green }]}>✓ FIRMADO</Text>
                  </View>
                )}
              </View>
              {invoice.description ? (
                <Text style={[styles.cardText, { marginBottom: 6 }]}>{invoice.description}</Text>
              ) : null}
              {invoice.signed && invoice.signedAt ? (
                <Text style={[styles.cardText, { color: COLORS.green }]}>
                  Firmado el {new Date(invoice.signedAt).toLocaleDateString('es-ES')}
                </Text>
              ) : null}
            </View>

            {/* Resumen económico */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{formatCurrency(invoice.totalAmount)}</Text>
                <Text style={styles.statLabel}>Importe total</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                <Text style={[styles.statValue, { color: COLORS.green }]}>{formatCurrency(invoice.paidAmount)}</Text>
                <Text style={styles.statLabel}>Pagado</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: invoice.pendingAmount > 0 ? COLORS.amberBg : '#f0fdf4', borderColor: invoice.pendingAmount > 0 ? '#fcd34d' : '#bbf7d0' }]}>
                <Text style={[styles.statValue, { color: invoice.pendingAmount > 0 ? COLORS.amber : COLORS.green }]}>
                  {formatCurrency(invoice.pendingAmount)}
                </Text>
                <Text style={styles.statLabel}>Pendiente</Text>
              </View>
            </View>

            {/* Barra de progreso visual */}
            <View style={{ marginBottom: 16, marginTop: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 8, color: COLORS.medium }}>Progreso de pago</Text>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: pctPaid >= 100 ? COLORS.green : COLORS.amber }}>
                  {pctPaid}%
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' }}>
                <View style={{
                  height: 8,
                  width: `${Math.min(pctPaid, 100)}%`,
                  backgroundColor: pctPaid >= 100 ? '#22c55e' : pctPaid >= 50 ? '#f59e0b' : COLORS.primary,
                  borderRadius: 4,
                }} />
              </View>
            </View>

            {/* Desglose de conceptos */}
            {invoice.breakdown ? (
              <>
                <Text style={styles.sectionTitle}>Desglose de conceptos</Text>
                <View style={[styles.card, { marginBottom: 16 }]}>
                  {invoice.breakdown.split('\n').filter(Boolean).map((line, i) => (
                    <Text key={i} style={[styles.cardText, { marginBottom: 3 }]}>· {line}</Text>
                  ))}
                </View>
              </>
            ) : null}

            {/* Historial de pagos */}
            <Text style={styles.sectionTitle}>Historial de pagos</Text>
            {(!invoice.payments || invoice.payments.length === 0) ? (
              <View style={[styles.card, { alignItems: 'center', paddingVertical: 16 }]}>
                <Text style={{ fontSize: 9, color: COLORS.light }}>Sin pagos registrados</Text>
              </View>
            ) : (
              <>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Descripción</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>Importe</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'center' }]}>Fecha</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Método</Text>
                </View>
                {(invoice.payments || []).map((p, i) => (
                  <View key={p.id || i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{p.description || '—'}</Text>
                    <Text style={[styles.tableCellBold, { flex: 1.5, textAlign: 'right', color: COLORS.green }]}>
                      {formatCurrency(p.amount)}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'center' }]}>
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('es-ES') : '—'}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                      {METHOD_LABELS[p.method] || p.method || '—'}
                    </Text>
                  </View>
                ))}

                {/* Totales */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, paddingTop: 8, borderTop: `1.5pt solid ${COLORS.primary}` }}>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={{ flexDirection: 'row', gap: 20, marginBottom: 4 }}>
                      <Text style={{ fontSize: 9, color: COLORS.medium }}>Total pagado:</Text>
                      <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: COLORS.green }}>{formatCurrency(invoice.paidAmount)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 20 }}>
                      <Text style={{ fontSize: 9, color: COLORS.medium }}>Pendiente:</Text>
                      <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: invoice.pendingAmount > 0 ? COLORS.amber : COLORS.green }}>
                        {formatCurrency(invoice.pendingAmount)}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </>
        )}

      </PdfPage>
    </Document>
  );
}

