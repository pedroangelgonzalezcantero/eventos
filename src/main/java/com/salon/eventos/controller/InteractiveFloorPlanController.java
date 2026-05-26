package com.salon.eventos.controller;

import com.salon.eventos.dto.InteractiveFloorPlanDto;
import com.salon.eventos.service.InteractiveFloorPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events/{eventId}/floor-editor")
public class InteractiveFloorPlanController {

    @Autowired
    private InteractiveFloorPlanService service;

    /** Obtiene el plano interactivo (204 si aún no existe) */
    @GetMapping
    @PreAuthorize("hasRole('OFFICE') or hasRole('FLOOR') or hasRole('CLIENT') " +
                  "or hasAnyAuthority('TABLES_VIEW','FLOOR_PLAN_VIEW')")
    public ResponseEntity<?> get(@PathVariable Long eventId) {
        return service.getByEvent(eventId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /** Crea el plano interactivo */
    @PostMapping
    @PreAuthorize("hasRole('OFFICE') or hasRole('CLIENT') or hasAnyAuthority('TABLES_EDIT')")
    public ResponseEntity<InteractiveFloorPlanDto> create(
            @PathVariable Long eventId,
            @RequestBody InteractiveFloorPlanDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.save(eventId, dto));
    }

    /** Actualiza el plano interactivo (upsert) */
    @PutMapping
    @PreAuthorize("hasRole('OFFICE') or hasRole('CLIENT') or hasAnyAuthority('TABLES_EDIT')")
    public ResponseEntity<InteractiveFloorPlanDto> update(
            @PathVariable Long eventId,
            @RequestBody InteractiveFloorPlanDto dto) {
        return ResponseEntity.ok(service.save(eventId, dto));
    }

    /** Elimina el plano interactivo */
    @DeleteMapping
    @PreAuthorize("hasRole('OFFICE') or hasRole('CLIENT') or hasAnyAuthority('TABLES_EDIT')")
    public ResponseEntity<Void> delete(@PathVariable Long eventId) {
        service.delete(eventId);
        return ResponseEntity.noContent().build();
    }
}

