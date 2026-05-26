# Salón de Celebraciones — Sistema de Gestión de Eventos

Plataforma web full-stack para gestionar eventos (bodas, comuniones, bautizos, etc.)
con portal de cliente, panel interno por departamento y recordatorios automáticos.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Backend** | Java 21 · Spring Boot 3.3.5 · Spring Security 6.3 · Hibernate 6.5 |
| **Base de datos** | PostgreSQL 16 (producción) · H2 (desarrollo local) |
| **Migraciones** | Flyway 10 |
| **Auth** | JWT (jjwt 0.12.6) + BCrypt |
| **Frontend** | React 19 + Vite 8 + Tailwind CSS 3 |
| **Canvas / Editor** | react-konva + Konva.js |
| **Estado global** | Zustand |
| **PDFs** | @react-pdf/renderer |
| **Notificaciones** | Email (SMTP) · SMS/WhatsApp (Twilio) |

---

## Requisitos

| Herramienta | Versión mínima |
|-------------|---------------|
| **JDK** | 21 ([Eclipse Temurin 21](https://adoptium.net)) |
| **Maven** | 3.9+ |
| **Node.js** | 18+ |
| **Docker** | 24+ (para PostgreSQL en desarrollo) |

> **Nota:** Mientras se instala JDK 21, el código compila con JDK 17 usando
> `mvn package -Dmaven.compiler.release=17`. Cuando tengas JDK 21 simplemente
> establece `JAVA_HOME` y compila con normalidad.

---

## Inicio rápido

### 1. Base de datos (Docker)

```bash
docker-compose up -d
```

Levanta PostgreSQL en `localhost:5432` y pgAdmin en `localhost:5050`.
Flyway aplica las migraciones automáticamente al arrancar el backend.

### 2. Backend (Spring Boot 3 / Java 21)

```bash
# Compilar y empaquetar
mvn clean package -DskipTests

# Arrancar
java -jar target/eventos-1.0.0.jar
```

- API REST: http://localhost:8080
- H2 Console (dev): http://localhost:8080/h2-console

Con Maven directamente:
```bash
mvn spring-boot:run
```

### 3. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173

---

## Usuarios por defecto

| Usuario | Contraseña | Rol      | Acceso |
|---------|-----------|----------|--------|
| `admin` | `admin123` | Oficina  | Gestión completa |
| `cocina`| `cocina123`| Cocina   | Menús y alérgenos |
| `dj`    | `dj123`    | DJ       | Protocolo y canciones |
| `sala`  | `sala123`  | Sala     | Timing y mesas |

Los **clientes** reciben su usuario/contraseña al crear el evento desde el panel de oficina.

---

## Funcionalidades principales

### ✅ Gestión de eventos
- CRUD completo (bodas, comuniones, bautizos, etc.)
- Estados: Borrador → Pendiente info → En curso → Confirmado → Completado / Cancelado
- Portal del cliente con UI dedicada

### ✅ Protocolo / Timing
- Timeline del servicio editable
- Bloqueo automático 4 días antes para el rol CLIENT
- Exportación a PDF

### ✅ Mesas e Invitados
- Crear mesas con nombre, capacidad y observaciones
- Añadir invitados con alérgenos y dietas especiales
- Indicadores de ocupación y alertas

### ✅ Editor interactivo de planos de sala *(nuevo)*
- Canvas drag & drop con **react-konva**
- Mesas redondas, rectangulares y ovaladas
- Elementos extra: barra, pista de baile, photocall, escenario, etc.
- Zoom / pan con rueda del ratón; snap to grid 20 px
- Panel de propiedades (etiqueta, capacidad, color, rotación, bloqueo)
- Persistencia JSON en BD (tabla `interactive_floor_plans`)
- Exportar plano como PNG
- Coexiste con el sistema de planos estáticos (imagen/PDF)
- Endpoint: `GET/POST/PUT/DELETE /api/events/{id}/floor-editor`

### ✅ Plano estático
- Subida de imagen (JPG, PNG, WEBP) o PDF hasta 20 MB
- Visualización con zoom incorporado

### ✅ Menús y Alérgenos
- Variantes de menú con precios
- Registro de alérgenos por invitado (14 alérgenos EU)
- Dietas especiales (vegetariano, vegano, halal, kosher…)

### ✅ Facturación
- Presupuesto, pagos y estado de cobro

### ✅ Recordatorios automáticos
- 8 plantillas predeterminadas (protocolo, menú, alérgenos)
- Scheduler diario a las 9:00 AM
- Canales: Email, SMS, WhatsApp (Twilio)
- Panel de administración en `/admin/automatizaciones`

### ✅ Módulo de Trabajadores
- Gestión de personas (DNI, seguridad social, puesto)
- Rangos de mesas por evento
- Importación / exportación Excel

### ✅ Calendario visual
- Vistas mensual, semanal y agenda
- Filtros por tipo, estado, DJ, maître

### ✅ Sistema de permisos granular
- Permisos por rol + permisos individuales adicionales
- Control fino por funcionalidad (ver/crear/editar/eliminar)

---

## Migraciones de base de datos

| Versión | Descripción |
|---------|-------------|
| V1  | Esquema inicial (events, users, menus, guests…) |
| V2  | Sistema de permisos |
| V3  | Variantes de menú |
| V4  | Logs de notificaciones |
| V5  | Unificación alérgenos en guests |
| V6  | Planos estáticos (`floor_plans`) |
| V7  | Permiso PDF_FLOOR_PLAN |
| V8  | Permiso FLOOR_PLAN_VIEW |
| V9  | Columna binaria `data` en floor_plans |
| V10 | Módulo trabajadores (personas, rangos, altas) |
| V11 | **Editor interactivo** (`interactive_floor_plans`) |

---

## Estructura del proyecto

```
Eventos/
├── pom.xml                              # Maven — Spring Boot 3.3.5 / Java 21
├── src/main/java/com/salon/eventos/
│   ├── entity/                          # Entidades JPA (jakarta.persistence)
│   ├── repository/                      # Repositorios Spring Data (22 repos)
│   ├── service/                         # Lógica de negocio
│   ├── controller/                      # API REST (18 controladores)
│   ├── security/                        # JWT (jjwt 0.12) + Spring Security 6
│   ├── dto/                             # Data Transfer Objects
│   └── config/                          # SecurityConfig (SecurityFilterChain)
├── src/main/resources/
│   ├── application.properties
│   ├── application-prod.properties
│   └── db/migration/                    # Flyway V1–V11
└── frontend/                            # React 19 + Vite 8 + Tailwind
    └── src/
        ├── pages/admin/                 # Panel de oficina y departamentos
        ├── pages/client/                # Portal del cliente
        ├── components/
        │   ├── floorEditor/             # Editor interactivo (react-konva)
        │   └── pdf/                     # Generadores PDF (@react-pdf/renderer)
        ├── store/                       # Zustand (floorEditorStore)
        ├── context/                     # AuthContext (JWT)
        └── api/axios.js                 # Cliente HTTP
```

---

## API REST — Endpoints clave

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login → JWT token |

### Eventos
| Método | Ruta | Rol |
|--------|------|-----|
| GET | `/api/events` | OFFICE / KITCHEN / DJ / FLOOR |
| POST | `/api/events` | OFFICE |
| PUT | `/api/events/{id}` | OFFICE |
| PATCH | `/api/events/{id}/status` | OFFICE |
| GET | `/api/events/mis-eventos` | CLIENT |

### Plano interactivo (nuevo)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/events/{id}/floor-editor` | Obtener plano (204 si no existe) |
| POST | `/api/events/{id}/floor-editor` | Crear plano |
| PUT | `/api/events/{id}/floor-editor` | Actualizar (upsert) |
| DELETE | `/api/events/{id}/floor-editor` | Eliminar plano |

### Plano estático
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/events/{id}/floorplan/meta` | Metadatos del archivo |
| GET | `/api/events/{id}/floorplan` | Descarga del archivo |
| POST | `/api/events/{id}/floorplan` | Subir / reemplazar |
| DELETE | `/api/events/{id}/floorplan` | Eliminar |

---

## Migración Java 8 → Java 21

Esta versión ha sido migrada de Java 8 / Spring Boot 2.7 a **Java 21 / Spring Boot 3.3**.
Cambios principales realizados:

- `javax.*` → `jakarta.*` (30 archivos: entidades, servicios, filtros, DTOs)
- `WebSecurityConfigurerAdapter` → `SecurityFilterChain @Bean` (Spring Security 6)
- `@EnableGlobalMethodSecurity` → `@EnableMethodSecurity`
- `.antMatchers()` → `.requestMatchers()`
- `.authorizeRequests()` → `.authorizeHttpRequests()`
- jjwt `0.9.1` → `0.12.6` (nuevo API: `Keys.hmacShaKeyFor`, `verifyWith`, `parseSignedClaims`)
- Flyway 8 → 10 + módulo `flyway-database-postgresql`
- Hibernate 5 → 6.5 (dialecto automático)
- Tomcat 9 → 10.1

---

## Configuración de producción

```properties
# PostgreSQL
DATABASE_URL=jdbc:postgresql://host:5432/eventosdb
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

```bash
# Arrancar en producción con PostgreSQL
java -jar target/eventos-1.0.0.jar --spring.profiles.active=prod
```
