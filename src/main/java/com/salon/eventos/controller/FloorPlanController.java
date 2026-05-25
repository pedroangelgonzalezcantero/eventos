package com.salon.eventos.controller;

import com.salon.eventos.dto.FloorPlanDto;
import com.salon.eventos.entity.FloorPlan;
import com.salon.eventos.service.FloorPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/events/{eventId}/floorplan")
public class FloorPlanController {

    @Autowired
    private FloorPlanService service;

    /** Metadatos del plano (sin el archivo) */
    @GetMapping("/meta")
    @PreAuthorize("hasRole('OFFICE') or hasRole('FLOOR') or hasRole('CLIENT') or hasAnyAuthority('TABLES_VIEW','ALLERGENS_VIEW')")
    public ResponseEntity<?> getMeta(@PathVariable Long eventId) {
        return service.getMeta(eventId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /** Descarga / stream del plano para embeber en <img> o <iframe> */
    @GetMapping
    @PreAuthorize("hasRole('OFFICE') or hasRole('FLOOR') or hasRole('CLIENT') or hasAnyAuthority('TABLES_VIEW','ALLERGENS_VIEW')")
    public ResponseEntity<byte[]> download(@PathVariable Long eventId) {
        FloorPlan plan = service.getRaw(eventId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + plan.getFilename() + "\"")
                .contentType(MediaType.parseMediaType(plan.getContentType()))
                .contentLength(plan.getFileSize() != null ? plan.getFileSize() : plan.getData().length)
                .body(plan.getData());
    }

    /** Sube o reemplaza el plano */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('OFFICE') or hasRole('CLIENT') or hasAnyAuthority('TABLES_EDIT','ALLERGENS_EDIT')")
    public ResponseEntity<FloorPlanDto> upload(@PathVariable Long eventId,
                                                @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.upload(eventId, file));
    }

    /** Elimina el plano */
    @DeleteMapping
    @PreAuthorize("hasRole('OFFICE') or hasRole('CLIENT') or hasAnyAuthority('TABLES_EDIT','ALLERGENS_EDIT')")
    public ResponseEntity<Void> delete(@PathVariable Long eventId) {
        service.delete(eventId);
        return ResponseEntity.noContent().build();
    }
}
