package com.salon.eventos.entity;

import lombok.*;

import jakarta.persistence.*;

@Entity
@Table(name = "guests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = "table")
@ToString(exclude = "table")
public class Guest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", nullable = false)
    private GuestTable table;

    @Column(nullable = false, length = 150)
    private String guestName;

    // Alergias separadas por coma: GLUTEN,LACTEOS,...
    @Column(columnDefinition = "TEXT")
    private String allergies;

    // Dieta especial: VEGETARIANO, VEGANO, HALAL, etc.
    @Column(length = 50)
    private String diet;

    @Column(columnDefinition = "TEXT")
    private String observations;
}

