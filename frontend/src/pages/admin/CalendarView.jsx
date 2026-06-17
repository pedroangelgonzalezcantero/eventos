import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar, Users, MapPin, List, CalendarDays, Phone } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import AppointmentModal from '../../components/AppointmentModal';
import toast from 'react-hot-toast';

// ── Colores por tipo de evento ─────────────────────────────────────────────────
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

// ── Paleta de colores para trabajadoras ───────────────────────────────────────
const WORKER_PALETTE = [
  { bg: 'bg-cyan-500',    light: 'bg-cyan-50    border-cyan-200    text-cyan-900',    dot: 'bg-cyan-500',    badge: 'bg-cyan-100    text-cyan-800'    },
  { bg: 'bg-teal-500',    light: 'bg-teal-50    border-teal-200    text-teal-900',    dot: 'bg-teal-500',    badge: 'bg-teal-100    text-teal-800'    },
  { bg: 'bg-indigo-500',  light: 'bg-indigo-50  border-indigo-200  text-indigo-900',  dot: 'bg-indigo-500',  badge: 'bg-indigo-100  text-indigo-800'  },
  { bg: 'bg-fuchsia-500', light: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-900', dot: 'bg-fuchsia-500', badge: 'bg-fuchsia-100 text-fuchsia-800' },
  { bg: 'bg-orange-500',  light: 'bg-orange-50  border-orange-200  text-orange-900',  dot: 'bg-orange-500',  badge: 'bg-orange-100  text-orange-800'  },
  { bg: 'bg-lime-600',    light: 'bg-lime-50    border-lime-200    text-lime-900',    dot: 'bg-lime-600',    badge: 'bg-lime-100    text-lime-800'    },
  { bg: 'bg-purple-500',  light: 'bg-purple-50  border-purple-200  text-purple-900',  dot: 'bg-purple-500',  badge: 'bg-purple-100  text-purple-800'  },
  { bg: 'bg-sky-500',     light: 'bg-sky-50     border-sky-200     text-sky-900',     dot: 'bg-sky-500',     badge: 'bg-sky-100     text-sky-800'     },
];

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_ES   = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

// ── Utilidades ────────────────────────────────────────────────────────────────
/** Fecha en "YYYY-MM-DD" en hora LOCAL (evita el desfase UTC+N de toISOString) */
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function CalendarView() {
  const navigate = useNavigate();
  const [events,       setEvents]       = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [view,         setView]         = useState('monthly');
  const [current,      setCurrent]      = useState(new Date());
  const [filterType,   setFilterType]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal de citas
  const [apptModal,    setApptModal]    = useState(false);
  const [apptEdit,     setApptEdit]     = useState(null);
  const [apptInitDate, setApptInitDate] = useState(null);

  const year  = current.getFullYear();
  const month = current.getMonth();

  // Mapa workerId → color (estable por session)
  const workerColorMap = useMemo(() => {
    const ids = [...new Set(appointments.map(a => a.workerId))].sort((a, b) => a - b);
    const map = {};
    ids.forEach((id, idx) => { map[id] = WORKER_PALETTE[idx % WORKER_PALETTE.length]; });
    return map;
  }, [appointments]);

  const workerColor = useCallback((workerId) => workerColorMap[workerId] || WORKER_PALETTE[0], [workerColorMap]);

  // ── Carga de datos ───────────────────────────────────────────────────────────
  const fetchData = useCallback(() => {
    const fetchMonth = view === 'agenda' ? null : { year, month: month + 1 };
    let url = '/events/calendar';
    if (fetchMonth) url += `?year=${fetchMonth.year}&month=${fetchMonth.month}`;
    if (filterType)   url += `${url.includes('?') ? '&' : '?'}type=${filterType}`;
    if (filterStatus) url += `${url.includes('?') ? '&' : '?'}status=${filterStatus}`;

    let apptUrl = '/appointments/calendar';
    if (fetchMonth) apptUrl += `?year=${fetchMonth.year}&month=${fetchMonth.month}`;
    else            apptUrl += `?year=${year}`;

    setLoading(true);
    Promise.all([api.get(url), api.get(apptUrl)])
      .then(([evR, apR]) => { setEvents(evR.data); setAppointments(apR.data); })
      .catch(() => toast.error('Error cargando el calendario'))
      .finally(() => setLoading(false));
  }, [year, month, view, filterType, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Navegación ───────────────────────────────────────────────────────────────
  const prev = () => {
    const d = new Date(current);
    if (view === 'weekly')       d.setDate(d.getDate() - 7);
    else if (view === 'monthly') d.setMonth(d.getMonth() - 1);
    else                         d.setFullYear(d.getFullYear() - 1);
    setCurrent(d);
  };
  const next = () => {
    const d = new Date(current);
    if (view === 'weekly')       d.setDate(d.getDate() + 7);
    else if (view === 'monthly') d.setMonth(d.getMonth() + 1);
    else                         d.setFullYear(d.getFullYear() + 1);
    setCurrent(d);
  };
  const goToday = () => setCurrent(new Date());

  // ── Helpers por día ──────────────────────────────────────────────────────────
  const eventsOnDay   = (dateStr) => events.filter(e => e.eventDate === dateStr);
  const appointsOnDay = (dateStr) => appointments.filter(a => a.appointmentDate === dateStr);

  // ── Handlers modal ───────────────────────────────────────────────────────────
  const openNewAppt  = (dateStr = null) => { setApptEdit(null); setApptInitDate(dateStr); setApptModal(true); };
  const openEditAppt = (appt) => { setApptEdit(appt); setApptInitDate(null); setApptModal(true); };

  const handleApptSaved = (saved) => {
    setAppointments(prev => {
      const exists = prev.find(a => a.id === saved.id);
      return exists ? prev.map(a => a.id === saved.id ? saved : a) : [...prev, saved];
    });
  };
  const handleApptDeleted = (id) => setAppointments(prev => prev.filter(a => a.id !== id));

  // ── Leyenda trabajadoras ─────────────────────────────────────────────────────
  const workerLegend = useMemo(() => {
    const seen = new Map();
    appointments.forEach(a => { if (!seen.has(a.workerId)) seen.set(a.workerId, a.workerName); });
    return [...seen.entries()].map(([id, name]) => ({ id, name, color: workerColorMap[id] || WORKER_PALETTE[0] }));
  }, [appointments, workerColorMap]);

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
            <h1 className="text-2xl font-bold text-stone-900">Calendario</h1>
            <p className="text-stone-500 text-sm mt-0.5">Eventos del salón y citas telefónicas</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => openNewAppt()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-sm font-semibold hover:bg-rose-100 transition-colors">
              <Phone size={14} /> Nueva cita
            </button>
            <button onClick={() => navigate('/admin/eventos/nuevo')} className="btn-primary">
              <Plus size={16} /> Nuevo Evento
            </button>
          </div>
        </div>

        {/* Controles */}
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <button onClick={prev} className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors"><ChevronLeft size={18} /></button>
              <button onClick={goToday} className="px-3 py-1.5 text-sm font-medium bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 transition-colors">Hoy</button>
              <button onClick={next} className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors"><ChevronRight size={18} /></button>
              <span className="font-semibold text-stone-900 ml-1 min-w-[160px]">{titleLabel}</span>
            </div>
            <div className="flex gap-1 ml-auto">
              {[['monthly','Mes',CalendarDays],['weekly','Semana',Calendar],['agenda','Agenda',List]].map(([v, label, Icon]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${view === v ? 'bg-rose-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-stone-100">
            <select className="input text-sm py-1.5 w-auto" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">Todos los tipos</option>
              {Object.entries(TYPE_STYLES).map(([k]) => <option key={k} value={k}>{k.charAt(0) + k.slice(1).toLowerCase()}</option>)}
            </select>
            <select className="input text-sm py-1.5 w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Todos los estados</option>
              {['BORRADOR','PENDIENTE_INFO','EN_CURSO','CONFIRMADO','COMPLETADO','CANCELADO'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <div className="flex flex-wrap gap-2 ml-auto items-center">
              {[['BODA','Boda'],['COMUNION','Comunión'],['BAUTIZO','Bautizo'],['PRIVADO','Privado']].map(([k, label]) => (
                <span key={k} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${TYPE_STYLES[k].light}`}>
                  <span className={`w-2 h-2 rounded-full flex-none ${TYPE_STYLES[k].dot}`} />{label}
                </span>
              ))}
              {workerLegend.map(w => (
                <span key={w.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${w.color.light}`}>
                  <Phone size={10} className="flex-none" />{w.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Vistas */}
        {loading ? (
          <div className="card flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={`${view}-${month}-${year}`}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {view === 'monthly' && (
                <MonthView year={year} month={month}
                  eventsOnDay={eventsOnDay} appointsOnDay={appointsOnDay}
                  workerColor={workerColor}
                  onEventClick={id => navigate(`/admin/eventos/${id}`)}
                  onDayClick={openNewAppt}
                  onApptClick={openEditAppt} />
              )}
              {view === 'weekly' && (
                <WeekView current={current}
                  eventsOnDay={eventsOnDay} appointsOnDay={appointsOnDay}
                  workerColor={workerColor}
                  onEventClick={id => navigate(`/admin/eventos/${id}`)}
                  onDayClick={openNewAppt}
                  onApptClick={openEditAppt} />
              )}
              {view === 'agenda' && (
                <AgendaView events={events} appointments={appointments}
                  workerColor={workerColor}
                  onEventClick={id => navigate(`/admin/eventos/${id}`)}
                  onApptClick={openEditAppt} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <AppointmentModal
        open={apptModal}
        onClose={() => setApptModal(false)}
        onSaved={handleApptSaved}
        onDeleted={handleApptDeleted}
        initialDate={apptInitDate}
        appointment={apptEdit}
      />
    </Layout>
  );
}

// ── Vista mensual ──────────────────────────────────────────────────────────────
function MonthView({ year, month, eventsOnDay, appointsOnDay, workerColor, onEventClick, onDayClick, onApptClick }) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const todayStr = localDateStr(new Date());

  const cells = [];
  for (let i = 0; i < startDow; i++) {
    cells.push({ date: new Date(year, month, -(startDow - i - 1)), currentMonth: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), currentMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last); next.setDate(next.getDate() + 1);
    cells.push({ date: next, currentMonth: false });
  }

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-stone-100">
        {DAYS_ES.map(d => (
          <div key={d} className="py-2.5 text-center text-xs font-semibold text-stone-500">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const dateStr  = localDateStr(cell.date);
          const dayEvs   = eventsOnDay(dateStr);
          const dayAppts = appointsOnDay(dateStr);
          const total    = dayEvs.length + dayAppts.length;
          const isToday  = dateStr === todayStr;
          return (
            <div key={i} onClick={() => onDayClick(dateStr)}
              className={`min-h-[90px] p-1.5 border-b border-r border-stone-100 cursor-pointer transition-colors hover:bg-stone-50 ${!cell.currentMonth ? 'bg-stone-50/50' : ''}`}>
              <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${isToday ? 'bg-rose-600 text-white font-bold' : !cell.currentMonth ? 'text-stone-300' : 'text-stone-700'}`}>
                {cell.date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvs.slice(0, 2).map(ev => {
                  const s = TYPE_STYLES[ev.type] || TYPE_STYLES.OTRO;
                  return (
                    <button key={`ev-${ev.id}`} onClick={e => { e.stopPropagation(); onEventClick(ev.id); }}
                      className={`w-full text-left text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate border ${s.light} hover:opacity-80 transition-opacity`}>
                      {ev.clientName}
                    </button>
                  );
                })}
                {dayAppts.slice(0, Math.max(0, 3 - dayEvs.length)).map(ap => {
                  const s = workerColor(ap.workerId);
                  return (
                    <button key={`ap-${ap.id}`} onClick={e => { e.stopPropagation(); onApptClick(ap); }}
                      className={`w-full text-left text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate border ${s.light} hover:opacity-80 transition-opacity`}>
                      <Phone size={8} className="inline mr-0.5 opacity-60" />{ap.clientName}
                    </button>
                  );
                })}
                {total > 3 && <p className="text-[10px] text-stone-400 font-medium pl-1">+{total - 3} más</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Vista semanal ──────────────────────────────────────────────────────────────
function WeekView({ current, eventsOnDay, appointsOnDay, workerColor, onEventClick, onDayClick, onApptClick }) {
  const weekStart = getWeekStart(current);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  });
  const todayStr = localDateStr(new Date());

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 divide-x divide-stone-100">
        {days.map(day => {
          const dateStr  = localDateStr(day);
          const dayEvs   = eventsOnDay(dateStr);
          const dayAppts = appointsOnDay(dateStr);
          const isToday  = dateStr === todayStr;
          return (
            <div key={dateStr} className="min-h-[160px]">
              <div className={`p-3 text-center border-b border-stone-100 cursor-pointer hover:opacity-90 transition-opacity ${isToday ? 'bg-rose-600' : 'bg-stone-50'}`}
                onClick={() => onDayClick(dateStr)}>
                <p className={`text-xs font-semibold ${isToday ? 'text-rose-200' : 'text-stone-500'}`}>
                  {DAYS_ES[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                </p>
                <p className={`text-lg font-bold ${isToday ? 'text-white' : 'text-stone-900'}`}>{day.getDate()}</p>
              </div>
              <div className="p-1.5 space-y-1">
                {dayEvs.map(ev => {
                  const s = TYPE_STYLES[ev.type] || TYPE_STYLES.OTRO;
                  return (
                    <button key={`ev-${ev.id}`} onClick={() => onEventClick(ev.id)}
                      className={`w-full text-left p-2 rounded-xl border text-xs font-semibold ${s.light} hover:opacity-80 transition-opacity`}>
                      <div className="truncate">{ev.clientName}</div>
                      <div className="opacity-70 font-normal truncate">{ev.typeLabel}</div>
                    </button>
                  );
                })}
                {dayAppts.map(ap => {
                  const s = workerColor(ap.workerId);
                  return (
                    <button key={`ap-${ap.id}`} onClick={() => onApptClick(ap)}
                      className={`w-full text-left p-2 rounded-xl border text-xs font-semibold ${s.light} hover:opacity-80 transition-opacity`}>
                      <div className="flex items-center gap-1 truncate">
                        <Phone size={9} className="flex-none opacity-60" />
                        <span className="truncate">{ap.clientName}</span>
                      </div>
                      <div className="opacity-70 font-normal truncate">
                        {ap.startTime?.slice(0,5)}{ap.endTime ? `–${ap.endTime.slice(0,5)}` : ''} · {ap.workerName}
                      </div>
                    </button>
                  );
                })}
                {dayEvs.length === 0 && dayAppts.length === 0 && (
                  <p className="text-[10px] text-stone-300 text-center py-4">Libre</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Vista agenda ───────────────────────────────────────────────────────────────
function AgendaView({ events, appointments, workerColor, onEventClick, onApptClick }) {
  const allItems = [
    ...events.map(e => ({ ...e, _kind: 'event',       _date: e.eventDate })),
    ...appointments.map(a => ({ ...a, _kind: 'appointment', _date: a.appointmentDate })),
  ];

  if (allItems.length === 0) return (
    <div className="card text-center py-16">
      <Calendar size={40} className="text-stone-300 mx-auto mb-3" />
      <p className="text-stone-500">No hay eventos ni citas que mostrar</p>
    </div>
  );

  const grouped = allItems.reduce((acc, item) => {
    const key = item._date.substring(0, 7);
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([monthKey, monthItems]) => {
        const [y, m] = monthKey.split('-');
        return (
          <div key={monthKey}>
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-3">
              {MONTHS_ES[parseInt(m) - 1]} {y}
            </h3>
            <div className="space-y-2">
              {monthItems.sort((a, b) => a._date.localeCompare(b._date)).map(item => {
                if (item._kind === 'event') {
                  const s    = TYPE_STYLES[item.type] || TYPE_STYLES.OTRO;
                  const date = new Date(item.eventDate + 'T12:00:00');
                  return (
                    <motion.button key={`ev-${item.id}`}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      onClick={() => onEventClick(item.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left hover:opacity-90 transition-all ${s.light}`}>
                      <div className={`w-12 h-12 ${s.bg} rounded-xl flex flex-col items-center justify-center text-white flex-none shadow-sm`}>
                        <span className="text-xs font-semibold leading-none">{MONTHS_ES[date.getMonth()].substring(0,3).toUpperCase()}</span>
                        <span className="text-xl font-bold leading-none">{date.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-stone-900 text-base">{item.clientName}</p>
                          <span className={`badge text-xs ${s.badge}`}>{item.typeLabel}</span>
                          {item.daysUntilEvent === 0 && <span className="badge bg-emerald-100 text-emerald-700">¡Hoy!</span>}
                          {item.daysUntilEvent > 0 && item.daysUntilEvent <= 7 && <span className="badge bg-rose-100 text-rose-700">{item.daysUntilEvent}d</span>}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-stone-500">
                          {item.venue && <span className="flex items-center gap-1"><MapPin size={11}/>{item.venue}</span>}
                          {item.estimatedGuests && <span className="flex items-center gap-1"><Users size={11}/>{item.estimatedGuests} pax</span>}
                          {item.djName && <span>🎧 {item.djName}</span>}
                          {item.maitreName && <span>🍽 {item.maitreName}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end flex-none">
                        <span className={`badge text-xs ${item.statusLabel === 'Confirmado' ? 'bg-violet-100 text-violet-700' : item.statusLabel === 'Completado' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>
                          {item.statusLabel}
                        </span>
                        <div className="flex gap-1 mt-1">
                          <span className={`w-2 h-2 rounded-full ${item.menuConfirmed ? 'bg-emerald-400' : 'bg-stone-200'}`} title="Menú" />
                          <span className={`w-2 h-2 rounded-full ${item.protocolCompleted ? 'bg-emerald-400' : 'bg-stone-200'}`} title="Protocolo" />
                          <span className={`w-2 h-2 rounded-full ${item.allergensCompleted ? 'bg-emerald-400' : 'bg-stone-200'}`} title="Alérgenos" />
                        </div>
                      </div>
                    </motion.button>
                  );
                }

                // ── Cita telefónica ──────────────────────────────────────────
                const s    = workerColor(item.workerId);
                const date = new Date(item.appointmentDate + 'T12:00:00');
                const statusColor = {
                  PENDIENTE:  'bg-amber-100 text-amber-700',
                  CONFIRMADA: 'bg-emerald-100 text-emerald-700',
                  CANCELADA:  'bg-red-100 text-red-700',
                  COMPLETADA: 'bg-blue-100 text-blue-700',
                }[item.status] || 'bg-stone-100 text-stone-600';

                return (
                  <motion.button key={`ap-${item.id}`}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    onClick={() => onApptClick(item)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left hover:opacity-90 transition-all ${s.light}`}>
                    <div className={`w-12 h-12 ${s.bg} rounded-xl flex flex-col items-center justify-center text-white flex-none shadow-sm`}>
                      <span className="text-xs font-semibold leading-none">{MONTHS_ES[date.getMonth()].substring(0,3).toUpperCase()}</span>
                      <span className="text-xl font-bold leading-none">{date.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Phone size={13} className="flex-none opacity-70" />
                        <p className="font-bold text-stone-900 text-base">{item.clientName}</p>
                        <span className={`badge text-xs ${s.badge}`}>{item.workerName}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-stone-500">
                        <span>🕐 {item.startTime?.slice(0,5)}{item.endTime ? ` – ${item.endTime.slice(0,5)}` : ''}</span>
                        {item.phone && <span className="flex items-center gap-1"><Phone size={11}/>{item.phone}</span>}
                        {item.notes && <span className="truncate max-w-[200px] italic">"{item.notes}"</span>}
                      </div>
                    </div>
                    <span className={`badge text-xs flex-none ${statusColor}`}>{item.statusLabel}</span>
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
