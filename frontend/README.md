# Salón de Celebraciones — Frontend

Aplicación React del sistema de gestión de eventos y bodas.

---

## Stack

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **React** | 19 | UI |
| **Vite** | 8 | Bundler / dev server |
| **Tailwind CSS** | 3.4 | Estilos |
| **react-konva / Konva.js** | latest | Editor interactivo de planos |
| **Zustand** | 5 | Estado global (editor de planos) |
| **@react-pdf/renderer** | 4 | Generación de PDFs |
| **framer-motion** | 12 | Animaciones |
| **react-router-dom** | 7 | Enrutamiento |
| **axios** | 1.x | HTTP / API |
| **@dnd-kit** | 6/10 | Drag & drop (listas) |
| **react-hot-toast** | 2 | Notificaciones |
| **lucide-react** | latest | Iconos |
| **xlsx** | 0.18 | Importación/exportación Excel |

---

## Requisitos

- **Node.js** 18+
- Backend corriendo en `http://localhost:8080`

---

## Desarrollo

```bash
npm install
npm run dev
```

App disponible en **http://localhost:5173**

---

## Build de producción

```bash
npm run build
# Los archivos estáticos quedan en dist/
npm run preview   # previsualizar el build
```

---

## Variables de entorno

Crea un archivo `.env.local` en la raíz del frontend:

```env
VITE_API_URL=http://localhost:8080/api
```

Para producción (Vercel / Render):
```env
VITE_API_URL=https://tu-backend.onrender.com/api
```

---

## Estructura de carpetas

```
frontend/src/
├── api/
│   └── axios.js                  # Cliente HTTP con interceptor JWT
├── context/
│   └── AuthContext.jsx           # Contexto de autenticación
├── store/
│   └── floorEditorStore.js       # Estado global del editor (Zustand)
├── components/
│   ├── floorEditor/              # Editor interactivo de planos
│   │   ├── FloorEditor.jsx           # Componente principal + toolbar
│   │   ├── FloorEditorCanvas.jsx     # Stage Konva (zoom/pan/drag)
│   │   ├── FloorEditorSidebar.jsx    # Paleta de elementos arrastrables
│   │   ├── FloorEditorPropertiesPanel.jsx  # Panel de propiedades
│   │   └── useFloorEditor.js         # Hook API (load/save/delete)
│   ├── pdf/                      # Generadores de PDF
│   │   ├── ProtocolPdfDoc.jsx
│   │   ├── TablesPdfDoc.jsx
│   │   ├── AllergensPdfDoc.jsx
│   │   ├── MenusPdfDoc.jsx
│   │   ├── InvoicePdfDoc.jsx
│   │   ├── KitchenPdfDoc.jsx
│   │   └── MetreOperativePdfDoc.jsx
│   ├── Layout.jsx
│   ├── Navbar.jsx
│   ├── PrivateRoute.jsx
│   ├── PermissionPanel.jsx
│   ├── PersonaAutocomplete.jsx
│   └── PdfDownloadButton.jsx
└── pages/
    ├── Login.jsx
    ├── admin/
    │   ├── Dashboard.jsx
    │   ├── EventList.jsx
    │   ├── EventDetail.jsx       # Gestión completa del evento (10 tabs)
    │   ├── CreateEvent.jsx
    │   ├── CalendarView.jsx
    │   ├── FloorView.jsx         # Vista sala/maître
    │   ├── KitchenView.jsx
    │   ├── DjView.jsx
    │   ├── UserManagement.jsx
    │   ├── PersonaManagement.jsx
    │   ├── JobPositions.jsx
    │   └── AutomationSettings.jsx
    └── client/
        └── ClientPortal.jsx
```

---

## Editor interactivo de planos

El editor está integrado en la pestaña **Planos → Editor interactivo** del detalle de evento.

**Atajos de teclado:**
- `Supr` / `Backspace` — eliminar elemento seleccionado
- Rueda del ratón — zoom in/out
- Arrastrar fondo — pan del canvas

**Controles:**
- Arrastra desde la paleta izquierda para añadir elementos
- Clic en un elemento para seleccionarlo
- Usa los handles del Transformer para redimensionar y rotar
- Panel derecho para editar propiedades del elemento seleccionado

**API del editor:**
```
GET    /api/events/{id}/floor-editor   → carga el plano (204 si no existe)
POST   /api/events/{id}/floor-editor   → crea el plano
PUT    /api/events/{id}/floor-editor   → actualiza (upsert)
DELETE /api/events/{id}/floor-editor   → elimina
```
