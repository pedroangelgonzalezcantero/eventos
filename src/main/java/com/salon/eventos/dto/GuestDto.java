package com.salon.eventos.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestDto {
    private Long id;
    private Long tableId;
    private String tableName;
    private String guestName;
    private String allergies;
    private String diet;
    private String observations;
    private boolean hasRestrictions;
}

