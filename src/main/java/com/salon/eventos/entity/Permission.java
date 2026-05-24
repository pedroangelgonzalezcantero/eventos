package com.salon.eventos.entity;

import lombok.*;
import javax.persistence.*;

@Entity
@Table(name = "permissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 80)
    private String code;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(nullable = false, length = 150)
    private String label;

    @Column(length = 300)
    private String description;
}

