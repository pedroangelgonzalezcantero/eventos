-- =====================================================================
-- V2: Sistema de permisos y puestos de trabajo
-- Salon de Celebraciones - Gestion de Eventos
-- =====================================================================

-- Catalogo de permisos disponibles en el sistema
CREATE TABLE IF NOT EXISTS permissions (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(80)  NOT NULL UNIQUE,
    category    VARCHAR(80)  NOT NULL,
    label       VARCHAR(150) NOT NULL,
    description VARCHAR(300)
);

-- Puestos de trabajo (roles del salon)
CREATE TABLE IF NOT EXISTS job_positions (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    label       VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    icon        VARCHAR(50),
    color       VARCHAR(150),
    system      BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order  INTEGER               DEFAULT 99
);

-- Permisos por defecto de cada rol (plantilla)
CREATE TABLE IF NOT EXISTS role_permissions (
    id              BIGSERIAL PRIMARY KEY,
    role            VARCHAR(30) NOT NULL,
    permission_code VARCHAR(80) NOT NULL,
    UNIQUE (role, permission_code)
);

-- Sobreescrituras individuales de permisos por usuario
-- granted=true  -> se anade aunque el rol no lo tenga
-- granted=false -> se elimina aunque el rol si lo tenga
CREATE TABLE IF NOT EXISTS user_permissions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_code VARCHAR(80) NOT NULL,
    granted         BOOLEAN     NOT NULL,
    UNIQUE (user_id, permission_code)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);



