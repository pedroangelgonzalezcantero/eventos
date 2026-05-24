package com.salon.eventos.service;

import com.salon.eventos.dto.ProtocolItemDto;
import com.salon.eventos.entity.Event;
import com.salon.eventos.entity.ProtocolItem;
import com.salon.eventos.repository.EventRepository;
import com.salon.eventos.repository.ProtocolItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProtocolService {

    @Autowired
    private ProtocolItemRepository protocolRepository;

    @Autowired
    private EventRepository eventRepository;

    public List<ProtocolItemDto> getByEvent(Long eventId) {
        return protocolRepository.findByEventIdOrderByPositionAscEventTimeAsc(eventId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public ProtocolItemDto create(Long eventId, ProtocolItemDto dto) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado"));
        checkProtocolLock(event);
        ProtocolItem item = new ProtocolItem();
        item.setEvent(event);
        fillItem(item, dto);
        if (item.getPosition() == null) {
            long count = protocolRepository.findByEventIdOrderByPositionAscEventTimeAsc(eventId).size();
            item.setPosition((int) count + 1);
        }
        ProtocolItemDto result = toDto(protocolRepository.save(item));
        updateEventFlag(eventId);
        return result;
    }

    public ProtocolItemDto update(Long itemId, ProtocolItemDto dto) {
        ProtocolItem item = protocolRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Elemento no encontrado"));
        checkProtocolLock(item.getEvent());
        fillItem(item, dto);
        return toDto(protocolRepository.save(item));
    }

    public void delete(Long itemId) {
        ProtocolItem item = protocolRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Elemento no encontrado"));
        checkProtocolLock(item.getEvent());
        Long eventId = item.getEvent().getId();
        protocolRepository.deleteById(itemId);
        updateEventFlag(eventId);
    }

    /**
     * Lanza 423 LOCKED si el cliente intenta editar cuando faltan menos de 4 días.
     * El rol OFFICE siempre puede editar.
     */
    private void checkProtocolLock(Event event) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return;
        boolean isClient = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_CLIENT"));
        if (!isClient) return; // OFFICE y otros roles: sin restricción

        if (LocalDate.now().isAfter(event.getEventDate().minusDays(4))) {
            throw new ResponseStatusException(HttpStatus.LOCKED,
                    "El protocolo está bloqueado. El plazo para realizar cambios finalizó 4 días antes del evento.");
        }
    }

    private void fillItem(ProtocolItem item, ProtocolItemDto dto) {
        item.setEventTime(dto.getEventTime());
        item.setDescription(dto.getDescription());
        item.setInvolvedPerson(dto.getInvolvedPerson());
        item.setYoutubeLink(dto.getYoutubeLink());
        item.setObservations(dto.getObservations());
        item.setPosition(dto.getPosition());
    }

    private void updateEventFlag(Long eventId) {
        Event event = eventRepository.findById(eventId).orElse(null);
        if (event != null) {
            long count = protocolRepository.findByEventIdOrderByPositionAscEventTimeAsc(eventId).size();
            event.setProtocolCompleted(count > 0);
            eventRepository.save(event);
        }
    }

    public ProtocolItemDto toDto(ProtocolItem p) {
        return ProtocolItemDto.builder()
                .id(p.getId())
                .eventId(p.getEvent().getId())
                .eventTime(p.getEventTime())
                .description(p.getDescription())
                .involvedPerson(p.getInvolvedPerson())
                .youtubeLink(p.getYoutubeLink())
                .observations(p.getObservations())
                .position(p.getPosition())
                .build();
    }
}
