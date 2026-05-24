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

const DIET_LABELS = {
  VEGETARIANO:'Vegetariano', VEGANO:'Vegano', HALAL:'Halal',
  KOSHER:'Kosher', SIN_SAL:'Sin sal', DIABETICO:'Diabético',
};

/**
 * PDF Mesas y distribución
 * data = { event, tables: [ { id, name, capacity, guestCount, guests:[{guestName, diet, allergies, observations}] } ] }
 */
export default function TablesPdfDoc({ data }) {
  const { event, tables = [] } = data;
  const totalGuests = tables.reduce((s, t) => s + (t.guestCount || 0), 0);
  const withAllergies = tables.reduce((s, t) => s + (t.allergiesCount || 0), 0);

  return (
    <Document title={`Mesas - ${event?.clientName}`} author="Sistema de Eventos" subject="Distribución de mesas">
      <PdfPage event={event} sectionLabel="Distribución de mesas" sectionIcon="🪑">

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{tables.length}</Text>
            <Text style={styles.statLabel}>Mesas</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
            <Text style={[styles.statValue, { color: COLORS.green }]}>{totalGuests}</Text>
            <Text style={styles.statLabel}>Invitados totales</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: COLORS.amberBg, borderColor: '#fcd34d' }]}>
            <Text style={[styles.statValue, { color: COLORS.amber }]}>{withAllergies}</Text>
            <Text style={styles.statLabel}>Con alergias/dietas</Text>
          </View>
        </View>

        {/* Índice de mesas */}
        <Text style={styles.sectionTitle}>Resumen de mesas</Text>
        <View style={{ marginBottom: 16 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Mesa</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Invitados</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Capacidad</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Alergias</Text>
          </View>
          {tables.map((table, i) => (
            <View key={table.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
              <Text style={[styles.tableCellBold, { flex: 2 }]}>{table.name}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{table.guestCount || 0}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{table.capacity || '—'}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: table.allergiesCount > 0 ? COLORS.amber : COLORS.light }]}>
                {table.allergiesCount > 0 ? `⚠ ${table.allergiesCount}` : '—'}
              </Text>
            </View>
          ))}
        </View>

        {/* Detalle mesa por mesa */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Detalle por mesa</Text>
        {tables.length === 0 ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 24 }]}>
            <Text style={{ fontSize: 10, color: COLORS.light }}>No hay mesas configuradas</Text>
          </View>
        ) : (
          tables.map(table => (
            <View key={table.id} style={[styles.card, table.allergiesCount > 0 ? { borderColor: '#fcd34d' } : {}]} wrap={false}>
              {/* Cabecera de mesa */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottom: `1pt solid ${COLORS.border}` }}>
                <Text style={[styles.cardTitle, { flex: 1, marginBottom: 0 }]}>{table.name}</Text>
                <Text style={{ fontSize: 8.5, color: COLORS.medium }}>
                  {table.guestCount || 0}{table.capacity ? `/${table.capacity}` : ''} invitados
                </Text>
                {table.allergiesCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: COLORS.amberBg, borderColor: '#fcd34d', border: '1pt solid', marginLeft: 6 }]}>
                    <Text style={[styles.badgeText, { color: COLORS.amber }]}>⚠ {table.allergiesCount}</Text>
                  </View>
                )}
              </View>
              {table.notes ? (
                <Text style={[styles.cardText, { fontStyle: 'italic', marginBottom: 6 }]}>📝 {table.notes}</Text>
              ) : null}

              {/* Invitados */}
              {(table.guests || []).length === 0 ? (
                <Text style={[styles.tableCell, { color: COLORS.light, fontStyle: 'italic' }]}>Sin invitados asignados</Text>
              ) : (
                (table.guests || []).map((g, gi) => (
                  <View key={g.id || gi} style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    paddingVertical: 5,
                    borderBottom: gi < (table.guests.length - 1) ? `1pt solid ${COLORS.border}` : 'none',
                  }}>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.dark, flex: 1 }}>
                      {g.guestName}
                    </Text>
                    <View style={{ flex: 2, flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
                      {g.diet ? (
                        <View style={[styles.badge, { backgroundColor: COLORS.purpleBg }]}>
                          <Text style={[styles.badgeText, { color: COLORS.purple }]}>{DIET_LABELS[g.diet] || g.diet}</Text>
                        </View>
                      ) : null}
                      {g.allergies ? g.allergies.split(',').filter(Boolean).map(a => (
                        <View key={a} style={[styles.badge, { backgroundColor: COLORS.amberBg }]}>
                          <Text style={[styles.badgeText, { color: COLORS.amber }]}>⚠ {ALLERGEN_LABELS[a] || a}</Text>
                        </View>
                      )) : null}
                      {(!g.diet && !g.allergies) ? (
                        <Text style={[styles.tableCell, { color: COLORS.light, fontStyle: 'italic' }]}>Sin restricciones</Text>
                      ) : null}
                    </View>
                    {g.observations ? (
                      <Text style={[styles.tableCell, { flex: 1, color: COLORS.light, fontStyle: 'italic' }]}>{g.observations}</Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          ))
        )}

      </PdfPage>
    </Document>
  );
}

