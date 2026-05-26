package com.salon.eventos.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.salon.eventos.dto.FloorElementDto;
import com.salon.eventos.dto.InteractiveFloorPlanDto;
import com.salon.eventos.entity.Event;
import com.salon.eventos.entity.InteractiveFloorPlan;
import com.salon.eventos.repository.EventRepository;
import com.salon.eventos.repository.InteractiveFloorPlanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class InteractiveFloorPlanService {

    @Autowired private InteractiveFloorPlanRepository repo;
    @Autowired private EventRepository                eventRepo;
    @Autowired private ObjectMapper                   objectMapper;

    /** Obtiene el plano interactivo de un evento */
    public Optional<InteractiveFloorPlanDto> getByEvent(Long eventId) {
        return repo.findByEventId(eventId).map(this::toDto);
    }

    /** Upsert: crea si no existe, actualiza si ya existe */
    public InteractiveFloorPlanDto save(Long eventId, InteractiveFloorPlanDto dto) {
        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));

        InteractiveFloorPlan plan = repo.findByEventId(eventId)
                .orElse(InteractiveFloorPlan.builder().event(event).build());

        if (dto.getName() != null && !dto.getName().trim().isEmpty()) {
            plan.setName(dto.getName());
        }
        if (dto.getCanvasWidth()  != null) plan.setCanvasWidth(dto.getCanvasWidth());
        if (dto.getCanvasHeight() != null) plan.setCanvasHeight(dto.getCanvasHeight());

        try {
            List<FloorElementDto> els = dto.getElements() != null ? dto.getElements() : Collections.emptyList();
            plan.setElements(objectMapper.writeValueAsString(els));
        } catch (Exception e) {
            plan.setElements("[]");
        }

        return toDto(repo.save(plan));
    }

    /** Elimina el plano interactivo */
    public void delete(Long eventId) {
        if (!repo.existsByEventId(eventId))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Plano interactivo no encontrado");
        repo.deleteByEventId(eventId);
    }

    // ── Mapeo ────────────────────────────────────────────────────────────────

    private InteractiveFloorPlanDto toDto(InteractiveFloorPlan p) {
        List<FloorElementDto> elements;
        try {
            elements = objectMapper.readValue(p.getElements(),
                    new TypeReference<List<FloorElementDto>>() {});
        } catch (Exception e) {
            elements = Collections.emptyList();
        }
        return InteractiveFloorPlanDto.builder()
                .id(p.getId())
                .eventId(p.getEvent().getId())
                .name(p.getName())
                .elements(elements)
                .canvasWidth(p.getCanvasWidth())
                .canvasHeight(p.getCanvasHeight())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}


