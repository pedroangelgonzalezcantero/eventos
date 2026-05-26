package com.salon.eventos.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "floor_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = "event")
@ToString(exclude = "event")
public class FloorPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false, length = 255)
    private String filename;

    @Column(nullable = false, length = 100)
    private String contentType;

    /** Fichero binario — Hibernate lo mapea a bytea (PostgreSQL) o binary (H2) */
    @Column(name = "data", nullable = false)
    private byte[] data;

    private Long fileSize;

    @CreationTimestamp
    private LocalDateTime createdAt;
}



