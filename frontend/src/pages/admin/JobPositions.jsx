import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, ShieldCheck, Layers, ChefHat, Music2, User,
  Camera, Heart, Star, Users, Plus, Trash2, Edit2,
  Check, X, Lock, Save, ChevronRight, AlertCircle, Wand2, RefreshCw
} from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import PermissionPanel from '../../components/PermissionPanel';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

// ── Mapa de iconos disponibles ───────────────────────────────────────────────
const ICON_MAP = {
  'shield-check': ShieldCheck,
  'layers':       Layers,
  'chef-hat':     ChefHat,
  'music-2':      Music2,
  'user':         User,
  'briefcase':    Briefcase,
  'camera':       Camera,
  'heart':        Heart,
  'star':         Star,
  'users':        Users,
};

const COLOR_OPTIONS = [
  { value: 'bg-violet-100 text-violet-700 border-violet-200',   preview: 'bg-violet-500',   label: 'Violeta'   },
  { value: 'bg-emerald-100 text-emerald-700 border-emerald-200', preview: 'bg-emerald-500',  label: 'Verde'     },
  { value: 'bg-orange-100 text-orange-700 border-orange-200',   preview: 'bg-orange-500',   label: 'Naranja'   },
  { value: 'bg-blue-100 text-blue-700 border-blue-200',         preview: 'bg-blue-500',     label: 'Azul'      },
  { value: 'bg-stone-100 text-stone-700 border-stone-200',      preview: 'bg-stone-400',    label: 'Gris'      },
  { value: 'bg-rose-100 text-rose-700 border-rose-200',         preview: 'bg-rose-500',     label: 'Rosa'      },
  { value: 'bg-amber-100 text-amber-700 border-amber-200',      preview: 'bg-amber-500',    label: 'Ámbar'     },
  { value: 'bg-cyan-100 text-cyan-700 border-cyan-200',         preview: 'bg-cyan-500',     label: 'Cian'      },
  { value: 'bg-indigo-100 text-indigo-700 border-indigo-200',   preview: 'bg-indigo-500',   label: 'Índigo'    },
  { value: 'bg-pink-100 text-pink-700 border-pink-200',         preview: 'bg-pink-500',     label: 'Rosa claro'},
];

const ICON_OPTIONS = Object.keys(ICON_MAP);

function PositionIcon({ icon, className = '' }) {
  const Icon = ICON_MAP[icon] || Briefcase;
  return <Icon className={className} />;
}

const emptyForm = { code: '', label: '', description: '', icon: 'briefcase', color: COLOR_OPTIONS[4].value };

