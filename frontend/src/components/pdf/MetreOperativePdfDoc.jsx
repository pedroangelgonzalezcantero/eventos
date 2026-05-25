import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
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

const SECTION = 'Dossier Operativo · Sala / Metre';

function SectionBlock({ title, emoji, color = COLORS.primary, bgColor = COLORS.primaryLight }) {
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

/**
 * PDF Operativo completo para Metre / Jefe de Sala
 * data = { event, protocol, tables, allergens, menus, floorPlanBase64?, floorPlanIsImage?, floorPlanFilename? }
 */
export default function MetreOperativePdfDoc({ data }) {
  const { event, protocol = [], tables = [], allergens = [], menus = [],
          floorPlanBase64 = null, floorPlanIsImage = false, floorPlanFilename = null } = data;

  const totalGuests         = tables.reduce((s, t) => s + (t.guestCount || 0), 0);
  const tablesWithAllergens = tables.filter(t => t.allergiesCount > 0);
  const selectedMenu        = menus.find(m => m.selected);

  const allergensByTable = allergens.reduce((acc, a) => {
    const k = a.tableNumber || 'Sin mesa';
    (acc[k] = acc[k] || []).push(a);
    return acc;
  }, {});

  return (
    <Document
      title={`Dossier Operativo - ${event?.clientName}`}
      author="Sistema de Eventos"
      subject="Dossier operativo para Metre / Jefe de Sala"
    >
      {/* ════════════════════════════════════════════════════════════
          PÁGINA 1 — RESUMEN DEL EVENTO + PROTOCOLO / TIMING
      ════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <PdfHeader event={event} sectionLabel={SECTION} sectionIcon="📋" />
        <View style={styles.body}>

          <SectionBlock title="Resumen del evento" emoji="📅" />

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalGuests || event?.estimatedGuests || '—'}</Text>
              <Text style={styles.statLabel}>Invitados</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <Text style={[styles.statValue, { color: COLORS.green }]}>{tables.length}</Text>
              <Text style={styles.statLabel}>Mesas</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: COLORS.amberBg, borderColor: '#fcd34d' }]}>
              <Text style={[styles.statValue, { color: tablesWithAllergens.length > 0 ? COLORS.amber : COLORS.green }]}>
                {tablesWithAllergens.length}
              </Text>
              <Text style={styles.statLabel}>Mesas con alergias</Text>
            </View>
          </View>

          {/* info del evento */}
          <View style={styles.card}>
            {[
              ['Nombre del evento',   event?.clientName],
              ['Tipo de celebración', event?.typeLabel],
              ['Fecha',               event?.eventDate ? formatDate(event.eventDate) : ''],
              ['Invitados estimados', event?.estimatedGuests ? `${event.estimatedGuests} personas` : null],
              ['Salón / Lugar',       event?.venue],
              ['Menú confirmado',     selectedMenu?.name || 'Pendiente de confirmar'],
            ].filter(([, v]) => v).map(([label, value]) => (
              <View key={label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
            ))}
            {event?.notes ? (
              <View style={[styles.infoRow, { marginTop: 6, paddingTop: 6, borderTop: `1pt solid ${COLORS.border}` }]}>
                <Text style={[styles.infoLabel, { color: COLORS.primary }]}>Notas internas</Text>
                <Text style={[styles.infoValue, { fontStyle: 'italic', color: COLORS.medium }]}>{event.notes}</Text>
              </View>
            ) : null}
          </View>

          {/* Protocolo / Timing */}
          <SectionBlock title="Protocolo del evento · Timing" emoji="🎵" color="#1d4ed8" bgColor="#eff6ff" />

          {protocol.length === 0 ? (
            <View style={[styles.card, { alignItems: 'center', paddingVertical: 16 }]}>
              <Text style={{ fontSize: 9, color: COLORS.light }}>Sin protocolo definido</Text>
            </View>
          ) : (
            protocol.map((item, i) => (
              <View key={item.id || i} style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' }} wrap={false}>
                <View style={{
                  minWidth: 44, paddingHorizontal: 4, paddingVertical: 5,
                  backgroundColor: item.eventTime ? '#1d4ed8' : COLORS.border,
                  borderRadius: 6, alignItems: 'center', flexShrink: 0, marginRight: 10, marginTop: 1,
                }}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: item.eventTime ? '#ffffff' : COLORS.medium }}>
                    {item.eventTime || `#${i + 1}`}
                  </Text>
                </View>
                <View style={{
                  flex: 1,
                  backgroundColor: item.youtubeLink ? '#eff6ff' : COLORS.bg,
                  border: `1pt solid ${item.youtubeLink ? '#bfdbfe' : COLORS.border}`,
                  borderRadius: 5, padding: 8,
                }}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: COLORS.dark, marginBottom: 2 }}>
                    {item.description}
                  </Text>
                  {item.involvedPerson ? (
                    <Text style={{ fontSize: 8.5, color: COLORS.medium }}>👤 {item.involvedPerson}</Text>
                  ) : null}
                  {item.youtubeLink ? (
                    <Text style={{ fontSize: 8.5, color: '#2563eb', marginTop: 2 }}>🎵 {item.youtubeLink}</Text>
                  ) : null}
                  {item.observations ? (
                    <Text style={{ fontSize: 8.5, color: COLORS.light, fontStyle: 'italic', marginTop: 2 }}>{item.observations}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
        <PdfFooter eventName={event?.clientName || ''} sectionLabel={SECTION} />
      </Page>

      {/* ════════════════════════════════════════════════════════════
          PÁGINA 2 — MESAS E INVITADOS
      ════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <PdfHeader event={event} sectionLabel={SECTION} sectionIcon="📋" />
        <View style={styles.body}>
          <SectionBlock title="Distribución de mesas e invitados" emoji="🪑" color="#166534" bgColor="#f0fdf4" />

          {/* Índice rápido de mesas */}
          <View style={[styles.card, { marginBottom: 14 }]}>
            <Text style={[styles.cardTitle, { marginBottom: 8 }]}>Índice de mesas</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {tables.map(t => (
                <View key={t.id} style={{
                  paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
                  backgroundColor: t.allergiesCount > 0 ? COLORS.amberBg : '#f0fdf4',
                  border: `1pt solid ${t.allergiesCount > 0 ? '#fcd34d' : '#bbf7d0'}`,
                }}>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: t.allergiesCount > 0 ? COLORS.amber : COLORS.green }}>
                    {t.name} ({t.guestCount || 0}){t.allergiesCount > 0 ? ' ⚠' : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {tables.length === 0 ? (
            <View style={[styles.card, { alignItems: 'center', paddingVertical: 20 }]}>
              <Text style={{ fontSize: 9, color: COLORS.light }}>Sin mesas configuradas</Text>
            </View>
          ) : (
            tables.map(table => (
              <View key={table.id}
                style={[styles.card, { borderColor: table.allergiesCount > 0 ? '#fcd34d' : COLORS.border, marginBottom: 10 }]}
                wrap={false}
              >
                {/* Cabecera mesa */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottom: `1.5pt solid ${table.allergiesCount > 0 ? '#fcd34d' : COLORS.border}` }}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: COLORS.dark, flex: 1 }}>{table.name}</Text>
                  <Text style={{ fontSize: 8.5, color: COLORS.medium }}>
                    {table.guestCount || 0}{table.capacity ? `/${table.capacity}` : ''} inv.
                  </Text>
                  {table.allergiesCount > 0 && (
                    <View style={[styles.badge, { backgroundColor: COLORS.amberBg, marginLeft: 6 }]}>
                      <Text style={[styles.badgeText, { color: COLORS.amber }]}>⚠ {table.allergiesCount}</Text>
                    </View>
                  )}
                </View>
                {table.notes ? (
                  <Text style={[styles.cardText, { fontStyle: 'italic', marginBottom: 6, color: COLORS.medium }]}>📝 {table.notes}</Text>
                ) : null}

                {/* Invitados */}
                {(table.guests || []).length === 0 ? (
                  <Text style={[styles.tableCell, { color: COLORS.light, fontStyle: 'italic' }]}>Sin invitados asignados</Text>
                ) : (
                  (table.guests || []).map((g, gi) => {
                    const hasR = g.diet || (g.allergies && g.allergies.trim());
                    return (
                      <View key={g.id || gi} style={{
                        flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 5,
                        backgroundColor: hasR ? '#fffbeb' : 'transparent', borderRadius: hasR ? 4 : 0,
                        marginBottom: hasR ? 3 : 0, paddingHorizontal: hasR ? 6 : 0,
                        borderBottom: !hasR && gi < (table.guests || []).length - 1 ? `1pt solid ${COLORS.border}` : 'none',
                      }}>
                        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: hasR ? '#92400e' : COLORS.dark, flex: 1 }}>
                          {hasR ? '⚠ ' : '· '}{g.guestName}
                        </Text>
                        <View style={{ flex: 2, flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
                          {g.diet ? (
                            <View style={[styles.badge, { backgroundColor: '#f3e8ff' }]}>
                              <Text style={[styles.badgeText, { color: '#6b21a8' }]}>{DIET_LABELS[g.diet] || g.diet}</Text>
                            </View>
                          ) : null}
                          {g.allergies ? g.allergies.split(',').filter(Boolean).map(a => (
                            <View key={a} style={[styles.badge, { backgroundColor: COLORS.amberBg }]}>
                              <Text style={[styles.badgeText, { color: COLORS.amber }]}>{ALLERGEN_LABELS[a] || a}</Text>
                            </View>
                          )) : null}
                        </View>
                        {g.observations ? (
                          <Text style={{ fontSize: 7.5, color: COLORS.light, fontStyle: 'italic', flex: 1 }}>{g.observations}</Text>
                        ) : null}
                      </View>
                    );
                  })
                )}
              </View>
            ))
          )}
        </View>
        <PdfFooter eventName={event?.clientName || ''} sectionLabel={SECTION} />
      </Page>

      {/* ════════════════════════════════════════════════════════════
          PÁGINA 3 — ALERGIAS · VISTA OPERATIVA DE SERVICIO
      ════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <PdfHeader event={event} sectionLabel={SECTION} sectionIcon="📋" />
        <View style={styles.body}>
          <SectionBlock title="Necesidades especiales · Vista rápida de servicio" emoji="⚠️" color={COLORS.amber} bgColor={COLORS.amberBg} />

          <View style={styles.alertBox}>
            <Text style={styles.alertIcon}>⚠</Text>
            <Text style={styles.alertText}>
              ATENCIÓN: Verifica estas restricciones con cocina antes del servicio.
              Esta lista es de uso operativo para el día del evento.
            </Text>
          </View>

          {allergens.length === 0 ? (
            <View style={[styles.card, { alignItems: 'center', paddingVertical: 28, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.green, marginBottom: 4 }}>✅ Sin restricciones registradas</Text>
              <Text style={{ fontSize: 9, color: COLORS.medium }}>No hay alérgenos ni dietas especiales para este evento.</Text>
            </View>
          ) : (
            Object.entries(allergensByTable).sort(([a], [b]) => a.localeCompare(b)).map(([tableName, entries]) => (
              <View key={tableName} style={{ backgroundColor: '#fffbeb', border: `1.5pt solid #fcd34d`, borderRadius: 6, padding: 10, marginBottom: 8 }} wrap={false}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#92400e', marginBottom: 6, paddingBottom: 4, borderBottom: `1pt solid #fcd34d` }}>
                  📍 {tableName}  ·  {entries.length} persona{entries.length !== 1 ? 's' : ''}
                </Text>
                {entries.map((e, ei) => (
                  <View key={e.id || ei} style={{ paddingVertical: 5, borderBottom: ei < entries.length - 1 ? `1pt solid #fde68a` : 'none' }}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: COLORS.dark, marginBottom: 4 }}>⚠  {e.guestName}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
                      {e.diet ? (
                        <View style={[styles.badge, { backgroundColor: '#f3e8ff', paddingHorizontal: 7, paddingVertical: 3 }]}>
                          <Text style={[styles.badgeText, { color: '#6b21a8', fontSize: 9 }]}>🥗 {DIET_LABELS[e.diet] || e.diet}</Text>
                        </View>
                      ) : null}
                      {e.allergies ? e.allergies.split(',').filter(Boolean).map(a => (
                        <View key={a} style={[styles.badge, { backgroundColor: '#fef3c7', paddingHorizontal: 7, paddingVertical: 3 }]}>
                          <Text style={[styles.badgeText, { color: '#92400e', fontSize: 9 }]}>⚠ {ALLERGEN_LABELS[a] || a}</Text>
                        </View>
                      )) : null}
                    </View>
                    {e.observations ? (
                      <Text style={{ fontSize: 8, color: COLORS.medium, fontStyle: 'italic', marginTop: 3 }}>💬 {e.observations}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
        <PdfFooter eventName={event?.clientName || ''} sectionLabel={SECTION} />
      </Page>

      {/* ════════════════════════════════════════════════════════════
          PÁGINA 4 (opcional) — PLANO DEL SALÓN
      ════════════════════════════════════════════════════════════ */}
      {floorPlanBase64 && floorPlanIsImage && (
        <Page size="A4" style={styles.page}>
          <PdfHeader event={event} sectionLabel={SECTION} sectionIcon="📋" />
          <View style={styles.body}>
            <SectionBlock title="Plano del salón" emoji="🗺️" color="#166534" bgColor="#f0fdf4" />
            {floorPlanFilename && (
              <Text style={{ fontSize: 8, color: COLORS.light, marginBottom: 8 }}>{floorPlanFilename}</Text>
            )}
            <Image
              src={floorPlanBase64}
              style={{ maxWidth: '100%', borderRadius: 6, objectFit: 'contain' }}
            />
          </View>
          <PdfFooter eventName={event?.clientName || ''} sectionLabel={SECTION} />
        </Page>
      )}
    </Document>
  );
}

