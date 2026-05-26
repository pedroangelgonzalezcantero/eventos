import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Calendar, Users, Music2, ChefHat, Layers,
  LogOut, Menu, X, ChevronRight, Sparkles, CalendarDays, Bell, Briefcase,
  UserCheck, FileText,
} from 'lucide-react';
import logoApp from '../assets/logoApp.png';

// ── Menú fijo para OFFICE ────────────────────────────────────────────────────
const OFFICE_NAV = [
  { to: '/admin/dashboard',        label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/admin/eventos',          label: 'Eventos',          icon: Calendar        },
  { to: '/admin/calendario',       label: 'Calendario',       icon: CalendarDays    },
  { to: '/admin/usuarios',         label: 'Personal',         icon: Users           },
  { to: '/admin/personas',         label: 'Trabajadores',     icon: UserCheck       },
  { to: '/admin/altas',            label: 'Altas asesoría',   icon: FileText        },
  { to: '/admin/puestos',          label: 'Puestos',          icon: Briefcase       },
  { to: '/admin/automatizaciones', label: 'Automatizaciones', icon: Bell            },
];

/**
 * Genera los enlaces de navegación de forma DINÁMICA según los permisos activos.
 *
 * Regla: permiso activo → sección visible en el menú.
 *        permiso inactivo → sección desaparece completamente.
 */
function buildDynamicNav(hasPermission) {
  const items = [];

  // Dashboard
  if (hasPermission('DASHBOARD_VIEW')) {
    items.push({ to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard });
  }

  // Sala / Mesas
  // TABLES_VIEW es la señal de acceso principal a la vista de sala.
  // FloorView gestiona internamente las pestañas Timing, Mesas, Alérgenos y Planos
  // según los permisos de cada usuario (con sus propias comprobaciones internas).
  const hasSalaAccess = hasPermission('TABLES_VIEW');
  if (hasSalaAccess) {
    items.push({ to: '/admin/sala', label: 'Sala / Mesas', icon: Layers });
  }

  // Protocolo
  // Solo aparece como enlace independiente si tiene PROTOCOL_VIEW pero NO sala.
  // Si ya tiene TABLES_VIEW → el protocolo está disponible como pestaña "Timing"
  // dentro de FloorView, evitando duplicados en el menú.
  if (hasPermission('PROTOCOL_VIEW') && !hasSalaAccess) {
    items.push({ to: '/admin/dj', label: 'Protocolo', icon: Music2 });
  }

  // Cocina: menús y/o alérgenos
  if (hasPermission('MENUS_VIEW') || hasPermission('ALLERGENS_VIEW')) {
    items.push({ to: '/admin/cocina', label: 'Cocina', icon: ChefHat });
  }

  return items;
}

// ── Config visual de roles (con fallback para roles personalizados) ──────────
const ROLE_CONFIG = {
  OFFICE:  { label: 'Administración',  color: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-500'  },
  KITCHEN: { label: 'Cocina',          color: 'bg-orange-100 text-orange-700',  dot: 'bg-orange-500'  },
  DJ:      { label: 'DJ',              color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500'    },
  FLOOR:   { label: 'Sala / Metres',   color: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-500' },
  CLIENT:  { label: 'Cliente',         color: 'bg-rose-100 text-rose-700',      dot: 'bg-rose-500'    },
};

export default function Sidebar() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Construir lista de links según rol/permisos ──────────────────────────
  let links = [];
  if (user) {
    if (user.role === 'OFFICE') {
      links = OFFICE_NAV;
    } else if (user.role === 'CLIENT') {
      links = [{ to: '/mi-evento', label: 'Mi Evento', icon: Calendar }];
    } else {
      // KITCHEN, DJ, FLOOR y cualquier rol personalizado:
      // el menú se construye DINÁMICAMENTE a partir de los permisos activos.
      links = buildDynamicNav(hasPermission);
    }
  }

  // Config visual con fallback para roles custom no registrados
  const rc = ROLE_CONFIG[user?.role] ?? {
    label: user?.role ?? '—',
    color: 'bg-stone-100 text-stone-700',
    dot:   'bg-stone-400',
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const NavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {links.length === 0 ? (
        <p className="text-xs text-stone-400 text-center px-2 py-8 leading-relaxed">
          Sin secciones habilitadas.<br />
          <span className="text-[11px]">Contacta con el administrador.</span>
        </p>
      ) : (
        links.map(link => {
          const Icon = link.icon;
          const active = location.pathname === link.to ||
            (link.to !== '/' && location.pathname.startsWith(link.to + '/'));
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                active
                  ? 'bg-rose-50 text-rose-700 shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Icon
                size={18}
                className={active ? 'text-rose-600' : 'text-stone-400 group-hover:text-stone-600'}
              />
              {link.label}
              {active && <ChevronRight size={14} className="ml-auto text-rose-400" />}
            </Link>
          );
        })
      )}
    </nav>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-stone-100 flex-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm flex-none">
            <img src={logoApp} alt="Logo" className="w-full h-full object-cover scale-150" />
          </div>
          <div>
            <p className="font-bold text-stone-900 text-sm leading-none">Agora Celebraciones</p>
            <p className="text-xs text-stone-400 mt-0.5">Gestión Premium</p>
          </div>
        </div>
      </div>

      <NavLinks />

      {/* User footer */}
      <div className="px-3 pb-4 border-t border-stone-100 pt-3 flex-none">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-stone-50">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center flex-none">
            <span className="text-xs font-bold text-stone-600">
              {(user?.nombre || user?.username || '?')[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-900 truncate">
              {user?.nombre || user?.username}
            </p>
            <span className={`badge ${rc.color} text-[10px] mt-0.5`}>{rc.label}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-stone-400 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-rose-50"
            title="Cerrar sesión"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-60 bg-white border-r border-stone-100 z-30 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-stone-100 h-14 flex items-center px-4 gap-3 shadow-sm">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <Menu size={20} className="text-stone-600" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-bold text-stone-900 text-sm">Salon Eventos</span>
        </div>
        <span className={`badge ${rc.color} text-[10px]`}>{rc.label}</span>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-white h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-stone-100 flex-none">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <span className="font-bold text-stone-900">Salon Eventos</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-stone-100">
                <X size={18} className="text-stone-500" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
