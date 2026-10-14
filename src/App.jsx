import React, { useState, useRef, useEffect } from 'react';
import {
  FolderOpen, ShieldCheck, Save, RotateCcw,
  Trash2, Play, Pause, ChevronRight, SplitSquareVertical,
  Plus, Smartphone, Users, ChevronLeft
} from 'lucide-react';

const CATEGORIES = [
  { id: 'sub10', name: 'Sub-8 a Sub-10' },
  { id: 'sub14', name: 'Sub-12 a Sub-14' },
  { id: 'sub18', name: 'Sub-16 a Juvenil' },
  { id: 'senior', name: 'Adulto / Senior' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('board');
  const [isHalfPitch, setIsHalfPitch] = useState(false);
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  const [tool, setTool] = useState('move'); // 'move', 'pass', 'run'
  
  // Detección automática de giro de pantalla
  useEffect(() => {
    const handleResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Coordenadas base en porcentaje (0 a 100)
  const initialElements = [
    { id: 'p1', type: 'player', team: 'home', number: '1', role: 'GK', x: 50, y: 8 },
    { id: 'p2', type: 'player', team: 'home', number: '4', role: 'CB', x: 35, y: 22 },
    { id: 'p3', type: 'player', team: 'home', number: '3', role: 'CB', x: 65, y: 22 },
    { id: 'p4', type: 'player', team: 'home', number: '2', role: 'RB', x: 18, y: 28 },
    { id: 'p5', type: 'player', team: 'home', number: '5', role: 'LB', x: 82, y: 28 },
    { id: 'p6', type: 'player', team: 'home', number: '6', role: 'CDM', x: 50, y: 40 },
    { id: 'p7', type: 'player', team: 'home', number: '8', role: 'CM', x: 32, y: 54 },
    { id: 'p8', type: 'player', team: 'home', number: '10', role: 'CAM', x: 68, y: 54 },
    { id: 'p9', type: 'player', team: 'home', number: '7', role: 'RW', x: 22, y: 72 },
    { id: 'p10', type: 'player', team: 'home', number: '11', role: 'LW', x: 78, y: 72 },
    { id: 'p11', type: 'player', team: 'home', number: '9', role: 'ST', x: 50, y: 78 },
    { id: 'ball1', type: 'ball', x: 50, y: 48 },
    { id: 'c1', type: 'cone', x: 42, y: 45 },
    { id: 'c2', type: 'cone', x: 58, y: 45 },
  ];

  const [objects, setObjects] = useState(initialElements);
  const [selectedObj, setSelectedObj] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);

  const [history, setHistory] = useState([initialElements]);
  const [historyStep, setHistoryStep] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [frames, setFrames] = useState([initialElements]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);

  const svgRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Conversión táctil / ratón precisa
  const getCoordinates = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(3, Math.min(97, x)),
      y: Math.max(3, Math.min(97, y))
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

  const redo = () => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      setHistoryStep(nextStep);
      setObjects(JSON.parse(JSON.stringify(history[nextStep])));
    }
  };

  const addPlayer = (team) => {
    const id = 'p-' + Date.now();
    const count = objects.filter(o => o.type === 'player' && o.team === team).length + 1;
    const newItem = {
      id,
      type: 'player',
      team,
      number: String(count),
      role: 'JUG',
      x: 50,
      y: 50
    };
    setObjects([...objects, newItem]);
  };

  const addBall = () => {
    setObjects([...objects, { id: 'ball-' + Date.now(), type: 'ball', x: 50, y: 50 }]);
  };

  const addCone = () => {
    setObjects([...objects, { id: 'cone-' + Date.now(), type: 'cone', x: 50, y: 50 }]);
  };

  const removeLast = () => {
    if (objects.length > 0) {
      setObjects(objects.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d131f] text-white overflow-hidden select-none font-sans">
      {/* Barra Superior Profesional */}
      <header className="bg-slate-950/90 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2">
          <img
            src="/logo-andez.png"
            alt="Andez Logo"
            className="w-7 h-7 rounded-full object-cover border border-red-500 shadow"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="flex items-center gap-1">
            <span className="font-black text-xs sm:text-sm tracking-wide text-white">ANDEZ SPORTS</span>
            <span className="bg-red-600 text-[9px] font-black px-1.5 py-0.5 rounded text-white">FC</span>
          </div>
        </div>

        {/* Botones de acción rápida estilo Coach Board */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setIsHalfPitch(!isHalfPitch)}
            className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border transition ${
              isHalfPitch ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
            title="Alternar Cancha Completa / Media Cancha"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isHalfPitch ? 'Cancha Entera' : 'Media Cancha'}</span>
          </button>

          <button
            onClick={undo}
            disabled={historyStep <= 0}
            className="p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-300 disabled:opacity-30"
            title="Deshacer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
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

      {/* Área Central: Cancha adaptable automática */}
      <main
        className="flex-1 bg-slate-950 flex items-center justify-center p-1 sm:p-2 overflow-hidden touch-none relative"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="w-full h-full flex items-center justify-center max-w-full max-h-full">
          <svg
            ref={svgRef}
            viewBox={
              isPortrait
                ? (isHalfPitch ? "0 50 100 50" : "0 0 100 100")
                : (isHalfPitch ? "50 0 50 100" : "0 0 100 100")
            }
            className="w-full h-full shadow-2xl rounded-lg touch-none select-none"
            style={{
              aspectRatio: isPortrait
                ? (isHalfPitch ? '1 / 1' : '68 / 105')
                : (isHalfPitch ? '1 / 1' : '105 / 68'),
              maxHeight: '100%',
              maxWidth: '100%'
            }}
            onPointerDown={handlePitchPointerDown}
          >
            {/* Fondo Verde Césped */}
            <rect width="100" height="100" fill="#2e9e2b" />
            
            {/* Franjas sutiles del césped */}
            {isPortrait ? (
              [0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((y, idx) => (
                idx % 2 === 0 ? <rect key={y} x="0" y={y} width="100" height="10" fill="#288d25" /> : null
              ))
            ) : (
              [0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((x, idx) => (
                idx % 2 === 0 ? <rect key={x} x={x} y="0" width="10" height="100" fill="#288d25" /> : null
              ))
            )}

            {/* Dibujo de Cancha: Si es Vertical */}
            {isPortrait ? (
              <>
                {/* Bordes */}
                <rect x="5" y="4" width="90" height="92" fill="none" stroke="white" strokeWidth="1" />
                {/* Mitad de cancha */}
                <line x1="5" y1="50" x2="95" y2="50" stroke="white" strokeWidth="1" />
                <circle cx="50" cy="50" r="11" fill="none" stroke="white" strokeWidth="1" />
                <circle cx="50" cy="50" r="0.9" fill="white" />

                {/* Área Penal Superior */}
                <rect x="25" y="4" width="50" height="16" fill="none" stroke="white" strokeWidth="1" />
                <rect x="36" y="4" width="28" height="6" fill="none" stroke="white" strokeWidth="1" />
                <path d="M 40 20 A 10 10 0 0 0 60 20" fill="none" stroke="white" strokeWidth="1" />
                {/* Arco Superior */}
                <rect x="42" y="1.5" width="16" height="2.5" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.8" />

                {/* Área Penal Inferior */}
                <rect x="25" y="80" width="50" height="16" fill="none" stroke="white" strokeWidth="1" />
                <rect x="36" y="90" width="28" height="6" fill="none" stroke="white" strokeWidth="1" />
                <path d="M 40 80 A 10 10 0 0 1 60 80" fill="none" stroke="white" strokeWidth="1" />
                {/* Arco Inferior */}
                <rect x="42" y="96" width="16" height="2.5" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.8" />
              </>
            ) : (
              /* Dibujo de Cancha: Si es Horizontal */
              <>
                <rect x="4" y="5" width="92" height="90" fill="none" stroke="white" strokeWidth="1" />
                <line x1="50" y1="5" x2="50" y2="95" stroke="white" strokeWidth="1" />
                <circle cx="50" cy="50" r="11" fill="none" stroke="white" strokeWidth="1" />
                <circle cx="50" cy="50" r="0.9" fill="white" />

                {/* Área Izquierda */}
                <rect x="4" y="25" width="16" height="50" fill="none" stroke="white" strokeWidth="1" />
                <rect x="4" y="36" width="6" height="28" fill="none" stroke="white" strokeWidth="1" />
                <path d="M 20 40 A 10 10 0 0 1 20 60" fill="none" stroke="white" strokeWidth="1" />
                <rect x="1.5" y="42" width="2.5" height="16" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.8" />

                {/* Área Derecha */}
                <rect x="80" y="25" width="16" height="50" fill="none" stroke="white" strokeWidth="1" />
                <rect x="90" y="36" width="6" height="28" fill="none" stroke="white" strokeWidth="1" />
                <path d="M 80 40 A 10 10 0 0 0 80 60" fill="none" stroke="white" strokeWidth="1" />
                <rect x="96" y="42" width="2.5" height="16" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.8" />
              </>
            )}

            {/* Trazos tácticos */}
            {drawings.map((d) => (
              <line
                key={d.id}
                x1={d.start.x}
                y1={d.start.y}
                x2={d.end.x}
                y2={d.end.y}
                stroke={d.type === 'pass' ? '#facc15' : '#38bdf8'}
                strokeWidth="1.5"
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
                strokeWidth="1.5"
                strokeDasharray={currentLine.type === 'run' ? '2.5,2.5' : 'none'}
              />
            )}

            {/* Fichas, Jugadores y Pelota Real */}
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
                      r="3.5"
                      fill={obj.role === 'GK' ? '#f59e0b' : obj.team === 'home' ? '#dc2626' : '#2563eb'}
                      stroke="#ffffff"
                      strokeWidth="0.7"
                    />
                    <text
                      textAnchor="middle"
                      dy="1.2"
                      fontSize="2.6"
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
                    {/* Balón Clásico Tipo Telstar */}
                    <circle r="2.4" fill="#ffffff" stroke="#111827" strokeWidth="0.4" />
                    {/* Pentágono Central */}
                    <polygon points="0,-0.8 0.76,-0.25 0.47,0.65 -0.47,0.65 -0.76,-0.25" fill="#111827" />
                    {/* Costuras */}
                    <line x1="0" y1="-0.8" x2="0" y2="-2.3" stroke="#111827" strokeWidth="0.35" />
                    <line x1="0.76" y1="-0.25" x2="2.1" y2="-0.7" stroke="#111827" strokeWidth="0.35" />
                    <line x1="0.47" y1="0.65" x2="1.4" y2="1.9" stroke="#111827" strokeWidth="0.35" />
                    <line x1="-0.47" y1="0.65" x2="-1.4" y2="1.9" stroke="#111827" strokeWidth="0.35" />
                    <line x1="-0.76" y1="-0.25" x2="-2.1" y2="-0.7" stroke="#111827" strokeWidth="0.35" />
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
                    <polygon points="-2.2,2.2 2.2,2.2 0,-2.5" fill="#f97316" stroke="#fff" strokeWidth="0.5" />
                    <line x1="-1.2" y1="0.6" x2="1.2" y2="0.6" stroke="#ffffff" strokeWidth="0.4" />
                  </g>
                );
              }
              return null;
            })}
          </svg>
        </div>
      </main>

      {/* Barra Inferior Estilo Banco de Jugadores (como tu captura) */}
      <footer className="bg-slate-950/95 border-t border-slate-800 px-3 py-2 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2">
          {/* Ficha Azul Rápida */}
          <button
            onClick={() => addPlayer('away')}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-full text-xs font-bold text-blue-400 active:scale-95 transition"
          >
            <div className="w-5 h-5 rounded-full bg-blue-600 border border-white flex items-center justify-center text-[10px] text-white font-bold">+</div>
            <span>Azul</span>
          </button>

          {/* Ficha Roja Rápida */}
          <button
            onClick={() => addPlayer('home')}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-full text-xs font-bold text-red-400 active:scale-95 transition"
          >
            <div className="w-5 h-5 rounded-full bg-red-600 border border-white flex items-center justify-center text-[10px] text-white font-bold">+</div>
            <span>Rojo</span>
          </button>

          {/* Balón Rápido */}
          <button
            onClick={addBall}
            className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded-full text-xs font-bold text-white active:scale-95 transition"
          >
            ⚽ <span>Balón</span>
          </button>

          {/* Cono */}
          <button
            onClick={addCone}
            className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded-full text-xs font-bold text-orange-400 active:scale-95 transition"
          >
            ▲ <span>Cono</span>
          </button>
        </div>

        {/* Herramientas de trazo */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTool('move')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
              tool === 'move' ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            Mover
          </button>
          <button
            onClick={() => setTool('pass')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
              tool === 'pass' ? 'bg-yellow-500 border-yellow-400 text-slate-950 font-black' : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            Pase
          </button>
          <button
            onClick={() => setTool('run')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
              tool === 'run' ? 'bg-sky-500 border-sky-400 text-slate-950 font-black' : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            Carrera
          </button>
          <button
            onClick={removeLast}
            className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-red-400"
            title="Quitar último elemento"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
