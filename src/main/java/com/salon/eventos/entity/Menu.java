package com.salon.eventos.entity;

import lombok.*;

import javax.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "menus")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = "event")
@ToString(exclude = "event")
public class Menu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Platos del menú
    @Column(columnDefinition = "TEXT")
    private String starters;    // Entrantes

    @Column(columnDefinition = "TEXT")
    private String firstCourse; // Primer plato

    @Column(columnDefinition = "TEXT")
    private String secondCourse; // Segundo plato

    @Column(columnDefinition = "TEXT")
    private String dessert;     // Postre

    @Column(columnDefinition = "TEXT")
    private String drinks;      // Bebidas

    @Column(columnDefinition = "TEXT")
    private String extras;      // Extras

    private BigDecimal pricePerPerson;

    // true si este es el menú seleccionado por el cliente
    @Builder.Default
    private boolean selected = false;

    // Variantes especiales dentro del menú
    @ElementCollection
    @CollectionTable(name = "menu_variants", joinColumns = @JoinColumn(name = "menu_id"))
    @Column(name = "variant_description", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> variants = new ArrayList<>();
}

