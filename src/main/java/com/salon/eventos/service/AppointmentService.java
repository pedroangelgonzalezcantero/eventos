package com.salon.eventos.service;

import com.salon.eventos.dto.AppointmentDto;
import com.salon.eventos.dto.AppointmentRequest;
import com.salon.eventos.entity.Appointment;
import com.salon.eventos.entity.AppointmentStatus;
import com.salon.eventos.entity.User;
import com.salon.eventos.repository.AppointmentRepository;
import com.salon.eventos.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    // ── Consultas ─────────────────────────────────────────────────────────────

    public List<AppointmentDto> getCalendarAppointments(Integer year, Integer month) {
        LocalDate from, to;
        if (year != null && month != null) {
            YearMonth ym = YearMonth.of(year, month);
            from = ym.atDay(1);
            to = ym.atEndOfMonth();
        } else if (year != null) {
            from = LocalDate.of(year, 1, 1);
            to   = LocalDate.of(year, 12, 31);
        } else {
            from = LocalDate.now().withDayOfMonth(1);
            to   = from.plusMonths(1).minusDays(1);
        }
        return appointmentRepository
                .findByAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(from, to)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public AppointmentDto getById(Long id) {
        return toDto(findAppointment(id));
    }

    // ── Crear ─────────────────────────────────────────────────────────────────

    public AppointmentDto create(AppointmentRequest req) {
        User worker = findWorker(req.getWorkerId());
        checkOverlap(req.getWorkerId(), req.getAppointmentDate(),
                req.getStartTime(), req.getEndTime(), null);

        Appointment appt = Appointment.builder()
                .appointmentDate(req.getAppointmentDate())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .clientName(req.getClientName().trim())
                .phone(req.getPhone())
                .worker(worker)
                .notes(req.getNotes())
                .status(req.getStatus() != null ? req.getStatus() : AppointmentStatus.PENDIENTE)
                .build();
        return toDto(appointmentRepository.save(appt));
    }

    // ── Editar ────────────────────────────────────────────────────────────────

    public AppointmentDto update(Long id, AppointmentRequest req) {
        Appointment appt = findAppointment(id);
        User worker = findWorker(req.getWorkerId());
        checkOverlap(req.getWorkerId(), req.getAppointmentDate(),
                req.getStartTime(), req.getEndTime(), id);

        appt.setAppointmentDate(req.getAppointmentDate());
        appt.setStartTime(req.getStartTime());
        appt.setEndTime(req.getEndTime());
        appt.setClientName(req.getClientName().trim());
        appt.setPhone(req.getPhone());
        appt.setWorker(worker);
        appt.setNotes(req.getNotes());
        if (req.getStatus() != null) appt.setStatus(req.getStatus());
        return toDto(appointmentRepository.save(appt));
    }

    // ── Cambiar estado ────────────────────────────────────────────────────────

    public AppointmentDto updateStatus(Long id, String statusStr) {
        Appointment appt = findAppointment(id);
        appt.setStatus(AppointmentStatus.valueOf(statusStr));
        return toDto(appointmentRepository.save(appt));
    }

    // ── Eliminar ──────────────────────────────────────────────────────────────

    public void delete(Long id) {
        findAppointment(id); // valida existencia
        appointmentRepository.deleteById(id);
    }

    // ── Utilidades privadas ───────────────────────────────────────────────────

    /**
     * Comprueba que la trabajadora no tenga otra cita solapada.
     * Si endTime es null se asume duración de 1 hora a efectos de cálculo.
     *
     * @param excludeId ID de la cita a ignorar en la comprobación (para edición)
     */
    private void checkOverlap(Long workerId, LocalDate date,
                               LocalTime startTime, LocalTime endTime,
                               Long excludeId) {
        LocalTime newEnd = endTime != null ? endTime : startTime.plusHours(1);
        List<Appointment> existing =
                appointmentRepository.findByWorkerIdAndAppointmentDateOrderByStartTimeAsc(workerId, date);

        for (Appointment a : existing) {
            if (excludeId != null && a.getId().equals(excludeId)) continue;
            if (a.getStatus() == AppointmentStatus.CANCELADA) continue;

            LocalTime aEnd = a.getEndTime() != null ? a.getEndTime() : a.getStartTime().plusHours(1);
            boolean overlaps = startTime.isBefore(aEnd) && newEnd.isAfter(a.getStartTime());
            if (overlaps) {
                throw new IllegalStateException(
                        "La trabajadora ya tiene una cita en esa franja: "
                                + a.getClientName() + " ("
                                + a.getStartTime() + " – " + aEnd + ")");
            }
        }
    }

    private User findWorker(Long workerId) {
        return userRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Trabajadora no encontrada: " + workerId));
    }

    private Appointment findAppointment(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada: " + id));
    }

    public AppointmentDto toDto(Appointment a) {
        String workerName = a.getWorker().getNombre() != null
                ? a.getWorker().getNombre()
                : a.getWorker().getUsername();
        return AppointmentDto.builder()
                .id(a.getId())
                .appointmentDate(a.getAppointmentDate())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .clientName(a.getClientName())
                .phone(a.getPhone())
                .workerId(a.getWorker().getId())
                .workerName(workerName)
                .workerUsername(a.getWorker().getUsername())
                .notes(a.getNotes())
                .status(a.getStatus())
                .statusLabel(a.getStatus().getLabel())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}

