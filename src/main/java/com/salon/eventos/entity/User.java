package com.salon.eventos.entity;

import lombok.*;
import jakarta.persistence.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(length = 150)
    private String email;

    @Column(length = 100)
    private String nombre;

    /** Código del puesto de trabajo (ej: OFFICE, DJ, KITCHEN, FLOOR, CLIENT) */
    @Column(nullable = false, length = 50)
    private String role;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    // Para clientes: referencia al evento asociado (no guardamos en User, lo gestionamos desde Event)
}
