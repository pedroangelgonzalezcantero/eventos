import { useEffect, useState } from 'react';
import { FileText, Search, Calendar, Users, Download } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

/** Calcula el viernes y domingo del fin de semana más próximo al día dado */
function weekendRange(date) {
  const d   = new Date(date);
  const day = d.getDay(); // 0=dom, 5=vie, 6=sab
  // Retroceder al viernes anterior (o el mismo día)
  const fri = new Date(d);
  fri.setDate(d.getDate() - ((day + 2) % 7));  // distancia al viernes
  const sun = new Date(fri);
  sun.setDate(fri.getDate() + 2);
  return {
    from: fri.toISOString().slice(0, 10),
    to:   sun.toISOString().slice(0, 10),
  };
}

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AltasView() {
  const today = new Date().toISOString().slice(0, 10);
  const { from: initFrom, to: initTo } = weekendRange(today);

  const [from, setFrom]       = useState(initFrom);
  const [to, setTo]           = useState(initTo);
  const [altas, setAltas]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState('');

  const loadAltas = async () => {
    setLoading(true);
    try {
      const r = await api.get('/altas', { params: { from, to } });
      setAltas(r.data);
    } catch { toast.error('Error cargando altas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAltas(); }, []); // carga inicial del fin de semana actual

  const filtered = altas.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.personaDni?.toLowerCase().includes(q) ||
      a.personaNombreCompleto?.toLowerCase().includes(q) ||
      (a.personaSeguridadSocial || '').toLowerCase().includes(q) ||
      (a.personaPuesto || '').toLowerCase().includes(q) ||
      a.eventoClientName?.toLowerCase().includes(q)
    );
  });

  // Agrupar por evento
  const byEvento = filtered.reduce((acc, a) => {
    const key = `${a.eventoFecha}__${a.eventoClientName}`;
    if (!acc[key]) acc[key] = { eventoId: a.eventoId, clientName: a.eventoClientName, fecha: a.eventoFecha, items: [] };
    acc[key].items.push(a);
    return acc;
  }, {});

  const handleExportCSV = () => {
    const rows = [
      ['DNI', 'Nombre completo', 'S. Social', 'Puesto', 'Evento', 'Fecha evento'],
      ...altas.map(a => [
        a.personaDni,
        a.personaNombreCompleto,
        a.personaSeguridadSocial || '',
        a.personaPuesto || '',
        a.eventoClientName,
        a.eventoFecha,
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `altas-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              <FileText size={22} className="text-stone-500" /> Altas para asesoría
            </h1>
            <p className="text-stone-500 text-sm mt-0.5">
              Listado de trabajadores a dar de alta por rango de fechas · sin duplicados
            </p>
          </div>
          {altas.length > 0 && (
            <button onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-stone-200 bg-white text-stone-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-colors">
              <Download size={14} /> Exportar CSV
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="card">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="label flex items-center gap-1.5"><Calendar size={13} /> Desde</label>
              <input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Calendar size={13} /> Hasta</label>
              <input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <button onClick={loadAltas} disabled={loading} className="btn-primary">
              {loading ? 'Cargando...' : 'Buscar'}
            </button>
            {/* Accesos rápidos */}
            <div className="flex gap-2 ml-auto">
              {['Este fin de semana', 'Semana siguiente'].map((label, i) => {
                const base   = new Date();
                base.setDate(base.getDate() + i * 7);
                const range = weekendRange(base);
                return (
                  <button key={label}
                    onClick={() => { setFrom(range.from); setTo(range.to); }}
                    className="px-3 py-1.5 text-xs rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors">
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Resumen */}
        {altas.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-stone-900">{altas.length}</p>
              <p className="text-sm text-stone-500 mt-0.5">Altas totales</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-stone-900">{Object.keys(byEvento).length}</p>
              <p className="text-sm text-stone-500 mt-0.5">Eventos</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-stone-900">
                {new Set(altas.map(a => a.personaId)).size}
              </p>
              <p className="text-sm text-stone-500 mt-0.5">Personas únicas</p>
            </div>
          </div>
        )}

        {/* Búsqueda */}
        {altas.length > 0 && (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input className="input pl-9"
              placeholder="Filtrar por DNI, nombre, S.Social, puesto o evento..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        )}

        {/* Resultados agrupados por evento */}
        {loading ? (
          <div className="card flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
          </div>
        ) : altas.length === 0 ? (
          <div className="card text-center py-16">
            <Users size={40} className="text-stone-200 mx-auto mb-4" />
            <p className="text-stone-500 font-medium">Sin altas en el período seleccionado</p>
            <p className="text-stone-400 text-sm mt-1">Asigna trabajadores a rangos de un evento para que aparezcan aquí.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.values(byEvento).map(grupo => (
              <div key={`${grupo.eventoId}`} className="card p-0 overflow-hidden">
                {/* Cabecera grupo */}
                <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-stone-900">{grupo.clientName}</p>
                    <p className="text-xs text-stone-500">{fmt(grupo.fecha)}</p>
                  </div>
                  <span className="badge bg-rose-100 text-rose-700 text-xs">
                    {grupo.items.length} alta{grupo.items.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Tabla de altas */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100">
                      <th className="text-left px-4 py-2 font-medium text-stone-500 text-xs">DNI</th>
                      <th className="text-left px-4 py-2 font-medium text-stone-500 text-xs">Nombre completo</th>
                      <th className="text-left px-4 py-2 font-medium text-stone-500 text-xs">S. Social</th>
                      <th className="text-left px-4 py-2 font-medium text-stone-500 text-xs">Puesto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.items.map(a => (
                      <tr key={a.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-stone-700 text-xs">{a.personaDni}</td>
                        <td className="px-4 py-2.5 font-medium text-stone-900">{a.personaNombreCompleto}</td>
                        <td className="px-4 py-2.5 font-mono text-stone-500 text-xs">
                          {a.personaSeguridadSocial || <span className="text-stone-300 italic">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-stone-600">
                          {a.personaPuesto || <span className="text-stone-300 italic">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

