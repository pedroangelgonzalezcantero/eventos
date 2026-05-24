-- =====================================================================
-- V3: Tabla de variantes de menu (ElementCollection de Menu)
-- =====================================================================

CREATE TABLE IF NOT EXISTS menu_variants (
    menu_id             BIGINT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    variant_description TEXT
);

CREATE INDEX IF NOT EXISTS idx_menu_variants_menu ON menu_variants(menu_id);

