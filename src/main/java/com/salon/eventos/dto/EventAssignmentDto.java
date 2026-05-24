package com.salon.eventos.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventAssignmentDto {
    private Long id;
    private Long userId;
    private String username;
    private String nombre;
    private String role;
    private LocalDateTime assignedAt;
}

