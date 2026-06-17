import { useState, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Trash2, Edit2, X, AlertTriangle, AlertCircle, CheckCircle2,
  FileDown, FileUp,
} from 'lucide-react';
import PdfDownloadButton from '../../components/PdfDownloadButton';
import TablesPdfDoc from '../../components/pdf/TablesPdfDoc';

const DIET_OPTS = ['VEGETARIANO','VEGANO','HALAL','KOSHER','SIN_SAL','DIABETICO'];
const ALLERGEN_LIST = ['GLUTEN','LACTEOS','HUEVOS','FRUTOS_SECOS','CACAHUETES','SOJA','MARISCO','PESCADO','MOSTAZA','APIO','SESAMO','SULFITOS','MOLUSCOS','ALTRAMUZ'];
const ALLERGEN_LABELS_MAP = {
  GLUTEN:'Gluten/Celíaco', LACTEOS:'Lácteos', HUEVOS:'Huevos', FRUTOS_SECOS:'Frutos secos',
  CACAHUETES:'Cacahuetes', SOJA:'Soja', MARISCO:'Marisco', PESCADO:'Pescado',
  MOSTAZA:'Mostaza', APIO:'Apio', SESAMO:'Sésamo', SULFITOS:'Sulfitos',
  MOLUSCOS:'Moluscos', ALTRAMUZ:'Altramuces',
};
const ALLERGEN_BADGE_COLORS = [
  'bg-amber-50 text-amber-700 border border-amber-200',
  'bg-red-50 text-red-700 border border-red-200',
  'bg-orange-50 text-orange-700 border border-orange-200',
  'bg-yellow-50 text-yellow-700 border border-yellow-200',
];

