import React, { useState, useRef } from 'react';
import {
  RotateCcw, Trash2, Save, Undo2, Redo2,
  CircleDot, SplitSquareVertical
} from 'lucide-react';

// Cancha vertical estándar FIFA: 68 metros ancho x 105 metros largo
// Media cancha: 68 metros ancho x 52.5 metros largo
const FULL_PLAYERS = [
  { id: 'p1', type: 'player', team: 'blue', number: '1', role: 'GK', x: 34, y: 96 },
  { id: 'p2', type: 'player', team: 'blue', number: '4', role: 'CB', x: 23, y: 82 },
  { id: 'p3', type: 'player', team: 'blue', number: '3', role: 'CB', x: 45, y: 82 },
  { id: 'p4', type: 'player', team: 'blue', number: '2', role: 'RB', x: 12, y: 74 },
  { id: 'p5', type: 'player', team: 'blue', number: '5', role: 'LB', x: 56, y: 74 },
  { id: 'p6', type: 'player', team: 'blue', number: '6', role: 'CDM', x: 34, y: 64 },
  { id: 'p7', type: 'player', team: 'blue', number: '8', role: 'CM', x: 22, y: 52 },
  { id: 'p8', type: 'player', team: 'blue', number: '10', role: 'CAM', x: 46, y: 52 },
  { id: 'p9', type: 'player', team: 'blue', number: '7', role: 'RW', x: 14, y: 32 },
  { id: 'p10', type: 'player', team: 'blue', number: '11', role: 'LW', x: 54, y: 32 },
  { id: 'p11', type: 'player', team: 'blue', number: '9', role: 'ST', x: 34, y: 26 },
  { id: 'ball', type: 'ball', x: 34, y: 52.5 },
];

const HALF_PLAYERS = [
  { id: 'p1', type: 'player', team: 'blue', number: '1', role: 'GK', x: 34, y: 8 },
  { id: 'p2', type: 'player', team: 'blue', number: '4', role: 'CB', x: 24, y: 20 },
  { id: 'p3', type: 'player', team: 'blue', number: '3', role: 'CB', x: 44, y: 20 },
  { id: 'p4', type: 'player', team: 'blue', number: '2', role: 'RB', x: 12, y: 28 },
  { id: 'p5', type: 'player', team: 'blue', number: '5', role: 'LB', x: 56, y: 28 },
  { id: 'p6', type: 'player', team: 'red', number: '9', role: 'ST', x: 34, y: 32 },
  { id: 'p7', type: 'red', number: '10', role: 'CAM', x: 24, y: 40 },
  { id: 'p8', type: 'red', number: '7', role: 'RW', x: 48, y: 38 },
  { id: 'ball', type: 'ball', x: 34, y: 28 },
];

