package com.salon.eventos.service;

import com.salon.eventos.entity.*;
import com.salon.eventos.repository.*;
import com.salon.eventos.security.Permissions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;
@Service
public class PermissionService {

    @Autowired private PermissionRepository permissionRepository;
    @Autowired private RolePermissionRepository rolePermissionRepository;
    @Autowired private UserPermissionRepository userPermissionRepository;
    @Autowired private JobPositionRepository jobPositionRepository;

    // ─────────────────────────────────────────────────────────
    //  Catálogo de permisos
    // ─────────────────────────────────────────────────────────
    private static final Object[][] PERMISSION_CATALOG = {
        {Permissions.EVENTS_VIEW_ALL,      "Eventos",     "Ver todos los eventos",         "Acceso a la lista completa de eventos"},
        {Permissions.EVENTS_VIEW_ASSIGNED, "Eventos",     "Ver solo eventos asignados",     "Solo ve los eventos en los que está asignado"},
        {Permissions.EVENTS_CREATE,        "Eventos",     "Crear eventos",                  "Crear nuevos eventos"},
        {Permissions.EVENTS_EDIT,          "Eventos",     "Editar eventos",                 "Editar datos generales del evento"},
        {Permissions.EVENTS_DELETE,        "Eventos",     "Eliminar eventos",               "Eliminar eventos del sistema"},
        {Permissions.TABLES_VIEW,          "Mesas",       "Ver mesas",                      "Ver la distribución de mesas"},
        {Permissions.TABLES_CREATE,        "Mesas",       "Crear mesas",                    "Crear nuevas mesas"},
        {Permissions.TABLES_EDIT,          "Mesas",       "Editar mesas",                   "Modificar mesas existentes"},
        {Permissions.TABLES_DELETE,        "Mesas",       "Eliminar mesas",                 "Eliminar mesas"},
        {Permissions.GUESTS_VIEW,          "Invitados",   "Ver invitados",                  "Ver la lista de invitados"},
        {Permissions.GUESTS_CREATE,        "Invitados",   "Crear invitados",                "Añadir invitados"},
        {Permissions.GUESTS_EDIT,          "Invitados",   "Editar invitados",               "Modificar invitados"},
        {Permissions.GUESTS_DELETE,        "Invitados",   "Eliminar invitados",             "Eliminar invitados"},
        {Permissions.PROTOCOL_VIEW,        "Protocolo",   "Ver protocolo",                  "Ver el protocolo del evento"},
        {Permissions.PROTOCOL_EDIT,        "Protocolo",   "Editar protocolo",               "Modificar elementos del protocolo"},
        {Permissions.PROTOCOL_LOCK,        "Protocolo",   "Bloquear/desbloquear protocolo", "Cambiar el estado de bloqueo del protocolo"},
        {Permissions.INVOICES_VIEW,        "Facturación", "Ver facturas",                   "Ver las facturas del evento"},
        {Permissions.INVOICES_EDIT,        "Facturación", "Editar facturas",                "Modificar facturas"},
        {Permissions.PAYMENTS_VIEW,        "Facturación", "Ver pagos",                      "Ver el historial de pagos"},
        {Permissions.MENUS_VIEW,           "Menús",       "Ver menús",                      "Ver los menús del evento"},
        {Permissions.MENUS_EDIT,           "Menús",       "Editar menús",                   "Modificar menús"},
        {Permissions.ALLERGENS_VIEW,       "Alergias",    "Ver alergias",                   "Ver información de alergias"},
        {Permissions.ALLERGENS_EDIT,       "Alergias",    "Editar alergias",                "Modificar registros de alergias"},
        {Permissions.USERS_VIEW,           "Usuarios",    "Ver usuarios",                   "Ver la lista de usuarios"},
        {Permissions.USERS_CREATE,         "Usuarios",    "Crear usuarios",                 "Crear nuevos usuarios"},
        {Permissions.USERS_EDIT,           "Usuarios",    "Editar usuarios",                "Editar datos de usuarios"},
        {Permissions.USERS_DELETE,         "Usuarios",    "Eliminar usuarios",              "Eliminar usuarios del sistema"},
        {Permissions.USERS_MANAGE_PERMS,   "Usuarios",    "Gestionar permisos",             "Asignar y revocar permisos"},
        {Permissions.DASHBOARD_VIEW,       "Dashboard",   "Ver dashboard",                  "Acceso al panel de control"},
        // PDF
        {Permissions.PDF_PROTOCOL,         "PDF",         "Descargar PDF protocolo",        "Descargar el protocolo del evento en PDF"},
        {Permissions.PDF_TABLES,           "PDF",         "Descargar PDF mesas",            "Descargar la distribución de mesas en PDF"},
        {Permissions.PDF_ALLERGENS,        "PDF",         "Descargar PDF alérgenos",        "Descargar el informe de alérgenos en PDF"},
        {Permissions.PDF_MENUS,            "PDF",         "Descargar PDF menús",            "Descargar los menús del evento en PDF"},
        {Permissions.PDF_INVOICES,         "PDF",         "Descargar PDF facturación",      "Descargar la factura y pagos en PDF"},
        {Permissions.PDF_FLOOR_PLAN,       "PDF",         "Descargar plano del salón",      "Descargar el plano del salón en PDF/imagen"},
        // Planos
        {Permissions.FLOOR_PLAN_VIEW,      "Planos",      "Ver planos del salón",           "Ver la sección de planos del salón en la vista de sala"},
    };

