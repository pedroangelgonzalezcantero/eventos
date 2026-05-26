package com.salon.eventos.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interactive_floor_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = "event")
@ToString(exclude = "event")
public class InteractiveFloorPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false, length = 255)
    @Builder.Default
    private String name = "Plano interactivo";

    /** Array de elementos serializado como JSON */
    @Column(nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String elements = "[]";

    @Column(nullable = false)
    @Builder.Default
    private Integer canvasWidth = 1200;

    @Column(nullable = false)
    @Builder.Default
    private Integer canvasHeight = 800;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

