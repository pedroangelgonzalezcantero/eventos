package com.salon.eventos.entity;

/**
 * @deprecated Reemplazado por JobPosition. Los roles ahora son Strings.
 * Este enum se mantiene únicamente por compatibilidad con migraciones de datos legacy.
 */
@Deprecated
public enum UserRole {
    OFFICE, KITCHEN, DJ, FLOOR, CLIENT
}
