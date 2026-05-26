package com.salon.eventos.entity;

import lombok.*;
import jakarta.persistence.*;

/**
 * Permisos por defecto que tiene cada rol.
 * Si no existe override en UserPermission, se usa esta tabla.
 */
@Entity
@Table(name = "role_permissions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"role", "permission_code"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RolePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String role;

    @Column(name = "permission_code", nullable = false, length = 80)
    private String permissionCode;
}

