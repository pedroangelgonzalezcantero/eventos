import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, X, Save, ToggleLeft, ToggleRight, User, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const emptyForm = { dni: '', nombre: '', apellidos: '', seguridadSocial: '', puesto: '' };

export default function PersonaManagement() {
  const [personas, setPersonas]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');

  const loadPersonas = useCallback(() => {
    setLoading(true);
    api.get('/personas')
      .then(r => setPersonas(r.data))
      .catch(() => toast.error('Error cargando personas'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadPersonas(); }, [loadPersonas]);

  const filtered = personas.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.apellidos.toLowerCase().includes(q) ||
      p.dni.toLowerCase().includes(q) ||
      (p.puesto || '').toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({ dni: p.dni, nombre: p.nombre, apellidos: p.apellidos, seguridadSocial: p.seguridadSocial || '', puesto: p.puesto || '' });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.dni.trim())      { setFormError('El DNI es obligatorio'); return; }
    if (!form.nombre.trim())   { setFormError('El nombre es obligatorio'); return; }
    if (!form.apellidos.trim()){ setFormError('Los apellidos son obligatorios'); return; }
    setFormError('');
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/personas/${editingId}`, form);
        toast.success('Persona actualizada');
      } else {
        await api.post('/personas', form);
        toast.success('Persona creada');
      }
      setShowForm(false);
      loadPersonas();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Error al guardar';
      setFormError(msg);
    } finally { setSaving(false); }
  };

  const handleToggle = async (persona) => {
    try {
      await api.patch(`/personas/${persona.id}/toggle-activo`);
      toast.success(persona.activo ? 'Persona desactivada' : 'Persona activada');
      loadPersonas();
    } catch { toast.error('Error'); }
  };

  const handleCancel = () => { setShowForm(false); setFormError(''); };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              <User size={22} className="text-stone-500" /> Gestión de Personas
            </h1>
            <p className="text-stone-500 text-sm mt-0.5">
              Tabla maestra de trabajadores · {personas.length} registradas
            </p>
          </div>
          <button onClick={openCreate} className="btn-primary inline-flex items-center gap-1.5">
            <Plus size={16} /> Nueva persona
          </button>
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="card border-rose-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-stone-900">
                {editingId ? 'Editar persona' : 'Nueva persona'}
              </h3>
              <button onClick={handleCancel} className="text-stone-400 hover:text-stone-600">
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle size={15} /> {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">DNI *</label>
                <input className="input" value={form.dni} onChange={e => setForm(f => ({ ...f, dni: e.target.value.toUpperCase() }))}
                  placeholder="12345678A" />
              </div>
              <div>
                <label className="label">Nombre *</label>
                <input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Juan" />
              </div>
              <div>
                <label className="label">Apellidos *</label>
                <input className="input" value={form.apellidos} onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))}
                  placeholder="García López" />
              </div>
              <div>
                <label className="label">Número de S. Social</label>
                <input className="input" value={form.seguridadSocial} onChange={e => setForm(f => ({ ...f, seguridadSocial: e.target.value }))}
                  placeholder="28/12345678/78" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Puesto habitual</label>
                <input className="input" value={form.puesto} onChange={e => setForm(f => ({ ...f, puesto: e.target.value }))}
                  placeholder="Maitre, Camarero, Ayudante de cocina..." />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleCancel} className="btn-secondary">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? 'Guardando...' : <><Save size={15} /> Guardar</>}
              </button>
            </div>
          </div>
        )}

        {/* Búsqueda */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por nombre, apellidos, DNI o puesto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="card flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/70">
                  <th className="text-left px-4 py-3 font-medium text-stone-600">DNI</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Nombre completo</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">S. Social</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Puesto</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className={`border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors ${!p.activo ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-stone-700">{p.dni}</td>
                    <td className="px-4 py-3 font-medium text-stone-900">{p.nombre} {p.apellidos}</td>
                    <td className="px-4 py-3 text-stone-500 font-mono text-xs">{p.seguridadSocial || <span className="text-stone-300 italic">—</span>}</td>
                    <td className="px-4 py-3 text-stone-600">{p.puesto || <span className="text-stone-300 italic">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${p.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Editar">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleToggle(p)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                          title={p.activo ? 'Desactivar' : 'Activar'}>
                          {p.activo ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-stone-400">
                      {search ? `Sin resultados para "${search}"` : 'No hay personas registradas todavía.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

