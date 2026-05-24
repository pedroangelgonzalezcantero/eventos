import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Edit2, X, Check,
  ShieldCheck, Layers, ChefHat, Music2, User, Briefcase, Camera, Heart, Star, Users,
  ToggleLeft, ToggleRight, Shield, UserCheck, Search, AlertCircle, Lock
} from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import PermissionPanel from '../../components/PermissionPanel';
import toast from 'react-hot-toast';

// Mapa de iconos Lucide por nombre
const ICON_MAP = {
  'shield-check': ShieldCheck, 'layers': Layers, 'chef-hat': ChefHat,
  'music-2': Music2, 'user': User, 'briefcase': Briefcase,
  'camera': Camera, 'heart': Heart, 'star': Star, 'users': Users,
};
function PosIcon({ icon, className = '' }) {
  const Icon = ICON_MAP[icon] || Briefcase;
  return <Icon className={className} />;
}

const TABS = [
  { id: 'data',  label: 'Datos',    icon: UserCheck },
  { id: 'perms', label: 'Permisos', icon: Shield    },
];
const emptyForm = { username: '', password: '', nombre: '', email: '', role: '' };

export default function UserManagement() {
  const [staff, setStaff]             = useState([]);
  const [positions, setPositions]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchStaff, setSearchStaff] = useState('');

  // Drawer
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [activeTab, setActiveTab]     = useState('data');
  const [editUser, setEditUser]       = useState(null);
  const [form, setForm]               = useState(emptyForm);
  const [saving, setSaving]           = useState(false);

  // Permissions
  const [catalog, setCatalog]             = useState([]);
  const [permState, setPermState]         = useState({});
  const [permOverrides, setPermOverrides] = useState({});
  const [positionPerms, setPositionPerms] = useState([]); // permisos base del puesto
  const [savingPerms, setSavingPerms]     = useState(false);
  const [customizing, setCustomizing]     = useState(false);

  const loadStaff = useCallback(() => {
    setLoading(true);
    api.get('/users/staff')
      .then(r => setStaff(r.data))
      .catch(() => toast.error('Error cargando personal'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStaff();
    api.get('/positions').then(r => {
      setPositions(r.data);
    }).catch(() => {});
    api.get('/permissions').then(r => setCatalog(r.data)).catch(() => {});
  }, [loadStaff]);

  const posMap = positions.reduce((a, p) => { a[p.code] = p; return a; }, {});
  const defaultRole = positions.length > 0 ? positions.find(p => p.code !== 'CLIENT')?.code || positions[0].code : '';

  // Cargar permisos del puesto dado
  const loadPositionPerms = async (roleCode, allCatalog) => {
    try {
      const res = await api.get(`/positions/${roleCode}/permissions`);
      const codes = res.data.permissionCodes || [];
      const pmap = {};
      allCatalog.forEach(p => { pmap[p.code] = codes.includes(p.code); });
      return { pmap, codes };
    } catch { return { pmap: {}, codes: [] }; }
  };

  const openCreate = async () => {
    const role = defaultRole;
    setForm({ ...emptyForm, role });
    setEditUser(null);
    setCustomizing(false);
    setPermOverrides({});
    const { pmap, codes } = await loadPositionPerms(role, catalog);
    setPermState(pmap);
    setPositionPerms(codes);
    setActiveTab('data');
    setDrawerOpen(true);
  };

  const openEdit = async (u) => {
    setForm({ username: u.username, password: '', nombre: u.nombre, email: u.email, role: u.role });
    setEditUser(u);
    setActiveTab('data');
    setCustomizing(false);
    setDrawerOpen(true);
    try {
      const [permsRes, posRes] = await Promise.all([
        api.get(`/users/${u.id}/permissions`),
        api.get(`/positions/${u.role}/permissions`).catch(() => ({ data: { permissionCodes: [] } })),
      ]);
      const { effectivePermissions, overrides } = permsRes.data;
      const pmap = {};
      catalog.forEach(p => { pmap[p.code] = effectivePermissions.includes(p.code); });
      setPermState(pmap);
      setPermOverrides(overrides || {});
      setPositionPerms(posRes.data.permissionCodes || []);
      const hasOverrides = Object.keys(overrides || {}).length > 0;
      setCustomizing(hasOverrides);
    } catch { toast.error('Error cargando permisos'); }
  };

  const handleSave = async () => {
    if (!form.nombre || !form.username || (!editUser && !form.password)) {
      toast.error('Completa los campos obligatorios'); return;
    }
    setSaving(true);
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, {
          nombre: form.nombre, email: form.email, role: form.role, password: form.password
        });
        toast.success('Usuario actualizado');
        // Si cambiaste el puesto y no hay customización, resetear permisos del usuario
        if (editUser.role !== form.role && !customizing) {
          await api.put(`/users/${editUser.id}/permissions`, {});
        }
      } else {
        const res = await api.post('/users', form);
        setEditUser(res.data);
        toast.success('Usuario creado ✨');
      }
      loadStaff();
      setActiveTab('perms');
    } catch { toast.error('Error al guardar usuario'); }
    finally { setSaving(false); }
  };

  const handleSavePerms = async () => {
    if (!editUser) { toast.error('Guarda primero los datos del usuario'); return; }
    setSavingPerms(true);
    try {
      const res = await api.put(`/users/${editUser.id}/permissions`, permState);
      setPermOverrides(res.data.overrides || {});
      toast.success('Permisos personalizados guardados');
    } catch { toast.error('Error guardando permisos'); }
    finally { setSavingPerms(false); }
  };

  const handleResetPerms = async () => {
    if (!editUser) return;
    if (!confirm('¿Restablecer permisos al puesto base? Se eliminarán todas las personalizaciones.')) return;
    try {
      await api.put(`/users/${editUser.id}/permissions`, {});
      setPermOverrides({});
      setCustomizing(false);
      const { pmap, codes } = await loadPositionPerms(form.role, catalog);
      setPermState(pmap);
      setPositionPerms(codes);
      toast.success('Permisos restablecidos al puesto');
    } catch { toast.error('Error restableciendo permisos'); }
  };

  const handleToggleActive = async (u) => {
    try {
      await api.put(`/users/${u.id}/active`, { active: !u.active });
      toast.success(u.active ? 'Usuario desactivado' : 'Usuario activado');
      loadStaff();
      if (editUser && editUser.id === u.id) setEditUser(prev => ({ ...prev, active: !prev.active }));
    } catch { toast.error('Error actualizando estado'); }
  };

  const handleDelete = async (u) => {
    if (!confirm(`¿Eliminar al usuario "${u.nombre}"?`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success('Usuario eliminado');
      setDrawerOpen(false);
      loadStaff();
    } catch { toast.error('Error al eliminar'); }
  };

  const handlePermToggle = (code, value) => {
    setPermState(prev => ({ ...prev, [code]: value }));
    const inRole = positionPerms.includes(code);
    setPermOverrides(prev => {
      const next = { ...prev };
      if (value !== inRole) next[code] = value;
      else delete next[code];
      return next;
    });
  };

  const handleRoleChange = async (role) => {
    setForm(f => ({ ...f, role }));
    setCustomizing(false);
    setPermOverrides({});
    const { pmap, codes } = await loadPositionPerms(role, catalog);
    setPermState(pmap);
    setPositionPerms(codes);
  };

  // Agrupación por puesto (excluye CLIENT)
  const staffPositions = positions.filter(p => p.code !== 'CLIENT');
  const filteredStaff = staff.filter(u =>
    !searchStaff ||
    u.nombre.toLowerCase().includes(searchStaff.toLowerCase()) ||
    u.username.toLowerCase().includes(searchStaff.toLowerCase())
  );
  const groupedStaff = staffPositions.reduce((acc, p) => {
    acc[p.code] = filteredStaff.filter(u => u.role === p.code);
    return acc;
  }, {});
  // Usuarios con puesto no reconocido
  const knownCodes = new Set(positions.map(p => p.code));
  const unknownStaff = filteredStaff.filter(u => u.role !== 'CLIENT' && !knownCodes.has(u.role));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Personal</h1>
            <p className="text-stone-500 text-sm mt-0.5">
              Gestiona el equipo. Los permisos se heredan del puesto automáticamente.
            </p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nuevo usuario
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input className="input pl-9 text-sm" placeholder="Buscar personal..." value={searchStaff}
            onChange={e => setSearchStaff(e.target.value)} />
        </div>

        {/* Staff grouped by position */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="card animate-pulse h-20 bg-stone-100 border-none" />)}
          </div>
        ) : (
          <div className="space-y-6">
            {staffPositions.map(pos => {
              const users = groupedStaff[pos.code] || [];
              return (
                <div key={pos.code}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${pos.color}`}>
                      <PosIcon icon={pos.icon} className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-semibold text-stone-800">{pos.label}</h3>
                    <span className="text-xs text-stone-400">({users.length})</span>
                  </div>
                  {users.length === 0 ? (
                    <p className="text-sm text-stone-400 pl-9">Sin usuarios de este puesto.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {users.map((u, i) => (
                        <motion.div key={u.id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className={`card p-4 group transition-all ${!u.active ? 'opacity-50 grayscale' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-none ${pos.color}`}>
                                <span className="font-bold text-sm">{(u.nombre||'?')[0].toUpperCase()}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-stone-900 text-sm truncate">{u.nombre}</p>
                                <p className="text-xs text-stone-400">@{u.username}</p>
                                {u.email && <p className="text-xs text-stone-400 truncate">{u.email}</p>}
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button onClick={() => openEdit(u)} className="btn-ghost p-1.5 rounded-lg" title="Editar">
                                <Edit2 size={13} className="text-stone-400" />
                              </button>
                              <button onClick={() => handleToggleActive(u)} className="btn-ghost p-1.5 rounded-lg"
                                title={u.active ? 'Desactivar' : 'Activar'}>
                                {u.active
                                  ? <ToggleRight size={13} className="text-emerald-500" />
                                  : <ToggleLeft size={13} className="text-stone-400" />
                                }
                              </button>
                              <button onClick={() => handleDelete(u)} className="btn-ghost p-1.5 rounded-lg hover:text-red-600 hover:bg-red-50">
                                <Trash2 size={13} className="text-stone-400" />
                              </button>
                            </div>
                          </div>
                          <button onClick={() => openEdit(u)} className="mt-2 text-xs text-stone-400 hover:text-violet-600 flex items-center gap-1 transition-colors">
                            <Shield size={11} /> Ver / personalizar permisos
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {unknownStaff.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg border border-stone-200 bg-stone-100 flex items-center justify-center">
                    <Briefcase size={14} className="text-stone-500" />
                  </div>
                  <h3 className="font-semibold text-stone-800">Sin puesto asignado</h3>
                  <span className="text-xs text-stone-400">({unknownStaff.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unknownStaff.map(u => (
                    <div key={u.id} className="card p-4 group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                          <span className="font-bold text-stone-500 text-sm">{(u.nombre||'?')[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900 text-sm">{u.nombre}</p>
                          <p className="text-xs text-stone-400">{u.role}</p>
                        </div>
                      </div>
                      <button onClick={() => openEdit(u)} className="mt-2 text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1">
                        <AlertCircle size={11} /> Asignar puesto
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Side Drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                <div>
                  <h2 className="font-bold text-stone-900 text-lg">
                    {editUser ? `Editar: ${editUser.nombre}` : 'Nuevo usuario'}
                  </h2>
                  {editUser && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-sm text-stone-400">@{editUser.username}</p>
                      {posMap[editUser.role] && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${posMap[editUser.role].color}`}>
                          {posMap[editUser.role].label}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={() => setDrawerOpen(false)} className="btn-ghost p-2 rounded-lg">
                  <X size={20} className="text-stone-400" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-stone-100 px-6">
                {TABS.map(t => {
                  const Icon = t.icon;
                  return (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                        ${activeTab === t.id ? 'border-rose-500 text-rose-600' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
                    >
                      <Icon size={15} />{t.label}
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                {activeTab === 'data' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Nombre completo *</label>
                        <input className="input" value={form.nombre}
                          onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Carlos García" />
                      </div>
                      <div>
                        <label className="label">Usuario (login) *</label>
                        <input className="input" value={form.username}
                          onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                          placeholder="carlosdj" disabled={!!editUser} />
                      </div>
                      <div>
                        <label className="label">Email</label>
                        <input className="input" type="email" value={form.email}
                          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="carlos@salon.com" />
                      </div>
                      <div>
                        <label className="label">{editUser ? 'Nueva contraseña (dejar en blanco)' : 'Contraseña *'}</label>
                        <input className="input" type="password" value={form.password}
                          onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
                      </div>
                    </div>

                    {/* Selector de puesto */}
                    <div>
                      <label className="label">Puesto de trabajo</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                        {positions.filter(p => p.code !== 'CLIENT').map(pos => (
                          <button key={pos.code} type="button"
                            onClick={() => handleRoleChange(pos.code)}
                            className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all
                              ${form.role === pos.code
                                ? 'border-rose-400 bg-rose-50 text-rose-700 shadow-sm'
                                : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                              }`}
                          >
                            <PosIcon icon={pos.icon} className="w-4 h-4 flex-none" />
                            <span className="truncate">{pos.label}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-stone-400 mt-2">
                        El usuario heredará automáticamente los permisos de este puesto.
                      </p>
                    </div>

                    {editUser && (
                      <div className="flex gap-2 pt-2 border-t border-stone-100">
                        <button type="button" onClick={() => handleToggleActive(editUser)}
                          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors
                            ${editUser.active
                              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                        >
                          {editUser.active ? <ToggleLeft size={13}/> : <ToggleRight size={13}/>}
                          {editUser.active ? 'Desactivar cuenta' : 'Activar cuenta'}
                        </button>
                        <button type="button" onClick={() => handleDelete(editUser)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={13}/> Eliminar usuario
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'perms' && (
                  <div className="space-y-4">
                    {/* Info del puesto actual */}
                    {posMap[form.role] && (
                      <div className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${posMap[form.role].color}`}>
                        <div className="flex items-center gap-2">
                          <PosIcon icon={posMap[form.role].icon} className="w-4 h-4 flex-none" />
                          <div>
                            <p className="text-sm font-semibold">{posMap[form.role].label}</p>
                            <p className="text-xs opacity-70">Permisos heredados del puesto · {positionPerms.length} permisos base</p>
                          </div>
                        </div>
                        {!customizing && (
                          <button
                            onClick={() => setCustomizing(true)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/60 hover:bg-white/90 transition-colors border border-current/20 flex items-center gap-1 whitespace-nowrap"
                          >
                            <Edit2 size={11} /> Personalizar
                          </button>
                        )}
                      </div>
                    )}

                    {!customizing ? (
                      // Vista solo lectura: muestra los permisos del puesto
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Lock size={13} className="text-stone-400" />
                          <span className="text-stone-500">
                            Permisos del puesto (solo lectura). Pulsa <strong>Personalizar</strong> para hacer excepciones.
                          </span>
                        </div>
                        <PermissionPanel
                          catalog={catalog}
                          permissions={permState}
                          rolePerms={positionPerms}
                          overrides={{}}
                          onChange={null}
                          readOnly={true}
                        />
                      </div>
                    ) : (
                      // Modo edición
                      <div className="space-y-4">
                        <div className="rounded-xl bg-violet-50 border border-violet-200 px-4 py-2.5 flex items-start gap-2">
                          <AlertCircle size={15} className="text-violet-500 flex-none mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-violet-700 leading-relaxed">
                              Estás personalizando permisos para <strong>{editUser?.nombre || 'este usuario'}</strong>.
                              Los cambios se aplican solo a este usuario, no al puesto completo.
                            </p>
                          </div>
                          <button onClick={handleResetPerms}
                            className="text-xs text-violet-600 hover:text-violet-800 font-medium whitespace-nowrap underline">
                            Restablecer
                          </button>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-semibold text-stone-700">
                            {Object.values(permState).filter(Boolean).length}
                            <span className="font-normal text-stone-400"> / {catalog.length} permisos activos</span>
                          </span>
                          {Object.keys(permOverrides).length > 0 && (
                            <span className="text-xs text-violet-600 font-medium bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
                              {Object.keys(permOverrides).length} personalizados
                            </span>
                          )}
                        </div>

                        <PermissionPanel
                          catalog={catalog}
                          permissions={permState}
                          rolePerms={positionPerms}
                          overrides={permOverrides}
                          onChange={handlePermToggle}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100 bg-stone-50/50">
                <button onClick={() => setDrawerOpen(false)} className="btn-secondary">Cancelar</button>
                {activeTab === 'data' && (
                  <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                    {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Check size={15}/>}
                    {editUser ? 'Guardar cambios' : 'Crear usuario'}
                  </button>
                )}
                {activeTab === 'perms' && customizing && (
                  <button onClick={handleSavePerms} disabled={savingPerms} className="btn-primary flex items-center gap-2">
                    {savingPerms ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Shield size={15}/>}
                    Guardar excepciones
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Layout>
  );
}