export default function MesasAdminTab({ eventId, event, tables: allTables, reload }) {
  // Helper: cuenta personas reales ("Maria y Jose" = 2)
  const realCount = t => (t.guests && t.guests.length > 0)
    ? t.guests.reduce((s, g) => s + (g.guestName ? g.guestName.split(/\s+[yY]\s+/).length : 1), 0)
    : (t.guestCount || 0);

  // Solo mostrar mesas que tienen al menos un invitado asignado
  const tables = allTables.filter(t => realCount(t) > 0);

  const [showNewTable, setShowNewTable]         = useState(false);
  const [newTable, setNewTable]                 = useState({ name: '', capacity: '', notes: '' });
  const [showAddGuest, setShowAddGuest]         = useState(null);
  const [guestForm, setGuestForm]               = useState({ guestName: '', diet: '', observations: '' });
  const [selAllergens, setSelAllergens]         = useState([]);
  const [editingGuest, setEditingGuest]         = useState(null);
  const [editGuestForm, setEditGuestForm]       = useState({ guestName: '', diet: '', observations: '' });
  const [editSelAllergens, setEditSelAllergens] = useState([]);

  // ── Excel state ───────────────────────────────────────────────────────────
  const importFileRef                               = useRef(null);
  const [importLoading, setImportLoading]           = useState(false);
  const [importResult,  setImportResult]            = useState(null);
  const [showImportModal, setShowImportModal]       = useState(false);
  const [downloadingTpl, setDownloadingTpl]         = useState(false);

  const totalGuests   = tables.reduce((s, t) => s + realCount(t), 0);
  const totalAlergias = tables.reduce((s, t) => s + (t.allergiesCount || 0), 0);
  const safeName      = (event?.clientName || 'evento').replace(/\s+/g, '-').toLowerCase();

  const fetchPdfData = async () => {
    const r = await api.get(`/events/${eventId}/tables`);
    // Solo incluir en el PDF las mesas que tienen invitados
    const tablesWithGuests = r.data.filter(t => (t.guestCount || 0) > 0);
    return { event, tables: tablesWithGuests };
  };

  // ── Mesas ─────────────────────────────────────────────────────────────────
  const handleCreateTable = async () => {
    if (!newTable.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    try {
      await api.post(`/events/${eventId}/tables`, {
        ...newTable,
        capacity: newTable.capacity ? parseInt(newTable.capacity) : null,
      });
      toast.success('Mesa creada');
      setShowNewTable(false);
      setNewTable({ name: '', capacity: '', notes: '' });
      reload();
    } catch { toast.error('Error al crear mesa'); }
  };

  const handleDeleteTable = async (tableId, name) => {
    if (!confirm(`¿Eliminar la mesa "${name}" y todos sus invitados?`)) return;
    try {
      await api.delete(`/events/${eventId}/tables/${tableId}`);
      toast.success('Mesa eliminada');
      reload();
    } catch { toast.error('Error'); }
  };

  // ── Invitados ─────────────────────────────────────────────────────────────
  const handleAddGuest = async (tableId) => {
    if (!guestForm.guestName.trim()) { toast.error('El nombre es obligatorio'); return; }
    try {
      await api.post(`/events/${eventId}/tables/${tableId}/guests`, {
        ...guestForm, allergies: selAllergens.join(','),
      });
      toast.success('Invitado añadido');
      setShowAddGuest(null);
      setGuestForm({ guestName: '', diet: '', observations: '' });
      setSelAllergens([]);
      reload();
    } catch { toast.error('Error'); }
  };

  const handleDeleteGuest = async (tableId, guestId) => {
    try { await api.delete(`/events/${eventId}/tables/${tableId}/guests/${guestId}`); reload(); }
    catch { toast.error('Error'); }
  };

  const handleMoveGuest = async (tableId, guestId, targetTableId) => {
    try {
      await api.patch(`/events/${eventId}/tables/${tableId}/guests/${guestId}/move`, { targetTableId });
      toast.success('Invitado movido');
      reload();
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
      await api.put(
        `/events/${eventId}/tables/${editingGuest.tableId}/guests/${editingGuest.guestId}`,
        { ...editGuestForm, allergies: editSelAllergens.join(',') },
      );
      toast.success('Invitado actualizado');
      setEditingGuest(null);
      reload();
    } catch { toast.error('Error al actualizar'); }
  };

  // ── Descarga plantilla Excel ───────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    setDownloadingTpl(true);
    try {
      const response = await api.get(`/events/${eventId}/tables/template`, { responseType: 'blob' });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `Mesas_${safeName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Plantilla descargada ✓');
    } catch {
      toast.error('Error al descargar la plantilla');
    } finally {
      setDownloadingTpl(false);
    }
  };

  // ── Importar Excel ────────────────────────────────────────────────────────
  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
      toast.error('El archivo debe ser .xlsx o .xls');
      return;
    }

    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/events/${eventId}/tables/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      setShowImportModal(true);
      if (!res.data.errors?.length) reload();
    } catch (err) {
      const data = err?.response?.data;
      if (data && data.tablesCreated !== undefined) {
        setImportResult(data);
        setShowImportModal(true);
      } else {
        toast.error(err?.response?.data?.message || 'Error al importar el Excel');
      }
    } finally {
      setImportLoading(false);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportResult(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Estadísticas */}
      {tables.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Mesas',        value: tables.length,  color: 'text-stone-900' },
            { label: 'Invitados',    value: totalGuests,    color: 'text-stone-900' },
            { label: 'Con alergias', value: totalAlergias,  color: totalAlergias > 0 ? 'text-amber-600' : 'text-emerald-600' },
          ].map(i => (
            <div key={i.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${i.color}`}>{i.value}</p>
              <p className="text-sm text-stone-500">{i.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Barra de herramientas */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="font-semibold text-stone-800">
          Distribución de mesas
          <span className="text-stone-400 font-normal text-sm ml-2">(introducidas por el cliente)</span>
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <PdfDownloadButton
            permissionCode="PDF_TABLES"
            label="PDF mesas"
            fileName={`mesas-${safeName}.pdf`}
            fetchData={fetchPdfData}
            DocumentComponent={TablesPdfDoc}
          />

          {/* Descargar plantilla */}
          <button
            onClick={handleDownloadTemplate}
            disabled={downloadingTpl}
            title="Descargar plantilla Excel personalizada para rellenar e importar"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-stone-200 bg-white text-stone-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
          >
            {downloadingTpl
              ? <><span className="w-3.5 h-3.5 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin inline-block" /> Generando...</>
              : <><FileDown size={14} /> Plantilla Excel</>}
          </button>

          {/* Importar Excel */}
          <input
            ref={importFileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            onClick={() => importFileRef.current?.click()}
            disabled={importLoading}
            title="Importar mesas e invitados desde Excel"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-stone-200 bg-white text-stone-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {importLoading
              ? <><span className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin inline-block" /> Importando...</>
              : <><FileUp size={14} /> Importar Excel</>}
          </button>

          <button onClick={() => setShowNewTable(true)} className="btn-primary text-sm">
            + Nueva mesa
          </button>
        </div>
      </div>

      {/* ── Modal resultado importación ──────────────────────────────────────── */}
      {showImportModal && importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className={`px-6 py-4 rounded-t-2xl flex items-center justify-between ${
              importResult.errors?.length > 0
                ? 'bg-red-50 border-b border-red-100'
                : 'bg-emerald-50 border-b border-emerald-100'
            }`}>
              <div className="flex items-center gap-2">
                {importResult.errors?.length > 0
                  ? <AlertCircle size={20} className="text-red-500" />
                  : <CheckCircle2 size={20} className="text-emerald-500" />}
                <h3 className="font-bold text-stone-900">
                  {importResult.errors?.length > 0 ? 'Error en la importación' : 'Importación completada'}
                </h3>
              </div>
              <button onClick={closeImportModal} className="text-stone-400 hover:text-stone-600 p-1">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">

              {/* Resumen global — solo si no hay errores */}
              {!importResult.errors?.length && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Mesas creadas',       value: importResult.tablesCreated, color: 'text-emerald-600' },
                    { label: 'Invitados añadidos',   value: importResult.guestsCreated, color: 'text-emerald-600' },
                    { label: 'Ya en BD (no tocados)', value: importResult.guestsSkipped, color: 'text-blue-600'  },
                  ].map(item => (
                    <div key={item.label} className="bg-stone-50 rounded-xl p-3 text-center">
                      <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                      <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">{item.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Resumen por mesa */}
              {!importResult.errors?.length && importResult.tableSummaries?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-stone-600 mb-2">Detalle por mesa:</p>
                  <div className="max-h-52 overflow-y-auto rounded-xl border border-stone-100">
                    {importResult.tableSummaries.map((ts, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between px-3 py-2 text-xs ${
                          i % 2 === 0 ? 'bg-white' : 'bg-stone-50'
                        }`}
                      >
                        <span className="font-medium text-stone-800 truncate max-w-[45%]">
                          {ts.tableName}
                        </span>
                        <div className="flex items-center gap-1.5 flex-none flex-wrap justify-end">
                          {/* Total en Excel */}
                          <span className="text-stone-400 text-[10px]">{ts.inExcel} en Excel</span>
                          {ts.added > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                              +{ts.added} nuevo{ts.added !== 1 ? 's' : ''}
                            </span>
                          )}
                          {ts.alreadyInDb > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                              {ts.alreadyInDb} ya en BD ✓
                            </span>
                          )}
                          {ts.inExcel === 0 && (
                            <span className="text-stone-300 italic">vacía</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1.5 italic">
                    "Ya en BD" = ya existía con sus datos (alergias, dieta conservadas). Nombres repetidos = personas distintas.
                  </p>
                </div>
              )}

              {/* Errores */}
              {importResult.errors?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-red-700">Errores:</p>
                  {importResult.errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                      <AlertCircle size={14} className="flex-none mt-0.5" /> {e}
                    </div>
                  ))}
                </div>
              )}

              {/* Avisos — solo si los hay y son relevantes */}
              {importResult.warnings?.filter(w => w).length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-amber-700">
                    Avisos ({importResult.warnings.length}):
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResult.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5">
                        <AlertTriangle size={12} className="flex-none mt-0.5" /> {w}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex justify-end">
              <button onClick={closeImportModal} className="btn-primary text-sm">Aceptar</button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario nueva mesa */}
      {showNewTable && (
        <div className="card border-blue-100 bg-blue-50/30">
          <h4 className="font-medium mb-3">Nueva mesa</h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="label">Nombre *</label>
              <input
                className="input"
                value={newTable.name}
                onChange={e => setNewTable(f => ({ ...f, name: e.target.value }))}
                placeholder="Mesa 1 / Presidencial"
              />
            </div>
            <div>
              <label className="label">Capacidad</label>
              <input
                className="input"
                type="number" min="1"
                value={newTable.capacity}
                onChange={e => setNewTable(f => ({ ...f, capacity: e.target.value }))}
                placeholder="10"
              />
            </div>
            <div className="col-span-2">
              <label className="label">Observaciones</label>
              <input
                className="input"
                value={newTable.notes}
                onChange={e => setNewTable(f => ({ ...f, notes: e.target.value }))}
                placeholder="Junto a la pista..."
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowNewTable(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreateTable} className="btn-primary">Crear mesa</button>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {tables.length === 0 && !showNewTable && (
        <div className="card text-center py-12 space-y-3">
          <div className="text-5xl">🪑</div>
          <p className="text-stone-500 font-medium">Sin mesas configuradas</p>
          <p className="text-stone-400 text-sm">
            Descarga la{' '}
            <span className="font-medium text-emerald-600">plantilla Excel</span>,
            rellénala con las mesas e invitados y luego{' '}
            <span className="font-medium text-blue-600">impórtala</span> para crearlos todos de golpe.
          </p>
        </div>
      )}

      {/* Lista de mesas */}
      <div className="space-y-4">
        {tables.map(table => {
          // Conteo real: "Maria y Jose" cuenta como 2 personas
          const realGuestCount = realCount(table);
          const occupancy = table.capacity
            ? Math.round((realGuestCount / table.capacity) * 100)
            : null;

          return (
            <div key={table.id} className={`card ${table.allergiesCount > 0 ? 'border-amber-200' : ''}`}>
              {/* Cabecera mesa */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-stone-900">{table.name}</h4>
                    {table.allergiesCount > 0 && (
                      <span className="badge bg-amber-100 text-amber-700">
                        ⚠ {table.allergiesCount} alergia{table.allergiesCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {table.notes && (
                      <span className="text-xs text-stone-400 italic">{table.notes}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-stone-500">
                      {realGuestCount}{table.capacity ? `/${table.capacity}` : ''}{' '}
                      invitado{realGuestCount !== 1 ? 's' : ''}
                    </span>
                    {occupancy !== null && (
                      <div className="w-20 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            occupancy >= 100 ? 'bg-red-500'
                            : occupancy >= 80  ? 'bg-amber-500'
                            : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(occupancy, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTable(table.id, table.name)}
                  className="text-stone-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Invitados */}
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
                              {g.diet && (
                                <span className="badge bg-violet-100 text-violet-700 text-[10px]">
                                  {g.diet.replace('_', ' ')}
                                </span>
                              )}
                              {g.allergies &&
                                g.allergies.split(',').filter(Boolean).map((a, idx) => (
                                  <span
                                    key={a}
                                    className={`badge text-[10px] ${ALLERGEN_BADGE_COLORS[idx % ALLERGEN_BADGE_COLORS.length]}`}
                                  >
                                    ⚠ {ALLERGEN_LABELS_MAP[a] || a}
                                  </span>
                                ))}
                              {g.observations && (
                                <span className="text-[10px] text-stone-400 italic ml-1">
                                  {g.observations}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-none ml-2">
                            <button
                              onClick={() => startEditGuest(g, table.id)}
                              className="p-1 rounded-lg text-stone-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                              title="Editar invitado"
                            >
                              <Edit2 size={12} />
                            </button>
                            {tables.filter(t => t.id !== table.id).length > 0 && (
                              <select
                                className="text-xs border border-stone-200 rounded-lg px-1.5 py-1 text-stone-500 bg-white cursor-pointer"
                                defaultValue=""
                                onChange={e => {
                                  if (e.target.value) {
                                    handleMoveGuest(table.id, g.id, parseInt(e.target.value));
                                  }
                                  e.target.value = '';
                                }}
                              >
                                <option value="" disabled>Mover ↗</option>
                                {tables
                                  .filter(t => t.id !== table.id)
                                  .map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                              </select>
                            )}
                            <button
                              onClick={() => handleDeleteGuest(table.id, g.id)}
                              className="text-stone-300 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                            >
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
                            <button
                              onClick={() => setEditingGuest(null)}
                              className="text-stone-400 hover:text-stone-600"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <input
                            className="input text-sm"
                            placeholder="Nombre *"
                            value={editGuestForm.guestName}
                            onChange={e => setEditGuestForm(f => ({ ...f, guestName: e.target.value }))}
                          />
                          <select
                            className="input text-sm"
                            value={editGuestForm.diet}
                            onChange={e => setEditGuestForm(f => ({ ...f, diet: e.target.value }))}
                          >
                            <option value="">Sin dieta especial</option>
                            {DIET_OPTS.map(d => (
                              <option key={d} value={d}>{d.replace('_', ' ')}</option>
                            ))}
                          </select>
                          <div>
                            <label className="label text-[10px] mb-1 block">Alérgenos</label>
                            <div className="flex flex-wrap gap-1">
                              {ALLERGEN_LIST.map(a => (
                                <button
                                  key={a}
                                  type="button"
                                  onClick={() =>
                                    setEditSelAllergens(p =>
                                      p.includes(a) ? p.filter(x => x !== a) : [...p, a],
                                    )
                                  }
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${
                                    editSelAllergens.includes(a)
                                      ? 'bg-amber-500 text-white border-amber-500'
                                      : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'
                                  }`}
                                >
                                  {ALLERGEN_LABELS_MAP[a]}
                                </button>
                              ))}
                            </div>
                          </div>
                          <input
                            className="input text-sm"
                            placeholder="Observaciones"
                            value={editGuestForm.observations}
                            onChange={e => setEditGuestForm(f => ({ ...f, observations: e.target.value }))}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingGuest(null)}
                              className="btn-secondary flex-1 text-xs py-1.5"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleUpdateGuest}
                              className="btn-primary flex-1 text-xs py-1.5"
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {(!table.guests || table.guests.length === 0) && (
                  <p className="text-xs text-stone-400 italic text-center py-2">
                    Sin invitados asignados
                  </p>
                )}
              </div>

              {/* Añadir invitado */}
              {showAddGuest !== table.id ? (
                <button
                  onClick={() => {
                    setShowAddGuest(table.id);
                    setSelAllergens([]);
                    setGuestForm({ guestName: '', diet: '', observations: '' });
                  }}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-stone-200 rounded-xl text-sm text-stone-500 hover:border-rose-300 hover:text-rose-600 transition-all"
                >
                  + Añadir invitado
                </button>
              ) : (
                <div className="mt-3 p-4 bg-stone-50 rounded-2xl space-y-3">
                  <h5 className="font-semibold text-sm text-stone-900">
                    Nuevo invitado en {table.name}
                  </h5>
                  <input
                    className="input"
                    placeholder="Nombre *"
                    value={guestForm.guestName}
                    onChange={e => setGuestForm(f => ({ ...f, guestName: e.target.value }))}
                  />
                  <select
                    className="input"
                    value={guestForm.diet}
                    onChange={e => setGuestForm(f => ({ ...f, diet: e.target.value }))}
                  >
                    <option value="">Sin dieta especial</option>
                    {DIET_OPTS.map(d => (
                      <option key={d} value={d}>{d.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <div>
                    <label className="label text-xs mb-1 block">Alérgenos</label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALLERGEN_LIST.map(a => (
                        <button
                          key={a}
                          type="button"
                          onClick={() =>
                            setSelAllergens(p =>
                              p.includes(a) ? p.filter(x => x !== a) : [...p, a],
                            )
                          }
                          className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            selAllergens.includes(a)
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'
                          }`}
                        >
                          {ALLERGEN_LABELS_MAP[a]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    className="input"
                    placeholder="Observaciones"
                    value={guestForm.observations}
                    onChange={e => setGuestForm(f => ({ ...f, observations: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddGuest(null)}
                      className="btn-secondary flex-1 text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleAddGuest(table.id)}
                      className="btn-primary flex-1 text-sm"
                    >
                      Guardar
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
}

