import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles, COLORS, formatDate } from './pdfStyles';

// ─── Pie de página ────────────────────────────────────────────────────────────
export function PdfFooter({ eventName, sectionLabel }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        {eventName} · {sectionLabel}
      </Text>
      <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
        `Página ${pageNumber} de ${totalPages}`
      } />
    </View>
  );
}

// ─── Cabecera de evento ───────────────────────────────────────────────────────
export function PdfHeader({ event, sectionLabel, sectionIcon = '📄' }) {
  const dateStr = event?.eventDate ? formatDate(event.eventDate) : '';
  return (
    <View style={styles.headerBand} fixed>
      <Text style={styles.headerSalon}>Salón de Eventos</Text>
      <Text style={styles.headerEventName}>{event?.clientName || 'Evento'}</Text>
      {dateStr ? <Text style={styles.headerMeta}>{event?.typeLabel || ''} · {dateStr}</Text> : null}
      {event?.venue ? <Text style={styles.headerMeta}>📍 {event.venue}</Text> : null}
      <Text style={styles.headerSection}>{sectionIcon}  {sectionLabel}</Text>
    </View>
  );
}

// ─── Wrapper de página estándar ───────────────────────────────────────────────
export function PdfPage({ event, sectionLabel, sectionIcon, children }) {
  return (
    <Page size="A4" style={styles.page}>
      <PdfHeader event={event} sectionLabel={sectionLabel} sectionIcon={sectionIcon} />
      <View style={styles.body}>
        {children}
      </View>
      <PdfFooter eventName={event?.clientName || ''} sectionLabel={sectionLabel} />
    </Page>
  );
}

