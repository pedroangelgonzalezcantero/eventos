package com.salon.eventos.dto;

import com.salon.eventos.entity.AppointmentStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDto {
    private Long id;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String clientName;
    private String phone;
    private Long workerId;
    private String workerName;
    private String workerUsername;
    private String notes;
    private AppointmentStatus status;
    private String statusLabel;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

