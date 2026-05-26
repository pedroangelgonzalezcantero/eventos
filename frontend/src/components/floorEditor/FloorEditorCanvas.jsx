import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Stage, Layer, Rect, Circle, Ellipse,
  Text, Group, Transformer, Line,
} from 'react-konva';
import useFloorEditorStore from '../../store/floorEditorStore';

const GRID_SIZE = 20;
const SNAP_SIZE = 20;

// ── Grid de fondo ────────────────────────────────────────────────────────────
function GridBackground({ canvasWidth, canvasHeight }) {
  const lines = [];
  for (let x = 0; x <= canvasWidth; x += GRID_SIZE) {
    lines.push(
      <Line key={`v${x}`} points={[x, 0, x, canvasHeight]}
        stroke="#e5e7eb" strokeWidth={0.5} listening={false} />
    );
  }
  for (let y = 0; y <= canvasHeight; y += GRID_SIZE) {
    lines.push(
      <Line key={`h${y}`} points={[0, y, canvasWidth, y]}
        stroke="#e5e7eb" strokeWidth={0.5} listening={false} />
    );
  }
  return <>{lines}</>;
}

// ── Elemento (mesa u objeto) ─────────────────────────────────────────────────
function FloorElement({ el, isSelected, onSelect, onUpdate, showGrid }) {
  const groupRef = useRef(null);
  const elRef    = useRef(el);
  elRef.current  = el;

  const snap = (v) => (showGrid ? Math.round(v / SNAP_SIZE) * SNAP_SIZE : v);

  const handleDragEnd = (e) => {
    const x = snap(e.target.x());
    const y = snap(e.target.y());
    e.target.position({ x, y });
    onUpdate({ x, y });
  };

  const handleTransformEnd = () => {
    const node   = groupRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    const cur      = elRef.current;
    const newWidth = Math.max(30, cur.width * scaleX);
    onUpdate({
      x:        node.x(),
      y:        node.y(),
      width:    newWidth,
      height:   cur.shape === 'round' ? newWidth : Math.max(30, cur.height * scaleY),
      rotation: node.rotation(),
    });
  };

  const fill   = el.color || '#d1fae5';
  const stroke = isSelected ? '#059669' : '#94a3b8';
  const sw     = isSelected ? 2.5 : 1;
  // Bounding width/height used for text centering
  const bw = el.width;
  const bh = el.shape === 'round' ? el.width : el.height;

  return (
    <Group
      id={el.id}
      ref={groupRef}
      x={el.x}
      y={el.y}
      rotation={el.rotation || 0}
      draggable={!el.locked}
      onClick={(e)  => { e.cancelBubble = true; onSelect(el.id); }}
      onTap={(e)    => { e.cancelBubble = true; onSelect(el.id); }}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      {/* ── Shape ── */}
      {el.shape === 'round' && (
        <Circle
          radius={bw / 2}
          fill={fill} stroke={stroke} strokeWidth={sw}
        />
      )}
      {el.shape === 'oval' && (
        <Ellipse
          radiusX={bw / 2} radiusY={bh / 2}
          fill={fill} stroke={stroke} strokeWidth={sw}
        />
      )}
      {(el.shape === 'rect' || !el.shape) && (
        <Rect
          x={-bw / 2} y={-bh / 2}
          width={bw} height={bh}
          fill={fill} stroke={stroke} strokeWidth={sw}
          cornerRadius={6}
        />
      )}

      {/* ── Label ── */}
      <Text
        text={el.label || ''}
        fontSize={13} fontStyle="bold" fill="#1f2937"
        width={bw} align="center"
        x={-bw / 2}
        y={el.capacity > 0 && el.type === 'table' ? -11 : -7}
        listening={false}
      />

      {/* ── Capacity (tables only) ── */}
      {el.type === 'table' && el.capacity > 0 && (
        <Text
          text={`${el.capacity} p`}
          fontSize={10} fill="#6b7280"
          width={bw} align="center"
          x={-bw / 2} y={4}
          listening={false}
        />
      )}

      {/* ── Lock icon ── */}
      {el.locked && (
        <Text
          text="🔒" fontSize={10}
          x={bw / 2 - 16}
          y={el.shape === 'round' ? -bw / 2 + 2 : -bh / 2 + 2}
          listening={false}
        />
      )}
    </Group>
  );
}

