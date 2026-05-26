package com.salon.eventos.dto;

import com.salon.eventos.entity.EventType;
import lombok.Data;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Data
public class EventCreateRequest {

    @NotBlank(message = "El nombre del cliente es obligatorio")
    private String clientName;

    @NotNull(message = "El tipo de evento es obligatorio")
    private EventType type;

    @NotNull(message = "La fecha del evento es obligatoria")
    @Future(message = "La fecha debe ser futura")
    private LocalDate eventDate;

    @Min(value = 1, message = "Debe haber al menos 1 invitado")
    private Integer estimatedGuests;

    private String venue;
    private String contactPerson;

    @Pattern(regexp = "^[+0-9\\s\\-()]{6,20}$", message = "Teléfono inválido")
    private String phone;

    @Email(message = "Email inválido")
    private String email;

    private String notes;
}

