import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Users, AlertTriangle, TrendingUp, Plus,
  ChevronRight, Clock, CheckCircle, Circle, ArrowRight
} from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  BORRADOR: 'bg-stone-100 text-stone-600',
  PENDIENTE_INFO: 'bg-amber-100 text-amber-700',
  EN_CURSO: 'bg-blue-100 text-blue-700',
  CONFIRMADO: 'bg-violet-100 text-violet-700',
  COMPLETADO: 'bg-emerald-100 text-emerald-700',
  CANCELADO: 'bg-red-100 text-red-600',
};

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/events'),
      api.get('/dashboard/stats'),
    ]).then(([eventsRes, statsRes]) => {
      setEvents(eventsRes.data);
      setStats(statsRes.data);
    }).catch(() => toast.error('Error cargando datos'))
      .finally(() => setLoading(false));
  }, []);

  const active = events.filter(e => !['COMPLETADO', 'CANCELADO'].includes(e.status));
  const upcoming30 = events.filter(e => e.daysUntilEvent >= 0 && e.daysUntilEvent <= 30 && !['COMPLETADO', 'CANCELADO'].includes(e.status));
  const needsAttention = events.filter(e => (!e.menuConfirmed || !e.allergensCompleted || !e.protocolCompleted) && !['COMPLETADO', 'CANCELADO'].includes(e.status));

  const statCards = [
    { label: 'Total eventos', value: events.length, icon: Calendar, color: 'bg-violet-500', light: 'bg-violet-50 text-violet-700' },
    { label: 'Eventos activos', value: active.length, icon: TrendingUp, color: 'bg-blue-500', light: 'bg-blue-50 text-blue-700' },
    { label: 'Próximos 30 días', value: upcoming30.length, icon: Clock, color: 'bg-rose-500', light: 'bg-rose-50 text-rose-700' },
    { label: 'Atención requerida', value: needsAttention.length, icon: AlertTriangle, color: 'bg-amber-500', light: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
            <p className="text-stone-500 text-sm mt-0.5">Resumen general del salón</p>
          </div>
          <button onClick={() => navigate('/admin/eventos/nuevo')} className="btn-primary">
            <Plus size={16} /> Nuevo Evento
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="card p-5"
              >
                <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={18} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-stone-900">{loading ? '—' : s.value}</p>
                <p className="text-sm text-stone-500 mt-0.5">{s.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Alerts: events needing attention */}
        {!loading && needsAttention.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="card border-amber-200 bg-amber-50/80 p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-amber-600" />
                <h2 className="font-semibold text-amber-900">Eventos con información pendiente</h2>
                <span className="badge bg-amber-200 text-amber-800 ml-auto">{needsAttention.length}</span>
              </div>
              <div className="space-y-2">
                {needsAttention.slice(0, 5).map(e => (
                  <button key={e.id} onClick={() => navigate(`/admin/eventos/${e.id}`)}
                    className="w-full flex items-center justify-between p-3 bg-white rounded-xl hover:shadow-sm transition-all text-left border border-amber-100">
                    <div>
                      <p className="font-medium text-sm text-stone-900">{e.clientName}</p>
                      <p className="text-xs text-stone-500">{e.typeLabel} · {new Date(e.eventDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!e.menuConfirmed && <span className="badge bg-amber-100 text-amber-700">Menú</span>}
                      {!e.allergensCompleted && <span className="badge bg-amber-100 text-amber-700">Alérgenos</span>}
                      {!e.protocolCompleted && <span className="badge bg-amber-100 text-amber-700">Protocolo</span>}
                      <ChevronRight size={14} className="text-stone-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Upcoming events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Eventos</h2>
            <button onClick={() => navigate('/admin/eventos')} className="text-sm text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1">
              Ver todos <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-44 bg-stone-100 border-none" />)}
            </div>
          ) : events.length === 0 ? (
            <div className="card text-center py-16">
              <Calendar size={40} className="text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500 font-medium">No hay eventos todavía</p>
              <button onClick={() => navigate('/admin/eventos/nuevo')} className="btn-primary mt-4 mx-auto">Crear primer evento</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.slice(0, 6).map((e, i) => (
                <motion.div key={e.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  onClick={() => navigate(`/admin/eventos/${e.id}`)}
                  className="card-hover group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`badge ${STATUS_COLORS[e.status]}`}>{e.statusLabel}</span>
                    {e.daysUntilEvent >= 0 && e.daysUntilEvent <= 30 && (
                      <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">
                        {e.daysUntilEvent === 0 ? '¡HOY!' : `${e.daysUntilEvent}d`}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-stone-900 mb-1 group-hover:text-rose-700 transition-colors">{e.clientName}</h3>
                  <p className="text-sm text-stone-500 mb-3">{e.typeLabel}</p>
                  <div className="flex items-center gap-1 text-xs text-stone-400 mb-4">
                    <Calendar size={12} />
                    {new Date(e.eventDate).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {e.estimatedGuests && (
                      <><span className="mx-1">·</span><Users size={12} />{e.estimatedGuests}</>
                    )}
                  </div>
                  {/* Completion mini-bar */}
                  <div className="flex gap-1.5">
                    {([
                      { ok: e.menuConfirmed, label: 'M' },
                      { ok: e.allergensCompleted, label: 'A' },
                      { ok: e.protocolCompleted, label: 'P' },
                      { ok: e.budgetSigned, label: '€' },
                    ]).map(item => (
                      <div key={item.label} className={`flex items-center gap-1 text-xs ${item.ok ? 'text-emerald-600' : 'text-stone-300'}`}>
                        {item.ok ? <CheckCircle size={12} /> : <Circle size={12} />}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
