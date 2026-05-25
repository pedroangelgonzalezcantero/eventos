package com.salon.eventos.service;

import com.salon.eventos.dto.AllergenEntryDto;
import com.salon.eventos.entity.Event;
import com.salon.eventos.entity.Guest;
import com.salon.eventos.repository.EventRepository;
import com.salon.eventos.repository.GuestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio de alérgenos.
 *
 * FUENTE ÚNICA DE VERDAD: la entidad {@link Guest}.
 * Los datos de alergia/dieta viven en la tabla {@code guests}.
 * La tabla {@code allergen_entries} ya no se utiliza para escritura.
 */
@Service
@Transactional
public class AllergenService {

    @Autowired
    private GuestRepository guestRepository;

    @Autowired
    private EventRepository eventRepository;

    /**
     * Devuelve TODOS los invitados del evento agrupables por mesa.
     * Se incluyen tanto invitados con restricciones como sin ellas,
     * para que la pantalla de Alérgenos pueda editar a cualquier invitado.
     */
    public List<AllergenEntryDto> getByEvent(Long eventId) {
        return guestRepository.findByEventId(eventId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Actualiza los campos de alergia/dieta/observaciones de un invitado.
     * El {@code guestId} coincide con el {@code id} de {@link AllergenEntryDto}
     * para mantener compatibilidad de API.
     */
    public AllergenEntryDto update(Long guestId, AllergenEntryDto dto) {
        Guest guest = guestRepository.findById(guestId)
                .orElseThrow(() -> new RuntimeException("Invitado no encontrado: " + guestId));
        guest.setAllergies(dto.getAllergies());
        guest.setDiet(dto.getDiet());
        guest.setObservations(dto.getObservations());
        Guest saved = guestRepository.save(guest);
        updateEventFlag(saved.getTable().getEvent().getId());
        return toDto(saved);
    }

    /**
     * Limpia las restricciones alimentarias de un invitado (NO lo elimina de la mesa).
     */
    public void delete(Long guestId) {
        Guest guest = guestRepository.findById(guestId)
                .orElseThrow(() -> new RuntimeException("Invitado no encontrado: " + guestId));
        Long eventId = guest.getTable().getEvent().getId();
        guest.setAllergies(null);
        guest.setDiet(null);
        guest.setObservations(null);
        guestRepository.save(guest);
        updateEventFlag(eventId);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void updateEventFlag(Long eventId) {
        Event event = eventRepository.findById(eventId).orElse(null);
        if (event == null) return;
        boolean hasRestrictions = guestRepository.findByEventId(eventId)
                .stream()
                .anyMatch(this::hasRestriction);
        event.setAllergensCompleted(hasRestrictions);
        eventRepository.save(event);
    }

    private boolean hasRestriction(Guest g) {
        return (g.getAllergies() != null && !g.getAllergies().trim().isEmpty())
                || (g.getDiet() != null && !g.getDiet().trim().isEmpty());
    }

    public AllergenEntryDto toDto(Guest g) {
        return AllergenEntryDto.builder()
                .id(g.getId())
                .guestId(g.getId())
                .tableId(g.getTable().getId())
                .eventId(g.getTable().getEvent().getId())
                .guestName(g.getGuestName())
                .tableNumber(g.getTable().getName())
                .tableName(g.getTable().getName())
                .allergies(g.getAllergies())
                .diet(g.getDiet())
                .observations(g.getObservations())
                .build();
    }
}
