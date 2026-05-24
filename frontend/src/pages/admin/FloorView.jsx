import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Calendar, Users, MapPin, Clock, AlertTriangle, Table2, Lock } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import PdfDownloadButton      from '../../components/PdfDownloadButton';
import ProtocolPdfDoc         from '../../components/pdf/ProtocolPdfDoc';
import TablesPdfDoc           from '../../components/pdf/TablesPdfDoc';
import AllergensPdfDoc        from '../../components/pdf/AllergensPdfDoc';
import MetreOperativePdfDoc   from '../../components/pdf/MetreOperativePdfDoc';

const ALLERGEN_LABELS = {
  GLUTEN:'Gluten', LACTEOS:'Lácteos', HUEVOS:'Huevos', FRUTOS_SECOS:'Frutos secos',
  CACAHUETES:'Cacahuetes', SOJA:'Soja', MARISCO:'Marisco', PESCADO:'Pescado',
  MOSTAZA:'Mostaza', APIO:'Apio', SESAMO:'Sésamo', SULFITOS:'Sulfitos',
  MOLUSCOS:'Moluscos', ALTRAMUZ:'Altramuz'
};

const ALLERGEN_COLORS = [
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-red-50 text-red-700 border-red-200',
  'bg-orange-50 text-orange-700 border-orange-200',
  'bg-yellow-50 text-yellow-700 border-yellow-200',
];

const DIET_COLORS = {
  VEGETARIANO: 'bg-green-100 text-green-700',
  VEGANO: 'bg-emerald-100 text-emerald-700',
  HALAL: 'bg-teal-100 text-teal-700',
  KOSHER: 'bg-cyan-100 text-cyan-700',
  SIN_SAL: 'bg-sky-100 text-sky-700',
  DIABETICO: 'bg-blue-100 text-blue-700',
};

