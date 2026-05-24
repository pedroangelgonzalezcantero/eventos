import React from 'react';
import { Document, View, Text } from '@react-pdf/renderer';
import { styles, COLORS } from './pdfStyles';
import { PdfPage } from './PdfPageBase';

const ALLERGEN_LABELS = {
  GLUTEN:'Gluten/Celíaco', LACTEOS:'Lácteos', HUEVOS:'Huevos',
  FRUTOS_SECOS:'Frutos secos', CACAHUETES:'Cacahuetes', SOJA:'Soja',
  MARISCO:'Marisco', PESCADO:'Pescado', MOSTAZA:'Mostaza', APIO:'Apio',
  SESAMO:'Sésamo', SULFITOS:'Sulfitos', MOLUSCOS:'Moluscos', ALTRAMUZ:'Altramuces',
};

/**
 * PDF Protocolo del evento
 * data = { event, protocol: [ { id, eventTime, description, involvedPerson, youtubeLink, observations } ] }
 */
export default function ProtocolPdfDoc({ data }) {
  const { event, protocol = [] } = data;

  return (
    <Document
      title={`Protocolo - ${event?.clientName}`}
      author="Sistema de Eventos"
      subject="Protocolo musical y timeline"
    >
      <PdfPage event={event} sectionLabel="Protocolo del evento" sectionIcon="🎵">

        {/* Resumen */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{protocol.length}</Text>
            <Text style={styles.statLabel}>Momentos en el timeline</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
            <Text style={[styles.statValue, { color: '#1d4ed8' }]}>
              {protocol.filter(p => p.youtubeLink).length}
            </Text>
            <Text style={styles.statLabel}>Con canción / enlace</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
            <Text style={[styles.statValue, { color: '#166534' }]}>
              {protocol.filter(p => p.involvedPerson).length}
            </Text>
            <Text style={styles.statLabel}>Con persona implicada</Text>
          </View>
        </View>

        {/* Note informativa */}
        <View style={[styles.card, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', marginBottom: 18 }]}>
          <Text style={{ fontSize: 8.5, color: '#1e40af', lineHeight: 1.5 }}>
            Este documento contiene el protocolo oficial del evento. Por favor, revísalo antes del
            evento y contacta con administración si necesitas hacer cambios.
          </Text>
        </View>

        {/* Timeline */}
        {protocol.length === 0 ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 30 }]}>
            <Text style={{ fontSize: 10, color: COLORS.light }}>No hay momentos en el protocolo</Text>
          </View>
        ) : (
          protocol.map((item, i) => (
            <View key={item.id || i} style={styles.timelineItem} wrap={false}>
              {/* Dot */}
              <View style={{ alignItems: 'center', width: 28 }}>
                <View style={styles.timelineDot}>
                  <Text style={styles.timelineDotText}>{i + 1}</Text>
                </View>
                {i < protocol.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>

              {/* Content */}
              <View style={styles.timelineContent}>
                {item.eventTime ? (
                  <Text style={styles.timelineTime}>🕐 {item.eventTime}</Text>
                ) : null}
                <Text style={styles.timelineDesc}>{item.description}</Text>
                {item.involvedPerson ? (
                  <Text style={styles.timelineMeta}>👤 {item.involvedPerson}</Text>
                ) : null}
                {item.youtubeLink ? (
                  <Text style={[styles.timelineMeta, { color: '#2563eb' }]}>
                    🎵 {item.youtubeLink}
                  </Text>
                ) : null}
                {item.observations ? (
                  <Text style={[styles.timelineMeta, { fontStyle: 'italic', marginTop: 2 }]}>
                    💬 {item.observations}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        )}

        {/* Observaciones globales si existen */}
        {event?.notes ? (
          <View style={[styles.card, { marginTop: 16, borderColor: COLORS.primary, borderLeftWidth: 3 }]}>
            <Text style={[styles.cardTitle, { marginBottom: 4 }]}>Notas del evento</Text>
            <Text style={styles.cardText}>{event.notes}</Text>
          </View>
        ) : null}

      </PdfPage>
    </Document>
  );
}