export default function App() {
  const [isHalfPitch, setIsHalfPitch] = useState(false);
  const [tool, setTool] = useState('move'); // 'move', 'pass', 'run'
  const [objects, setObjects] = useState(FULL_PLAYERS);
  const [selectedObj, setSelectedObj] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);

  const [history, setHistory] = useState([FULL_PLAYERS]);
  const [historyStep, setHistoryStep] = useState(0);

  const svgRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Al cambiar entre cancha entera y media cancha
  const togglePitchMode = () => {
    const nextMode = !isHalfPitch;
    setIsHalfPitch(nextMode);
    setObjects(nextMode ? HALF_PLAYERS : FULL_PLAYERS);
    setDrawings([]);
  };

  // Coordenadas precisas dentro del SVG
  const getCoordinates = (e) => {
    if (!svgRef.current) return { x: 34, y: 52 };
    const pt = svgRef.current.createSVGPoint();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    pt.x = clientX;
    pt.y = clientY;
    const cursorPt = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
    const maxX = 68;
    const maxY = isHalfPitch ? 55 : 105;
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
    setCurrentLine({ start: coords, end: coords, type: tool });
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
      const nextHistory = history.slice(0, historyStep + 1);
      nextHistory.push(JSON.parse(JSON.stringify(objects)));
      setHistory(nextHistory);
      setHistoryStep(nextHistory.length - 1);
    }
    if (currentLine) {
      setDrawings((prev) => [...prev, { ...currentLine, id: Date.now() }]);
      setCurrentLine(null);
    }
  };

  const undo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      setHistoryStep(prevStep);
      setObjects(JSON.parse(JSON.stringify(history[prevStep])));
    }
  };

  const addElement = (type, team = 'blue') => {
    const id = 'item-' + Date.now();
    let newItem;
    const spawnY = isHalfPitch ? 30 : 52.5;
    if (type === 'player') {
      const count = objects.filter(o => o.type === 'player' && o.team === team).length + 1;
      newItem = { id, type: 'player', team, number: String(count), x: 34, y: spawnY };
    } else if (type === 'ball') {
      newItem = { id, type: 'ball', x: 34, y: spawnY };
    } else {
      newItem = { id, type: 'cone', x: 34, y: spawnY };
    }
    setObjects([...objects, newItem]);
  };

  const removeLast = () => {
    if (objects.length > 0) setObjects(objects.slice(0, -1));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1e7e1b] overflow-hidden select-none font-sans">
      {/* Barra Superior */}
      <header className="bg-black/95 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <img
            src="/logo-andez.png"
            alt="Logo Andez"
            className="w-7 h-7 rounded-full object-cover border border-red-500 shadow"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="flex items-center gap-1">
            <span className="font-black text-white text-xs tracking-wider">ANDEZ SPORTS</span>
            <span className="bg-red-600 text-[9px] font-black px-1.5 py-0.5 rounded text-white">PRO</span>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2">
          {/* Alternador Cancha Entera / Media Cancha */}
          <button
            onClick={togglePitchMode}
            className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 border transition ${
              isHalfPitch ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-200'
            }`}
          >
            <CircleDot className="w-3.5 h-3.5" />
            <span>{isHalfPitch ? 'Cancha Entera' : 'Media Cancha'}</span>
          </button>

          <button
            onClick={undo}
            disabled={historyStep <= 0}
            className="p-1.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300 disabled:opacity-30"
            title="Deshacer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setDrawings([])}
            className="p-1.5 bg-zinc-800 border border-zinc-700 rounded text-amber-400"
            title="Borrar Líneas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => alert('¡Ejercicio guardado en Andez Sports FC!')}
            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold flex items-center gap-1 shadow"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar</span>
          </button>
        </div>
      </header>

      {/* Cancha Verde 100% Pantalla */}
      <main
        className="flex-1 w-full h-full flex items-center justify-center p-0.5 overflow-hidden touch-none relative bg-[#1e7e1b]"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <svg
          ref={svgRef}
          viewBox={isHalfPitch ? "0 0 68 55" : "0 0 68 105"}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full touch-none select-none drop-shadow-xl"
          onPointerDown={handlePitchPointerDown}
        >
          {/* Fondo Césped Verde */}
          <rect width="200" height="200" x="-50" y="-50" fill="#228b22" />

          {/* Franjas Césped Realista */}
          {[0, 10.5, 21, 31.5, 42, 52.5, 63, 73.5, 84, 94.5].map((y, idx) => (
            idx % 2 === 0 ? <rect key={y} x="0" y={y} width="68" height="10.5" fill="#1e7e1b" /> : null
          ))}

          {/* DIBUJO CANCHA */}
          {isHalfPitch ? (
            /* --- MODO MEDIA CANCHA PROFESIONAL --- */
            <g>
              {/* Líneas Perimetrales de media cancha */}
              <rect x="2" y="2" width="64" height="50.5" fill="none" stroke="white" strokeWidth="0.8" />
              
              {/* Línea de mitad de cancha abajo */}
              <line x1="2" y1="52.5" x2="66" y2="52.5" stroke="white" strokeWidth="0.8" />
              
              {/* Círculo Central hacia arriba */}
              <path d="M 24.85 52.5 A 9.15 9.15 0 0 0 43.15 52.5" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="34" cy="52.5" r="0.6" fill="white" />

              {/* Área Penal Grande (Norte) */}
              <rect x="13.84" y="2" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.8" />
              {/* Área Chica */}
              <rect x="24.84" y="2" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.8" />
              {/* Punto Penal Norte */}
              <circle cx="34" cy="13" r="0.6" fill="white" />
              {/* Media Luna del Área Grande */}
              <path d="M 27.5 18.5 A 9.15 9.15 0 0 0 40.5 18.5" fill="none" stroke="white" strokeWidth="0.8" />
              {/* Arco */}
              <rect x="30.34" y="0.2" width="7.32" height="1.8" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />
            </g>
          ) : (
            /* --- MODO CANCHA ENTERA --- */
            <g>
              {/* Líneas Perimetrales */}
              <rect x="2" y="2" width="64" height="101" fill="none" stroke="white" strokeWidth="0.8" />
              {/* Línea Central */}
              <line x1="2" y1="52.5" x2="66" y2="52.5" stroke="white" strokeWidth="0.8" />
              <circle cx="34" cy="52.5" r="9.15" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="34" cy="52.5" r="0.6" fill="white" />

              {/* Área Penal Norte */}
              <rect x="13.84" y="2" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="24.84" y="2" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="34" cy="13" r="0.6" fill="white" />
              <path d="M 27.5 18.5 A 9.15 9.15 0 0 0 40.5 18.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="30.34" y="0.2" width="7.32" height="1.8" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />

              {/* Área Penal Sur */}
              <rect x="13.84" y="86.5" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="24.84" y="97.5" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="34" cy="92" r="0.6" fill="white" />
              <path d="M 27.5 86.5 A 9.15 9.15 0 0 1 40.5 86.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="30.34" y="103" width="7.32" height="1.8" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />
            </g>
          )}

          {/* Trazos Tácticos */}
          {drawings.map((d) => (
            <line
              key={d.id}
              x1={d.start.x}
              y1={d.start.y}
              x2={d.end.x}
              y2={d.end.y}
              stroke={d.type === 'pass' ? '#facc15' : '#38bdf8'}
              strokeWidth="1.2"
              strokeDasharray={d.type === 'run' ? '2.5,2.5' : 'none'}
            />
          ))}

          {currentLine && (
            <line
              x1={currentLine.start.x}
              y1={currentLine.start.y}
              x2={currentLine.end.x}
              y2={currentLine.end.y}
              stroke={currentLine.type === 'pass' ? '#facc15' : '#38bdf8'}
              strokeWidth="1.2"
              strokeDasharray={currentLine.type === 'run' ? '2.5,2.5' : 'none'}
            />
          )}

          {/* Fichas y Balón Circulares */}
          {objects.map((obj) => {
            if (obj.type === 'player') {
              return (
                <g
                  key={obj.id}
                  transform={`translate(${obj.x}, ${obj.y})`}
                  onPointerDown={(e) => handlePointerDown(e, obj)}
                  className="cursor-grab active:cursor-grabbing touch-none select-none"
                >
                  <circle
                    r="2.8"
                    fill={obj.role === 'GK' ? '#f59e0b' : obj.team === 'blue' ? '#2563eb' : '#dc2626'}
                    stroke="#ffffff"
                    strokeWidth="0.6"
                  />
                  <text
                    textAnchor="middle"
                    dy="0.95"
                    fontSize="2.3"
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
                <g
                  key={obj.id}
                  transform={`translate(${obj.x}, ${obj.y})`}
                  onPointerDown={(e) => handlePointerDown(e, obj)}
                  className="cursor-grab active:cursor-grabbing touch-none select-none"
                >
                  <circle r="1.8" fill="#ffffff" stroke="#111827" strokeWidth="0.35" />
                  <polygon points="0,-0.6 0.57,-0.19 0.35,0.49 -0.35,0.49 -0.57,-0.19" fill="#111827" />
                  <line x1="0" y1="-0.6" x2="0" y2="-1.6" stroke="#111827" strokeWidth="0.25" />
                  <line x1="0.57" y1="-0.19" x2="1.5" y2="-0.5" stroke="#111827" strokeWidth="0.25" />
                  <line x1="0.35" y1="0.49" x2="1.0" y2="1.3" stroke="#111827" strokeWidth="0.25" />
                  <line x1="-0.35" y1="0.49" x2="-1.0" y2="1.3" stroke="#111827" strokeWidth="0.25" />
                  <line x1="-0.57" y1="-0.19" x2="-1.5" y2="-0.5" stroke="#111827" strokeWidth="0.25" />
                </g>
              );
            }

            if (obj.type === 'cone') {
              return (
                <g
                  key={obj.id}
                  transform={`translate(${obj.x}, ${obj.y})`}
                  onPointerDown={(e) => handlePointerDown(e, obj)}
                  className="cursor-grab touch-none"
                >
                  <polygon points="-1.8,1.8 1.8,1.8 0,-2.0" fill="#f97316" stroke="#fff" strokeWidth="0.4" />
                </g>
              );
            }
            return null;
          })}
        </svg>
      </main>

      {/* Banco Inferior Rápido */}
      <footer className="bg-black/95 border-t border-slate-800 px-3 py-1.5 flex items-center justify-between shrink-0 z-30 shadow-lg">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => addElement('player', 'blue')}
            className="flex items-center gap-1 active:scale-95 transition"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 border border-white flex items-center justify-center font-bold text-white text-xs">
              +
            </div>
            <span className="text-[11px] font-bold text-blue-300">Azul</span>
          </button>

          <button
            onClick={() => addElement('player', 'red')}
            className="flex items-center gap-1 active:scale-95 transition"
          >
            <div className="w-7 h-7 rounded-full bg-red-600 border border-white flex items-center justify-center font-bold text-white text-xs">
              +
            </div>
            <span className="text-[11px] font-bold text-red-300">Rojo</span>
          </button>

          <button
            onClick={() => addElement('ball')}
            className="flex items-center gap-1 active:scale-95 transition"
          >
            <div className="w-7 h-7 rounded-full bg-white border border-slate-800 flex items-center justify-center text-xs">
              ⚽
            </div>
          </button>

          <button
            onClick={() => addElement('cone')}
            className="flex items-center gap-1 active:scale-95 transition"
          >
            <div className="w-7 h-7 rounded-lg bg-orange-500 border border-white flex items-center justify-center text-white text-xs font-bold">
              ▲
            </div>
          </button>
        </div>

        {/* Herramientas de trazo */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTool('move')}
            className={`px-2.5 py-1 rounded text-xs font-bold border transition ${
              tool === 'move' ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
          >
            Mover
          </button>
          <button
            onClick={() => setTool('pass')}
            className={`px-2.5 py-1 rounded text-xs font-bold border transition ${
              tool === 'pass' ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
          >
            Línea
          </button>
          <button
            onClick={() => setTool('run')}
            className={`px-2.5 py-1 rounded text-xs font-bold border transition ${
              tool === 'run' ? 'bg-sky-400 border-sky-300 text-black' : 'bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
          >
            Guion
          </button>
          <button
            onClick={removeLast}
            className="p-1 bg-zinc-800 border border-zinc-700 rounded text-red-400"
            title="Quitar último elemento"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
