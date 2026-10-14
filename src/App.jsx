import React, { useState, useRef } from 'react';
import {
  Folder, Play, RotateCcw, Shirt, Share2, Save,
  Undo2, Redo2, Trash2, PenTool, X, ChevronRight, Eraser
} from 'lucide-react';

const TACTICAL_SYSTEMS = {
  '4-3-3': [
    { number: '1', role: 'GK', x: 34, y: 96, team: 'blue' },
    { number: '4', role: 'CB', x: 23, y: 82, team: 'blue' },
    { number: '3', role: 'CB', x: 45, y: 82, team: 'blue' },
    { number: '2', role: 'RB', x: 10, y: 74, team: 'blue' },
    { number: '5', role: 'LB', x: 58, y: 74, team: 'blue' },
    { number: '6', role: 'CDM', x: 34, y: 64, team: 'blue' },
    { number: '8', role: 'CM', x: 22, y: 52, team: 'blue' },
    { number: '10', role: 'CAM', x: 46, y: 52, team: 'blue' },
    { number: '7', role: 'RW', x: 12, y: 32, team: 'blue' },
    { number: '11', role: 'LW', x: 56, y: 32, team: 'blue' },
    { number: '9', role: 'ST', x: 34, y: 24, team: 'blue' },
  ],
  '4-4-2': [
    { number: '1', role: 'GK', x: 34, y: 96, team: 'blue' },
    { number: '4', role: 'CB', x: 23, y: 82, team: 'blue' },
    { number: '3', role: 'CB', x: 45, y: 82, team: 'blue' },
    { number: '2', role: 'RB', x: 10, y: 74, team: 'blue' },
    { number: '5', role: 'LB', x: 58, y: 74, team: 'blue' },
    { number: '6', role: 'CM', x: 24, y: 56, team: 'blue' },
    { number: '8', role: 'CM', x: 44, y: 56, team: 'blue' },
    { number: '7', role: 'RM', x: 10, y: 48, team: 'blue' },
    { number: '11', role: 'LM', x: 58, y: 48, team: 'blue' },
    { number: '9', role: 'ST', x: 26, y: 26, team: 'blue' },
    { number: '10', role: 'ST', x: 42, y: 26, team: 'blue' },
  ],
  '3-5-2': [
    { number: '1', role: 'GK', x: 34, y: 96, team: 'blue' },
    { number: '2', role: 'CB', x: 18, y: 82, team: 'blue' },
    { number: '4', role: 'CB', x: 34, y: 83, team: 'blue' },
    { number: '3', role: 'CB', x: 50, y: 82, team: 'blue' },
    { number: '6', role: 'CDM', x: 34, y: 66, team: 'blue' },
    { number: '8', role: 'CM', x: 23, y: 54, team: 'blue' },
    { number: '10', role: 'CM', x: 45, y: 54, team: 'blue' },
    { number: '7', role: 'RWB', x: 8, y: 48, team: 'blue' },
    { number: '11', role: 'LWB', x: 60, y: 48, team: 'blue' },
    { number: '9', role: 'ST', x: 26, y: 26, team: 'blue' },
    { number: '19', role: 'ST', x: 42, y: 26, team: 'blue' },
  ]
};

function SoccerBall({ x, y, onPointerDown }) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onPointerDown={onPointerDown}
      className="cursor-grab active:cursor-grabbing touch-none select-none"
    >
      <circle r="2.9" fill="rgba(0,0,0,0.3)" transform="translate(0.3, 0.4)" />
      <circle r="2.6" fill="#f8fafc" stroke="#0f172a" strokeWidth="0.4" />
      <polygon points="0,-0.9 0.85,-0.28 0.53,0.73 -0.53,0.73 -0.85,-0.28" fill="#0f172a" />
      <polygon points="0,-1.7 0.6,-2.3 -0.6,-2.3" fill="#0f172a" />
      <polygon points="1.7,-0.6 2.4,-0.8 2.1,-0.1" fill="#0f172a" />
      <polygon points="1.2,1.6 1.8,1.9 1.5,2.4" fill="#0f172a" />
      <polygon points="-1.2,1.6 -1.5,2.4 -1.8,1.9" fill="#0f172a" />
      <polygon points="-1.7,-0.6 -2.1,-0.1 -2.4,-0.8" fill="#0f172a" />
      <line x1="0" y1="-0.9" x2="0" y2="-1.7" stroke="#0f172a" strokeWidth="0.25" />
      <line x1="0.85" y1="-0.28" x2="1.7" y2="-0.6" stroke="#0f172a" strokeWidth="0.25" />
      <line x1="0.53" y1="0.73" x2="1.2" y2="1.6" stroke="#0f172a" strokeWidth="0.25" />
      <line x1="-0.53" y1="0.73" x2="-1.2" y2="1.6" stroke="#0f172a" strokeWidth="0.25" />
      <line x1="-0.85" y1="-0.28" x2="-1.7" y2="-0.6" stroke="#0f172a" strokeWidth="0.25" />
    </g>
  );
}

