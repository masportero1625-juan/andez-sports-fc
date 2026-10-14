import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCcw, Trash2, Save, CircleDot
} from 'lucide-react';

// Cancha Entera Vertical (Arco Norte arriba, Arco Sur abajo): 68 ancho x 105 alto
const FULL_PITCH_PLAYERS = [
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

// Media Cancha de Izquierda a Derecha (Arco a la izquierda, mitad a la derecha): 68 ancho x 85 alto
const HALF_PITCH_PLAYERS = [
  { id: 'p1', type: 'player', team: 'blue', number: '1', role: 'GK', x: 6, y: 42.5 },
  { id: 'p2', type: 'player', team: 'blue', number: '4', role: 'CB', x: 22, y: 28 },
  { id: 'p3', type: 'player', team: 'blue', number: '3', role: 'CB', x: 22, y: 57 },
  { id: 'p4', type: 'player', team: 'blue', number: '2', role: 'RB', x: 30, y: 15 },
  { id: 'p5', type: 'player', team: 'blue', number: '5', role: 'LB', x: 30, y: 70 },
  { id: 'p6', type: 'player', team: 'red', number: '9', role: 'ST', x: 36, y: 42.5 },
  { id: 'p7', type: 'player', team: 'red', number: '10', role: 'CAM', x: 48, y: 32 },
  { id: 'p8', type: 'player', team: 'red', number: '7', role: 'RW', x: 48, y: 55 },
  { id: 'ball', type: 'ball', x: 36, y: 42.5 },
];

// Balón clásico de fútbol con pentágonos y costuras detalladas
function SoccerBall({ x, y, onPointerDown }) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onPointerDown={onPointerDown}
      className="cursor-grab active:cursor-grabbing touch-none select-none"
    >
      <circle r="2.8" fill="rgba(0,0,0,0.3)" transform="translate(0.3, 0.3)" />
      <circle r="2.6" fill="#ffffff" stroke="#111827" strokeWidth="0.4" />
      {/* Pentágono Central Negro */}
      <polygon points="0,-0.9 0.85,-0.28 0.53,0.73 -0.53,0.73 -0.85,-0.28" fill="#111827" />
      {/* Gajos exteriores */}
      <polygon points="0,-1.7 0.6,-2.3 -0.6,-2.3" fill="#111827" />
      <polygon points="1.7,-0.6 2.4,-0.8 2.1,-0.1" fill="#111827" />
      <polygon points="1.2,1.6 1.8,1.9 1.5,2.4" fill="#111827" />
      <polygon points="-1.2,1.6 -1.5,2.4 -1.8,1.9" fill="#111827" />
      <polygon points="-1.7,-0.6 -2.1,-0.1 -2.4,-0.8" fill="#111827" />
      {/* Costuras */}
      <line x1="0" y1="-0.9" x2="0" y2="-1.7" stroke="#111827" strokeWidth="0.25" />
      <line x1="0.85" y1="-0.28" x2="1.7" y2="-0.6" stroke="#111827" strokeWidth="0.25" />
      <line x1="0.53" y1="0.73" x2="1.2" y2="1.6" stroke="#111827" strokeWidth="0.25" />
      <line x1="-0.53" y1="0.73" x2="-1.2" y2="1.6" stroke="#111827" strokeWidth="0.25" />
      <line x1="-0.85" y1="-0.28" x2="-1.7" y2="-0.6" stroke="#111827" strokeWidth="0.25" />
    </g>
  );
}

