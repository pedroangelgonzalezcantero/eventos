import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { ArrowLeft, Music2, Layers, ChefHat, UserPlus, Trash2, Edit2, X, AlertTriangle, Table2, Map, ZoomIn, ZoomOut, Upload, RotateCcw, Download, Plus, Save, ClipboardList, FileSpreadsheet, CheckCircle2, AlertCircle, Pencil, KeyRound, Copy, Eye, EyeOff, User } from 'lucide-react';
import PersonaAutocomplete from '../../components/PersonaAutocomplete';
import PdfDownloadButton from '../../components/PdfDownloadButton';
import ProtocolPdfDoc  from '../../components/pdf/ProtocolPdfDoc';
import TablesPdfDoc    from '../../components/pdf/TablesPdfDoc';
import AllergensPdfDoc from '../../components/pdf/AllergensPdfDoc';
import MenusPdfDoc     from '../../components/pdf/MenusPdfDoc';
import InvoicePdfDoc   from '../../components/pdf/InvoicePdfDoc';
import { useAuth } from '../../context/AuthContext';
import FloorEditor from '../../components/floorEditor/FloorEditor';
import MesasAdminTab from './MesasAdminTab';

const TABS = [
  { id: 'info',         label: 'Información'  },
  { id: 'asignaciones', label: 'Personal'      },
  { id: 'rangos',       label: 'Rangos'        },
  { id: 'menus',        label: 'Menús'         },
  { id: 'allergens',    label: 'Alérgenos'     },
  { id: 'protocol',     label: 'Protocolo'     },
  { id: 'mesas',        label: 'Mesas'         },
  { id: 'planos',       label: 'Planos'        },
  { id: 'invoice',      label: 'Facturación'   },
  { id: 'reminders',    label: 'Recordatorios' },
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
            { ok: event.menuConfirmed,      label: 'Menú confirmado',       icon: '️' },
            { ok: event.allergensCompleted, label: 'Alérgenos registrados', icon: '⚠️' },
            { ok: event.protocolCompleted,  label: 'Protocolo completo',    icon: '' },
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
        {tab === 'info'         && <InfoTab event={event} eventId={id} onReload={loadEvent} />}
        {tab === 'asignaciones' && <AsignacionesTab eventId={id} assignments={assignments} staff={staff} reload={loadAssignments} />}
        {tab === 'rangos'       && <RangosTab eventId={id} event={event} />}
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

const EVENT_TYPES = ['BODA','COMUNION','BAUTIZO','CUMPLEANOS','ANIVERSARIO','EMPRESA','PRIVADO','OTRO'];
const EVENT_TYPE_LABELS = { BODA:'Boda', COMUNION:'Comunión', BAUTIZO:'Bautizo', CUMPLEANOS:'Cumpleaños', ANIVERSARIO:'Aniversario', EMPRESA:'Empresa', PRIVADO:'Privado', OTRO:'Otro' };

function InfoTab({ event, eventId, onReload }) {
  // ── Edición de datos del evento ───────────────────────────────────────────
  const [editMode, setEditMode]   = useState(false);
  const [saving,   setSaving]     = useState(false);
  const [form,     setForm]       = useState({});

  const openEdit = () => {
    setForm({
      clientName:      event.clientName      || '',
      type:            event.type            || 'BODA',
      eventDate:       event.eventDate       || '',
      estimatedGuests: event.estimatedGuests || '',
      venue:           event.venue           || '',
      contactPerson:   event.contactPerson   || '',
      phone:           event.phone           || '',
      email:           event.email           || '',
      notes:           event.notes           || '',
    });
    setEditMode(true);
  };

  const handleSaveEvent = async () => {
    if (!form.clientName?.trim()) { toast.error('El nombre del cliente es obligatorio'); return; }
    if (!form.eventDate)          { toast.error('La fecha es obligatoria'); return; }
    setSaving(true);
    try {
      await api.put(`/events/${eventId}`, {
        ...form,
        estimatedGuests: form.estimatedGuests ? Number(form.estimatedGuests) : null,
      });
      toast.success('Datos actualizados ✓');
      setEditMode(false);
      onReload();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.clientName || 'Error al guardar';
      toast.error(typeof msg === 'string' ? msg : 'Error al guardar los datos');
    } finally { setSaving(false); }
  };

  // ── Gestión de credenciales del portal del cliente ────────────────────────
  const [showPwdSection,  setShowPwdSection]  = useState(false);
  const [newPwd,          setNewPwd]          = useState('');
  const [showPwd,         setShowPwd]         = useState(false);
  const [savingPwd,       setSavingPwd]       = useState(false);
  const [savedCredentials, setSavedCredentials] = useState(null); // { username, password }

  /** Genera una contraseña legible aleatoria */
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleAutoGenerate = () => {
    const pwd = generatePassword();
    setNewPwd(pwd);
    setShowPwd(true);
    setShowPwdSection(true);
  };

  const handleResetPassword = async () => {
    if (!newPwd.trim() || newPwd.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return; }
    if (!event.clientUserId) { toast.error('No hay usuario de portal asignado a este evento'); return; }
    setSavingPwd(true);
    try {
      await api.put(`/users/${event.clientUserId}/password`, { password: newPwd });
      setSavedCredentials({ username: event.clientUsername, password: newPwd });
      toast.success('Contraseña actualizada ✓');
      setShowPwdSection(false);
      setShowPwd(false);
    } catch { toast.error('Error al actualizar la contraseña'); }
    finally { setSavingPwd(false); }
  };

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text || '').then(() => toast.success(`${label} copiado`));
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      {/* ── Datos del evento ─────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-800">Datos del evento</h3>
          {!editMode
            ? <button onClick={openEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors">
                <Pencil size={13} /> Editar
              </button>
            : <div className="flex gap-2">
                <button onClick={() => setEditMode(false)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors">
                  <X size={13} /> Cancelar
                </button>
                <button onClick={handleSaveEvent} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50">
                  {saving ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={13} />}
                  Guardar
                </button>
              </div>
          }
        </div>

        {!editMode ? (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
            {[
              { label: 'Cliente',             value: event.clientName        },
              { label: 'Tipo',                value: event.typeLabel         },
              { label: 'Fecha',               value: event.eventDate ? new Date(event.eventDate + 'T12:00:00').toLocaleDateString('es-ES') : null },
              { label: 'Invitados estimados', value: event.estimatedGuests   },
              { label: 'Salón',               value: event.venue             },
              { label: 'Contacto',            value: event.contactPerson     },
              { label: 'Teléfono',            value: event.phone             },
              { label: 'Email',               value: event.email             },
            ].map(item => item.value ? (
              <div key={item.label}>
                <dt className="text-stone-500">{item.label}</dt>
                <dd className="font-medium text-stone-900">{item.value}</dd>
              </div>
            ) : null)}
            {event.notes && (
              <div className="sm:col-span-2 pt-2 border-t border-stone-100 mt-1">
                <dt className="text-stone-500 mb-1">Notas internas</dt>
                <dd className="text-stone-700">{event.notes}</dd>
              </div>
            )}
          </dl>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Cliente *</label>
              <input className="input" value={form.clientName} onChange={e => f('clientName', e.target.value)} placeholder="Nombre del cliente" />
            </div>
            <div>
              <label className="label">Tipo de evento *</label>
              <select className="input" value={form.type} onChange={e => f('type', e.target.value)}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fecha del evento *</label>
              <input className="input" type="date" value={form.eventDate} onChange={e => f('eventDate', e.target.value)} />
            </div>
            <div>
              <label className="label">Invitados estimados</label>
              <input className="input" type="number" min="1" value={form.estimatedGuests} onChange={e => f('estimatedGuests', e.target.value)} placeholder="100" />
            </div>
            <div>
              <label className="label">Salón / Lugar</label>
              <input className="input" value={form.venue} onChange={e => f('venue', e.target.value)} placeholder="Salón Principal" />
            </div>
            <div>
              <label className="label">Persona de contacto</label>
              <input className="input" value={form.contactPerson} onChange={e => f('contactPerson', e.target.value)} />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" type="tel" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="612 345 678" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="cliente@email.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notas internas</label>
              <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Observaciones internas..." />
            </div>
          </div>
        )}
      </div>

      {/* ── Portal del cliente ───────────────────────────────────────────── */}
      {event.clientUsername && (
        <div className="card border-blue-100 bg-blue-50/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800 text-sm">Acceso al portal del cliente</h3>
              <p className="text-xs text-stone-500">Credenciales para que el cliente entre al portal</p>
            </div>
          </div>

          {/* Usuario */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-100 mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-stone-500 mb-0.5">Usuario de acceso</p>
              <p className="font-mono font-bold text-blue-700 text-base tracking-wide">{event.clientUsername}</p>
            </div>
            <button onClick={() => copyText(event.clientUsername, 'Usuario')}
              title="Copiar usuario"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors flex-none">
              <Copy size={13} /> Copiar
            </button>
          </div>

          {/* Credenciales guardadas tras reseteo */}
          {savedCredentials && (
            <div className="mb-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-xs font-semibold text-emerald-800 mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Contraseña actualizada — comparte estos datos con el cliente:
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-white rounded-lg p-2 border border-emerald-100">
                  <p className="text-xs text-stone-500 mb-0.5">Usuario</p>
                  <p className="font-mono font-bold text-stone-900">{savedCredentials.username}</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-emerald-100">
                  <p className="text-xs text-stone-500 mb-0.5">Contraseña</p>
                  <p className="font-mono font-bold text-stone-900">{savedCredentials.password}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => copyText(`Usuario: ${savedCredentials.username}\nContraseña: ${savedCredentials.password}`, 'Credenciales')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors">
                  <Copy size={12} /> Copiar todo
                </button>
                <button onClick={() => setSavedCredentials(null)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-stone-400 hover:text-stone-600 text-xs transition-colors">
                  <X size={12} /> Cerrar
                </button>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          {!showPwdSection ? (
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleAutoGenerate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                <KeyRound size={13} /> Generar nueva contraseña
              </button>
              {event.clientUserId && (
                <button onClick={() => { setShowPwdSection(true); setShowPwd(true); setNewPwd(''); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors">
                  <Pencil size={13} /> Poner contraseña manual
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-blue-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-stone-800 flex items-center gap-1.5">
                  <KeyRound size={14} />
                  {newPwd && showPwd ? 'Contraseña generada (edítala si quieres)' : 'Nueva contraseña'}
                </p>
                <button onClick={() => { setShowPwdSection(false); setNewPwd(''); setShowPwd(false); }}
                  className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors">
                  <X size={14} />
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                  placeholder="Mínimo 6 caracteres"
                  className="input pr-20 text-sm font-mono"
                  autoFocus
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button type="button" onClick={() => { const p = generatePassword(); setNewPwd(p); setShowPwd(true); }}
                    title="Generar aleatoria"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <KeyRound size={14} />
                  </button>
                </div>
              </div>
              {newPwd && showPwd && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⚠️ Anota esta contraseña antes de guardar — no podrás verla de nuevo
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowPwdSection(false); setNewPwd(''); setShowPwd(false); }}
                  className="px-3 py-1.5 text-sm rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleResetPassword} disabled={savingPwd || !newPwd.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {savingPwd ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={13} />}
                  Guardar contraseña
                </button>
              </div>
            </div>
          )}
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

  // Cuenta personas reales: "Maria y Jose" = 2
  const countPersons = name => name ? name.split(/\s+[yY]\s+/).length : 1;

  // Solo mesas con al menos un invitado con restricción
  const tablesWithRestrictions = tables.filter(t =>
    (t.guests || []).some(g => g.allergies || g.diet)
  );
  const totalGuestCount = allGuests.reduce((s, g) => s + countPersons(g.guestName), 0);
  const withRestrictionsCount = allGuests
    .filter(g => g.allergies || g.diet)
    .reduce((s, g) => s + countPersons(g.guestName), 0);

  // Invitados de la mesa seleccionada en el formulario (para el step 2)
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

  // ── Formulario "Añadir" ───────────────────────────────────────────────────
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
        // Dividir pareja: renombrar el original al nombre individual seleccionado
        const parts = guest.guestName.split(/\s+[yY]\s+/).map(s => s.trim()).filter(Boolean);
        const otherName = parts.find(p => p !== individualName);
        // Renombrar el registro original y asignarle la alergia
        await api.put(`/events/${eventId}/tables/${mesa.id}/guests/${guest.id}`, {
          guestName: individualName,
          allergies: newAllergies.join(','),
          diet: newDiet,
          observations: newObs,
        });
        // Crear nuevo registro para la otra persona (sin alergias aún)
        if (otherName) {
          await api.post(`/events/${eventId}/tables/${mesa.id}/guests`, {
            guestName: otherName,
            allergies: '',
            diet: '',
            observations: '',
          });
        }
      } else {
        await api.put(`/events/${eventId}/tables/${mesa.id}/guests/${guest.id}`, {
          guestName: guest.guestName,
          allergies: newAllergies.join(','),
          diet: newDiet,
          observations: newObs,
        });
      }
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
              ? `${withRestrictionsCount} de ${totalGuestCount} invitados con restricciones`
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

          {/* Paso 2 — Invitado */}
          {formMesaId && (
            <div>
              <label className="label">Paso 2 — Selecciona el invitado</label>
              {guestsInFormMesa.length === 0
                ? <p className="text-sm text-stone-400 italic">Esta mesa no tiene invitados registrados.</p>
                : (
                  <select className="input" value={formGuestId} onChange={e => setFormGuestId(e.target.value)}>
                    <option value="">— Seleccionar invitado —</option>
                    {expandedGuestsInFormMesa.map((g, idx) => (
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
              <span className="text-sm font-bold text-stone-800"> {table.name}</span>
              <span className="badge bg-amber-100 text-amber-700 text-[10px]">
                ⚠ {restricted.length} restricción{restricted.length !== 1 ? 'es' : ''}
              </span>
              <span className="ml-auto text-xs text-stone-400">
                {(table.guests || []).reduce((s, g) => s + countPersons(g.guestName), 0)} inv. en total
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
                  {item.involvedPerson && <p className="text-sm text-stone-500 mt-1"> {item.involvedPerson}</p>}
                  {item.youtubeLink && <a href={item.youtubeLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block"> {item.youtubeLink}</a>}
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
          <button onClick={() => onSend('EMAIL')}    className="btn-secondary text-sm"> Enviar por Email</button>
          <button onClick={() => onSend('SMS')}      className="btn-secondary text-sm"> Enviar por SMS</button>
          <button onClick={() => onSend('WHATSAPP')} className="btn-secondary text-sm"> Enviar por WhatsApp</button>
        </div>
      </div>
    </div>
  );
}

// ── Rangos (asignación de trabajadores por mesa) ───────────────────────────

/**
 * Parser dinámico de Excel para rangos de trabajadores.
 *
 * Soporta DOS formatos:
 *
 * Formato A (nuevo) — una o varias columnas, empieza en col A:
 *   Fila 1: "BODA PEDRO Y MARI"   ← nombre del evento, se ignora
 *   Fila 2: ATENEA    HORA         ← cabecera de salón + labels de columna
 *   Fila 3: PEDRO ANGEL  5 Y 6  21H
 *   Fila 4: JAVIER LOPEZ  LIBRE  25H  BARRA
 *
 * Formato B (original) — 2 bloques lado a lado, cols D-F y H-K:
 *   ATENEA (col D)  …  VENUS (col H)
 *   NEREA  6 Y 7   …  XENIA  2 Y AYUDA COMPAÑEROS
 *
 * Algoritmo:
 *  - NO asume columnas fijas; detecta bloques por GAPS en el índice de columna
 *  - Separa celdas que son "etiquetas de columna" (HORA, NOMBRE...) del rango real
 *  - Detecta cabeceras de salón: bloques sin datos de mesas tras filtrar etiquetas
 */
function parseRangosFromSheet(sheet, XLSX) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const s = v => (v === null || v === undefined ? '' : String(v).trim());

  const DAY_NAMES     = new Set(['LUNES','MARTES','MIERCOLES','MIÉRCOLES','JUEVES','VIERNES','SABADO','SÁBADO','DOMINGO']);
  const COLUMN_LABELS = new Set(['HORA','NOMBRE','MESA','MESAS','PUESTO','RANGO','LUGAR','TIME','TABLE','TABLES']);

  const entries    = [];
  const mesaByKey  = {}; // sectionKey → nombre del salón/sección actual

  for (const row of rows) {
    // 1. Recoger celdas no vacías con su índice de columna
    const cells = [];
    for (let c = 0; c < row.length; c++) {
      const v = s(row[c]);
      if (v) cells.push({ col: c, val: v });
    }
    if (!cells.length) continue;

    // 2. Agrupar en bloques: gap > 2 columnas vacías O cambio de sección = nuevo bloque
    const blocks = [[cells[0]]];
    for (let i = 1; i < cells.length; i++) {
      const prevSec = Math.floor(cells[i - 1].col / 6);
      const currSec = Math.floor(cells[i].col / 6);
      const gap     = cells[i].col - cells[i - 1].col;
      if (currSec !== prevSec || gap > 2) {
        blocks.push([cells[i]]);
      } else {
        blocks[blocks.length - 1].push(cells[i]);
      }
    }

    // 3. Procesar cada bloque
    for (const block of blocks) {
      const anchorCol  = block[0].col;
      // Sección: cols 0-5 → key 0, cols 6-11 → key 1, etc.
      const sectionKey = Math.floor(anchorCol / 6);
      const name       = block[0].val;

      // Saltar días de la semana y etiquetas de columna usadas como nombre
      if (DAY_NAMES.has(name.toUpperCase()) || COLUMN_LABELS.has(name.toUpperCase())) continue;

      // Rango = valores tras el nombre, excluyendo etiquetas de columna (HORA, etc.)
      const rangoArr = block.slice(1)
        .map(c => c.val)
        .filter(v => !COLUMN_LABELS.has(v.toUpperCase()));
      const rango = rangoArr.join(' · ').trim();

      if (!rango) {
        // Sin datos de mesas reales → cabecera de salón/sección
        mesaByKey[sectionKey] = name;
      } else {
        // Fila de trabajador
        if (name.length > 1) {
          entries.push({ nombre: name, mesa: mesaByKey[sectionKey] || '', rango });
        }
      }
    }
  }

  return entries;
}

function RangosTab({ eventId, event }) {
  const [rangos, setRangos]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [newRow, setNewRow]             = useState(null);
  const [editRow, setEditRow]           = useState(null);
  const [saving, setSaving]             = useState(false);

  // Import Excel state
  const fileRef                         = useRef(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState(null); // null | { entries: [] }
  const [importing, setImporting]       = useState(false);

  const loadRangos = async () => {
    setLoading(true);
    try { const r = await api.get(`/events/${eventId}/rangos`); setRangos(r.data); }
    catch { toast.error('Error cargando rangos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadRangos(); }, [eventId]);

  // ── Añadir / editar manual ────────────────────────────────────────────────
  const handleAddRow = () => { setNewRow({ personaObj: null, mesa: '', rango: '' }); setEditRow(null); };

  const handleSaveNew = async () => {
    if (!newRow.personaObj) { toast.error('Selecciona una persona'); return; }
    setSaving(true);
    try {
      await api.post(`/events/${eventId}/rangos`, { personaId: newRow.personaObj.id, mesa: newRow.mesa, rango: newRow.rango });
      toast.success('Rango añadido y alta registrada ✓');
      setNewRow(null); loadRangos();
    } catch (e) { toast.error(e?.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleSaveEdit = async () => {
    if (!editRow.personaObj) { toast.error('Selecciona una persona'); return; }
    setSaving(true);
    try {
      await api.put(`/events/${eventId}/rangos/${editRow.id}`, { personaId: editRow.personaObj.id, mesa: editRow.mesa, rango: editRow.rango });
      toast.success('Rango actualizado ✓');
      setEditRow(null); loadRangos();
    } catch (e) { toast.error(e?.response?.data?.message || 'Error al actualizar');
    } finally { setSaving(false); }
  };

  const handleDelete = async (rangoId) => {
    if (!confirm('¿Eliminar este rango?')) return;
    try { await api.delete(`/events/${eventId}/rangos/${rangoId}`); toast.success('Rango eliminado'); loadRangos(); }
    catch { toast.error('Error al eliminar'); }
  };

  const startEdit = (r) => {
    setEditRow({ id: r.id, personaObj: { id: r.personaId, nombre: r.personaNombre, apellidos: r.personaApellidos, dni: r.personaDni, puesto: r.personaPuesto }, mesa: r.mesa || '', rango: r.rango || '' });
    setNewRow(null);
  };

  // ── Import Excel ──────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportLoading(true);
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb    = XLSX.read(buffer, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw   = parseRangosFromSheet(sheet, XLSX);

      if (raw.length === 0) { toast.error('No se detectaron trabajadores en el Excel'); return; }

      // Buscar persona para cada nombre detectado
      const withPersona = await Promise.all(raw.map(async (entry) => {
        try {
          const res = await api.get('/personas/search', { params: { q: entry.nombre } });
          const list = res.data || [];
          // Preferir coincidencia exacta de nombre completo
          const exact = list.find(p =>
            p.nombreCompleto?.toLowerCase() === entry.nombre.toLowerCase() ||
            p.nombre?.toLowerCase()         === entry.nombre.toLowerCase() ||
            `${p.apellidos} ${p.nombre}`.toLowerCase() === entry.nombre.toLowerCase()
          );
          const persona = exact || (list.length === 1 ? list[0] : null);
          return { ...entry, persona, candidatos: list };
        } catch { return { ...entry, persona: null, candidatos: [] }; }
      }));

      setImportPreview({ entries: withPersona });
    } catch (err) {
      toast.error('Error al leer el Excel: ' + (err.message || 'formato no reconocido'));
    } finally { setImportLoading(false); }
  };

  const handleImport = async () => {
    if (!importPreview) return;
    const toImport = importPreview.entries.filter(e => e.persona);
    if (toImport.length === 0) { toast.error('Ningún trabajador tiene persona asignada'); return; }
    setImporting(true);
    try {
      await api.post(`/events/${eventId}/rangos/batch`,
        toImport.map(e => ({ personaId: e.persona.id, mesa: e.mesa, rango: e.rango }))
      );
      const skipped = importPreview.entries.filter(e => !e.persona).length;
      toast.success(`✅ ${toImport.length} rangos importados${skipped > 0 ? ` · ⚠️ ${skipped} omitidos (sin persona en BD)` : ''}`);
      setImportPreview(null);
      loadRangos();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al importar');
    } finally { setImporting(false); }
  };

  // Cambio de persona candidato en el preview
  const setPreviewPersona = (idx, persona) => {
    setImportPreview(prev => {
      const entries = [...prev.entries];
      entries[idx] = { ...entries[idx], persona };
      return { ...prev, entries };
    });
  };

  // ── Export Excel ──────────────────────────────────────────────────────────
  const handleExport = async () => {
    const XLSX = await import('xlsx');

    // Agrupar por mesa para recrear el formato de bloques
    const byMesa = rangos.reduce((acc, r) => {
      const k = r.mesa || '(sin salón)';
      if (!acc[k]) acc[k] = [];
      acc[k].push(r);
      return acc;
    }, {});

    // Hoja 1: tabla simple con información de altas
    const altasRows = [
      ['EVENTO', event?.clientName || `Evento ${eventId}`],
      ['FECHA',  event?.eventDate  || ''],
      [],
      ['SALÓN/MESA', 'NOMBRE', 'APELLIDOS', 'DNI', 'S.SOCIAL', 'RANGO/MESAS'],
      ...rangos.map(r => [r.mesa || '', r.personaNombre || '', r.personaApellidos || '', r.personaDni || '', /* s.social no está en RangoDto, mostramos vacío */ '', r.rango || ''])
    ];
    const wsAltas = XLSX.utils.aoa_to_sheet(altasRows);
    wsAltas['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 30 }];

    // Hoja 2: formato agrupado por salón (similar al original)
    const grupoRows = [['SALÓN', 'TRABAJADOR', 'RANGO/MESAS'], []];
    Object.entries(byMesa).forEach(([mesa, items]) => {
      grupoRows.push([mesa.toUpperCase(), '', '']);
      items.forEach(r => grupoRows.push(['', `${r.personaNombre} ${r.personaApellidos}`, r.rango || '']));
      grupoRows.push([]);
    });
    const wsGrupo = XLSX.utils.aoa_to_sheet(grupoRows);
    wsGrupo['!cols'] = [{ wch: 22 }, { wch: 24 }, { wch: 32 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsAltas,  'Altas asesoría');
    XLSX.utils.book_append_sheet(wb, wsGrupo,  'Por salón');

    const safeName = (event?.clientName || `evento-${eventId}`).replace(/\s+/g, '-').toLowerCase();
    XLSX.writeFile(wb, `rangos-${safeName}.xlsx`);
    toast.success('Excel descargado ✓');
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="card flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
    </div>
  );

  const matched  = importPreview ? importPreview.entries.filter(e => e.persona).length  : 0;
  const unmatched = importPreview ? importPreview.entries.filter(e => !e.persona).length : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-stone-800 flex items-center gap-2">
            <ClipboardList size={18} className="text-stone-500" /> Rangos de trabajadores
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Asigna trabajadores a mesas. El alta en asesoría se genera automáticamente.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export */}
          {rangos.length > 0 && (
            <button onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-stone-200 bg-white text-stone-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-colors">
              <Download size={14} /> Exportar Excel
            </button>
          )}
          {/* Import */}
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
          <button onClick={() => fileRef.current?.click()} disabled={importLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-stone-200 bg-white text-stone-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50">
            {importLoading
              ? <><span className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" /> Leyendo...</>
              : <><FileSpreadsheet size={14} /> Importar Excel</>}
          </button>
          {/* Añadir manual */}
          <button onClick={handleAddRow} className="btn-primary text-sm inline-flex items-center gap-1.5">
            <Plus size={15} /> Añadir rango
          </button>
        </div>
      </div>

      {/* ── Modal Preview Import ─────────────────────────────────────────── */}
      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header modal */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between flex-none">
              <div>
                <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                  <FileSpreadsheet size={20} className="text-blue-500" /> Previsualización de importación
                </h3>
                <p className="text-sm text-stone-500 mt-0.5">
                  {importPreview.entries.length} trabajadores detectados ·
                  <span className="text-emerald-600 font-medium"> {matched} con persona ✓</span>
                  {unmatched > 0 && <span className="text-amber-600 font-medium"> · {unmatched} sin persona (se omitirán)</span>}
                </p>
              </div>
              <button onClick={() => setImportPreview(null)} className="text-stone-400 hover:text-stone-600 p-1">
                <X size={20} />
              </button>
            </div>

            {/* Tabla preview */}
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-stone-50/95 backdrop-blur-sm">
                  <tr className="border-b border-stone-200">
                    <th className="text-left px-4 py-2.5 font-medium text-stone-500 w-6">·</th>
                    <th className="text-left px-4 py-2.5 font-medium text-stone-500">Detectado en Excel</th>
                    <th className="text-left px-4 py-2.5 font-medium text-stone-500">Persona en BD</th>
                    <th className="text-left px-4 py-2.5 font-medium text-stone-500">Salón</th>
                    <th className="text-left px-4 py-2.5 font-medium text-stone-500">Rango/Mesas</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.entries.map((entry, idx) => (
                    <tr key={idx} className={`border-b border-stone-100 last:border-0 ${entry.persona ? 'bg-white' : 'bg-amber-50/40'}`}>
                      <td className="px-4 py-2 text-center">
                        {entry.persona
                          ? <CheckCircle2 size={15} className="text-emerald-500 mx-auto" />
                          : <AlertCircle  size={15} className="text-amber-500 mx-auto" />}
                      </td>
                      <td className="px-4 py-2 font-medium text-stone-800">{entry.nombre}</td>
                      <td className="px-4 py-2">
                        {entry.candidatos.length > 1 ? (
                          /* Más de un candidato → selector */
                          <select
                            className="input text-xs py-1"
                            value={entry.persona?.id || ''}
                            onChange={e => {
                              const p = entry.candidatos.find(c => c.id === parseInt(e.target.value));
                              setPreviewPersona(idx, p || null);
                            }}
                          >
                            <option value="">— seleccionar —</option>
                            {entry.candidatos.map(p => (
                              <option key={p.id} value={p.id}>{p.nombreCompleto} ({p.dni})</option>
                            ))}
                          </select>
                        ) : entry.persona ? (
                          <span className="text-emerald-700 text-xs font-medium">
                            {entry.persona.nombreCompleto} <span className="text-stone-400 font-normal">({entry.persona.dni})</span>
                          </span>
                        ) : (
                          <span className="text-amber-600 text-xs italic">
                            No encontrado — crear en Trabajadores
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-stone-600 text-xs">{entry.mesa || <span className="text-stone-300">—</span>}</td>
                      <td className="px-4 py-2 text-stone-600 text-xs">{entry.rango || <span className="text-stone-300">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer modal */}
            <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between flex-none gap-3">
              <p className="text-xs text-stone-400">
                Los trabajadores sin persona se omiten. Créalos primero en <strong>Trabajadores</strong>.
              </p>
              <div className="flex gap-2 flex-none">
                <button onClick={() => setImportPreview(null)} className="btn-secondary text-sm">Cancelar</button>
                <button onClick={handleImport} disabled={importing || matched === 0}
                  className="btn-primary text-sm disabled:opacity-50 inline-flex items-center gap-1.5">
                  {importing
                    ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importando...</>
                    : <><Download size={14} /> Importar {matched} rango{matched !== 1 ? 's' : ''}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabla de rangos ──────────────────────────────────────────────── */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/70">
              <th className="text-left px-4 py-3 font-medium text-stone-600 w-[38%]">Persona</th>
              <th className="text-left px-4 py-3 font-medium text-stone-600 w-[22%]">Salón / Mesa</th>
              <th className="text-left px-4 py-3 font-medium text-stone-600 w-[30%]">Rango / Mesas</th>
              <th className="px-4 py-3 w-[10%]"></th>
            </tr>
          </thead>
          <tbody>
            {/* Fila nueva */}
            {newRow && (
              <tr className="border-b border-rose-100 bg-rose-50/30">
                <td className="px-4 py-2">
                  <PersonaAutocomplete value={newRow.personaObj} onChange={p => setNewRow(r => ({ ...r, personaObj: p }))} placeholder="Buscar persona..." />
                </td>
                <td className="px-4 py-2">
                  <input className="input text-sm" placeholder="ATENEA, VENUS…" value={newRow.mesa}
                    onChange={e => setNewRow(r => ({ ...r, mesa: e.target.value }))} />
                </td>
                <td className="px-4 py-2">
                  <input className="input text-sm" placeholder="1 Y 2, LIBRE y especiales…" value={newRow.rango}
                    onChange={e => setNewRow(r => ({ ...r, rango: e.target.value }))} />
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1">
                    <button onClick={handleSaveNew} disabled={saving}
                      className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white" title="Guardar">
                      <Save size={13} />
                    </button>
                    <button onClick={() => setNewRow(null)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100" title="Cancelar">
                      <X size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Filas existentes */}
            {rangos.map(r => {
              const isEditing = editRow?.id === r.id;
              return (
                <tr key={r.id} className={`border-b border-stone-100 last:border-0 transition-colors group ${isEditing ? 'bg-amber-50/40' : 'hover:bg-stone-50'}`}>
                  <td className="px-4 py-2">
                    {isEditing
                      ? <PersonaAutocomplete value={editRow.personaObj} onChange={p => setEditRow(ev => ({ ...ev, personaObj: p }))} />
                      : <div>
                          <p className="font-medium text-stone-900">{r.personaNombreCompleto}</p>
                          <p className="text-[11px] text-stone-400">DNI: {r.personaDni}{r.personaPuesto ? ` · ${r.personaPuesto}` : ''}</p>
                        </div>}
                  </td>
                  <td className="px-4 py-2">
                    {isEditing
                      ? <input className="input text-sm" value={editRow.mesa} onChange={e => setEditRow(ev => ({ ...ev, mesa: e.target.value }))} />
                      : <span className="text-stone-700 text-xs font-medium uppercase tracking-wide">{r.mesa || <span className="text-stone-300 italic normal-case font-normal">—</span>}</span>}
                  </td>
                  <td className="px-4 py-2">
                    {isEditing
                      ? <input className="input text-sm" value={editRow.rango} onChange={e => setEditRow(ev => ({ ...ev, rango: e.target.value }))} />
                      : <span className="text-stone-700">{r.rango || <span className="text-stone-300 italic">—</span>}</span>}
                  </td>
                  <td className="px-4 py-2">
                    {isEditing
                      ? <div className="flex items-center gap-1">
                          <button onClick={handleSaveEdit} disabled={saving}
                            className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white" title="Guardar">
                            <Save size={13} />
                          </button>
                          <button onClick={() => setEditRow(null)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100" title="Cancelar">
                            <X size={13} />
                          </button>
                        </div>
                      : <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(r)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50" title="Editar">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(r.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50" title="Eliminar">
                            <Trash2 size={13} />
                          </button>
                        </div>}
                  </td>
                </tr>
              );
            })}

            {rangos.length === 0 && !newRow && (
              <tr>
                <td colSpan={4} className="px-4 py-14 text-center text-stone-400 text-sm">
                  <ClipboardList size={32} className="mx-auto mb-3 text-stone-200" />
                  Sin rangos asignados aún.<br />
                  <span className="text-xs">Usa <strong>Importar Excel</strong> o <strong>Añadir rango</strong> para empezar.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rangos.length > 0 && (
        <p className="text-xs text-stone-400 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          {rangos.length} rango{rangos.length !== 1 ? 's' : ''} · Alta en asesoría generada automáticamente por cada asignación
        </p>
      )}
    </div>
  );
}

// ── Planos del Salón ────────────────────────────────────────────────────────
function PlanosTab({ eventId, event, hasPermission }) {
  const [planSubTab, setPlanSubTab] = useState('static'); // 'static' | 'editor'
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

      {/* ── Sub-tabs: Estático / Editor interactivo ── */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setPlanSubTab('static')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            planSubTab === 'static'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <Upload size={14} /> Plano estático
        </button>
        <button
          onClick={() => setPlanSubTab('editor')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            planSubTab === 'editor'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <Pencil size={14} /> Editor interactivo
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════
           SUB-TAB: EDITOR INTERACTIVO
          ═══════════════════════════════════════════════════ */}
      {planSubTab === 'editor' && <FloorEditor eventId={eventId} />}

      {/* ═══════════════════════════════════════════════════
           SUB-TAB: PLANO ESTÁTICO (comportamiento original)
          ═══════════════════════════════════════════════════ */}
      {planSubTab === 'static' && <>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-stone-800 flex items-center gap-2"><Map size={18} className="text-stone-500" /> Plano estático del salón</h3>
          <p className="text-xs text-stone-500 mt-0.5">Sube una imagen o PDF para consulta del equipo</p>
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
      {/* fin planSubTab === 'static' */}
      </>}
    </div>
  );
}

