package com.salon.eventos.service;

import com.salon.eventos.dto.ReminderTemplateDto;
import com.salon.eventos.entity.NotificationChannel;
import com.salon.eventos.entity.ReminderTemplate;
import com.salon.eventos.repository.ReminderTemplateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReminderTemplateService {

    @Autowired
    private ReminderTemplateRepository repository;

    /** Inicializar plantillas por defecto si no existen */
    @PostConstruct
    public void initDefaultTemplates() {
        if (repository.count() == 0) {
            createDefault(15, "PROTOCOLO", NotificationChannel.EMAIL,
                    "Recuerda completar el protocolo de tu evento",
                    "Hola {cliente},\n\nFaltan {dias} días para tu {tipo} el {fecha}.\n\nNecesitamos que completes las canciones, momentos especiales y el orden del protocolo.\n\nAccede a tu portal: {portal}\n\nSalón de Celebraciones",
                    "Recordatorio protocolo — 15 días antes");
            createDefault(7, "PROTOCOLO", NotificationChannel.EMAIL,
                    "Tu protocolo aún no está completado",
                    "Hola {cliente},\n\nFaltan {dias} días para tu {tipo} el {fecha}.\n\nTu protocolo aún no está completado. Es importante que lo rellenes cuanto antes para que el equipo pueda preparar todos los detalles.\n\nAccede a tu portal: {portal}\n\nSalón de Celebraciones",
                    "Recordatorio protocolo — 7 días antes (prioritario)");
            createDefault(5, "PROTOCOLO", NotificationChannel.EMAIL,
                    "Quedan pocos días para completar el protocolo",
                    "Hola {cliente},\n\nFaltan {dias} días para tu {tipo} el {fecha}.\n\n⚠️ Quedan muy pocos días para que se cierre el acceso al protocolo. Por favor, complétalo hoy.\n\nAccede a tu portal: {portal}\n\nSalón de Celebraciones",
                    "Recordatorio protocolo — 5 días antes (importante)");
            createDefault(4, "PROTOCOLO", NotificationChannel.EMAIL,
                    "Hoy es el último día para modificar el protocolo",
                    "Hola {cliente},\n\nFaltan {dias} días para tu {tipo} el {fecha}.\n\n🔒 HOY es el último día para realizar cambios en el protocolo. A partir de mañana el sistema quedará bloqueado automáticamente.\n\nAccede a tu portal: {portal}\n\nSalón de Celebraciones",
                    "Último aviso protocolo — 4 días antes (cierre)");
            createDefault(30, "MENU", NotificationChannel.EMAIL,
                    "Pendiente: confirma el menú de tu evento",
                    "Hola {cliente},\n\nFaltan {dias} días para tu {tipo} el {fecha}.\n\nTu menú aún no ha sido confirmado. Por favor, accede al portal y selecciona el menú para tu celebración.\n\nAccede a tu portal: {portal}\n\nSalón de Celebraciones",
                    "Recordatorio menú — 30 días antes");
            createDefault(14, "MENU", NotificationChannel.EMAIL,
                    "Urgente: confirma el menú de tu evento",
                    "Hola {cliente},\n\nFaltan {dias} días para tu {tipo} el {fecha}.\n\nTu menú todavía no está confirmado y el tiempo se acaba. Por favor, selecciónalo a la mayor brevedad posible.\n\nAccede a tu portal: {portal}\n\nSalón de Celebraciones",
                    "Recordatorio menú — 14 días antes (urgente)");
            createDefault(21, "ALERGENOS", NotificationChannel.EMAIL,
                    "Recuerda registrar alérgenos e intolerancias",
                    "Hola {cliente},\n\nFaltan {dias} días para tu {tipo} el {fecha}.\n\nNo olvides registrar los invitados con alergias o dietas especiales en el portal. Esta información es esencial para la seguridad de tus invitados.\n\nAccede a tu portal: {portal}\n\nSalón de Celebraciones",
                    "Recordatorio alérgenos — 21 días antes");
            createDefault(7, "ALERGENOS", NotificationChannel.EMAIL,
                    "Urgente: alérgenos pendientes de registrar",
                    "Hola {cliente},\n\nFaltan {dias} días para tu {tipo} el {fecha}.\n\n⚠️ Los alérgenos de tus invitados aún no están registrados. La cocina necesita esta información urgentemente.\n\nAccede a tu portal: {portal}\n\nSalón de Celebraciones",
                    "Recordatorio alérgenos — 7 días antes (urgente)");
        }
    }

    private void createDefault(int days, String category, NotificationChannel channel,
                                String subject, String message, String description) {
        ReminderTemplate t = ReminderTemplate.builder()
                .daysBeforeEvent(days)
                .category(category)
                .channel(channel)
                .subject(subject)
                .messageTemplate(message)
                .description(description)
                .active(true)
                .build();
        repository.save(t);
    }

    public List<ReminderTemplateDto> getAll() {
        return repository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<ReminderTemplateDto> getActive() {
        return repository.findByActiveTrueOrderByDaysBeforeEventDesc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public ReminderTemplateDto getById(Long id) {
        return toDto(repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plantilla no encontrada: " + id)));
    }

    public ReminderTemplateDto create(ReminderTemplateDto dto) {
        ReminderTemplate t = fromDto(dto);
        return toDto(repository.save(t));
    }

    public ReminderTemplateDto update(Long id, ReminderTemplateDto dto) {
        ReminderTemplate t = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plantilla no encontrada: " + id));
        t.setDaysBeforeEvent(dto.getDaysBeforeEvent());
        t.setCategory(dto.getCategory());
        t.setSubject(dto.getSubject());
        t.setMessageTemplate(dto.getMessageTemplate());
        t.setChannel(NotificationChannel.valueOf(dto.getChannel()));
        t.setActive(dto.isActive());
        t.setDescription(dto.getDescription());
        return toDto(repository.save(t));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public List<ReminderTemplate> getActiveEntities() {
        return repository.findByActiveTrueOrderByDaysBeforeEventDesc();
    }

    private ReminderTemplate fromDto(ReminderTemplateDto dto) {
        return ReminderTemplate.builder()
                .daysBeforeEvent(dto.getDaysBeforeEvent())
                .category(dto.getCategory())
                .subject(dto.getSubject())
                .messageTemplate(dto.getMessageTemplate())
                .channel(dto.getChannel() != null ? NotificationChannel.valueOf(dto.getChannel()) : NotificationChannel.EMAIL)
                .active(dto.isActive())
                .description(dto.getDescription())
                .build();
    }

    private ReminderTemplateDto toDto(ReminderTemplate t) {
        return ReminderTemplateDto.builder()
                .id(t.getId())
                .daysBeforeEvent(t.getDaysBeforeEvent())
                .category(t.getCategory())
                .subject(t.getSubject())
                .messageTemplate(t.getMessageTemplate())
                .channel(t.getChannel() != null ? t.getChannel().name() : "EMAIL")
                .active(t.isActive())
                .description(t.getDescription())
                .build();
    }
}

