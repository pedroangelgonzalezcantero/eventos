package com.salon.eventos.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RangoDto {
    private Long id;
    private Long eventoId;
    private Long personaId;
    private String personaDni;
    private String personaNombre;
    private String personaApellidos;
    private String personaNombreCompleto;
    private String personaPuesto;
    private String mesa;
    private String rango;
    private LocalDateTime createdAt;
}

