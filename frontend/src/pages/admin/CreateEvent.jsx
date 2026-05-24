import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const TYPES = [
  { value: 'BODA', label: 'Boda' }, { value: 'COMUNION', label: 'Comunion' },
  { value: 'BAUTIZO', label: 'Bautizo' }, { value: 'CUMPLEANOS', label: 'Cumpleanos' },
  { value: 'ANIVERSARIO', label: 'Aniversario' }, { value: 'EMPRESA', label: 'Evento de empresa' },
  { value: 'PRIVADO', label: 'Evento privado' }, { value: 'OTRO', label: 'Otro' },
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [form, setForm] = useState({
    clientName: '', type: 'BODA', eventDate: '', estimatedGuests: '',
    venue: '', contactPerson: '', phone: '', email: '', notes: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, estimatedGuests: parseInt(form.estimatedGuests) || null };
      const res = await api.post('/events', payload);
      const creds = res.data.clientUsername; // "usuario / password"
      setCredentials({ eventId: res.data.id, clientName: res.data.clientName, creds });
      toast.success('Evento creado correctamente');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear el evento');
    } finally {
      setLoading(false);
    }
  };

  if (credentials) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto">
          <div className="card border-emerald-200 bg-emerald-50">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="text-xl font-bold text-emerald-800">Evento creado correctamente</h2>
              <p className="text-emerald-700 text-sm mt-1">Comparte estas credenciales con el cliente</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-200">
              <p className="text-sm text-gray-500 mb-1">Cliente</p>
              <p className="font-semibold text-lg">{credentials.clientName}</p>
              <hr className="my-3" />
              <p className="text-sm text-gray-500 mb-1">Acceso al portal (usuario / contrasena)</p>
              <p className="font-mono text-lg font-bold text-rose-700 bg-rose-50 rounded-lg p-3 text-center">
                {credentials.creds}
              </p>
              <p className="text-xs text-gray-400 mt-2 text-center">
                URL: <span className="font-mono">http://localhost:5173/login</span>
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => navigate('/admin/eventos')}>
                Ver todos los eventos
              </button>
              <button className="btn-primary flex-1" onClick={() => navigate(`/admin/eventos/${credentials.eventId}`)}>
                Ir al evento →
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">←</button>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Evento</h1>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre del cliente *</label>
              <input className="input" value={form.clientName} onChange={e => set('clientName', e.target.value)} required placeholder="Nombre y apellidos" />
            </div>
            <div>
              <label className="label">Tipo de evento *</label>
              <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fecha del evento *</label>
              <input className="input" type="date" value={form.eventDate} onChange={e => set('eventDate', e.target.value)} required min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="label">N. de invitados estimados</label>
              <input className="input" type="number" value={form.estimatedGuests} onChange={e => set('estimatedGuests', e.target.value)} placeholder="200" min={1} />
            </div>
            <div>
              <label className="label">Salon / Espacio</label>
              <input className="input" value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="Salon Principal" />
            </div>
            <div>
              <label className="label">Persona de contacto</label>
              <input className="input" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} placeholder="Nombre del contacto" />
            </div>
            <div>
              <label className="label">Telefono</label>
              <input className="input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+34 600 000 000" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="cliente@email.com" />
            </div>
          </div>
          <div>
            <label className="label">Notas internas</label>
            <textarea className="input" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Observaciones para el equipo..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear evento y generar acceso'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