export default function App() {
  const [isHalfPitch, setIsHalfPitch] = useState(false);
  const [tool, setTool] = useState('move'); // 'move', 'pass', 'run'
  const [objects, setObjects] = useState(FULL_PITCH_PLAYERS);
  const [selectedObj, setSelectedObj] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);

  const [history, setHistory] = useState([FULL_PITCH_PLAYERS]);
  const [historyStep, setHistoryStep] = useState(0);

  const svgRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Bloqueo de orientación forzada por Screen Orientation API si el navegador lo permite
  useEffect(() => {
    if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
      window.screen.orientation.lock('portrait').catch(() => {});
    }
  }, []);

  const togglePitchMode = () => {
    const nextMode = !isHalfPitch;
    setIsHalfPitch(nextMode);
    setObjects(nextMode ? HALF_PITCH_PLAYERS : FULL_PITCH_PLAYERS);
    setDrawings([]);
    setHistory([nextMode ? HALF_PITCH_PLAYERS : FULL_PITCH_PLAYERS]);
    setHistoryStep(0);
  };

  const getCoordinates = (e) => {
    if (!svgRef.current) return { x: 34, y: 50 };
    const pt = svgRef.current.createSVGPoint();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    pt.x = clientX;
    pt.y = clientY;
    const cursorPt = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
    const maxX = 68;
    const maxY = isHalfPitch ? 85 : 105;
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
    const spawnY = isHalfPitch ? 42.5 : 52.5;
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
      <header className="bg-black/95 border-b border-zinc-800 px-3 py-1.5 flex items-center justify-between shrink-0 z-30 shadow-md">
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

        {/* Acciones de Pizarra */}
        <div className="flex items-center gap-2">
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
            title="Borrar Trazos"
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
          viewBox={isHalfPitch ? "0 0 68 85" : "0 0 68 105"}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full touch-none select-none drop-shadow-2xl"
          onPointerDown={handlePitchPointerDown}
        >
          {/* Fondo Césped Verde */}
          <rect width="200" height="200" x="-50" y="-50" fill="#228b22" />

          {/* DIBUJO CANCHA SEGÚN MODO */}
          {isHalfPitch ? (
            /* --- MEDIA CANCHA EXACTA A LA APP DE REFERENCIA (De Izquierda a Derecha) --- */
            <g>
              {/* Franjas Césped */}
              {[0, 17, 34, 51, 68].map((x, idx) => (
                idx % 2 === 0 ? <rect key={x} x={x} y="3" width="17" height="79" fill="#1e7e1b" /> : null
              ))}

              {/* Perímetro Media Cancha */}
              <rect x="2" y="3" width="64" height="79" fill="none" stroke="white" strokeWidth="0.8" />

              {/* Área Penal Grande (Izquierda) */}
              <rect x="2" y="19" width="22" height="47" fill="none" stroke="white" strokeWidth="0.8" />
              {/* Área Chica (Izquierda) */}
              <rect x="2" y="30.5" width="7" height="24" fill="none" stroke="white" strokeWidth="0.8" />
              {/* Punto Penal */}
              <circle cx="15" cy="42.5" r="0.6" fill="white" />
              {/* Media Luna del Área Grande */}
              <path d="M 24 33.5 A 10 10 0 0 1 24 51.5" fill="none" stroke="white" strokeWidth="0.8" />
              {/* Arco Izquierdo */}
              <rect x="0.2" y="37.5" width="1.8" height="10" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />

              {/* Línea de Mitad de Cancha (Derecha) */}
              <line x1="66" y1="3" x2="66" y2="82" stroke="white" strokeWidth="0.8" />
              {/* Círculo Central hacia adentro */}
              <path d="M 66 30.5 A 12 12 0 0 0 66 54.5" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="66" cy="42.5" r="0.6" fill="white" />
            </g>
          ) : (
            /* --- CANCHA ENTERA VERTICAL FIFA REGLAMENTARIA --- */
            <g>
              {/* Franjas Césped */}
              {[0, 10.5, 21, 31.5, 42, 52.5, 63, 73.5, 84, 94.5].map((y, idx) => (
                idx % 2 === 0 ? <rect key={y} x="2" y={y} width="64" height="10.5" fill="#1e7e1b" /> : null
              ))}

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
              strokeWidth="1.3"
              strokeDasharray={d.type === 'run' ? '2.5,2.5' : 'none'}
            />
          ))}

          {currentLine && (
            <line
              x1={currentLine.start.x}
              y1={currentLine.start.y}
              x2={currentLine.end.y}
              stroke={currentLine.type === 'pass' ? '#facc15' : '#38bdf8'}
              strokeWidth="1.3"
              strokeDasharray={currentLine.type === 'run' ? '2.5,2.5' : 'none'}
            />
          )}

          {/* Fichas, Conos y Balón */}
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

            if (obj.type === 'cone') {
              return (
                <g
                  key={obj.id}
                  transform={`translate(${obj.x}, ${obj.y})`}
                  onPointerDown={(e) => handlePointerDown(e, obj)}
                  className="cursor-grab touch-none"
                >
                  <polygon points="-2.0,2.0 2.0,2.0 0,-2.2" fill="#f97316" stroke="#fff" strokeWidth="0.4" />
                </g>
              );
            }
            return null;
          })}
        </svg>
      </main>

      {/* Banco Inferior Rápido */}
      <footer className="bg-black/95 border-t border-zinc-800 px-3 py-1.5 flex items-center justify-between shrink-0 z-30 shadow-lg">
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
