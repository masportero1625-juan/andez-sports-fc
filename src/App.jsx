import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCcw, Trash2, Save, Undo2, Redo2,
  Share2, Settings, Smartphone, Layers, CircleDot
} from 'lucide-react';

export default function App() {
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  const [isHalfPitch, setIsHalfPitch] = useState(false);
  const [tool, setTool] = useState('move'); // 'move', 'pass', 'run'
  
  // Detección en vivo de orientación del celular
  useEffect(() => {
    const handleOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  // Formación inicial 1-4-3-3 adaptada
  const defaultPlayers = [
    { id: 'p1', type: 'player', team: 'blue', number: '1', role: 'GK', x: 50, y: isPortrait ? 90 : 50, hX: 8, hY: 50 },
    { id: 'p2', type: 'player', team: 'blue', number: '4', role: 'CB', x: 35, y: isPortrait ? 76 : 35, hX: 24, hY: 35 },
    { id: 'p3', type: 'player', team: 'blue', number: '3', role: 'CB', x: 65, y: isPortrait ? 76 : 65, hX: 24, hY: 65 },
    { id: 'p4', type: 'player', team: 'blue', number: '2', role: 'RB', x: 18, y: isPortrait ? 70 : 15, hX: 30, hY: 15 },
    { id: 'p5', type: 'player', team: 'blue', number: '5', role: 'LB', x: 82, y: isPortrait ? 70 : 85, hX: 30, hY: 85 },
    { id: 'p6', type: 'player', team: 'blue', number: '6', role: 'CDM', x: 50, y: isPortrait ? 60 : 50, hX: 42, hY: 50 },
    { id: 'p7', type: 'player', team: 'blue', number: '8', role: 'CM', x: 32, y: isPortrait ? 50 : 30, hX: 56, hY: 30 },
    { id: 'p8', type: 'player', team: 'blue', number: '10', role: 'CAM', x: 68, y: isPortrait ? 50 : 70, hX: 56, hY: 70 },
    { id: 'p9', type: 'player', team: 'blue', number: '7', role: 'RW', x: 20, y: isPortrait ? 30 : 20, hX: 74, hY: 20 },
    { id: 'p10', type: 'player', team: 'blue', number: '11', role: 'LW', x: 80, y: isPortrait ? 30 : 80, hX: 74, hY: 80 },
    { id: 'p11', type: 'player', team: 'blue', number: '9', role: 'ST', x: 50, y: isPortrait ? 24 : 50, hX: 80, hY: 50 },
    { id: 'ball', type: 'ball', x: 50, y: isPortrait ? 50 : 50, hX: 50, hY: 50 },
  ];

  const [objects, setObjects] = useState(defaultPlayers);
  const [selectedObj, setSelectedObj] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);

  const svgRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Sistema de coordenadas táctiles dinámico (0 a 100)
  const getCoordinates = (e) => {
    if (!svgRef.current) return { x: 50, y: 50 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rawX = ((clientX - rect.left) / rect.width) * 100;
    const rawY = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(2, Math.min(98, rawX)),
      y: Math.max(2, Math.min(98, rawY))
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
    isDraggingRef.current = false;
    if (currentLine) {
      setDrawings((prev) => [...prev, { ...currentLine, id: Date.now() }]);
      setCurrentLine(null);
    }
  };

  const addElement = (type, team = 'red') => {
    const id = 'item-' + Date.now();
    let newItem;
    if (type === 'player') {
      const count = objects.filter(o => o.type === 'player' && o.team === team).length + 1;
      newItem = { id, type: 'player', team, number: String(count), x: 50, y: 50 };
    } else if (type === 'ball') {
      newItem = { id, type: 'ball', x: 50, y: 50 };
    } else {
      newItem = { id, type: 'cone', x: 50, y: 50 };
    }
    setObjects([...objects, newItem]);
  };

  const removeLast = () => {
    if (objects.length > 0) setObjects(objects.slice(0, -1));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1e7e1b] overflow-hidden select-none font-sans">
      {/* Barra Superior Minimalista (Exacta a la app de referencia) */}
      <header className="bg-black/90 px-3 py-1.5 flex items-center justify-between shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <img
            src="/logo-andez.png"
            alt="Logo"
            className="w-7 h-7 rounded-full object-cover border border-red-500"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="flex items-center gap-1">
            <span className="font-black text-white text-xs sm:text-sm tracking-wide">ANDEZ SPORTS</span>
            <span className="bg-red-600 text-[9px] font-black px-1.5 py-0.5 rounded text-white">PRO</span>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2">
          {/* Alternar Media Cancha */}
          <button
            onClick={() => setIsHalfPitch(!isHalfPitch)}
            className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border transition ${
              isHalfPitch ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-200'
            }`}
          >
            <CircleDot className="w-3.5 h-3.5" />
            <span className="text-[11px]">{isHalfPitch ? 'Entera' : 'Media Cancha'}</span>
          </button>

          {/* Limpiar trazos */}
          <button
            onClick={() => setDrawings([])}
            className="p-1.5 bg-zinc-800 border border-zinc-700 rounded text-amber-400"
            title="Borrar Trazos"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Guardar Ejercicio */}
          <button
            onClick={() => alert('¡Ejercicio guardado en Andez FC!')}
            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold flex items-center gap-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guardar</span>
          </button>
        </div>
      </header>

      {/* Cancha 100% Pantalla Completa Adaptable */}
      <main
        className="flex-1 w-full h-full flex items-center justify-center p-0 overflow-hidden touch-none relative bg-[#1e7e1b]"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <svg
          ref={svgRef}
          viewBox={
            isPortrait
              ? (isHalfPitch ? "0 50 100 50" : "0 0 100 100")
              : (isHalfPitch ? "50 0 50 100" : "0 0 100 100")
          }
          preserveAspectRatio="none"
          className="w-full h-full touch-none select-none"
          onPointerDown={handlePitchPointerDown}
        >
          {/* Fondo Césped Verde */}
          <rect width="100" height="100" fill="#228b22" />

          {/* Franjas de corte de pasto */}
          {isPortrait ? (
            [0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((y, i) => (
              i % 2 === 0 ? <rect key={y} x="0" y={y} width="100" height="10" fill="#1e7e1b" /> : null
            ))
          ) : (
            [0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((x, i) => (
              i % 2 === 0 ? <rect key={x} x={x} y="0" width="10" height="100" fill="#1e7e1b" /> : null
            ))
          )}

          {/* Cancha Vertical (Celular Vertical) */}
          {isPortrait ? (
            <>
              {/* Línea exterior */}
              <rect x="4" y="3" width="92" height="94" fill="none" stroke="white" strokeWidth="1" />
              {/* Línea media */}
              <line x1="4" y1="50" x2="96" y2="50" stroke="white" strokeWidth="1" />
              <circle cx="50" cy="50" r="11" fill="none" stroke="white" strokeWidth="1" />
              <circle cx="50" cy="50" r="1" fill="white" />

              {/* Área Norte */}
              <rect x="24" y="3" width="52" height="17" fill="none" stroke="white" strokeWidth="1" />
              <rect x="36" y="3" width="28" height="6" fill="none" stroke="white" strokeWidth="1" />
              <path d="M 40 20 A 10 10 0 0 0 60 20" fill="none" stroke="white" strokeWidth="1" />
              <rect x="42" y="0.8" width="16" height="2.2" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.8" />

              {/* Área Sur */}
              <rect x="24" y="80" width="52" height="17" fill="none" stroke="white" strokeWidth="1" />
              <rect x="36" y="91" width="28" height="6" fill="none" stroke="white" strokeWidth="1" />
              <path d="M 40 80 A 10 10 0 0 1 60 80" fill="none" stroke="white" strokeWidth="1" />
              <rect x="42" y="97" width="16" height="2.2" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.8" />
            </>
          ) : (
            /* Cancha Horizontal (Celular Horizontal) */
            <>
              {/* Línea exterior */}
              <rect x="3" y="4" width="94" height="92" fill="none" stroke="white" strokeWidth="1" />
              {/* Línea media */}
              <line x1="50" y1="4" x2="50" y2="96" stroke="white" strokeWidth="1" />
              <circle cx="50" cy="50" r="11" fill="none" stroke="white" strokeWidth="1" />
              <circle cx="50" cy="50" r="1" fill="white" />

              {/* Área Oeste */}
              <rect x="3" y="24" width="17" height="52" fill="none" stroke="white" strokeWidth="1" />
              <rect x="3" y="36" width="6" height="28" fill="none" stroke="white" strokeWidth="1" />
              <path d="M 20 40 A 10 10 0 0 1 20 60" fill="none" stroke="white" strokeWidth="1" />
              <rect x="0.8" y="42" width="2.2" height="16" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.8" />

              {/* Área Este */}
              <rect x="80" y="24" width="17" height="52" fill="none" stroke="white" strokeWidth="1" />
              <rect x="91" y="36" width="6" height="28" fill="none" stroke="white" strokeWidth="1" />
              <path d="M 80 40 A 10 10 0 0 0 80 60" fill="none" stroke="white" strokeWidth="1" />
              <rect x="97" y="42" width="2.2" height="16" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.8" />
            </>
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
              strokeWidth="1.6"
              strokeDasharray={d.type === 'run' ? '3,3' : 'none'}
            />
          ))}

          {currentLine && (
            <line
              x1={currentLine.start.x}
              y1={currentLine.start.y}
              x2={currentLine.end.x}
              y2={currentLine.end.y}
              stroke={currentLine.type === 'pass' ? '#facc15' : '#38bdf8'}
              strokeWidth="1.6"
              strokeDasharray={currentLine.type === 'run' ? '3,3' : 'none'}
            />
          )}

          {/* Fichas Interactivas y Balón */}
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
                    r="4"
                    fill={obj.role === 'GK' ? '#f59e0b' : obj.team === 'blue' ? '#2563eb' : '#dc2626'}
                    stroke="#ffffff"
                    strokeWidth="0.8"
                  />
                  <text
                    textAnchor="middle"
                    dy="1.4"
                    fontSize="3.2"
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
                  <circle r="2.8" fill="#ffffff" stroke="#111827" strokeWidth="0.5" />
                  <polygon points="0,-1 0.95,-0.31 0.59,0.81 -0.59,0.81 -0.95,-0.31" fill="#111827" />
                  <line x1="0" y1="-1" x2="0" y2="-2.6" stroke="#111827" strokeWidth="0.4" />
                  <line x1="0.95" y1="-0.31" x2="2.5" y2="-0.8" stroke="#111827" strokeWidth="0.4" />
                  <line x1="0.59" y1="0.81" x2="1.6" y2="2.2" stroke="#111827" strokeWidth="0.4" />
                  <line x1="-0.59" y1="0.81" x2="-1.6" y2="2.2" stroke="#111827" strokeWidth="0.4" />
                  <line x1="-0.95" y1="-0.31" x2="-2.5" y2="-0.8" stroke="#111827" strokeWidth="0.4" />
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
                  <polygon points="-2.5,2.5 2.5,2.5 0,-2.8" fill="#f97316" stroke="#fff" strokeWidth="0.5" />
                </g>
              );
            }
            return null;
          })}
        </svg>
      </main>

      {/* Barra Inferior Estilo Banco de Jugadores (Idéntica a la app de referencia) */}
      <footer className="bg-black/90 px-3 py-2 flex items-center justify-between shrink-0 z-30 shadow-lg">
        {/* Banco para sacar elementos */}
        <div className="flex items-center gap-3">
          {/* Jugador Azul */}
          <button
            onClick={() => addElement('player', 'blue')}
            className="flex items-center gap-1.5 active:scale-95 transition"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center font-black text-white text-xs shadow">
              +
            </div>
            <span className="text-[11px] font-bold text-blue-300">Azul</span>
          </button>

          {/* Jugador Rojo */}
          <button
            onClick={() => addElement('player', 'red')}
            className="flex items-center gap-1.5 active:scale-95 transition"
          >
            <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center font-black text-white text-xs shadow">
              +
            </div>
            <span className="text-[11px] font-bold text-red-300">Rojo</span>
          </button>

          {/* Balón */}
          <button
            onClick={() => addElement('ball')}
            className="flex items-center gap-1 active:scale-95 transition"
          >
            <div className="w-8 h-8 rounded-full bg-white border-2 border-zinc-800 flex items-center justify-center text-sm shadow">
              ⚽
            </div>
          </button>

          {/* Cono */}
          <button
            onClick={() => addElement('cone')}
            className="flex items-center gap-1 active:scale-95 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-orange-500 border border-white flex items-center justify-center text-white text-xs font-black shadow">
              ▲
            </div>
          </button>
        </div>

        {/* Modos de Trazo y Borrado */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTool('move')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
              tool === 'move' ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
          >
            Mover
          </button>
          <button
            onClick={() => setTool('pass')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
              tool === 'pass' ? 'bg-yellow-500 border-yellow-400 text-black font-black' : 'bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
          >
            Línea
          </button>
          <button
            onClick={() => setTool('run')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
              tool === 'run' ? 'bg-sky-400 border-sky-300 text-black font-black' : 'bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
          >
            Guion
          </button>
          <button
            onClick={removeLast}
            className="p-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-red-400"
            title="Quitar último elemento"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
