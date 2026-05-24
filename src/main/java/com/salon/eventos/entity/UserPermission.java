package com.salon.eventos.entity;

import lombok.*;
import javax.persistence.*;

/**
 * Sobreescrituras individuales de permisos por usuario.
 * granted=true  → se añade aunque el rol no lo tenga
 * granted=false → se elimina aunque el rol sí lo tenga
 */
@Entity
@Table(name = "user_permissions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "permission_code"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "permission_code", nullable = false, length = 80)
    private String permissionCode;

    @Column(nullable = false)
    private boolean granted;
}

