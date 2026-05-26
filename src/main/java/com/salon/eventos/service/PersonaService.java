package com.salon.eventos.service;

import com.salon.eventos.dto.PersonaDto;
import com.salon.eventos.entity.Persona;
import com.salon.eventos.repository.PersonaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PersonaService {

    @Autowired
    private PersonaRepository personaRepository;

    public List<PersonaDto> getAll() {
        return personaRepository.findAllByOrderByApellidosAscNombreAsc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public PersonaDto getById(Long id) {
        return toDto(personaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Persona no encontrada: " + id)));
    }

    public List<PersonaDto> search(String q) {
        if (q == null || q.trim().isEmpty()) return new ArrayList<>();
        return personaRepository.searchByTexto(q.trim())
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public PersonaDto create(PersonaDto dto) {
        if (personaRepository.existsByDniIgnoreCase(dto.getDni())) {
            throw new RuntimeException("Ya existe una persona con el DNI: " + dto.getDni());
        }
        Persona persona = Persona.builder()
                .dni(dto.getDni().toUpperCase().trim())
                .nombre(dto.getNombre().trim())
                .apellidos(dto.getApellidos().trim())
                .seguridadSocial(dto.getSeguridadSocial())
                .puesto(dto.getPuesto())
                .activo(true)
                .build();
        return toDto(personaRepository.save(persona));
    }

    public PersonaDto update(Long id, PersonaDto dto) {
        Persona persona = personaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Persona no encontrada: " + id));

        // Verificar DNI único si cambia
        if (!persona.getDni().equalsIgnoreCase(dto.getDni()) &&
            personaRepository.existsByDniIgnoreCase(dto.getDni())) {
            throw new RuntimeException("Ya existe otra persona con el DNI: " + dto.getDni());
        }

        persona.setDni(dto.getDni().toUpperCase().trim());
        persona.setNombre(dto.getNombre().trim());
        persona.setApellidos(dto.getApellidos().trim());
        persona.setSeguridadSocial(dto.getSeguridadSocial());
        persona.setPuesto(dto.getPuesto());
        return toDto(personaRepository.save(persona));
    }

    public PersonaDto toggleActivo(Long id) {
        Persona persona = personaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Persona no encontrada: " + id));
        persona.setActivo(!persona.isActivo());
        return toDto(personaRepository.save(persona));
    }

    public PersonaDto toDto(Persona p) {
        return PersonaDto.builder()
                .id(p.getId())
                .dni(p.getDni())
                .nombre(p.getNombre())
                .apellidos(p.getApellidos())
                .nombreCompleto(p.getNombre() + " " + p.getApellidos())
                .seguridadSocial(p.getSeguridadSocial())
                .puesto(p.getPuesto())
                .activo(p.isActivo())
                .createdAt(p.getCreatedAt())
                .build();
    }
}



