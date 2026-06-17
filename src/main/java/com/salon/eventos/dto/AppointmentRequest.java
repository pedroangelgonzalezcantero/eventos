package com.salon.eventos.dto;

import com.salon.eventos.entity.AppointmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AppointmentRequest {

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate appointmentDate;

    @NotNull(message = "La hora de inicio es obligatoria")
    private LocalTime startTime;

    /** Opcional — si se omite se asume +1 hora a efectos de solapamiento */
    private LocalTime endTime;

    @NotBlank(message = "El nombre del cliente es obligatorio")
    private String clientName;

    private String phone;

    @NotNull(message = "Debes asignar una trabajadora")
    private Long workerId;

    private String notes;

    /** Si no se envía se usará PENDIENTE */
    private AppointmentStatus status;
}

