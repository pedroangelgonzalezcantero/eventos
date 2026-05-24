package com.salon.eventos.entity;

import lombok.*;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reminders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = "event")
@ToString(exclude = "event")
public class Reminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    // Cuántos días antes del evento enviar
    private Integer daysBeforeEvent;

    @Enumerated(EnumType.STRING)
    private NotificationChannel channel;

    @Column(columnDefinition = "TEXT")
    private String messageTemplate;

    @Column(length = 100)
    private String subject;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private boolean sent = false;

    private LocalDateTime sentAt;

    // Categoría del recordatorio: MENU, ALERGENOS, PROTOCOLO, PAGO, GENERAL
    @Column(length = 50)
    private String category;
}

