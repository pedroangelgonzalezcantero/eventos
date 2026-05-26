package com.salon.eventos.entity;

import lombok.*;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = "invoice")
@ToString(exclude = "invoice")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(nullable = false)
    private BigDecimal amount;

    private LocalDate paymentDate;

    @Column(length = 200)
    private String description;

    // PENDIENTE, PAGADO, PARCIAL
    @Column(length = 20)
    @Builder.Default
    private String status = "PENDIENTE";

    // Método de pago: TRANSFERENCIA, EFECTIVO, TARJETA, etc.
    @Column(length = 50)
    private String method;
}

