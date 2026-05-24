package com.salon.eventos.service;

import com.salon.eventos.dto.EventAssignmentDto;
import com.salon.eventos.entity.*;
import com.salon.eventos.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class EventAssignmentService {

    @Autowired
    private EventAssignmentRepository assignmentRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserRepository userRepository;

    public List<EventAssignmentDto> getByEvent(Long eventId) {
        return assignmentRepository.findByEventId(eventId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public EventAssignmentDto assign(Long eventId, Long userId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Devolver asignación existente si ya existe
        return assignmentRepository.findByEventIdAndUserId(eventId, userId)
                .map(this::toDto)
                .orElseGet(() -> {
                    EventAssignment assignment = EventAssignment.builder()
                            .event(event)
                            .user(user)
                            .build();
                    return toDto(assignmentRepository.save(assignment));
                });
    }

    public void remove(Long eventId, Long userId) {
        assignmentRepository.deleteByEventIdAndUserId(eventId, userId);
    }

    public List<Long> getEventIdsByUser(Long userId) {
        return assignmentRepository.findEventIdsByUserId(userId);
    }

    public boolean isAssigned(Long eventId, Long userId) {
        return assignmentRepository.existsByEventIdAndUserId(eventId, userId);
    }

    public EventAssignmentDto toDto(EventAssignment a) {
        return EventAssignmentDto.builder()
                .id(a.getId())
                .userId(a.getUser().getId())
                .username(a.getUser().getUsername())
                .nombre(a.getUser().getNombre() != null ? a.getUser().getNombre() : a.getUser().getUsername())
                .role(a.getUser().getRole())
                .assignedAt(a.getAssignedAt())
                .build();
    }
}

