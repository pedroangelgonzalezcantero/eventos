package com.salon.eventos.service;

import com.salon.eventos.dto.AltaDto;
import com.salon.eventos.entity.Alta;
import com.salon.eventos.repository.AltaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AltaService {

    @Autowired
    private AltaRepository altaRepository;

    public List<AltaDto> getByEvento(Long eventoId) {
        return altaRepository.findByEventoIdFetch(eventoId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<AltaDto> getByFechaRange(LocalDate from, LocalDate to) {
        return altaRepository.findByEventoFechaRange(from, to)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public AltaDto toDto(Alta a) {
        return AltaDto.builder()
                .id(a.getId())
                .eventoId(a.getEvento().getId())
                .eventoClientName(a.getEvento().getClientName())
                .eventoFecha(a.getEvento().getEventDate())
                .personaId(a.getPersona().getId())
                .personaDni(a.getPersona().getDni())
                .personaNombreCompleto(a.getPersona().getNombre() + " " + a.getPersona().getApellidos())
                .personaSeguridadSocial(a.getPersona().getSeguridadSocial())
                .personaPuesto(a.getPersona().getPuesto())
                .createdAt(a.getCreatedAt())
                .build();
    }
}

