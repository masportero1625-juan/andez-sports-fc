import React, { useState, useRef, useEffect } from 'react';
import {
  Play, Pause, Plus, Trash2, Save, RotateCcw,
  Smartphone, Monitor, ShieldCheck, ShieldAlert, Users,
  FolderOpen, Layers, Maximize2, Minimize2, ChevronDown, ChevronUp
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
  { id: 'p4', type: 'player', team: 'home', number: '2', role: 'RB', x: 28, y: 15 },
  { id: 'p5', type: 'player', team: 'home', number: '5', role: 'LB', x: 28, y: 85 },
  { id: 'p6', type: 'player', team: 'home', number: '6', role: 'CDM', x: 40, y: 50 },
  { id: 'p7', type: 'player', team: 'home', number: '8', role: 'CM', x: 55, y: 30 },
  { id: 'p8', type: 'player', team: 'home', number: '10', role: 'CAM', x: 55, y: 70 },
  { id: 'p9', type: 'player', team: 'home', number: '7', role: 'RW', x: 75, y: 20 },
  { id: 'p10', type: 'player', team: 'home', number: '11', role: 'LW', x: 75, y: 80 },
  { id: 'p11', type: 'player', team: 'home', number: '9', role: 'ST', x: 80, y: 50 },
  { id: 'ball1', type: 'ball', x: 48, y: 50 },
  { id: 'c1', type: 'cone', x: 45, y: 40 },
  { id: 'c2', type: 'cone', x: 45, y: 60 }
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
    { id: 'lic-3', coach: 'Prof. Esteban Tapia', club: 'Deportivo Central', code: 'AND-PRO-03', seats: 2, used: 0, status: 'suspended', plan: 'Coach Single (\$15.000)' },
  ]);

  const svgRef = useRef(null);
  const isDraggingRef = useRef(false);

  const getSVGCoordinates = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(3, Math.min(97, x)), y: Math.max(3, Math.min(97, y)) };
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
      newItem = { id, type: 'player', team, number: String(objects.filter(o => o.type==='player').length + 1), role: 'JUG', x: 50, y: 50 };
    } else if (type === 'ball') {
      newItem = { id, type: 'ball', x: 50, y: 50 };
    } else {
      newItem = { id, type: 'cone', x: 50, y: 50 };
    }
    setObjects([...objects, newItem]);
  };

  const attemptAddDevice = () => {
    if (connectedDevices.length >= 2) {
      setDeviceAlert(true);
    } else {
      setConnectedDevices([
        ...connectedDevices,
        { id: 'dev-' + Date.now(), name: 'Tablet 10" (Vestuario)', type: 'mobile', active: true, lastSeen: 'Ahora' }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Cabecera con Logo */}
      <header className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo-andez.png"
            alt="Logo Andez"
            className="w-8 h-8 rounded-full object-cover border border-red-500 shadow"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black tracking-wider text-sm sm:text-base text-white">ANDEZ SPORTS</span>
              <span className="bg-red-600 text-[9px] font-black px-1.5 py-0.5 rounded text-white">FC</span>
            </div>
            <p className="text-[9px] text-slate-400 hidden sm:block">Pizarra Táctica & Metodología</p>
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
          {/* Panel de herramientas desplegable en móvil y fijo en PC */}
          <aside
            className={`${
              showToolsMobile ? 'flex' : 'hidden'
            } md:flex w-full md:w-72 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 p-3 flex-col gap-3 overflow-y-auto shrink-0 z-30 absolute md:relative inset-x-0 top-0 max-h-[80vh] md:max-h-full shadow-2xl md:shadow-none`}
          >
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Categoría</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
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
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Trazos y Acción</label>
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Agregar Elementos</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => addItem('player', 'home')} className="py-1 bg-red-600/30 text-red-300 border border-red-600 text-xs font-bold rounded-lg">+ Rojo</button>
                <button onClick={() => addItem('player', 'away')} className="py-1 bg-blue-600/30 text-blue-300 border border-blue-600 text-xs font-bold rounded-lg">+ Azul</button>
                <button onClick={() => addItem('ball')} className="py-1 bg-amber-600/30 text-amber-300 border border-amber-600 text-xs font-bold rounded-lg">+ Pelota</button>
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
                  {isPlaying ? 'Pausar' : 'Reproducir'}
                </button>
                <button onClick={captureFrame} className="py-1 px-2.5 bg-slate-800 text-xs font-bold rounded-lg">+ Paso</button>
              </div>
            </div>

            <button
              onClick={handleSaveDrill}
              className="w-full py-2 bg-red-600 hover:bg-red-500 font-bold text-xs uppercase tracking-wider rounded-xl shadow mt-1"
            >
              Guardar Ejercicio
            </button>
          </aside>

          {/* Cancha adaptable 100% */}
          <main
            className="flex-1 bg-slate-950 flex items-center justify-center p-1 sm:p-3 overflow-hidden touch-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div className="w-full h-full flex items-center justify-center">
              <svg
                ref={svgRef}
                className="w-full h-full max-h-[96vh] max-w-[100vw] aspect-[16/10] bg-emerald-800 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-slate-700 shadow-2xl relative z-10 cursor-crosshair touch-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                onPointerDown={handlePitchPointerDown}
              >
                {/* Líneas de Cancha */}
                <rect x="4" y="4" width="92" height="92" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
                <line x1="50" y1="4" x2="50" y2="96" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
                <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
                <circle cx="50" cy="50" r="0.8" fill="white" />
                <rect x="4" y="24" width="16" height="52" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
                <rect x="80" y="24" width="16" height="52" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />

                {/* Trazos */}
                {drawings.map((d) => (
                  <line
                    key={d.id}
                    x1={d.start.x}
                    y1={d.start.y}
                    x2={d.end.x}
                    y2={d.end.y}
                    stroke={d.type === 'pass' ? '#facc15' : '#38bdf8'}
                    strokeWidth="1.2"
                    strokeDasharray={d.type === 'run' ? '2,2' : 'none'}
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
                    strokeDasharray={currentLine.type === 'run' ? '2,2' : 'none'}
                  />
                )}

                {/* Fichas y elementos */}
                {objects.map((obj) => {
                  if (obj.type === 'player') {
                    return (
                      <g
                        key={obj.id}
                        transform={`translate(${obj.x}, ${obj.y})`}
                        onPointerDown={(e) => handlePointerDown(e, obj)}
                        className="cursor-grab active:cursor-grabbing touch-none"
                      >
                        <circle
                          r="3"
                          fill={obj.role === 'GK' ? '#eab308' : obj.team === 'home' ? '#dc2626' : '#2563eb'}
                          stroke="#ffffff"
                          strokeWidth="0.6"
                        />
                        <text textAnchor="middle" dy="1" fontSize="2.2" fontWeight="bold" fill="#ffffff" pointerEvents="none">
                          {obj.number}
                        </text>
                      </g>
                    );
                  }
                  if (obj.type === 'ball') {
                    return (
                      <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={(e) => handlePointerDown(e, obj)} className="cursor-grab touch-none">
                        <circle r="1.8" fill="#ffffff" stroke="#000000" strokeWidth="0.5" />
                      </g>
                    );
                  }
                  if (obj.type === 'cone') {
                    return (
                      <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={(e) => handlePointerDown(e, obj)} className="cursor-grab touch-none">
                        <polygon points="-1.8,1.8 1.8,1.8 0,-2" fill="#f97316" stroke="#fff" strokeWidth="0.4" />
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

      {/* Biblioteca de Sesiones */}
      {activeTab === 'library' && (
        <div className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full overflow-y-auto">
          <h2 className="text-xl sm:text-2xl font-black mb-4">Biblioteca de Sesiones</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedDrills.map((d) => (
              <div key={d.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-red-400 font-bold">{d.category.toUpperCase()}</span>
                  <h3 className="font-bold text-white text-sm sm:text-base">{d.title}</h3>
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

      {/* Panel Administrador */}
      {activeTab === 'admin' && (
        <div className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full overflow-y-auto space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <span className="bg-red-600 text-[10px] font-black px-2 py-0.5 rounded">SUPERADMIN</span>
              <h2 className="text-xl sm:text-2xl font-black mt-1">Control de Licencias</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400">Ingresos Mensuales</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400">\$55.000 CLP</div>
            </div>
          </div>

          <div className="bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-xs sm:text-sm">Dispositivos en Tiempo Real (Máx. 2)</h3>
              <button onClick={attemptAddDevice} className="bg-slate-800 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-400">
                + Probar 3er Equipo
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {connectedDevices.map((dev) => (
                <div key={dev.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold">{dev.name}</div>
                    <span className="text-[10px] text-emerald-400">En línea</span>
                  </div>
                  <button onClick={() => setConnectedDevices(connectedDevices.filter(d => d.id !== dev.id))} className="text-xs text-red-400">
                    Desconectar
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-800">
            <h3 className="font-bold text-xs sm:text-sm mb-3">Clubes y Escuelas Activas</h3>
            <div className="space-y-2">
              {adminLicenses.map((lic) => (
                <div key={lic.id} className="bg-slate-950 p-2.5 rounded-lg flex justify-between items-center border border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-white">{lic.coach} <span className="text-slate-400">({lic.club})</span></div>
                    <span className="text-[10px] text-slate-500">{lic.code} • {lic.plan}</span>
                  </div>
                  <button
                    onClick={() => setAdminLicenses(adminLicenses.map(l => l.id === lic.id ? { ...l, status: l.status === 'active' ? 'suspended' : 'active' } : l))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${lic.status === 'active' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}
                  >
                    {lic.status === 'active' ? 'Suspender' : 'Reactivar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {deviceAlert && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border-2 border-red-600 rounded-2xl max-w-sm w-full p-5 text-center">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-black text-white text-lg mb-2">Límite de 2 Equipos Alcanzado</h3>
            <p className="text-xs text-slate-300 mb-4">Esta cuenta ya tiene 2 pantallas abiertas. Para un 3er profe, el club debe contratar un asiento adicional.</p>
            <button onClick={() => setDeviceAlert(false)} className="w-full py-2 bg-red-600 text-white font-bold text-xs rounded-xl">
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}      
