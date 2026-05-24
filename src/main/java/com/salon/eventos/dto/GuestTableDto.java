package com.salon.eventos.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestTableDto {
    private Long id;
    private Long eventId;
    private String name;
    private Integer capacity;
    private String notes;
    private Integer position;
    private List<GuestDto> guests;
    // Computed
    private int guestCount;
    private int allergiesCount;
}