    // Permisos por defecto para cada puesto (solo se usan en el seed inicial)
    private static final Map<String, List<String>> ROLE_TEMPLATES = new LinkedHashMap<>();
    static {
        ROLE_TEMPLATES.put("OFFICE", Arrays.asList(
            Permissions.EVENTS_VIEW_ALL, Permissions.EVENTS_CREATE, Permissions.EVENTS_EDIT, Permissions.EVENTS_DELETE,
            Permissions.TABLES_VIEW, Permissions.TABLES_CREATE, Permissions.TABLES_EDIT, Permissions.TABLES_DELETE,
            Permissions.GUESTS_VIEW, Permissions.GUESTS_CREATE, Permissions.GUESTS_EDIT, Permissions.GUESTS_DELETE,
            Permissions.PROTOCOL_VIEW, Permissions.PROTOCOL_EDIT, Permissions.PROTOCOL_LOCK,
            Permissions.INVOICES_VIEW, Permissions.INVOICES_EDIT, Permissions.PAYMENTS_VIEW,
            Permissions.MENUS_VIEW, Permissions.MENUS_EDIT,
            Permissions.ALLERGENS_VIEW, Permissions.ALLERGENS_EDIT,
            Permissions.USERS_VIEW, Permissions.USERS_CREATE, Permissions.USERS_EDIT,
            Permissions.USERS_DELETE, Permissions.USERS_MANAGE_PERMS,
            Permissions.DASHBOARD_VIEW,
            Permissions.PDF_PROTOCOL, Permissions.PDF_TABLES, Permissions.PDF_ALLERGENS,
            Permissions.PDF_MENUS, Permissions.PDF_INVOICES, Permissions.PDF_FLOOR_PLAN,
            Permissions.FLOOR_PLAN_VIEW
        ));
        ROLE_TEMPLATES.put("FLOOR", Arrays.asList(
            Permissions.EVENTS_VIEW_ASSIGNED,
            Permissions.TABLES_VIEW, Permissions.TABLES_CREATE, Permissions.TABLES_EDIT,
            Permissions.GUESTS_VIEW, Permissions.GUESTS_EDIT,
            Permissions.PROTOCOL_VIEW,
            Permissions.MENUS_VIEW,
            Permissions.ALLERGENS_VIEW,
            Permissions.DASHBOARD_VIEW,
            Permissions.PDF_PROTOCOL, Permissions.PDF_TABLES, Permissions.PDF_ALLERGENS,
            Permissions.PDF_FLOOR_PLAN,
            Permissions.FLOOR_PLAN_VIEW
        ));
        ROLE_TEMPLATES.put("KITCHEN", Arrays.asList(
            Permissions.EVENTS_VIEW_ASSIGNED,
            Permissions.MENUS_VIEW,
            Permissions.ALLERGENS_VIEW, Permissions.ALLERGENS_EDIT,
            Permissions.GUESTS_VIEW,
            Permissions.PDF_ALLERGENS, Permissions.PDF_MENUS
        ));
        ROLE_TEMPLATES.put("DJ", Arrays.asList(
            Permissions.EVENTS_VIEW_ASSIGNED,
            Permissions.PROTOCOL_VIEW, Permissions.PROTOCOL_EDIT,
            Permissions.PDF_PROTOCOL
        ));
        ROLE_TEMPLATES.put("CLIENT", Arrays.asList(
            Permissions.EVENTS_VIEW_ASSIGNED,
            Permissions.TABLES_VIEW,
            Permissions.GUESTS_VIEW,
            Permissions.MENUS_VIEW,
            Permissions.ALLERGENS_VIEW,
            Permissions.INVOICES_VIEW
        ));
    }

