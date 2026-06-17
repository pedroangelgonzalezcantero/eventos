import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, User, Clock, CalendarDays, FileText, CheckCircle, Trash2, Save } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'PENDIENTE',  label: 'Pendiente',  color: 'bg-amber-100 text-amber-800' },
  { value: 'CONFIRMADA', label: 'Confirmada', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'CANCELADA',  label: 'Cancelada',  color: 'bg-red-100 text-red-800' },
  { value: 'COMPLETADA', label: 'Completada', color: 'bg-blue-100 text-blue-800' },
];

const EMPTY_FORM = {
  appointmentDate: '',
  startTime: '',
  endTime: '',
  clientName: '',
  phone: '',
  workerId: '',
  notes: '',
  status: 'PENDIENTE',
};

/**
 * Modal para crear / editar citas telefónicas.
 *
 * Props:
 *  - open        {boolean}
 *  - onClose     {() => void}
 *  - onSaved     {(appointment) => void}
 *  - onDeleted   {(id) => void}
 *  - initialDate {string|null}  — fecha ISO preseleccionada al hacer click en día
 *  - appointment {object|null}  — cita existente para editar (null = crear nueva)
 */
export default function AppointmentModal({ open, onClose, onSaved, onDeleted, initialDate, appointment }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [workers, setWorkers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const clientRef = useRef(null);

  // Cargar lista de empleadas
  useEffect(() => {
    api.get('/users/staff')
      .then(r => setWorkers(r.data.filter(u => u.active)))
      .catch(() => {});
  }, []);

  // Rellenar formulario al abrir
  useEffect(() => {
    if (!open) {
      setConfirmDelete(false);
      return;
    }
    if (appointment) {
      setForm({
        appointmentDate: appointment.appointmentDate ?? '',
        // La API devuelve "HH:MM:SS" — recortamos a "HH:MM" para el input[type=time]
        startTime: appointment.startTime ? appointment.startTime.slice(0, 5) : '',
        endTime:   appointment.endTime   ? appointment.endTime.slice(0, 5)   : '',
        clientName: appointment.clientName ?? '',
        phone:      appointment.phone ?? '',
        workerId:   appointment.workerId ? String(appointment.workerId) : '',
        notes:      appointment.notes ?? '',
        status:     appointment.status ?? 'PENDIENTE',
      });
    } else {
      setForm({ ...EMPTY_FORM, appointmentDate: initialDate ?? '' });
    }
    // Auto-focus en nombre cliente
    setTimeout(() => clientRef.current?.focus(), 120);
  }, [open, appointment, initialDate]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.appointmentDate || !form.startTime || !form.clientName.trim() || !form.workerId) {
      toast.error('Completa los campos obligatorios (*)');
      return;
    }
    setSaving(true);
    const payload = {
      appointmentDate: form.appointmentDate,
      // Normalizar hora: si ya tiene segundos ("HH:MM:SS") no añadir más
      startTime: form.startTime.length === 5 ? form.startTime + ':00' : form.startTime,
      endTime:   form.endTime ? (form.endTime.length === 5 ? form.endTime + ':00' : form.endTime) : null,
      clientName: form.clientName.trim(),
      phone: form.phone.trim() || null,
      workerId: Number(form.workerId),
      notes: form.notes.trim() || null,
      status: form.status,
    };
    try {
      let saved;
      if (appointment?.id) {
        const r = await api.put(`/appointments/${appointment.id}`, payload);
        saved = r.data;
        toast.success('Cita actualizada ✓');
      } else {
        const r = await api.post('/appointments', payload);
        saved = r.data;
        toast.success('Cita registrada ✓');
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error
               || err.response?.data?.message
               || (err.response?.status === 409 ? 'Horario solapado con otra cita de esta trabajadora' : null)
               || 'Error al guardar la cita';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await api.delete(`/appointments/${appointment.id}`);
      toast.success('Cita eliminada');
      onDeleted(appointment.id);
      onClose();
    } catch {
      toast.error('Error al eliminar la cita');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.15 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-gradient-to-r from-rose-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center shadow-sm">
                  <Phone size={15} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-900">
                    {appointment ? 'Editar cita' : 'Nueva cita telefónica'}
                  </h2>
                  <p className="text-xs text-stone-400">Reserva manual por llamada</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-5 space-y-3.5">

              {/* Fila: Fecha + Hora inicio */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    <CalendarDays size={11} className="inline mr-1" />Fecha *
                  </label>
                  <input type="date" required value={form.appointmentDate}
                    onChange={e => set('appointmentDate', e.target.value)}
                    className="input text-sm py-2" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    <Clock size={11} className="inline mr-1" />Hora inicio *
                  </label>
                  <input type="time" required value={form.startTime}
                    onChange={e => set('startTime', e.target.value)}
                    className="input text-sm py-2" />
                </div>
              </div>

              {/* Fila: Hora fin + Estado */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    <Clock size={11} className="inline mr-1" />Hora fin
                  </label>
                  <input type="time" value={form.endTime}
                    onChange={e => set('endTime', e.target.value)}
                    className="input text-sm py-2" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Estado</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)}
                    className="input text-sm py-2">
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nombre cliente */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  <User size={11} className="inline mr-1" />Nombre del cliente *
                </label>
                <input ref={clientRef} type="text" required value={form.clientName}
                  onChange={e => set('clientName', e.target.value)}
                  placeholder="Ej: María García"
                  className="input text-sm py-2" />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  <Phone size={11} className="inline mr-1" />Teléfono
                </label>
                <input type="tel" value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="Ej: 612 345 678"
                  className="input text-sm py-2" />
              </div>

              {/* Trabajadora */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  <User size={11} className="inline mr-1" />Trabajadora asignada *
                </label>
                <select required value={form.workerId} onChange={e => set('workerId', e.target.value)}
                  className="input text-sm py-2">
                  <option value="">— Seleccionar trabajadora —</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.nombre} ({w.role})</option>
                  ))}
                </select>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  <FileText size={11} className="inline mr-1" />Observaciones
                </label>
                <textarea rows={2} value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Notas adicionales sobre la cita…"
                  className="input text-sm py-2 resize-none" />
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 pt-1">
                {appointment?.id && (
                  <button type="button" onClick={handleDelete} disabled={deleting}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      confirmDelete
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}>
                    <Trash2 size={14} />
                    {confirmDelete ? '¿Confirmar?' : 'Eliminar'}
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button type="button" onClick={onClose}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-sm">
                    {saving ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    {appointment ? 'Guardar cambios' : 'Registrar cita'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}




