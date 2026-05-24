package com.salon.eventos.controller;

import com.salon.eventos.dto.EventAssignmentDto;
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

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class EventAssignmentController {

    @Autowired private EventAssignmentService assignmentService;
    @Autowired private EventService eventService;
    @Autowired private UserRepository userRepository;

    /**
     * Cualquier usuario autenticado (no CLIENT) obtiene los eventos de su asignación.
     * OFFICE obtiene todos los activos (por comodidad desde vistas de staff).
     * CLIENT está bloqueado — debe usar GET /events/mi-evento.
     */
    @GetMapping("/events/mis-eventos")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<EventDto>> getMyEvents(Authentication auth) {
        String role = auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .filter(a -> a.startsWith("ROLE_"))
                .findFirst()
                .orElse("ROLE_UNKNOWN")
                .replace("ROLE_", "");

        if ("CLIENT".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if ("OFFICE".equals(role)) {
            List<EventDto> all = eventService.getAllEvents().stream()
                    .filter(e -> !"COMPLETADO".equals(e.getStatus()) && !"CANCELADO".equals(e.getStatus()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(all);
        }

        // Cualquier otro rol (DJ, FLOOR, KITCHEN, o personalizados): eventos asignados
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        List<Long> eventIds = assignmentService.getEventIdsByUser(user.getId());
        List<EventDto> events = eventIds.stream()
                .map(id -> eventService.getEventById(id))
                .sorted((a, b) -> a.getEventDate().compareTo(b.getEventDate()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/events/{eventId}/assignments")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<List<EventAssignmentDto>> getAssignments(@PathVariable Long eventId) {
        return ResponseEntity.ok(assignmentService.getByEvent(eventId));
    }

    @PostMapping("/events/{eventId}/assignments")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<EventAssignmentDto> assign(@PathVariable Long eventId,
                                                     @RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(assignmentService.assign(eventId, body.get("userId")));
    }

    @DeleteMapping("/events/{eventId}/assignments/{userId}")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Void> removeAssignment(@PathVariable Long eventId,
                                                  @PathVariable Long userId) {
        assignmentService.remove(eventId, userId);
        return ResponseEntity.noContent().build();
    }
}
