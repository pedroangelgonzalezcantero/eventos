package com.salon.eventos.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonaDto {
    private Long id;
    private String dni;
    private String nombre;
    private String apellidos;
    private String nombreCompleto;  // nombre + " " + apellidos
    private String seguridadSocial;
    private String puesto;
    private boolean activo;
    private LocalDateTime createdAt;
}

