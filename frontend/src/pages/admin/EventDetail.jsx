import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { ArrowLeft, Music2, Layers, ChefHat, UserPlus, Trash2, Edit2, X, AlertTriangle, Table2, Map, ZoomIn, ZoomOut, Upload, RotateCcw, Download } from 'lucide-react';
import PdfDownloadButton from '../../components/PdfDownloadButton';
import ProtocolPdfDoc  from '../../components/pdf/ProtocolPdfDoc';
import TablesPdfDoc    from '../../components/pdf/TablesPdfDoc';
import AllergensPdfDoc from '../../components/pdf/AllergensPdfDoc';
import MenusPdfDoc     from '../../components/pdf/MenusPdfDoc';
import InvoicePdfDoc   from '../../components/pdf/InvoicePdfDoc';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { id: 'info',         label: 'Información' },
  { id: 'asignaciones', label: 'Personal'     },
  { id: 'menus',        label: 'Menús'        },
  { id: 'allergens',    label: 'Alérgenos'    },
  { id: 'protocol',     label: 'Protocolo'    },
  { id: 'mesas',        label: 'Mesas'        },
  { id: 'planos',       label: 'Planos'       },
  { id: 'invoice',      label: 'Facturación'  },
  { id: 'reminders',    label: 'Recordatorios'},
];

