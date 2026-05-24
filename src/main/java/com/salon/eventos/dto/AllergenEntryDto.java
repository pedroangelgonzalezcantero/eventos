package com.salon.eventos.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllergenEntryDto {
    private Long id;
    private Long eventId;
    private String guestName;
    private String tableNumber;
    private String allergies; // comma-separated
    private String diet;
    private String observations;
}

