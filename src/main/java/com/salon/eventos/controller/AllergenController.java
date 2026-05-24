package com.salon.eventos.controller;

import com.salon.eventos.dto.AllergenEntryDto;
import com.salon.eventos.service.AllergenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/allergens")
public class AllergenController {

    @Autowired
    private AllergenService allergenService;

    @GetMapping
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('ALLERGENS_VIEW')")
    public ResponseEntity<List<AllergenEntryDto>> getAll(@PathVariable Long eventId) {
        return ResponseEntity.ok(allergenService.getByEvent(eventId));
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('ALLERGENS_EDIT')")
    public ResponseEntity<AllergenEntryDto> create(@PathVariable Long eventId,
                                                    @RequestBody AllergenEntryDto dto) {
        return ResponseEntity.ok(allergenService.create(eventId, dto));
    }

    @PutMapping("/{entryId}")
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('ALLERGENS_EDIT')")
    public ResponseEntity<AllergenEntryDto> update(@PathVariable Long eventId,
                                                    @PathVariable Long entryId,
                                                    @RequestBody AllergenEntryDto dto) {
        return ResponseEntity.ok(allergenService.update(entryId, dto));
    }

    @DeleteMapping("/{entryId}")
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('ALLERGENS_EDIT')")
    public ResponseEntity<Void> delete(@PathVariable Long eventId,
                                        @PathVariable Long entryId) {
        allergenService.delete(entryId);
        return ResponseEntity.noContent().build();
    }
}
