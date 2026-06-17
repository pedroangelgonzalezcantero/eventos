import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Home, UtensilsCrossed, AlertTriangle, Music, CreditCard, Users2,
  LogOut, CheckCircle, Circle, ChevronRight, Play, Trash2,
  UserRound, Plus, Calendar, MapPin, Users, Sparkles, Lock,
  GripVertical, ChevronDown, ChevronUp, ArrowRight
} from 'lucide-react';

const ALLERGEN_LIST = ['GLUTEN','LACTEOS','HUEVOS','FRUTOS_SECOS','CACAHUETES','SOJA','MARISCO','PESCADO','MOSTAZA','APIO','SESAMO','SULFITOS','MOLUSCOS','ALTRAMUZ'];
const ALLERGEN_LABELS = {GLUTEN:'Gluten/Celíaco',LACTEOS:'Lácteos',HUEVOS:'Huevos',FRUTOS_SECOS:'Frutos secos',CACAHUETES:'Cacahuetes',SOJA:'Soja',MARISCO:'Marisco',PESCADO:'Pescado',MOSTAZA:'Mostaza',APIO:'Apio',SESAMO:'Sésamo',SULFITOS:'Sulfitos',MOLUSCOS:'Moluscos',ALTRAMUZ:'Altramuces'};
const ALLERGEN_COLORS = ['bg-amber-100 text-amber-700','bg-red-100 text-red-700','bg-orange-100 text-orange-700','bg-yellow-100 text-yellow-700','bg-rose-100 text-rose-700'];

const TABS = [
  { id: 'inicio',      label: 'Inicio',       icon: Home },
  { id: 'menu',        label: 'Menú',          icon: UtensilsCrossed },
  { id: 'alergenos',   label: 'Alérgenos',     icon: AlertTriangle },
  { id: 'protocolo',   label: 'Protocolo',     icon: Music },
  { id: 'mesas',       label: 'Mesas',         icon: Users2 },
  { id: 'facturacion', label: 'Facturación',   icon: CreditCard },
];

