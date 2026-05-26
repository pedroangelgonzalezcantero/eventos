package com.salon.eventos.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FloorElementDto {
    private String  id;
    private String  type;      // "table" | "object"
    private String  shape;     // "round" | "rect" | "oval"
    private String  objType;   // "bar" | "dance" | "photo" | "stage" | "entrance" | "fountain"
    private Double  x;
    private Double  y;
    private Double  width;
    private Double  height;
    private Double  rotation;
    private String  label;
    private Integer capacity;
    private Boolean locked;
    private String  color;
}

