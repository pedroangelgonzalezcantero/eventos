package com.salon.eventos.service;

import com.salon.eventos.dto.FloorPlanDto;
import com.salon.eventos.entity.Event;
import com.salon.eventos.entity.FloorPlan;
import com.salon.eventos.repository.EventRepository;
import com.salon.eventos.repository.FloorPlanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class FloorPlanService {

    private static final List<String> ALLOWED_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/webp", "application/pdf"
    );
    private static final long MAX_SIZE = 20 * 1024 * 1024L; // 20 MB

    @Autowired private FloorPlanRepository repo;
    @Autowired private EventRepository     eventRepo;
    @PersistenceContext private EntityManager em;

    /** Sube o reemplaza el plano del evento */
    public FloorPlanDto upload(Long eventId, MultipartFile file) throws IOException {
        if (file.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo está vacío");

        // Normalizar el content-type (eliminar parámetros como ;charset=utf-8)
        String contentType = file.getContentType() != null
                ? file.getContentType().split(";")[0].trim().toLowerCase()
                : "";

        if (!ALLOWED_TYPES.contains(contentType))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Formato no permitido. Usa JPG, PNG, WEBP o PDF. Recibido: " + contentType);
        if (file.getSize() > MAX_SIZE)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El tamaño máximo permitido es 20 MB");

        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));

        // Reemplazar plano anterior si existe — flush forzado para evitar
        // violación de índice único (event_id) al hacer delete+insert en la misma transacción
        repo.findByEventId(eventId).ifPresent(existing -> {
            repo.delete(existing);
            em.flush();
        });

        FloorPlan plan = FloorPlan.builder()
                .event(event)
                .filename(file.getOriginalFilename())
                .contentType(contentType)          // guardamos el tipo normalizado
                .data(file.getBytes())
                .fileSize(file.getSize())
                .build();

        return toDto(repo.save(plan));
    }

    /** Obtiene los metadatos (sin binario) */
    public Optional<FloorPlanDto> getMeta(Long eventId) {
        return repo.findByEventId(eventId).map(this::toDto);
    }

    /** Obtiene el plano completo para streaming */
    public FloorPlan getRaw(Long eventId) {
        return repo.findByEventId(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plano no encontrado"));
    }

    /** Elimina el plano */
    public void delete(Long eventId) {
        if (!repo.findByEventId(eventId).isPresent())
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Plano no encontrado");
        repo.deleteByEventId(eventId);
    }

    private FloorPlanDto toDto(FloorPlan p) {
        return FloorPlanDto.builder()
                .id(p.getId())
                .eventId(p.getEvent().getId())
                .filename(p.getFilename())
                .contentType(p.getContentType())
                .fileSize(p.getFileSize())
                .createdAt(p.getCreatedAt())
                .build();
    }
}



