package com.salon.eventos.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InteractiveFloorPlanDto {
    private Long                  id;
    private Long                  eventId;
    private String                name;
    private List<FloorElementDto> elements;
    private Integer               canvasWidth;
    private Integer               canvasHeight;
    private LocalDateTime         createdAt;
    private LocalDateTime         updatedAt;
}

