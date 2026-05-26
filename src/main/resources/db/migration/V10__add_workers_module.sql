-- =====================================================================
-- V10: Módulo de trabajadores — personas, rangos, altas
-- =====================================================================

-- Tabla maestra de personas (trabajadores sin acceso a la app)
CREATE TABLE IF NOT EXISTS personas (
    id              BIGSERIAL PRIMARY KEY,
    dni             VARCHAR(20)  NOT NULL UNIQUE,
    nombre          VARCHAR(100) NOT NULL,
    apellidos       VARCHAR(150) NOT NULL,
    seguridad_social VARCHAR(30),
    puesto          VARCHAR(100),
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    DEFAULT NOW()
);

-- Rangos: asignación de trabajador a mesa para un evento
CREATE TABLE IF NOT EXISTS rangos (
    id          BIGSERIAL PRIMARY KEY,
    evento_id   BIGINT       NOT NULL REFERENCES events(id)   ON DELETE CASCADE,
    persona_id  BIGINT       NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    mesa        VARCHAR(100),
    rango       VARCHAR(100),
    created_at  TIMESTAMP    DEFAULT NOW()
);

-- Altas: registro único de alta por persona y evento
-- ON CONFLICT DO NOTHING garantiza que no hay duplicados
CREATE TABLE IF NOT EXISTS altas (
    id          BIGSERIAL PRIMARY KEY,
    evento_id   BIGINT    NOT NULL REFERENCES events(id)   ON DELETE CASCADE,
    persona_id  BIGINT    NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    created_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE (evento_id, persona_id)
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_personas_dni       ON personas(dni);
CREATE INDEX IF NOT EXISTS idx_personas_nombre    ON personas(LOWER(nombre));
CREATE INDEX IF NOT EXISTS idx_personas_apellidos ON personas(LOWER(apellidos));
CREATE INDEX IF NOT EXISTS idx_personas_activo    ON personas(activo);
CREATE INDEX IF NOT EXISTS idx_rangos_evento      ON rangos(evento_id);
CREATE INDEX IF NOT EXISTS idx_rangos_persona     ON rangos(persona_id);
CREATE INDEX IF NOT EXISTS idx_altas_evento       ON altas(evento_id);
CREATE INDEX IF NOT EXISTS idx_altas_persona      ON altas(persona_id);

