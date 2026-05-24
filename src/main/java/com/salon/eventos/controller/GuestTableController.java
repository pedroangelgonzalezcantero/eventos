package com.salon.eventos.controller;

import com.salon.eventos.dto.GuestDto;
import com.salon.eventos.dto.GuestTableDto;
import com.salon.eventos.service.GuestTableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events/{eventId}")
public class GuestTableController {

    @Autowired
    private GuestTableService service;

    // ─── MESAS ───────────────────────────────────────────────────────────────

    @GetMapping("/tables")
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('TABLES_VIEW')")
    public ResponseEntity<List<GuestTableDto>> getTables(@PathVariable Long eventId) {
        return ResponseEntity.ok(service.getTablesForEvent(eventId));
    }

    @PostMapping("/tables")
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('TABLES_CREATE')")
    public ResponseEntity<GuestTableDto> createTable(@PathVariable Long eventId,
                                                      @RequestBody GuestTableDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createTable(eventId, dto));
    }

    @PutMapping("/tables/{tableId}")
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('TABLES_EDIT')")
    public ResponseEntity<GuestTableDto> updateTable(@PathVariable Long eventId,
                                                      @PathVariable Long tableId,
                                                      @RequestBody GuestTableDto dto) {
        return ResponseEntity.ok(service.updateTable(tableId, dto));
    }

    @DeleteMapping("/tables/{tableId}")
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('TABLES_DELETE')")
    public ResponseEntity<Void> deleteTable(@PathVariable Long eventId,
                                             @PathVariable Long tableId) {
        service.deleteTable(tableId);
        return ResponseEntity.noContent().build();
    }

    // ─── INVITADOS ────────────────────────────────────────────────────────────

    @GetMapping("/guests")
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('GUESTS_VIEW')")
    public ResponseEntity<List<GuestDto>> getAllGuests(@PathVariable Long eventId) {
        return ResponseEntity.ok(service.getAllGuestsForEvent(eventId));
    }

    @GetMapping("/tables/{tableId}/guests")
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('GUESTS_VIEW')")
    public ResponseEntity<List<GuestDto>> getGuests(@PathVariable Long eventId,
                                                     @PathVariable Long tableId) {
        return ResponseEntity.ok(service.getGuestsForTable(tableId));
    }

    @PostMapping("/tables/{tableId}/guests")
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('GUESTS_CREATE')")
    public ResponseEntity<GuestDto> addGuest(@PathVariable Long eventId,
                                              @PathVariable Long tableId,
                                              @RequestBody GuestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addGuest(tableId, dto));
    }

    @PutMapping("/tables/{tableId}/guests/{guestId}")
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('GUESTS_EDIT')")
    public ResponseEntity<GuestDto> updateGuest(@PathVariable Long eventId,
                                                 @PathVariable Long tableId,
                                                 @PathVariable Long guestId,
                                                 @RequestBody GuestDto dto) {
        return ResponseEntity.ok(service.updateGuest(guestId, dto));
    }

    @PatchMapping("/tables/{tableId}/guests/{guestId}/move")
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('GUESTS_EDIT')")
    public ResponseEntity<GuestDto> moveGuest(@PathVariable Long eventId,
                                               @PathVariable Long tableId,
                                               @PathVariable Long guestId,
                                               @RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(service.moveGuest(guestId, body.get("targetTableId")));
    }

    @DeleteMapping("/tables/{tableId}/guests/{guestId}")
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('GUESTS_DELETE')")
    public ResponseEntity<Void> deleteGuest(@PathVariable Long eventId,
                                             @PathVariable Long tableId,
                                             @PathVariable Long guestId) {
        service.deleteGuest(guestId);
        return ResponseEntity.noContent().build();
    }
}
