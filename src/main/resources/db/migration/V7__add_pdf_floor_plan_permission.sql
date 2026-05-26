-- =====================================================================
-- V7: Añadir permiso PDF_FLOOR_PLAN
-- Permite descargar/ver el plano del salón como archivo
-- =====================================================================

-- Insertar el permiso en el catálogo (si no existe ya)
INSERT INTO permissions (code, category, label, description)
SELECT 'PDF_FLOOR_PLAN', 'PDF', 'Descargar plano del salón', 'Descargar el plano del salón en PDF/imagen'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'PDF_FLOOR_PLAN');

-- Añadir el permiso al rol OFFICE
INSERT INTO role_permissions (role, permission_code)
SELECT 'OFFICE', 'PDF_FLOOR_PLAN'
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role = 'OFFICE' AND permission_code = 'PDF_FLOOR_PLAN');

-- Añadir el permiso al rol FLOOR (Sala/Metres)
INSERT INTO role_permissions (role, permission_code)
SELECT 'FLOOR', 'PDF_FLOOR_PLAN'
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role = 'FLOOR' AND permission_code = 'PDF_FLOOR_PLAN');
