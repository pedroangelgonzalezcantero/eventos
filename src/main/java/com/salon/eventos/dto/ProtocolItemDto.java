package com.salon.eventos.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProtocolItemDto {
    private Long id;
    private Long eventId;
    private String eventTime;
    private String description;
    private String involvedPerson;
    private String youtubeLink;
    private String observations;
    private Integer position;
}