export default function FloorView() {
  const { hasPermission } = useAuth();
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [protocol, setProtocol] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timing');
  // Permisos reales del usuario
  const canViewProtocol  = hasPermission('PROTOCOL_VIEW');
  const canViewTables    = hasPermission('TABLES_VIEW');
  const canViewAllergens = hasPermission('ALLERGENS_VIEW');

  useEffect(() => {
    api.get('/events/mis-eventos')
      .then(r => {
        const active = r.data.filter(e => !['COMPLETADO', 'CANCELADO'].includes(e.status));
        setEvents(active);
        if (active.length > 0) loadEvent(active[0].id);
        else setLoading(false);
      })
      .catch(() => { toast.error('Error cargando eventos'); setLoading(false); });
  }, []);

  const loadEvent = async (id) => {
    setSelected(id);
    setProtocol([]);
    setAllergens([]);
    setTables([]);
    setLoading(true);
    // Cada llamada es independiente — un 403 no bloquea las demás
    const [p, a, t] = await Promise.all([
      canViewProtocol  ? api.get(`/events/${id}/protocol`).catch(() => ({ data: [] }))  : Promise.resolve({ data: [] }),
      canViewAllergens ? api.get(`/events/${id}/allergens`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      canViewTables    ? api.get(`/events/${id}/tables`).catch(() => ({ data: [] }))    : Promise.resolve({ data: [] }),
    ]);
    setProtocol(p.data);
    setAllergens(a.data);
    setTables(t.data);
    setLoading(false);
  };

  const selectedEvent = events.find(e => e.id === selected);
  const byTable = allergens.reduce((acc, a) => {
    const t = a.tableNumber || 'Sin mesa asignada';
    (acc[t] = acc[t] || []).push(a);
    return acc;
  }, {});

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    </Layout>
  );

  if (events.length === 0) return (
    <Layout>
      <div className="card text-center py-20">
        <Layers size={48} className="text-stone-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-stone-800 mb-2">Sin eventos asignados</h2>
        <p className="text-stone-500">Cuando te asignen a un evento, aparecerá aquí.</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Layers size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-stone-900">Vista Sala / Metres</h1>
            <p className="text-stone-500 text-sm">Timing y distribución de mesas</p>
          </div>
          {selectedEvent && (
            <PdfDownloadButton
              permissionCode="TABLES_VIEW"
              label="Descargar PDF operativo"
              variant="primary"
              fileName={`operativo-metre-${(selectedEvent.clientName || 'evento').replace(/\s+/g, '-').toLowerCase()}.pdf`}
              fetchData={async () => {
                const [p, a, t, m] = await Promise.all([
                  canViewProtocol  ? api.get(`/events/${selected}/protocol`).catch(() => ({ data: [] }))  : Promise.resolve({ data: [] }),
                  canViewAllergens ? api.get(`/events/${selected}/allergens`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                  canViewTables    ? api.get(`/events/${selected}/tables`).catch(() => ({ data: [] }))    : Promise.resolve({ data: [] }),
                  api.get(`/events/${selected}/menus`).catch(() => ({ data: [] })),
                ]);
                return { event: selectedEvent, protocol: p.data, allergens: a.data, tables: t.data, menus: m.data };
              }}
              DocumentComponent={MetreOperativePdfDoc}
            />
          )}
        </div>

        {/* Event selector */}
        {events.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {events.map(e => (
              <button key={e.id} onClick={() => loadEvent(e.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  selected === e.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-emerald-200'
                }`}>
                {e.clientName}
                <span className="ml-1.5 opacity-70 text-xs">
                  {new Date(e.eventDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Event info */}
        {selectedEvent && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200">
            <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wide mb-1">{selectedEvent.typeLabel}</p>
            <h2 className="text-xl font-bold mb-2">{selectedEvent.clientName}</h2>
            <div className="flex flex-wrap gap-3 text-sm text-emerald-100">
              <span className="flex items-center gap-1.5"><Calendar size={14} />
                {new Date(selectedEvent.eventDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              {selectedEvent.estimatedGuests && (
                <span className="flex items-center gap-1.5"><Users size={14} />{selectedEvent.estimatedGuests} invitados</span>
              )}
              {selectedEvent.venue && (
                <span className="flex items-center gap-1.5"><MapPin size={14} />{selectedEvent.venue}</span>
              )}
            </div>
          </motion.div>
        )}

        {/* Tabs internos: Timing / Mesas / Alérgenos */}
        <div className="flex gap-1 bg-stone-100 rounded-xl p-1 w-fit">
          {[
            ['timing','Timing',Clock, canViewProtocol],
            ['mesas','Mesas',Table2, canViewTables],
            ['alergenos','Alérgenos',AlertTriangle, canViewAllergens]
          ].map(([id,label,Icon,allowed]) => (
            <button key={id} onClick={() => allowed && setActiveTab(id)}
              disabled={!allowed}
              title={!allowed ? 'Sin permiso' : ''}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                !allowed
                  ? 'text-stone-300 cursor-not-allowed opacity-50'
                  : activeTab === id ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}>
              <Icon size={14} />{label}
              {!allowed && <Lock size={11} />}
            </button>
          ))}
        </div>

        {/* Contenido por tab */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline — siempre visible */}
          {(activeTab === 'timing') && (
            <div className="card lg:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <Clock size={18} className="text-emerald-600" />
                <h3 className="font-semibold text-stone-900">Timing del servicio</h3>
                <span className="badge bg-emerald-100 text-emerald-700 ml-auto">{protocol.length} momentos</span>
                <PdfDownloadButton
                  permissionCode="PROTOCOL_VIEW"
                  label="PDF protocolo"
                  fileName={`protocolo-${(selectedEvent?.clientName || 'evento').replace(/\s+/g, '-').toLowerCase()}.pdf`}
                  fetchData={async () => {
                    const r = await api.get(`/events/${selected}/protocol`);
                    return { event: selectedEvent, protocol: r.data };
                  }}
                  DocumentComponent={ProtocolPdfDoc}
                />
              </div>
              {protocol.length === 0 ? (
                <div className="text-center py-10"><Clock size={32} className="text-stone-300 mx-auto mb-3" /><p className="text-stone-400 text-sm">No hay protocolo definido</p></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {protocol.map((item, i) => (
                    <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl hover:bg-emerald-50 transition-colors">
                      <span className={`text-xs font-bold w-12 flex-none mt-0.5 ${item.eventTime ? 'text-emerald-700' : 'text-stone-400'}`}>{item.eventTime || '—'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-900">{item.description}</p>
                        {item.involvedPerson && <p className="text-xs text-stone-500 mt-0.5"> {item.involvedPerson}</p>}
                        {item.observations && <p className="text-xs text-stone-400 mt-0.5 italic">{item.observations}</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mesas con invitados */}
          {activeTab === 'mesas' && (
            <div className="card lg:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <Table2 size={18} className="text-emerald-600" />
                <h3 className="font-semibold text-stone-900">Distribución de mesas</h3>
                <span className="badge bg-emerald-100 text-emerald-700 ml-auto">{tables.length} mesas · {tables.reduce((s,t) => s + (t.guestCount||0), 0)} invitados</span>
                <PdfDownloadButton
                  permissionCode="TABLES_VIEW"
                  label="PDF mesas"
                  fileName={`mesas-${(selectedEvent?.clientName || 'evento').replace(/\s+/g, '-').toLowerCase()}.pdf`}
                  fetchData={async () => {
                    const r = await api.get(`/events/${selected}/tables`);
                    return { event: selectedEvent, tables: r.data };
                  }}
                  DocumentComponent={TablesPdfDoc}
                />
              </div>
              {tables.length === 0 ? (
                <div className="text-center py-10"><Table2 size={32} className="text-stone-300 mx-auto mb-3" /><p className="text-stone-400 text-sm">No hay mesas configuradas para este evento</p></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tables.map(table => (
                    <motion.div key={table.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-2xl overflow-hidden ${table.allergiesCount > 0 ? 'border-amber-200' : 'border-stone-200'}`}>
                      <div className={`px-4 py-2.5 flex items-center gap-2 ${table.allergiesCount > 0 ? 'bg-amber-50' : 'bg-stone-50'}`}>
                        <span className="font-bold text-stone-900 text-sm flex-1">{table.name}</span>
                        <span className="text-xs text-stone-500">{table.guestCount}{table.capacity ? `/${table.capacity}` : ''}</span>
                        {table.allergiesCount > 0 && <span className="badge bg-amber-200 text-amber-800 text-[10px]">⚠ {table.allergiesCount}</span>}
                      </div>
                      <div className="p-3 space-y-1.5">
                        {(table.guests || []).map(g => (
                          <div key={g.id} className="flex items-start gap-2 p-2 bg-white border border-stone-100 rounded-xl">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-stone-900">{g.guestName}</p>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {g.diet && <span className={`badge text-[10px] ${DIET_COLORS[g.diet] || 'bg-purple-100 text-purple-700'}`}>{g.diet.replace('_',' ')}</span>}
                                {g.allergies && g.allergies.split(',').filter(Boolean).map((a, idx) => (
                                  <span key={a} className={`badge text-[10px] ${ALLERGEN_COLORS[idx % ALLERGEN_COLORS.length]}`}>⚠ {ALLERGEN_LABELS[a] || a}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!table.guests || table.guests.length === 0) && <p className="text-xs text-stone-400 text-center py-2 italic">Sin invitados</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Alérgenos por mesa */}
          {activeTab === 'alergenos' && (
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2"><AlertTriangle size={18} className="text-amber-600" /><h3 className="font-semibold text-stone-900">Necesidades especiales</h3></div>
                <div className="flex items-center gap-2">
                  {allergens.length > 0 && <span className="badge bg-amber-100 text-amber-700">{allergens.length} personas</span>}
                  <PdfDownloadButton
                    permissionCode="PDF_ALLERGENS"
                    label="PDF alérgenos"
                    fileName={`alergenos-${(selectedEvent?.clientName || 'evento').replace(/\s+/g, '-').toLowerCase()}.pdf`}
                    fetchData={async () => {
                      const r = await api.get(`/events/${selected}/allergens`);
                      return { event: selectedEvent, allergens: r.data };
                    }}
                    DocumentComponent={AllergensPdfDoc}
                  />
                </div>
              </div>
              {allergens.length === 0 ? (
                <div className="text-center py-10"><div className="text-4xl mb-3">✅</div><p className="text-stone-400 text-sm">Sin necesidades especiales registradas</p></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(byTable).sort(([a],[b]) => a.localeCompare(b)).map(([table, entries]) => (
                    <div key={table} className="border border-amber-100 rounded-2xl overflow-hidden">
                      <div className="bg-amber-50 px-4 py-2 flex items-center gap-2">
                        <MapPin size={13} className="text-amber-600" /><span className="font-semibold text-amber-800 text-sm">{table}</span>
                        <span className="ml-auto text-xs text-amber-600">{entries.length} pers.</span>
                      </div>
                      <div className="p-3 space-y-2">
                        {entries.map(e => (
                          <div key={e.id} className="bg-white rounded-xl p-3 border border-stone-100">
                            <p className="font-semibold text-sm text-stone-900 mb-1.5">{e.guestName}</p>
                            <div className="flex flex-wrap gap-1">
                              {e.diet && <span className={`badge ${DIET_COLORS[e.diet] || 'bg-purple-100 text-purple-700'}`}>{e.diet.replace('_', ' ')}</span>}
                              {e.allergies && e.allergies.split(',').filter(Boolean).map((a, idx) => (
                                <span key={a} className={`badge ${ALLERGEN_COLORS[idx % ALLERGEN_COLORS.length]}`}>{ALLERGEN_LABELS[a] || a}</span>
                              ))}
                            </div>
                            {e.observations && <p className="text-xs text-stone-400 mt-1.5 italic">{e.observations}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
