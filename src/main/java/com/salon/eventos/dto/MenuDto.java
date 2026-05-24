package com.salon.eventos.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuDto {
    private Long id;
    private Long eventId;
    private String name;
    private String description;
    private String starters;
    private String firstCourse;
    private String secondCourse;
    private String dessert;
    private String drinks;
    private String extras;
    private BigDecimal pricePerPerson;
    private boolean selected;
    private List<String> variants;
}

