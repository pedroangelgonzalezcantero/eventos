package com.salon.eventos.dto;

import com.salon.eventos.entity.EventStatus;
import com.salon.eventos.entity.EventType;
import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventDto {
    private Long id;
    private String clientName;
    private LocalDate eventDate;
    private EventType type;
    private String typeLabel;
    private String typeColor;   // Color CSS para el calendario
    private EventStatus status;
    private String statusLabel;
    private String venue;
    private Integer estimatedGuests;
    private long daysUntilEvent;
    // Personal asignado
    private String djName;
    private String maitreName;
    // Flags de completitud
    private boolean protocolCompleted;
    private boolean menuConfirmed;
    private boolean allergensCompleted;
}

