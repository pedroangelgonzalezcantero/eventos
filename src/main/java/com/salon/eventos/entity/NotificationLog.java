package com.salon.eventos.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long eventId;

    private String eventClientName;

    @Enumerated(EnumType.STRING)
    private NotificationChannel channel;

    @Column(length = 200)
    private String recipient;

    @Column(columnDefinition = "TEXT")
    private String message;

    // SENT, FAILED, SIMULATED
    @Column(length = 20)
    @Builder.Default
    private String status = "SENT";

    private String errorMessage;

    @CreationTimestamp
    private LocalDateTime sentAt;
}

