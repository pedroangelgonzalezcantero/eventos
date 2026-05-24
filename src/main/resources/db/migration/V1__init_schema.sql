-- =====================================================================
-- V1: Esquema inicial para PostgreSQL
-- Salon de Celebraciones — Gestión de Eventos
-- =====================================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150),
    nombre VARCHAR(100),
    role VARCHAR(20) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    client_name VARCHAR(150) NOT NULL,
    type VARCHAR(30) NOT NULL,
    event_date DATE NOT NULL,
    estimated_guests INTEGER,
    venue VARCHAR(200),
    contact_person VARCHAR(150),
    phone VARCHAR(20),
    email VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_INFO',
    client_user_id BIGINT REFERENCES users(id),
    notes TEXT,
    menu_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    allergens_completed BOOLEAN NOT NULL DEFAULT FALSE,
    protocol_completed BOOLEAN NOT NULL DEFAULT FALSE,
    budget_signed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menus (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    starters TEXT,
    first_course TEXT,
    second_course TEXT,
    dessert TEXT,
    drinks TEXT,
    extras TEXT,
    price_per_person NUMERIC(10,2),
    selected BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS allergen_entries (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    guest_name VARCHAR(150) NOT NULL,
    table_number VARCHAR(50),
    allergies TEXT,
    observations TEXT,
    diet VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS protocol_items (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    event_time VARCHAR(10),
    description TEXT NOT NULL,
    involved_person VARCHAR(150),
    youtube_link VARCHAR(500),
    observations TEXT,
    position INTEGER
);

CREATE TABLE IF NOT EXISTS invoices (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50),
    description TEXT,
    breakdown TEXT,
    total_amount NUMERIC(12,2),
    paid_amount NUMERIC(12,2) DEFAULT 0,
    pending_amount NUMERIC(12,2),
    signed BOOLEAN NOT NULL DEFAULT FALSE,
    signature_data TEXT,
    signed_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    description VARCHAR(300),
    payment_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    method VARCHAR(50),
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_assignments (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP,
    UNIQUE (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS reminders (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    days_before_event INTEGER,
    channel VARCHAR(20),
    message_template TEXT,
    subject VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sent BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMP,
    category VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS reminder_templates (
    id BIGSERIAL PRIMARY KEY,
    days_before_event INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(200),
    message_template TEXT,
    channel VARCHAR(30) NOT NULL DEFAULT 'EMAIL',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(300)
);

CREATE TABLE IF NOT EXISTS guest_tables (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER,
    notes TEXT,
    position INTEGER,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guests (
    id BIGSERIAL PRIMARY KEY,
    table_id BIGINT NOT NULL REFERENCES guest_tables(id) ON DELETE CASCADE,
    guest_name VARCHAR(150) NOT NULL,
    allergies TEXT,
    diet VARCHAR(50),
    observations TEXT
);

CREATE TABLE IF NOT EXISTS notification_logs (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT REFERENCES events(id),
    recipient VARCHAR(255),
    channel VARCHAR(20),
    subject VARCHAR(200),
    message TEXT,
    sent_at TIMESTAMP,
    success BOOLEAN,
    error_message TEXT
);


-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_protocol_items_event ON protocol_items(event_id);
CREATE INDEX IF NOT EXISTS idx_allergen_event ON allergen_entries(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_table ON guests(table_id);
CREATE INDEX IF NOT EXISTS idx_guest_tables_event ON guest_tables(event_id);
CREATE INDEX IF NOT EXISTS idx_assignments_event ON event_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_reminders_sent ON reminders(sent, active);

