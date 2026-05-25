-- =====================================================================
-- V5: Unificar alérgenos como fuente única de verdad en tabla guests
-- Migra allergen_entries existentes → guests (fuente canónica)
-- =====================================================================

-- Paso 1: Actualizar invitados existentes con allergies vacías cuando
--         allergen_entries tiene datos para el mismo evento y nombre.
--         Sintaxis PostgreSQL correcta para UPDATE ... FROM con JOIN.
UPDATE guests
SET
    allergies    = ae.allergies,
    diet         = ae.diet,
    observations = ae.observations
FROM allergen_entries ae, guest_tables gt
WHERE guests.table_id = gt.id
  AND gt.event_id = ae.event_id
  AND guests.guest_name = ae.guest_name
  AND (guests.allergies IS NULL OR guests.allergies = '')
  AND (guests.diet      IS NULL OR guests.diet      = '')
  AND ae.allergies IS NOT NULL
  AND ae.allergies <> '';

-- Paso 2: Crear tabla "Sin mesa asignada" por cada evento que tenga entradas
--         huérfanas (sin invitado coincidente en guests).
INSERT INTO guest_tables (event_id, name, capacity, notes, position, created_at)
SELECT DISTINCT ae.event_id,
                'Sin mesa asignada',
                NULL::INTEGER,
                'Importado automaticamente desde alergenos',
                999,
                NOW()
FROM allergen_entries ae
WHERE NOT EXISTS (
    SELECT 1
    FROM guests g2
    JOIN guest_tables gt2 ON g2.table_id = gt2.id
    WHERE gt2.event_id = ae.event_id
      AND g2.guest_name = ae.guest_name
)
AND NOT EXISTS (
    SELECT 1
    FROM guest_tables gt3
    WHERE gt3.event_id = ae.event_id
      AND gt3.name = 'Sin mesa asignada'
);

-- Paso 3: Insertar entradas huérfanas como invitados en "Sin mesa asignada".
INSERT INTO guests (table_id, guest_name, allergies, diet, observations)
SELECT
    gt_fallback.id,
    ae.guest_name,
    ae.allergies,
    ae.diet,
    ae.observations
FROM allergen_entries ae
JOIN guest_tables gt_fallback
  ON gt_fallback.event_id = ae.event_id
 AND gt_fallback.name = 'Sin mesa asignada'
WHERE NOT EXISTS (
    SELECT 1
    FROM guests g3
    JOIN guest_tables gt4 ON g3.table_id = gt4.id
    WHERE gt4.event_id = ae.event_id
      AND g3.guest_name = ae.guest_name
);

-- Paso 4: Actualizar el flag allergens_completed basándose en guests.
UPDATE events e
SET allergens_completed = (
    SELECT COUNT(*) > 0
    FROM guests g
    JOIN guest_tables gt ON g.table_id = gt.id
    WHERE gt.event_id = e.id
      AND (
          (g.allergies IS NOT NULL AND g.allergies <> '')
          OR (g.diet IS NOT NULL AND g.diet <> '')
      )
);
