package com.salon.eventos.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Fecha de la cita */
    @Column(nullable = false)
    private LocalDate appointmentDate;

    /** Hora de inicio */
    @Column(nullable = false)
    private LocalTime startTime;

    /** Hora de finalización (opcional) */
    private LocalTime endTime;

    /** Nombre del cliente que llama */
    @Column(nullable = false, length = 150)
    private String clientName;

    /** Teléfono de contacto */
    @Column(length = 20)
    private String phone;

    /** Trabajadora asignada */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private User worker;

    /** Observaciones / notas */
    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.PENDIENTE;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

