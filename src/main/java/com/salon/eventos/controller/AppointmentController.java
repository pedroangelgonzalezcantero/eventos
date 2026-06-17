package com.salon.eventos.controller;

import com.salon.eventos.dto.AppointmentDto;
import com.salon.eventos.dto.AppointmentRequest;
import com.salon.eventos.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    /** Citas del calendario para un mes/año dado */
    @GetMapping("/calendar")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<List<AppointmentDto>> getCalendar(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ResponseEntity.ok(appointmentService.getCalendarAppointments(year, month));
    }

    /** Detalle de una cita */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<AppointmentDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getById(id));
    }

    /** Crear nueva cita telefónica */
    @PostMapping
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<AppointmentDto> create(@Valid @RequestBody AppointmentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.create(req));
    }

    /** Editar / reprogramar cita */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<AppointmentDto> update(@PathVariable Long id,
                                                  @Valid @RequestBody AppointmentRequest req) {
        return ResponseEntity.ok(appointmentService.update(id, req));
    }

    /** Cambiar solo el estado */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<AppointmentDto> updateStatus(@PathVariable Long id,
                                                        @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, body.get("status")));
    }

    /** Eliminar cita */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        appointmentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Manejador de errores de solapamiento */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleOverlap(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", ex.getMessage()));
    }
}

