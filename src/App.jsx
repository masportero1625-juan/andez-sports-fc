import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Unlock, 
  MessageCircle, 
  RotateCw, 
  Users, 
  Plus, 
  Trash2, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Save,
  FolderOpen
} from 'lucide-react';

// Claves de acceso válidas (puedes añadir o cambiar claves aquí)
const VALID_KEYS = ["ANDEZ2025", "COACHPRO", "FUTBOL2025", "VIPANDEZ"];
const WHATSAPP_NUMBER = "56932100183"; // Tu número configurado (+56 9 3210 0183)

export default function App() {
  // --- ESTADO DE SUSCRIPCIÓN / CERROJO ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const savedAuth = localStorage.getItem('andez_auth_session');
    if (savedAuth === 'active') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const cleanKey = accessKeyInput.trim().toUpperCase();
    if (VALID_KEYS.includes(cleanKey)) {
      setIsAuthenticated(true);
      localStorage.setItem('andez_auth_session', 'active');
      setAuthError('');
    } else {
      setAuthError('Clave incorrecta o caducada. Solicita una nueva por WhatsApp.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('andez_auth_session');
  };

  // URL WhatsApp con mensaje predeterminado
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    'Hola Andez Sports FC, quiero solicitar acceso y consultar por mi suscripción para la aplicación.'
  )}`;

  // --- ESTADOS DE LA PIZARRA TÁCTICA ---
  const [items, setItems] = useState([
    { id: 1, type: 'player', team: 'blue', number: '1', name: 'Portero', x: 8, y: 50, rotation: 0 },
    { id: 2, type: 'player', team: 'blue', number: '4', name: 'Defensa', x: 22, y: 30, rotation: 0 },
    { id: 3, type: 'player', team: 'blue', number: '3', name: 'Defensa', x: 22, y: 70, rotation: 0 },
    { id: 4, type: 'player', team: 'blue', number: '8', name: 'Medio', x: 38, y: 50, rotation: 0 },
    { id: 5, type: 'player', team: 'red', number: '9', name: 'Delantero', x: 70, y: 50, rotation: 0 },
    { id: 6, type: 'ball', x: 50, y: 50, rotation: 0 }
  ]);

  const [selectedItemId, setSelectedItemId] = useState(null);
  const [showNames, setShowNames] = useState(true);
  const pitchRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Mover elementos en la cancha (arrastre táctil o mouse)
  const handlePointerDown = (id) => {
    setSelectedItemId(id);
    isDraggingRef.current = true;
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current || selectedItemId === null || !pitchRef.current) return;
    
    const rect = pitchRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    if (clientX === undefined || clientY === undefined) return;

    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    // Limitar al perímetro de la cancha
    x = Math.max(2, Math.min(98, x));
    y = Math.max(3, Math.min(97, y));

    setItems((prev) =>
      prev.map((it) => (it.id === selectedItemId ? { ...it, x, y } : it))
    );
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Girar material / jugador a 45°
  const rotateSelectedItem = () => {
    if (selectedItemId === null) return;
    setItems((prev) =>
      prev.map((it) =>
        it.id === selectedItemId ? { ...it, rotation: (it.rotation + 45) % 360 } : it
      )
    );
  };

  // Añadir nuevos elementos a la cancha
  const addElement = (type, team = 'blue') => {
    const nextId = Date.now();
    let newItem = {
      id: nextId,
      type,
      x: 50,
      y: 50,
      rotation: 0
    };

    if (type === 'player') {
      newItem = {
        ...newItem,
        team,
        number: team === 'blue' ? '10' : '7',
        name: team === 'blue' ? 'Jugador' : 'Rival'
      };
    } else if (type === 'cone') {
      newItem = { ...newItem, label: 'Cono' };
    } else if (type === 'ladder') {
      newItem = { ...newItem, label: 'Escalera' };
    } else if (type === 'mini_goal') {
      newItem = { ...newItem, label: 'Arco Chico' };
    }

    setItems((prev) => [...prev, newItem]);
    setSelectedItemId(nextId);
  };

  const removeSelectedItem = () => {
    if (selectedItemId === null) return;
    setItems((prev) => prev.filter((it) => it.id !== selectedItemId));
    setSelectedItemId(null);
  };

  const resetPitch = () => {
    if (window.confirm('¿Reiniciar pizarra táctica a la posición inicial?')) {
      setItems([
        { id: 1, type: 'player', team: 'blue', number: '1', name: 'Portero', x: 8, y: 50, rotation: 0 },
        { id: 2, type: 'player', team: 'blue', number: '4', name: 'Defensa', x: 22, y: 30, rotation: 0 },
        { id: 3, type: 'player', team: 'blue', number: '3', name: 'Defensa', x: 22, y: 70, rotation: 0 },
        { id: 4, type: 'player', team: 'blue', number: '8', name: 'Medio', x: 38, y: 50, rotation: 0 },
        { id: 5, type: 'player', team: 'red', number: '9', name: 'Delantero', x: 70, y: 50, rotation: 0 },
        { id: 6, type: 'ball', x: 50, y: 50, rotation: 0 }
      ]);
      setSelectedItemId(null);
    }
  };

  // --- SECCIÓN NÓMINA DE ALUMNOS CON RUT POR CATEGORÍAS ---
  const [activeTab, setActiveTab] = useState('pitch'); // 'pitch' | 'students'
  const [categories, setCategories] = useState(['Sub-8', 'Sub-10', 'Sub-12', 'Sub-15', 'Juvenil']);
  const [selectedCategory, setSelectedCategory] = useState('Sub-10');
  const [students, setStudents] = useState([
    { id: 1, name: 'Lucas Silva', rut: '23.456.789-K', category: 'Sub-10', position: 'Delantero', active: true },
    { id: 2, name: 'Martín González', rut: '24.123.456-7', category: 'Sub-10', position: 'Defensa', active: true },
    { id: 3, name: 'Benjamín Muñoz', rut: '21.987.654-3', category: 'Sub-12', position: 'Volante', active: true },
  ]);

  const [newStudent, setNewStudent] = useState({ name: '', rut: '', position: 'Medio' });

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (!newStudent.name.trim() || !newStudent.rut.trim()) return;

    setStudents([
      ...students,
      {
        id: Date.now(),
        name: newStudent.name.trim(),
        rut: newStudent.rut.trim(),
        category: selectedCategory,
        position: newStudent.position,
        active: true
      }
    ]);
    setNewStudent({ name: '', rut: '', position: 'Medio' });
  };

  const handleDeleteStudent = (id) => {
    setStudents(students.filter((st) => st.id !== id));
  };

  // ----------------------------------------------------
  // VISTA: CERROJO DE SUSCRIPCIÓN (SI NO ESTÁ AUTENTICADO)
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
          
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-3 border border-emerald-500/40">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-wide text-white">ANDEZ SPORTS FC</h1>
            <p className="text-sm text-slate-400 mt-1">Plataforma Técnica y de Gestión Deportiva</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Clave de Acceso / Suscripción
              </label>
              <input
                type="text"
                placeholder="Ingresa tu clave (ej. ANDEZ2025)"
                value={accessKeyInput}
                onChange={(e) => setAccessKeyInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 uppercase font-mono tracking-widest text-center"
              />
            </div>

            {authError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              Ingresar al Sistema
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400 mb-3">
              ¿No tienes una clave activa o necesitas renovar tu membresía?
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-sm transition-all shadow-md cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              Solicitar Acceso por WhatsApp
            </a>
            <p className="text-[11px] text-slate-500 mt-2">
              Contacto directo: +56 9 3210 0183
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VISTA PRINCIPAL (AUTENTICADO)
  // ----------------------------------------------------
  const selectedItem = items.find((i) => i.id === selectedItemId);

  return (
    <div 
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* HEADER SUPERIOR */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 text-white font-black text-xs px-2.5 py-1 rounded tracking-widest shadow">
            ANDEZ FC
          </div>
          <span className="hidden sm:inline text-sm font-semibold text-slate-300">
            Pizarra Táctica & Nóminas
          </span>
        </div>

        {/* NAVEGACIÓN ENTRE SECCIONES */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('pitch')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
              activeTab === 'pitch'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pizarra Táctica Panorámica
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'students'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Nómina Alumnos (RUT)
          </button>
        </div>

        {/* BOTÓN WHATSAPP SOPORTE & SALIR */}
        <div className="flex items-center gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Soporte y Renovación WhatsApp"
            className="hidden md:flex items-center gap-1.5 bg-emerald-950 border border-emerald-600/40 hover:bg-emerald-900 text-emerald-400 text-xs px-2.5 py-1.5 rounded-md transition"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>+56 9 3210 0183</span>
          </a>
          <button
            onClick={handleLogout}
            className="text-xs bg-slate-800 hover:bg-red-900/60 hover:text-red-300 text-slate-300 px-3 py-1.5 rounded-md border border-slate-700 transition cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* CUERPO PRINCIPAL */}
      <main className="flex-1 flex flex-col p-2 sm:p-4 gap-3 max-w-[1700px] w-full mx-auto">
        {activeTab === 'pitch' ? (
          /* ============================================================== */
          /* PESTAÑA: PIZARRA TÁCTICA HORIZONTAL PANORÁMICA PARA PC          */
          /* ============================================================== */
          <div className="flex-1 flex flex-col gap-2">
            {/* Barra de herramientas de la pizarra */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow">
              <div className="flex items-center flex-wrap gap-1.5">
                <span className="text-xs font-semibold text-slate-400 mr-1 hidden lg:inline">Añadir:</span>
                <button
                  onClick={() => addElement('player', 'blue')}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2.5 py-1.5 rounded flex items-center gap-1 cursor-pointer"
                >
                  + Jugador Azul
                </button>
                <button
                  onClick={() => addElement('player', 'red')}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs px-2.5 py-1.5 rounded flex items-center gap-1 cursor-pointer"
                >
                  + Rival Rojo
                </button>
                <button
                  onClick={() => addElement('ball')}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-2.5 py-1.5 rounded flex items-center gap-1 cursor-pointer"
                >
                  ⚽ Balón
                </button>
                <div className="h-5 w-[1px] bg-slate-800 mx-1 hidden sm:block"></div>
                <button
                  onClick={() => addElement('cone')}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-2.5 py-1.5 rounded cursor-pointer"
                >
                  ▲ Cono
                </button>
                <button
                  onClick={() => addElement('ladder')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-2.5 py-1.5 rounded cursor-pointer"
                >
                  目 Escalera
                </button>
                <button
                  onClick={() => addElement('mini_goal')}
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs px-2.5 py-1.5 rounded cursor-pointer"
                >
                  🥅 Arco Chico
                </button>
              </div>

              {/* Controles de elementos seleccionados y visualización */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNames(!showNames)}
                  className={`text-xs px-3 py-1.5 rounded border transition cursor-pointer ${
                    showNames
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {showNames ? '✓ Nombres Visibles' : 'Nombres Ocultos'}
                </button>

                {/* BOTÓN GIRO 45° */}
                <button
                  onClick={rotateSelectedItem}
                  disabled={!selectedItem}
                  className={`text-xs px-3 py-1.5 rounded flex items-center gap-1 font-medium transition cursor-pointer ${
                    selectedItem
                      ? 'bg-purple-600 hover:bg-purple-500 text-white'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                  title="Gira el elemento seleccionado 45 grados"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Girar 45° {selectedItem ? `(${selectedItem.rotation}°)` : ''}
                </button>

                {selectedItem && (
                  <button
                    onClick={removeSelectedItem}
                    className="bg-red-600 hover:bg-red-500 text-white text-xs px-2.5 py-1.5 rounded cursor-pointer"
                    title="Eliminar elemento seleccionado"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={resetPitch}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded border border-slate-700 cursor-pointer"
                  title="Reiniciar Pizarra"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* CAMPO DE JUEGO PANORÁMICO HORIZONTAL */}
            <div className="flex-1 min-h-[460px] lg:min-h-[580px] bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center justify-center overflow-hidden">
              <div
                ref={pitchRef}
                className="relative w-full h-full max-h-[760px] aspect-[16/9] bg-emerald-800 rounded-xl border-4 border-white shadow-2xl overflow-hidden cursor-crosshair"
                style={{
                  backgroundImage: `
                    linear-gradient(90deg, 
                      rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 10%, 
                      rgba(16, 185, 129, 0.15) 20%, rgba(5, 150, 105, 0.25) 30%,
                      rgba(16, 185, 129, 0.15) 40%, rgba(5, 150, 105, 0.25) 50%,
                      rgba(16, 185, 129, 0.15) 60%, rgba(5, 150, 105, 0.25) 70%,
                      rgba(16, 185, 129, 0.15) 80%, rgba(5, 150, 105, 0.25) 90%,
                      rgba(16, 185, 129, 0.15) 100%
                    )
                  `
                }}
              >
                {/* LÍNEAS DE LA CANCHA */}
                {/* Línea Central */}
                <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-white/80 -translate-x-1/2"></div>
                {/* Círculo Central */}
                <div className="absolute top-1/2 left-1/2 w-[18%] aspect-square border-2 border-white/80 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>

                {/* Área Grande Izquierda */}
                <div className="absolute top-1/2 left-0 w-[15%] h-[58%] border-2 border-l-0 border-white/80 -translate-y-1/2 pointer-events-none"></div>
                {/* Área Chica Izquierda */}
                <div className="absolute top-1/2 left-0 w-[6%] h-[30%] border-2 border-l-0 border-white/80 -translate-y-1/2 pointer-events-none"></div>
                {/* Arco Izquierdo */}
                <div className="absolute top-1/2 left-0 w-[1.5%] h-[16%] border-2 border-l-0 border-white bg-white/20 -translate-y-1/2 -translate-x-full"></div>

                {/* Área Grande Derecha */}
                <div className="absolute top-1/2 right-0 w-[15%] h-[58%] border-2 border-r-0 border-white/80 -translate-y-1/2 pointer-events-none"></div>
                {/* Área Chica Derecha */}
                <div className="absolute top-1/2 right-0 w-[6%] h-[30%] border-2 border-r-0 border-white/80 -translate-y-1/2 pointer-events-none"></div>
                {/* Arco Derecho */}
                <div className="absolute top-1/2 right-0 w-[1.5%] h-[16%] border-2 border-r-0 border-white bg-white/20 -translate-y-1/2 translate-x-full"></div>

                {/* ELEMENTOS EN LA CANCHA */}
                {items.map((item) => {
                  const isSelected = item.id === selectedItemId;

                  return (
                    <div
                      key={item.id}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        handlePointerDown(item.id);
                      }}
                      style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        transform: `translate(-50%, -50%) rotate(${item.rotation || 0}deg)`
                      }}
                      className={`absolute cursor-grab active:cursor-grabbing transition-transform duration-75 flex flex-col items-center select-none ${
                        isSelected ? 'z-50 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]' : 'z-20'
                      }`}
                    >
                      {/* JUGADOR */}
                      {item.type === 'player' && (
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-xs sm:text-sm border-2 shadow-lg transition-transform ${
                              item.team === 'blue'
                                ? 'bg-blue-600 border-white text-white'
                                : 'bg-red-600 border-white text-white'
                            } ${isSelected ? 'scale-115 ring-2 ring-yellow-400' : ''}`}
                          >
                            {item.number}
                          </div>
                          {showNames && item.name && (
                            <span 
                              style={{ transform: `rotate(-${item.rotation || 0}deg)` }} 
                              className="mt-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] text-white font-medium whitespace-nowrap shadow pointer-events-none"
                            >
                              {item.name}
                            </span>
                          )}
                        </div>
                      )}

                      {/* BALÓN */}
                      {item.type === 'ball' && (
                        <div
                          className={`w-6 h-6 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shadow-lg text-[11px] ${
                            isSelected ? 'ring-2 ring-yellow-400 scale-110' : ''
                          }`}
                        >
                          ⚽
                        </div>
                      )}

                      {/* CONO */}
                      {item.type === 'cone' && (
                        <div
                          className={`w-6 h-6 flex items-center justify-center font-bold text-amber-400 text-lg ${
                            isSelected ? 'filter drop-shadow-[0_0_4px_yellow]' : ''
                          }`}
                        >
                          ▲
                        </div>
                      )}

                      {/* ESCALERA DE COORDINACIÓN */}
                      {item.type === 'ladder' && (
                        <div
                          className={`w-14 h-4 bg-indigo-950/80 border border-indigo-400 flex divide-x divide-indigo-400 rounded-sm shadow ${
                            isSelected ? 'ring-2 ring-yellow-400' : ''
                          }`}
                        >
                          <div className="flex-1"></div>
                          <div className="flex-1"></div>
                          <div className="flex-1"></div>
                          <div className="flex-1"></div>
                        </div>
                      )}

                      {/* ARCO CHICO */}
                      {item.type === 'mini_goal' && (
                        <div
                          className={`w-10 h-3 border-2 border-dashed border-teal-300 bg-teal-500/30 rounded-sm ${
                            isSelected ? 'ring-2 ring-yellow-400' : ''
                          }`}
                        ></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PANEL INFERIOR PARA EDITAR JUGADOR SELECCIONADO */}
            {selectedItem && selectedItem.type === 'player' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">Editar Ficha:</span>
                <input
                  type="text"
                  placeholder="Número"
                  value={selectedItem.number || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setItems((prev) =>
                      prev.map((it) => (it.id === selectedItem.id ? { ...it, number: val } : it))
                    );
                  }}
                  className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-center"
                />
                <input
                  type="text"
                  placeholder="Nombre Jugador"
                  value={selectedItem.name || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setItems((prev) =>
                      prev.map((it) => (it.id === selectedItem.id ? { ...it, name: val } : it))
                    );
                  }}
                  className="w-36 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
                />
                <button
                  onClick={rotateSelectedItem}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  Girar +45° ({selectedItem.rotation}°)
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ============================================================== */
          /* PESTAÑA: NÓMINA DE ALUMNOS CON RUT POR CATEGORÍAS               */
          /* ============================================================== */
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Nómina de Alumnos y Jugadores Andez Sports FC
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Organización de categorías oficiales y registro de RUT para competiciones y entrenamientos.
              </p>
            </div>

            {/* SELECTOR DE CATEGORÍA */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
              <span className="text-xs font-semibold text-slate-400 mr-2">Categoría:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* FORMULARIO PARA REGISTRAR ALUMNO */}
            <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Matías Vidal"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">RUT del Alumno</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 22.345.678-9"
                  value={newStudent.rut}
                  onChange={(e) => setNewStudent({ ...newStudent, rut: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Posición Principal</label>
                <select
                  value={newStudent.position}
                  onChange={(e) => setNewStudent({ ...newStudent, position: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Portero">Portero (ARQ)</option>
                  <option value="Defensa Central">Defensa Central</option>
                  <option value="Lateral">Lateral</option>
                  <option value="Medio">Mediocampista</option>
                  <option value="Extremo">Extremo</option>
                  <option value="Delantero">Delantero</option>
                </select>
              </div>

              <div className="sm:col-span-1 flex items-end">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Agregar a {selectedCategory}
                </button>
              </div>
            </form>

            {/* TABLA DE ALUMNOS */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Alumno</th>
                    <th className="py-3 px-4">RUT</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Posición</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {students.filter((st) => st.category === selectedCategory).length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-500">
                        No hay alumnos inscritos en {selectedCategory}. Agrega uno con el formulario arriba.
                      </td>
                    </tr>
                  ) : (
                    students
                      .filter((st) => st.category === selectedCategory)
                      .map((st) => (
                        <tr key={st.id} className="hover:bg-slate-900/50 transition">
                          <td className="py-3 px-4 font-bold text-white">{st.name}</td>
                          <td className="py-3 px-4 font-mono text-emerald-400">{st.rut}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                              {st.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">{st.position}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Habilitado
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteStudent(st.id)}
                              className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition cursor-pointer"
                              title="Eliminar de nómina"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 py-2.5 px-4 text-center text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>Andez Sports FC © 2025 - Todos los derechos reservados</span>
        <div className="flex items-center gap-4">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline flex items-center gap-1"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp: +56 9 3210 0183
          </a>
        </div>
      </footer>
    </div>
  );
}
