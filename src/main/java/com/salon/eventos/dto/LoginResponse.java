package com.salon.eventos.dto;

import lombok.*;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String nombre;
    private String role;
    private Long eventId; // Solo para clientes
    private Set<String> permissions;
}
