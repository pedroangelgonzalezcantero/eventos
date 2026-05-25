package com.salon.eventos.controller;

import com.salon.eventos.dto.AllergenEntryDto;
import com.salon.eventos.service.AllergenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events/{eventId}/allergens")
public class AllergenController {

    @Autowired
    private AllergenService allergenService;

    /**
     * Devuelve todos los invitados del evento agrupables por mesa
     * (fuente única de verdad: tabla guests).
     */
    @GetMapping
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('ALLERGENS_VIEW')")
    public ResponseEntity<List<AllergenEntryDto>> getAll(@PathVariable Long eventId) {
        return ResponseEntity.ok(allergenService.getByEvent(eventId));
    }

    /**
     * Actualiza los alérgenos/dieta de un invitado.
     * {entryId} corresponde al id del Guest.
     */
    @PutMapping("/{entryId}")
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('ALLERGENS_EDIT')")
    public ResponseEntity<AllergenEntryDto> update(@PathVariable Long eventId,
                                                    @PathVariable Long entryId,
                                                    @RequestBody AllergenEntryDto dto) {
        return ResponseEntity.ok(allergenService.update(entryId, dto));
    }

    /**
     * Limpia las restricciones alimentarias de un invitado
     * (el invitado permanece en su mesa).
     */
    @DeleteMapping("/{entryId}")
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('ALLERGENS_EDIT')")
    public ResponseEntity<Void> delete(@PathVariable Long eventId,
                                        @PathVariable Long entryId) {
        allergenService.delete(entryId);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST desactivado: los alérgenos se gestionan añadiendo invitados desde Mesas.
     */
    @PostMapping
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('ALLERGENS_EDIT')")
    public ResponseEntity<Map<String, String>> createDeprecated(@PathVariable Long eventId) {
        return ResponseEntity.status(405)
                .body(Collections.singletonMap("message",
                        "Los alérgenos se gestionan directamente desde la sección Mesas. " +
                        "Añade invitados allí y edita sus restricciones desde Alérgenos."));
    }
}
