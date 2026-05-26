package com.salon.eventos.controller;

import com.salon.eventos.dto.PersonaDto;
import com.salon.eventos.service.PersonaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/personas")
public class PersonaController {

    @Autowired
    private PersonaService personaService;

    @GetMapping
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<List<PersonaDto>> getAll() {
        return ResponseEntity.ok(personaService.getAll());
    }

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PersonaDto>> search(@RequestParam(defaultValue = "") String q) {
        return ResponseEntity.ok(personaService.search(q));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<PersonaDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(personaService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<?> create(@RequestBody PersonaDto dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(personaService.create(dto));
        } catch (RuntimeException e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody PersonaDto dto) {
        try {
            return ResponseEntity.ok(personaService.update(id, dto));
        } catch (RuntimeException e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PatchMapping("/{id}/toggle-activo")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<PersonaDto> toggleActivo(@PathVariable Long id) {
        return ResponseEntity.ok(personaService.toggleActivo(id));
    }
}
