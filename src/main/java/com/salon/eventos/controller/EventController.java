package com.salon.eventos.controller;

import com.salon.eventos.dto.CalendarEventDto;
import com.salon.eventos.dto.EventCreateRequest;
import com.salon.eventos.dto.EventDto;
import com.salon.eventos.entity.User;
import com.salon.eventos.repository.UserRepository;
import com.salon.eventos.service.EventAssignmentService;
import com.salon.eventos.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {

    @Autowired
    private EventService eventService;

    @Autowired
    private EventAssignmentService assignmentService;

    @Autowired
    private UserRepository userRepository;

    // ---- Oficina: gestión completa ----

    @GetMapping
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<List<EventDto>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EventDto> getEvent(@PathVariable Long id, Authentication auth) {
        // Buscar la autoridad que empieza por ROLE_ para extraer el puesto
        String role = auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .filter(a -> a.startsWith("ROLE_"))
                .findFirst()
                .orElse("ROLE_UNKNOWN")
                .replace("ROLE_", "");
        String username = auth.getName();

        if ("OFFICE".equals(role)) {
            return ResponseEntity.ok(eventService.getEventById(id));
        }
        if ("CLIENT".equals(role)) {
            EventDto myEvent = eventService.getMyEvent(username);
            if (!myEvent.getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            return ResponseEntity.ok(myEvent);
        }
        // Todos los demás roles (DJ, FLOOR, KITCHEN, roles personalizados): verificar asignación
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (!assignmentService.isAssigned(id, user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<EventDto> createEvent(@Valid @RequestBody EventCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createEvent(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<EventDto> updateEvent(@PathVariable Long id,
                                                 @Valid @RequestBody EventCreateRequest request) {
        return ResponseEntity.ok(eventService.updateEvent(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Void> updateStatus(@PathVariable Long id,
                                              @RequestBody Map<String, String> body) {
        eventService.updateStatus(id, body.get("status"));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    // ---- Cliente: ver su propio evento ----

    @GetMapping("/mi-evento")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<EventDto> getMyEvent(Authentication auth) {
        return ResponseEntity.ok(eventService.getMyEvent(auth.getName()));
    }

    // ---- Calendario (solo OFFICE) ----

    @GetMapping("/calendar")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<List<CalendarEventDto>> getCalendar(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(eventService.getCalendarEvents(year, month, type, status));
    }
}
