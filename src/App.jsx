import React, { useState, useRef } from 'react';
import {
  Folder, Play, RotateCcw, Shirt, Share2, Save, Settings,
  Undo2, Redo2, Trash2, PenTool, X, ChevronRight, Check
} from 'lucide-react';

// Formaciones tácticas predefinidas
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

// Componente Balón de Fútbol Clásico Vectorial
function SoccerBall({ x, y, onPointerDown }) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onPointerDown={onPointerDown}
      className="cursor-grab active:cursor-grabbing touch-none select-none"
    >
      <circle r="2.7" fill="rgba(0,0,0,0.3)" transform="translate(0.3, 0.3)" />
      <circle r="2.5" fill="#ffffff" stroke="#0f172a" strokeWidth="0.35" />
      <polygon points="0,-0.85 0.8,-0.26 0.5,0.7 -0.5,0.7 -0.8,-0.26" fill="#0f172a" />
      <polygon points="0,-1.65 0.5,-2.2 -0.5,-2.2" fill="#0f172a" />
      <polygon points="1.6,-0.6 2.3,-0.7 2.0,-0.1" fill="#0f172a" />
      <polygon points="1.1,1.5 1.7,1.8 1.4,2.3" fill="#0f172a" />
      <polygon points="-1.1,1.5 -1.4,2.3 -1.7,1.8" fill="#0f172a" />
      <polygon points="-1.6,-0.6 -2.0,-0.1 -2.3,-0.7" fill="#0f172a" />
      <line x1="0" y1="-0.85" x2="0" y2="-1.65" stroke="#0f172a" strokeWidth="0.25" />
      <line x1="0.8" y1="-0.26" x2="1.6" y2="-0.6" stroke="#0f172a" strokeWidth="0.25" />
      <line x1="0.5" y1="0.7" x2="1.1" y2="1.5" stroke="#0f172a" strokeWidth="0.25" />
      <line x1="-0.5" y1="0.7" x2="-1.1" y2="1.5" stroke="#0f172a" strokeWidth="0.25" />
      <line x1="-0.8" y1="-0.26" x2="-1.6" y2="-0.6" stroke="#0f172a" strokeWidth="0.25" />
    </g>
  );
}

