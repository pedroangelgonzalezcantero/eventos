import { Music2, Layers, ChefHat, ShieldCheck, User, Wand2 } from 'lucide-react';

const TEMPLATE_CONFIG = {
  OFFICE:  { label: 'Administración', icon: ShieldCheck, color: 'bg-violet-100 text-violet-700 border-violet-200', desc: 'Acceso total al sistema' },
  FLOOR:   { label: 'Jefe de sala',   icon: Layers,      color: 'bg-emerald-100 text-emerald-700 border-emerald-200', desc: 'Mesas, invitados, protocolo' },
  KITCHEN: { label: 'Cocina',         icon: ChefHat,     color: 'bg-orange-100 text-orange-700 border-orange-200', desc: 'Menús, alergias, dietas' },
  DJ:      { label: 'DJ',             icon: Music2,      color: 'bg-blue-100 text-blue-700 border-blue-200', desc: 'Protocolo y timeline' },
  CLIENT:  { label: 'Cliente',        icon: User,        color: 'bg-stone-100 text-stone-700 border-stone-200', desc: 'Portal del cliente' },
};

/**
 * Props:
 *  - templates: { [role]: string[] }  — de la API
 *  - onApply: (permissionsMap: { [code]: boolean }) => void
 */
export default function PermissionTemplateSelector({ templates = {}, onApply }) {
  const applyTemplate = (role) => {
    const codes = templates[role] || [];
    // Construir mapa completo para todos los permisos conocidos
    const allCodes = Object.values(templates).flat();
    const unique = [...new Set(allCodes)];
    const map = {};
    unique.forEach(c => { map[c] = codes.includes(c); });
    onApply(map);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Wand2 size={15} className="text-violet-500" />
        <span className="text-sm font-semibold text-stone-700">Aplicar plantilla de rol</span>
        <span className="text-xs text-stone-400 ml-1">(sobrescribe los permisos actuales)</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {Object.entries(TEMPLATE_CONFIG).map(([role, cfg]) => {
          const Icon = cfg.icon;
          if (!templates[role]) return null;
          return (
            <button
              key={role}
              type="button"
              onClick={() => applyTemplate(role)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-medium transition-all hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] ${cfg.color}`}
            >
              <Icon size={18} />
              <span className="text-xs font-semibold leading-tight text-center">{cfg.label}</span>
              <span className="text-[10px] opacity-70 leading-tight text-center">{cfg.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

