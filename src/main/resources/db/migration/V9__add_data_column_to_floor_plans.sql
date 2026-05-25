-- =====================================================================
-- V9: Añadir columna data (bytea) a floor_plans
-- La migración V6 omitió esta columna por depender de ddl-auto=update,
-- pero en producción con ddl-auto=validate es necesario crearla explícitamente.
-- =====================================================================

ALTER TABLE floor_plans
    ADD COLUMN IF NOT EXISTS data BYTEA NOT NULL DEFAULT '\x';

-- Eliminar el default temporal (no necesario en producción, las filas son nuevas)
ALTER TABLE floor_plans ALTER COLUMN data DROP DEFAULT;

