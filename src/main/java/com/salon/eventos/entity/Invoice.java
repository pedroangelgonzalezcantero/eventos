package com.salon.eventos.entity;

import lombok.*;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = {"event", "payments"})
@ToString(exclude = {"event", "payments"})
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false)
    private BigDecimal totalAmount;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Desglose de conceptos (JSON o texto libre)
    @Column(columnDefinition = "TEXT")
    private String breakdown;

    @Builder.Default
    private boolean signed = false;

    private LocalDateTime signedAt;

    // URL de la firma digital (imagen base64 o URL)
    @Column(columnDefinition = "TEXT")
    private String signatureData;

    @Column(length = 50)
    private String invoiceNumber;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();
}