// ── Canvas principal ─────────────────────────────────────────────────────────
export default function FloorEditorCanvas({ dragDataRef }) {
  const {
    elements, selectedId, zoom, panX, panY, showGrid,
    canvasWidth, canvasHeight,
    setSelectedId, updateElement, setZoom, setPan, addElement,
  } = useFloorEditorStore();

  const stageRef     = useRef(null);
  const trRef        = useRef(null);
  const containerRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  // Resize stage when container changes size
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        setStageSize({
          width:  containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    });
    ro.observe(containerRef.current);
    setStageSize({
      width:  containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
    });
    return () => ro.disconnect();
  }, []);

  // Attach / detach Transformer
  useEffect(() => {
    if (!trRef.current || !stageRef.current) return;
    if (selectedId) {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer()?.batchDraw();
      }
    } else {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, elements]);

  // Wheel zoom
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    const stage    = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer  = stage.getPointerPosition();
    const factor   = 1.06;
    const newScale = e.evt.deltaY < 0
      ? Math.min(4,   oldScale * factor)
      : Math.max(0.1, oldScale / factor);
    setZoom(newScale);
    setPan(
      pointer.x - (pointer.x - stage.x()) * (newScale / oldScale),
      pointer.y - (pointer.y - stage.y()) * (newScale / oldScale),
    );
  }, []);

  // Drop from sidebar
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const data = dragDataRef.current;
    if (!data) return;
    dragDataRef.current = null;

    const stage = stageRef.current;
    if (!stage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x    = (e.clientX - rect.left  - stage.x()) / stage.scaleX();
    const y    = (e.clientY - rect.top   - stage.y()) / stage.scaleY();
    addElement({ ...data, x, y });
  }, []);

  const selectedEl = elements.find(e => e.id === selectedId);
  const keepRatio  = selectedEl?.shape === 'round';

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-stone-300 cursor-default"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={zoom}
        scaleY={zoom}
        x={panX}
        y={panY}
        draggable={!selectedId}
        onWheel={handleWheel}
        onClick={(e) => { if (e.target === e.target.getStage()) setSelectedId(null); }}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setPan(e.target.x(), e.target.y());
          }
        }}
      >
        <Layer>
          {/* Canvas background */}
          <Rect
            x={0} y={0}
            width={canvasWidth} height={canvasHeight}
            fill="white"
            shadowColor="rgba(0,0,0,0.18)"
            shadowBlur={14}
            shadowOffset={{ x: 2, y: 2 }}
            listening={false}
          />

          {/* Grid */}
          {showGrid && (
            <GridBackground canvasWidth={canvasWidth} canvasHeight={canvasHeight} />
          )}

          {/* Elements */}
          {elements.map(el => (
            <FloorElement
              key={el.id}
              el={el}
              isSelected={selectedId === el.id}
              onSelect={setSelectedId}
              onUpdate={(changes) => updateElement(el.id, changes)}
              showGrid={showGrid}
            />
          ))}

          {/* Transformer */}
          <Transformer
            ref={trRef}
            keepRatio={keepRatio}
            enabledAnchors={
              keepRatio
                ? ['top-left', 'top-right', 'bottom-left', 'bottom-right']
                : undefined
            }
            rotateEnabled={!selectedEl?.locked}
            resizeEnabled={!selectedEl?.locked}
            borderStroke="#059669"
            anchorStroke="#059669"
            anchorFill="white"
            anchorSize={9}
            anchorCornerRadius={3}
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < 30 || newBox.height < 30 ? oldBox : newBox
            }
          />
        </Layer>
      </Stage>
    </div>
  );
}

