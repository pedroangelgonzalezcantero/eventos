package com.salon.eventos.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "altas",
    uniqueConstraints = @UniqueConstraint(columnNames = {"evento_id", "persona_id"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"evento", "persona"})
@EqualsAndHashCode(exclude = {"evento", "persona"})
public class Alta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", nullable = false)
    private Event evento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "persona_id", nullable = false)
    private Persona persona;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}

