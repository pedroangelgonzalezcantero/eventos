import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Trash2, Edit2, Save, X, Mail, MessageSquare, Phone, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const CHANNELS = { EMAIL: { label: 'Email', icon: Mail, color: 'text-blue-600 bg-blue-50' }, SMS: { label: 'SMS', icon: Phone, color: 'text-green-600 bg-green-50' }, WHATSAPP: { label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-700 bg-emerald-50' } };
const CATEGORIES = ['PROTOCOLO', 'MENU', 'ALERGENOS', 'GENERAL'];
const CAT_COLORS = { PROTOCOLO: 'bg-violet-100 text-violet-700', MENU: 'bg-orange-100 text-orange-700', ALERGENOS: 'bg-amber-100 text-amber-700', GENERAL: 'bg-stone-100 text-stone-700' };

const EMPTY = { daysBeforeEvent: 7, category: 'PROTOCOLO', subject: '', messageTemplate: '', channel: 'EMAIL', active: true, description: '' };

export default function AutomationSettings() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);   // template id or 'new'
  const [form, setForm] = useState(EMPTY);

  const load = () => {
    setLoading(true);
    api.get('/reminder-templates')
      .then(r => setTemplates(r.data))
      .catch(() => toast.error('Error cargando plantillas'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const startEdit = (t) => { setForm({ ...t, channel: t.channel || 'EMAIL' }); setEditing(t.id); };
  const startNew = () => { setForm({ ...EMPTY }); setEditing('new'); };
  const cancelEdit = () => setEditing(null);

  const handleSave = async () => {
    if (!form.subject || !form.messageTemplate) { toast.error('El asunto y el mensaje son obligatorios'); return; }
    try {
      if (editing === 'new') { await api.post('/reminder-templates', form); toast.success('Plantilla creada'); }
      else { await api.put(`/reminder-templates/${editing}`, form); toast.success('Plantilla actualizada'); }
      setEditing(null); load();
    } catch { toast.error('Error al guardar'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta plantilla de recordatorio?')) return;
    try { await api.delete(`/reminder-templates/${id}`); toast.success('Eliminada'); load(); }
    catch { toast.error('Error al eliminar'); }
  };

  const handleToggle = async (t) => {
    try {
      await api.put(`/reminder-templates/${t.id}`, { ...t, active: !t.active });
      toast.success(t.active ? 'Recordatorio desactivado' : 'Recordatorio activado');
      load();
    } catch { toast.error('Error'); }
  };

  // Agrupar por categoría
  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = templates.filter(t => t.category === cat).sort((a, b) => b.daysBeforeEvent - a.daysBeforeEvent);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-sm">
                <Bell size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Automatizaciones</h1>
                <p className="text-stone-500 text-sm">Configura los recordatorios automáticos por email, SMS y WhatsApp</p>
              </div>
            </div>
          </div>
          <button onClick={startNew} className="btn-primary flex-none">
            <Plus size={16} /> Nueva plantilla
          </button>
        </div>

        {/* Aviso informativo */}
        <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-2xl">
          <AlertCircle size={18} className="text-violet-600 flex-none mt-0.5" />
          <div className="text-sm text-violet-900">
            <p className="font-semibold">¿Cómo funcionan los recordatorios?</p>
            <p className="text-violet-700 mt-0.5">El sistema envía automáticamente estos emails cada día a las 9:00 AM a los clientes con tareas pendientes. Usa <code className="bg-violet-100 px-1 rounded text-xs">{'{cliente}'}</code>, <code className="bg-violet-100 px-1 rounded text-xs">{'{dias}'}</code>, <code className="bg-violet-100 px-1 rounded text-xs">{'{tipo}'}</code>, <code className="bg-violet-100 px-1 rounded text-xs">{'{fecha}'}</code>, <code className="bg-violet-100 px-1 rounded text-xs">{'{portal}'}</code> en los mensajes.</p>
          </div>
        </div>

        {/* Formulario edición/creación */}
        <AnimatePresence>
          {editing && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="card border-violet-200 bg-violet-50/30">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-stone-900 text-lg">{editing === 'new' ? 'Nueva plantilla' : 'Editar plantilla'}</h2>
                <button onClick={cancelEdit} className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-400 hover:text-stone-600"><X size={16} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="label">Días antes del evento</label>
                  <input type="number" min="1" max="365" className="input" value={form.daysBeforeEvent}
                    onChange={e => setForm(f => ({ ...f, daysBeforeEvent: parseInt(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Categoría</label>
                  <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Canal de envío</label>
                  <select className="input" value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
                    {Object.entries(CHANNELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Estado</label>
                  <select className="input" value={form.active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, active: e.target.value === 'true' }))}>
                    <option value="true">✓ Activo</option>
                    <option value="false">✗ Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="label">Descripción interna (referencia tuya)</label>
                  <input className="input" placeholder="Recordatorio protocolo — 15 días antes" value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Asunto del email *</label>
                  <input className="input" placeholder="Recuerda completar el protocolo de tu evento" value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Mensaje *</label>
                  <textarea rows={6} className="input resize-none" placeholder="Hola {cliente}, faltan {dias} días para tu {tipo}..." value={form.messageTemplate}
                    onChange={e => setForm(f => ({ ...f, messageTemplate: e.target.value }))} />
                  <p className="text-xs text-stone-400 mt-1">Variables disponibles: {'{cliente}'} {'{dias}'} {'{tipo}'} {'{fecha}'} {'{portal}'}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={cancelEdit} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={handleSave} className="btn-primary flex-1"><Save size={15} /> Guardar plantilla</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de plantillas agrupadas por categoría */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="card animate-pulse h-24 bg-stone-100 border-none" />)}
          </div>
        ) : (
          <div className="space-y-8">
            {CATEGORIES.map(cat => {
              const list = grouped[cat] || [];
              if (list.length === 0 && editing !== 'new') return null;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`badge text-sm ${CAT_COLORS[cat]}`}>{cat.charAt(0) + cat.slice(1).toLowerCase()}</span>
                    <span className="text-xs text-stone-400">{list.length} plantilla{list.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-2">
                    {list.map(t => {
                      const ch = CHANNELS[t.channel] || CHANNELS.EMAIL;
                      const CIcon = ch.icon;
                      return (
                        <motion.div key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${t.active ? 'bg-white' : 'bg-stone-50/60 opacity-60'}`}>
                          {/* Días */}
                          <div className="w-12 h-12 bg-stone-100 rounded-xl flex flex-col items-center justify-center flex-none">
                            <span className="text-xl font-bold text-stone-900 leading-none">{t.daysBeforeEvent}</span>
                            <span className="text-[9px] text-stone-500 font-semibold uppercase">{t.daysBeforeEvent === 1 ? 'DÍA' : 'DÍAS'}</span>
                          </div>
                          {/* Contenido */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-semibold text-stone-900 text-sm">{t.subject || '(sin asunto)'}</p>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium ${ch.color}`}>
                                <CIcon size={11} />{ch.label}
                              </span>
                            </div>
                            {t.description && <p className="text-xs text-stone-500">{t.description}</p>}
                            <p className="text-xs text-stone-400 mt-1 truncate">{t.messageTemplate?.substring(0, 80)}...</p>
                          </div>
                          {/* Acciones */}
                          <div className="flex items-center gap-2 flex-none">
                            <button onClick={() => handleToggle(t)} className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors" title={t.active ? 'Desactivar' : 'Activar'}>
                              {t.active ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} />}
                            </button>
                            <button onClick={() => startEdit(t)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </motion.div>
                      );
                    })}
                    {list.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed border-stone-200 rounded-2xl">
                        <p className="text-stone-400 text-sm">No hay plantillas para {cat.toLowerCase()}. <button onClick={startNew} className="text-rose-600 underline font-medium">Crear una</button></p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

