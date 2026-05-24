package com.salon.eventos.service;

import com.salon.eventos.dto.AllergenEntryDto;
import com.salon.eventos.entity.AllergenEntry;
import com.salon.eventos.entity.Event;
import com.salon.eventos.repository.AllergenEntryRepository;
import com.salon.eventos.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AllergenService {

    @Autowired
    private AllergenEntryRepository allergenRepository;

    @Autowired
    private EventRepository eventRepository;

    public List<AllergenEntryDto> getByEvent(Long eventId) {
        return allergenRepository.findByEventIdOrderByTableNumberAscGuestNameAsc(eventId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public AllergenEntryDto create(Long eventId, AllergenEntryDto dto) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado"));
        AllergenEntry entry = new AllergenEntry();
        entry.setEvent(event);
        fillEntry(entry, dto);
        AllergenEntryDto result = toDto(allergenRepository.save(entry));
        updateEventFlag(eventId);
        return result;
    }

    public AllergenEntryDto update(Long entryId, AllergenEntryDto dto) {
        AllergenEntry entry = allergenRepository.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Entrada no encontrada"));
        fillEntry(entry, dto);
        return toDto(allergenRepository.save(entry));
    }

    public void delete(Long entryId) {
        AllergenEntry entry = allergenRepository.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Entrada no encontrada"));
        Long eventId = entry.getEvent().getId();
        allergenRepository.deleteById(entryId);
        updateEventFlag(eventId);
    }

    private void fillEntry(AllergenEntry entry, AllergenEntryDto dto) {
        entry.setGuestName(dto.getGuestName());
        entry.setTableNumber(dto.getTableNumber());
        entry.setAllergies(dto.getAllergies());
        entry.setDiet(dto.getDiet());
        entry.setObservations(dto.getObservations());
    }

    private void updateEventFlag(Long eventId) {
        Event event = eventRepository.findById(eventId).orElse(null);
        if (event != null) {
            long count = allergenRepository.findByEventIdOrderByTableNumberAscGuestNameAsc(eventId).size();
            event.setAllergensCompleted(count > 0);
            eventRepository.save(event);
        }
    }

    public AllergenEntryDto toDto(AllergenEntry e) {
        return AllergenEntryDto.builder()
                .id(e.getId())
                .eventId(e.getEvent().getId())
                .guestName(e.getGuestName())
                .tableNumber(e.getTableNumber())
                .allergies(e.getAllergies())
                .diet(e.getDiet())
                .observations(e.getObservations())
                .build();
    }
}

