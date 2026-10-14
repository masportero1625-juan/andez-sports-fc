import React, { useState, useRef, useEffect } from 'react';
import {
  Layers, FolderOpen, ShieldCheck, ShieldAlert,
  ChevronDown, ChevronUp, RotateCcw
} from 'lucide-react';

const CATEGORIES = [
  { id: 'sub10', name: 'Sub-8 a Sub-10 (Iniciación)' },
  { id: 'sub14', name: 'Sub-12 a Sub-14 (Formación)' },
  { id: 'sub18', name: 'Sub-16 a Juvenil (Especialización)' },
  { id: 'senior', name: 'Adulto / Senior (Rendimiento)' },
];

const INITIAL_PLAYERS = [
  { id: 'p1', type: 'player', team: 'home', number: '1', role: 'GK', x: 8, y: 50 },
  { id: 'p2', type: 'player', team: 'home', number: '4', role: 'CB', x: 22, y: 35 },
  { id: 'p3', type: 'player', team: 'home', number: '3', role: 'CB', x: 22, y: 65 },
  { id: 'p4', type: 'player', team: 'home', number: '2', role: 'RB', x: 28, y: 16 },
  { id: 'p5', type: 'player', team: 'home', number: '5', role: 'LB', x: 28, y: 84 },
  { id: 'p6', type: 'player', team: 'home', number: '6', role: 'CDM', x: 40, y: 50 },
  { id: 'p7', type: 'player', team: 'home', number: '8', role: 'CM', x: 55, y: 30 },
  { id: 'p8', type: 'player', team: 'home', number: '10', role: 'CAM', x: 55, y: 70 },
  { id: 'p9', type: 'player', team: 'home', number: '7', role: 'RW', x: 74, y: 20 },
  { id: 'p10', type: 'player', team: 'home', number: '11', role: 'LW', x: 74, y: 80 },
  { id: 'p11', type: 'player', team: 'home', number: '9', role: 'ST', x: 80, y: 50 },
  { id: 'ball1', type: 'ball', x: 48, y: 50 },
  { id: 'c1', type: 'cone', x: 45, y: 38 },
  { id: 'c2', type: 'cone', x: 45, y: 62 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('board');
  const [selectedCategory, setSelectedCategory] = useState('sub14');
  const [tool, setTool] = useState('select');
  const [showToolsMobile, setShowToolsMobile] = useState(false);
  
  const [objects, setObjects] = useState(INITIAL_PLAYERS);
  const [selectedObj, setSelectedObj] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  
  const [frames, setFrames] = useState([INITIAL_PLAYERS]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [drillTitle, setDrillTitle] = useState('Salida de Balón y Transición');
  const [savedDrills, setSavedDrills] = useState([
    {
      id: 'd1',
      title: 'Rondo 4v2 con Tercer Hombre',
      category: 'sub10',
      date: '2026-10-08',
      objects: INITIAL_PLAYERS
    },
    {
      id: 'd2',
      title: 'Basculación y Pressing Alto',
      category: 'sub14',
      date: '2026-10-09',
      objects: INITIAL_PLAYERS
    }
  ]);

  const [connectedDevices, setConnectedDevices] = useState([
    { id: 'dev-1', name: 'Smartphone (Cancha)', type: 'mobile', active: true, lastSeen: 'Ahora' },
    { id: 'dev-2', name: 'Notebook Windows (Casa)', type: 'pc', active: true, lastSeen: 'Hace 5m' }
  ]);
  const [deviceAlert, setDeviceAlert] = useState(false);

  const [adminLicenses, setAdminLicenses] = useState([
    { id: 'lic-1', coach: 'Prof. Carlos Morales', club: 'Escuela Los Andes', code: 'AND-PRO-01', seats: 2, used: 2, status: 'active', plan: 'Club Dúo (\$25.000)' },
    { id: 'lic-2', coach: 'DT Matías Soto', club: 'Academia Biobío', code: 'AND-PRO-02', seats: 2, used: 1, status: 'active', plan: 'Coach Single (\$15.000)' },
  ]);

  const svgRef = useRef(null);
  const isDraggingRef = useRef(false);

  const getSVGCoordinates = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * 105;
    const y = ((clientY - rect.top) / rect.height) * 68;
    return { x: Math.max(2, Math.min(103, x)), y: Math.max(2, Math.min(66, y)) };
  };

  const handlePointerDown = (e, obj) => {
    e.stopPropagation();
    if (tool !== 'select') return;
    setSelectedObj(obj);
    isDraggingRef.current = true;
  };

  const handlePitchPointerDown = (e) => {
    if (tool === 'select') {
      setSelectedObj(null);
      return;
    }
    const coords = getSVGCoordinates(e);
    setCurrentLine({ start: coords, end: coords, type: tool });
  };

  const handlePointerMove = (e) => {
    if (isDraggingRef.current && selectedObj) {
      if (e.cancelable) e.preventDefault();
      const coords = getSVGCoordinates(e);
      setObjects((prev) =>
        prev.map((o) => (o.id === selectedObj.id ? { ...o, x: coords.x, y: coords.y } : o))
      );
    } else if (currentLine) {
      if (e.cancelable) e.preventDefault();
      const coords = getSVGCoordinates(e);
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

  const captureFrame = () => {
    const newFrames = [...frames, JSON.parse(JSON.stringify(objects))];
    setFrames(newFrames);
    setActiveFrameIndex(newFrames.length - 1);
  };

  useEffect(() => {
    let interval;
    if (isPlaying && frames.length > 1) {
      interval = setInterval(() => {
        setActiveFrameIndex((prev) => {
          const next = (prev + 1) % frames.length;
          setObjects(frames[next]);
          return next;
        });
      }, 900);
    }
    return () => clearInterval(interval);
  }, [isPlaying, frames]);

  const handleSaveDrill = () => {
    const newDrill = {
      id: 'd-' + Date.now(),
      title: drillTitle,
      category: selectedCategory,
      date: new Date().toISOString().split('T')[0],
      objects: JSON.parse(JSON.stringify(objects))
    };
    setSavedDrills([newDrill, ...savedDrills]);
    alert('¡Sesión guardada exitosamente!');
  };

  const addItem = (type, team = 'home') => {
    const id = 'item-' + Date.now();
    let newItem;
    if (type === 'player') {
      newItem = { id, type: 'player', team, number: String(objects.filter(o => o.type==='player').length + 1), role: 'JUG', x: 52.5, y: 34 };
    } else if (type === 'ball') {
      newItem = { id, type: 'ball', x: 52.5, y: 34 };
    } else {
      newItem = { id, type: 'cone', x: 52.5, y: 34 };
    }
    setObjects([...objects, newItem]);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Cabecera */}
      <header className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2">
          <img
            src="/logo-andez.png"
            alt="Logo"
            className="w-7 h-7 rounded-full object-cover border border-red-500 shadow"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="flex items-center gap-1.5">
            <span className="font-black tracking-wider text-xs sm:text-base text-white">ANDEZ SPORTS</span>
            <span className="bg-red-600 text-[9px] font-black px-1.5 py-0.5 rounded text-white">FC</span>
          </div>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('board')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              activeTab === 'board' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3" /> Pizarra
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              activeTab === 'library' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderOpen className="w-3 h-3" /> Sesiones
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              activeTab === 'admin' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3 h-3" /> Dueño
          </button>
        </div>

        {activeTab === 'board' && (
          <button
            onClick={() => setShowToolsMobile(!showToolsMobile)}
            className="md:hidden flex items-center gap-1 bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg text-xs font-bold text-slate-200"
          >
            Herramientas {showToolsMobile ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </header>

      {/* Pizarra Táctica */}
      {activeTab === 'board' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Panel Lateral */}
          <aside
            className={`${
              showToolsMobile ? 'flex' : 'hidden'
            } md:flex w-full md:w-72 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 p-3 flex-col gap-2.5 overflow-y-auto shrink-0 z-30 absolute md:relative inset-x-0 top-0 max-h-[85vh] md:max-h-full shadow-2xl md:shadow-none`}
          >
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Categoría</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Ejercicio</label>
              <input
                type="text"
                value={drillTitle}
                onChange={(e) => setDrillTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Acciones</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => { setTool('select'); setShowToolsMobile(false); }}
                  className={`p-1.5 rounded-lg text-xs font-semibold border ${tool === 'select' ? 'bg-red-600 text-white' : 'bg-slate-950 text-slate-300'}`}
                >
                  Mover Fichas
                </button>
                <button
                  onClick={() => { setTool('pass'); setShowToolsMobile(false); }}
                  className={`p-1.5 rounded-lg text-xs font-semibold border ${tool === 'pass' ? 'bg-red-600 text-white' : 'bg-slate-950 text-slate-300'}`}
                >
                  Pase (Línea)
                </button>
                <button
                  onClick={() => { setTool('run'); setShowToolsMobile(false); }}
                  className={`p-1.5 rounded-lg text-xs font-semibold border ${tool === 'run' ? 'bg-red-600 text-white' : 'bg-slate-950 text-slate-300'}`}
                >
                  Desmarque (- -)
                </button>
                <button
                  onClick={() => setDrawings([])}
                  className="p-1.5 rounded-lg text-xs font-semibold bg-slate-950 border border-slate-800 text-red-400"
                >
                  Limpiar Trazos
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Agregar</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => addItem('player', 'home')} className="py-1 bg-red-600/30 text-red-300 border border-red-600 text-xs font-bold rounded-lg">+ Rojo</button>
                <button onClick={() => addItem('player', 'away')} className="py-1 bg-blue-600/30 text-blue-300 border border-blue-600 text-xs font-bold rounded-lg">+ Azul</button>
                <button onClick={() => addItem('ball')} className="py-1 bg-amber-600/30 text-amber-300 border border-amber-600 text-xs font-bold rounded-lg">+ Balón</button>
                <button onClick={() => addItem('cone')} className="py-1 bg-orange-600/30 text-orange-300 border border-orange-600 text-xs font-bold rounded-lg">+ Cono</button>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold">Animación</span>
                <span className="text-[10px] text-slate-400">{activeFrameIndex + 1}/{frames.length}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold ${isPlaying ? 'bg-amber-600' : 'bg-emerald-600'}`}
                >
                  {isPlaying ? 'Pausa' : 'Play'}
                </button>
                <button onClick={captureFrame} className="py-1 px-2.5 bg-slate-800 text-xs font-bold rounded-lg">+ Paso</button>
              </div>
            </div>

            <button
              onClick={handleSaveDrill}
              className="w-full py-2 bg-red-600 hover:bg-red-500 font-bold text-xs uppercase tracking-wider rounded-xl shadow mt-0.5"
            >
              Guardar Ejercicio
            </button>
          </aside>

          {/* Contenedor Cancha Proporción Real FIFA 105x68 */}
          <main
            className="flex-1 bg-slate-950 flex items-center justify-center p-2 sm:p-4 overflow-hidden touch-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div className="w-full h-full max-h-full max-w-full flex items-center justify-center">
              <svg
                ref={svgRef}
                viewBox="0 0 105 68"
                className="w-full h-full max-h-full max-w-full rounded-xl border-2 sm:border-4 border-slate-700 shadow-2xl relative z-10 cursor-crosshair touch-none select-none"
                style={{ aspectRatio: '105 / 68', objectFit: 'contain' }}
                onPointerDown={handlePitchPointerDown}
              >
                {/* Césped con franjas realistas */}
                <defs>
                  <pattern id="grassStripes" width="10.5" height="68" patternUnits="userSpaceOnUse">
                    <rect width="5.25" height="68" fill="#1b4d3e" />
                    <rect x="5.25" width="5.25" height="68" fill="#1e5645" />
                  </pattern>
                </defs>
                <rect width="105" height="68" fill="url(#grassStripes)" />

                {/* Límites de la Cancha */}
                <rect x="4" y="4" width="97" height="60" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="0.7" />
                <line x1="52.5" y1="4" x2="52.5" y2="64" stroke="rgba(255,255,255,0.85)" strokeWidth="0.7" />
                
                {/* Círculo y punto central */}
                <circle cx="52.5" cy="34" r="9.15" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="0.7" />
                <circle cx="52.5" cy="34" r="0.6" fill="white" />

                {/* Área Grande Izquierda y Derecha */}
                <rect x="4" y="13.84" width="16.5" height="40.32" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="0.7" />
                <rect x="84.5" y="13.84" width="16.5" height="40.32" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="0.7" />

                {/* Área Chica Izquierda y Derecha */}
                <rect x="4" y="24.84" width="5.5" height="18.32" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="0.7" />
                <rect x="95.5" y="24.84" width="5.5" height="18.32" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="0.7" />

                {/* Arcos */}
                <rect x="1.8" y="30.34" width="2.2" height="7.32" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.6" />
                <rect x="101" y="30.34" width="2.2" height="7.32" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.6" />

                {/* Trazos tácticos */}
                {drawings.map((d) => (
                  <line
                    key={d.id}
                    x1={d.start.x}
                    y1={d.start.y}
                    x2={d.end.x}
                    y2={d.end.y}
                    stroke={d.type === 'pass' ? '#facc15' : '#38bdf8'}
                    strokeWidth="0.9"
                    strokeDasharray={d.type === 'run' ? '1.5,1.5' : 'none'}
                  />
                ))}

                {currentLine && (
                  <line
                    x1={currentLine.start.x}
                    y1={currentLine.start.y}
                    x2={currentLine.end.x}
                    y2={currentLine.end.y}
                    stroke={currentLine.type === 'pass' ? '#facc15' : '#38bdf8'}
                    strokeWidth="0.9"
                    strokeDasharray={currentLine.type === 'run' ? '1.5,1.5' : 'none'}
                  />
                )}

                {/* Fichas Interactivas */}
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
                          r="2.2"
                          fill={obj.role === 'GK' ? '#eab308' : obj.team === 'home' ? '#dc2626' : '#2563eb'}
                          stroke="#ffffff"
                          strokeWidth="0.45"
                        />
                        <text
                          textAnchor="middle"
                          dy="0.75"
                          fontSize="1.6"
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
                        {/* Balón de fútbol detallado con gajos */}
                        <circle r="1.4" fill="#ffffff" stroke="#111827" strokeWidth="0.25" />
                        {/* Pentágono central negro */}
                        <polygon points="0,-0.45 0.42,-0.14 0.26,0.36 -0.26,0.36 -0.42,-0.14" fill="#111827" />
                        {/* Líneas de costura hacia el exterior */}
                        <line x1="0" y1="-0.45" x2="0" y2="-1.3" stroke="#111827" strokeWidth="0.2" />
                        <line x1="0.42" y1="-0.14" x2="1.2" y2="-0.4" stroke="#111827" strokeWidth="0.2" />
                        <line x1="0.26" y1="0.36" x2="0.8" y2="1.1" stroke="#111827" strokeWidth="0.2" />
                        <line x1="-0.26" y1="0.36" x2="-0.8" y2="1.1" stroke="#111827" strokeWidth="0.2" />
                        <line x1="-0.42" y1="-0.14" x2="-1.2" y2="-0.4" stroke="#111827" strokeWidth="0.2" />
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
                        <polygon points="-1.4,1.4 1.4,1.4 0,-1.5" fill="#f97316" stroke="#fff" strokeWidth="0.3" />
                        <line x1="-0.8" y1="0.3" x2="0.8" y2="0.3" stroke="#ffffff" strokeWidth="0.25" />
                      </g>
                    );
                  }
                  return null;
                })}
              </svg>
            </div>
          </main>
        </div>
      )}

      {/* Biblioteca */}
      {activeTab === 'library' && (
        <div className="flex-1 p-4 max-w-5xl mx-auto w-full overflow-y-auto">
          <h2 className="text-xl font-black mb-4">Biblioteca de Sesiones</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedDrills.map((d) => (
              <div key={d.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-red-400 font-bold">{d.category.toUpperCase()}</span>
                  <h3 className="font-bold text-white text-sm">{d.title}</h3>
                  <p className="text-xs text-slate-500">{d.date}</p>
                </div>
                <button
                  onClick={() => { setObjects(d.objects); setActiveTab('board'); }}
                  className="bg-red-600 px-3 py-1.5 rounded-lg text-xs font-bold"
                >
                  Cargar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dueño */}
      {activeTab === 'admin' && (
        <div className="flex-1 p-4 max-w-5xl mx-auto w-full overflow-y-auto space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <span className="bg-red-600 text-[10px] font-black px-2 py-0.5 rounded">SUPERADMIN</span>
              <h2 className="text-xl font-black mt-1">Control de Licencias</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400">Ingresos Mensuales</span>
              <div className="text-xl font-black text-emerald-400">\$40.000 CLP</div>
            </div>
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <h3 className="font-bold text-xs mb-3">Dispositivos en Tiempo Real (Máx. 2)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {connectedDevices.map((dev) => (
                <div key={dev.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold">{dev.name}</div>
                    <span className="text-[10px] text-emerald-400">En línea</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
