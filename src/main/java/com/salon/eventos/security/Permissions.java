package com.salon.eventos.security;

/**
 * Catálogo centralizado de códigos de permiso.
 * Usado tanto para seed de BD como para @PreAuthorize("hasAuthority('...')")
 */
public final class Permissions {
    private Permissions() {}

    // Eventos
    public static final String EVENTS_VIEW_ALL       = "EVENTS_VIEW_ALL";
    public static final String EVENTS_VIEW_ASSIGNED  = "EVENTS_VIEW_ASSIGNED";
    public static final String EVENTS_CREATE         = "EVENTS_CREATE";
    public static final String EVENTS_EDIT           = "EVENTS_EDIT";
    public static final String EVENTS_DELETE         = "EVENTS_DELETE";

    // Mesas
    public static final String TABLES_VIEW           = "TABLES_VIEW";
    public static final String TABLES_CREATE         = "TABLES_CREATE";
    public static final String TABLES_EDIT           = "TABLES_EDIT";
    public static final String TABLES_DELETE         = "TABLES_DELETE";

    // Invitados
    public static final String GUESTS_VIEW           = "GUESTS_VIEW";
    public static final String GUESTS_CREATE         = "GUESTS_CREATE";
    public static final String GUESTS_EDIT           = "GUESTS_EDIT";
    public static final String GUESTS_DELETE         = "GUESTS_DELETE";

    // Protocolo
    public static final String PROTOCOL_VIEW         = "PROTOCOL_VIEW";
    public static final String PROTOCOL_EDIT         = "PROTOCOL_EDIT";
    public static final String PROTOCOL_LOCK         = "PROTOCOL_LOCK";

    // Facturación
    public static final String INVOICES_VIEW         = "INVOICES_VIEW";
    public static final String INVOICES_EDIT         = "INVOICES_EDIT";
    public static final String PAYMENTS_VIEW         = "PAYMENTS_VIEW";

    // Menús
    public static final String MENUS_VIEW            = "MENUS_VIEW";
    public static final String MENUS_EDIT            = "MENUS_EDIT";

    // Alergias
    public static final String ALLERGENS_VIEW        = "ALLERGENS_VIEW";
    public static final String ALLERGENS_EDIT        = "ALLERGENS_EDIT";

    // Usuarios
    public static final String USERS_VIEW            = "USERS_VIEW";
    public static final String USERS_CREATE          = "USERS_CREATE";
    public static final String USERS_EDIT            = "USERS_EDIT";
    public static final String USERS_DELETE          = "USERS_DELETE";
    public static final String USERS_MANAGE_PERMS    = "USERS_MANAGE_PERMS";

    // Dashboard
    public static final String DASHBOARD_VIEW        = "DASHBOARD_VIEW";

    // Exportación PDF
    public static final String PDF_PROTOCOL          = "PDF_PROTOCOL";
    public static final String PDF_TABLES            = "PDF_TABLES";
    public static final String PDF_ALLERGENS         = "PDF_ALLERGENS";
    public static final String PDF_MENUS             = "PDF_MENUS";
    public static final String PDF_INVOICES          = "PDF_INVOICES";
}

