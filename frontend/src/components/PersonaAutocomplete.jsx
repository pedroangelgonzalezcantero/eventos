import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, User } from 'lucide-react';
import api from '../api/axios';

/**
 * Autocomplete de personas con búsqueda parcial (ILIKE en backend).
 *
 * Props:
 *   value        — PersonaDto seleccionada (o null)
 *   onChange     — (persona: PersonaDto | null) => void
 *   placeholder  — string (default: "Buscar persona...")
 *   disabled     — boolean
 */
export default function PersonaAutocomplete({ value, onChange, placeholder = 'Buscar persona...', disabled = false }) {
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [open, setOpen]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const inputRef                    = useRef(null);
  const containerRef                = useRef(null);
  const debounceRef                 = useRef(null);

  // Si hay valor seleccionado, mostramos su nombre en el input
  const displayValue = value ? `${value.nombre} ${value.apellidos}` : query;

  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const r = await api.get('/personas/search', { params: { q: q.trim() } });
      setResults(r.data || []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    // Si el usuario escribe, limpiamos la selección actual
    if (value) onChange(null);
    setQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q), 300);
  };

  const handleSelect = (persona) => {
    onChange(persona);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search size={14} className="absolute left-2.5 text-stone-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={value ? `${value.nombre} ${value.apellidos}` : query}
          onChange={handleChange}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={placeholder}
          className="input pl-8 pr-7 text-sm w-full"
        />
        {(value || query) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 text-stone-300 hover:text-stone-600 transition-colors"
          >
            <X size={13} />
          </button>
        )}
        {loading && (
          <span className="absolute right-2 w-3.5 h-3.5 border-2 border-stone-300 border-t-rose-500 rounded-full animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg max-h-52 overflow-y-auto py-1">
          {results.map(p => (
            <li
              key={p.id}
              onMouseDown={() => handleSelect(p)}
              className="px-3 py-2 cursor-pointer hover:bg-rose-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <User size={13} className="text-stone-400 flex-none" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">
                    {p.nombre} {p.apellidos}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    DNI: {p.dni}{p.puesto ? ` · ${p.puesto}` : ''}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && results.length === 0 && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg px-3 py-3 text-sm text-stone-400 text-center">
          Sin resultados para "{query}"
        </div>
      )}
    </div>
  );
}

