package com.salon.eventos.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderTemplateDto {
    private Long id;
    private Integer daysBeforeEvent;
    private String category;
    private String subject;
    private String messageTemplate;
    private String channel;
    private boolean active;
    private String description;
}