export default function App() {
  const [pitchMode, setPitchMode] = useState('full'); // 'full' o 'half'
  const [showTrainingMenu, setShowTrainingMenu] = useState(false);
  const [showLineMenu, setShowLineMenu] = useState(false);
  const [showSystemsMenu, setShowSystemsMenu] = useState(false);
  const [showSquadMenu, setShowSquadMenu] = useState(false);

  // Ajustes de línea
  const [lineType, setLineType] = useState('arrow'); // 'straight', 'arrow', 'dashed', 'wavy'
  const [lineColor, setLineColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(1.2);
  const [tool, setTool] = useState('move'); // 'move' o 'draw'

  // Elementos en cancha
  const [objects, setObjects] = useState([
    ...TACTICAL_SYSTEMS['4-3-3'].map(p => ({ ...p, id: 'init-' + p.number, type: 'player' })),
    { id: 'ball-1', type: 'ball', x: 34, y: 52.5 }
  ]);
  const [drawings, setDrawings] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);

  // Historial para Deshacer/Rehacer
  const [history, setHistory] = useState([objects]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const svgRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [selectedObj, setSelectedObj] = useState(null);

  // Coordenadas fijas estándar
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
    if (tool !== 'move') return;
    setSelectedObj(obj);
    isDraggingRef.current = true;
  };

  const handlePitchPointerDown = (e) => {
    if (tool === 'move') {
      setSelectedObj(null);
      return;
    }
    const coords = getCoordinates(e);
    setCurrentLine({
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

  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      const nextH = history.slice(0, historyIndex + 1);
      nextH.push(JSON.parse(JSON.stringify(objects)));
      setHistory(nextH);
      setHistoryIndex(nextH.length - 1);
    }
    if (currentLine) {
      setDrawings((prev) => [...prev, { ...currentLine, id: Date.now() }]);
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
      const count = objects.filter(o => o.type === 'player' && o.team === (extra.team || 'blue')).length + 1;
      newItem.number = String(extra.number || count);
    }
    const nextObjs = [...objects, newItem];
    setObjects(nextObjs);
    const nextH = history.slice(0, historyIndex + 1);
    nextH.push(nextObjs);
    setHistory(nextH);
    setHistoryIndex(nextH.length - 1);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Andez Sports FC - Ejercicio Táctico',
          text: 'Pizarra táctica creada con Andez Sports FC PRO',
          url: window.location.href,
        });
      } catch (err) {
        console.log(err);
      }
    } else {
      alert('Enlace copiado al portapapeles para enviar por WhatsApp');
      navigator.clipboard.writeText(window.location.href);
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
    const nonPlayers = objects.filter(o => o.type !== 'player');
    const updated = [...newPlayers, ...nonPlayers];
    setObjects(updated);
    setShowSystemsMenu(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#000000] overflow-hidden select-none font-sans">
      {/* 1. BARRA SUPERIOR MINIMALISTA IDÉNTICA A LA APP DE REFERENCIA */}
      <header className="bg-black px-4 py-2 flex items-center justify-between shrink-0 z-30 border-b border-zinc-900">
        <div className="flex items-center gap-4">
          {/* Carpeta / Sesiones */}
          <button
            onClick={() => setShowSystemsMenu(true)}
            className="text-white hover:text-amber-400 active:scale-95 transition"
            title="Sistemas Tácticos"
          >
            <Folder className="w-5 h-5" />
          </button>

          {/* Animación / Play */}
          <button
            onClick={() => alert('Modo Animación táctica activado')}
            className="text-white hover:text-amber-400 active:scale-95 transition"
            title="Animación"
          >
            <Play className="w-5 h-5" />
          </button>

          {/* Cambiar Cancha (Entera / Media Cancha horizontal) */}
          <button
            onClick={() => setPitchMode(pitchMode === 'full' ? 'half' : 'full')}
            className="text-white hover:text-amber-400 active:scale-95 transition"
            title="Alternar Cancha Entera / Media Cancha"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Material de Entrenamiento (Conos, Vallas, Arcos) */}
          <button
            onClick={() => setShowTrainingMenu(!showTrainingMenu)}
            className={`p-1 rounded active:scale-95 transition ${showTrainingMenu ? 'bg-amber-500 text-black' : 'text-amber-400'}`}
            title="Materiales de Entrenamiento"
          >
            <span className="text-base font-bold">▲</span>
          </button>

          {/* Plantel / Camisetas */}
          <button
            onClick={() => setShowSquadMenu(!showSquadMenu)}
            className="text-blue-400 hover:text-blue-300 active:scale-95 transition"
            title="Plantel y Suplentes"
          >
            <Shirt className="w-5 h-5" />
          </button>
        </div>

        {/* Acciones Derecha: Compartir, Guardar, Logo Andez */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="text-white hover:text-emerald-400 active:scale-95 transition"
            title="Enviar por WhatsApp"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => alert('¡Ejercicio guardado en Andez Sports FC!')}
            className="text-white hover:text-red-400 active:scale-95 transition"
            title="Guardar"
          >
            <Save className="w-5 h-5" />
          </button>

          {/* Logo Andez Sports */}
          <img
            src="/logo-andez.png"
            alt="Andez Logo"
            className="w-6 h-6 rounded-full object-cover border border-red-500 ml-1"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </header>

      {/* 2. LIENZO DE CANCHA VERDE 100% PANTALLA */}
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
          {/* Fondo Césped Continuo */}
          <rect width="200" height="200" x="-50" y="-50" fill="#228b22" />

          {/* DIBUJO CANCHA */}
          {pitchMode === 'half' ? (
            /* MEDIA CANCHA (De Izquierda a Derecha) */
            <g>
              <rect x="2" y="3" width="64" height="79" fill="none" stroke="white" strokeWidth="0.8" />
              {/* Área Grande Izquierda */}
              <rect x="2" y="19" width="22" height="47" fill="none" stroke="white" strokeWidth="0.8" />
              {/* Área Chica Izquierda */}
              <rect x="2" y="30.5" width="7" height="24" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="15" cy="42.5" r="0.6" fill="white" />
              <path d="M 24 33.5 A 10 10 0 0 1 24 51.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="0.2" y="37.5" width="1.8" height="10" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />
              {/* Línea Centro Derecha */}
              <line x1="66" y1="3" x2="66" y2="82" stroke="white" strokeWidth="0.8" />
              <path d="M 66 30.5 A 12 12 0 0 0 66 54.5" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="66" cy="42.5" r="0.6" fill="white" />
            </g>
          ) : (
            /* CANCHA COMPLETA VERTICAL */
            <g>
              <rect x="2" y="2" width="64" height="101" fill="none" stroke="white" strokeWidth="0.8" />
              <line x1="2" y1="52.5" x2="66" y2="52.5" stroke="white" strokeWidth="0.8" />
              <circle cx="34" cy="52.5" r="9.15" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="34" cy="52.5" r="0.6" fill="white" />

              {/* Área Norte */}
              <rect x="13.84" y="2" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="24.84" y="2" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="34" cy="13" r="0.6" fill="white" />
              <path d="M 27.5 18.5 A 9.15 9.15 0 0 0 40.5 18.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="30.34" y="0.2" width="7.32" height="1.8" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />

              {/* Área Sur */}
              <rect x="13.84" y="86.5" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="24.84" y="97.5" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="34" cy="92" r="0.6" fill="white" />
              <path d="M 27.5 86.5 A 9.15 9.15 0 0 1 40.5 86.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="30.34" y="103" width="7.32" height="1.8" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />
            </g>
          )}

          {/* Trazos Tácticos Realizados */}
          {drawings.map((d) => (
            <g key={d.id}>
              <line
                x1={d.start.x}
                y1={d.start.y}
                x2={d.end.x}
                y2={d.end.y}
                stroke={d.color || '#ffffff'}
                strokeWidth={d.width || 1.2}
                strokeDasharray={d.type === 'dashed' ? '2.5,2.5' : 'none'}
              />
              {d.type === 'arrow' && (
                <circle cx={d.end.x} cy={d.end.y} r="1" fill={d.color || '#ffffff'} />
              )}
            </g>
          ))}

          {/* Trazo en curso */}
          {currentLine && (
            <line
              x1={currentLine.start.x}
              y1={currentLine.start.y}
              x2={currentLine.end.x}
              y2={currentLine.end.y}
              stroke={currentLine.color || '#ffffff'}
              strokeWidth={currentLine.width || 1.2}
              strokeDasharray={currentLine.type === 'dashed' ? '2.5,2.5' : 'none'}
            />
          )}

          {/* Elementos en Cancha: Fichas, Balón, Conos, Materiales */}
          {objects.map((obj) => {
            if (obj.type === 'player') {
              return (
                <g
                  key={obj.id}
                  transform={`translate(${obj.x}, ${obj.y})`}
                  onPointerDown={(e) => handlePointerDown(e, obj)}
                  className="cursor-grab active:cursor-grabbing touch-none select-none"
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

            if (obj.type === 'mini_goal') {
              return (
                <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={(e) => handlePointerDown(e, obj)} className="cursor-grab touch-none">
                  <rect x="-4" y="-2" width="8" height="4" fill="rgba(255,255,255,0.2)" stroke="#facc15" strokeWidth="0.5" />
                  <line x1="-4" y1="0" x2="4" y2="0" stroke="#facc15" strokeWidth="0.3" strokeDasharray="1,1" />
                </g>
              );
            }

            if (obj.type === 'ladder') {
              return (
                <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={(e) => handlePointerDown(e, obj)} className="cursor-grab touch-none">
                  <rect x="-2" y="-6" width="4" height="12" fill="none" stroke="#facc15" strokeWidth="0.5" />
                  {[-4, -2, 0, 2, 4].map(step => (
                    <line key={step} x1="-2" y1={step} x2="2" y2={step} stroke="#facc15" strokeWidth="0.4" />
                  ))}
                </g>
              );
            }

            if (obj.type === 'cone') {
              return (
                <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={(e) => handlePointerDown(e, obj)} className="cursor-grab touch-none">
                  <polygon points="-1.8,1.8 1.8,1.8 0,-2.0" fill={obj.color || '#f97316'} stroke="#fff" strokeWidth="0.3" />
                </g>
              );
            }

            if (obj.type === 'ring') {
              return (
                <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={(e) => handlePointerDown(e, obj)} className="cursor-grab touch-none">
                  <circle r="2.8" fill="none" stroke={obj.color || '#facc15'} strokeWidth="0.6" />
                </g>
              );
            }

            if (obj.type === 'dummy') {
              return (
                <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={(e) => handlePointerDown(e, obj)} className="cursor-grab touch-none">
                  <circle cx="0" cy="-2.5" r="1" fill="#facc15" />
                  <rect x="-1.5" y="-1.5" width="3" height="4.5" rx="0.5" fill="#facc15" />
                  <line x1="-0.8" y1="3" x2="-0.8" y2="4.5" stroke="#facc15" strokeWidth="0.4" />
                  <line x1="0.8" y1="3" x2="0.8" y2="4.5" stroke="#facc15" strokeWidth="0.4" />
                </g>
              );
            }

            return null;
          })}
        </svg>

        {/* 3. MENÚ DESPLEGABLE DE MATERIALES DE ENTRENAMIENTO */}
        {showTrainingMenu && (
          <aside className="absolute right-2 top-2 bg-black/85 backdrop-blur-md border border-zinc-800 p-2.5 rounded-2xl flex flex-col gap-2 shadow-2xl z-40 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-700 pb-1 mb-1">
              <span className="text-[10px] font-bold text-zinc-300">Materiales</span>
              <button onClick={() => setShowTrainingMenu(false)} className="text-zinc-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <button onClick={() => addElement('mini_goal')} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-amber-400 font-bold">🥅</span> Mini Arco
            </button>
            <button onClick={() => addElement('ladder')} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-amber-400 font-bold">🪜</span> Escalera
            </button>
            <button onClick={() => addElement('dummy')} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-amber-400 font-bold">🧍</span> Maniquí
            </button>
            <button onClick={() => addElement('ring', { color: '#facc15' })} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-yellow-400 font-bold">⭕</span> Aro Amarillo
            </button>
            <button onClick={() => addElement('cone', { color: '#f97316' })} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-orange-500 font-bold">▲</span> Cono Naranja
            </button>
            <button onClick={() => addElement('cone', { color: '#3b82f6' })} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-blue-500 font-bold">▲</span> Cono Azul
            </button>
          </aside>
        )}

        {/* 4. MODAL DE SISTEMAS TÁCTICOS */}
        {showSystemsMenu && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-xs p-4 shadow-2xl">
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
                    className="flex items-center justify-between p-2.5 bg-zinc-800 hover:bg-red-600 rounded-xl text-xs font-bold text-white transition"
                  >
                    <span>Formación {sysKey}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. MODAL DE TRAZOS Y LÍNEAS */}
        {showLineMenu && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-xs p-4 shadow-2xl">
              <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
                <h3 className="font-black text-sm text-white">Tipo de Línea</h3>
                <button onClick={() => setShowLineMenu(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selector de modo */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => { setTool('move'); setShowLineMenu(false); }}
                  className={`p-2 rounded-xl text-xs font-bold border ${tool === 'move' ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}
                >
                  Mover Fichas
                </button>
                <button
                  onClick={() => { setTool('draw'); setShowLineMenu(false); }}
                  className={`p-2 rounded-xl text-xs font-bold border ${tool === 'draw' ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}
                >
                  Modo Dibujo
                </button>
              </div>

              {/* Tipos de trazo */}
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Estilo</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  onClick={() => setLineType('arrow')}
                  className={`p-2 rounded-lg text-xs font-bold border ${lineType === 'arrow' ? 'border-amber-400 bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-400'}`}
                >
                  → Pase
                </button>
                <button
                  onClick={() => setLineType('dashed')}
                  className={`p-2 rounded-lg text-xs font-bold border ${lineType === 'dashed' ? 'border-amber-400 bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-400'}`}
                >
                  - - Desmarque
                </button>
                <button
                  onClick={() => setLineType('straight')}
                  className={`p-2 rounded-lg text-xs font-bold border ${lineType === 'straight' ? 'border-amber-400 bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-400'}`}
                >
                  — Recta
                </button>
              </div>

              {/* Colores */}
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Color</label>
              <div className="flex items-center gap-3">
                {['#ffffff', '#ef4444', '#3b82f6', '#facc15'].map(color => (
                  <button
                    key={color}
                    onClick={() => setLineColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-7 h-7 rounded-full border-2 transition ${lineColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 6. PIE INFERIOR FLOTANTE IDÉNTICO A LA CAPTURA DE REFERENCIA */}
      <footer className="bg-black/95 px-4 py-2 flex items-center justify-between shrink-0 z-30 border-t border-zinc-900 shadow-xl">
        {/* Deshacer y Rehacer */}
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

        {/* Fichas Maestras: Azul, Roja y Pelota */}
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

        {/* Papelera y Selector de Trazos */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawings([])}
            className="p-1.5 text-zinc-400 hover:text-red-400 active:scale-95 transition"
            title="Borrar Trazos"
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
