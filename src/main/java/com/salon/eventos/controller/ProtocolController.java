package com.salon.eventos.controller;

import com.salon.eventos.dto.ProtocolItemDto;
import com.salon.eventos.service.ProtocolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/protocol")
public class ProtocolController {

    @Autowired
    private ProtocolService protocolService;

    /**
     * Ver protocolo: se requiere el permiso PROTOCOL_VIEW.
     * - OFFICE tiene PROTOCOL_VIEW en su token → ok.
     * - CLIENT tiene acceso por rol (portal).
     * - Staff (DJ, FLOOR, custom) → necesita el permiso explícito.
     *   Si un admin elimina PROTOCOL_VIEW de DJ → DJ ya no puede ver el protocolo.
     */
    @GetMapping
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('PROTOCOL_VIEW')")
    public ResponseEntity<List<ProtocolItemDto>> getAll(@PathVariable Long eventId) {
        return ResponseEntity.ok(protocolService.getByEvent(eventId));
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('PROTOCOL_EDIT')")
    public ResponseEntity<ProtocolItemDto> create(@PathVariable Long eventId,
                                                   @RequestBody ProtocolItemDto dto) {
        return ResponseEntity.ok(protocolService.create(eventId, dto));
    }

    @PutMapping("/{itemId}")
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('PROTOCOL_EDIT')")
    public ResponseEntity<ProtocolItemDto> update(@PathVariable Long eventId,
                                                   @PathVariable Long itemId,
                                                   @RequestBody ProtocolItemDto dto) {
        return ResponseEntity.ok(protocolService.update(itemId, dto));
    }

    @DeleteMapping("/{itemId}")
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('PROTOCOL_EDIT')")
    public ResponseEntity<Void> delete(@PathVariable Long eventId,
                                        @PathVariable Long itemId) {
        protocolService.delete(itemId);
        return ResponseEntity.noContent().build();
    }
}
