package com.salon.eventos.entity;

import lombok.*;

import javax.persistence.*;

@Entity
@Table(name = "allergen_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = "event")
@ToString(exclude = "event")
public class AllergenEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false, length = 150)
    private String guestName;

    @Column(length = 50)
    private String tableNumber;

    // Alergias separadas por coma: GLUTEN,LACTEOS,FRUTOS_SECOS,...
    @Column(columnDefinition = "TEXT")
    private String allergies;

    @Column(columnDefinition = "TEXT")
    private String observations;

    // Tipo de dieta especial
    @Column(length = 50)
    private String diet; // VEGETARIANO, VEGANO, HALAL, KOSHER, etc.
}

