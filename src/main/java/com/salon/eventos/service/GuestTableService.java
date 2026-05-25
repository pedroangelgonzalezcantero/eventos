package com.salon.eventos.service;

import com.salon.eventos.dto.GuestDto;
import com.salon.eventos.dto.GuestTableDto;
import com.salon.eventos.entity.Event;
import com.salon.eventos.entity.Guest;
import com.salon.eventos.entity.GuestTable;
import com.salon.eventos.repository.EventRepository;
import com.salon.eventos.repository.GuestRepository;
import com.salon.eventos.repository.GuestTableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class GuestTableService {

    @Autowired
    private GuestTableRepository tableRepo;

    @Autowired
    private GuestRepository guestRepo;

    @Autowired
    private EventRepository eventRepo;

    // ─── MESAS ───────────────────────────────────────────────────────────────

    public List<GuestTableDto> getTablesForEvent(Long eventId) {
        return tableRepo.findByEventIdOrderByPositionAscNameAsc(eventId)
                .stream().map(this::toTableDto).collect(Collectors.toList());
    }

    public GuestTableDto createTable(Long eventId, GuestTableDto dto) {
        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado: " + eventId));
        GuestTable table = GuestTable.builder()
                .event(event)
                .name(dto.getName())
                .capacity(dto.getCapacity())
                .notes(dto.getNotes())
                .position(dto.getPosition() != null ? dto.getPosition() : (int) tableRepo.count() + 1)
                .build();
        return toTableDto(tableRepo.save(table));
    }

    public GuestTableDto updateTable(Long tableId, GuestTableDto dto) {
        GuestTable table = tableRepo.findById(tableId)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada: " + tableId));
        table.setName(dto.getName());
        table.setCapacity(dto.getCapacity());
        table.setNotes(dto.getNotes());
        if (dto.getPosition() != null) table.setPosition(dto.getPosition());
        return toTableDto(tableRepo.save(table));
    }

    public void deleteTable(Long tableId) {
        tableRepo.deleteById(tableId);
    }

    // ─── INVITADOS ────────────────────────────────────────────────────────────

    public List<GuestDto> getGuestsForTable(Long tableId) {
        return guestRepo.findByTableIdOrderByGuestNameAsc(tableId)
                .stream().map(this::toGuestDto).collect(Collectors.toList());
    }

    public List<GuestDto> getAllGuestsForEvent(Long eventId) {
        return guestRepo.findByEventId(eventId)
                .stream().map(this::toGuestDto).collect(Collectors.toList());
    }

    public GuestDto addGuest(Long tableId, GuestDto dto) {
        GuestTable table = tableRepo.findById(tableId)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada: " + tableId));
        Guest guest = Guest.builder()
                .table(table)
                .guestName(dto.getGuestName())
                .allergies(dto.getAllergies())
                .diet(dto.getDiet())
                .observations(dto.getObservations())
                .build();
        Guest saved = guestRepo.save(guest);
        updateAllergenFlag(table.getEvent().getId());
        return toGuestDto(saved);
    }

    public GuestDto updateGuest(Long guestId, GuestDto dto) {
        Guest guest = guestRepo.findById(guestId)
                .orElseThrow(() -> new RuntimeException("Invitado no encontrado: " + guestId));
        guest.setGuestName(dto.getGuestName());
        guest.setAllergies(dto.getAllergies());
        guest.setDiet(dto.getDiet());
        guest.setObservations(dto.getObservations());
        Guest saved = guestRepo.save(guest);
        updateAllergenFlag(saved.getTable().getEvent().getId());
        return toGuestDto(saved);
    }

    /** Mueve un invitado a otra mesa */
    public GuestDto moveGuest(Long guestId, Long targetTableId) {
        Guest guest = guestRepo.findById(guestId)
                .orElseThrow(() -> new RuntimeException("Invitado no encontrado: " + guestId));
        GuestTable target = tableRepo.findById(targetTableId)
                .orElseThrow(() -> new RuntimeException("Mesa destino no encontrada: " + targetTableId));
        guest.setTable(target);
        return toGuestDto(guestRepo.save(guest));
    }

    public void deleteGuest(Long guestId) {
        Guest guest = guestRepo.findById(guestId)
                .orElseThrow(() -> new RuntimeException("Invitado no encontrado: " + guestId));
        Long eventId = guest.getTable().getEvent().getId();
        guestRepo.deleteById(guestId);
        updateAllergenFlag(eventId);
    }

    /** Sincroniza el flag allergensCompleted del evento basándose en los guests */
    private void updateAllergenFlag(Long eventId) {
        Event event = eventRepo.findById(eventId).orElse(null);
        if (event == null) return;
        boolean hasRestrictions = guestRepo.findByEventId(eventId).stream().anyMatch(g ->
                (g.getAllergies() != null && !g.getAllergies().trim().isEmpty())
                || (g.getDiet() != null && !g.getDiet().trim().isEmpty()));
        event.setAllergensCompleted(hasRestrictions);
        eventRepo.save(event);
    }

    // ─── MAPPERS ─────────────────────────────────────────────────────────────

    public GuestTableDto toTableDto(GuestTable t) {
        List<GuestDto> guests = t.getGuests() != null
                ? t.getGuests().stream().map(this::toGuestDto).collect(Collectors.toList())
                : guestRepo.findByTableIdOrderByGuestNameAsc(t.getId())
                        .stream().map(this::toGuestDto).collect(Collectors.toList());
        long allergiesCount = guests.stream().filter(GuestDto::isHasRestrictions).count();
        return GuestTableDto.builder()
                .id(t.getId())
                .eventId(t.getEvent().getId())
                .name(t.getName())
                .capacity(t.getCapacity())
                .notes(t.getNotes())
                .position(t.getPosition())
                .guests(guests)
                .guestCount(guests.size())
                .allergiesCount((int) allergiesCount)
                .build();
    }

    public GuestDto toGuestDto(Guest g) {
        boolean hasRestrictions = (g.getAllergies() != null && !g.getAllergies().trim().isEmpty())
                || (g.getDiet() != null && !g.getDiet().trim().isEmpty());
        return GuestDto.builder()
                .id(g.getId())
                .tableId(g.getTable().getId())
                .tableName(g.getTable().getName())
                .guestName(g.getGuestName())
                .allergies(g.getAllergies())
                .diet(g.getDiet())
                .observations(g.getObservations())
                .hasRestrictions(hasRestrictions)
                .build();
    }
}

