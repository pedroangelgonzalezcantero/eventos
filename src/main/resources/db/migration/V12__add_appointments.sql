-- =====================================================================
-- V12: Módulo de citas telefónicas manuales
-- =====================================================================

CREATE TABLE IF NOT EXISTS appointments (
    id               BIGSERIAL    PRIMARY KEY,
    appointment_date DATE         NOT NULL,
    start_time       TIME         NOT NULL,
    end_time         TIME,
    client_name      VARCHAR(150) NOT NULL,
    phone            VARCHAR(20),
    worker_id        BIGINT       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    notes            TEXT,
    status           VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',
    created_at       TIMESTAMP    DEFAULT NOW(),
    updated_at       TIMESTAMP    DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_appointments_date        ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_worker      ON appointments(worker_id);
CREATE INDEX IF NOT EXISTS idx_appointments_worker_date ON appointments(worker_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status      ON appointments(status);

