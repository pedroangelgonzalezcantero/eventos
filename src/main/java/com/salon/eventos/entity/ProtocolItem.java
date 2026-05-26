package com.salon.eventos.entity;

import lombok.*;

import jakarta.persistence.*;

@Entity
@Table(name = "protocol_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = "event")
@ToString(exclude = "event")
public class ProtocolItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    // Hora del momento (HH:mm)
    @Column(length = 10)
    private String eventTime;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(length = 150)
    private String involvedPerson;

    // Enlace canción/vídeo para DJ
    @Column(length = 500)
    private String youtubeLink;

    @Column(columnDefinition = "TEXT")
    private String observations;

    // Orden de visualización
    private Integer position;
}

