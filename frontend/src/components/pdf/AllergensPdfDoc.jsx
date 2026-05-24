import React from 'react';
import { Document, View, Text, Page } from '@react-pdf/renderer';
import { styles, COLORS, formatDate } from './pdfStyles';
import { PdfPage, PdfHeader, PdfFooter } from './PdfPageBase';

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
 * PDF Alérgenos — dos secciones: por mesa y por tipo de alergia
 * data = { event, allergens: [ { id, guestName, tableNumber, allergies, diet, observations } ] }
 */
export default function AllergensPdfDoc({ data }) {
  const { event, allergens = [] } = data;

  // Agrupar por mesa
  const byTable = allergens.reduce((acc, a) => {
    const t = a.tableNumber || 'Sin mesa asignada';
    (acc[t] = acc[t] || []).push(a);
    return acc;
  }, {});

  // Agrupar por alérgeno
  const byAllergen = {};
  allergens.forEach(a => {
    if (a.allergies) {
      a.allergies.split(',').filter(Boolean).forEach(code => {
        (byAllergen[code] = byAllergen[code] || []).push(a);
      });
    }
    if (a.diet) {
      const key = `DIET_${a.diet}`;
      (byAllergen[key] = byAllergen[key] || []).push(a);
    }
  });

  const LABEL_NAME = 'Alérgenos y Dietas Especiales';

  return (
    <Document title={`Alergias - ${event?.clientName}`} author="Sistema de Eventos" subject="Alérgenos y dietas">

      {/* ── Página 1: Por mesa ───────────────────────── */}
      <PdfPage event={event} sectionLabel={LABEL_NAME} sectionIcon="⚠️">

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{allergens.length}</Text>
            <Text style={styles.statLabel}>Personas con restricciones</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: COLORS.amberBg, borderColor: '#fcd34d' }]}>
            <Text style={[styles.statValue, { color: COLORS.amber }]}>
              {allergens.filter(a => a.allergies).length}
            </Text>
            <Text style={styles.statLabel}>Con alérgenos</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: COLORS.purpleBg, borderColor: '#e9d5ff' }]}>
            <Text style={[styles.statValue, { color: COLORS.purple }]}>
              {allergens.filter(a => a.diet).length}
            </Text>
            <Text style={styles.statLabel}>Con dieta especial</Text>
          </View>
        </View>

        {/* Advertencia */}
        <View style={styles.alertBox}>
          <Text style={styles.alertIcon}>⚠</Text>
          <Text style={styles.alertText}>
            ATENCIÓN: Este documento contiene información crítica sobre alergias alimentarias.
            Por favor, verifica cada restricción antes de servir. Una alergia mal gestionada
            puede poner en peligro la vida de un comensal.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Vista por mesa</Text>

        {Object.keys(byTable).length === 0 ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 24 }]}>
            <Text style={{ fontSize: 10, color: COLORS.light }}>No hay alérgenos registrados para este evento</Text>
          </View>
        ) : (
          Object.entries(byTable).sort(([a], [b]) => a.localeCompare(b)).map(([tableName, entries]) => (
            <View key={tableName} style={[styles.card, { borderColor: '#fcd34d' }]} wrap={false}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottom: `1pt solid #fcd34d` }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#92400e', flex: 1 }}>
                  📍 {tableName}
                </Text>
                <Text style={{ fontSize: 8, color: COLORS.light }}>{entries.length} persona{entries.length !== 1 ? 's' : ''}</Text>
              </View>

              {entries.map((e, ei) => (
                <View key={e.id || ei} style={{
                  paddingVertical: 6,
                  borderBottom: ei < entries.length - 1 ? `1pt solid ${COLORS.border}` : 'none',
                }}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: COLORS.dark, marginBottom: 4 }}>
                    {e.guestName}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
                    {e.diet ? (
                      <View style={[styles.badge, { backgroundColor: COLORS.purpleBg }]}>
                        <Text style={[styles.badgeText, { color: COLORS.purple }]}>{DIET_LABELS[e.diet] || e.diet}</Text>
                      </View>
                    ) : null}
                    {e.allergies ? e.allergies.split(',').filter(Boolean).map(a => (
                      <View key={a} style={[styles.badge, { backgroundColor: COLORS.amberBg }]}>
                        <Text style={[styles.badgeText, { color: COLORS.amber }]}>⚠ {ALLERGEN_LABELS[a] || a}</Text>
                      </View>
                    )) : null}
                  </View>
                  {e.observations ? (
                    <Text style={[styles.cardText, { marginTop: 3, fontStyle: 'italic' }]}>💬 {e.observations}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ))
        )}
      </PdfPage>

      {/* ── Página 2: Por tipo de alergia ─────────────── */}
      <Page size="A4" style={styles.page}>
        <PdfHeader event={event} sectionLabel={`${LABEL_NAME} — Por tipo`} sectionIcon="🔖" />
        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Vista por tipo de alergia / dieta</Text>

          {Object.keys(byAllergen).length === 0 ? (
            <View style={[styles.card, { alignItems: 'center', paddingVertical: 24 }]}>
              <Text style={{ fontSize: 10, color: COLORS.light }}>Sin datos</Text>
            </View>
          ) : (
            Object.entries(byAllergen).sort(([a], [b]) => a.localeCompare(b)).map(([code, people]) => {
              const isDict = code.startsWith('DIET_');
              const displayLabel = isDict
                ? `Dieta: ${DIET_LABELS[code.replace('DIET_', '')] || code.replace('DIET_', '')}`
                : (ALLERGEN_LABELS[code] || code);
              const bgColor = isDict ? COLORS.purpleBg : COLORS.amberBg;
              const textColor = isDict ? COLORS.purple : COLORS.amber;

              return (
                <View key={code} style={[styles.card, { borderColor: isDict ? '#e9d5ff' : '#fcd34d' }]} wrap={false}>
                  <View style={[{ backgroundColor: bgColor, marginHorizontal: -14, marginTop: -14, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 4 }]}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: textColor }}>
                      {isDict ? '🥗' : '⚠'} {displayLabel}
                      {'  '}
                      <Text style={{ fontSize: 8, fontFamily: 'Helvetica' }}>
                        ({people.length} persona{people.length !== 1 ? 's' : ''})
                      </Text>
                    </Text>
                  </View>
                  {people.map((p, pi) => (
                    <View key={p.id || pi} style={{
                      flexDirection: 'row',
                      paddingVertical: 4,
                      borderBottom: pi < people.length - 1 ? `1pt solid ${COLORS.border}` : 'none',
                    }}>
                      <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: COLORS.dark, flex: 1 }}>
                        {p.guestName}
                      </Text>
                      <Text style={{ fontSize: 9, color: COLORS.medium, flex: 1 }}>
                        {p.tableNumber ? `📍 ${p.tableNumber}` : 'Sin mesa'}
                      </Text>
                      {p.observations ? (
                        <Text style={{ fontSize: 8, color: COLORS.light, flex: 1, fontStyle: 'italic' }}>{p.observations}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              );
            })
          )}
        </View>
        <PdfFooter eventName={event?.clientName || ''} sectionLabel={LABEL_NAME} />
      </Page>
    </Document>
  );
}

