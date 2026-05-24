package com.salon.eventos.service;

import com.salon.eventos.dto.EventAssignmentDto;
import com.salon.eventos.dto.CalendarEventDto;
import com.salon.eventos.dto.EventCreateRequest;
import com.salon.eventos.dto.EventDto;
import com.salon.eventos.entity.*;
import com.salon.eventos.repository.EventAssignmentRepository;
import com.salon.eventos.repository.EventRepository;
import com.salon.eventos.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class EventService {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventAssignmentRepository assignmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<EventDto> getAllEvents() {
        return eventRepository.findAllByOrderByEventDateAsc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public EventDto getEventById(Long id) {
        Event event = findEvent(id);
        return toDto(event);
    }

    public EventDto createEvent(EventCreateRequest req) {
        // Generar credenciales únicas para el cliente
        String username = generateClientUsername(req.getClientName(), req.getEventDate());
        String rawPassword = generatePassword();

        User clientUser = new User();
        clientUser.setUsername(username);
        clientUser.setPassword(passwordEncoder.encode(rawPassword));
        clientUser.setEmail(req.getEmail());
        clientUser.setNombre(req.getClientName());
        clientUser.setRole("CLIENT");
        clientUser.setActive(true);
        userRepository.save(clientUser);

        Event event = new Event();
        event.setClientName(req.getClientName());
        event.setType(req.getType());
        event.setEventDate(req.getEventDate());
        event.setEstimatedGuests(req.getEstimatedGuests());
        event.setVenue(req.getVenue());
        event.setContactPerson(req.getContactPerson());
        event.setPhone(req.getPhone());
        event.setEmail(req.getEmail());
        event.setNotes(req.getNotes());
        event.setStatus(EventStatus.PENDIENTE_INFO);
        event.setClientUser(clientUser);
        event = eventRepository.save(event);

        EventDto dto = toDto(event);
        // Incluir la contraseña en texto plano SOLO en la respuesta de creación
        dto.setClientUsername(username + " / " + rawPassword);
        return dto;
    }

    public EventDto updateEvent(Long id, EventCreateRequest req) {
        Event event = findEvent(id);
        event.setClientName(req.getClientName());
        event.setType(req.getType());
        event.setEventDate(req.getEventDate());
        event.setEstimatedGuests(req.getEstimatedGuests());
        event.setVenue(req.getVenue());
        event.setContactPerson(req.getContactPerson());
        event.setPhone(req.getPhone());
        event.setEmail(req.getEmail());
        event.setNotes(req.getNotes());
        return toDto(eventRepository.save(event));
    }

    public void updateStatus(Long id, String status) {
        Event event = findEvent(id);
        event.setStatus(EventStatus.valueOf(status));
        eventRepository.save(event);
    }

    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }

    public EventDto getMyEvent(String username) {
        Event event = eventRepository.findByClientUserUsername(username)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado para el cliente"));
        return toDto(event);
    }

    // Usado por el scheduler para calcular días
    public List<Event> getUpcomingEvents(int daysFrom, int daysTo) {
        LocalDate from = LocalDate.now().plusDays(daysFrom);
        LocalDate to = LocalDate.now().plusDays(daysTo);
        return eventRepository.findUpcomingEvents(from, to);
    }

    public List<CalendarEventDto> getCalendarEvents(Integer year, Integer month, String type, String status) {
        List<Event> events;
        if (year != null && month != null) {
            YearMonth ym = YearMonth.of(year, month);
            events = eventRepository.findByEventDateBetween(ym.atDay(1), ym.atEndOfMonth());
        } else {
            events = eventRepository.findAllByOrderByEventDateAsc();
        }
        // Filtros adicionales
        if (type != null && !type.isEmpty()) {
            EventType et = EventType.valueOf(type);
            events = events.stream().filter(e -> e.getType() == et).collect(Collectors.toList());
        }
        if (status != null && !status.isEmpty()) {
            EventStatus es = EventStatus.valueOf(status);
            events = events.stream().filter(e -> e.getStatus() == es).collect(Collectors.toList());
        }
        return events.stream().map(this::toCalendarDto).collect(Collectors.toList());
    }

    private CalendarEventDto toCalendarDto(Event e) {
        long days = ChronoUnit.DAYS.between(LocalDate.now(), e.getEventDate());
        List<EventAssignment> assignments = assignmentRepository.findByEventId(e.getId());
        String djName = assignments.stream()
                .filter(a -> "DJ".equals(a.getUser().getRole()))
                .map(a -> a.getUser().getNombre() != null ? a.getUser().getNombre() : a.getUser().getUsername())
                .findFirst().orElse(null);
        String maitreName = assignments.stream()
                .filter(a -> "FLOOR".equals(a.getUser().getRole()))
                .map(a -> a.getUser().getNombre() != null ? a.getUser().getNombre() : a.getUser().getUsername())
                .findFirst().orElse(null);
        return CalendarEventDto.builder()
                .id(e.getId())
                .clientName(e.getClientName())
                .eventDate(e.getEventDate())
                .type(e.getType())
                .typeLabel(e.getType().getLabel())
                .typeColor(getTypeColor(e.getType()))
                .status(e.getStatus())
                .statusLabel(e.getStatus().getLabel())
                .venue(e.getVenue())
                .estimatedGuests(e.getEstimatedGuests())
                .daysUntilEvent(days)
                .djName(djName)
                .maitreName(maitreName)
                .protocolCompleted(e.isProtocolCompleted())
                .menuConfirmed(e.isMenuConfirmed())
                .allergensCompleted(e.isAllergensCompleted())
                .build();
    }

    private String getTypeColor(EventType type) {
        switch (type) {
            case BODA: return "gold";
            case COMUNION: return "blue";
            case BAUTIZO: return "green";
            case CUMPLEANOS: return "pink";
            case ANIVERSARIO: return "rose";
            case EMPRESA: return "slate";
            default: return "purple";
        }
    }

    private String generateClientUsername(String clientName, LocalDate date) {
        String base = clientName.toLowerCase()
                .replaceAll("[áàä]", "a").replaceAll("[éèë]", "e")
                .replaceAll("[íìï]", "i").replaceAll("[óòö]", "o")
                .replaceAll("[úùü]", "u").replaceAll("[ñ]", "n")
                .replaceAll("[^a-z0-9]", "");
        if (base.length() > 10) base = base.substring(0, 10);
        String suffix = String.valueOf(date.getYear()).substring(2) +
                String.format("%02d", date.getMonthValue());
        String username = base + suffix;
        // Asegurar unicidad
        String candidate = username;
        int counter = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = username + counter++;
        }
        return candidate;
    }

    private String generatePassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        Random rnd = new Random();
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) sb.append(chars.charAt(rnd.nextInt(chars.length())));
        return sb.toString();
    }

    private Event findEvent(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado: " + id));
    }

    public EventDto toDto(Event e) {
        long days = ChronoUnit.DAYS.between(LocalDate.now(), e.getEventDate());
        // Protocolo bloqueado si faltan menos de 4 días (o ya pasó el evento)
        boolean protocolLocked = LocalDate.now().isAfter(e.getEventDate().minusDays(4));
        List<EventAssignmentDto> assignments = assignmentRepository.findByEventId(e.getId())
                .stream()
                .map(a -> EventAssignmentDto.builder()
                        .id(a.getId())
                        .userId(a.getUser().getId())
                        .username(a.getUser().getUsername())
                        .nombre(a.getUser().getNombre() != null ? a.getUser().getNombre() : a.getUser().getUsername())
                        .role(a.getUser().getRole())
                        .assignedAt(a.getAssignedAt())
                        .build())
                .collect(Collectors.toList());
        return EventDto.builder()
                .id(e.getId())
                .clientName(e.getClientName())
                .type(e.getType())
                .typeLabel(e.getType().getLabel())
                .eventDate(e.getEventDate())
                .estimatedGuests(e.getEstimatedGuests())
                .venue(e.getVenue())
                .contactPerson(e.getContactPerson())
                .phone(e.getPhone())
                .email(e.getEmail())
                .status(e.getStatus())
                .statusLabel(e.getStatus().getLabel())
                .clientUsername(e.getClientUser() != null ? e.getClientUser().getUsername() : null)
                .notes(e.getNotes())
                .menuConfirmed(e.isMenuConfirmed())
                .allergensCompleted(e.isAllergensCompleted())
                .protocolCompleted(e.isProtocolCompleted())
                .budgetSigned(e.isBudgetSigned())
                .protocolLocked(protocolLocked)
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .daysUntilEvent(days)
                .assignments(assignments)
                .build();
    }
}