function TrainingMaterial({ obj, onPointerDown }) {
  if (obj.type === 'mini_goal') {
    return (
      <g transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={onPointerDown} className="cursor-grab touch-none select-none">
        <rect x="-4.2" y="-2.2" width="8.4" height="4.4" fill="rgba(0,0,0,0.2)" rx="0.5" transform="translate(0.3, 0.4)" />
        <rect x="-4.2" y="-2.2" width="8.4" height="4.4" fill="rgba(255,255,255,0.25)" stroke="#eab308" strokeWidth="0.7" rx="0.4" />
        <line x1="-4.2" y1="-0.7" x2="4.2" y2="-0.7" stroke="#ffffff" strokeWidth="0.25" strokeDasharray="0.8,0.8" />
        <line x1="-4.2" y1="0.7" x2="4.2" y2="0.7" stroke="#ffffff" strokeWidth="0.25" strokeDasharray="0.8,0.8" />
        <line x1="-2.1" y1="-2.2" x2="-2.1" y2="2.2" stroke="#ffffff" strokeWidth="0.25" strokeDasharray="0.8,0.8" />
        <line x1="0" y1="-2.2" x2="0" y2="2.2" stroke="#ffffff" strokeWidth="0.25" strokeDasharray="0.8,0.8" />
        <line x1="2.1" y1="-2.2" x2="2.1" y2="2.2" stroke="#ffffff" strokeWidth="0.25" strokeDasharray="0.8,0.8" />
        <rect x="-4.2" y="1.8" width="8.4" height="0.6" fill="#ca8a04" />
      </g>
    );
  }

  if (obj.type === 'ladder') {
    return (
      <g transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={onPointerDown} className="cursor-grab touch-none select-none">
        <rect x="-2.2" y="-7.2" width="4.4" height="14.4" fill="rgba(0,0,0,0.25)" rx="0.3" transform="translate(0.3, 0.3)" />
        <line x1="-2.2" y1="-7.2" x2="-2.2" y2="7.2" stroke="#0f172a" strokeWidth="0.6" />
        <line x1="2.2" y1="-7.2" x2="2.2" y2="7.2" stroke="#0f172a" strokeWidth="0.6" />
        {[-5.4, -3.6, -1.8, 0, 1.8, 3.6, 5.4].map((step) => (
          <line key={step} x1="-2.2" y1={step} x2="2.2" y2={step} stroke="#facc15" strokeWidth="0.7" />
        ))}
      </g>
    );
  }

  if (obj.type === 'dummy') {
    return (
      <g transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={onPointerDown} className="cursor-grab touch-none select-none">
        <ellipse cx="0" cy="4.2" rx="2" ry="0.8" fill="rgba(0,0,0,0.3)" />
        <circle cx="0" cy="-3.6" r="1.3" fill="#eab308" stroke="#ca8a04" strokeWidth="0.3" />
        <path d="M -2.2 -2.1 Q 0 -2.6 2.2 -2.1 L 1.8 2.2 Q 0 2.5 -1.8 2.2 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="0.35" />
        <line x1="-1.1" y1="2.2" x2="-1.1" y2="4.2" stroke="#0f172a" strokeWidth="0.5" />
        <line x1="1.1" y1="2.2" x2="1.1" y2="4.2" stroke="#0f172a" strokeWidth="0.5" />
      </g>
    );
  }

  if (obj.type === 'cone') {
    return (
      <g transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={onPointerDown} className="cursor-grab touch-none select-none">
        <ellipse cx="0" cy="1.6" rx="2.2" ry="0.9" fill="rgba(0,0,0,0.3)" />
        <ellipse cx="0" cy="1.2" rx="2.0" ry="0.7" fill={obj.color || '#ea580c'} />
        <polygon points="-1.6,1.2 1.6,1.2 0,-2.6" fill={obj.color || '#f97316'} stroke="#c2410c" strokeWidth="0.25" />
        <polygon points="-0.8,0.2 0.8,0.2 0,-1.4" fill="#ffffff" />
      </g>
    );
  }

  if (obj.type === 'saucer') {
    return (
      <g transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={onPointerDown} className="cursor-grab touch-none select-none">
        <ellipse cx="0" cy="0.9" rx="2.4" ry="1.1" fill="rgba(0,0,0,0.3)" />
        <ellipse cx="0" cy="0.6" rx="2.2" ry="0.9" fill={obj.color || '#facc15'} stroke="#000" strokeWidth="0.2" />
        <ellipse cx="0" cy="0.3" rx="0.7" ry="0.35" fill="#1e293b" />
      </g>
    );
  }

  if (obj.type === 'ring') {
    return (
      <g transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={onPointerDown} className="cursor-grab touch-none select-none">
        <ellipse cx="0" cy="0.4" rx="3.1" ry="3.1" fill="rgba(0,0,0,0.25)" />
        <circle cx="0" cy="0" r="3.0" fill="none" stroke={obj.color || '#facc15'} strokeWidth="0.7" />
      </g>
    );
  }

  if (obj.type === 'hurdle') {
    return (
      <g transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={onPointerDown} className="cursor-grab touch-none select-none">
        <ellipse cx="0" cy="2.2" rx="3.2" ry="0.7" fill="rgba(0,0,0,0.25)" />
        <line x1="-3" y1="2" x2="-3" y2="-1.8" stroke="#ca8a04" strokeWidth="0.5" />
        <line x1="3" y1="2" x2="3" y2="-1.8" stroke="#ca8a04" strokeWidth="0.5" />
        <rect x="-3.2" y="-2.2" width="6.4" height="0.8" fill="#facc15" stroke="#ca8a04" strokeWidth="0.2" rx="0.2" />
      </g>
    );
  }

  return null;
}

