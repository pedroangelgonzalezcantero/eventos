import { useEffect, useRef, useCallback } from 'react';
import {
  Save, Trash2, Grid, ZoomIn, ZoomOut,
  Download, RotateCcw, Plus,
} from 'lucide-react';
import useFloorEditorStore from '../../store/floorEditorStore';
import { useFloorEditor } from './useFloorEditor';
import FloorEditorCanvas from './FloorEditorCanvas';
import FloorEditorSidebar from './FloorEditorSidebar';
import FloorEditorPropertiesPanel from './FloorEditorPropertiesPanel';

export default function FloorEditor({ eventId }) {
  const {
    planName, isDirty, zoom, showGrid, selectedId, elements,
    canvasWidth, canvasHeight,
    setPlanName, setZoom, setPan, setShowGrid,
    removeElement, addElement, resetStore,
  } = useFloorEditorStore();

  const { loadPlan, savePlan, deletePlan } = useFloorEditor(eventId);
  const dragDataRef = useRef(null);

  // Load plan on mount; reset on unmount
  useEffect(() => {
    loadPlan();
    return () => resetStore();
  }, [eventId]);

  // Keyboard shortcut: Delete/Backspace removes selected element
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') &&
          selectedId &&
          !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        removeElement(selectedId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  // Export canvas as PNG
  const handleExportPng = useCallback(() => {
    const canvas = document.querySelector('.konvajs-content canvas');
    if (!canvas) return;
    const uri  = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `plano-${eventId}.png`;
    link.href     = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [eventId]);

  const handleClear = async () => {
    if (!confirm('¿Eliminar el plano interactivo y todos sus elementos?')) return;
    await deletePlan();
  };

  // Center canvas in viewport
  const handleResetView = () => {
    setZoom(0.8);
    setPan(24, 24);
  };

  // Quick-add from sidebar click (centers element in canvas)
  const handleSidebarAdd = (item) => {
    addElement({ ...item, x: canvasWidth / 2, y: canvasHeight / 2 });
  };

  // Stats
  const tableCount = elements.filter(e => e.type === 'table').length;
  const totalPax   = elements
    .filter(e => e.type === 'table')
    .reduce((s, e) => s + (e.capacity || 0), 0);

  return (
    <div
      className="flex flex-col border border-stone-200 rounded-2xl overflow-hidden bg-white"
      style={{ height: '700px' }}
    >
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border-b border-stone-200
                      flex-none flex-wrap gap-y-1.5">

        {/* Plan name */}
        <input
          type="text"
          value={planName}
          onChange={e => setPlanName(e.target.value)}
          className="px-2 py-1.5 text-sm font-medium border border-stone-200 rounded-lg bg-white
                     focus:outline-none focus:ring-1 focus:ring-emerald-400 w-44"
          maxLength={80}
          placeholder="Nombre del plano"
        />

        <div className="w-px h-5 bg-stone-200" />

        {/* Zoom controls */}
        <button
          onClick={() => setZoom(zoom / 1.2)}
          title="Alejar (o rueda ↓)"
          className="p-1.5 rounded-lg hover:bg-stone-200 transition-colors"
        >
          <ZoomOut size={15} className="text-stone-600" />
        </button>
        <span className="text-xs text-stone-500 font-mono w-10 text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(zoom * 1.2)}
          title="Acercar (o rueda ↑)"
          className="p-1.5 rounded-lg hover:bg-stone-200 transition-colors"
        >
          <ZoomIn size={15} className="text-stone-600" />
        </button>
        <button
          onClick={handleResetView}
          title="Restablecer vista"
          className="p-1.5 rounded-lg hover:bg-stone-200 transition-colors"
        >
          <RotateCcw size={15} className="text-stone-600" />
        </button>

        <div className="w-px h-5 bg-stone-200" />

        {/* Grid toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium
                      border transition-colors ${
            showGrid
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-stone-200 bg-white text-stone-500 hover:bg-stone-100'
          }`}
        >
          <Grid size={13} /> Grid
        </button>

        {/* Quick add table */}
        <button
          onClick={() => addElement({ type: 'table', shape: 'rect',
                                      x: canvasWidth / 2, y: canvasHeight / 2 })}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium
                     border border-stone-200 bg-white text-stone-600 hover:bg-stone-100
                     transition-colors"
        >
          <Plus size={13} /> Mesa rápida
        </button>

        <div className="flex-1" />

        {/* Dirty indicator */}
        {isDirty && (
          <span className="text-[11px] text-amber-600 font-semibold animate-pulse select-none">
            ● Sin guardar
          </span>
        )}

        {/* Export PNG */}
        <button
          onClick={handleExportPng}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                     border border-stone-200 bg-white text-stone-600 hover:bg-stone-100
                     transition-colors"
        >
          <Download size={13} /> Exportar PNG
        </button>

        {/* Clear */}
        {elements.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                       border border-red-200 bg-red-50 text-red-600 hover:bg-red-100
                       transition-colors"
          >
            <Trash2 size={13} /> Limpiar
          </button>
        )}

        {/* Save */}
        <button
          onClick={savePlan}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                      border transition-colors ${
            isDirty
              ? 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          <Save size={13} /> Guardar
        </button>
      </div>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar palette */}
        <FloorEditorSidebar dragDataRef={dragDataRef} onAdd={handleSidebarAdd} />

        {/* Konva canvas */}
        <FloorEditorCanvas dragDataRef={dragDataRef} />

        {/* Properties panel */}
        <FloorEditorPropertiesPanel />
      </div>

      {/* ── Status bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-3 py-1.5 bg-stone-50 border-t border-stone-200
                      text-[11px] text-stone-400 flex-none select-none">
        <span className="font-medium text-stone-500">{elements.length} elementos</span>
        <span>·</span>
        <span>{tableCount} mesas</span>
        <span>·</span>
        <span>{totalPax} pax total</span>
        <span className="ml-auto hidden sm:block">
          Rueda = zoom · Arrastrar fondo = pan · Supr = eliminar selección
        </span>
      </div>
    </div>
  );
}

