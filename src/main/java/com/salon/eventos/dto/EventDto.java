package com.salon.eventos.dto;

import com.salon.eventos.entity.EventStatus;
import com.salon.eventos.entity.EventType;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventDto {
    private Long id;
    private String clientName;
    private EventType type;
    private String typeLabel;
    private LocalDate eventDate;
    private Integer estimatedGuests;
    private String venue;
    private String contactPerson;
    private String phone;
    private String email;
    private EventStatus status;
    private String statusLabel;
    private String clientUsername;
    private String notes;
    // Flags de completitud
    private boolean menuConfirmed;
    private boolean allergensCompleted;
    private boolean protocolCompleted;
    private boolean budgetSigned;
    // Bloqueo automático del protocolo (4 días antes del evento)
    private boolean protocolLocked;
    // Metadatos
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // Días restantes para el evento
    private long daysUntilEvent;
    // Personal asignado al evento
    private List<EventAssignmentDto> assignments;
}
