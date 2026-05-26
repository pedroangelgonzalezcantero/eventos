package com.salon.eventos.controller;

import com.salon.eventos.dto.RangoDto;
import com.salon.eventos.service.RangoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events/{eventoId}/rangos")
public class RangoController {

    @Autowired
    private RangoService rangoService;

    @GetMapping
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<List<RangoDto>> getByEvento(@PathVariable Long eventoId) {
        return ResponseEntity.ok(rangoService.getByEvento(eventoId));
    }

    @PostMapping
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<?> create(@PathVariable Long eventoId,
                                    @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(rangoService.create(eventoId, body));
        } catch (RuntimeException e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping("/{rangoId}")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<?> update(@PathVariable Long eventoId,
                                    @PathVariable Long rangoId,
                                    @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(rangoService.update(eventoId, rangoId, body));
        } catch (RuntimeException e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/batch")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<List<RangoDto>> batchCreate(@PathVariable Long eventoId,
                                                      @RequestBody List<Map<String, Object>> items) {
        return ResponseEntity.ok(rangoService.batchCreate(eventoId, items));
    }

    @DeleteMapping("/{rangoId}")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Void> delete(@PathVariable Long eventoId,
                                       @PathVariable Long rangoId) {
        rangoService.delete(eventoId, rangoId);
        return ResponseEntity.noContent().build();
    }
}

