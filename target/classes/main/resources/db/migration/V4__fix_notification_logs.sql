-- =====================================================================
-- V4: Corregir columnas de notification_logs
-- =====================================================================

ALTER TABLE notification_logs
    ADD COLUMN IF NOT EXISTS event_client_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'SENT';

