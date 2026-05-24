import React from 'react';
import { Document, View, Text } from '@react-pdf/renderer';
import { styles, COLORS } from './pdfStyles';
import { PdfPage } from './PdfPageBase';

/**
 * PDF Menús del evento
 * data = { event, menus: [ { id, name, selected, starters, firstCourse, secondCourse, dessert, drinks, extras, description } ] }
 */
export default function MenusPdfDoc({ data }) {
  const { event, menus = [] } = data;
  const selectedMenu = menus.find(m => m.selected);
  const otherMenus = menus.filter(m => !m.selected);

  const MENU_FIELDS = [
    ['Entrantes',      'starters'],
    ['Primer plato',   'firstCourse'],
    ['Segundo plato',  'secondCourse'],
    ['Postre',         'dessert'],
    ['Bebidas',        'drinks'],
    ['Extras',         'extras'],
  ];

  return (
    <Document title={`Menús - ${event?.clientName}`} author="Sistema de Eventos" subject="Menús del evento">
      <PdfPage event={event} sectionLabel="Menús del evento" sectionIcon="🍽️">

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{menus.length}</Text>
            <Text style={styles.statLabel}>Menús disponibles</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
            <Text style={[styles.statValue, { color: COLORS.green }]}>{selectedMenu ? '✓' : '—'}</Text>
            <Text style={styles.statLabel}>Menú confirmado</Text>
          </View>
        </View>

        {/* Menú seleccionado — destacado */}
        {selectedMenu ? (
          <>
            <Text style={styles.sectionTitle}>✅ Menú confirmado por el cliente</Text>
            <View style={[styles.card, { borderColor: '#86efac', backgroundColor: '#f0fdf4', marginBottom: 16 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Text style={[styles.cardTitle, { flex: 1, color: COLORS.green, fontSize: 14, marginBottom: 0 }]}>
                  {selectedMenu.name}
                </Text>
                <View style={[styles.badge, { backgroundColor: '#bbf7d0' }]}>
                  <Text style={[styles.badgeText, { color: COLORS.green }]}>CONFIRMADO</Text>
                </View>
              </View>
              {selectedMenu.description ? (
                <Text style={[styles.cardText, { marginBottom: 10, fontStyle: 'italic' }]}>{selectedMenu.description}</Text>
              ) : null}

              {MENU_FIELDS.filter(([, key]) => selectedMenu[key]).map(([label, key]) => (
                <View key={key} style={[styles.infoRow, { marginBottom: 8, paddingBottom: 6, borderBottom: `1pt solid #bbf7d0` }]}>
                  <Text style={[styles.infoLabel, { color: COLORS.green }]}>{label}</Text>
                  <Text style={[styles.infoValue, { color: '#166534' }]}>{selectedMenu[key]}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={[styles.alertBox, { marginBottom: 16 }]}>
            <Text style={styles.alertIcon}>⚠</Text>
            <Text style={styles.alertText}>El cliente aún no ha confirmado el menú.</Text>
          </View>
        )}

        {/* Otros menús disponibles */}
        {otherMenus.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Otros menús disponibles</Text>
            {otherMenus.map(menu => (
              <View key={menu.id} style={styles.card} wrap={false}>
                <Text style={styles.cardTitle}>{menu.name}</Text>
                {menu.description ? (
                  <Text style={[styles.cardText, { marginBottom: 6, fontStyle: 'italic' }]}>{menu.description}</Text>
                ) : null}
                {MENU_FIELDS.filter(([, key]) => menu[key]).map(([label, key]) => (
                  <View key={key} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{label}</Text>
                    <Text style={styles.infoValue}>{menu[key]}</Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        {menus.length === 0 && (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 24 }]}>
            <Text style={{ fontSize: 10, color: COLORS.light }}>No hay menús registrados para este evento</Text>
          </View>
        )}

      </PdfPage>
    </Document>
  );
}

