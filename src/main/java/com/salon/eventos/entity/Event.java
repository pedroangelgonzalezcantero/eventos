package com.salon.eventos.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = {"menus", "allergenEntries", "protocolItems", "invoice", "reminders", "guestTables"})
@ToString(exclude = {"menus", "allergenEntries", "protocolItems", "invoice", "reminders", "guestTables"})
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String clientName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType type;

    @Column(nullable = false)
    private LocalDate eventDate;

    private Integer estimatedGuests;

    @Column(length = 200)
    private String venue;

    @Column(length = 150)
    private String contactPerson;

    @Column(length = 20)
    private String phone;

    @Column(length = 150)
    private String email;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private EventStatus status = EventStatus.PENDIENTE_INFO;

    // Usuario cliente para acceso al portal
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "client_user_id")
    private User clientUser;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // Menús disponibles para este evento
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Menu> menus = new ArrayList<>();

    // Entradas de alérgenos/dietas
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AllergenEntry> allergenEntries = new ArrayList<>();

    // Protocolo / timeline
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("position ASC, eventTime ASC")
    @Builder.Default
    private List<ProtocolItem> protocolItems = new ArrayList<>();

    // Facturación
    @OneToOne(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private Invoice invoice;

    // Recordatorios configurados
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Reminder> reminders = new ArrayList<>();

    // Mesas e invitados
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("position ASC, name ASC")
    @Builder.Default
    private List<GuestTable> guestTables = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Flags de completitud
    private boolean menuConfirmed = false;
    private boolean allergensCompleted = false;
    private boolean protocolCompleted = false;
    private boolean budgetSigned = false;
}

