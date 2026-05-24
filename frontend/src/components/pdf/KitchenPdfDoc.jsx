import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles, COLORS, formatDate } from './pdfStyles';
import { PdfHeader, PdfFooter } from './PdfPageBase';

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

const SECTION = 'Dossier Cocina';
const ORANGE   = '#c2410c';
const ORANGE_BG = '#fff7ed';

function SectionBlock({ title, emoji, color = ORANGE, bgColor = ORANGE_BG }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', backgroundColor: bgColor,
      borderLeft: `4pt solid ${color}`, borderRadius: 4,
      paddingHorizontal: 12, paddingVertical: 8, marginTop: 18, marginBottom: 12,
    }}>
      <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 12, color, flex: 1 }}>{emoji}  {title}</Text>
    </View>
  );
}

const MENU_FIELDS = [
  ['Entrantes',     'starters'],
  ['Primer plato',  'firstCourse'],
  ['Segundo plato', 'secondCourse'],
  ['Postre',        'dessert'],
  ['Bebidas',       'drinks'],
  ['Extras / Obs.', 'extras'],
];

/**
 * PDF Cocina — menú confirmado + alérgenos detallados por mesa
 * data = { event, menus, allergens, tables }
 */
export default function KitchenPdfDoc({ data }) {
  const { event, menus = [], allergens = [], tables = [] } = data;

  const selectedMenu = menus.find(m => m.selected);
  const totalGuests  = tables.reduce((s, t) => s + (t.guestCount || 0), 0) || event?.estimatedGuests || 0;

  const allergensByTable = allergens.reduce((acc, a) => {
    const k = a.tableNumber || 'Sin mesa asignada';
    (acc[k] = acc[k] || []).push(a);
    return acc;
  }, {});

  // Estadísticas por tipo de restricción
  const byType = {};
  allergens.forEach(a => {
    if (a.diet) (byType[`DIET_${a.diet}`] = byType[`DIET_${a.diet}`] || []).push(a);
    if (a.allergies) a.allergies.split(',').filter(Boolean).forEach(c => {
      (byType[c] = byType[c] || []).push(a);
    });
  });

  return (
    <Document
      title={`Cocina - ${event?.clientName}`}
      author="Sistema de Eventos"
      subject="Dossier de cocina"
    >
      {/* ════════════════════════════════════════════════════════════
          PÁGINA 1 — RESUMEN + MENÚ COMPLETO
      ════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <PdfHeader event={event} sectionLabel={SECTION} sectionIcon="🍽️" />
        <View style={styles.body}>

          <SectionBlock title="Resumen del servicio" emoji="📋" />

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalGuests}</Text>
              <Text style={styles.statLabel}>Comensales totales</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: COLORS.amberBg, borderColor: '#fcd34d' }]}>
              <Text style={[styles.statValue, { color: COLORS.amber }]}>{allergens.length}</Text>
              <Text style={styles.statLabel}>Con restricciones</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: ORANGE_BG, borderColor: '#fed7aa' }]}>
              <Text style={[styles.statValue, { color: ORANGE }]}>{selectedMenu ? '✓' : '—'}</Text>
              <Text style={styles.statLabel}>Menú confirmado</Text>
            </View>
          </View>

          {/* Info del evento */}
          <View style={[styles.card, { marginBottom: 6 }]}>
            {[
              ['Evento',   event?.clientName],
              ['Fecha',    event?.eventDate ? formatDate(event.eventDate) : ''],
              ['Tipo',     event?.typeLabel],
              ['Invitados', totalGuests ? `${totalGuests} personas` : null],
            ].filter(([, v]) => v).map(([label, value]) => (
              <View key={label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Aviso sin menú */}
          {!selectedMenu ? (
            <View style={styles.alertBox}>
              <Text style={styles.alertIcon}>⚠</Text>
              <Text style={styles.alertText}>El cliente aún no ha confirmado el menú. Contactar con administración.</Text>
            </View>
          ) : null}

          {/* MENÚ PRINCIPAL */}
          <SectionBlock title="Menú contratado (confirmado por el cliente)" emoji="🍴" />

          {selectedMenu ? (
            <View style={[styles.card, { borderColor: '#fed7aa', backgroundColor: ORANGE_BG }]}>
              <Text style={[styles.cardTitle, { fontSize: 15, color: ORANGE, marginBottom: 10 }]}>{selectedMenu.name}</Text>
              {selectedMenu.description ? (
                <Text style={[styles.cardText, { marginBottom: 10, fontStyle: 'italic' }]}>{selectedMenu.description}</Text>
              ) : null}
              {MENU_FIELDS.filter(([, k]) => selectedMenu[k]).map(([label, key], fi) => (
                <View key={key} style={[styles.infoRow, {
                  paddingBottom: 8, marginBottom: 8,
                  borderBottom: fi < MENU_FIELDS.filter(([, k]) => selectedMenu[k]).length - 1 ? `1pt solid #fed7aa` : 'none',
                }]}>
                  <Text style={[styles.infoLabel, { color: ORANGE, fontFamily: 'Helvetica-Bold' }]}>{label}</Text>
                  <Text style={[styles.infoValue, { color: COLORS.dark }]}>{selectedMenu[key]}</Text>
                </View>
              ))}
              <View style={[styles.infoRow, { marginTop: 8, paddingTop: 8, borderTop: `2pt solid ${ORANGE}` }]}>
                <Text style={[styles.infoLabel, { color: ORANGE, fontFamily: 'Helvetica-Bold' }]}>Total comensales</Text>
                <Text style={[styles.infoValue, { fontFamily: 'Helvetica-Bold', fontSize: 15, color: ORANGE }]}>{totalGuests} personas</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.card, { alignItems: 'center', paddingVertical: 20 }]}>
              <Text style={{ fontSize: 10, color: COLORS.light }}>Sin menú confirmado</Text>
            </View>
          )}

          {/* Resumen rápido de restricciones */}
          {Object.keys(byType).length > 0 ? (
            <>
              <SectionBlock title="Resumen de restricciones alimentarias" emoji="📊" color={COLORS.amber} bgColor={COLORS.amberBg} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(byType).map(([code, people]) => {
                  const isDict = code.startsWith('DIET_');
                  const label = isDict
                    ? (DIET_LABELS[code.replace('DIET_', '')] || code.replace('DIET_', ''))
                    : (ALLERGEN_LABELS[code] || code);
                  return (
                    <View key={code} style={{
                      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
                      backgroundColor: isDict ? '#f3e8ff' : '#fef3c7',
                      border: `1pt solid ${isDict ? '#d8b4fe' : '#fcd34d'}`,
                    }}>
                      <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: isDict ? '#6b21a8' : '#92400e' }}>
                        {isDict ? '🥗' : '⚠'} {label} × {people.length}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          ) : null}
        </View>
        <PdfFooter eventName={event?.clientName || ''} sectionLabel={SECTION} />
      </Page>

      {/* ════════════════════════════════════════════════════════════
          PÁGINA 2 — ALÉRGENOS DETALLADOS POR MESA
      ════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <PdfHeader event={event} sectionLabel={SECTION} sectionIcon="🍽️" />
        <View style={styles.body}>
          <SectionBlock title="Alérgenos y dietas especiales · Por mesa" emoji="⚠️" color={COLORS.amber} bgColor={COLORS.amberBg} />

          <View style={styles.alertBox}>
            <Text style={styles.alertIcon}>⚠</Text>
            <Text style={styles.alertText}>
              CRÍTICO: Verificar cada restricción antes de emplatar.
              Separar físicamente los platos especiales. Etiquetar si es necesario.
            </Text>
          </View>

          {allergens.length === 0 ? (
            <View style={[styles.card, { alignItems: 'center', paddingVertical: 32, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: COLORS.green, marginBottom: 6 }}>✅ Sin restricciones</Text>
              <Text style={{ fontSize: 9, color: COLORS.medium }}>No hay alérgenos ni dietas especiales registradas para este evento.</Text>
            </View>
          ) : (
            Object.entries(allergensByTable).sort(([a], [b]) => a.localeCompare(b)).map(([tableName, entries]) => (
              <View key={tableName} style={{ backgroundColor: '#fffbeb', border: `2pt solid #fcd34d`, borderRadius: 8, padding: 12, marginBottom: 12 }} wrap={false}>
                {/* Header de mesa */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottom: `1.5pt solid #fcd34d` }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#fef3c7', border: `1.5pt solid #fcd34d`, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#92400e' }}>⚠</Text>
                  </View>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 13, color: '#92400e', flex: 1 }}>{tableName}</Text>
                  <Text style={{ fontSize: 9, color: COLORS.medium }}>{entries.length} {entries.length === 1 ? 'persona' : 'personas'}</Text>
                </View>

                {/* Invitados con restricciones */}
                {entries.map((e, ei) => (
                  <View key={e.id || ei} style={{
                    paddingVertical: 8, paddingHorizontal: 8,
                    backgroundColor: '#ffffff', borderRadius: 5, marginBottom: 6,
                    border: `1pt solid #fde68a`,
                  }}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: COLORS.dark, marginBottom: 6 }}>
                      {e.guestName}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      {e.diet ? (
                        <View style={[styles.badge, { backgroundColor: '#f3e8ff', paddingHorizontal: 9, paddingVertical: 4 }]}>
                          <Text style={[styles.badgeText, { color: '#6b21a8', fontSize: 9.5 }]}>🥗 {DIET_LABELS[e.diet] || e.diet}</Text>
                        </View>
                      ) : null}
                      {e.allergies ? e.allergies.split(',').filter(Boolean).map(a => (
                        <View key={a} style={[styles.badge, { backgroundColor: '#fef3c7', paddingHorizontal: 9, paddingVertical: 4 }]}>
                          <Text style={[styles.badgeText, { color: '#92400e', fontSize: 9.5 }]}>⚠ {ALLERGEN_LABELS[a] || a}</Text>
                        </View>
                      )) : null}
                    </View>
                    {e.observations ? (
                      <Text style={{ fontSize: 8.5, color: COLORS.medium, fontStyle: 'italic', marginTop: 5 }}>💬 {e.observations}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
        <PdfFooter eventName={event?.clientName || ''} sectionLabel={SECTION} />
      </Page>
    </Document>
  );
}