export default function App() {
  const [pitchMode, setPitchMode] = useState('full');
  const [showTrainingMenu, setShowTrainingMenu] = useState(false);
  const [showLineMenu, setShowLineMenu] = useState(false);
  const [showSystemsMenu, setShowSystemsMenu] = useState(false);

  const [tool, setTool] = useState('move'); // 'move', 'draw', 'eraser'
  const [lineType, setLineType] = useState('arrow'); // 'straight', 'arrow', 'dashed-arrow', 'wavy-arrow', 'stop'
  const [lineColor, setLineColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(1.4);

  const [objects, setObjects] = useState([
    ...TACTICAL_SYSTEMS['4-3-3'].map((p) => ({ ...p, id: 'init-' + p.number, type: 'player' })),
    { id: 'ball-1', type: 'ball', x: 34, y: 52.5 }
  ]);
  const [drawings, setDrawings] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);

  const [history, setHistory] = useState([objects]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const svgRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [selectedObj, setSelectedObj] = useState(null);

  const getCoordinates = (e) => {
    if (!svgRef.current) return { x: 34, y: 50 };
    const pt = svgRef.current.createSVGPoint();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    pt.x = clientX;
    pt.y = clientY;
    const cursorPt = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
    const maxX = 68;
    const maxY = pitchMode === 'half' ? 85 : 105;
    return {
      x: Math.max(2, Math.min(maxX - 2, cursorPt.x)),
      y: Math.max(2, Math.min(maxY - 2, cursorPt.y))
    };
  };

  const handlePointerDown = (e, obj) => {
    e.stopPropagation();
    if (tool === 'eraser') {
      const filtered = objects.filter((o) => o.id !== obj.id);
      setObjects(filtered);
      recordHistory(filtered);
      return;
    }
    if (tool !== 'move') return;
    setSelectedObj(obj);
    isDraggingRef.current = true;
  };

  const handleLinePointerDown = (e, lineId) => {
    if (tool === 'eraser') {
      e.stopPropagation();
      setDrawings((prev) => prev.filter((l) => l.id !== lineId));
    }
  };

  const handlePitchPointerDown = (e) => {
    if (tool === 'move' || tool === 'eraser') {
      setSelectedObj(null);
      return;
    }
    const coords = getCoordinates(e);
    setCurrentLine({
      id: Date.now(),
      start: coords,
      end: coords,
      type: lineType,
      color: lineColor,
      width: lineWidth
    });
  };

  const handlePointerMove = (e) => {
    if (isDraggingRef.current && selectedObj) {
      if (e.cancelable) e.preventDefault();
      const coords = getCoordinates(e);
      setObjects((prev) =>
        prev.map((o) => (o.id === selectedObj.id ? { ...o, x: coords.x, y: coords.y } : o))
      );
    } else if (currentLine) {
      if (e.cancelable) e.preventDefault();
      const coords = getCoordinates(e);
      setCurrentLine((prev) => ({ ...prev, end: coords }));
    }
  };

  const recordHistory = (newObjects) => {
    const nextH = history.slice(0, historyIndex + 1);
    nextH.push(JSON.parse(JSON.stringify(newObjects)));
    setHistory(nextH);
    setHistoryIndex(nextH.length - 1);
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      recordHistory(objects);
    }
    if (currentLine) {
      setDrawings((prev) => [...prev, currentLine]);
      setCurrentLine(null);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setObjects(JSON.parse(JSON.stringify(history[prevIdx])));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setObjects(JSON.parse(JSON.stringify(history[nextIdx])));
    }
  };

  const addElement = (itemType, extra = {}) => {
    const id = 'item-' + Date.now();
    const spawnY = pitchMode === 'half' ? 42.5 : 52.5;
    let newItem = { id, type: itemType, x: 34, y: spawnY, ...extra };
    if (itemType === 'player') {
      const count = objects.filter((o) => o.type === 'player' && o.team === (extra.team || 'blue')).length + 1;
      newItem.number = String(extra.number || count);
    }
    const nextObjs = [...objects, newItem];
    setObjects(nextObjs);
    recordHistory(nextObjs);
  };

  const removeLastLineOrAll = () => {
    if (drawings.length === 0) return;
    setDrawings((prev) => prev.slice(0, -1));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Andez Sports FC - Ejercicio Táctico',
          text: 'Pizarra táctica profesional creada en Andez Sports FC PRO',
          url: window.location.href,
        });
      } catch (err) {
        console.log(err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace del ejercicio copiado al portapapeles!');
    }
  };

  const applyTacticalSystem = (systemKey) => {
    const sys = TACTICAL_SYSTEMS[systemKey];
    if (!sys) return;
    const newPlayers = sys.map((p, idx) => ({
      id: 'sys-p-' + idx,
      type: 'player',
      ...p
    }));
    const nonPlayers = objects.filter((o) => o.type !== 'player');
    const updated = [...newPlayers, ...nonPlayers];
    setObjects(updated);
    recordHistory(updated);
    setShowSystemsMenu(false);
  };

  // Trazo de flechas tácticas con geometría ultra nítida y cabeza sobredimensionada
  const renderLinePath = (line, isPreview = false) => {
    const { id, start, end, type, color, width } = line;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const length = Math.hypot(dx, dy);

    // Dimensiones prominentes de la flecha:
    // Nunca se achica con el grosor de la línea
    const arrowLength = Math.max(3.8, width * 2.6);
    const arrowWing = Math.max(2.6, width * 1.9);

    // Punto donde termina la línea antes de la cabeza para evitar que el grosor la tape
    const lineEndX = length > arrowLength ? end.x - (arrowLength * 0.75) * Math.cos(angle) : end.x;
    const lineEndY = length > arrowLength ? end.y - (arrowLength * 0.75) * Math.sin(angle) : end.y;

    const arrowP1x = end.x - arrowLength * Math.cos(angle) + arrowWing * Math.sin(angle);
    const arrowP1y = end.y - arrowLength * Math.sin(angle) - arrowWing * Math.cos(angle);
    const arrowP2x = end.x - arrowLength * Math.cos(angle) - arrowWing * Math.sin(angle);
    const arrowP2y = end.y - arrowLength * Math.sin(angle) + arrowWing * Math.cos(angle);

    if (type === 'wavy-arrow') {
      const waves = 4;
      let pathD = `M ${start.x} ${start.y}`;
      for (let i = 1; i <= waves; i++) {
        const segX = start.x + (dx * i) / waves;
        const segY = start.y + (dy * i) / waves;
        const perpX = -Math.sin(angle) * (i % 2 === 0 ? -2.2 : 2.2);
        const perpY = Math.cos(angle) * (i % 2 === 0 ? -2.2 : 2.2);
        pathD += ` Q ${segX + perpX} ${segY + perpY} ${segX} ${segY}`;
      }
      return (
        <g
          key={id || 'curr'}
          onPointerDown={(e) => !isPreview && handleLinePointerDown(e, id)}
          className={tool === 'eraser' ? 'cursor-pointer hover:opacity-50' : ''}
        >
          <path d={pathD} fill="none" stroke="transparent" strokeWidth={Math.max(8, width * 4)} />
          <path d={pathD} fill="none" stroke={color} strokeWidth={width} />
          <polygon points={`${end.x},${end.y} ${arrowP1x},${arrowP1y} ${arrowP2x},${arrowP2y}`} fill={color} />
        </g>
      );
    }

    if (type === 'stop') {
      const stopLen = Math.max(3.2, width * 2.2);
      const p1x = end.x - Math.sin(angle) * stopLen;
      const p1y = end.y + Math.cos(angle) * stopLen;
      const p2x = end.x + Math.sin(angle) * stopLen;
      const p2y = end.y - Math.cos(angle) * stopLen;
      return (
        <g
          key={id || 'curr'}
          onPointerDown={(e) => !isPreview && handleLinePointerDown(e, id)}
          className={tool === 'eraser' ? 'cursor-pointer hover:opacity-50' : ''}
        >
          <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="transparent" strokeWidth={Math.max(8, width * 4)} />
          <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={color} strokeWidth={width} strokeLinecap="round" />
          <line x1={p1x} y1={p1y} x2={p2x} y2={p2y} stroke={color} strokeWidth={width * 1.5} strokeLinecap="round" />
        </g>
      );
    }

    const isDashed = type === 'dashed-arrow';
    const hasArrow = type === 'arrow' || type === 'dashed-arrow';

    return (
      <g
        key={id || 'curr'}
        onPointerDown={(e) => !isPreview && handleLinePointerDown(e, id)}
        className={tool === 'eraser' ? 'cursor-pointer hover:opacity-50' : ''}
      >
        <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="transparent" strokeWidth={Math.max(8, width * 4)} />
        <line
          x1={start.x}
          y1={start.y}
          x2={hasArrow && length > arrowLength ? lineEndX : end.x}
          y2={hasArrow && length > arrowLength ? lineEndY : end.y}
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeDasharray={isDashed ? `${width * 2.5},${width * 1.8}` : 'none'}
        />
        {hasArrow && length > 2.5 && (
          <polygon
            points={`${end.x},${end.y} ${arrowP1x},${arrowP1y} ${arrowP2x},${arrowP2y}`}
            fill={color}
            stroke={color}
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        )}
      </g>
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#000000] overflow-hidden select-none font-sans">
      {/* 1. BARRA SUPERIOR */}
      <header className="bg-black px-4 py-2 flex items-center justify-between shrink-0 z-30 border-b border-zinc-900 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSystemsMenu(true)}
            className="text-zinc-300 hover:text-amber-400 active:scale-95 transition"
            title="Sistemas Tácticos"
          >
            <Folder className="w-5 h-5" />
          </button>

          <button
            onClick={() => alert('Modo Animación táctica preparado')}
            className="text-zinc-300 hover:text-amber-400 active:scale-95 transition"
            title="Animación"
          >
            <Play className="w-5 h-5" />
          </button>

          <button
            onClick={() => setPitchMode(pitchMode === 'full' ? 'half' : 'full')}
            className={`p-1 rounded active:scale-95 transition ${pitchMode === 'half' ? 'bg-red-600 text-white' : 'text-zinc-300 hover:text-white'}`}
            title="Alternar Cancha Entera / Media Cancha"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowTrainingMenu(!showTrainingMenu)}
            className={`p-1 rounded active:scale-95 transition ${showTrainingMenu ? 'bg-amber-500 text-black font-black' : 'text-amber-400'}`}
            title="Material de Entrenamiento"
          >
            <span className="text-base font-bold">▲</span>
          </button>

          <button
            onClick={() => addElement('player', { team: 'blue' })}
            className="text-blue-400 hover:text-blue-300 active:scale-95 transition"
            title="Agregar Jugador Azul"
          >
            <Shirt className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="text-zinc-300 hover:text-emerald-400 active:scale-95 transition"
            title="Compartir en WhatsApp"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => alert('¡Ejercicio guardado exitosamente en Andez Sports FC!')}
            className="text-zinc-300 hover:text-red-400 active:scale-95 transition"
            title="Guardar"
          >
            <Save className="w-5 h-5" />
          </button>

          <img
            src="/logo-andez.png"
            alt="Logo Andez"
            className="w-6 h-6 rounded-full object-cover border border-red-500 ml-1"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </header>

      {/* 2. LIENZO DE CANCHA */}
      <main
        className="flex-1 w-full h-full flex items-center justify-center p-0 overflow-hidden touch-none relative bg-[#1e881b]"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <svg
          ref={svgRef}
          viewBox={pitchMode === 'half' ? "0 0 68 85" : "0 0 68 105"}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full touch-none select-none drop-shadow-2xl"
          onPointerDown={handlePitchPointerDown}
        >
          <rect width="200" height="200" x="-50" y="-50" fill="#228b22" />

          {/* DIBUJO CANCHA */}
          {pitchMode === 'half' ? (
            <g>
              <rect x="2" y="3" width="64" height="79" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="2" y="19" width="22" height="47" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="2" y="30.5" width="7" height="24" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="15" cy="42.5" r="0.6" fill="white" />
              <path d="M 24 33.5 A 10 10 0 0 1 24 51.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="0.2" y="37.5" width="1.8" height="10" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />
              <line x1="66" y1="3" x2="66" y2="82" stroke="white" strokeWidth="0.8" />
              <path d="M 66 30.5 A 12 12 0 0 0 66 54.5" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="66" cy="42.5" r="0.6" fill="white" />
            </g>
          ) : (
            <g>
              <rect x="2" y="2" width="64" height="101" fill="none" stroke="white" strokeWidth="0.8" />
              <line x1="2" y1="52.5" x2="66" y2="52.5" stroke="white" strokeWidth="0.8" />
              <circle cx="34" cy="52.5" r="9.15" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="34" cy="52.5" r="0.6" fill="white" />

              <rect x="13.84" y="2" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="24.84" y="2" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="34" cy="13" r="0.6" fill="white" />
              <path d="M 27.5 18.5 A 9.15 9.15 0 0 0 40.5 18.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="30.34" y="0.2" width="7.32" height="1.8" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />

              <rect x="13.84" y="86.5" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="24.84" y="97.5" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="34" cy="92" r="0.6" fill="white" />
              <path d="M 27.5 86.5 A 9.15 9.15 0 0 1 40.5 86.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="30.34" y="103" width="7.32" height="1.8" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />
            </g>
          )}

          {/* Trazos tácticos */}
          {drawings.map((line) => renderLinePath(line, false))}
          {currentLine && renderLinePath(currentLine, true)}

          {/* Renderizado de elementos */}
          {objects.map((obj) => {
            if (obj.type === 'player') {
              return (
                <g
                  key={obj.id}
                  transform={`translate(${obj.x}, ${obj.y})`}
                  onPointerDown={(e) => handlePointerDown(e, obj)}
                  className={`touch-none select-none ${tool === 'eraser' ? 'cursor-pointer hover:opacity-50' : 'cursor-grab active:cursor-grabbing'}`}
                >
                  <circle r="3.2" fill="rgba(0,0,0,0.25)" transform="translate(0.3, 0.3)" />
                  <circle
                    r="3.0"
                    fill={obj.role === 'GK' ? '#f59e0b' : obj.team === 'blue' ? '#2563eb' : '#dc2626'}
                    stroke="#ffffff"
                    strokeWidth="0.6"
                  />
                  <text
                    textAnchor="middle"
                    dy="1.0"
                    fontSize="2.5"
                    fontWeight="bold"
                    fill="#ffffff"
                    pointerEvents="none"
                  >
                    {obj.number}
                  </text>
                  {tool === 'eraser' && (
                    <circle r="3.4" fill="none" stroke="#ef4444" strokeWidth="0.6" strokeDasharray="1,1" />
                  )}
                </g>
              );
            }

            if (obj.type === 'ball') {
              return (
                <SoccerBall
                  key={obj.id}
                  x={obj.x}
                  y={obj.y}
                  onPointerDown={(e) => handlePointerDown(e, obj)}
                />
              );
            }

            return (
              <TrainingMaterial
                key={obj.id}
                obj={obj}
                onPointerDown={(e) => handlePointerDown(e, obj)}
              />
            );
          })}
        </svg>

        {/* 3. MENÚ DE MATERIALES */}
        {showTrainingMenu && (
          <aside className="absolute right-2 top-2 bg-black/90 backdrop-blur-md border border-zinc-800 p-3 rounded-2xl flex flex-col gap-2 shadow-2xl z-40 max-h-[82vh] overflow-y-auto w-44">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-1">
              <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">Materiales</span>
              <button onClick={() => setShowTrainingMenu(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <button onClick={() => addElement('mini_goal')} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-amber-400 font-bold">🥅</span> Mini Portería
            </button>
            <button onClick={() => addElement('ladder')} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-amber-400 font-bold">🪜</span> Escalera
            </button>
            <button onClick={() => addElement('dummy')} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-amber-400 font-bold">🧍</span> Maniquí Barrera
            </button>
            <button onClick={() => addElement('hurdle')} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-amber-400 font-bold">🚧</span> Valla de Salto
            </button>
            <button onClick={() => addElement('cone', { color: '#ea580c' })} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-orange-500 font-bold">▲</span> Cono Naranja
            </button>
            <button onClick={() => addElement('cone', { color: '#2563eb' })} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-blue-500 font-bold">▲</span> Cono Azul
            </button>
            <button onClick={() => addElement('cone', { color: '#eab308' })} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-yellow-400 font-bold">▲</span> Cono Amarillo
            </button>
            <button onClick={() => addElement('saucer', { color: '#facc15' })} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-yellow-300 font-bold">🟡</span> Plato Chino
            </button>
            <button onClick={() => addElement('ring', { color: '#38bdf8' })} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-sky-400 font-bold">⭕</span> Aro de Salto
            </button>
          </aside>
        )}

        {/* 4. MODAL DE SISTEMAS TÁCTICOS */}
        {showSystemsMenu && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xs p-4 shadow-2xl">
              <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
                <h3 className="font-black text-sm text-white">Sistemas Tácticos</h3>
                <button onClick={() => setShowSystemsMenu(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {Object.keys(TACTICAL_SYSTEMS).map((sysKey) => (
                  <button
                    key={sysKey}
                    onClick={() => applyTacticalSystem(sysKey)}
                    className="flex items-center justify-between p-2.5 bg-zinc-900 hover:bg-red-600 rounded-xl text-xs font-bold text-white transition"
                  >
                    <span>Formación {sysKey}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. MODAL DE TRAZOS */}
        {showLineMenu && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xs p-4 shadow-2xl">
              <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
                <h3 className="font-black text-sm text-white">Tipo de Línea</h3>
                <button onClick={() => setShowLineMenu(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => { setTool('draw'); setShowLineMenu(false); }}
                className="w-full py-2 bg-red-600 hover:bg-red-500 font-bold text-xs uppercase tracking-wider rounded-xl text-white mb-3 shadow"
              >
                Activar Trazo Seleccionado
              </button>

              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Estilo de Línea</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setLineType('arrow')}
                  className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-2 ${lineType === 'arrow' ? 'border-amber-400 bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-400'}`}
                >
                  <span className="font-black text-sm">→</span> Pase Directo
                </button>
                <button
                  onClick={() => setLineType('dashed-arrow')}
                  className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-2 ${lineType === 'dashed-arrow' ? 'border-amber-400 bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-400'}`}
                >
                  <span className="font-black text-sm">⇢</span> Desmarque
                </button>
                <button
                  onClick={() => setLineType('wavy-arrow')}
                  className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-2 ${lineType === 'wavy-arrow' ? 'border-amber-400 bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-400'}`}
                >
                  <span className="font-black text-sm">∿></span> Conducción
                </button>
                <button
                  onClick={() => setLineType('stop')}
                  className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-2 ${lineType === 'stop' ? 'border-amber-400 bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-400'}`}
                >
                  <span className="font-black text-sm">—|</span> Bloqueo
                </button>
              </div>

              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Color</label>
              <div className="flex items-center justify-between mb-3 bg-zinc-900 p-2 rounded-xl">
                {['#ffffff', '#ef4444', '#3b82f6', '#facc15'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setLineColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-7 h-7 rounded-full border-2 transition ${lineColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                  />
                ))}
              </div>

              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Grosor</label>
              <div className="flex items-center justify-between bg-zinc-900 p-2 rounded-xl">
                {[0.8, 1.4, 2.0, 2.8].map((w) => (
                  <button
                    key={w}
                    onClick={() => setLineWidth(w)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg ${lineWidth === w ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'}`}
                  >
                    {w === 0.8 ? 'Fino' : w === 1.4 ? 'Medio' : w === 2.0 ? 'Grueso' : 'Extra'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 6. PIE INFERIOR */}
      <footer className="bg-black px-4 py-2 flex items-center justify-between shrink-0 z-30 border-t border-zinc-900 shadow-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-1.5 text-zinc-300 hover:text-white disabled:opacity-30 active:scale-95 transition"
            title="Deshacer"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 text-zinc-300 hover:text-white disabled:opacity-30 active:scale-95 transition"
            title="Rehacer"
          >
            <Redo2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => addElement('player', { team: 'blue' })}
            className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center font-black text-white text-xs shadow-lg active:scale-95 transition"
            title="Agregar Jugador Azul"
          >
            11
          </button>

          <button
            onClick={() => addElement('player', { team: 'red' })}
            className="w-9 h-9 rounded-full bg-red-600 border-2 border-white flex items-center justify-center font-black text-white text-xs shadow-lg active:scale-95 transition"
            title="Agregar Jugador Rojo"
          >
            11
          </button>

          <button
            onClick={() => addElement('ball')}
            className="w-9 h-9 rounded-full bg-white border border-zinc-800 flex items-center justify-center text-sm shadow-lg active:scale-95 transition"
            title="Agregar Balón"
          >
            ⚽
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTool(tool === 'eraser' ? 'move' : 'eraser')}
            className={`p-1.5 rounded active:scale-95 transition ${tool === 'eraser' ? 'bg-red-600 text-white animate-pulse' : 'text-zinc-400 hover:text-red-400'}`}
            title="Goma de Borrar: Toca cualquier línea o material para eliminarlo"
          >
            <Eraser className="w-5 h-5" />
          </button>

          <button
            onClick={removeLastLineOrAll}
            onDoubleClick={() => setDrawings([])}
            className="p-1.5 text-zinc-400 hover:text-amber-400 active:scale-95 transition"
            title="Borrar última línea (Doble clic borra todas)"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowLineMenu(true)}
            className={`p-1.5 rounded active:scale-95 transition ${tool === 'draw' ? 'bg-amber-500 text-black' : 'text-zinc-300 hover:text-white'}`}
            title="Herramienta de Trazo"
          >
            <PenTool className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
