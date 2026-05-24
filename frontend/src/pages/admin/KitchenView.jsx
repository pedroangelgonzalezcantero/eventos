import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PdfDownloadButton  from '../../components/PdfDownloadButton';
import MenusPdfDoc         from '../../components/pdf/MenusPdfDoc';
import AllergensPdfDoc     from '../../components/pdf/AllergensPdfDoc';
import KitchenPdfDoc       from '../../components/pdf/KitchenPdfDoc';

const ALLERGEN_LABELS = { GLUTEN:'Gluten', LACTEOS:'Lacteos', HUEVOS:'Huevos', FRUTOS_SECOS:'Frutos secos', CACAHUETES:'Cacahuetes', SOJA:'Soja', MARISCO:'Marisco', PESCADO:'Pescado', MOSTAZA:'Mostaza', APIO:'Apio', SESAMO:'Sesamo', SULFITOS:'Sulfitos', MOLUSCOS:'Moluscos', ALTRAMUZ:'Altramuz' };

export default function KitchenView() {
  const { hasPermission } = useAuth();
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [menus, setMenus] = useState([]);
  const [allergens, setAllergens] = useState([]);

  const canViewMenus    = hasPermission('MENUS_VIEW');
  const canViewAllergens = hasPermission('ALLERGENS_VIEW');

  useEffect(() => {
    api.get('/events/mis-eventos').then(r => {
      const active = r.data.filter(e => !['COMPLETADO','CANCELADO'].includes(e.status));
      setEvents(active);
      if (active.length > 0) selectEvent(active[0].id);
    }).catch(() => toast.error('Error cargando eventos'));
  }, []);

  const selectEvent = async (id) => {
    setSelected(id);
    const [m, a] = await Promise.all([
      canViewMenus    ? api.get(`/events/${id}/menus`).catch(() => ({ data: [] }))    : Promise.resolve({ data: [] }),
      canViewAllergens ? api.get(`/events/${id}/allergens`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
    ]);
    setMenus(m.data);
    setAllergens(a.data);
  };

  const selectedEvent = events.find(e => e.id === selected);
  const selectedMenu = menus.find(m => m.selected);
  const byTable = allergens.reduce((acc, a) => { const t = a.tableNumber || 'Sin mesa'; (acc[t]=acc[t]||[]).push(a); return acc; }, {});

  if (events.length === 0) return (
    <Layout>
      <div className="card text-center py-20">
        <span className="text-5xl mb-4 block">🍽️</span>
        <h2 className="text-xl font-bold text-stone-800 mb-2">Sin eventos asignados</h2>
        <p className="text-stone-500">Cuando te asignen a un evento, aparecerá aquí.</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🍽️</span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Vista Cocina</h1>
            <p className="text-gray-500 text-sm">Menús y alérgenos por evento</p>
          </div>
          {selectedEvent && (
            <PdfDownloadButton
              permissionCode="MENUS_VIEW"
              label="Descargar cocina PDF"
              variant="primary"
              fileName={`cocina-${(selectedEvent.clientName || 'evento').replace(/\s+/g, '-').toLowerCase()}.pdf`}
              fetchData={async () => {
                const [m, a, t] = await Promise.all([
                  canViewMenus     ? api.get(`/events/${selected}/menus`).catch(() => ({ data: [] }))     : Promise.resolve({ data: [] }),
                  canViewAllergens ? api.get(`/events/${selected}/allergens`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                  api.get(`/events/${selected}/tables`).catch(() => ({ data: [] })),
                ]);
                return { event: selectedEvent, menus: m.data, allergens: a.data, tables: t.data };
              }}
              DocumentComponent={KitchenPdfDoc}
            />
          )}
        </div>

        {/* Selector de evento */}
        <div className="flex gap-2 flex-wrap">
          {events.map(e => (
            <button key={e.id} onClick={() => selectEvent(e.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${selected === e.id ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-300'}`}>
              {e.clientName} ({new Date(e.eventDate).toLocaleDateString('es-ES', {day:'2-digit',month:'short'})})
            </button>
          ))}
        </div>

        {selectedEvent && (
          <>
            <div className="card bg-orange-50 border-orange-200">
              <h2 className="text-lg font-bold text-orange-900">{selectedEvent.clientName} · {selectedEvent.typeLabel}</h2>
              <p className="text-orange-700">📅 {new Date(selectedEvent.eventDate).toLocaleDateString('es-ES',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} · 👥 {selectedEvent.estimatedGuests} invitados</p>
            </div>

            {/* Menu seleccionado */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">🍽️ Menú seleccionado</h3>
                <PdfDownloadButton
                  permissionCode="MENUS_VIEW"
                  label="PDF menús"
                  fileName={`menus-${(selectedEvent?.clientName || 'evento').replace(/\s+/g, '-').toLowerCase()}.pdf`}
                  fetchData={async () => {
                    const r = await api.get(`/events/${selected}/menus`);
                    return { event: selectedEvent, menus: r.data };
                  }}
                  DocumentComponent={MenusPdfDoc}
                />
              </div>
              {!canViewMenus ? (
                <div className="text-center py-8">
                  <Lock size={32} className="text-stone-300 mx-auto mb-2" />
                  <p className="text-stone-400 text-sm">Sin permiso para ver menús</p>
                </div>
              ) : selectedMenu ? (
                <div>
                  <h4 className="font-bold text-lg mb-3">{selectedMenu.name}</h4>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[['Entrantes',selectedMenu.starters],['Primer plato',selectedMenu.firstCourse],['Segundo plato',selectedMenu.secondCourse],['Postre',selectedMenu.dessert],['Bebidas',selectedMenu.drinks],['Extras',selectedMenu.extras]].filter(([,v])=>v).map(([l,v])=>(
                      <div key={l} className="bg-gray-50 rounded-lg p-3">
                        <dt className="text-xs text-gray-500 font-medium uppercase">{l}</dt>
                        <dd className="text-gray-900 mt-1">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : <p className="text-amber-600">⚠️ El cliente aún no ha confirmado el menú</p>}
            </div>

            {/* Alergenos por mesa */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">
                  ⚠️ Alérgenos y dietas especiales {canViewAllergens && `(${allergens.length} personas)`}
                </h3>
                <PdfDownloadButton
                  permissionCode="ALLERGENS_VIEW"
                  label="PDF alérgenos"
                  fileName={`alergenos-${(selectedEvent?.clientName || 'evento').replace(/\s+/g, '-').toLowerCase()}.pdf`}
                  fetchData={async () => {
                    const r = await api.get(`/events/${selected}/allergens`);
                    return { event: selectedEvent, allergens: r.data };
                  }}
                  DocumentComponent={AllergensPdfDoc}
                />
              </div>
              {!canViewAllergens ? (
                <div className="text-center py-8">
                  <Lock size={32} className="text-stone-300 mx-auto mb-2" />
                  <p className="text-stone-400 text-sm">Sin permiso para ver alérgenos</p>
                </div>
              ) : allergens.length === 0 ? (
                <p className="text-gray-500">No hay alérgenos registrados para este evento.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(byTable).sort(([a],[b])=>a.localeCompare(b)).map(([table, entries]) => (
                    <div key={table} className="border rounded-xl overflow-hidden">
                      <div className="bg-orange-100 px-4 py-2 font-semibold text-orange-800">📍 {table}</div>
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3">Invitado</th>
                            <th className="text-left p-3">Alérgenos</th>
                            <th className="text-left p-3">Dieta</th>
                            <th className="text-left p-3">Observaciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map(e => (
                            <tr key={e.id} className="border-t">
                              <td className="p-3 font-medium">{e.guestName}</td>
                              <td className="p-3">
                                {e.allergies ? e.allergies.split(',').filter(Boolean).map(a=>(
                                  <span key={a} className="badge bg-amber-100 text-amber-700 mr-1 mb-1">{ALLERGEN_LABELS[a]||a}</span>
                                )) : <span className="text-gray-400">Ninguno</span>}
                              </td>
                              <td className="p-3">{e.diet ? <span className="badge bg-purple-100 text-purple-700">{e.diet}</span> : ''}</td>
                              <td className="p-3 text-gray-500">{e.observations || ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
