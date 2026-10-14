import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCcw, Trash2, Save, Undo2, Redo2,
  FolderOpen, ShieldCheck, CircleDot
} from 'lucide-react';

export default function App() {
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  const [isHalfPitch, setIsHalfPitch] = useState(false);
  const [tool, setTool] = useState('move'); // 'move', 'pass', 'run'

  // Detección automática y precisa de orientación
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

  // Coordenadas fijas en sistema FIFA: 
  // Vertical: 68 ancho x 105 alto
  // Horizontal: 105 ancho x 68 alto
  const initialPlayersVertical = [
    { id: 'p1', type: 'player', team: 'blue', number: '1', role: 'GK', x: 34, y: 96 },
    { id: 'p2', type: 'player', team: 'blue', number: '4', role: 'CB', x: 24, y: 82 },
    { id: 'p3', type: 'player', team: 'blue', number: '3', role: 'CB', x: 44, y: 82 },
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

  const initialPlayersHorizontal = [
    { id: 'p1', type: 'player', team: 'blue', number: '1', role: 'GK', x: 8, y: 34 },
    { id: 'p2', type: 'player', team: 'blue', number: '4', role: 'CB', x: 22, y: 24 },
    { id: 'p3', type: 'player', team: 'blue', number: '3', role: 'CB', x: 22, y: 44 },
    { id: 'p4', type: 'player', team: 'blue', number: '2', role: 'RB', x: 30, y: 12 },
    { id: 'p5', type: 'player', team: 'blue', number: '5', role: 'LB', x: 30, y: 56 },
    { id: 'p6', type: 'player', team: 'blue', number: '6', role: 'CDM', x: 40, y: 34 },
    { id: 'p7', type: 'player', team: 'blue', number: '8', role: 'CM', x: 52, y: 22 },
    { id: 'p8', type: 'player', team: 'blue', number: '10', role: 'CAM', x: 52, y: 46 },
    { id: 'p9', type: 'player', team: 'blue', number: '7', role: 'RW', x: 74, y: 14 },
    { id: 'p10', type: 'player', team: 'blue', number: '11', role: 'LW', x: 74, y: 54 },
    { id: 'p11', type: 'player', team: 'blue', number: '9', role: 'ST', x: 80, y: 34 },
    { id: 'ball', type: 'ball', x: 52.5, y: 34 },
  ];

  const [objects, setObjects] = useState(isPortrait ? initialPlayersVertical : initialPlayersHorizontal);
  const [selectedObj, setSelectedObj] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);

  const svgRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Al rotar la pantalla acomodamos la formación sin distorsión
  useEffect(() => {
    setObjects(isPortrait ? initialPlayersVertical : initialPlayersHorizontal);
    setDrawings([]);
  }, [isPortrait]);

  // Conversión exacta con escala natural y sin distorsión
  const getPitchCoordinates = (e) => {
    if (!svgRef.current) return { x: 34, y: 52 };
    const pt = svgRef.current.createSVGPoint();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    pt.x = clientX;
    pt.y = clientY;
    const cursorPt = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
    return {
      x: cursorPt.x,
      y: cursorPt.y
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
    const coords = getPitchCoordinates(e);
    setCurrentLine({ start: coords, end: coords, type: tool });
  };

  const handlePointerMove = (e) => {
    if (isDraggingRef.current && selectedObj) {
      if (e.cancelable) e.preventDefault();
      const coords = getPitchCoordinates(e);
      setObjects((prev) =>
        prev.map((o) => (o.id === selectedObj.id ? { ...o, x: coords.x, y: coords.y } : o))
      );
    } else if (currentLine) {
      if (e.cancelable) e.preventDefault();
      const coords = getPitchCoordinates(e);
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
    const basePos = isPortrait ? { x: 34, y: 52 } : { x: 52.5, y: 34 };
    if (type === 'player') {
      const count = objects.filter(o => o.type === 'player' && o.team === team).length + 1;
      newItem = { id, type: 'player', team, number: String(count), ...basePos };
    } else if (type === 'ball') {
      newItem = { id, type: 'ball', ...basePos };
    } else {
      newItem = { id, type: 'cone', ...basePos };
    }
    setObjects([...objects, newItem]);
  };

  const removeLast = () => {
    if (objects.length > 0) setObjects(objects.slice(0, -1));
  };

  // Dimensiones reglamentarias del viewBox
  // Vertical: 0 0 68 105 | Media Cancha: 0 0 68 55
  // Horizontal: 0 0 105 68 | Media Cancha: 0 0 55 68
  const getViewBox = () => {
    if (isPortrait) {
      return isHalfPitch ? "0 0 68 55" : "0 0 68 105";
    } else {
      return isHalfPitch ? "0 0 55 68" : "0 0 105 68";
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1b6b17] overflow-hidden select-none font-sans">
      {/* Cabecera Superior */}
      <header className="bg-slate-950/95 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between shrink-0 z-30 shadow-md">
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

        {/* Acciones de Pizarra */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHalfPitch(!isHalfPitch)}
            className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 border transition ${
              isHalfPitch ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            <CircleDot className="w-3.5 h-3.5" />
            <span>{isHalfPitch ? 'Cancha Entera' : 'Media Cancha'}</span>
          </button>

          <button
            onClick={() => setDrawings([])}
            className="p-1.5 bg-slate-900 border border-slate-700 rounded text-amber-400"
            title="Borrar líneas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => alert('¡Ejercicio guardado en Andez FC!')}
            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold flex items-center gap-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guardar</span>
          </button>
        </div>
      </header>

      {/* Visor de Cancha: Aspect Ratio Proporcional Perfecto */}
      <main
        className="flex-1 w-full h-full flex items-center justify-center p-1 sm:p-2 overflow-hidden touch-none relative bg-[#1b6b17]"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <svg
          ref={svgRef}
          viewBox={getViewBox()}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full touch-none select-none max-h-full max-w-full drop-shadow-xl"
          onPointerDown={handlePitchPointerDown}
        >
          {/* Fondo Césped Verde */}
          <rect width="200" height="200" x="-50" y="-50" fill="#228b22" />

          {/* DIBUJO CANCHA VERTICAL */}
          {isPortrait && (
            <g>
              {/* Franjas Césped */}
              {[0, 10.5, 21, 31.5, 42, 52.5, 63, 73.5, 84, 94.5].map((y, idx) => (
                idx % 2 === 0 ? <rect key={y} x="0" y={y} width="68" height="10.5" fill="#1e7e1b" /> : null
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
              <path d="M 27.5 18.5 A 9.15 9.15 0 0 0 40.5 18.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="30.34" y="0.2" width="7.32" height="1.8" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />

              {/* Área Penal Sur */}
              <rect x="13.84" y="86.5" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="24.84" y="97.5" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.8" />
              <path d="M 27.5 86.5 A 9.15 9.15 0 0 1 40.5 86.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="30.34" y="103" width="7.32" height="1.8" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />
            </g>
          )}

          {/* DIBUJO CANCHA HORIZONTAL */}
          {!isPortrait && (
            <g>
              {/* Franjas Césped */}
              {[0, 10.5, 21, 31.5, 42, 52.5, 63, 73.5, 84, 94.5].map((x, idx) => (
                idx % 2 === 0 ? <rect key={x} x={x} y="0" width="10.5" height="68" fill="#1e7e1b" /> : null
              ))}

              {/* Líneas Perimetrales */}
              <rect x="2" y="2" width="101" height="64" fill="none" stroke="white" strokeWidth="0.8" />
              {/* Línea Central */}
              <line x1="52.5" y1="2" x2="52.5" y2="66" stroke="white" strokeWidth="0.8" />
              <circle cx="52.5" cy="34" r="9.15" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="52.5" cy="34" r="0.6" fill="white" />

              {/* Área Penal Oeste */}
              <rect x="2" y="13.84" width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="2" y="24.84" width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.8" />
              <path d="M 18.5 27.5 A 9.15 9.15 0 0 1 18.5 40.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="0.2" y="30.34" width="1.8" height="7.32" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />

              {/* Área Penal Este */}
              <rect x="86.5" y="13.84" width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="97.5" y="24.84" width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.8" />
              <path d="M 86.5 27.5 A 9.15 9.15 0 0 0 86.5 40.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="103" y="30.34" width="1.8" height="7.32" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />
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

          {/* Fichas y Balón Redondos Perfectos */}
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

      {/* Banco Inferior: Fichas, Balón y Herramientas */}
      <footer className="bg-slate-950/95 border-t border-slate-800 px-3 py-1.5 flex items-center justify-between shrink-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
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

        {/* Trazos y Borrar */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTool('move')}
            className={`px-2.5 py-1 rounded text-xs font-bold border transition ${
              tool === 'move' ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            Mover
          </button>
          <button
            onClick={() => setTool('pass')}
            className={`px-2.5 py-1 rounded text-xs font-bold border transition ${
              tool === 'pass' ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            Línea
          </button>
          <button
            onClick={() => setTool('run')}
            className={`px-2.5 py-1 rounded text-xs font-bold border transition ${
              tool === 'run' ? 'bg-sky-400 border-sky-300 text-black' : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            Guion
          </button>
          <button
            onClick={removeLast}
            className="p-1 bg-slate-900 border border-slate-700 rounded text-red-400"
            title="Quitar último elemento"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
