package com.salon.eventos.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "guest_tables")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = {"event", "guests"})
@ToString(exclude = {"event", "guests"})
public class GuestTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false, length = 100)
    private String name;

    // Capacidad máxima de la mesa
    private Integer capacity;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // Orden visual
    private Integer position;

    @OneToMany(mappedBy = "table", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("guestName ASC")
    @Builder.Default
    private List<Guest> guests = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;
}

