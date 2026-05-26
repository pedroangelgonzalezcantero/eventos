package com.salon.eventos.controller;

import com.salon.eventos.dto.AltaDto;
import com.salon.eventos.service.AltaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
public class AltaController {

    @Autowired
    private AltaService altaService;

    /** GET /api/altas?from=2026-05-23&to=2026-05-25 */
    @GetMapping("/altas")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<List<AltaDto>> getByRange(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        if (from == null) from = LocalDate.now().minusDays(7);
        if (to   == null) to   = LocalDate.now().plusDays(7);
        return ResponseEntity.ok(altaService.getByFechaRange(from, to));
    }

    /** GET /api/events/{eventoId}/altas */
    @GetMapping("/events/{eventoId}/altas")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<List<AltaDto>> getByEvento(@PathVariable Long eventoId) {
        return ResponseEntity.ok(altaService.getByEvento(eventoId));
    }
}

