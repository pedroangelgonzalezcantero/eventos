import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import EventCard from '../../components/EventCard';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const STATUSES = ['',  'PENDIENTE_INFO', 'EN_CURSO', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO'];
const STATUS_LABELS = { '': 'Todos', PENDIENTE_INFO: 'Pendiente', EN_CURSO: 'En curso', CONFIRMADO: 'Confirmado', COMPLETADO: 'Completado', CANCELADO: 'Cancelado' };

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/events')
      .then(r => setEvents(r.data))
      .catch(() => toast.error('Error cargando eventos'));
  }, []);

  const filtered = events.filter(e =>
    (filter === '' || e.status === filter) &&
    (search === '' || e.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (e.venue || '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
          <button onClick={() => navigate('/admin/eventos/nuevo')} className="btn-primary">
            + Nuevo Evento
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input className="input sm:w-64" placeholder="Buscar cliente o salon..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-rose-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de eventos */}
        {filtered.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-4xl mb-4">📅</p>
            <p className="text-gray-500">No hay eventos que mostrar</p>
            <button onClick={() => navigate('/admin/eventos/nuevo')} className="btn-primary mt-4">
              Crear primer evento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(e => (
              <EventCard key={e.id} event={e} onClick={() => navigate(`/admin/eventos/${e.id}`)} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