const STATUS_OPTIONS = ['BORRADOR','PENDIENTE_INFO','EN_CURSO','CONFIRMADO','COMPLETADO','CANCELADO'];
const STATUS_LABELS = { BORRADOR:'Borrador', PENDIENTE_INFO:'Pendiente info', EN_CURSO:'En curso', CONFIRMADO:'Confirmado', COMPLETADO:'Completado', CANCELADO:'Cancelado' };

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [tab, setTab] = useState('info');
  const [event, setEvent] = useState(null);
  const [menus, setMenus] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [protocol, setProtocol] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [tables, setTables] = useState([]);

  const loadEvent       = () => api.get(`/events/${id}`).then(r => setEvent(r.data));
  const loadMenus       = () => api.get(`/events/${id}/menus`).then(r => setMenus(r.data));
  const loadAllergens   = () => api.get(`/events/${id}/allergens`).then(r => setAllergens(r.data));
  const loadProtocol    = () => api.get(`/events/${id}/protocol`).then(r => setProtocol(r.data));
  const loadInvoice     = () => api.get(`/events/${id}/invoice`).then(r => setInvoice(r.data)).catch(() => setInvoice(null));
  const loadAssignments = () => api.get(`/events/${id}/assignments`).then(r => setAssignments(r.data));
  const loadStaff       = () => api.get('/users/staff').then(r => setStaff(r.data)).catch(() => {});
  const loadTables      = () => api.get(`/events/${id}/tables`).then(r => setTables(r.data)).catch(() => {});

  useEffect(() => {
    loadEvent(); loadMenus(); loadAllergens(); loadProtocol();
    loadInvoice(); loadAssignments(); loadStaff(); loadTables();
  }, [id]);

  if (!event) return <Layout><div className="animate-pulse text-center p-20 text-stone-400">Cargando...</div></Layout>;

  const handleStatusChange = async (status) => {
    try {
      await api.patch(`/events/${id}/status`, { status });
      setEvent(ev => ({ ...ev, status, statusLabel: STATUS_LABELS[status] }));
      toast.success('Estado actualizado');
    } catch { toast.error('Error al actualizar estado'); }
  };

  const sendReminder = async (channel) => {
    const message = `Hola ${event.clientName}, le recordamos que tiene pendiente completar información para su evento. Acceda al portal: http://localhost:5173/login`;
    try {
      await api.post(`/dashboard/send-reminder/${id}`, { message, channel, subject: 'Recordatorio de su evento' });
      toast.success(`Recordatorio enviado por ${channel}`);
    } catch { toast.error('Error enviando recordatorio'); }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin/eventos')}
              className="flex items-center gap-1 text-stone-400 hover:text-stone-600 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">{event.clientName}</h1>
              <p className="text-stone-500">
                {event.typeLabel} · {new Date(event.eventDate).toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <select value={event.status} onChange={e => handleStatusChange(e.target.value)} className="input w-auto text-sm">
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </div>

        {/* Completitud */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { ok: event.menuConfirmed,      label: 'Menú confirmado',       icon: '🍽️' },
            { ok: event.allergensCompleted, label: 'Alérgenos registrados', icon: '⚠️' },
            { ok: event.protocolCompleted,  label: 'Protocolo completo',    icon: '📋' },
            { ok: event.budgetSigned,       label: 'Presupuesto firmado',   icon: '✍️' },
          ].map(item => (
            <div key={item.label} className={`card p-4 text-center ${item.ok ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="text-2xl mb-1">{item.icon}</div>
              <p className={`text-xs font-medium ${item.ok ? 'text-emerald-700' : 'text-amber-700'}`}>
                {item.ok ? '✅' : '⚠️'} {item.label}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-stone-200">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id ? 'border-rose-600 text-rose-600' : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {tab === 'info'         && <InfoTab event={event} />}
        {tab === 'asignaciones' && <AsignacionesTab eventId={id} assignments={assignments} staff={staff} reload={loadAssignments} />}
        {tab === 'menus'        && <MenusTab eventId={id} event={event} menus={menus} reload={loadMenus} />}
        {tab === 'allergens'    && <AllergensTab eventId={id} event={event} tables={tables} reload={() => { loadTables(); loadEvent(); }} onGoToMesas={() => setTab('mesas')} />}
        {tab === 'protocol'     && <ProtocolTab eventId={id} event={event} items={protocol} reload={() => { loadProtocol(); loadEvent(); }} />}
        {tab === 'mesas'        && <MesasAdminTab eventId={id} event={event} tables={tables} reload={() => { loadTables(); loadEvent(); }} />}
        {tab === 'planos'       && <PlanosTab eventId={id} event={event} hasPermission={hasPermission} />}
        {tab === 'invoice'      && <InvoiceTab eventId={id} event={event} invoice={invoice} reload={loadInvoice} />}
        {tab === 'reminders'    && <RemindersTab event={event} onSend={sendReminder} />}
      </div>
    </Layout>
  );
}

// -- Tab Components --

// ── Constantes compartidas ─────────────────────────────────────────────────────
const ALLERGEN_LIST = ['GLUTEN','LACTEOS','HUEVOS','FRUTOS_SECOS','CACAHUETES','SOJA','MARISCO','PESCADO','MOSTAZA','APIO','SESAMO','SULFITOS','MOLUSCOS','ALTRAMUZ'];
const ALLERGEN_LABELS_MAP = { GLUTEN:'Gluten/Celíaco', LACTEOS:'Lácteos', HUEVOS:'Huevos', FRUTOS_SECOS:'Frutos secos', CACAHUETES:'Cacahuetes', SOJA:'Soja', MARISCO:'Marisco', PESCADO:'Pescado', MOSTAZA:'Mostaza', APIO:'Apio', SESAMO:'Sésamo', SULFITOS:'Sulfitos', MOLUSCOS:'Moluscos', ALTRAMUZ:'Altramuces' };
const ALLERGEN_BADGE_COLORS = ['bg-amber-50 text-amber-700 border border-amber-200','bg-red-50 text-red-700 border border-red-200','bg-orange-50 text-orange-700 border border-orange-200','bg-yellow-50 text-yellow-700 border border-yellow-200'];
const DIET_COLORS = { VEGETARIANO:'bg-green-100 text-green-700', VEGANO:'bg-emerald-100 text-emerald-700', HALAL:'bg-teal-100 text-teal-700', KOSHER:'bg-cyan-100 text-cyan-700', SIN_SAL:'bg-sky-100 text-sky-700', DIABETICO:'bg-blue-100 text-blue-700' };

function InfoTab({ event }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-stone-800 mb-4">Datos del evento</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
        {[
          { label: 'Cliente',             value: event.clientName        },
          { label: 'Tipo',                value: event.typeLabel         },
          { label: 'Fecha',               value: new Date(event.eventDate).toLocaleDateString('es-ES') },
          { label: 'Invitados estimados', value: event.estimatedGuests   },
          { label: 'Salón',               value: event.venue             },
          { label: 'Contacto',            value: event.contactPerson     },
          { label: 'Teléfono',            value: event.phone             },
          { label: 'Email',               value: event.email             },
          { label: 'Acceso cliente',      value: event.clientUsername    },
        ].map(item => item.value ? (
          <div key={item.label}>
            <dt className="text-stone-500">{item.label}</dt>
            <dd className="font-medium text-stone-900">{item.value}</dd>
          </div>
        ) : null)}
      </dl>
      {event.notes && (
        <div className="mt-4 pt-4 border-t border-stone-100">
          <p className="text-stone-500 text-sm mb-1">Notas internas</p>
          <p className="text-stone-700 text-sm">{event.notes}</p>
        </div>
      )}
    </div>
  );
}

function AsignacionesTab({ eventId, assignments, staff, reload }) {
  const [selectedUser, setSelectedUser] = useState('');

  const ROLE_ICONS  = { DJ: Music2, FLOOR: Layers, KITCHEN: ChefHat };
  const ROLE_COLORS = { DJ:'bg-blue-100 text-blue-700', FLOOR:'bg-emerald-100 text-emerald-700', KITCHEN:'bg-orange-100 text-orange-700', OFFICE:'bg-violet-100 text-violet-700' };
  const ROLE_LABELS = { DJ:'DJ', FLOOR:'Sala/Metres', KITCHEN:'Cocina', OFFICE:'Oficina' };

  const assignedIds = assignments.map(a => a.userId);
  const available   = staff.filter(u => !assignedIds.includes(u.id) && u.role !== 'OFFICE' && u.role !== 'CLIENT');

  const handleAssign = async () => {
    if (!selectedUser) { toast.error('Selecciona un usuario'); return; }
    try {
      await api.post(`/events/${eventId}/assignments`, { userId: parseInt(selectedUser) });
      reload(); setSelectedUser(''); toast.success('Personal asignado ?');
    } catch { toast.error('Error al asignar'); }
  };

  const handleRemove = async (userId, nombre) => {
    if (!confirm(`¿Quitar a "${nombre}" de este evento?`)) return;
    try {
      await api.delete(`/events/${eventId}/assignments/${userId}`);
      reload(); toast.success('Asignación eliminada');
    } catch { toast.error('Error'); }
  };

  return (
    <div className="space-y-5">
      <div className="card">
        <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <UserPlus size={18} className="text-stone-500" />
          Asignar personal a este evento
        </h3>
        {available.length === 0 ? (
          <p className="text-sm text-stone-400">Todo el personal disponible ya está asignado.</p>
        ) : (
          <div className="flex gap-3">
            <select className="input flex-1" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
              <option value="">Seleccionar persona...</option>
              {available.map(u => (
                <option key={u.id} value={u.id}>{u.nombre} ({ROLE_LABELS[u.role] || u.role})</option>
              ))}
            </select>
            <button onClick={handleAssign} className="btn-primary flex-none">
              <UserPlus size={16} /> Asignar
            </button>
          </div>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="card text-center py-12">
          <UserPlus size={36} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-medium">Sin personal asignado</p>
          <p className="text-stone-400 text-sm mt-1">Asigna DJ, metres o cocina para que puedan ver este evento en su panel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {assignments.map(a => {
            const Icon = ROLE_ICONS[a.role] || UserPlus;
            return (
              <div key={a.id} className="card p-4 flex items-center gap-3 group">
                <div className={`w-10 h-10 rounded-xl ${ROLE_COLORS[a.role]} flex items-center justify-center flex-none`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-900 text-sm">{a.nombre}</p>
                  <p className="text-xs text-stone-400">@{a.username}</p>
                  <span className={`badge ${ROLE_COLORS[a.role]} text-xs mt-0.5`}>{ROLE_LABELS[a.role] || a.role}</span>
                </div>
                <button onClick={() => handleRemove(a.userId, a.nombre)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity btn-ghost p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 size={14} className="text-stone-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MenusTab({ eventId, event, menus, reload }) {
  const [form, setForm] = useState({ name:'', description:'', starters:'', firstCourse:'', secondCourse:'', dessert:'', drinks:'', extras:'' });
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async () => {
    try {
      await api.post(`/events/${eventId}/menus`, form);
      reload(); setShowForm(false);
      setForm({ name:'', description:'', starters:'', firstCourse:'', secondCourse:'', dessert:'', drinks:'', extras:'' });
      toast.success('Menú creado');
    } catch { toast.error('Error al crear menú'); }
  };
  const handleSelect = async (menuId) => {
try { await api.post(`/events/${eventId}/menus/${menuId}/select`); reload(); toast.success('Menú seleccionado'); }
    catch { toast.error('Error'); }
  };
  const handleDelete = async (menuId) => {
    if (!confirm('¿Eliminar menú?')) return;
    try { await api.delete(`/events/${eventId}/menus/${menuId}`); reload(); toast.success('Menú eliminado'); }
    catch { toast.error('Error'); }
  };

  const fetchPdfData = async () => {
    const r = await api.get(`/events/${eventId}/menus`);
    return { event, menus: r.data };
  };
  const safeName = (event?.clientName || 'evento').replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-stone-800">Menús del evento</h3>
        <div className="flex items-center gap-2">
          <PdfDownloadButton
            permissionCode="PDF_MENUS"
            label="PDF menús"
            fileName={`menus-${safeName}.pdf`}
            fetchData={fetchPdfData}
            DocumentComponent={MenusPdfDoc}
          />
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">+ Añadir menú</button>
        </div>
      </div>
      {showForm && (
        <div className="card border-rose-100">
          <h4 className="font-medium mb-3">Nuevo menú</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[['name','Nombre *'],['starters','Entrantes'],['firstCourse','Primer plato'],['secondCourse','Segundo plato'],['dessert','Postre'],['drinks','Bebidas'],['extras','Extras']].map(([k,l]) => (
              <div key={k}>
                <label className="label">{l}</label>
                <textarea className="input" rows={2} value={form[k]||''} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreate} className="btn-primary">Guardar menú</button>
          </div>
        </div>
      )}
      {menus.length === 0 && !showForm && <p className="text-stone-500 text-sm">No hay menús. Añade uno para que el cliente pueda seleccionar.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {menus.map(m => (
          <div key={m.id} className={`card ${m.selected ? 'border-emerald-400 bg-emerald-50' : ''}`}>
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-semibold">{m.name}</h4>
              {m.selected && <span className="badge bg-emerald-100 text-emerald-700">✅ Seleccionado</span>}
            </div>
            {[['Entrantes',m.starters],['1er plato',m.firstCourse],['2do plato',m.secondCourse],['Postre',m.dessert],['Bebidas',m.drinks],['Extras',m.extras]].filter(([,v])=>v).map(([l,v])=>(
              <p key={l} className="text-sm text-stone-600 mb-1"><span className="font-medium">{l}:</span> {v}</p>
            ))}
            <div className="flex gap-2 mt-4">
              {!m.selected && <button onClick={() => handleSelect(m.id)} className="btn-success text-sm flex-1">Seleccionar</button>}
              <button onClick={() => handleDelete(m.id)} className="btn-danger text-sm">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AllergensTab({ eventId, event, tables, reload, onGoToMesas }) {
  // ── Estado del formulario "Añadir alérgeno" ──────────────────────────────
  const [showForm,         setShowForm]        = useState(false);
  const [formMesaId,       setFormMesaId]      = useState('');
  const [formGuestId,      setFormGuestId]     = useState('');
  const [newAllergies,     setNewAllergies]    = useState([]);
  const [newDiet,          setNewDiet]         = useState('');
  const [newObs,           setNewObs]          = useState('');

  // ── Estado de edición inline ──────────────────────────────────────────────
  const [editingId,  setEditingId]  = useState(null);
  const [editForm,   setEditForm]   = useState({ allergies: [], diet: '', observations: '' });
  const [saving,     setSaving]     = useState(false);

  // ── Datos derivados ───────────────────────────────────────────────────────
  const allGuests = tables.flatMap(t =>
    (t.guests || []).map(g => ({ ...g, tableName: t.name, tableId: t.id }))
  );
  // Solo mesas con al menos un invitado con restricción
  const tablesWithRestrictions = tables.filter(t =>
    (t.guests || []).some(g => g.allergies || g.diet)
  );
  const withRestrictionsCount = allGuests.filter(g => g.allergies || g.diet).length;

  // Invitados de la mesa seleccionada en el formulario (para el step 2)
  const guestsInFormMesa = formMesaId
    ? (tables.find(t => t.id === parseInt(formMesaId))?.guests || [])
    : [];

  // ── Formulario "Añadir" ───────────────────────────────────────────────────
  const openForm = () => {
    setShowForm(true); setFormMesaId(''); setFormGuestId('');
    setNewAllergies([]); setNewDiet(''); setNewObs('');
  };
  const toggleNew = a =>
    setNewAllergies(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]);

  const handleAdd = async () => {
    if (!formGuestId) { toast.error('Selecciona un invitado'); return; }
    const mesa  = tables.find(t => t.id === parseInt(formMesaId));
    const guest = (mesa?.guests || []).find(g => g.id === parseInt(formGuestId));
    if (!guest) return;
    if (!newAllergies.length && !newDiet) { toast.error('Selecciona al menos un alérgeno o dieta'); return; }
    setSaving(true);
    try {
      await api.put(`/events/${eventId}/tables/${mesa.id}/guests/${guest.id}`, {
        guestName: guest.guestName,
        allergies: newAllergies.join(','),
        diet: newDiet,
        observations: newObs,
      });
      toast.success('Alérgenos asignados');
      setShowForm(false);
      reload();
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  // ── Edición inline ────────────────────────────────────────────────────────
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
      await api.put(`/events/${eventId}/tables/${g.tableId}/guests/${g.id}`, {
        guestName: g.guestName,
        allergies: editForm.allergies.join(','),
        diet:      editForm.diet,
        observations: editForm.observations,
      });
      toast.success('Actualizado');
      setEditingId(null);
      reload();
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleClear = async g => {
    if (!confirm(`¿Eliminar las restricciones de ${g.guestName}?`)) return;
    try {
      await api.put(`/events/${eventId}/tables/${g.tableId}/guests/${g.id}`,
        { guestName: g.guestName, allergies: '', diet: '', observations: '' });
      toast.success('Restricciones eliminadas');
      reload();
    } catch { toast.error('Error'); }
  };

  const fetchPdfData = async () => {
    const r = await api.get(`/events/${eventId}/allergens`);
    return { event, allergens: r.data.filter(x => x.allergies || x.diet) };
  };
  const safeName = (event?.clientName || 'evento').replace(/\s+/g, '-').toLowerCase();

  // ── Guards ────────────────────────────────────────────────────────────────
  if (tables.length === 0) return (
    <div className="card text-center py-16">
      <AlertTriangle size={40} className="text-stone-300 mx-auto mb-4" />
      <h3 className="font-semibold text-stone-700 mb-2">Sin mesas creadas</h3>
      <p className="text-stone-500 text-sm mb-5">Primero debes crear mesas e invitados antes de gestionar alérgenos.</p>
      <button onClick={onGoToMesas} className="btn-primary text-sm inline-flex items-center gap-2 mx-auto">
        <Table2 size={14} /> Ir a Mesas
      </button>
    </div>
  );

  if (allGuests.length === 0) return (
    <div className="card text-center py-16">
      <AlertTriangle size={40} className="text-stone-300 mx-auto mb-4" />
      <h3 className="font-semibold text-stone-700 mb-2">Sin invitados</h3>
      <p className="text-stone-500 text-sm mb-5">Añade invitados en la pestaña Mesas para gestionar sus alérgenos.</p>
      <button onClick={onGoToMesas} className="btn-primary text-sm inline-flex items-center gap-2 mx-auto">
        <Table2 size={14} /> Ir a Mesas
      </button>
    </div>
  );

  // ── Render principal ──────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-stone-800">Alérgenos y dietas especiales</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            {withRestrictionsCount > 0
              ? `${withRestrictionsCount} de ${allGuests.length} invitados con restricciones`
              : 'Ningún invitado tiene restricciones todavía'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PdfDownloadButton
            permissionCode="PDF_ALLERGENS"
            label="PDF alérgenos"
            fileName={`alergenos-${safeName}.pdf`}
            fetchData={fetchPdfData}
            DocumentComponent={AllergensPdfDoc}
          />
          <button onClick={openForm}
            className="btn-primary text-sm inline-flex items-center gap-1.5">
            + Añadir alérgeno
          </button>
        </div>
      </div>

      {/* ── Formulario 3 pasos ── */}
      {showForm && (
        <div className="card border-amber-200 bg-amber-50/30 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-stone-800">Asignar alérgenos a un invitado</h4>
            <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600"><X size={16} /></button>
          </div>

          {/* Paso 1 — Mesa */}
          <div>
            <label className="label">Paso 1 — Selecciona la mesa</label>
            <select className="input"
              value={formMesaId}
              onChange={e => { setFormMesaId(e.target.value); setFormGuestId(''); }}>
              <option value="">— Seleccionar mesa —</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.guestCount ? ` (${t.guestCount} inv.)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Paso 2 — Invitado */}
          {formMesaId && (
            <div>
              <label className="label">Paso 2 — Selecciona el invitado</label>
              {guestsInFormMesa.length === 0
                ? <p className="text-sm text-stone-400 italic">Esta mesa no tiene invitados registrados.</p>
                : (
                  <select className="input" value={formGuestId} onChange={e => setFormGuestId(e.target.value)}>
                    <option value="">— Seleccionar invitado —</option>
                    {guestsInFormMesa.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.guestName}{(g.allergies || g.diet) ? ' ⚠' : ''}
                      </option>
                    ))}
                  </select>
                )}
            </div>
          )}

          {/* Paso 3 — Alérgenos */}
          {formGuestId && (
            <>
              <div>
                <label className="label">Paso 3 — Alérgenos</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {ALLERGEN_LIST.map(a => (
                    <button key={a} type="button" onClick={() => toggleNew(a)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        newAllergies.includes(a)
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'
                      }`}>
                      {ALLERGEN_LABELS_MAP[a]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Dieta especial</label>
                <select className="input" value={newDiet} onChange={e => setNewDiet(e.target.value)}>
                  <option value="">Ninguna</option>
                  {['VEGETARIANO','VEGANO','HALAL','KOSHER','SIN_SAL','DIABETICO'].map(d => (
                    <option key={d} value={d}>{d.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Observaciones</label>
                <input className="input" value={newObs}
                  onChange={e => setNewObs(e.target.value)}
                  placeholder="Alergia muy grave, llevar EpiPen..." />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleAdd} disabled={!formGuestId || saving}
              className="btn-primary flex-1">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Sin restricciones todavía */}
      {tablesWithRestrictions.length === 0 && !showForm && (
        <div className="card text-center py-10">
          <div className="text-3xl mb-3">✅</div>
          <p className="text-stone-500 text-sm">Ningún invitado tiene restricciones registradas.</p>
          <p className="text-stone-400 text-xs mt-1">Usa "+ Añadir alérgeno" para registrar la primera.</p>
        </div>
      )}

      {/* ── Listado: solo mesas con restricciones, solo invitados con restricciones ── */}
      {tablesWithRestrictions.map(table => {
        const restricted = (table.guests || [])
          .filter(g => g.allergies || g.diet)
          .map(g => ({ ...g, tableId: table.id, tableName: table.name }));

        return (
          <div key={table.id} className="card border-amber-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold text-stone-800">🪑 {table.name}</span>
              <span className="badge bg-amber-100 text-amber-700 text-[10px]">
                ⚠ {restricted.length} restricción{restricted.length !== 1 ? 'es' : ''}
              </span>
              <span className="ml-auto text-xs text-stone-400">
                {(table.guests || []).length} inv. en total
              </span>
            </div>

            <div className="space-y-2">
              {restricted.map(g => {
                const isEditing = editingId === g.id;
                return (
                  <div key={g.id}
                    className={`rounded-xl border transition-all ${isEditing ? 'border-amber-200 bg-amber-50/40' : 'border-stone-100 bg-stone-50'}`}>

                    {!isEditing && (
                      <div className="flex items-start justify-between p-3 gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-stone-900">{g.guestName}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {g.diet && (
                              <span className={`badge text-[10px] ${DIET_COLORS[g.diet] || 'bg-purple-100 text-purple-700'}`}>
                                {g.diet.replace('_', ' ')}
                              </span>
                            )}
                            {g.allergies && g.allergies.split(',').filter(Boolean).map((a, idx) => (
                              <span key={a} className={`badge text-[10px] ${ALLERGEN_BADGE_COLORS[idx % ALLERGEN_BADGE_COLORS.length]}`}>
                                ⚠ {ALLERGEN_LABELS_MAP[a] || a}
                              </span>
                            ))}
                          </div>
                          {g.observations && <p className="text-[10px] text-stone-400 italic mt-1">{g.observations}</p>}
                        </div>
                        <div className="flex items-center gap-1 flex-none">
                          <button onClick={() => startEdit(g)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Editar">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleClear(g)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar restricciones">
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    )}

                    {isEditing && (
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm text-stone-900">✏️ {g.guestName}</p>
                          <button onClick={() => setEditingId(null)} className="text-stone-400 hover:text-stone-600"><X size={15} /></button>
                        </div>
                        <div>
                          <label className="label text-xs mb-1.5 block">Alérgenos</label>
                          <div className="flex flex-wrap gap-1.5">
                            {ALLERGEN_LIST.map(a => (
                              <button key={a} type="button" onClick={() => toggleEdit(a)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                                  editForm.allergies.includes(a)
                                    ? 'bg-amber-500 text-white border-amber-500'
                                    : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'
                                }`}>
                                {ALLERGEN_LABELS_MAP[a]}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="label text-xs mb-1 block">Dieta especial</label>
                          <select className="input text-sm" value={editForm.diet}
                            onChange={e => setEditForm(f => ({ ...f, diet: e.target.value }))}>
                            <option value="">Ninguna</option>
                            {['VEGETARIANO','VEGANO','HALAL','KOSHER','SIN_SAL','DIABETICO'].map(d => (
                              <option key={d} value={d}>{d.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="label text-xs mb-1 block">Observaciones</label>
                          <input className="input text-sm" value={editForm.observations}
                            onChange={e => setEditForm(f => ({ ...f, observations: e.target.value }))}
                            placeholder="Alergia muy grave, llevar EpiPen..." />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => setEditingId(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
                          <button onClick={() => handleSave(g)} disabled={saving} className="btn-primary flex-1 text-sm">
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

function ProtocolTab({ eventId, event, items, reload }) {
  const [form, setForm] = useState({ eventTime:'', description:'', involvedPerson:'', youtubeLink:'', observations:'' });
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async () => {
    try {
      await api.post(`/events/${eventId}/protocol`, { ...form, position: items.length + 1 });
      reload(); setShowForm(false);
      setForm({ eventTime:'', description:'', involvedPerson:'', youtubeLink:'', observations:'' });
      toast.success('Momento añadido');
    } catch { toast.error('Error'); }
  };
  const handleDelete = async (itemId) => {
    try { await api.delete(`/events/${eventId}/protocol/${itemId}`); reload(); }
    catch { toast.error('Error'); }
  };

  const fetchPdfData = async () => {
    const r = await api.get(`/events/${eventId}/protocol`);
    return { event, protocol: r.data };
  };
  const safeName = (event?.clientName || 'evento').replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-stone-800">Protocolo del evento</h3>
        <div className="flex items-center gap-2">
          <PdfDownloadButton
            permissionCode="PDF_PROTOCOL"
            label="PDF protocolo"
            fileName={`protocolo-${safeName}.pdf`}
            fetchData={fetchPdfData}
            DocumentComponent={ProtocolPdfDoc}
          />
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">+ Añadir momento</button>
        </div>
      </div>
      {showForm && (
        <div className="card border-blue-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="label">Hora</label><input className="input" type="time" value={form.eventTime} onChange={e=>setForm(f=>({...f,eventTime:e.target.value}))} /></div>
            <div><label className="label">Descripción *</label><input className="input" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Entrada de los novios" /></div>
            <div><label className="label">Persona implicada</label><input className="input" value={form.involvedPerson} onChange={e=>setForm(f=>({...f,involvedPerson:e.target.value}))} /></div>
            <div><label className="label">Enlace YouTube / Canción</label><input className="input" value={form.youtubeLink} onChange={e=>setForm(f=>({...f,youtubeLink:e.target.value}))} placeholder="https://youtube.com/..." /></div>
            <div className="sm:col-span-2"><label className="label">Observaciones</label><input className="input" value={form.observations} onChange={e=>setForm(f=>({...f,observations:e.target.value}))} /></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreate} className="btn-primary">Guardar</button>
          </div>
        </div>
      )}
      {items.length === 0 && !showForm && <p className="text-stone-500 text-sm">No hay protocolo definido.</p>}
      <div className="relative">
        {items.map((item, i) => (
          <div key={item.id} className="flex gap-4 mb-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold">{i+1}</div>
              {i < items.length - 1 && <div className="w-0.5 h-full bg-stone-200 my-1" />}
            </div>
            <div className="card flex-1 p-4">
              <div className="flex justify-between items-start">
                <div>
                  {item.eventTime && <span className="text-sm font-semibold text-rose-600">{item.eventTime} · </span>}
                  <span className="font-medium">{item.description}</span>
                  {item.involvedPerson && <p className="text-sm text-stone-500 mt-1">👤 {item.involvedPerson}</p>}
                  {item.youtubeLink && <a href={item.youtubeLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">🎵 {item.youtubeLink}</a>}
                  {item.observations && <p className="text-sm text-stone-500 mt-1 italic">{item.observations}</p>}
                </div>
                <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 text-sm ml-2">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoiceTab({ eventId, event, invoice, reload }) {
  const [form, setForm] = useState({ totalAmount: invoice?.totalAmount || '', description: invoice?.description || '', breakdown: invoice?.breakdown || '' });
  const [payForm, setPayForm] = useState({ amount:'', description:'', paymentDate:'', status:'PAGADO', method:'TRANSFERENCIA' });

  const handleSave = async () => {
    try {
      await api.post(`/events/${eventId}/invoice`, { ...form, totalAmount: parseFloat(form.totalAmount) });
      reload(); toast.success('Presupuesto guardado');
    } catch { toast.error('Error'); }
  };
  const handleAddPayment = async () => {
    if (!invoice) { toast.error('Guarda el presupuesto primero'); return; }
    try {
      await api.post(`/events/${eventId}/invoice/${invoice.id}/payments`, { ...payForm, amount: parseFloat(payForm.amount) });
      reload(); setPayForm({ amount:'', description:'', paymentDate:'', status:'PAGADO', method:'TRANSFERENCIA' });
      toast.success('Pago registrado');
    } catch { toast.error('Error'); }
  };
  const handleDeletePayment = async (paymentId) => {
    try { await api.delete(`/events/${eventId}/invoice/${invoice.id}/payments/${paymentId}`); reload(); }
    catch { toast.error('Error'); }
  };

  const fetchPdfData = async () => {
    const r = await api.get(`/events/${eventId}/invoice`).catch(() => ({ data: null }));
    return { event, invoice: r.data };
  };
  const safeName = (event?.clientName || 'evento').replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-stone-800 text-lg">Facturación</h3>
        <PdfDownloadButton
          permissionCode="PDF_INVOICES"
            label="PDF facturación"
          fileName={`facturacion-${safeName}.pdf`}
          fetchData={fetchPdfData}
          DocumentComponent={InvoicePdfDoc}
        />
      </div>
      <div className="card">
        <h3 className="font-semibold mb-4">Presupuesto</h3>
        {invoice && <p className="text-xs text-stone-400 mb-3">Ref: {invoice.invoiceNumber}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div><label className="label">Importe total (€) *</label><input className="input" type="number" value={form.totalAmount} onChange={e=>setForm(f=>({...f,totalAmount:e.target.value}))} placeholder="5000" /></div>
          <div><label className="label">Descripción</label><input className="input" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Boda completa" /></div>
          <div className="sm:col-span-2"><label className="label">Desglose de conceptos</label><textarea className="input" rows={3} value={form.breakdown} onChange={e=>setForm(f=>({...f,breakdown:e.target.value}))} placeholder="Salón: 2000€&#10;Catering: 3000€" /></div>
        </div>
        <button onClick={handleSave} className="btn-primary">Guardar presupuesto</button>
        {invoice?.signed && <span className="ml-3 badge bg-emerald-100 text-emerald-700">✅ Firmado el {new Date(invoice.signedAt).toLocaleDateString('es-ES')}</span>}
      </div>

      {invoice && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center"><p className="text-2xl font-bold text-stone-900">{invoice.totalAmount?.toLocaleString('es-ES')}€</p><p className="text-sm text-stone-500">Total</p></div>
            <div className="card p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{invoice.paidAmount?.toLocaleString('es-ES')}€</p><p className="text-sm text-stone-500">Pagado</p></div>
            <div className="card p-4 text-center"><p className="text-2xl font-bold text-amber-600">{invoice.pendingAmount?.toLocaleString('es-ES')}€</p><p className="text-sm text-stone-500">Pendiente</p></div>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-4">Registrar pago</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <div><label className="label">Importe (€)</label><input className="input" type="number" value={payForm.amount} onChange={e=>setPayForm(f=>({...f,amount:e.target.value}))} /></div>
              <div><label className="label">Fecha</label><input className="input" type="date" value={payForm.paymentDate} onChange={e=>setPayForm(f=>({...f,paymentDate:e.target.value}))} /></div>
              <div><label className="label">Descripción</label><input className="input" value={payForm.description} onChange={e=>setPayForm(f=>({...f,description:e.target.value}))} placeholder="Señal, pago final..." /></div>
              <div><label className="label">Método</label>
                <select className="input" value={payForm.method} onChange={e=>setPayForm(f=>({...f,method:e.target.value}))}>
                  {['TRANSFERENCIA','EFECTIVO','TARJETA','BIZUM'].map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleAddPayment} className="btn-success text-sm">+ Registrar pago</button>
            <div className="mt-4 space-y-2">
              {invoice.payments?.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl text-sm">
                  <div>
                    <span className="font-medium">{p.amount?.toLocaleString('es-ES')}€</span>
                    <span className="text-stone-500 ml-2">{p.description}</span>
                    {p.paymentDate && <span className="text-stone-400 ml-2">{new Date(p.paymentDate).toLocaleDateString('es-ES')}</span>}
                    {p.method && <span className="badge bg-stone-100 text-stone-600 ml-2">{p.method}</span>}
                  </div>
                  <button onClick={() => handleDeletePayment(p.id)} className="text-red-400 hover:text-red-600">✕</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RemindersTab({ event, onSend }) {
  const pending = [];
  if (!event.menuConfirmed)      pending.push('El menú aún no ha sido confirmado.');
  if (!event.allergensCompleted) pending.push('No hay alérgenos registrados.');
  if (!event.protocolCompleted)  pending.push('El protocolo del evento no está completo.');
  if (!event.budgetSigned)       pending.push('El presupuesto no ha sido firmado.');

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-3">Estado de tareas pendientes</h3>
        {pending.length === 0 ? (
          <p className="text-emerald-600">✅ Todo completado</p>
        ) : (
          <ul className="space-y-2">
            {pending.map(p => <li key={p} className="flex items-center gap-2 text-amber-700"><span>⚠️</span>{p}</li>)}
          </ul>
        )}
      </div>
      <div className="card">
        <h3 className="font-semibold mb-3">Enviar recordatorio manual</h3>
        <p className="text-sm text-stone-500 mb-4">Se enviará un recordatorio al cliente para que complete la información pendiente.</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => onSend('EMAIL')}    className="btn-secondary text-sm">📧 Enviar por Email</button>
          <button onClick={() => onSend('SMS')}      className="btn-secondary text-sm">📱 Enviar por SMS</button>
          <button onClick={() => onSend('WHATSAPP')} className="btn-secondary text-sm">💬 Enviar por WhatsApp</button>
        </div>
      </div>
    </div>
  );
}

// -- Mesas Admin ----------------------------------------------------------------
const DIET_OPTS = ['VEGETARIANO','VEGANO','HALAL','KOSHER','SIN_SAL','DIABETICO'];

function MesasAdminTab({ eventId, event, tables, reload }) {
  const [showNewTable, setShowNewTable]       = useState(false);
  const [newTable, setNewTable]               = useState({ name: '', capacity: '', notes: '' });
  const [showAddGuest, setShowAddGuest]       = useState(null); // tableId
  const [guestForm, setGuestForm]             = useState({ guestName: '', diet: '', observations: '' });
  const [selAllergens, setSelAllergens]       = useState([]);
  const [editingGuest, setEditingGuest]       = useState(null); // { guest, tableId }
  const [editGuestForm, setEditGuestForm]     = useState({ guestName: '', diet: '', observations: '' });
  const [editSelAllergens, setEditSelAllergens] = useState([]);

  const totalGuests   = tables.reduce((s, t) => s + (t.guestCount || 0), 0);
  const totalAlergias = tables.reduce((s, t) => s + (t.allergiesCount || 0), 0);

  const fetchPdfData = async () => {
    const r = await api.get(`/events/${eventId}/tables`);
    return { event, tables: r.data };
  };
  const safeName = (event?.clientName || 'evento').replace(/\s+/g, '-').toLowerCase();

  const handleCreateTable = async () => {
    if (!newTable.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    try {
      await api.post(`/events/${eventId}/tables`, { ...newTable, capacity: newTable.capacity ? parseInt(newTable.capacity) : null });
      toast.success('Mesa creada');
      setShowNewTable(false); setNewTable({ name: '', capacity: '', notes: '' }); reload();
    } catch { toast.error('Error al crear mesa'); }
  };

  const handleDeleteTable = async (tableId, name) => {
    if (!confirm(`¿Eliminar la mesa "${name}" y todos sus invitados?`)) return;
    try { await api.delete(`/events/${eventId}/tables/${tableId}`); toast.success('Mesa eliminada'); reload(); }
    catch { toast.error('Error'); }
  };

  const handleAddGuest = async (tableId) => {
    if (!guestForm.guestName.trim()) { toast.error('El nombre es obligatorio'); return; }
    try {
      await api.post(`/events/${eventId}/tables/${tableId}/guests`, { ...guestForm, allergies: selAllergens.join(',') });
      toast.success('Invitado añadido');
      setShowAddGuest(null); setGuestForm({ guestName:'', diet:'', observations:'' }); setSelAllergens([]); reload();
    } catch { toast.error('Error'); }
  };

  const handleDeleteGuest = async (tableId, guestId) => {
    try { await api.delete(`/events/${eventId}/tables/${tableId}/guests/${guestId}`); reload(); }
    catch { toast.error('Error'); }
  };

  const handleMoveGuest = async (tableId, guestId, targetTableId) => {
    try {
      await api.patch(`/events/${eventId}/tables/${tableId}/guests/${guestId}/move`, { targetTableId });
      toast.success('Invitado movido'); reload();
    } catch { toast.error('Error al mover'); }
  };

  const startEditGuest = (g, tableId) => {
    setEditingGuest({ guestId: g.id, tableId });
    setEditGuestForm({ guestName: g.guestName, diet: g.diet || '', observations: g.observations || '' });
    setEditSelAllergens(g.allergies ? g.allergies.split(',').filter(Boolean) : []);
    setShowAddGuest(null);
  };

  const handleUpdateGuest = async () => {
    if (!editGuestForm.guestName.trim()) { toast.error('El nombre es obligatorio'); return; }
    try {
      await api.put(`/events/${eventId}/tables/${editingGuest.tableId}/guests/${editingGuest.guestId}`, {
        ...editGuestForm, allergies: editSelAllergens.join(','),
      });
      toast.success('Invitado actualizado');
      setEditingGuest(null);
      reload();
    } catch { toast.error('Error al actualizar'); }
  };

  return (
    <div className="space-y-4">
      {tables.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Mesas',     value: tables.length,  color: 'text-stone-900' },
            { label: 'Invitados', value: totalGuests,     color: 'text-stone-900' },
            { label: 'Con alergias', value: totalAlergias, color: totalAlergias > 0 ? 'text-amber-600' : 'text-emerald-600' },
          ].map(i => (
            <div key={i.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${i.color}`}>{i.value}</p>
              <p className="text-sm text-stone-500">{i.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-stone-800">
          Distribución de mesas
          <span className="text-stone-400 font-normal text-sm ml-2">(introducidas por el cliente)</span>
        </h3>
        <div className="flex items-center gap-2">
          <PdfDownloadButton
            permissionCode="PDF_TABLES"
            label="PDF mesas"
            fileName={`mesas-${safeName}.pdf`}
            fetchData={fetchPdfData}
            DocumentComponent={TablesPdfDoc}
          />
          <button onClick={() => setShowNewTable(true)} className="btn-primary text-sm">+ Nueva mesa</button>
        </div>
      </div>

      {showNewTable && (
        <div className="card border-blue-100 bg-blue-50/30">
          <h4 className="font-medium mb-3">Nueva mesa</h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="label">Nombre *</label><input className="input" value={newTable.name} onChange={e => setNewTable(f => ({ ...f, name: e.target.value }))} placeholder="Mesa 1 / Presidencial" /></div>
            <div><label className="label">Capacidad</label><input className="input" type="number" min="1" value={newTable.capacity} onChange={e => setNewTable(f => ({ ...f, capacity: e.target.value }))} placeholder="10" /></div>
            <div className="col-span-2"><label className="label">Observaciones</label><input className="input" value={newTable.notes} onChange={e => setNewTable(f => ({ ...f, notes: e.target.value }))} placeholder="Junto a la pista..." /></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowNewTable(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreateTable} className="btn-primary">Crear mesa</button>
          </div>
        </div>
      )}

      {tables.length === 0 && !showNewTable && (
        <div className="card text-center py-12 text-stone-500">
          El cliente aún no ha configurado mesas, o puedes crearlas tú desde aquí.
        </div>
      )}

      <div className="space-y-4">
        {tables.map(table => {
          const occupancy = table.capacity ? Math.round((table.guestCount / table.capacity) * 100) : null;
          return (
            <div key={table.id} className={`card ${table.allergiesCount > 0 ? 'border-amber-200' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-stone-900">{table.name}</h4>
                    {table.allergiesCount > 0 && (
                      <span className="badge bg-amber-100 text-amber-700">⚠ {table.allergiesCount} alergia{table.allergiesCount !== 1 ? 's' : ''}</span>
                    )}
                    {table.notes && <span className="text-xs text-stone-400 italic">{table.notes}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-stone-500">
                      {table.guestCount}{table.capacity ? `/${table.capacity}` : ''} invitado{table.guestCount !== 1 ? 's' : ''}
                    </span>
                    {occupancy !== null && (
                      <div className="w-20 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${occupancy >= 100 ? 'bg-red-500' : occupancy >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(occupancy, 100)}%` }} />
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => handleDeleteTable(table.id, table.name)}
                  className="text-stone-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50">
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="space-y-1.5">
                {(table.guests || []).map(g => {
                  const isEditingThis = editingGuest?.guestId === g.id;
                  return (
                    <div key={g.id}>
                      {/* Vista normal */}
                      {!isEditingThis && (
                        <div className="flex items-start justify-between p-2.5 bg-stone-50 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-stone-900">{g.guestName}</p>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {g.diet && <span className="badge bg-violet-100 text-violet-700 text-[10px]">{g.diet.replace('_',' ')}</span>}
                              {g.allergies && g.allergies.split(',').filter(Boolean).map((a, idx) => (
                                <span key={a} className={`badge text-[10px] ${ALLERGEN_BADGE_COLORS[idx % ALLERGEN_BADGE_COLORS.length]}`}>⚠ {ALLERGEN_LABELS_MAP[a] || a}</span>
                              ))}
                              {g.observations && <span className="text-[10px] text-stone-400 italic ml-1">{g.observations}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-none ml-2">
                            <button onClick={() => startEditGuest(g, table.id)}
                              className="p-1 rounded-lg text-stone-300 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Editar invitado">
                              <Edit2 size={12} />
                            </button>
                            {tables.filter(t => t.id !== table.id).length > 0 && (
                              <select
                                className="text-xs border border-stone-200 rounded-lg px-1.5 py-1 text-stone-500 bg-white cursor-pointer"
                                defaultValue=""
                                onChange={e => { if (e.target.value) handleMoveGuest(table.id, g.id, parseInt(e.target.value)); e.target.value = ''; }}
                              >
                                <option value="" disabled>Mover ↗</option>
                                {tables.filter(t => t.id !== table.id).map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            )}
                            <button onClick={() => handleDeleteGuest(table.id, g.id)}
                              className="text-stone-300 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Vista edición inline */}
                      {isEditingThis && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-amber-800">✏️ Editando invitado</p>
                            <button onClick={() => setEditingGuest(null)} className="text-stone-400 hover:text-stone-600"><X size={14} /></button>
                          </div>
                          <input className="input text-sm" placeholder="Nombre *" value={editGuestForm.guestName}
                            onChange={e => setEditGuestForm(f => ({ ...f, guestName: e.target.value }))} />
                          <select className="input text-sm" value={editGuestForm.diet}
                            onChange={e => setEditGuestForm(f => ({ ...f, diet: e.target.value }))}>
                            <option value="">Sin dieta especial</option>
                            {DIET_OPTS.map(d => <option key={d} value={d}>{d.replace('_',' ')}</option>)}
                          </select>
                          <div>
                            <label className="label text-[10px] mb-1 block">Alérgenos</label>
                            <div className="flex flex-wrap gap-1">
                              {ALLERGEN_LIST.map(a => (
                                <button key={a} type="button"
                                  onClick={() => setEditSelAllergens(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a])}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${editSelAllergens.includes(a) ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'}`}>
                                  {ALLERGEN_LABELS_MAP[a]}
                                </button>
                              ))}
                            </div>
                          </div>
                          <input className="input text-sm" placeholder="Observaciones" value={editGuestForm.observations}
                            onChange={e => setEditGuestForm(f => ({ ...f, observations: e.target.value }))} />
                          <div className="flex gap-2">
                            <button onClick={() => setEditingGuest(null)} className="btn-secondary flex-1 text-xs py-1.5">Cancelar</button>
                            <button onClick={handleUpdateGuest} className="btn-primary flex-1 text-xs py-1.5">Guardar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {(!table.guests || table.guests.length === 0) && (
                  <p className="text-xs text-stone-400 italic text-center py-2">Sin invitados asignados</p>
                )}
              </div>

              {showAddGuest !== table.id ? (
                <button
                  onClick={() => { setShowAddGuest(table.id); setSelAllergens([]); setGuestForm({ guestName:'', diet:'', observations:'' }); }}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-stone-200 rounded-xl text-sm text-stone-500 hover:border-rose-300 hover:text-rose-600 transition-all">
                  + Añadir invitado
                </button>
              ) : (
                <div className="mt-3 p-4 bg-stone-50 rounded-2xl space-y-3">
                  <h5 className="font-semibold text-sm text-stone-900">Nuevo invitado en {table.name}</h5>
                  <input className="input" placeholder="Nombre *" value={guestForm.guestName} onChange={e => setGuestForm(f => ({ ...f, guestName: e.target.value }))} />
                  <select className="input" value={guestForm.diet} onChange={e => setGuestForm(f => ({ ...f, diet: e.target.value }))}>
                    <option value="">Sin dieta especial</option>
                    {DIET_OPTS.map(d => <option key={d} value={d}>{d.replace('_',' ')}</option>)}
                  </select>
                  <div>
                    <label className="label text-xs mb-1 block">Alérgenos</label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALLERGEN_LIST.map(a => (
                        <button key={a} type="button"
                          onClick={() => setSelAllergens(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a])}
                          className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${selAllergens.includes(a) ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'}`}>
                          {ALLERGEN_LABELS_MAP[a]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input className="input" placeholder="Observaciones" value={guestForm.observations} onChange={e => setGuestForm(f => ({ ...f, observations: e.target.value }))} />
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddGuest(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
                    <button onClick={() => handleAddGuest(table.id)} className="btn-primary flex-1 text-sm">Guardar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Planos del Salón ────────────────────────────────────────────────────────
function PlanosTab({ eventId, event, hasPermission }) {
  const [plan,      setPlan]      = useState(null);
  const [planUrl,   setPlanUrl]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [zoom,      setZoom]      = useState(1);
  const fileRef                   = useRef();

  useEffect(() => { loadPlan(); }, []);
  useEffect(() => { return () => { if (planUrl) URL.revokeObjectURL(planUrl); }; }, [planUrl]);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const meta = await api.get(`/events/${eventId}/floorplan/meta`);
      // 204 No Content → sin plano
      if (!meta.data || !meta.data.id) {
        setPlan(null); setPlanUrl(null);
        return;
      }
      setPlan(meta.data);
      const res = await api.get(`/events/${eventId}/floorplan`, { responseType: 'blob' });
      setPlanUrl(URL.createObjectURL(res.data));
    } catch {
      setPlan(null); setPlanUrl(null);
    } finally { setLoading(false); }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    const allowed = ['image/jpeg','image/png','image/webp','application/pdf'];
    if (!allowed.includes(file.type)) { toast.error('Formato no permitido (JPG, PNG, WEBP o PDF)'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      // NO fijar Content-Type: el navegador añade el boundary multipart automáticamente
      await api.post(`/events/${eventId}/floorplan`, fd);
      toast.success('Plano subido correctamente');
      loadPlan();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data || 'Error al subir el plano';
      toast.error(typeof msg === 'string' ? msg : 'Error al subir el plano');
    } finally { setUploading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar el plano del salón?')) return;
    try {
      await api.delete(`/events/${eventId}/floorplan`);
      if (planUrl) URL.revokeObjectURL(planUrl);
      setPlan(null); setPlanUrl(null);
      toast.success('Plano eliminado');
    } catch { toast.error('Error al eliminar'); }
  };

  const isImage = plan?.contentType?.startsWith('image/');
  const isPdf   = plan?.contentType === 'application/pdf';
  const fmtSize = b => b < 1024*1024 ? `${(b/1024).toFixed(0)} KB` : `${(b/1024/1024).toFixed(1)} MB`;

  const canDownloadFloorPlan = hasPermission ? hasPermission('PDF_FLOOR_PLAN') : false;

  const handleDownloadPlan = () => {
    if (!planUrl || !plan) return;
    const a = document.createElement('a');
    a.href = planUrl;
    a.download = plan.filename || 'plano';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-stone-800 flex items-center gap-2"><Map size={18} className="text-stone-500" /> Plano del salón</h3>
          <p className="text-xs text-stone-500 mt-0.5">Sube el plano para consulta del equipo de sala</p>
        </div>
        {plan && (
          <div className="flex items-center gap-2">
            {canDownloadFloorPlan && planUrl && (
              <button
                onClick={handleDownloadPlan}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border border-stone-200 bg-white text-stone-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                title="Descargar plano"
              >
                <Download size={14} /> Descargar plano
              </button>
            )}
            <button onClick={() => fileRef.current?.click()}
              className="btn-secondary text-sm inline-flex items-center gap-1.5"><RotateCcw size={14} /> Reemplazar</button>
            <button onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors">
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf"
        className="hidden" onChange={e => handleUpload(e.target.files?.[0])} />

      {loading && (
        <div className="card flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
        </div>
      )}

      {!loading && !plan && (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files?.[0]); }}
          className="card border-2 border-dashed border-stone-300 hover:border-rose-400 cursor-pointer transition-all py-20 text-center">
          {uploading
            ? <p className="text-stone-500 text-sm animate-pulse">Subiendo plano...</p>
            : <>
                <Upload size={36} className="text-stone-300 mx-auto mb-3" />
                <p className="font-semibold text-stone-600 mb-1">Arrastra el plano aquí o haz clic</p>
                <p className="text-sm text-stone-400">JPG · PNG · WEBP · PDF · máx 20 MB</p>
              </>}
        </div>
      )}

      {!loading && plan && planUrl && (
        <>
          <div className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-600 flex-wrap">
            <span className="font-medium truncate max-w-xs">{plan.filename}</span>
            <span className="text-stone-400">·</span>
            <span className="text-stone-400">{plan.contentType}</span>
            {plan.fileSize && <><span className="text-stone-400">·</span><span>{fmtSize(plan.fileSize)}</span></>}
          </div>

          {isImage && (
            <div className="flex items-center gap-2">
              <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 transition-colors"><ZoomOut size={16} className="text-stone-600" /></button>
              <span className="text-sm text-stone-500 w-14 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 transition-colors"><ZoomIn size={16} className="text-stone-600" /></button>
              <button onClick={() => setZoom(1)} className="px-3 py-2 rounded-lg border border-stone-200 hover:bg-stone-100 transition-colors text-xs text-stone-500">Restablecer</button>
            </div>
          )}

          {isImage && (
            <div className="overflow-auto rounded-2xl border border-stone-200 bg-stone-100 max-h-[70vh]">
              <div style={{ width: `${Math.max(100, zoom * 100)}%` }} className="flex items-start justify-center p-4">
                <img src={planUrl} alt="Plano del salón" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.2s', maxWidth: '100%' }} className="rounded-lg shadow-sm" />
              </div>
            </div>
          )}

          {isPdf && (
            <div className="rounded-2xl border border-stone-200 overflow-hidden" style={{ height: '70vh' }}>
              <iframe src={planUrl} title="Plano PDF" className="w-full h-full" style={{ border: 'none' }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

