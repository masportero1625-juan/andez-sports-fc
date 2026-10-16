import React, { useState, useEffect, useRef } from 'react';
import {
  sbGet,
  sbSet,
  MASTER_PIN,
  WHATSAPP_SOPORTE,
  PALETTE_COLORS,
  INITIAL_TACTICAL_SYSTEMS,
  TRAINING_MATERIALS
} from './data';

export default function App() {
  // --- AUTENTICACIÓN Y ROLES ---
  const [currentUser, setCurrentUser] = useState(null); // null = pantalla de bloqueo
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Perfil Institucional
  const [institution, setInstitution] = useState({ name: 'Andez Sports FC', logo: '' });
  const [directorProfile, setDirectorProfile] = useState({ name: 'Director Deportivo', rut: '', phone: WHATSAPP_SOPORTE });

  // Configuración de Cancha (Completa, Media y Balón Parado)
  const [pitchView, setPitchView] = useState('full'); // 'full', 'half', 'box'

  // Modales
  const [showTacticsModal, setShowTacticsModal] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [adminTab, setAdminTab] = useState('sessions');

  // Elementos de la Pizarra
  const [elements, setElements] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // Barra Compacta de Trazos
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawType, setDrawType] = useState('arrow'); // 'arrow', 'dash', 'straight', 'zigzag'
  const [drawColor, setDrawColor] = useState('#ffffff');
  const [drawWidth, setDrawWidth] = useState(3);
  const [currentLine, setCurrentLine] = useState(null);

  // Grabador de Video
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Base de Datos
  const [sessionsList, setSessionsList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [tacticalSystems, setTacticalSystems] = useState(INITIAL_TACTICAL_SYSTEMS);

  // Match Center (Centro de Mando de Partido)
  const [matchData, setMatchData] = useState({
    rival: '',
    date: '',
    matchTime: '11:00',
    meetTime: '09:45',
    pitchPlace: 'Cancha Principal',
    referee: '',
    goalsOwn: 0,
    goalsRival: 0,
    timerSeconds: 0,
    timerRunning: false
  });

  // Temporizador de partido
  useEffect(() => {
    let interval = null;
    if (matchData.timerRunning) {
      interval = setInterval(() => {
        setMatchData(p => ({ ...p, timerSeconds: p.timerSeconds + 1 }));
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [matchData.timerRunning]);

  // Carga Cloud Supabase
  const loadCloud = async () => {
    const inst = await sbGet('institution_profile');
    if (inst) setInstitution(inst);
    const dir = await sbGet('director_profile');
    if (dir) setDirectorProfile(dir);
    const studs = await sbGet('students_list');
    if (studs) setStudentsList(studs);
    const teachs = await sbGet('teachers_list');
    if (teachs) setTeachersList(teachs);
    const sess = await sbGet('tactical_sessions');
    if (sess) setSessionsList(sess);
    const tacts = await sbGet('tactical_systems');
    if (tacts) setTacticalSystems(tacts);
  };

  useEffect(() => {
    loadCloud();
  }, []);

  // Login por PIN
  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput === MASTER_PIN) {
      setCurrentUser({ role: 'SUPER ADMIN', name: directorProfile.name });
      setAuthError('');
      return;
    }
    const teacherFound = teachersList.find(t => t.code === pinInput);
    if (teacherFound) {
      setCurrentUser({ role: 'PROFESOR', ...teacherFound });
      setAuthError('');
      return;
    }
    setAuthError('Clave incorrecta. Usa ANDEZ2026 o tu clave de profesor.');
  };

  // Subida de Logo Local (Base64)
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = { ...institution, logo: reader.result };
        setInstitution(updated);
        sbSet('institution_profile', updated);
      };
      reader.readAsDataURL(file);
    }
  };

  // Parser IA
  const [aiPromptText, setAiPromptText] = useState('');
  const parseAndExecutePrompt = (text) => {
    if (!text.trim()) return;
    const lower = text.toLowerCase();
    const newItems = [];

    const extractCount = (regex, def = 1) => {
      const m = lower.match(regex);
      if (!m) return 0;
      const w = m[1];
      if (['un', 'uno', 'una', '1'].includes(w)) return 1;
      if (['dos', '2'].includes(w)) return 2;
      if (['tres', '3'].includes(w)) return 3;
      if (['cuatro', '4'].includes(w)) return 4;
      if (['cinco', '5'].includes(w)) return 5;
      return parseInt(w) || def;
    };

    if (lower.includes('portero') || lower.includes('arquero')) {
      newItems.push({ id: 'ai_' + Math.random(), type: 'token', color: '#f97316', number: 1, label: 'Portero', x: 14, y: 50, rotation: 0 });
    }

    const maniquiMatch = lower.match(/(\d+|un|una|dos|tres|cuatro|cinco)\s+maniqu/);
    const maniquiCount = maniquiMatch ? extractCount(/(\d+|un|una|dos|tres|cuatro|cinco)\s+maniqu/) : (lower.includes('maniqu') ? 1 : 0);
    if (maniquiCount > 0) {
      const startY = 50 - ((maniquiCount - 1) * 6) / 2;
      for (let i = 0; i < maniquiCount; i++) {
        newItems.push({ id: 'ai_m_' + Math.random(), type: 'mannequin', x: 32, y: startY + i * 6, rotation: 0 });
      }
    }

    if (lower.includes('balon') || lower.includes('balón') || lower.includes('pelota')) {
      newItems.push({ id: 'ai_ball_' + Math.random(), type: 'ball', x: 42, y: 50, rotation: 0 });
    }

    const tokenRegex = /(?:(\d+|un|una|dos|tres)\s+)?ficha[s]?\s+([a-z]+)(?:\s+(?:con\s+el\s+número|con\s+el\s+dorsal|dorsal|número|numero)\s+(\d+))?/g;
    let match;
    let foundTokens = false;
    while ((match = tokenRegex.exec(lower)) !== null) {
      foundTokens = true;
      const count = extractCount(/(\d+|un|una|dos|tres)/, 1) || 1;
      const colStr = match[2];
      const numStr = match[3] ? parseInt(match[3]) : 10;
      
      let hex = '#2563eb';
      if (colStr.includes('roj')) hex = '#dc2626';
      else if (colStr.includes('azul')) hex = '#2563eb';
      else if (colStr.includes('blanc')) hex = '#ffffff';
      else if (colStr.includes('amarill')) hex = '#eab308';
      else if (colStr.includes('ver')) hex = '#16a34a';
      else if (colStr.includes('naranj')) hex = '#f97316';
      else if (colStr.includes('negr')) hex = '#111827';
      else if (colStr.includes('violet') || colStr.includes('mora')) hex = '#9333ea';

      for (let i = 0; i < count; i++) {
        newItems.push({ id: 'ai_t_' + Math.random(), type: 'token', color: hex, number: numStr + i, label: '', x: 45 + i * 5, y: 45 + i * 5, rotation: 0 });
      }
    }

    if (!foundTokens && (lower.includes('jugador') || lower.includes('ficha'))) {
      newItems.push({ id: 'ai_def_' + Math.random(), type: 'token', color: '#dc2626', number: 10, label: '', x: 46, y: 50, rotation: 0 });
    }

    setElements(p => [...p, ...newItems]);
    setShowAiModal(false);
    setAiPromptText('');
  };

  // Textos Libres
  const [textInput, setTextInput] = useState('');
  const [textSize, setTextSize] = useState('medium');
  const addFloatingText = () => {
    if (!textInput.trim()) return;
    setElements(prev => [...prev, {
      id: 'txt_' + Math.random(),
      type: 'text',
      content: textInput,
      size: textSize,
      x: 50,
      y: 50,
      rotation: 0
    }]);
    setTextInput('');
    setShowTextModal(false);
  };

  const rotateSelected = () => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => el.id === selectedId ? { ...el, rotation: ((el.rotation || 0) + 45) % 360 } : el));
  };

  // Dibujo y Drag & Drop
  const pitchSvgRef = useRef(null);
  const getSvgCoordinates = (e) => {
    const svg = pitchSvgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: ((cx - rect.left) / rect.width) * 100, y: ((cy - rect.top) / rect.height) * 100 };
  };

  const handlePointerDown = (e) => {
    if (!isDrawingMode) return;
    const coords = getSvgCoordinates(e);
    setCurrentLine({ id: 'draw_' + Math.random(), type: drawType, color: drawColor, width: drawWidth, points: [coords] });
  };

  const handlePointerMove = (e) => {
    if (!isDrawingMode || !currentLine) return;
    const coords = getSvgCoordinates(e);
    setCurrentLine(prev => ({ ...prev, points: [...prev.points, coords] }));
  };

  const handlePointerUp = () => {
    if (currentLine && currentLine.points.length > 1) {
      setDrawings(prev => [...prev, currentLine]);
    }
    setCurrentLine(null);
  };

  const [dragItem, setDragItem] = useState(null);
  const handlePitchMouseMove = (e) => {
    if (!dragItem) return;
    const coords = getSvgCoordinates(e);
    setElements(prev => prev.map(el => el.id === dragItem ? { ...el, x: coords.x, y: coords.y } : el));
  };

  const renderPathD = (line) => {
    const pts = line.points;
    if (pts.length < 2) return '';
    if (line.type === 'zigzag') {
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const offset = (i % 2 === 0 ? 1 : -1) * (line.width * 0.4);
        d += ` L ${pts[i].x + offset} ${pts[i].y + offset}`;
      }
      return d;
    }
    return pts.reduce((acc, p, idx) => acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), '');
  };

  // Grabación
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      recordedChunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mr.ondataavailable = e => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `pizarra_${Date.now()}.webm`;
        a.click();
        setIsRecording(false);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch {
      alert("No se pudo iniciar la grabación.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
  };

  // --- PANTALLA DE ACCESO RESTRINGIDO (LOGIN) ---
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-neutral-950 font-sans text-white p-4">
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl text-center">
          {institution.logo ? (
            <img src={institution.logo} alt="Logo" className="h-16 w-16 mx-auto mb-3 object-contain" />
          ) : (
            <div className="h-14 w-14 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-3 text-black font-black text-xl">
              ⚽
            </div>
          )}
          <h2 className="text-xl font-black uppercase text-amber-500 tracking-wider mb-1">{institution.name}</h2>
          <p className="text-xs text-neutral-400 mb-6">Plataforma Táctica & Gestión Deportiva</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Ingresa clave de acceso..."
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-center text-sm font-mono tracking-widest focus:outline-none focus:border-amber-500"
            />
            {authError && <p className="text-xs text-red-400">{authError}</p>}
            <button type="submit" className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-extrabold rounded-lg text-sm transition">
              Ingresar al Sistema
            </button>
          </form>
          <p className="text-[11px] text-neutral-500 mt-6">Soporte Técnico: +{WHATSAPP_SOPORTE}</p>
        </div>
      </div>
    );
  }

  // --- VISTA DE CANCHA AJUSTABLE ---
  const viewBoxSetting = pitchView === 'half' ? '0 0 50 100' : pitchView === 'box' ? '0 20 40 60' : '0 0 100 100';

  return (
    <div 
      className="flex flex-col h-screen w-screen bg-neutral-900 text-white select-none overflow-hidden font-sans"
      onMouseMove={handlePitchMouseMove}
      onMouseUp={() => setDragItem(null)}
      onTouchMove={handlePitchMouseMove}
      onTouchEnd={() => setDragItem(null)}
    >
      {/* Estilos para impresión limpia */}
      <style>{`
        @media print {
          body, html { margin: 0; padding: 0; background: white !important; }
          .no-print { display: none !important; }
          .print-header { display: flex !important; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding: 12px 20px; color: black; }
          .print-footer { display: block !important; text-align: center; border-top: 1px solid #ccc; padding: 8px; font-size: 11px; color: #555; position: fixed; bottom: 0; width: 100%; }
        }
      `}</style>

      {/* Membrete Oficial */}
      <div className="hidden print-header bg-white">
        <div className="flex items-center gap-3">
          {institution.logo && <img src={institution.logo} alt="Logo" className="h-12 w-12 object-contain" />}
          <div>
            <h1 className="text-lg font-black uppercase text-black">{institution.name}</h1>
            <p className="text-xs text-gray-700">Informe Técnico Oficial</p>
          </div>
        </div>
        <div className="text-right text-xs text-gray-800">
          <p>Fecha: {new Date().toLocaleDateString('es-CL')}</p>
          <p>Usuario: {currentUser.name}</p>
        </div>
      </div>

      {/* HEADER SUPERIOR */}
      <header className="no-print h-14 bg-black/95 border-b border-neutral-800 flex items-center justify-between px-3 z-20">
        <div className="flex items-center gap-2">
          {institution.logo ? <img src={institution.logo} alt="Logo" className="h-8 w-8 object-contain" /> : <span className="font-extrabold text-amber-500 text-base">EZ</span>}
          <span className="font-bold text-xs uppercase tracking-wider text-neutral-300 hidden md:inline">{institution.name}</span>

          {/* Selector de Canchas */}
          <div className="flex items-center bg-neutral-800 p-0.5 rounded ml-2">
            <button onClick={() => setPitchView('full')} className={`px-2 py-1 text-[11px] rounded ${pitchView === 'full' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400'}`}>Entera</button>
            <button onClick={() => setPitchView('half')} className={`px-2 py-1 text-[11px] rounded ${pitchView === 'half' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400'}`}>Media</button>
            <button onClick={() => setPitchView('box')} className={`px-2 py-1 text-[11px] rounded ${pitchView === 'box' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400'}`}>Área ABP</button>
          </div>

          <button onClick={() => setShowAdminModal(true)} className="p-2 hover:bg-neutral-800 rounded text-xs text-neutral-300">📁 Gestión</button>
          <button onClick={() => setShowTacticsModal(true)} className="p-2 hover:bg-neutral-800 rounded text-xs text-neutral-300">📋 Sistemas</button>
          <button onClick={() => setShowMaterialsModal(true)} className="p-2 hover:bg-neutral-800 rounded text-xs text-neutral-300">🚧 Materiales</button>
          <button onClick={() => setShowTextModal(true)} className="p-2 hover:bg-neutral-800 rounded text-xs text-neutral-300">🔤 Texto</button>
          <button onClick={() => setShowAiModal(true)} className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-500/20 rounded font-bold text-xs">✨ IA</button>
        </div>

        <div className="flex items-center gap-2">
          {selectedId && (
            <button onClick={rotateSelected} className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded text-xs font-bold border border-neutral-700">🔄 45°</button>
          )}

          {!isRecording ? (
            <button onClick={startRecording} className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs border border-neutral-700">📹 Grabar</button>
          ) : (
            <button onClick={stopRecording} className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold animate-pulse">⏹ Parar</button>
          )}

          <button onClick={() => setShowMatchModal(true)} className="px-2.5 py-1 bg-blue-600/30 border border-blue-500 text-blue-300 hover:bg-blue-600/50 rounded text-xs font-bold">⚽ Partido</button>
          <button onClick={() => window.print()} className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300">🖨️</button>
          <button onClick={() => setShowSaveModal(true)} className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300">💾</button>

          <button onClick={() => setCurrentUser(null)} title="Cerrar Sesión" className="text-xs text-neutral-400 hover:text-white border-l border-neutral-800 pl-2">
            🔒 Salir
          </button>
        </div>
      </header>

      {/* CANCHA TÁCTICA */}
      <main className="flex-1 relative flex items-center justify-center p-2 bg-neutral-950">
        <div className="relative w-full h-full max-w-5xl max-h-[85vh] bg-green-700 rounded-lg shadow-2xl border-4 border-neutral-800 overflow-hidden flex items-center justify-center">
          <svg
            ref={pitchSvgRef}
            className="w-full h-full cursor-crosshair"
            viewBox={viewBoxSetting}
            preserveAspectRatio="none"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          >
            <rect width="100" height="100" fill="#15803d" />
            <rect x="5" y="5" width="90" height="90" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <line x1="50" y1="5" x2="50" y2="95" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="50" cy="50" r="10" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="50" cy="50" r="0.8" fill="#ffffff" />

            <rect x="5" y="25" width="16" height="50" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <rect x="5" y="38" width="6" height="24" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="16" cy="50" r="0.8" fill="#ffffff" />
            <rect x="1" y="44" width="4" height="12" fill="none" stroke="#eab308" strokeWidth="1.2" />

            <rect x="79" y="25" width="16" height="50" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <rect x="89" y="38" width="6" height="24" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="84" cy="50" r="0.8" fill="#ffffff" />
            <rect x="95" y="44" width="4" height="12" fill="none" stroke="#eab308" strokeWidth="1.2" />

            <defs>
              <marker id="arrowhead" markerWidth="3" markerHeight="3" refX="2" refY="1.5" orient="auto">
                <polygon points="0 0, 3 1.5, 0 3" fill={drawColor} />
              </marker>
            </defs>

            {[...drawings, ...(currentLine ? [currentLine] : [])].map((l, idx) => (
              <path
                key={idx}
                d={renderPathD(l)}
                fill="none"
                stroke={l.color}
                strokeWidth={l.width * 0.25}
                strokeDasharray={l.type === 'dash' ? '3,3' : undefined}
                markerEnd={['arrow', 'zigzag'].includes(l.type) ? 'url(#arrowhead)' : undefined}
              />
            ))}

            {elements.map(el => {
              const isSelected = selectedId === el.id;
              const transform = `translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`;

              if (el.type === 'token') {
                return (
                  <g key={el.id} transform={transform} onMouseDown={(e) => { e.stopPropagation(); setSelectedId(el.id); setDragItem(el.id); }} className="cursor-move">
                    <circle cx="0" cy="0" r="3.2" fill={el.color} stroke={isSelected ? '#eab308' : '#ffffff'} strokeWidth={isSelected ? '0.8' : '0.4'} />
                    <text x="0" y="1.1" textAnchor="middle" fill={el.color === '#ffffff' ? '#000000' : '#ffffff'} fontSize="3.2" fontWeight="bold">{el.number}</text>
                  </g>
                );
              }

              if (el.type === 'ball') {
                return (
                  <g key={el.id} transform={transform} onMouseDown={(e) => { e.stopPropagation(); setSelectedId(el.id); setDragItem(el.id); }} className="cursor-move">
                    <circle cx="0" cy="0" r="1.8" fill="#ffffff" stroke="#000000" strokeWidth="0.4" />
                  </g>
                );
              }

              if (el.type === 'text') {
                const fs = el.size === 'small' ? '2.4' : el.size === 'large' ? '4.8' : '3.4';
                return (
                  <g key={el.id} transform={transform} onMouseDown={(e) => { e.stopPropagation(); setSelectedId(el.id); setDragItem(el.id); }} className="cursor-move">
                    <text 
                      x="0" 
                      y="0" 
                      textAnchor="middle" 
                      fill="#ffffff" 
                      fontSize={fs} 
                      fontWeight="bold" 
                      stroke="#000000" 
                      strokeWidth="0.4"
                      className="font-sans"
                    >
                      {el.content}
                    </text>
                  </g>
                );
              }

              // Materiales
              return (
                <g key={el.id} transform={transform} onMouseDown={(e) => { e.stopPropagation(); setSelectedId(el.id); setDragItem(el.id); }} className="cursor-move">
                  <circle cx="0" cy="0" r="2" fill={el.color || '#eab308'} stroke={isSelected ? '#ffffff' : '#000000'} strokeWidth="0.4" />
                  <text x="0" y="0.8" textAnchor="middle" fontSize="2.2">{el.icon || '📍'}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </main>

      {/* FOOTER BARRA COMPACTA */}
      <footer className="no-print bg-black/95 border-t border-neutral-800 p-2 z-20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setElements(p => [...p, { id: 'tk_' + Math.random(), type: 'token', color: '#f97316', number: 1, label: 'Portero', x: 20, y: 50, rotation: 0 }])}
            className="h-7 px-2 bg-amber-600 rounded text-xs font-black text-white"
          >
            🧤 1
          </button>
          {PALETTE_COLORS.map(c => (
            <button
              key={c.id}
              onClick={() => setElements(p => [...p, { id: 'tk_' + Math.random(), type: 'token', color: c.hex, number: 10, x: 50, y: 50, rotation: 0 }])}
              className="h-6 w-6 rounded-full border border-neutral-600 font-bold text-[10px]"
              style={{ backgroundColor: c.hex, color: c.text }}
            >
              10
            </button>
          ))}
          <button 
            onClick={() => setElements(p => [...p, { id: 'ball_' + Math.random(), type: 'ball', x: 50, y: 50, rotation: 0 }])}
            className="h-6 w-6 rounded-full bg-white text-black flex items-center justify-center text-xs"
          >
            ⚽
          </button>
        </div>

        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded">
          <button onClick={() => setIsDrawingMode(!isDrawingMode)} className={`px-2 py-0.5 rounded text-xs font-bold ${isDrawingMode ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-300'}`}>
            ✏️ Dibujo
          </button>
          {isDrawingMode && (
            <div className="flex items-center gap-1 border-l border-neutral-700 pl-2">
              <button onClick={() => setDrawType('arrow')} className={`px-1.5 py-0.5 text-xs rounded ${drawType === 'arrow' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400'}`}>➔ Pase</button>
              <button onClick={() => setDrawType('dash')} className={`px-1.5 py-0.5 text-xs rounded ${drawType === 'dash' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400'}`}>⇢ Carrera</button>
              <button onClick={() => setDrawType('zigzag')} className={`px-1.5 py-0.5 text-xs rounded ${drawType === 'zigzag' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400'}`}>〰 Conducción</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => { if (selectedId) { setElements(p => p.filter(e => e.id !== selectedId)); setSelectedId(null); } }} className="p-1 text-red-400 text-xs">🗑️</button>
          <button onClick={() => { setElements([]); setDrawings([]); }} className="p-1 text-neutral-400 text-xs">🧹 Limpiar</button>
        </div>
      </footer>

      {/* MODAL MATERIALES COMPLETO */}
      {showMaterialsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md rounded-xl p-4 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-white">Materiales de Entrenamiento</h3>
              <button onClick={() => setShowMaterialsModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
              {TRAINING_MATERIALS.map(mat => (
                <button
                  key={mat.id}
                  onClick={() => {
                    setElements(p => [...p, { id: 'mat_' + Math.random(), type: 'material', icon: mat.icon, color: mat.color, x: 50, y: 50, rotation: 0 }]);
                    setShowMaterialsModal(false);
                  }}
                  className="p-2.5 bg-neutral-800 hover:bg-neutral-700 rounded flex items-center gap-2 text-xs font-bold"
                >
                  <span className="text-base">{mat.icon}</span> {mat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL TEXTO LIMPIO */}
      {showTextModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-sm rounded-xl p-4 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-white">Texto Táctico Flotante</h3>
              <button onClick={() => setShowTextModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Consigna táctica..."
              className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-xs text-white mb-3"
            />
            <div className="flex gap-1 mb-4">
              <button onClick={() => setTextSize('small')} className={`px-2 py-1 text-xs rounded ${textSize === 'small' ? 'bg-amber-500 text-black font-bold' : 'bg-neutral-800'}`}>Pequeño</button>
              <button onClick={() => setTextSize('medium')} className={`px-2 py-1 text-xs rounded ${textSize === 'medium' ? 'bg-amber-500 text-black font-bold' : 'bg-neutral-800'}`}>Mediano</button>
              <button onClick={() => setTextSize('large')} className={`px-2 py-1 text-xs rounded ${textSize === 'large' ? 'bg-amber-500 text-black font-bold' : 'bg-neutral-800'}`}>Grande</button>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowTextModal(false)} className="px-3 py-1 text-xs bg-neutral-800 rounded">Cancelar</button>
              <button onClick={addFloatingText} className="px-3 py-1 text-xs bg-blue-600 font-bold rounded">Insertar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GESTIÓN COMPLETA */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-3xl rounded-xl p-5 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <button onClick={() => setAdminTab('sessions')} className={`text-xs font-bold px-3 py-1.5 rounded ${adminTab === 'sessions' ? 'bg-amber-500 text-black' : 'text-neutral-400'}`}>📁 Sesiones</button>
                <button onClick={() => setAdminTab('students')} className={`text-xs font-bold px-3 py-1.5 rounded ${adminTab === 'students' ? 'bg-amber-500 text-black' : 'text-neutral-400'}`}>📋 Alumnos</button>
                <button onClick={() => setAdminTab('teachers')} className={`text-xs font-bold px-3 py-1.5 rounded ${adminTab === 'teachers' ? 'bg-amber-500 text-black' : 'text-neutral-400'}`}>👔 Profesores</button>
                <button onClick={() => setAdminTab('settings')} className={`text-xs font-bold px-3 py-1.5 rounded ${adminTab === 'settings' ? 'bg-amber-500 text-black' : 'text-neutral-400'}`}>⚙️ Club</button>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {/* ALUMNOS CON EDICIÓN */}
              {adminTab === 'students' && (
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 bg-neutral-950 p-3 rounded">
                    <input id="stName" type="text" placeholder="Nombre Alumno..." className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-xs text-white" />
                    <input id="stRut" type="text" placeholder="RUT..." className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-xs text-white" />
                    <input id="stPhone" type="text" placeholder="+569..." className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-xs text-white" />
                    <select id="stPos" className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-xs text-white">
                      <option value="Portero">Portero</option>
                      <option value="Defensa">Defensa</option>
                      <option value="Volante">Volante</option>
                      <option value="Delantero">Delantero</option>
                    </select>
                    <button 
                      onClick={() => {
                        const name = document.getElementById('stName')?.value;
                        if (!name) return;
                        const newSt = {
                          id: 'st_' + Math.random(),
                          name,
                          rut: document.getElementById('stRut')?.value || '',
                          phone: document.getElementById('stPhone')?.value || '',
                          position: document.getElementById('stPos')?.value || 'Volante'
                        };
                        const updated = [...studentsList, newSt];
                        setStudentsList(updated);
                        sbSet('students_list', updated);
                      }}
                      className="col-span-2 sm:col-span-4 bg-red-600 hover:bg-red-500 text-xs font-bold rounded py-1.5"
                    >
                      + Agregar Alumno
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {studentsList.map(st => (
                      <div key={st.id} className="flex items-center justify-between p-2 bg-neutral-800 rounded text-xs">
                        <span>{st.name} <strong className="text-amber-400">({st.position})</strong> - RUT: {st.rut || 'S/R'}</span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => {
                              const n = prompt("Editar Nombre:", st.name);
                              const p = prompt("Editar Posición:", st.position);
                              if (n) {
                                const up = studentsList.map(s => s.id === st.id ? { ...s, name: n, position: p || s.position } : s);
                                setStudentsList(up);
                                sbSet('students_list', up);
                              }
                            }}
                            className="p-1 text-amber-400 hover:bg-neutral-700 rounded"
                          >
                            ✏️
                          </button>
                          <button onClick={() => { const up = studentsList.filter(s => s.id !== st.id); setStudentsList(up); sbSet('students_list', up); }} className="p-1 text-red-400 hover:bg-neutral-700 rounded">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PROFESORES CON INGRESO Y EDICIÓN */}
              {adminTab === 'teachers' && (
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 bg-neutral-950 p-3 rounded">
                    <input id="tcName" type="text" placeholder="Nombre Profesor..." className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-xs text-white" />
                    <input id="tcRole" type="text" placeholder="Cargo (DT, PF...)" className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-xs text-white" />
                    <input id="tcCat" type="text" placeholder="Categoría (Sub-10...)" className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-xs text-white" />
                    <input id="tcPhone" type="text" placeholder="WhatsApp +569..." className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-xs text-white" />
                    <input id="tcCode" type="text" placeholder="Clave Acceso (DT-101)..." className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-xs text-white" />
                    <button 
                      onClick={() => {
                        const name = document
