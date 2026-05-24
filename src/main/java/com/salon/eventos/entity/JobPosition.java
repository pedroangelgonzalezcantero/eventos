package com.salon.eventos.entity;

import lombok.*;
import javax.persistence.*;

/**
 * Representa un puesto de trabajo (rol del salón).
 * Los permisos de cada puesto se almacenan en role_permissions usando el campo 'code' como 'role'.
 */
@Entity
@Table(name = "job_positions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Código único interno (ej: OFFICE, DJ, KITCHEN). Inmutable una vez creado. */
    @Column(unique = true, nullable = false, length = 50)
    private String code;

    /** Etiqueta visible al usuario (ej: "Sala / Metre") */
    @Column(nullable = false, length = 100)
    private String label;

    /** Descripción corta del puesto */
    @Column(length = 255)
    private String description;

    /** Nombre de icono Lucide (ej: "music-2", "chef-hat", "layers") */
    @Column(length = 50)
    private String icon;

    /** Clases Tailwind de color (ej: "bg-blue-100 text-blue-700 border-blue-200") */
    @Column(length = 150)
    private String color;

    /** El puesto del sistema no se puede eliminar (OFFICE, CLIENT, DJ, KITCHEN, FLOOR) */
    @Column(nullable = false)
    @Builder.Default
    private boolean system = false;

    /** Orden de aparición en listas */
    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 99;
}

