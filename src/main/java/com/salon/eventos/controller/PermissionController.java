package com.salon.eventos.controller;

import com.salon.eventos.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/permissions")
public class PermissionController {

    @Autowired
    private PermissionService permissionService;

    /** Catálogo completo de permisos disponibles */
    @GetMapping
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<List<Map<String, Object>>> getCatalog() {
        return ResponseEntity.ok(permissionService.getCatalog());
    }

    /** Plantillas de permisos por rol para autocompletar en el UI */
    @GetMapping("/templates")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Map<String, List<String>>> getTemplates() {
        return ResponseEntity.ok(permissionService.getTemplates());
    }
}

