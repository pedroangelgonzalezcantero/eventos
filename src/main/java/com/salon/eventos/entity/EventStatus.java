package com.salon.eventos.entity;

public enum EventStatus {
    BORRADOR("Borrador"),
    PENDIENTE_INFO("Pendiente de información"),
    EN_CURSO("En curso"),
    CONFIRMADO("Confirmado"),
    COMPLETADO("Completado"),
    CANCELADO("Cancelado");

    private final String label;

    EventStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}

