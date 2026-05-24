package com.salon.eventos.entity;

import lombok.*;
import javax.persistence.*;

@Entity
@Table(name = "reminder_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReminderTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Días antes del evento en que se envía
    @Column(nullable = false)
    private Integer daysBeforeEvent;

    // Categoría: PROTOCOLO, MENU, ALERGENOS, GENERAL
    @Column(nullable = false, length = 50)
    private String category;

    @Column(length = 200)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String messageTemplate;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    @Builder.Default
    private NotificationChannel channel = NotificationChannel.EMAIL;

    @Builder.Default
    private boolean active = true;

    // Descripción legible para el panel de admin
    @Column(length = 300)
    private String description;
}

