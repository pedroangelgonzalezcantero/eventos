package com.salon.eventos.controller;

import com.salon.eventos.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * CRUD de puestos de trabajo y gestión de sus permisos.
 * Endpoint base: /api/positions
 */
@RestController
@RequestMapping("/api/positions")
public class JobPositionController {

    @Autowired
    private PermissionService permissionService;

    private Map<String, Object> error(String msg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("error", msg);
        return m;
    }

    /** Lista todos los puestos con su conteo de permisos */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getAll() {
        return ResponseEntity.ok(permissionService.getJobPositions());
    }

    /** Crea un nuevo puesto personalizado */
    @PostMapping
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(permissionService.createJobPosition(
                    body.get("code"), body.get("label"), body.get("description"),
                    body.get("icon"), body.get("color")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    /** Actualiza etiqueta, descripción, icono y color de un puesto */
    @PutMapping("/{code}")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Map<String, Object>> update(@PathVariable String code,
                                                      @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(permissionService.updateJobPosition(
                    code, body.get("label"), body.get("description"),
                    body.get("icon"), body.get("color")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    /** Elimina un puesto (solo los no-system) */
    @DeleteMapping("/{code}")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable String code) {
        try {
            permissionService.deleteJobPosition(code);
            Map<String, Object> ok = new LinkedHashMap<>();
            ok.put("deleted", code);
            return ResponseEntity.ok(ok);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    /** Obtiene los permisos asignados a un puesto */
    @GetMapping("/{code}/permissions")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Map<String, Object>> getPermissions(@PathVariable String code) {
        try {
            return ResponseEntity.ok(permissionService.getPositionPermissions(code));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    /**
     * Guarda (reemplaza) el conjunto de permisos de un puesto.
     * Body: { "permissionCodes": ["EVENTS_VIEW_ALL", "PROTOCOL_VIEW", ...] }
     */
    @PutMapping("/{code}/permissions")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Map<String, Object>> savePermissions(@PathVariable String code,
                                                               @RequestBody Map<String, Object> body) {
        try {
            @SuppressWarnings("unchecked")
            List<String> codes = (List<String>) body.get("permissionCodes");
            return ResponseEntity.ok(permissionService.savePositionPermissions(code, codes));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    /**
     * Restablece los permisos de un puesto a los valores predeterminados del sistema.
     * POST /api/positions/{code}/permissions/reset
     */
    @PostMapping("/{code}/permissions/reset")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Map<String, Object>> resetPermissions(@PathVariable String code) {
        try {
            return ResponseEntity.ok(permissionService.resetPositionPermissions(code));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }
}

