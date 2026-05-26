import useFloorEditorStore from '../../store/floorEditorStore';

const PRESET_COLORS = [
  '#d1fae5', '#dbeafe', '#fef3c7', '#ede9fe', '#fce7f3',
  '#ecfdf5', '#f0f9ff', '#e0f2fe', '#fee2e2', '#fef9c3',
  '#f3f4f6', '#e5e7eb',
];

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function FloorEditorPropertiesPanel() {
  const {
    elements, selectedId,
    updateElement, removeElement, duplicateElement, moveUp, moveDown,
  } = useFloorEditorStore();

  const el = elements.find(e => e.id === selectedId);

  if (!el) {
    return (
      <div className="w-52 flex-none border-l border-stone-200 bg-white flex flex-col
                      items-center justify-center p-4">
        <div className="text-3xl mb-3 opacity-30">🖱️</div>
        <p className="text-xs text-stone-400 text-center leading-relaxed">
          Selecciona un elemento del canvas para editar sus propiedades.
        </p>
      </div>
    );
  }

  const upd = (changes) => updateElement(el.id, changes);
  const input = 'w-full px-2 py-1.5 text-xs border border-stone-200 rounded-lg bg-white ' +
                'focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-colors';

  return (
    <div className="w-52 flex-none border-l border-stone-200 bg-white overflow-y-auto">
      <div className="p-3 space-y-3">

        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-stone-600 uppercase tracking-wide">Propiedades</p>
          <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-mono">
            {el.type} · {el.shape}
          </span>
        </div>

        {/* Label */}
        <Field label="Etiqueta">
          <input
            type="text"
            value={el.label || ''}
            onChange={e => upd({ label: e.target.value })}
            className={input}
            maxLength={30}
          />
        </Field>

        {/* Capacity — tables only */}
        {el.type === 'table' && (
          <Field label="Capacidad (pax)">
            <input
              type="number"
              min={0} max={999}
              value={el.capacity ?? 0}
              onChange={e => upd({ capacity: Math.max(0, parseInt(e.target.value) || 0) })}
              className={input}
            />
          </Field>
        )}

        {/* Width */}
        <Field label="Ancho (px)">
          <input
            type="number"
            min={30} max={800}
            value={Math.round(el.width)}
            onChange={e => {
              const w = Math.max(30, parseInt(e.target.value) || 30);
              upd({ width: w, height: el.shape === 'round' ? w : el.height });
            }}
            className={input}
          />
        </Field>

        {/* Height — hidden for round */}
        {el.shape !== 'round' && (
          <Field label="Alto (px)">
            <input
              type="number"
              min={30} max={800}
              value={Math.round(el.height)}
              onChange={e => upd({ height: Math.max(30, parseInt(e.target.value) || 30) })}
              className={input}
            />
          </Field>
        )}

        {/* Rotation */}
        <Field label={`Rotación · ${Math.round(el.rotation || 0)}°`}>
          <input
            type="range"
            min={-180} max={180} step={1}
            value={el.rotation || 0}
            onChange={e => upd({ rotation: parseFloat(e.target.value) })}
            className="w-full accent-emerald-600 cursor-pointer"
          />
        </Field>

        {/* Color */}
        <Field label="Color de fondo">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                onClick={() => upd({ color: c })}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-md border-2 transition-all ${
                  el.color === c
                    ? 'border-emerald-500 scale-110 shadow-sm'
                    : 'border-stone-200 hover:scale-105'
                }`}
              />
            ))}
          </div>
          <input
            type="color"
            value={el.color || '#d1fae5'}
            onChange={e => upd({ color: e.target.value })}
            className="w-full h-8 rounded-lg border border-stone-200 cursor-pointer p-0.5"
          />
        </Field>

        {/* Locked */}
        <Field label="Estado">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={el.locked || false}
              onChange={e => upd({ locked: e.target.checked })}
              className="w-3.5 h-3.5 accent-emerald-600"
            />
            <span className="text-xs text-stone-600">🔒 Bloqueado (no mover)</span>
          </label>
        </Field>

        {/* Actions */}
        <div className="pt-2 border-t border-stone-100 space-y-1.5">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Acciones</p>

          <button
            onClick={() => duplicateElement(el.id)}
            className="w-full px-2 py-1.5 text-xs font-medium rounded-lg border border-stone-200
                       bg-stone-50 hover:bg-stone-100 text-stone-600 transition-colors text-left"
          >
            ⧉  Duplicar elemento
          </button>

          <div className="flex gap-1">
            <button onClick={() => moveDown(el.id)}
              title="Enviar atrás"
              className="flex-1 px-1 py-1.5 text-xs font-medium rounded-lg border border-stone-200
                         bg-stone-50 hover:bg-stone-100 text-stone-600 transition-colors text-center">
              ↓ Atrás
            </button>
            <button onClick={() => moveUp(el.id)}
              title="Traer adelante"
              className="flex-1 px-1 py-1.5 text-xs font-medium rounded-lg border border-stone-200
                         bg-stone-50 hover:bg-stone-100 text-stone-600 transition-colors text-center">
              ↑ Delante
            </button>
          </div>

          <button
            onClick={() => removeElement(el.id)}
            className="w-full px-2 py-1.5 text-xs font-medium rounded-lg border border-red-200
                       bg-red-50 hover:bg-red-100 text-red-600 transition-colors text-left"
          >
            🗑  Eliminar elemento
          </button>
        </div>

        {/* Debug info */}
        <div className="pt-1 border-t border-stone-100">
          <p className="text-[10px] text-stone-300 font-mono leading-relaxed">
            x:{Math.round(el.x)}  y:{Math.round(el.y)}<br />
            w:{Math.round(el.width)}  h:{Math.round(el.height)}
          </p>
        </div>

      </div>
    </div>
  );
}

