import { create } from 'zustand';

const genId = () => `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

const DEFAULT_SIZES = {
  round: { width: 90,  height: 90  },
  rect:  { width: 130, height: 80  },
  oval:  { width: 130, height: 90  },
};

const DEFAULT_COLORS = {
  table:    '#d1fae5',
  bar:      '#fef3c7',
  dance:    '#ede9fe',
  photo:    '#fce7f3',
  stage:    '#ecfdf5',
  entrance: '#f0f9ff',
  fountain: '#e0f2fe',
  object:   '#dbeafe',
};

const useFloorEditorStore = create((set, get) => ({
  // ── Metadata ──────────────────────────────────────────────────────────────
  planId:      null,
  planName:    'Plano interactivo',
  canvasWidth: 1200,
  canvasHeight:800,

  // ── Elements ──────────────────────────────────────────────────────────────
  elements:   [],
  selectedId: null,

  // ── Canvas state ──────────────────────────────────────────────────────────
  zoom: 1,
  panX: 0,
  panY: 0,

  // ── UI ────────────────────────────────────────────────────────────────────
  showGrid: true,
  isDirty:  false,

  // ── Metadata actions ──────────────────────────────────────────────────────
  setPlanMeta: (meta) => set({
    planId:       meta.id,
    planName:     meta.name        || 'Plano interactivo',
    canvasWidth:  meta.canvasWidth  || 1200,
    canvasHeight: meta.canvasHeight || 800,
  }),
  setPlanName: (name) => set({ planName: name, isDirty: true }),

  // ── Element actions ───────────────────────────────────────────────────────
  setElements:  (elements) => set({ elements }),
  setSelectedId:(id)       => set({ selectedId: id }),

  addElement: ({ type, shape, objType, label, color, x, y }) => {
    const size  = DEFAULT_SIZES[shape] || DEFAULT_SIZES.rect;
    const count = get().elements.filter(e => e.type === 'table').length;
    const defaultLabel = type === 'table' ? `M${count + 1}` : (label || 'Elemento');
    const defaultColor = type === 'table'
      ? DEFAULT_COLORS.table
      : (color || DEFAULT_COLORS[objType] || DEFAULT_COLORS.object);

    const newEl = {
      id:       genId(),
      type,
      shape:    shape   || 'rect',
      objType:  objType || null,
      x:        x       ?? 300,
      y:        y       ?? 200,
      width:    size.width,
      height:   size.height,
      rotation: 0,
      label:    defaultLabel,
      capacity: type === 'table' ? 8 : 0,
      locked:   false,
      color:    defaultColor,
    };
    set(state => ({ elements: [...state.elements, newEl], selectedId: newEl.id, isDirty: true }));
  },

  updateElement: (id, changes) => set(state => ({
    elements: state.elements.map(el => el.id === id ? { ...el, ...changes } : el),
    isDirty:  true,
  })),

  removeElement: (id) => set(state => ({
    elements:   state.elements.filter(el => el.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId,
    isDirty:    true,
  })),

  duplicateElement: (id) => {
    const el = get().elements.find(e => e.id === id);
    if (!el) return;
    const newEl = { ...el, id: genId(), x: el.x + 25, y: el.y + 25 };
    set(state => ({ elements: [...state.elements, newEl], selectedId: newEl.id, isDirty: true }));
  },

  moveUp: (id) => set(state => {
    const idx = state.elements.findIndex(e => e.id === id);
    if (idx < 0 || idx >= state.elements.length - 1) return state;
    const els = [...state.elements];
    [els[idx], els[idx + 1]] = [els[idx + 1], els[idx]];
    return { elements: els, isDirty: true };
  }),

  moveDown: (id) => set(state => {
    const idx = state.elements.findIndex(e => e.id === id);
    if (idx <= 0) return state;
    const els = [...state.elements];
    [els[idx], els[idx - 1]] = [els[idx - 1], els[idx]];
    return { elements: els, isDirty: true };
  }),

  // ── Canvas state ──────────────────────────────────────────────────────────
  setZoom:     (zoom)       => set({ zoom: Math.max(0.1, Math.min(4, zoom)) }),
  setPan:      (panX, panY) => set({ panX, panY }),
  setShowGrid: (v)          => set({ showGrid: v }),

  markSaved: () => set({ isDirty: false }),

  resetStore: () => set({
    planId: null, planName: 'Plano interactivo',
    elements: [], selectedId: null,
    zoom: 1, panX: 0, panY: 0,
    isDirty: false,
  }),
}));

export default useFloorEditorStore;

