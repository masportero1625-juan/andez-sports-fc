import React, { useState, useRef, useEffect } from 'react';
import {
  Play, Pause, Plus, Trash2, Save, RotateCcw,
  Smartphone, Monitor, ShieldCheck, ShieldAlert, Users,
  FolderOpen, Layers, Maximize2, Minimize2, UserPlus, ChevronRight
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
  const [isDragging, setIsDragging] = useState(false);

  const getSVGCoordinates = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
  };

  const handlePointerDown = (e, obj) => {
    e.stopPropagation();
    if (tool !== 'select') return;
    setSelectedObj(obj);
    setIsDragging(true);
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
    if (isDragging && selectedObj) {
      const coords = getSVGCoordinates(e);
      setObjects((prev) =>
        prev.map((o) => (o.id === selectedObj.id ? { ...o, x: coords.x, y: coords.y } : o))
      );
    } else if (currentLine) {
      const coords = getSVGCoordinates(e);
      setCurrentLine((prev) => ({ ...prev, end: coords }));
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
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
    alert('¡Sesión guardada en la categoría!');
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
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center font-black text-xs border border-white">
            FC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-wider text-base text-white">ANDEZ SPORTS</span>
              <span className="bg-red-600 text-[10px] font-black px-1.5 py-0.5 rounded text-white">FC</span>
            </div>
            <p className="text-[10px] text-slate-400">Pizarra Táctica & Metodología</p>
          </div>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('board')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'board' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Pizarra
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'library' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" /> Sesiones
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'admin' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Panel Dueño
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2.5 py-1 rounded-full">
            ● Licencia Activa (2/2)
          </span>
        </div>
      </header>

      {activeTab === 'board' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          <aside className="w-full md:w-80 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto z-10">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Categoría Formativa</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Nombre del Ejercicio</label>
              <input
                type="text"
                value={drillTitle}
                onChange={(e) => setDrillTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Herramientas</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTool('select')}
                  className={`p-2 rounded-lg text-xs font-semibold border ${tool === 'select' ? 'bg-red-600 text-white' : 'bg-slate-950 text-slate-300'}`}
                >
                  Mover Fichas
                </button>
                <button
                  onClick={() => setTool('pass')}
                  className={`p-2 rounded-lg text-xs font-semibold border ${tool === 'pass' ? 'bg-red-600 text-white' : 'bg-slate-950 text-slate-300'}`}
                >
                  Pase (Línea)
                </button>
                <button
                  onClick={() => setTool('run')}
                  className={`p-2 rounded-lg text-xs font-semibold border ${tool === 'run' ? 'bg-red-600 text-white' : 'bg-slate-950 text-slate-300'}`}
                >
                  Desmarque (- -)
                </button>
                <button
                  onClick={() => setDrawings([])}
                  className="p-2 rounded-lg text-xs font-semibold bg-slate-950 border border-slate-800 text-red-400"
                >
                  Limpiar Trazos
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Agregar a Cancha</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => addItem('player', 'home')} className="py-1.5 bg-red-600/30 text-red-300 border border-red-600 text-xs font-bold rounded-lg">+ Jugador Rojo</button>
                <button onClick={() => addItem('player', 'away')} className="py-1.5 bg-blue-600/30 text-blue-300 border border-blue-600 text-xs font-bold rounded-lg">+ Jugador Azul</button>
                <button onClick={() => addItem('ball')} className="py-1.5 bg-amber-600/30 text-amber-300 border border-amber-600 text-xs font-bold rounded-lg">+ Balón</button>
                <button onClick={() => addItem('cone')} className="py-1.5 bg-orange-600/30 text-orange-300 border border-orange-600 text-xs font-bold rounded-lg">+ Cono</button>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">Animación</span>
                <span className="text-[10px] text-slate-400">Paso {activeFrameIndex + 1} de {frames.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${isPlaying ? 'bg-amber-600' : 'bg-emerald-600'}`}
                >
                  {isPlaying ? 'Pausar' : 'Reproducir'}
                </button>
                <button onClick={captureFrame} className="py-1.5 px-3 bg-slate-800 text-xs font-bold rounded-lg">+ Paso</button>
              </div>
            </div>

            <button
              onClick={handleSaveDrill}
              className="mt-auto w-full py-2.5 bg-red-600 hover:bg-red-500 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg"
            >
              Guardar Ejercicio
            </button>
          </aside>

          <main
            className="flex-1 bg-slate-950 flex items-center justify-center p-3 select-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div className="w-full h-full max-w-5xl max-h-[820px] aspect-[16/10] bg-emerald-800 rounded-2xl border-4 border-slate-700 shadow-2xl relative overflow-hidden flex items-center justify-center">
              <svg
                ref={svgRef}
                className="w-full h-full relative z-10 cursor-crosshair"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                onPointerDown={handlePitchPointerDown}
              >
                <rect x="4" y="4" width="92" height="92" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
                <line x1="50" y1="4" x2="50" y2="96" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
                <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
                <circle cx="50" cy="50" r="0.8" fill="white" />
                <rect x="4" y="24" width="16" height="52" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
                <rect x="80" y="24" width="16" height="52" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />

                {drawings.map((d) => (
                  <line
                    key={d.id}
                    x1={d.start.x}
                    y1={d.start.y}
                    x2={d.end.x}
                    y2={d.end.y}
                    stroke={d.type === 'pass' ? '#facc15' : '#38bdf8'}
                    strokeWidth="0.9"
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
                    strokeWidth="0.9"
                    strokeDasharray={currentLine.type === 'run' ? '2,2' : 'none'}
                  />
                )}

                {objects.map((obj) => {
                  if (obj.type === 'player') {
                    return (
                      <g
                        key={obj.id}
                        transform={`translate(${obj.x}, ${obj.y})`}
                        onPointerDown={(e) => handlePointerDown(e, obj)}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <circle
                          r="2.6"
                          fill={obj.role === 'GK' ? '#eab308' : obj.team === 'home' ? '#dc2626' : '#2563eb'}
                          stroke="#ffffff"
                          strokeWidth="0.5"
                        />
                        <text textAnchor="middle" dy="0.9" fontSize="2" fontWeight="bold" fill="#ffffff" pointerEvents="none">
                          {obj.number}
                        </text>
                      </g>
                    );
                  }
                  if (obj.type === 'ball') {
                    return (
                      <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={(e) => handlePointerDown(e, obj)} className="cursor-grab">
                        <circle r="1.6" fill="#ffffff" stroke="#000000" strokeWidth="0.4" />
                      </g>
                    );
                  }
                  if (obj.type === 'cone') {
                    return (
                      <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={(e) => handlePointerDown(e, obj)} className="cursor-grab">
                        <polygon points="-1.5,1.5 1.5,1.5 0,-1.8" fill="#f97316" stroke="#fff" strokeWidth="0.3" />
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

      {activeTab === 'library' && (
        <div className="flex-1 p-6 max-w-5xl mx-auto w-full overflow-y-auto">
          <h2 className="text-2xl font-black mb-4">Biblioteca de Sesiones</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedDrills.map((d) => (
              <div key={d.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-red-400 font-bold">{d.category.toUpperCase()}</span>
                  <h3 className="font-bold text-white text-base">{d.title}</h3>
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

      {activeTab === 'admin' && (
        <div className="flex-1 p-6 max-w-5xl mx-auto w-full overflow-y-auto space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <span className="bg-red-600 text-xs font-black px-2 py-0.5 rounded">SUPERADMIN</span>
              <h2 className="text-2xl font-black mt-1">Control de Licencias y Conexiones</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Ingresos Mensuales</span>
              <div className="text-2xl font-black text-emerald-400">\$55.000 CLP</div>
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm">Dispositivos Conectados en Tiempo Real (Máx. 2)</h3>
              <button onClick={attemptAddDevice} className="bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400">
                + Probar 3er Dispositivo
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {connectedDevices.map((dev) => (
                <div key={dev.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
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

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <h3 className="font-bold text-sm mb-3">Clientes y Escuelas Activas</h3>
            <div className="space-y-3">
              {adminLicenses.map((lic) => (
                <div key={lic.id} className="bg-slate-950 p-3 rounded-lg flex justify-between items-center border border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-white">{lic.coach} <span className="text-slate-400">({lic.club})</span></div>
                    <span className="text-[10px] text-slate-500">Clave: {lic.code} • Plan: {lic.plan}</span>
                  </div>
                  <button
                    onClick={() => setAdminLicenses(adminLicenses.map(l => l.id === lic.id ? { ...l, status: l.status === 'active' ? 'suspended' : 'active' } : l))}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${lic.status === 'active' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}
                  >
                    {lic.status === 'active' ? 'Suspender Servicio' : 'Reactivar'}
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
