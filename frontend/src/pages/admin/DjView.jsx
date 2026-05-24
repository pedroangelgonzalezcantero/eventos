import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, Calendar, Users, Clock, MapPin,
  Maximize2, Minimize2, Play, UserRound, Lock } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import PdfDownloadButton from '../../components/PdfDownloadButton';
import ProtocolPdfDoc from '../../components/pdf/ProtocolPdfDoc';

export default function DjView() {
  const { hasPermission } = useAuth();
  const [events, setEvents]     = useState([]);
  const [selected, setSelected] = useState(null);
  const [protocol, setProtocol] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [noPermission, setNoPermission] = useState(false);

  useEffect(() => {
    api.get('/events/mis-eventos')
      .then(r => {
        const active = r.data.filter(e => !['COMPLETADO', 'CANCELADO'].includes(e.status));
        setEvents(active);
        if (active.length > 0) loadEvent(active[0].id);
        else setLoading(false);
      })
      .catch(err => {
        if (err.response?.status === 403) setNoPermission(true);
        else toast.error('Error cargando eventos');
        setLoading(false);
      });
  }, []);

  const loadEvent = async (id) => {
    setSelected(id);
    setProtocol([]);
    setLoading(true);
    try {
      const r = await api.get(`/events/${id}/protocol`);
      setProtocol(r.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setProtocol([]);
        // No mostramos error toast — simplemente no hay acceso al protocolo
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedEvent = events.find(e => e.id === selected);
  const canViewProtocol = hasPermission('PROTOCOL_VIEW');

  if (loading && events.length === 0) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    </Layout>
  );

  if (noPermission) return (
    <Layout>
      <div className="card text-center py-20">
        <Lock size={48} className="text-stone-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-stone-800 mb-2">Sin acceso</h2>
        <p className="text-stone-500">Tu puesto no tiene permisos para acceder a esta sección.</p>
      </div>
    </Layout>
  );

  if (events.length === 0) return (
    <Layout>
      <div className="card text-center py-20">
        <Music2 size={48} className="text-stone-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-stone-800 mb-2">Sin eventos asignados</h2>
        <p className="text-stone-500">Cuando te asignen a un evento, aparecerá aquí.</p>
      </div>
    </Layout>
  );

  const TimelineView = () => (
    <div className={fullscreen ? 'fixed inset-0 z-50 bg-gray-950 overflow-y-auto p-4 sm:p-8' : ''}>
      {fullscreen && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Music2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">{selectedEvent?.clientName}</h1>
              <p className="text-gray-400 text-sm">{selectedEvent?.typeLabel}</p>
            </div>
          </div>
          <button onClick={() => setFullscreen(false)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 text-sm">
            <Minimize2 size={16} /> Salir pantalla completa
          </button>
        </div>
      )}

      {/* Sin permiso de protocolo */}
      {!canViewProtocol && (
        <div className={`${fullscreen ? 'bg-gray-800 rounded-2xl' : 'card'} text-center py-16`}>
          <Lock size={40} className={`${fullscreen ? 'text-gray-600' : 'text-stone-300'} mx-auto mb-4`} />
          <p className={`font-medium ${fullscreen ? 'text-gray-400' : 'text-stone-500'}`}>
            Tu puesto no tiene permiso para ver el protocolo.
          </p>
        </div>
      )}

      {canViewProtocol && protocol.length === 0 && (
        <div className={`${fullscreen ? 'bg-gray-800 rounded-2xl' : 'card'} text-center py-16`}>
          <Music2 size={40} className={`${fullscreen ? 'text-gray-600' : 'text-stone-300'} mx-auto mb-4`} />
          <p className={`font-medium ${fullscreen ? 'text-gray-400' : 'text-stone-500'}`}>
            El protocolo aún no está definido para este evento.
          </p>
        </div>
      )}

      {canViewProtocol && protocol.length > 0 && (
        <div className="space-y-3">
          {protocol.map((item, i) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="relative flex gap-4"
            >
              {i < protocol.length - 1 && (
                <div className={`absolute left-6 top-14 bottom-0 w-px ${fullscreen ? 'bg-gray-700' : 'bg-stone-100'}`}
                  style={{ height: 'calc(100% - 3.5rem)' }} />
              )}
              <div className="flex-none w-12 flex flex-col items-center pt-1">
                {item.eventTime ? (
                  <div className={`text-center px-1 py-1.5 rounded-xl min-w-full ${fullscreen ? 'bg-blue-900/50 border border-blue-700' : 'bg-blue-50 border border-blue-100'}`}>
                    <span className={`text-xs font-bold leading-none ${fullscreen ? 'text-blue-300' : 'text-blue-700'}`}>{item.eventTime}</span>
                  </div>
                ) : (
                  <div className={`w-3 h-3 rounded-full border-2 mt-3 ${fullscreen ? 'border-gray-600 bg-gray-800' : 'border-stone-200 bg-white'}`} />
                )}
              </div>
              <div className={`flex-1 rounded-2xl p-4 mb-3 border transition-all ${
                item.youtubeLink
                  ? fullscreen ? 'bg-blue-900/30 border-blue-700/50' : 'bg-blue-50/80 border-blue-100'
                  : fullscreen ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-stone-100 shadow-sm'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className={`font-bold text-base leading-snug ${fullscreen ? 'text-white' : 'text-stone-900'}`}>{item.description}</p>
                    {item.involvedPerson && (
                      <div className={`flex items-center gap-1.5 mt-1.5 text-sm ${fullscreen ? 'text-gray-400' : 'text-stone-500'}`}>
                        <UserRound size={13} />{item.involvedPerson}
                      </div>
                    )}
                    {item.observations && (
                      <p className={`text-sm mt-2 italic ${fullscreen ? 'text-gray-500' : 'text-stone-400'}`}>{item.observations}</p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg flex-none ${fullscreen ? 'bg-gray-700 text-gray-400' : 'bg-stone-100 text-stone-500'}`}>#{i + 1}</span>
                </div>
                {item.youtubeLink && (
                  <a href={item.youtubeLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                    <Play size={14} className="fill-current" /> Abrir en YouTube
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Music2 size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Vista DJ</h1>
              <p className="text-stone-500 text-sm">Protocolo y canciones del evento</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedEvent && canViewProtocol && (
              <PdfDownloadButton
                permissionCode="PROTOCOL_VIEW"
                label="Descargar protocolo PDF"
                variant="primary"
                fileName={`protocolo-${(selectedEvent?.clientName || 'evento').replace(/\s+/g, '-').toLowerCase()}.pdf`}
                fetchData={async () => {
                  const r = await api.get(`/events/${selected}/protocol`);
                  return { event: selectedEvent, protocol: r.data };
                }}
                DocumentComponent={ProtocolPdfDoc}
              />
            )}
            {canViewProtocol && protocol.length > 0 && (
              <button onClick={() => setFullscreen(true)} className="btn-secondary text-sm">
                <Maximize2 size={15} /> Pantalla completa
              </button>
            )}
          </div>
        </div>

        {events.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {events.map(e => (
              <button key={e.id} onClick={() => loadEvent(e.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  selected === e.id ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-stone-600 border-stone-200 hover:border-blue-200'
                }`}>
                {e.clientName}
                <span className="ml-1.5 opacity-70 text-xs">{new Date(e.eventDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
              </button>
            ))}
          </div>
        )}

        {selectedEvent && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-200">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide mb-1">{selectedEvent.typeLabel}</p>
                <h2 className="text-xl font-bold">{selectedEvent.clientName}</h2>
              </div>
              {selectedEvent.daysUntilEvent >= 0 && selectedEvent.daysUntilEvent <= 7 && (
                <div className="bg-white/20 rounded-xl px-3 py-1.5 text-center flex-none">
                  <p className="text-xs text-blue-200">Faltan</p>
                  <p className="text-2xl font-black">{selectedEvent.daysUntilEvent}</p>
                  <p className="text-xs text-blue-200">días</p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-blue-100">
              <span className="flex items-center gap-1.5"><Calendar size={14} />{new Date(selectedEvent.eventDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {selectedEvent.venue && <span className="flex items-center gap-1.5"><MapPin size={14} />{selectedEvent.venue}</span>}
              {selectedEvent.estimatedGuests && <span className="flex items-center gap-1.5"><Users size={14} />{selectedEvent.estimatedGuests} invitados</span>}
            </div>
          </motion.div>
        )}

        {canViewProtocol && protocol.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-stone-400" />
              <span className="text-sm font-medium text-stone-600">{protocol.length} momentos en el protocolo</span>
            </div>
            <PdfDownloadButton
              permissionCode="PROTOCOL_VIEW"
              label="Descargar protocolo PDF"
              fileName={`protocolo-${(selectedEvent?.clientName || 'evento').replace(/\s+/g, '-').toLowerCase()}.pdf`}
              fetchData={async () => {
                const r = await api.get(`/events/${selected}/protocol`);
                return { event: selectedEvent, protocol: r.data };
              }}
              DocumentComponent={ProtocolPdfDoc}
            />
          </div>
        )}

        <TimelineView />
      </div>
    </Layout>
  );
}
