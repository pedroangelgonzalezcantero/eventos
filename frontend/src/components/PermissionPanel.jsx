import { useState, useMemo } from 'react';
import { Search, Info } from 'lucide-react';

/**
 * Panel visual de permisos tipo SaaS.
 *
 * Props:
 *  - catalog: [{ code, category, label, description }]
 *  - permissions: { [code]: boolean }  — estado actual (efectivo)
 *  - rolePerms: string[]               — permisos del rol base
 *  - overrides: { [code]: boolean }    — overrides manuales guardados
 *  - onChange: (code, value) => void
 *  - readOnly?: boolean
 */
export default function PermissionPanel({ catalog = [], permissions = {}, rolePerms = [], overrides = {}, onChange, readOnly = false }) {
  const [search, setSearch] = useState('');

  // Agrupar por categoría
  const grouped = useMemo(() => {
    const filtered = search.trim()
      ? catalog.filter(p =>
          p.label.toLowerCase().includes(search.toLowerCase()) ||
          p.code.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase())
        )
      : catalog;

    return filtered.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push(p);
      return acc;
    }, {});
  }, [catalog, search]);

  const isOverridden = (code) => code in overrides;
  const isActive = (code) => permissions[code] === true;

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          className="input pl-9 text-sm"
          placeholder="Buscar permiso..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          Activo (rol base)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-violet-500 inline-block" />
          Personalizado manualmente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-stone-300 inline-block" />
          Sin acceso
        </span>
      </div>

      {/* Categorías */}
      {Object.entries(grouped).map(([category, perms]) => (
        <div key={category} className="card p-4 space-y-3">
          <h4 className="font-semibold text-stone-800 text-sm border-b border-stone-100 pb-2">{category}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {perms.map(p => {
              const active = isActive(p.code);
              const customized = isOverridden(p.code);
              return (
                <label
                  key={p.code}
                  className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all select-none
                    ${readOnly ? 'cursor-default' : 'hover:bg-stone-50'}
                    ${active && customized ? 'bg-violet-50 border border-violet-200' :
                      active ? 'bg-emerald-50 border border-emerald-200' :
                      customized ? 'bg-rose-50 border border-rose-200' :
                      'bg-white border border-stone-100'}
                  `}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      active && customized ? 'bg-violet-500' :
                      active ? 'bg-emerald-500' : 'bg-stone-300'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{p.label}</p>
                      {p.description && (
                        <p className="text-xs text-stone-400 truncate">{p.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {customized && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                        manual
                      </span>
                    )}
                    {/* Toggle switch */}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => onChange && onChange(p.code, !active)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none
                          ${active ? (customized ? 'bg-violet-500' : 'bg-emerald-500') : 'bg-stone-300'}
                        `}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${active ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                      </button>
                    )}
                    {readOnly && (
                      <span className={`text-xs font-semibold ${active ? 'text-emerald-600' : 'text-stone-400'}`}>
                        {active ? '✓' : '—'}
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {Object.keys(grouped).length === 0 && (
        <p className="text-sm text-stone-400 text-center py-8">No se encontraron permisos</p>
      )}
    </div>
  );
}

