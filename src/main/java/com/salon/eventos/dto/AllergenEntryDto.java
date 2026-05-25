package com.salon.eventos.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllergenEntryDto {
    /** Igual a guestId — se mantiene por compatibilidad con el frontend existente */
    private Long id;
    /** Id del Guest (fuente canonical de datos) */
    private Long guestId;
    /** Id de la GuestTable a la que pertenece el invitado */
    private Long tableId;
    private Long eventId;
    private String guestName;
    /** Nombre de la mesa (antes tableNumber) */
    private String tableNumber;
    private String tableName;
    private String allergies; // comma-separated
    private String diet;
    private String observations;
}

