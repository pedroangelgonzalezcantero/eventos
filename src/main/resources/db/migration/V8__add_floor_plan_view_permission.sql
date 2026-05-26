-- V8: Añadir permiso FLOOR_PLAN_VIEW (ver sección de planos del salón)

INSERT INTO permissions (code, category, label, description)
SELECT 'FLOOR_PLAN_VIEW', 'Planos', 'Ver planos del salón', 'Ver la sección de planos del salón en la vista de sala'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'FLOOR_PLAN_VIEW');

-- Asignar a rol OFFICE
INSERT INTO role_permissions (role, permission_code)
SELECT 'OFFICE', 'FLOOR_PLAN_VIEW'
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role = 'OFFICE' AND permission_code = 'FLOOR_PLAN_VIEW');

-- Asignar a rol FLOOR (jefe de sala)
INSERT INTO role_permissions (role, permission_code)
SELECT 'FLOOR', 'FLOOR_PLAN_VIEW'
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role = 'FLOOR' AND permission_code = 'FLOOR_PLAN_VIEW');
