package com.salon.eventos.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AltaDto {
    private Long id;
    private Long eventoId;
    private String eventoClientName;
    private LocalDate eventoFecha;
    private Long personaId;
    private String personaDni;
    private String personaNombreCompleto;
    private String personaSeguridadSocial;
    private String personaPuesto;
    private LocalDateTime createdAt;
}