    // Puestos de trabajo predeterminados del sistema
    private static final Object[][] DEFAULT_POSITIONS = {
        // code,     label,           description,                          icon,           color,                                          system, sortOrder
        {"OFFICE",  "Administrador",  "Acceso total al sistema",            "shield-check", "bg-violet-100 text-violet-700 border-violet-200", true,  1},
        {"FLOOR",   "Sala / Metre",   "Mesas, invitados y protocolo",       "layers",       "bg-emerald-100 text-emerald-700 border-emerald-200", true, 2},
        {"KITCHEN", "Cocina",         "Menús, alergias y dietas",           "chef-hat",     "bg-orange-100 text-orange-700 border-orange-200",  true,  3},
        {"DJ",      "DJ",             "Protocolo musical y timeline",       "music-2",      "bg-blue-100 text-blue-700 border-blue-200",        true,  4},
        {"CLIENT",  "Cliente",        "Portal del evento para el cliente",  "user",         "bg-stone-100 text-stone-700 border-stone-200",     true,  5},
    };

    // ─────────────────────────────────────────────────────────
    //  Seed al arrancar
    // ─────────────────────────────────────────────────────────
    @PostConstruct
    @Transactional
    public void seedPermissions() {
        // 1. Insertar permisos del catálogo que no existan
        for (Object[] row : PERMISSION_CATALOG) {
            String code = (String) row[0];
            if (!permissionRepository.existsByCode(code)) {
                permissionRepository.save(Permission.builder()
                        .code(code)
                        .category((String) row[1])
                        .label((String) row[2])
                        .description((String) row[3])
                        .build());
            }
        }

        // 2. Insertar puestos de trabajo predeterminados que no existan
        for (Object[] pos : DEFAULT_POSITIONS) {
            String code = (String) pos[0];
            if (!jobPositionRepository.existsByCode(code)) {
                jobPositionRepository.save(JobPosition.builder()
                        .code(code)
                        .label((String) pos[1])
                        .description((String) pos[2])
                        .icon((String) pos[3])
                        .color((String) pos[4])
                        .system((Boolean) pos[5])
                        .sortOrder((Integer) pos[6])
                        .build());
            }
        }

        // 3. Insertar permisos de rol que no existan (plantillas iniciales)
        for (Map.Entry<String, List<String>> entry : ROLE_TEMPLATES.entrySet()) {
            String role = entry.getKey();
            for (String code : entry.getValue()) {
                if (!rolePermissionRepository.existsByRoleAndPermissionCode(role, code)) {
                    rolePermissionRepository.save(RolePermission.builder()
                            .role(role).permissionCode(code).build());
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────
    //  Gestión de puestos de trabajo
    // ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getJobPositions() {
        return jobPositionRepository.findAllByOrderBySortOrderAsc().stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("code", p.getCode());
            m.put("label", p.getLabel());
            m.put("description", p.getDescription() != null ? p.getDescription() : "");
            m.put("icon", p.getIcon() != null ? p.getIcon() : "briefcase");
            m.put("color", p.getColor() != null ? p.getColor() : "bg-stone-100 text-stone-700 border-stone-200");
            m.put("system", p.isSystem());
            m.put("sortOrder", p.getSortOrder());
            m.put("permissionCount", rolePermissionRepository.findByRole(p.getCode()).size());
            return m;
        }).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> createJobPosition(String code, String label, String description,
                                                  String icon, String color) {
        if (jobPositionRepository.existsByCode(code)) {
            throw new RuntimeException("Ya existe un puesto con el código: " + code);
        }
        // Sort order: last + 1
        int maxOrder = jobPositionRepository.findAllByOrderBySortOrderAsc().stream()
                .mapToInt(p -> p.getSortOrder() != null ? p.getSortOrder() : 0)
                .max().orElse(0);
        JobPosition pos = jobPositionRepository.save(JobPosition.builder()
                .code(code.toUpperCase().replaceAll("[^A-Z0-9_]", "_"))
                .label(label)
                .description(description)
                .icon(icon != null ? icon : "briefcase")
                .color(color != null ? color : "bg-stone-100 text-stone-700 border-stone-200")
                .system(false)
                .sortOrder(maxOrder + 1)
                .build());
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", pos.getCode());
        m.put("label", pos.getLabel());
        m.put("description", pos.getDescription());
        m.put("icon", pos.getIcon());
        m.put("color", pos.getColor());
        m.put("system", pos.isSystem());
        m.put("sortOrder", pos.getSortOrder());
        m.put("permissionCount", 0);
        return m;
    }

    @Transactional
    public Map<String, Object> updateJobPosition(String code, String label, String description,
                                                  String icon, String color) {
        JobPosition pos = jobPositionRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Puesto no encontrado: " + code));
        if (label != null && !label.trim().isEmpty()) pos.setLabel(label);
        if (description != null) pos.setDescription(description);
        if (icon != null && !icon.trim().isEmpty()) pos.setIcon(icon);
        if (color != null && !color.trim().isEmpty()) pos.setColor(color);
        jobPositionRepository.save(pos);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", pos.getCode());
        m.put("label", pos.getLabel());
        m.put("description", pos.getDescription());
        m.put("icon", pos.getIcon());
        m.put("color", pos.getColor());
        m.put("system", pos.isSystem());
        m.put("sortOrder", pos.getSortOrder());
        m.put("permissionCount", rolePermissionRepository.findByRole(code).size());
        return m;
    }

    @Transactional
    public void deleteJobPosition(String code) {
        JobPosition pos = jobPositionRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Puesto no encontrado: " + code));
        if (pos.isSystem()) {
            throw new RuntimeException("No se puede eliminar un puesto del sistema: " + code);
        }
        rolePermissionRepository.deleteByRole(code);
        jobPositionRepository.delete(pos);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPositionPermissions(String code) {
        JobPosition pos = jobPositionRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Puesto no encontrado: " + code));
        List<String> perms = rolePermissionRepository.findByRole(code).stream()
                .map(RolePermission::getPermissionCode)
                .collect(Collectors.toList());
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", pos.getCode());
        m.put("label", pos.getLabel());
        m.put("permissionCodes", perms);
        return m;
    }

    /**
     * Restablece los permisos de un puesto a sus valores predeterminados del sistema.
     * Si el puesto no tiene plantilla definida, elimina todos sus permisos.
     */
    @Transactional
    public Map<String, Object> resetPositionPermissions(String code) {
        jobPositionRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Puesto no encontrado: " + code));
        List<String> defaults = ROLE_TEMPLATES.getOrDefault(code, Collections.emptyList());
        rolePermissionRepository.deleteByRole(code);
        if (!defaults.isEmpty()) {
            List<RolePermission> toSave = defaults.stream()
                    .map(pc -> RolePermission.builder().role(code).permissionCode(pc).build())
                    .collect(Collectors.toList());
            rolePermissionRepository.saveAll(toSave);
            // Eliminar overrides bloqueantes para los permisos restaurados
            userPermissionRepository.deleteBlockingOverridesForRole(code, defaults);
        }
        return getPositionPermissions(code);
    }

    @Transactional
    public Map<String, Object> savePositionPermissions(String code, List<String> permissionCodes) {
        jobPositionRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Puesto no encontrado: " + code));
        // Eliminar todos y reemplazar
        rolePermissionRepository.deleteByRole(code);
        if (permissionCodes != null && !permissionCodes.isEmpty()) {
            List<RolePermission> toSave = permissionCodes.stream()
                    .map(pc -> RolePermission.builder().role(code).permissionCode(pc).build())
                    .collect(Collectors.toList());
            rolePermissionRepository.saveAll(toSave);

            // Eliminar overrides individuales "granted=false" para permisos que ahora
            // forman parte del rol. Esos overrides bloqueaban el cambio de permisos del puesto.
            userPermissionRepository.deleteBlockingOverridesForRole(code, permissionCodes);
        }
        return getPositionPermissions(code);
    }

    // ─────────────────────────────────────────────────────────
    //  Permisos efectivos de un usuario
    //  = permisos del puesto + overrides individuales
    // ─────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Set<String> getEffectivePermissions(User user) {
        Set<String> perms = rolePermissionRepository.findByRole(user.getRole()).stream()
                .map(RolePermission::getPermissionCode)
                .collect(Collectors.toCollection(HashSet::new));
        for (UserPermission up : userPermissionRepository.findByUserId(user.getId())) {
            if (up.isGranted()) perms.add(up.getPermissionCode());
            else                perms.remove(up.getPermissionCode());
        }
        return perms;
    }

    // ─────────────────────────────────────────────────────────
    //  Guardar overrides individuales de un usuario
    // ─────────────────────────────────────────────────────────
    @Transactional
    public void saveUserPermissions(User user, Map<String, Boolean> overrides) {
        userPermissionRepository.deleteByUserId(user.getId());
        Set<String> rolePerms = rolePermissionRepository.findByRole(user.getRole()).stream()
                .map(RolePermission::getPermissionCode)
                .collect(Collectors.toSet());
        List<UserPermission> toSave = new ArrayList<>();
        for (Map.Entry<String, Boolean> e : overrides.entrySet()) {
            boolean inRole = rolePerms.contains(e.getKey());
            boolean desired = e.getValue();
            if (desired != inRole) {
                toSave.add(UserPermission.builder()
                        .user(user)
                        .permissionCode(e.getKey())
                        .granted(desired)
                        .build());
            }
        }
        userPermissionRepository.saveAll(toSave);
    }

    // ─────────────────────────────────────────────────────────
    //  Catálogo completo para el frontend
    // ─────────────────────────────────────────────────────────
    public List<Map<String, Object>> getCatalog() {
        return permissionRepository.findAll().stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("code", p.getCode());
            m.put("category", p.getCategory());
            m.put("label", p.getLabel());
            m.put("description", p.getDescription());
            return m;
        }).collect(Collectors.toList());
    }

    /** Plantillas de rol dinámicas (leídas desde BD) — para retrocompatibilidad */
    public Map<String, List<String>> getTemplates() {
        Map<String, List<String>> result = new LinkedHashMap<>();
        for (JobPosition pos : jobPositionRepository.findAllByOrderBySortOrderAsc()) {
            List<String> perms = rolePermissionRepository.findByRole(pos.getCode()).stream()
                    .map(RolePermission::getPermissionCode)
                    .collect(Collectors.toList());
            result.put(pos.getCode(), perms);
        }
        return result;
    }
}

