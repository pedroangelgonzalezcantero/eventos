-- =====================================================================
-- V11: Plano de mesas interactivo (editor visual)
-- Coexiste con el sistema estático de imágenes/PDF (floor_plans)
-- =====================================================================

CREATE TABLE IF NOT EXISTS interactive_floor_plans (
    id             BIGSERIAL    PRIMARY KEY,
    event_id       BIGINT       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name           VARCHAR(255) NOT NULL DEFAULT 'Plano interactivo',
    elements       TEXT         NOT NULL DEFAULT '[]',
    canvas_width   INTEGER      NOT NULL DEFAULT 1200,
    canvas_height  INTEGER      NOT NULL DEFAULT 800,
    created_at     TIMESTAMP    DEFAULT NOW(),
    updated_at     TIMESTAMP    DEFAULT NOW(),
    UNIQUE(event_id)
);

CREATE INDEX IF NOT EXISTS idx_interactive_floor_plans_event ON interactive_floor_plans(event_id);

