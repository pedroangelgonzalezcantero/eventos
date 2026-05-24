import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar, Users, MapPin, List, CalendarDays } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

// Colores por tipo de evento
const TYPE_STYLES = {
  BODA:       { bg: 'bg-amber-500',   light: 'bg-amber-50  border-amber-200  text-amber-900',  dot: 'bg-amber-500',     badge: 'bg-amber-100  text-amber-800'  },
  COMUNION:   { bg: 'bg-blue-500',    light: 'bg-blue-50   border-blue-200   text-blue-900',   dot: 'bg-blue-500',      badge: 'bg-blue-100   text-blue-800'   },
  BAUTIZO:    { bg: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200 text-emerald-900', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800' },
  CUMPLEANOS: { bg: 'bg-pink-500',    light: 'bg-pink-50   border-pink-200   text-pink-900',   dot: 'bg-pink-500',      badge: 'bg-pink-100   text-pink-800'   },
  ANIVERSARIO:{ bg: 'bg-rose-500',    light: 'bg-rose-50   border-rose-200   text-rose-900',   dot: 'bg-rose-500',      badge: 'bg-rose-100   text-rose-800'   },
  EMPRESA:    { bg: 'bg-slate-500',   light: 'bg-slate-50  border-slate-200  text-slate-900',  dot: 'bg-slate-500',     badge: 'bg-slate-100  text-slate-800'  },
  PRIVADO:    { bg: 'bg-violet-500',  light: 'bg-violet-50 border-violet-200 text-violet-900', dot: 'bg-violet-500',    badge: 'bg-violet-100 text-violet-800' },
  OTRO:       { bg: 'bg-stone-400',   light: 'bg-stone-50  border-stone-200  text-stone-900',  dot: 'bg-stone-400',     badge: 'bg-stone-100  text-stone-700'  },
};

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_ES = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];
const VIEWS = ['monthly', 'weekly', 'agenda'];

