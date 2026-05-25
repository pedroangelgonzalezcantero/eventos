package com.salon.eventos.dto;

import lombok.*;
import java.time.LocalDateTime;

/** Metadatos del plano (sin el binario) */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FloorPlanDto {
    private Long   id;
    private Long   eventId;
    private String filename;
    private String contentType;
    private Long   fileSize;
    private LocalDateTime createdAt;
}

