package com.salon.eventos.entity;

public enum EventType {
    BODA("Boda"),
    COMUNION("Comunión"),
    BAUTIZO("Bautizo"),
    CUMPLEANOS("Cumpleaños"),
    ANIVERSARIO("Aniversario"),
    EMPRESA("Evento de empresa"),
    PRIVADO("Evento privado"),
    OTRO("Otro");

    private final String label;

    EventType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}

