const PALETTE = [
  {
    group: 'Mesas',
    items: [
      { type: 'table', shape: 'round', label: 'Redonda',     icon: '⭕', hint: 'Ø 90 px' },
      { type: 'table', shape: 'rect',  label: 'Rectangular', icon: '⬜', hint: '130 × 80' },
      { type: 'table', shape: 'oval',  label: 'Ovalada',     icon: '🟣', hint: '130 × 90' },
    ],
  },
  {
    group: 'Elementos',
    items: [
      { type: 'object', shape: 'rect', objType: 'bar',      label: 'Barra',       icon: '🍺', color: '#fef3c7' },
      { type: 'object', shape: 'rect', objType: 'dance',    label: 'Pista baile', icon: '💃', color: '#ede9fe' },
      { type: 'object', shape: 'rect', objType: 'photo',    label: 'Photocall',   icon: '📸', color: '#fce7f3' },
      { type: 'object', shape: 'rect', objType: 'stage',    label: 'Escenario',   icon: '🎭', color: '#d1fae5' },
      { type: 'object', shape: 'rect', objType: 'entrance', label: 'Entrada',     icon: '🚪', color: '#f0f9ff' },
      { type: 'object', shape: 'oval', objType: 'fountain', label: 'Fuente',      icon: '⛲', color: '#e0f2fe' },
    ],
  },
];

export default function FloorEditorSidebar({ dragDataRef, onAdd }) {
  return (
    <div className="w-44 flex-none border-r border-stone-200 bg-white overflow-y-auto select-none">
      <div className="p-3 space-y-4">
        {PALETTE.map(group => (
          <div key={group.group}>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 px-1">
              {group.group}
            </p>
            <div className="space-y-1">
              {group.items.map(item => {
                const key = `${item.type}-${item.shape}-${item.objType || ''}`;
                return (
                  <div
                    key={key}
                    draggable
                    onDragStart={() => { dragDataRef.current = item; }}
                    onClick={() => onAdd(item)}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg border border-stone-200
                               bg-stone-50 hover:border-emerald-300 hover:bg-emerald-50
                               cursor-grab active:cursor-grabbing transition-colors text-sm"
                  >
                    <span className="text-base leading-none">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-700 text-xs leading-tight truncate">
                        {item.label}
                      </p>
                      {item.hint && (
                        <p className="text-[10px] text-stone-400 leading-tight">{item.hint}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-[10px] text-amber-700 leading-snug">
            💡 <strong>Arrastra</strong> al canvas o <strong>haz clic</strong> para añadir en el centro.
          </p>
        </div>
      </div>
    </div>
  );
}