export default function JobPositions() {
  const { refreshPermissions } = useAuth();
  const [positions, setPositions]       = useState([]);
  const [catalog, setCatalog]           = useState([]);
  const [selected, setSelected]         = useState(null);   // position code
  const [posPerms, setPosPerms]         = useState({});     // { code: boolean }
  const [saving, setSaving]             = useState(false);
  const [loading, setLoading]           = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(false);

  // Modal nuevo puesto
  const [showModal, setShowModal]       = useState(false);
  const [modalMode, setModalMode]       = useState('create'); // 'create' | 'edit'
  const [form, setForm]                 = useState(emptyForm);
  const [savingForm, setSavingForm]     = useState(false);

  const loadPositions = useCallback(() => {
    setLoading(true);
    api.get('/positions')
      .then(r => setPositions(r.data))
      .catch(() => toast.error('Error cargando puestos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPositions();
    api.get('/permissions').then(r => setCatalog(r.data)).catch(() => {});
  }, [loadPositions]);

  // Cuando cambia el puesto seleccionado, cargamos sus permisos
  useEffect(() => {
    if (!selected) return;
    setLoadingPerms(true);
    api.get(`/positions/${selected}/permissions`)
      .then(r => {
        const codes = r.data.permissionCodes || [];
        const map = {};
        catalog.forEach(p => { map[p.code] = codes.includes(p.code); });
        setPosPerms(map);
      })
      .catch(() => toast.error('Error cargando permisos del puesto'))
      .finally(() => setLoadingPerms(false));
  }, [selected, catalog]);

  const handleSelectPosition = (code) => {
    if (code === selected) return;
    setSelected(code);
    setPosPerms({});
  };

  const handleTogglePerm = (code, value) => {
    setPosPerms(prev => ({ ...prev, [code]: value }));
  };

  const handleSavePermissions = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const permissionCodes = Object.entries(posPerms)
        .filter(([, v]) => v)
        .map(([k]) => k);
      await api.put(`/positions/${selected}/permissions`, { permissionCodes });
      // Refrescar el token del admin actual para que sus permisos también se actualicen
      await refreshPermissions();
      toast.success('Permisos guardados. Los usuarios afectados los verán al recargar la página.');
      loadPositions(); // refresca contadores
    } catch {
      toast.error('Error guardando permisos');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPermissions = async () => {
    if (!selected) return;
    if (!window.confirm(`¿Restablecer los permisos de "${positions.find(p=>p.code===selected)?.label}" a los valores predeterminados del sistema?`)) return;
    setSaving(true);
    try {
      const r = await api.post(`/positions/${selected}/permissions/reset`);
      const codes = r.data.permissionCodes || [];
      const map = {};
      catalog.forEach(p => { map[p.code] = codes.includes(p.code); });
      setPosPerms(map);
      await refreshPermissions();
      toast.success('Permisos restablecidos a los valores por defecto.');
      loadPositions();
    } catch {
      toast.error('Error restableciendo permisos');
    } finally {
      setSaving(false);
    }
  };

  // ── Modal crear / editar ─────────────────────────────────────────────────
  const openCreate = () => {
    setForm(emptyForm);
    setModalMode('create');
    setShowModal(true);
  };

  const openEdit = (pos) => {
    setForm({
      code: pos.code,
      label: pos.label,
      description: pos.description || '',
      icon: pos.icon || 'briefcase',
      color: pos.color || COLOR_OPTIONS[4].value,
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleSaveForm = async () => {
    if (!form.label.trim()) { toast.error('La etiqueta es obligatoria'); return; }
    if (modalMode === 'create' && !form.code.trim()) { toast.error('El código es obligatorio'); return; }
    setSavingForm(true);
    try {
      if (modalMode === 'create') {
        await api.post('/positions', form);
        toast.success('Puesto creado');
      } else {
        await api.put(`/positions/${form.code}`, form);
        toast.success('Puesto actualizado');
      }
      setShowModal(false);
      loadPositions();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error guardando puesto');
    } finally {
      setSavingForm(false);
    }
  };

  const handleDelete = async (pos) => {
    if (!confirm(`¿Eliminar el puesto "${pos.label}"? Se eliminarán también sus permisos configurados.`)) return;
    try {
      await api.delete(`/positions/${pos.code}`);
      toast.success('Puesto eliminado');
      if (selected === pos.code) setSelected(null);
      loadPositions();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al eliminar');
    }
  };

  const selectedPos = positions.find(p => p.code === selected);
  const activeCount = Object.values(posPerms).filter(Boolean).length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Puestos de trabajo</h1>
            <p className="text-stone-500 text-sm mt-0.5">
              Define qué puede ver y hacer cada puesto. Los usuarios heredan los permisos automáticamente.
            </p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nuevo puesto
          </button>
        </div>

        {/* Layout split */}
        <div className="flex gap-5 items-start">

          {/* ── Panel izquierdo: lista de puestos ─────────────────────── */}
          <div className="w-64 flex-none space-y-2">
            {loading ? (
              [1,2,3,4,5].map(i => (
                <div key={i} className="h-16 rounded-xl bg-stone-100 animate-pulse" />
              ))
            ) : (
              positions.map(pos => {
                const isSelected = pos.code === selected;
                return (
                  <motion.div
                    key={pos.code}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`group relative rounded-xl border cursor-pointer transition-all select-none
                      ${isSelected
                        ? 'border-rose-300 bg-rose-50 shadow-sm'
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                      }`}
                    onClick={() => handleSelectPosition(pos.code)}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-none ${pos.color}`}>
                        <PositionIcon icon={pos.icon} className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-rose-700' : 'text-stone-800'}`}>
                          {pos.label}
                        </p>
                        <p className="text-xs text-stone-400">{pos.permissionCount} permisos</p>
                      </div>
                      {pos.system && (
                        <Lock size={11} className="text-stone-300 flex-none" title="Puesto del sistema" />
                      )}
                      {isSelected && (
                        <ChevronRight size={14} className="text-rose-400 flex-none" />
                      )}
                    </div>

                    {/* Acciones hover */}
                    <div className={`absolute top-1.5 right-1.5 gap-0.5 hidden group-hover:flex ${isSelected ? '!flex' : ''}`}>
                      <button
                        onClick={e => { e.stopPropagation(); openEdit(pos); }}
                        className="p-1 rounded-lg hover:bg-stone-200 transition-colors"
                        title="Editar etiqueta/icono"
                      >
                        <Edit2 size={11} className="text-stone-400" />
                      </button>
                      {!pos.system && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(pos); }}
                          className="p-1 rounded-lg hover:bg-red-100 transition-colors"
                          title="Eliminar puesto"
                        >
                          <Trash2 size={11} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}

            <div className="pt-2 border-t border-stone-100">
              <p className="text-xs text-stone-400 text-center leading-relaxed">
                <Lock size={10} className="inline mr-1" />
                Los puestos del sistema no se pueden eliminar pero sí editar sus permisos.
              </p>
            </div>
          </div>

          {/* ── Panel derecho: permisos del puesto seleccionado ──────── */}
          <div className="flex-1 min-w-0">
            {!selected ? (
              <div className="card p-12 text-center border-dashed">
                <Wand2 size={32} className="mx-auto text-stone-300 mb-3" />
                <p className="text-stone-500 font-medium">Selecciona un puesto</p>
                <p className="text-sm text-stone-400 mt-1">
                  Haz clic en un puesto de la izquierda para ver y editar sus permisos.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header panel de permisos */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {selectedPos && (
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${selectedPos.color}`}>
                        <PositionIcon icon={selectedPos.icon} className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h2 className="font-bold text-stone-900">
                        {selectedPos?.label}
                      </h2>
                      <p className="text-xs text-stone-400">
                        {loadingPerms ? 'Cargando...' : `${activeCount} / ${catalog.length} permisos activos`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSavePermissions}
                    disabled={saving || loadingPerms}
                    className="btn-primary flex items-center gap-2"
                  >
                    {saving
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Save size={15} />
                    }
                    Guardar permisos
                  </button>
                  <button
                    onClick={handleResetPermissions}
                    disabled={saving || loadingPerms}
                    title="Restablecer permisos a los valores por defecto del sistema"
                    className="btn-secondary flex items-center gap-2"
                  >
                    <RefreshCw size={15} />
                    Restablecer
                  </button>
                </div>

                {/* Info hint */}
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 flex items-start gap-2">
                  <AlertCircle size={15} className="text-amber-500 flex-none mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Todos los usuarios con el puesto <strong>{selectedPos?.label}</strong> heredarán automáticamente estos permisos.
                    Los cambios se aplican al momento — los usuarios verán los nuevos permisos en su próxima acción o al recargar la página.
                  </p>
                </div>

                {/* Panel de permisos */}
                {loadingPerms ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-stone-100 animate-pulse" />)}
                  </div>
                ) : (
                  <PermissionPanel
                    catalog={catalog}
                    permissions={posPerms}
                    rolePerms={[]}
                    overrides={{}}
                    onChange={handleTogglePerm}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal crear / editar puesto ────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-stone-900 text-lg">
                    {modalMode === 'create' ? 'Nuevo puesto' : `Editar: ${form.label}`}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="btn-ghost p-2 rounded-lg">
                    <X size={18} className="text-stone-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  {modalMode === 'create' && (
                    <div>
                      <label className="label">Código interno *</label>
                      <input
                        className="input uppercase"
                        value={form.code}
                        onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))}
                        placeholder="WEDDING_PLANNER"
                        maxLength={50}
                      />
                      <p className="text-xs text-stone-400 mt-1">Solo letras mayúsculas, números y guión bajo. Inmutable.</p>
                    </div>
                  )}

                  <div>
                    <label className="label">Nombre del puesto *</label>
                    <input
                      className="input"
                      value={form.label}
                      onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                      placeholder="Wedding Planner"
                    />
                  </div>

                  <div>
                    <label className="label">Descripción</label>
                    <input
                      className="input"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Coordinación de bodas y eventos especiales"
                    />
                  </div>

                  {/* Icono */}
                  <div>
                    <label className="label">Icono</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {ICON_OPTIONS.map(ic => {
                        const Icon = ICON_MAP[ic];
                        return (
                          <button
                            key={ic} type="button"
                            onClick={() => setForm(f => ({ ...f, icon: ic }))}
                            className={`p-2 rounded-lg border transition-all ${
                              form.icon === ic
                                ? 'border-rose-400 bg-rose-50 text-rose-600'
                                : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
                            }`}
                          >
                            <Icon size={16} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="label">Color</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {COLOR_OPTIONS.map(c => (
                        <button
                          key={c.value} type="button"
                          onClick={() => setForm(f => ({ ...f, color: c.value }))}
                          className={`w-7 h-7 rounded-full transition-all ${c.preview} ${
                            form.color === c.value ? 'ring-2 ring-offset-2 ring-rose-400 scale-110' : 'hover:scale-110'
                          }`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <label className="label">Vista previa</label>
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium ${form.color}`}>
                      <PositionIcon icon={form.icon} className="w-4 h-4" />
                      {form.label || 'Nombre del puesto'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                  <button
                    onClick={handleSaveForm}
                    disabled={savingForm}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {savingForm
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Check size={15} />
                    }
                    {modalMode === 'create' ? 'Crear puesto' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Layout>
  );
}