export default function CalendarView() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('monthly');
  const [current, setCurrent] = useState(new Date());
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const year = current.getFullYear();
  const month = current.getMonth(); // 0-indexed

  useEffect(() => {
    const fetchMonth = view === 'agenda' ? null : { year, month: month + 1 };
    let url = '/events/calendar';
    if (fetchMonth) url += `?year=${fetchMonth.year}&month=${fetchMonth.month}`;
    if (filterType) url += `${url.includes('?') ? '&' : '?'}type=${filterType}`;
    if (filterStatus) url += `${url.includes('?') ? '&' : '?'}status=${filterStatus}`;

    setLoading(true);
    api.get(url)
      .then(r => setEvents(r.data))
      .catch(() => toast.error('Error cargando el calendario'))
      .finally(() => setLoading(false));
  }, [year, month, view, filterType, filterStatus]);

  const prev = () => {
    const d = new Date(current);
    if (view === 'weekly') d.setDate(d.getDate() - 7);
    else if (view === 'monthly') d.setMonth(d.getMonth() - 1);
    else d.setFullYear(d.getFullYear() - 1);
    setCurrent(d);
  };

  const next = () => {
    const d = new Date(current);
    if (view === 'weekly') d.setDate(d.getDate() + 7);
    else if (view === 'monthly') d.setMonth(d.getMonth() + 1);
    else d.setFullYear(d.getFullYear() + 1);
    setCurrent(d);
  };

  const goToday = () => setCurrent(new Date());

  const eventsOnDay = (dateStr) => events.filter(e => e.eventDate === dateStr);

  const titleLabel = view === 'monthly'
    ? `${MONTHS_ES[month]} ${year}`
    : view === 'weekly'
    ? `Semana del ${getWeekStart(current).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
    : `Agenda ${year}`;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Calendario de Eventos</h1>
            <p className="text-stone-500 text-sm mt-0.5">Vista visual de la ocupación del salón</p>
          </div>
          <button onClick={() => navigate('/admin/eventos/nuevo')} className="btn-primary">
            <Plus size={16} /> Nuevo Evento
          </button>
        </div>

        {/* Controles */}
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Navegación */}
            <div className="flex items-center gap-2">
              <button onClick={prev} className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors"><ChevronLeft size={18} /></button>
              <button onClick={goToday} className="px-3 py-1.5 text-sm font-medium bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 transition-colors">Hoy</button>
              <button onClick={next} className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors"><ChevronRight size={18} /></button>
              <span className="font-semibold text-stone-900 ml-1 min-w-[160px]">{titleLabel}</span>
            </div>

            {/* Vista */}
            <div className="flex gap-1 ml-auto">
              {[['monthly','Mes',CalendarDays],['weekly','Semana',Calendar],['agenda','Agenda',List]].map(([v, label, Icon]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${view === v ? 'bg-rose-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-stone-100">
            <select className="input text-sm py-1.5 w-auto" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">Todos los tipos</option>
              {Object.entries(TYPE_STYLES).map(([k]) => <option key={k} value={k}>{k.charAt(0) + k.slice(1).toLowerCase()}</option>)}
            </select>
            <select className="input text-sm py-1.5 w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Todos los estados</option>
              {['BORRADOR','PENDIENTE_INFO','EN_CURSO','CONFIRMADO','COMPLETADO','CANCELADO'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            {/* Leyenda */}
            <div className="flex flex-wrap gap-2 ml-auto">
              {[['BODA','Boda'],['COMUNION','Comunión'],['BAUTIZO','Bautizo'],['PRIVADO','Privado']].map(([k, label]) => (
                <span key={k} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${TYPE_STYLES[k].light}`}>
                  <span className={`w-2 h-2 rounded-full flex-none ${TYPE_STYLES[k].dot}`} />{label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Calendario */}
        {loading ? (
          <div className="card flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={`${view}-${month}-${year}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {view === 'monthly' && <MonthView year={year} month={month} events={events} eventsOnDay={eventsOnDay} onEventClick={id => navigate(`/admin/eventos/${id}`)} onCreateDay={d => navigate('/admin/eventos/nuevo')} />}
              {view === 'weekly' && <WeekView current={current} events={events} eventsOnDay={eventsOnDay} onEventClick={id => navigate(`/admin/eventos/${id}`)} />}
              {view === 'agenda' && <AgendaView events={events} onEventClick={id => navigate(`/admin/eventos/${id}`)} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </Layout>
  );
}

// ── Vista mensual ─────────────────────────────────────────────────────────────
function MonthView({ year, month, events, eventsOnDay, onEventClick, onCreateDay }) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // 0=lunes
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Generar celdas: días previos + días del mes
  const cells = [];
  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, -(startDow - i - 1));
    cells.push({ date: d, currentMonth: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), currentMonth: true });
  }
  // Completar hasta múltiplo de 7
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    cells.push({ date: next, currentMonth: false });
  }

  return (
    <div className="card overflow-hidden">
      {/* Cabecera días semana */}
      <div className="grid grid-cols-7 border-b border-stone-100">
        {DAYS_ES.map(d => (
          <div key={d} className="py-2.5 text-center text-xs font-semibold text-stone-500">{d}</div>
        ))}
      </div>
      {/* Celdas */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const dateStr = cell.date.toISOString().split('T')[0];
          const dayEvents = eventsOnDay(dateStr);
          const isToday = dateStr === todayStr;
          const isCurrentMonth = cell.currentMonth;
          return (
            <div key={i} onClick={() => onCreateDay(dateStr)}
              className={`min-h-[90px] p-1.5 border-b border-r border-stone-100 cursor-pointer transition-colors hover:bg-stone-50 ${!isCurrentMonth ? 'bg-stone-50/50' : ''}`}>
              <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${isToday ? 'bg-rose-600 text-white font-bold' : !isCurrentMonth ? 'text-stone-300' : 'text-stone-700'}`}>
                {cell.date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(ev => {
                  const s = TYPE_STYLES[ev.type] || TYPE_STYLES.OTRO;
                  return (
                    <button key={ev.id} onClick={e => { e.stopPropagation(); onEventClick(ev.id); }}
                      className={`w-full text-left text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate border ${s.light} hover:opacity-80 transition-opacity`}>
                      {ev.clientName}
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-stone-400 font-medium pl-1">+{dayEvents.length - 3} más</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Vista semanal ─────────────────────────────────────────────────────────────
function WeekView({ current, events, eventsOnDay, onEventClick }) {
  const weekStart = getWeekStart(current);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 divide-x divide-stone-100">
        {days.map(day => {
          const dateStr = day.toISOString().split('T')[0];
          const dayEvents = eventsOnDay(dateStr);
          const isToday = dateStr === todayStr;
          return (
            <div key={dateStr} className="min-h-[140px]">
              <div className={`p-3 text-center border-b border-stone-100 ${isToday ? 'bg-rose-600' : 'bg-stone-50'}`}>
                <p className={`text-xs font-semibold ${isToday ? 'text-rose-200' : 'text-stone-500'}`}>{DAYS_ES[day.getDay() === 0 ? 6 : day.getDay() - 1]}</p>
                <p className={`text-lg font-bold ${isToday ? 'text-white' : 'text-stone-900'}`}>{day.getDate()}</p>
              </div>
              <div className="p-1.5 space-y-1">
                {dayEvents.map(ev => {
                  const s = TYPE_STYLES[ev.type] || TYPE_STYLES.OTRO;
                  return (
                    <button key={ev.id} onClick={() => onEventClick(ev.id)}
                      className={`w-full text-left p-2 rounded-xl border text-xs font-semibold ${s.light} hover:opacity-80 transition-opacity`}>
                      <div className="truncate">{ev.clientName}</div>
                      <div className="opacity-70 font-normal truncate">{ev.typeLabel}</div>
                    </button>
                  );
                })}
                {dayEvents.length === 0 && <p className="text-[10px] text-stone-300 text-center py-4">Libre</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Vista agenda ──────────────────────────────────────────────────────────────
function AgendaView({ events, onEventClick }) {
  if (events.length === 0) return (
    <div className="card text-center py-16">
      <Calendar size={40} className="text-stone-300 mx-auto mb-3" />
      <p className="text-stone-500">No hay eventos que mostrar</p>
    </div>
  );

  // Agrupar por mes
  const grouped = events.reduce((acc, ev) => {
    const key = ev.eventDate.substring(0, 7); // YYYY-MM
    (acc[key] = acc[key] || []).push(ev);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([monthKey, monthEvents]) => {
        const [y, m] = monthKey.split('-');
        return (
          <div key={monthKey}>
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-3">
              {MONTHS_ES[parseInt(m) - 1]} {y}
            </h3>
            <div className="space-y-2">
              {monthEvents.sort((a, b) => a.eventDate.localeCompare(b.eventDate)).map(ev => {
                const s = TYPE_STYLES[ev.type] || TYPE_STYLES.OTRO;
                const date = new Date(ev.eventDate + 'T00:00:00');
                return (
                  <motion.button key={ev.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    onClick={() => onEventClick(ev.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left hover:opacity-90 transition-all ${s.light}`}>
                    <div className={`w-12 h-12 ${s.bg} rounded-xl flex flex-col items-center justify-center text-white flex-none shadow-sm`}>
                      <span className="text-xs font-semibold leading-none">{MONTHS_ES[date.getMonth()].substring(0, 3).toUpperCase()}</span>
                      <span className="text-xl font-bold leading-none">{date.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-stone-900 text-base">{ev.clientName}</p>
                        <span className={`badge text-xs ${s.badge}`}>{ev.typeLabel}</span>
                        {ev.daysUntilEvent === 0 && <span className="badge bg-emerald-100 text-emerald-700">¡Hoy!</span>}
                        {ev.daysUntilEvent > 0 && ev.daysUntilEvent <= 7 && <span className="badge bg-rose-100 text-rose-700">{ev.daysUntilEvent}d</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-stone-500">
                        {ev.venue && <span className="flex items-center gap-1"><MapPin size={11} />{ev.venue}</span>}
                        {ev.estimatedGuests && <span className="flex items-center gap-1"><Users size={11} />{ev.estimatedGuests} pax</span>}
                        {ev.djName && <span>🎧 {ev.djName}</span>}
                        {ev.maitreName && <span>🍽 {ev.maitreName}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end flex-none">
                      <span className={`badge text-xs ${ev.statusLabel === 'Confirmado' ? 'bg-violet-100 text-violet-700' : ev.statusLabel === 'Completado' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>{ev.statusLabel}</span>
                      <div className="flex gap-1 mt-1">
                        <span className={`w-2 h-2 rounded-full ${ev.menuConfirmed ? 'bg-emerald-400' : 'bg-stone-200'}`} title="Menú" />
                        <span className={`w-2 h-2 rounded-full ${ev.protocolCompleted ? 'bg-emerald-400' : 'bg-stone-200'}`} title="Protocolo" />
                        <span className={`w-2 h-2 rounded-full ${ev.allergensCompleted ? 'bg-emerald-400' : 'bg-stone-200'}`} title="Alérgenos" />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Utilidades ────────────────────────────────────────────────────────────────
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day); // Lunes como primer día
  d.setDate(d.getDate() + diff);
  return d;
}