export default function ClientPortal() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('inicio');
  const [event, setEvent] = useState(null);
  const [menus, setMenus] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [protocol, setProtocol] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [tables, setTables] = useState([]);

  const loadData = async () => {
    try {
      const evRes = await api.get('/events/mi-evento');
      const ev = evRes.data;
      setEvent(ev);
      const [m, a, p] = await Promise.all([
        api.get(`/events/${ev.id}/menus`),
        api.get(`/events/${ev.id}/allergens`),
        api.get(`/events/${ev.id}/protocol`),
      ]);
      setMenus(m.data); setAllergens(a.data); setProtocol(p.data);
      api.get(`/events/${ev.id}/invoice`).then(r => setInvoice(r.data)).catch(() => {});
      api.get(`/events/${ev.id}/tables`).then(r => setTables(r.data)).catch(() => {});
    } catch { toast.error('Error cargando tu evento'); }
  };

  const reloadTables = async () => {
    if (!event) return;
    const r = await api.get(`/events/${event.id}/tables`);
    setTables(r.data);
  };

  useEffect(() => { loadData(); }, []);

  if (!event) return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
    </div>
  );

  const tasks = [
    { done: event.menuConfirmed,       label: 'Menú confirmado',      tab: 'menu',        desc: 'Selecciona el menú de tu celebración' },
    { done: event.allergensCompleted,  label: 'Alérgenos registrados', tab: 'alergenos',   desc: 'Informa sobre alergias e intolerancias' },
    { done: event.protocolCompleted,   label: 'Protocolo definido',    tab: 'protocolo',   desc: 'Los momentos especiales del evento' },
    { done: event.budgetSigned,        label: 'Presupuesto firmado',   tab: 'facturacion', desc: 'Acepta el presupuesto del salón' },
  ];
  const completion = Math.round((tasks.filter(t => t.done).length / tasks.length) * 100);
  const daysLeft = event.daysUntilEvent;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header premium */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full" />
        </div>
        <div className="relative max-w-2xl mx-auto px-4 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <span className="text-white/90 text-sm font-medium">Salón de Celebraciones</span>
            </div>
            <button onClick={() => { logout(); window.location.href = '/login'; }}
              className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors">
              <LogOut size={15} /> Salir
            </button>
          </div>
          <div className="mt-4 mb-3">
            <p className="text-rose-200 text-sm">Bienvenido/a</p>
            <h1 className="text-2xl font-bold text-white">{user?.nombre || user?.username}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-rose-100">
              <span>{event.typeLabel}</span>
              <span className="opacity-50">·</span>
              <span className="flex items-center gap-1.5"><Calendar size={13} />
                {new Date(event.eventDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {event.venue && <span className="flex items-center gap-1.5"><MapPin size={13} />{event.venue}</span>}
            </div>
          </div>
          {daysLeft > 0 && <div className="inline-flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5 mb-4"><span className="text-white text-sm font-semibold">🎉 ¡Faltan {daysLeft} días!</span></div>}
          {daysLeft === 0 && <div className="inline-flex items-center gap-2 bg-white/20 rounded-xl px-3 py-1.5 mb-4"><span className="text-white text-sm font-bold">🎊 ¡Es hoy! ¡Felicidades!</span></div>}
          <div className="mt-2 mb-1">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-white/80 text-xs font-medium">Progreso de tu evento</span>
              <span className="text-white font-bold text-sm">{completion}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${completion}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full bg-white rounded-full" />
            </div>
            <div className="flex gap-2 mt-2">
              {tasks.map(t => (
                <div key={t.label} className="flex-1 flex flex-col items-center gap-1">
                  {t.done ? <CheckCircle size={14} className="text-white" /> : <Circle size={14} className="text-white/40" />}
                  <p className="text-[9px] text-white/70 text-center leading-none hidden sm:block">{t.label.split(' ')[0]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto px-2 flex gap-0.5 overflow-x-auto scrollbar-thin">
          {TABS.map(t => {
            const Icon = t.icon;
            const isLocked = t.id === 'protocolo' && event.protocolLocked;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex-none ${tab === t.id ? 'border-rose-600 text-rose-600' : 'border-transparent text-stone-500 hover:text-stone-700'}`}>
                <Icon size={15} />{t.label}
                {isLocked && <Lock size={11} className="text-stone-400 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === 'inicio'      && <InicioTab event={event} tasks={tasks} setTab={setTab} />}
            {tab === 'menu'        && <MenuTab event={event} menus={menus} reload={loadData} />}
            {tab === 'alergenos'   && <AlergensTab event={event} tables={tables} reload={() => { reloadTables(); loadData(); }} onGoToMesas={() => setTab('mesas')} />}
            {tab === 'protocolo'   && <ProtocoloTab event={event} items={protocol} reload={loadData} />}
            {tab === 'mesas'       && <MesasTab event={event} tables={tables} reloadTables={reloadTables} />}
            {tab === 'facturacion' && <FacturacionTab event={event} invoice={invoice} reload={loadData} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Inicio ──────────────────────────────────────────────────────────────────
function InicioTab({ event, tasks, setTab }) {
  const pending = tasks.filter(t => !t.done);
  return (
    <div className="space-y-5">
      {pending.length > 0 ? (
        <div className="card border-amber-100 bg-amber-50/60 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-600" />
            <h2 className="font-semibold text-amber-900">{pending.length} tarea{pending.length > 1 ? 's' : ''} pendiente{pending.length > 1 ? 's' : ''}</h2>
          </div>
          <div className="space-y-2">
            {pending.map(t => (
              <button key={t.tab} onClick={() => setTab(t.tab)} className="w-full flex items-center justify-between p-3.5 bg-white rounded-xl border border-amber-100 hover:border-amber-300 transition-all text-left group">
                <div><p className="font-semibold text-stone-900 text-sm">{t.label}</p><p className="text-xs text-stone-500 mt-0.5">{t.desc}</p></div>
                <ChevronRight size={16} className="text-stone-300 group-hover:text-rose-500 transition-colors flex-none ml-2" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="card border-emerald-100 bg-emerald-50/60 text-center py-10">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="font-bold text-emerald-800 text-xl">¡Todo completado!</h2>
          <p className="text-emerald-600 text-sm mt-1">Has completado toda la información de tu celebración</p>
        </div>
      )}
      <div className="card">
        <h3 className="font-semibold text-stone-900 mb-4">Detalles de tu celebración</h3>
        <dl className="space-y-3 text-sm">
          {[['Tipo de evento', event.typeLabel],['Fecha', new Date(event.eventDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],['Salón', event.venue],['Invitados estimados', event.estimatedGuests && `${event.estimatedGuests} personas`],['Persona de contacto', event.contactPerson]].filter(([, v]) => v).map(([l, v]) => (
            <div key={l} className="flex justify-between gap-4"><dt className="text-stone-500 flex-none">{l}</dt><dd className="font-medium text-stone-900 text-right">{v}</dd></div>
          ))}
        </dl>
      </div>
    </div>
  );
}

// ── Menú ─────────────────────────────────────────────────────────────────────
function MenuTab({ event, menus, reload }) {
  const handleSelect = async (menuId) => {
    try { await api.post(`/events/${event.id}/menus/${menuId}/select`); reload(); toast.success('¡Menú confirmado!'); }
    catch { toast.error('Error al seleccionar menú'); }
  };
  return (
    <div className="space-y-4">
      <div><h2 className="text-xl font-bold text-stone-900">Menús disponibles</h2><p className="text-stone-500 text-sm mt-0.5">Selecciona el menú para tu celebración</p></div>
      {menus.length === 0 && <div className="card text-center py-14"><UtensilsCrossed size={36} className="text-stone-300 mx-auto mb-3" /><p className="text-stone-500">El salón preparará los menús disponibles próximamente.</p></div>}
      {menus.map(m => (
        <div key={m.id} className={`card transition-all ${m.selected ? 'border-2 border-emerald-400 bg-emerald-50/50' : ''}`}>
          <div className="flex items-start justify-between mb-4 gap-3">
            <div><h3 className="text-lg font-bold text-stone-900">{m.name}</h3>{m.description && <p className="text-stone-500 text-sm mt-0.5">{m.description}</p>}</div>
            {m.selected ? <span className="badge bg-emerald-100 text-emerald-700 flex-none">✓ Confirmado</span> : <button onClick={() => handleSelect(m.id)} className="btn-primary text-sm flex-none">Elegir este</button>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[['🥗 Entrantes', m.starters],['🍝 1er plato', m.firstCourse],['🥩 2do plato', m.secondCourse],['🍮 Postre', m.dessert],['🍷 Bebidas', m.drinks],['✨ Extras', m.extras]].filter(([, v]) => v).map(([l, v]) => (
              <div key={l} className="bg-stone-50 rounded-xl p-3"><p className="text-xs font-semibold text-stone-400 mb-1">{l}</p><p className="text-sm text-stone-800">{v}</p></div>
            ))}
          </div>
          {m.pricePerPerson && <p className="text-right text-sm text-stone-400 mt-3 font-medium">{m.pricePerPerson}€ / persona</p>}
        </div>
      ))}
    </div>
  );
}

// ── Alérgenos ─────────────────────────────────────────────────────────────────
function AlergensTab({ event, tables, reload, onGoToMesas }) {
  // ── Formulario añadir ────────────────────────────────────────────────────
  const [showForm,     setShowForm]    = useState(false);
  const [formMesaId,   setFormMesaId]  = useState('');
  const [formGuestId,  setFormGuestId] = useState('');
  const [newAllergies, setNewAllergies]= useState([]);
  const [newDiet,      setNewDiet]     = useState('');
  const [newObs,       setNewObs]      = useState('');

  // ── Edición inline ───────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState(null);
  const [editForm,  setEditForm]  = useState({ allergies: [], diet: '', observations: '' });
  const [saving,    setSaving]    = useState(false);

  // ── Datos derivados ───────────────────────────────────────────────────────
  const allGuests = tables.flatMap(t =>
    (t.guests || []).map(g => ({ ...g, tableName: t.name, tableId: t.id }))
  );

  // Cuenta personas reales: "Maria y Jose" = 2
  const countPersons = name => name ? name.split(/\s+[yY]\s+/).length : 1;

  // Solo mesas con al menos un invitado con restricción
  const tablesWithRestrictions = tables.filter(t =>
    (t.guests || []).some(g => g.allergies || g.diet)
  );
  const withCount = allGuests
    .filter(g => g.allergies || g.diet)
    .reduce((s, g) => s + countPersons(g.guestName), 0);
  const guestsInFormMesa = formMesaId
    ? (tables.find(t => t.id === parseInt(formMesaId))?.guests || [])
    : [];

  // Expande parejas: "Maria y Jose" → dos entradas virtuales
  const expandedGuestsInFormMesa = guestsInFormMesa.flatMap(g => {
    const parts = g.guestName ? g.guestName.split(/\s+[yY]\s+/).map(s => s.trim()).filter(Boolean) : [];
    if (parts.length > 1) {
      return parts.map(p => ({ ...g, displayName: p, isCouple: true, coupleFullName: g.guestName }));
    }
    return [{ ...g, displayName: g.guestName, isCouple: false }];
  });

  const openForm = () => {
    setShowForm(true); setFormMesaId(''); setFormGuestId('');
    setNewAllergies([]); setNewDiet(''); setNewObs('');
  };
  const toggleNew = a =>
    setNewAllergies(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]);

  const handleAdd = async () => {
    if (!formGuestId) { toast.error('Selecciona un invitado'); return; }
    // formGuestId puede ser "id" o "id::nombreIndividual" (pareja)
    const [guestIdStr, individualName] = formGuestId.split('::');
    const mesa  = tables.find(t => t.id === parseInt(formMesaId));
    const guest = (mesa?.guests || []).find(g => g.id === parseInt(guestIdStr));
    if (!guest) return;
    if (!newAllergies.length && !newDiet) { toast.error('Selecciona al menos un alérgeno o dieta'); return; }
    setSaving(true);
    try {
      const isCouple = individualName && individualName !== guest.guestName;
      if (isCouple) {
        const parts = guest.guestName.split(/\s+[yY]\s+/).map(s => s.trim()).filter(Boolean);
        const otherName = parts.find(p => p !== individualName);
        await api.put(`/events/${event.id}/tables/${mesa.id}/guests/${guest.id}`, {
          guestName: individualName,
          allergies: newAllergies.join(','),
          diet: newDiet,
          observations: newObs,
        });
        if (otherName) {
          await api.post(`/events/${event.id}/tables/${mesa.id}/guests`, {
            guestName: otherName,
            allergies: '',
            diet: '',
            observations: '',
          });
        }
      } else {
        await api.put(`/events/${event.id}/tables/${mesa.id}/guests/${guest.id}`, {
          guestName: guest.guestName,
          allergies: newAllergies.join(','),
          diet: newDiet,
          observations: newObs,
        });
      }
      toast.success('Alérgenos guardados');
      setShowForm(false);
      reload();
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  const startEdit = g => {
    setEditingId(g.id);
    setEditForm({
      allergies:    g.allergies ? g.allergies.split(',').filter(Boolean) : [],
      diet:         g.diet || '',
      observations: g.observations || '',
    });
  };
  const toggleEdit = a =>
    setEditForm(f => ({
      ...f,
      allergies: f.allergies.includes(a) ? f.allergies.filter(x => x !== a) : [...f.allergies, a],
    }));

  const handleSave = async g => {
    setSaving(true);
    try {
      await api.put(`/events/${event.id}/tables/${g.tableId}/guests/${g.id}`, {
        guestName: g.guestName, allergies: editForm.allergies.join(','),
        diet: editForm.diet, observations: editForm.observations,
      });
      toast.success('Guardado');
      setEditingId(null); reload();
    } catch { toast.error('Error'); }
    finally { setSaving(false); }
  };

  const handleClear = async g => {
    if (!confirm(`¿Eliminar las restricciones de ${g.guestName}?`)) return;
    try {
      await api.put(`/events/${event.id}/tables/${g.tableId}/guests/${g.id}`,
        { guestName: g.guestName, allergies: '', diet: '', observations: '' });
      toast.success('Restricciones eliminadas'); reload();
    } catch { toast.error('Error'); }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (tables.length === 0) return (
    <div className="space-y-4">
      <div><h2 className="text-xl font-bold text-stone-900">Alérgenos e intolerancias</h2></div>
      <div className="card text-center py-14">
        <AlertTriangle size={40} className="text-stone-300 mx-auto mb-4" />
        <h3 className="font-semibold text-stone-700 mb-2">Sin mesas creadas</h3>
        <p className="text-stone-500 text-sm mb-5 px-4">
          Primero debes crear mesas e invitados antes de gestionar alérgenos.
        </p>
        <button onClick={onGoToMesas} className="btn-primary text-sm inline-flex items-center gap-2 mx-auto">
          <Users2 size={14} /> Ir a Mesas
        </button>
      </div>
    </div>
  );

  if (allGuests.length === 0) return (
    <div className="space-y-4">
      <div><h2 className="text-xl font-bold text-stone-900">Alérgenos e intolerancias</h2></div>
      <div className="card text-center py-14">
        <AlertTriangle size={40} className="text-stone-300 mx-auto mb-4" />
        <h3 className="font-semibold text-stone-700 mb-2">Sin invitados registrados</h3>
        <p className="text-stone-500 text-sm mb-5 px-4">
          Añade invitados a tus mesas y luego podrás registrar sus restricciones aquí.
        </p>
        <button onClick={onGoToMesas} className="btn-primary text-sm inline-flex items-center gap-2 mx-auto">
          <Users2 size={14} /> Ir a Mesas
        </button>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Alérgenos e intolerancias</h2>
          <p className="text-stone-500 text-sm mt-0.5">
            {withCount > 0 ? `${withCount} invitado${withCount !== 1 ? 's' : ''} con restricciones` : 'Ningún invitado tiene restricciones todavía'}
          </p>
        </div>
        <button onClick={openForm} className="btn-primary text-sm flex-none inline-flex items-center gap-1.5">
          <Plus size={14} /> Añadir alérgeno
        </button>
      </div>

      {/* Formulario 3 pasos */}
      {showForm && (
        <div className="card border-amber-100 bg-amber-50/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-stone-800">Añadir restricción a un invitado</h3>
            <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600 text-xl leading-none">×</button>
          </div>

          {/* Paso 1 — mesa */}
          <div>
            <label className="label">Paso 1 — Selecciona la mesa</label>
            <select className="input" value={formMesaId}
              onChange={e => { setFormMesaId(e.target.value); setFormGuestId(''); }}>
              <option value="">— Seleccionar mesa —</option>
              {tables.filter(t => (t.guests || []).length > 0).map(t => {
                const cnt = (t.guests || []).reduce((s, g) => s + countPersons(g.guestName), 0);
                return (
                  <option key={t.id} value={t.id}>
                    {t.name}{` (${cnt} inv.)`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Paso 2 — invitado */}
          {formMesaId && (
            <div>
              <label className="label">Paso 2 — Selecciona el invitado</label>
              {guestsInFormMesa.length === 0
                ? <p className="text-sm text-stone-400 italic">Esta mesa no tiene invitados.</p>
                : (
                  <select className="input" value={formGuestId} onChange={e => setFormGuestId(e.target.value)}>
                    <option value="">— Seleccionar invitado —</option>
                    {expandedGuestsInFormMesa.map(g => (
                      <option key={g.isCouple ? `${g.id}::${g.displayName}` : g.id}
                              value={g.isCouple ? `${g.id}::${g.displayName}` : g.id}>
                        {g.displayName}
                        {g.isCouple ? ' 👫' : ((g.allergies || g.diet) ? ' ⚠' : '')}
                      </option>
                    ))}
                  </select>
                )}
            </div>
          )}

          {/* Paso 3 — alérgenos */}
          {formGuestId && (
            <>
              <div>
                <label className="label">Paso 3 — Alérgenos</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {ALLERGEN_LIST.map(a => (
                    <button key={a} type="button" onClick={() => toggleNew(a)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${newAllergies.includes(a) ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'}`}>
                      {ALLERGEN_LABELS[a]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Dieta especial</label>
                <select className="input" value={newDiet} onChange={e => setNewDiet(e.target.value)}>
                  <option value="">Ninguna</option>
                  {['VEGETARIANO','VEGANO','HALAL','KOSHER','SIN_SAL','DIABETICO'].map(d =>
                    <option key={d} value={d}>{d.replace('_', ' ')}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="label">Observaciones adicionales</label>
                <input className="input" value={newObs} onChange={e => setNewObs(e.target.value)}
                  placeholder="Alergia muy grave, llevar EpiPen..." />
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleAdd} disabled={!formGuestId || saving} className="btn-primary flex-1">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Sin restricciones */}
      {tablesWithRestrictions.length === 0 && !showForm && (
        <div className="card text-center py-10">
          <div className="text-3xl mb-3">✅</div>
          <p className="text-stone-500 text-sm">Ningún invitado tiene restricciones registradas.</p>
          <p className="text-stone-400 text-xs mt-1">Usa "+ Añadir alérgeno" para registrar la primera.</p>
        </div>
      )}

      {/* Solo mesas con restricciones */}
      {tablesWithRestrictions.map(table => {
        const restricted = (table.guests || [])
          .filter(g => g.allergies || g.diet)
          .map(g => ({ ...g, tableId: table.id, tableName: table.name }));

        return (
          <div key={table.id} className="card">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-stone-900 flex-1">🪑 {table.name}</h3>
              <span className="badge bg-amber-100 text-amber-700 text-[10px]">
                ⚠ {restricted.length}
              </span>
            </div>

            <div className="space-y-2">
              {restricted.map(g => {
                const isEditing = editingId === g.id;
                return (
                  <div key={g.id}
                    className={`rounded-2xl border transition-all ${isEditing ? 'border-amber-200 bg-amber-50/40' : 'border-stone-100 bg-stone-50'}`}>

                    {!isEditing && (
                      <div className="flex items-start justify-between p-3.5 gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <UserRound size={13} className="text-stone-400 flex-none" />
                            <p className="font-semibold text-sm text-stone-900">{g.guestName}</p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {g.diet && <span className="badge bg-violet-100 text-violet-700">{g.diet.replace('_', ' ')}</span>}
                            {g.allergies && g.allergies.split(',').filter(Boolean).map((a, idx) =>
                              <span key={a} className={`badge text-[10px] ${ALLERGEN_COLORS[idx % ALLERGEN_COLORS.length]}`}>⚠ {ALLERGEN_LABELS[a] || a}</span>
                            )}
                          </div>
                          {g.observations && <p className="text-xs text-stone-400 mt-1.5 italic">{g.observations}</p>}
                        </div>
                        <div className="flex items-center gap-1 flex-none">
                          <button onClick={() => startEdit(g)} className="p-1.5 rounded-xl text-stone-300 hover:text-blue-600 hover:bg-blue-50 transition-colors">✏️</button>
                          <button onClick={() => handleClear(g)} className="p-1.5 rounded-xl text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    )}

                    {isEditing && (
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm text-stone-900">✏️ {g.guestName}</p>
                          <button onClick={() => setEditingId(null)} className="text-stone-400 hover:text-stone-600 text-lg leading-none">×</button>
                        </div>
                        <div>
                          <label className="label">Dieta especial</label>
                          <select className="input" value={editForm.diet}
                            onChange={e => setEditForm(f => ({ ...f, diet: e.target.value }))}>
                            <option value="">Ninguna</option>
                            {['VEGETARIANO','VEGANO','HALAL','KOSHER','SIN_SAL','DIABETICO'].map(d =>
                              <option key={d} value={d}>{d.replace('_', ' ')}</option>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="label">Alérgenos</label>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            {ALLERGEN_LIST.map(a => (
                              <button key={a} type="button" onClick={() => toggleEdit(a)}
                                className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${editForm.allergies.includes(a) ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'}`}>
                                {ALLERGEN_LABELS[a]}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="label">Observaciones</label>
                          <input className="input" value={editForm.observations}
                            onChange={e => setEditForm(f => ({ ...f, observations: e.target.value }))}
                            placeholder="Alergia muy grave, llevar EpiPen..." />
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => setEditingId(null)} className="btn-secondary flex-1">Cancelar</button>
                          <button onClick={() => handleSave(g)} disabled={saving} className="btn-primary flex-1">
                            {saving ? 'Guardando...' : 'Guardar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Protocolo (con bloqueo elegante) ─────────────────────────────────────────
function ProtocoloTab({ event, items, reload }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ eventTime: '', description: '', involvedPerson: '', youtubeLink: '', observations: '' });
  const locked = event.protocolLocked;

  const handleAdd = async () => {
    if (!form.description) { toast.error('La descripción es obligatoria'); return; }
    try { await api.post(`/events/${event.id}/protocol`, { ...form, position: items.length + 1 }); reload(); setShowForm(false); setForm({ eventTime: '', description: '', involvedPerson: '', youtubeLink: '', observations: '' }); toast.success('Momento añadido'); }
    catch (err) { if (err.response?.status === 423) toast.error('El protocolo está bloqueado'); else toast.error('Error'); }
  };
  const handleDelete = async (id) => {
    try { await api.delete(`/events/${event.id}/protocol/${id}`); reload(); }
    catch (err) { if (err.response?.status === 423) toast.error('El protocolo está bloqueado'); else toast.error('Error'); }
  };

  return (
    <div className="space-y-4">
      <div><h2 className="text-xl font-bold text-stone-900">Protocolo del evento</h2><p className="text-stone-500 text-sm mt-0.5">El DJ y el personal seguirán este orden durante la celebración.</p></div>

      {/* Banner bloqueo — diseño premium */}
      {locked && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4 p-5 rounded-2xl bg-stone-900 text-white shadow-lg">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-none mt-0.5">
            <Lock size={20} className="text-stone-300" />
          </div>
          <div>
            <p className="font-semibold text-base leading-snug">El plazo para modificar el protocolo ha finalizado.</p>
            <p className="text-stone-400 text-sm mt-1">Para cambios urgentes, contacte con administración.</p>
          </div>
        </motion.div>
      )}

      {/* Aviso días restantes antes del bloqueo */}
      {!locked && event.daysUntilEvent > 0 && event.daysUntilEvent <= 7 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle size={18} className="text-amber-600 flex-none" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {event.daysUntilEvent === 4 ? 'Hoy es el último día para modificar el protocolo.' : `Quedan ${event.daysUntilEvent - 4} días para que se cierre el protocolo.`}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">El acceso se bloquea automáticamente 4 días antes del evento.</p>
          </div>
        </div>
      )}

      {!locked && <button onClick={() => setShowForm(true)} className="btn-primary w-full py-3"><Plus size={16} /> Añadir momento especial</button>}

      {showForm && !locked && (
        <div className="card border-blue-100 bg-blue-50/30">
          <h3 className="font-semibold mb-4">Nuevo momento</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Hora</label><input className="input" type="time" value={form.eventTime} onChange={e => setForm(f => ({ ...f, eventTime: e.target.value }))} /></div>
              <div><label className="label">Descripción *</label><input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Entrada de los novios" /></div>
            </div>
            <div><label className="label">Persona(s) involucrada(s)</label><input className="input" value={form.involvedPerson} onChange={e => setForm(f => ({ ...f, involvedPerson: e.target.value }))} placeholder="Los novios, abuela María..." /></div>
            <div><label className="label">🎵 Canción / Enlace YouTube para el DJ</label><input className="input" value={form.youtubeLink} onChange={e => setForm(f => ({ ...f, youtubeLink: e.target.value }))} placeholder="https://youtube.com/..." /></div>
            <div><label className="label">Observaciones para el personal</label><input className="input" value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} /></div>
          </div>
          <div className="flex gap-3 mt-4"><button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={handleAdd} className="btn-primary flex-1">Guardar momento</button></div>
        </div>
      )}

      {items.length === 0 && !showForm && !locked && <div className="card text-center py-12"><Music size={36} className="text-stone-300 mx-auto mb-3" /><p className="text-stone-500">Añade los momentos especiales de tu celebración.</p></div>}

      <div className="space-y-2">
        {items.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex gap-3">
            <div className="flex flex-col items-center flex-none pt-1">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">{i + 1}</div>
              {i < items.length - 1 && <div className="w-px flex-1 bg-rose-100 mt-1 mb-1 min-h-[1rem]" />}
            </div>
            <div className="card flex-1 p-4 mb-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {item.eventTime && <span className="text-sm font-bold text-rose-600">{item.eventTime} · </span>}
                  <span className="font-semibold text-stone-900">{item.description}</span>
                  {item.involvedPerson && <p className="text-sm text-stone-500 mt-1 flex items-center gap-1"><UserRound size={12} />{item.involvedPerson}</p>}
                  {item.youtubeLink && <a href={item.youtubeLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-sm text-red-600 hover:text-red-700 font-medium"><Play size={13} className="fill-current" /> Ver canción en YouTube</a>}
                  {item.observations && <p className="text-xs text-stone-400 mt-1.5 italic">{item.observations}</p>}
                </div>
                {!locked && <button onClick={() => handleDelete(item.id)} className="text-stone-200 hover:text-red-400 transition-colors flex-none"><Trash2 size={15} /></button>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Mesas Tab (con drag & drop) ──────────────────────────────────────────────
function GuestRow({ guest, tableId, eventId, onDelete, tables, reloadTables }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: guest.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
  const [showMove, setShowMove] = useState(false);

  const handleMoveTo = async (targetTableId) => {
    try { await api.patch(`/events/${eventId}/tables/${tableId}/guests/${guest.id}/move`, { targetTableId }); toast.success('Invitado movido'); setShowMove(false); reloadTables(); }
    catch { toast.error('Error al mover'); }
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative flex items-center gap-2 p-2.5 bg-white rounded-xl border border-stone-100 group hover:border-stone-200 transition-all ${isDragging ? 'shadow-lg border-rose-300 z-50' : ''}`}>
      <div {...attributes} {...listeners} className="text-stone-300 hover:text-stone-500 cursor-grab active:cursor-grabbing flex-none"><GripVertical size={14} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-stone-900">{guest.guestName}</span>
          {guest.diet && <span className="badge bg-violet-100 text-violet-700 text-[10px]">{guest.diet.replace('_', ' ')}</span>}
          {guest.allergies && guest.allergies.split(',').filter(Boolean).map((a, idx) => <span key={a} className={`badge text-[10px] ${ALLERGEN_COLORS[idx % ALLERGEN_COLORS.length]}`}>⚠ {ALLERGEN_LABELS[a] || a}</span>)}
        </div>
        {guest.observations && <p className="text-[10px] text-stone-400 italic mt-0.5 truncate">{guest.observations}</p>}
      </div>
      <div className="flex items-center gap-1 flex-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button onClick={() => setShowMove(v => !v)} className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors" title="Mover a otra mesa"><ArrowRight size={13} /></button>
          {showMove && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-stone-200 rounded-xl shadow-xl p-2 min-w-[160px]">
              <p className="text-[10px] text-stone-400 font-semibold uppercase px-2 mb-1">Mover a...</p>
              {tables.filter(t => t.id !== tableId).map(t => (
                <button key={t.id} onClick={() => handleMoveTo(t.id)} className="w-full text-left px-2 py-1.5 text-sm text-stone-700 hover:bg-rose-50 rounded-lg transition-colors">{t.name}</button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => onDelete(tableId, guest.id)} className="p-1 rounded-lg hover:bg-red-50 text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

function MesasTab({ event, tables, reloadTables }) {
  const [showNewTable, setShowNewTable] = useState(false);
  const [newTable, setNewTable] = useState({ name: '', capacity: '', notes: '' });
  const [expanded, setExpanded] = useState({});
  const [showAddGuest, setShowAddGuest] = useState(null);
  const [guestForm, setGuestForm] = useState({ guestName: '', diet: '', observations: '' });
  const [guestAllergens, setGuestAllergens] = useState([]);
  const [dragging, setDragging] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const toggleAllergen = a => setGuestAllergens(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]);

  const handleCreateTable = async () => {
    if (!newTable.name) { toast.error('El nombre es obligatorio'); return; }
    try {
      await api.post(`/events/${event.id}/tables`, { ...newTable, capacity: newTable.capacity ? parseInt(newTable.capacity) : null });
      toast.success('Mesa creada'); setShowNewTable(false); setNewTable({ name: '', capacity: '', notes: '' }); reloadTables();
    } catch { toast.error('Error al crear mesa'); }
  };

  const handleDeleteTable = async (tableId) => {
    if (!confirm('¿Eliminar esta mesa y todos sus invitados?')) return;
    try { await api.delete(`/events/${event.id}/tables/${tableId}`); toast.success('Mesa eliminada'); reloadTables(); }
    catch { toast.error('Error'); }
  };

  const handleAddGuest = async (tableId) => {
    if (!guestForm.guestName) { toast.error('El nombre es obligatorio'); return; }
    try {
      await api.post(`/events/${event.id}/tables/${tableId}/guests`, { ...guestForm, allergies: guestAllergens.join(',') });
      toast.success('Invitado añadido'); setShowAddGuest(null); setGuestForm({ guestName: '', diet: '', observations: '' }); setGuestAllergens([]); reloadTables();
    } catch { toast.error('Error'); }
  };

  const handleDeleteGuest = async (tableId, guestId) => {
    try { await api.delete(`/events/${event.id}/tables/${tableId}/guests/${guestId}`); reloadTables(); }
    catch { toast.error('Error'); }
  };

  const handleDragEnd = async ({ active, over }) => {
    setDragging(null);
    if (!over || active.id === over.id) return;
    const sourceTable = tables.find(t => t.guests?.some(g => g.id === active.id));
    if (!sourceTable) return;
    const overTable = tables.find(t => t.id === over.id || t.guests?.some(g => g.id === over.id));
    if (!overTable || sourceTable.id === overTable.id) return;
    try {
      await api.patch(`/events/${event.id}/tables/${sourceTable.id}/guests/${active.id}/move`, { targetTableId: overTable.id });
      toast.success('Invitado movido'); reloadTables();
    } catch { toast.error('Error al mover invitado'); }
  };

  const realCount = t => (t.guests && t.guests.length > 0)
    ? t.guests.reduce((s, g) => s + (g.guestName ? g.guestName.split(/\s+[yY]\s+/).length : 1), 0)
    : (t.guestCount || 0);

  const totalGuests = tables.reduce((s, t) => s + realCount(t), 0);
  const totalAlergias = tables.reduce((s, t) => s + (t.allergiesCount || 0), 0);

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold text-stone-900">Distribución de mesas</h2><p className="text-stone-500 text-sm mt-0.5">Organiza dónde se sienta cada invitado y gestiona sus necesidades especiales.</p></div>

      {tables.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center"><p className="text-xl font-bold text-stone-900">{tables.length}</p><p className="text-xs text-stone-500 mt-0.5">Mesas</p></div>
          <div className="card p-3 text-center"><p className="text-xl font-bold text-stone-900">{totalGuests}</p><p className="text-xs text-stone-500 mt-0.5">Invitados</p></div>
          <div className="card p-3 text-center"><p className={`text-xl font-bold ${totalAlergias > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{totalAlergias}</p><p className="text-xs text-stone-500 mt-0.5">Alergias</p></div>
        </div>
      )}

      <button onClick={() => setShowNewTable(true)} className="btn-primary w-full py-3"><Plus size={16} /> Nueva mesa</button>

      {showNewTable && (
        <div className="card border-blue-100 bg-blue-50/30">
          <h3 className="font-semibold mb-3">Nueva mesa</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Nombre *</label><input className="input" value={newTable.name} onChange={e => setNewTable(f => ({ ...f, name: e.target.value }))} placeholder="Mesa 1 / Mesa presidencial" /></div>
              <div><label className="label">Capacidad</label><input className="input" type="number" min="1" max="50" value={newTable.capacity} onChange={e => setNewTable(f => ({ ...f, capacity: e.target.value }))} placeholder="10" /></div>
            </div>
            <div><label className="label">Observaciones</label><input className="input" value={newTable.notes} onChange={e => setNewTable(f => ({ ...f, notes: e.target.value }))} placeholder="Junto a la pista, cerca de la salida..." /></div>
          </div>
          <div className="flex gap-3 mt-4"><button onClick={() => setShowNewTable(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={handleCreateTable} className="btn-primary flex-1">Crear mesa</button></div>
        </div>
      )}

      {tables.length === 0 && !showNewTable && (
        <div className="card text-center py-12"><Users2 size={36} className="text-stone-300 mx-auto mb-3" /><p className="text-stone-500">Crea las mesas y asigna invitados a cada una.</p></div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={e => setDragging(e.active.id)} onDragEnd={handleDragEnd}>
        <div className="space-y-3">
          {tables.map(table => {
            const isExpanded = expanded[table.id] !== false;
            const realGuestCount = realCount(table);
            const occupancy = table.capacity ? Math.round((realGuestCount / table.capacity) * 100) : null;
            return (
              <motion.div key={table.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card overflow-visible">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-stone-900">{table.name}</h3>
                      {table.allergiesCount > 0 && <span className="badge bg-amber-100 text-amber-700 flex-none">⚠ {table.allergiesCount} alergia{table.allergiesCount !== 1 ? 's' : ''}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-stone-500">{realGuestCount}{table.capacity ? `/${table.capacity}` : ''} invitado{realGuestCount !== 1 ? 's' : ''}</span>
                      {occupancy !== null && <div className="flex-1 max-w-[80px] h-1.5 bg-stone-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${occupancy >= 100 ? 'bg-red-500' : occupancy >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(occupancy, 100)}%` }} /></div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-none">
                    <button onClick={() => setExpanded(p => ({ ...p, [table.id]: !isExpanded }))} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={() => handleDeleteTable(table.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-stone-100">
                    <div className="space-y-1.5 min-h-[2rem]">
                      {(!table.guests || table.guests.length === 0) && <p className="text-xs text-stone-400 text-center py-3 italic">Sin invitados asignados. Usa "Mover a otra mesa" para reorganizar.</p>}
                      {(table.guests || []).map(guest => (
                        <GuestRow key={guest.id} guest={guest} tableId={table.id} eventId={event.id} onDelete={handleDeleteGuest} tables={tables} reloadTables={reloadTables} />
                      ))}
                    </div>
                    <button onClick={() => { setShowAddGuest(table.id); setGuestAllergens([]); setGuestForm({ guestName: '', diet: '', observations: '' }); }}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-stone-200 rounded-xl text-sm text-stone-500 hover:border-rose-300 hover:text-rose-600 transition-all">
                      <Plus size={14} /> Añadir invitado
                    </button>
                    {showAddGuest === table.id && (
                      <div className="mt-3 p-4 bg-stone-50 rounded-2xl space-y-3">
                        <h4 className="font-semibold text-sm text-stone-900">Nuevo invitado en {table.name}</h4>
                        <input className="input" value={guestForm.guestName} onChange={e => setGuestForm(f => ({ ...f, guestName: e.target.value }))} placeholder="Nombre del invitado *" />
                        <select className="input" value={guestForm.diet} onChange={e => setGuestForm(f => ({ ...f, diet: e.target.value }))}>
                          <option value="">Sin dieta especial</option>
                          {['VEGETARIANO','VEGANO','HALAL','KOSHER','SIN_SAL','DIABETICO'].map(d => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
                        </select>
                        <div>
                          <p className="label mb-1.5">Alérgenos</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {ALLERGEN_LIST.map(a => <button key={a} type="button" onClick={() => toggleAllergen(a)} className={`p-2 rounded-lg text-xs font-medium border transition-all text-left ${guestAllergens.includes(a) ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-stone-600 border-stone-200'}`}>{ALLERGEN_LABELS[a]}</button>)}
                          </div>
                        </div>
                        <input className="input" value={guestForm.observations} onChange={e => setGuestForm(f => ({ ...f, observations: e.target.value }))} placeholder="Observaciones..." />
                        <div className="flex gap-2"><button onClick={() => setShowAddGuest(null)} className="btn-secondary flex-1 text-sm">Cancelar</button><button onClick={() => handleAddGuest(table.id)} className="btn-primary flex-1 text-sm">Guardar</button></div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        <DragOverlay>{dragging ? <div className="bg-white border-2 border-rose-300 rounded-xl p-3 shadow-xl text-sm font-semibold text-stone-900">Moviendo invitado...</div> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}

// ── Facturación ────────────────────────────────────────────────────────────────
function FacturacionTab({ event, invoice, reload }) {
  const [signing, setSigning] = useState(false);
  const handleSign = async () => {
    if (!confirm('¿Confirmas que aceptas el presupuesto?')) return;
    setSigning(true);
    try { await api.post(`/events/${event.id}/invoice/sign`, { signatureData: 'ACEPTADO_ONLINE_' + new Date().toISOString() }); reload(); toast.success('¡Presupuesto firmado! Gracias.'); }
    catch { toast.error('Error al firmar'); }
    finally { setSigning(false); }
  };

  if (!invoice) return <div className="card text-center py-14"><CreditCard size={36} className="text-stone-300 mx-auto mb-3" /><p className="text-stone-500">Tu presupuesto aún no está disponible. El salón lo preparará pronto.</p></div>;

  return (
    <div className="space-y-4">
      <div><h2 className="text-xl font-bold text-stone-900">Facturación</h2><p className="text-stone-500 text-sm mt-0.5">Revisa tu presupuesto y el estado de los pagos</p></div>
      <div className="card">
        <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-stone-900">Presupuesto</h3>{invoice.invoiceNumber && <span className="text-xs text-stone-400">Ref: {invoice.invoiceNumber}</span>}</div>
        {invoice.description && <p className="text-stone-600 text-sm mb-4">{invoice.description}</p>}
        {invoice.breakdown && <pre className="bg-stone-50 rounded-2xl p-4 text-sm text-stone-700 whitespace-pre-wrap mb-4 font-mono border border-stone-100">{invoice.breakdown}</pre>}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-stone-50 rounded-2xl"><p className="text-xl font-bold text-stone-900">{invoice.totalAmount?.toLocaleString('es-ES')}€</p><p className="text-xs text-stone-500 mt-0.5">Total</p></div>
          <div className="text-center p-3 bg-emerald-50 rounded-2xl"><p className="text-xl font-bold text-emerald-600">{invoice.paidAmount?.toLocaleString('es-ES')}€</p><p className="text-xs text-stone-500 mt-0.5">Pagado</p></div>
          <div className="text-center p-3 bg-amber-50 rounded-2xl"><p className="text-xl font-bold text-amber-600">{invoice.pendingAmount?.toLocaleString('es-ES')}€</p><p className="text-xs text-stone-500 mt-0.5">Pendiente</p></div>
        </div>
        {invoice.signed ? <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl text-emerald-700 text-sm font-medium"><CheckCircle size={16} /> Aceptado el {new Date(invoice.signedAt).toLocaleDateString('es-ES')}</div>
          : <button onClick={handleSign} disabled={signing} className="btn-primary w-full py-3">{signing ? 'Procesando...' : '✍️ Aceptar y firmar presupuesto'}</button>}
      </div>
      {invoice.payments?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-3">Historial de pagos</h3>
          <div className="space-y-2">
            {invoice.payments.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`badge flex-none ${p.status === 'PAGADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{p.status}</span>
                  <span className="text-stone-600 truncate">{p.description}</span>
                  {p.paymentDate && <span className="text-stone-400 text-xs flex-none">{new Date(p.paymentDate).toLocaleDateString('es-ES')}</span>}
                </div>
                <span className="font-bold text-stone-900 flex-none ml-2">{p.amount?.toLocaleString('es-ES')}€</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

