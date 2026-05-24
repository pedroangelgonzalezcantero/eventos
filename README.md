# Salon de Celebraciones - Sistema de Gestion de Eventos

Plataforma web full-stack para gestionar eventos (bodas, comuniones, bautizos, etc.)
con portal de cliente, panel interno por departamento y recordatorios automaticos.

---

## NUEVAS FUNCIONALIDADES (v2.0)

### 1. Bloqueo automatico del protocolo
- El protocolo se bloquea 4 dias antes del evento para el rol CLIENT
- OFFICE siempre puede editar (sin restriccion)
- Banner premium en el portal del cliente
- API devuelve HTTP 423 Locked si cliente intenta modificar tras el bloqueo

### 2. Recordatorios automaticos configurables
- 8 plantillas predeterminadas al arrancar (protocolo 15d/7d/5d/4d, menu 30d/14d, alergenos 21d/7d)
- Panel admin `/admin/automatizaciones` para CRUD completo
- Variables en mensajes: {cliente}, {dias}, {tipo}, {fecha}, {portal}
- Canales: Email, SMS, WhatsApp

### 3. Calendario visual de eventos
- Ruta: `/admin/calendario`
- Vistas: Mensual, Semanal, Agenda
- Colores por tipo de evento
- Filtros por tipo, estado, DJ, maitre

### 4. Base de datos real (PostgreSQL)
- Dev: H2 embebida sin cambios
- Prod: PostgreSQL + Flyway (activar con --spring.profiles.active=prod)
- Docker: `docker-compose up -d` levanta PostgreSQL local
- Migracion inicial: src/main/resources/db/migration/V1__init_schema.sql

### 5. Sistema de mesas e invitados
- Crear mesas con nombre, capacidad y observaciones
- Añadir invitados a cada mesa con alergias y dietas
- Drag & drop para mover invitados entre mesas
- Indicadores de ocupacion y alergias
- Tab "Mesas" en el portal del cliente
- El maitre (FloorView) ve mesas + invitados + alergenos en tabs dedicados

### 6. Permisos por rol
- OFFICE: acceso completo incluyendo calendario y automatizaciones
- CLIENT: protocolo (bloqueado 4 dias antes), mesas, alergenos, menu, facturacion
- FLOOR: timing, mesas, alergenos (solo lectura)
- KITCHEN: alergenos, menu (solo lectura)
- DJ: protocolo, timing (solo lectura)

---

## Inicio rapido

### Backend
```bash
mvn spring-boot:run
# Con PostgreSQL en produccion:
docker-compose up -d
java -jar target/eventos-1.0.0.jar --spring.profiles.active=prod
```

### Frontend
```bash
cd frontend && npm install && npm run dev
```

## Stack Tecnologico

- **Backend**: Spring Boot 2.7 (Java 8) + H2/PostgreSQL + JWT
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Notificaciones**: Email (SMTP) + SMS/WhatsApp (Twilio)

---

## Inicio rapido (Desarrollo)

### 1. Backend (Spring Boot)

```bash
mvn spring-boot:run
```

- API: http://localhost:8080
- H2 Console: http://localhost:8080/h2-console
  - URL: `jdbc:h2:file:./data/eventosdb`
  - User: `sa` / Password: `eventos2024`

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173

---

## Usuarios por defecto

| Usuario | Contrasena | Rol | Acceso |
|---------|-----------|-----|--------|
| `admin` | `admin123` | Oficina | Gestion completa |
| `cocina` | `cocina123` | Cocina | Menus y alergenos |
| `dj` | `dj123` | DJ | Protocolo y canciones |
| `sala` | `sala123` | Sala | Timing y mesas |

Los **clientes** reciben su usuario/contrasena al crear el evento desde el panel de oficina.

---

## Estructura del proyecto

```
Eventos/
├── pom.xml                          # Maven - Spring Boot
├── src/main/java/com/salon/eventos/
│   ├── entity/                      # Entidades JPA
│   ├── repository/                  # Repositorios Spring Data
│   ├── service/                     # Logica de negocio
│   ├── controller/                  # API REST
│   ├── security/                    # JWT + Spring Security
│   └── config/                      # Configuracion
├── src/main/resources/
│   └── application.properties
└── frontend/                        # React + Vite + Tailwind
    └── src/
        ├── pages/admin/             # Panel de oficina/departamentos
        ├── pages/client/            # Portal del cliente
        ├── components/              # Componentes reutilizables
        ├── context/                 # AuthContext (JWT)
        └── api/axios.js             # Cliente HTTP
```

---

## API REST

### Autenticacion
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/auth/login` | Login → JWT token |

### Eventos
| Metodo | Ruta | Rol |
|--------|------|-----|
| GET | `/api/events` | OFFICE, KITCHEN, DJ, FLOOR |
| POST | `/api/events` | OFFICE |
| PUT | `/api/events/{id}` | OFFICE |
| PATCH | `/api/events/{id}/status` | OFFICE |
| GET | `/api/events/mi-evento` | CLIENT |

### Menus, Alergenos, Protocolo, Facturacion
Rutas anidadas bajo `/api/events/{eventId}/...`

---

## Configuracion de produccion

### Variables de entorno recomendadas

```properties
# PostgreSQL
DB_USER=postgres
DB_PASSWORD=...

# Email SMTP
MAIL_USERNAME=noreply@tusalon.com
MAIL_PASSWORD=...

# Twilio (SMS/WhatsApp)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_PHONE=+34600000000
TWILIO_FROM_WHATSAPP=whatsapp:+14155238886

# App
APP_BASE_URL=https://tusalon.com
ADMIN_PASSWORD=contrasena_segura
```

### Recordatorios automaticos

El scheduler se ejecuta cada dia a las 9:00 AM y envia recordatorios automaticamente cuando:
- Faltan 30 dias → Recordatorio general
- Faltan 30/14 dias → Menu no confirmado
- Faltan 21/7 dias → Alergenos no registrados
- Faltan 15/7 dias → Protocolo no completo

