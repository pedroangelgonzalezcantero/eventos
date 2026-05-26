package com.salon.eventos.service;

import com.salon.eventos.dto.RangoDto;
import com.salon.eventos.entity.Event;
import com.salon.eventos.entity.Persona;
import com.salon.eventos.entity.Rango;
import com.salon.eventos.repository.AltaRepository;
import com.salon.eventos.repository.EventRepository;
import com.salon.eventos.repository.PersonaRepository;
import com.salon.eventos.repository.RangoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class RangoService {

    @Autowired private RangoRepository rangoRepository;
    @Autowired private EventRepository eventRepository;
    @Autowired private PersonaRepository personaRepository;
    @Autowired private AltaRepository altaRepository;

    public List<RangoDto> getByEvento(Long eventoId) {
        return rangoRepository.findByEventoIdOrderByMesaAscCreatedAtAsc(eventoId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    /**
     * Crea un nuevo rango y automáticamente registra el alta si no existe.
     * Usa ON CONFLICT DO NOTHING a nivel de BD — nunca habrá duplicados.
     */
    public RangoDto create(Long eventoId, Map<String, Object> body) {
        Event evento = eventRepository.findById(eventoId)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado: " + eventoId));
        Long personaId = Long.valueOf(body.get("personaId").toString());
        Persona persona = personaRepository.findById(personaId)
                .orElseThrow(() -> new RuntimeException("Persona no encontrada: " + personaId));

        Rango rango = Rango.builder()
                .evento(evento)
                .persona(persona)
                .mesa(body.getOrDefault("mesa", "").toString())
                .rango(body.getOrDefault("rango", "").toString())
                .build();
        Rango saved = rangoRepository.save(rango);

        // Alta automática — ON CONFLICT DO NOTHING garantiza sin duplicados
        altaRepository.insertOrIgnore(eventoId, personaId);

        return toDto(saved);
    }

    public RangoDto update(Long eventoId, Long rangoId, Map<String, Object> body) {
        Rango rango = rangoRepository.findById(rangoId)
                .orElseThrow(() -> new RuntimeException("Rango no encontrado: " + rangoId));
        if (!rango.getEvento().getId().equals(eventoId)) {
            throw new RuntimeException("El rango no pertenece a este evento");
        }

        // Si cambia la persona, actualizar FK y re-registrar alta
        if (body.containsKey("personaId")) {
            Long personaId = Long.valueOf(body.get("personaId").toString());
            Persona persona = personaRepository.findById(personaId)
                    .orElseThrow(() -> new RuntimeException("Persona no encontrada: " + personaId));
            rango.setPersona(persona);
            altaRepository.insertOrIgnore(eventoId, personaId);
        }

        if (body.containsKey("mesa"))  rango.setMesa(body.get("mesa").toString());
        if (body.containsKey("rango")) rango.setRango(body.get("rango").toString());

        return toDto(rangoRepository.save(rango));
    }

    public void delete(Long eventoId, Long rangoId) {
        if (!rangoRepository.existsByEventoIdAndId(eventoId, rangoId)) {
            throw new RuntimeException("Rango no encontrado");
        }
        rangoRepository.deleteByEventoIdAndId(eventoId, rangoId);
    }

    /**
     * Crea múltiples rangos de una vez (import desde Excel).
     * Ignora silenciosamente entradas con errores para no abortar todo el lote.
     */
    public List<RangoDto> batchCreate(Long eventoId, List<Map<String, Object>> items) {
        List<RangoDto> created = new ArrayList<>();
        for (Map<String, Object> item : items) {
            try {
                created.add(create(eventoId, item));
            } catch (Exception ignored) { }
        }
        return created;
    }

    public RangoDto toDto(Rango r) {
        Persona p = r.getPersona();
        return RangoDto.builder()
                .id(r.getId())
                .eventoId(r.getEvento().getId())
                .personaId(p.getId())
                .personaDni(p.getDni())
                .personaNombre(p.getNombre())
                .personaApellidos(p.getApellidos())
                .personaNombreCompleto(p.getNombre() + " " + p.getApellidos())
                .personaPuesto(p.getPuesto())
                .mesa(r.getMesa())
                .rango(r.getRango())
                .createdAt(r.getCreatedAt())
                .build();
    }
}



