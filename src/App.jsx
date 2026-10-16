import React, { useState, useEffect, useRef } from 'react';

// --- CONFIGURACIÓN SUPABASE NATIVA (SIN DEPENDENCIAS EXTERNAS) ---
const SUPABASE_URL = "https://hzfvckmgycvvshckwypf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6ZnZja21neWN2dnNoY2t3eXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDcxNzcsImV4cCI6MjA2MDAxMTE3N30.Z651c6c6b328a64ed41e3d489da924cf3832d2fe102874136427a1e050ff8156";

// Funciones nativas de base de datos vía REST
const sbGet = async (key) => {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_data?key=eq.${encodeURIComponent(key)}&select=value`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    const data = await res.json();
    return data && data.length > 0 ? data[0].value : null;
  } catch {
    return null;
  }
};

const sbSet = async (key, value) => {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/app_data`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ key, value })
    });
  } catch (e) {
    console.warn("Error Supabase:", e);
  }
};

const MASTER_PIN = "ANDEZ2026";
const WHATSAPP_SOPORTE = "56932100183";

// Paleta de 8 colores estándar
const PALETTE_COLORS = [
  { id: 'white', name: 'Blanco', hex: '#ffffff', text: '#000000' },
  { id: 'blue', name: 'Azul', hex: '#2563eb', text: '#ffffff' },
  { id: 'red', name: 'Rojo', hex: '#dc2626', text: '#ffffff' },
  { id: 'orange', name: 'Naranjo', hex: '#f97316', text: '#ffffff' },
  { id: 'yellow', name: 'Amarillo', hex: '#eab308', text: '#000000' },
  { id: 'green', name: 'Verde', hex: '#16a34a', text: '#ffffff' },
  { id: 'black', name: 'Negro', hex: '#111827', text: '#ffffff' },
  { id: 'purple', name: 'Violeta', hex: '#9333ea', text: '#ffffff' }
];

export default function App() {
  // --- ESTADOS GENERALES Y SESIÓN ---
  const [currentUser, setCurrentUser] = useState(null);
  const [institution, setInstitution] = useState({ name: 'Andez Sports FC', logo: '' });
  const [directorProfile, setDirectorProfile] = useState({ name: 'Director Deportivo', rut: '', phone: WHATSAPP_SOPORTE });

  // Configuración de Cancha
  const [pitchView, setPitchView] = useState('full');
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

  // Herramientas de Dibujo (Barra Compacta)
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawType, setDrawType] = useState('arrow');
  const [drawColor, setDrawColor] = useState('#ffffff');
  const [drawWidth, setDrawWidth] = useState(3);
  const [currentLine, setCurrentLine] = useState(null);

  // Grabador de Video
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Base de Datos Centralizada
  const [sessionsList, setSessionsList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [tacticalSystems, setTacticalSystems] = useState([
    { id: 's1', name: 'Formación 4-3-3', code: '1-4-3-3' },
    { id: 's2', name: 'Formación 4-4-2', code: '1-4-4-2' },
    { id: 's3', name: 'Formación 3-5-2', code: '1-3-5-2' }
  ]);

  // Centro de Mando de Partido (Match Center)
  const [matchData, setMatchData] = useState({
    rival: '',
    date: '',
    matchTime: '11:00',
    meetTime: '09:45',
    pitchPlace: 'Cancha Principal',
    referee: '',
    assistantRef: '',
    commissioner: '',
    lineupOwn: '1-4-3-3',
    lineupRival: '1-4-4-2',
    titulares: [],
    suplentes: [],
    goalsOwn: 0,
    goalsRival: 0,
    shots: 0,
    corners: 0,
    fouls: 0,
    yellowCards: 0,
    redCards: 0,
    penalties: 0,
    notes: '',
    timerSeconds: 0,
    timerRunning: false
  });

  // Temporizador de Partido
  useEffect(() => {
    let interval = null;
    if (matchData.timerRunning) {
      interval = setInterval(() => {
        setMatchData(prev => ({ ...prev, timerSeconds: prev.timerSeconds + 1 }));
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [matchData.timerRunning]);

  // Carga inicial desde Supabase
  const loadAllCloudData = async () => {
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
    loadAllCloudData();
  }, []);

  // --- PARSER INTELIGENTE DE PROMPT IA ---
  const [aiPromptText, setAiPromptText] = useState('');
  const parseAndExecutePrompt = (text) => {
    if (!text.trim()) return;
    const lower = text.toLowerCase();
    const newItems = [];

    const extractCount = (regex, defaultVal = 1) => {
      const m = lower.match(regex);
      if (!m) return 0;
      const word = m[1];
      if (['un', 'uno', 'una', '1'].includes(word)) return 1;
      if (['dos', '2'].includes(word)) return 2;
      if (['tres', '3'].includes(word)) return 3;
      if (['cuatro', '4'].includes(word)) return 4;
      if (['cinco', '5'].includes(word)) return 5;
      if (['seis', '6'].includes(word)) return 6;
      return parseInt(word) || defaultVal;
    };

    // 1. Portero
    if (lower.includes('portero') || lower.includes('arquero')) {
      newItems.push({
        id: 'ai_' + Math.random(),
        type: 'token',
        color: '#f97316',
        number: 1,
        label: 'Portero',
        x: 14,
        y: 50,
        rotation: 0
      });
    }

    // 2. Maniquíes en barrera
    const maniquiMatch = lower.match(/(\d+|un|una|dos|tres|cuatro|cinco)\s+maniqu/);
    const maniquiCount = maniquiMatch ? extractCount(/(\d+|un|una|dos|tres|cuatro|cinco)\s+maniqu/) : (lower.includes('maniqu') ? 1 : 0);
    if (maniquiCount > 0) {
      const startY = 50 - ((maniquiCount - 1) * 6) / 2;
      for (let i = 0; i < maniquiCount; i++) {
        newItems.push({
          id: 'ai_m_' + Math.random(),
          type: 'mannequin',
          label: '',
          x: 32,
          y: startY + i * 6,
          rotation: 0
        });
      }
    }

    // 3. Balón
    if (lower.includes('balon') || lower.includes('balón') || lower.includes('pelota')) {
      newItems.push({
        id: 'ai_ball_' + Math.random(),
        type: 'ball',
        label: '',
        x: 42,
        y: 50,
        rotation: 0
      });
    }

    // 4. Fichas con color y número
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
        newItems.push({
          id: 'ai_t_' + Math.random(),
          type: 'token',
          color: hex,
          number: numStr + i,
          label: '',
          x: 45 + i * 5,
          y: 45 + i * 5,
          rotation: 0
        });
      }
    }

    if (!foundTokens && (lower.includes('jugador') || lower.includes('ficha'))) {
      newItems.push({
        id: 'ai_def_' + Math.random(),
        type: 'token',
        color: '#dc2626',
        number: 10,
        label: '',
        x: 46,
        y: 50,
        rotation: 0
      });
    }

    setElements(prev => [...prev, ...newItems]);
    setShowAiModal(false);
    setAiPromptText('');
  };

  // --- SISTEMAS TÁCTICOS DINÁMICOS ---
  const applyTacticalSystem = (code) => {
    const parts = code.split('-').map(Number);
    const newItems = [];
    newItems.push({ id: 't_gk', type: 'token', color: '#f97316', number: 1, label: 'Portero', x: 12, y: 50, rotation: 0 });

    const totalLines = parts.length - 1;
    const startX = 22;
    const endX = 70;
    const stepX = (endX - startX) / (totalLines || 1);

    let dorsalCounter = 2;
    for (let l = 1; l < parts.length; l++) {
      const lineCount = parts[l];
      const curX = startX + (l - 1) * stepX;
      const stepY = 80 / (lineCount + 1);
      for (let c = 0; c < lineCount; c++) {
        newItems.push({
          id: 't_' + dorsalCounter,
          type: 'token',
          color: '#2563eb',
          number: dorsalCounter,
          label: '',
          x: curX,
          y: 10 + (c + 1) * stepY,
          rotation: 0
        });
        dorsalCounter++;
      }
    }
    setElements(newItems);
    setShowTacticsModal(false);
  };

  // --- TEXTOS FLOTANTES ---
  const [textInput, setTextInput] = useState('');
  const [textSize, setTextSize] = useState('medium');
  const addFloatingText = () => {
    if (!textInput.trim()) return;
    const newText = {
      id: 'txt_' + Math.random(),
      type: 'text',
      content: textInput,
      size: textSize,
      x: 50,
      y: 50,
      rotation: 0
    };
    setElements(prev => [...prev, newText]);
    setTextInput('');
    setShowTextModal(false);
  };

  const rotateSelectedElement = () => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => {
      if (el.id === selectedId) {
        return { ...el, rotation: ((el.rotation || 0) + 45) % 360 };
      }
      return el;
    }));
  };

  // --- GRABADOR DE PANTALLA ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: false
      });
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setRecordedVideoUrl(URL.createObjectURL(blob));
        setIsRecording(false);
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      alert("No se pudo iniciar la grabación.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // --- DIBUJO Y TRAZOS ---
  const pitchSvgRef = useRef(null);

  const getSvgCoordinates = (e) => {
    const svg = pitchSvgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100
    };
  };

  const handlePointerDown = (e) => {
    if (!isDrawingMode) return;
    const coords = getSvgCoordinates(e);
    setCurrentLine({
      id: 'draw_' + Math.random(),
      type: drawType,
      color: drawColor,
      width: drawWidth,
      points: [coords]
    });
  };

  const handlePointerMove = (e) => {
    if (!isDrawingMode || !currentLine) return;
    const coords = getSvgCoordinates(e);
    setCurrentLine(prev => ({
      ...prev,
      points: [...prev.points, coords]
    }));
  };

  const handlePointerUp = () => {
    if (currentLine && currentLine.points.length > 1) {
      setDrawings(prev => [...prev, currentLine]);
    }
    setCurrentLine(null);
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

  // --- ARRASTRAR ELEMENTOS (DRAG & DROP) ---
  const [dragItem, setDragItem] = useState(null);
  const handleElementMouseDown = (e, id) => {
    e.stopPropagation();
    setSelectedId(id);
    setDragItem(id);
  };

  const handlePitchTouchMove = (e) => {
    if (!dragItem) return;
    const coords = getSvgCoordinates(e);
    setElements(prev => prev.map(el => el.id === dragItem ? { ...el, x: coords.x, y: coords.y } : el));
  };

  const handlePitchTouchEnd = () => {
    setDragItem(null);
  };

  // --- CITACIÓN WHATSAPP ---
  const sendWhatsAppCitation = (student, role) => {
    if (!student.phone) {
      alert("El alumno no tiene registrado teléfono WhatsApp.");
      return;
    }
    const msg = `Estimado(a) apoderado(a) de ${student.name}, le informamos desde ${institution.name} que ha sido CITADO (${role.toUpperCase()}) para el partido frente a ${matchData.rival || 'el equipo rival'}. Fecha: ${matchData.date} a las ${matchData.matchTime} hrs en ${matchData.pitchPlace}. Presentarse puntualmente a las ${matchData.meetTime} hrs con indumentaria oficial.`;
    window.open(`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div 
      className="flex flex-col h-screen w-screen bg-neutral-900 text-white select-none overflow-hidden font-sans"
      onMouseMove={handlePitchTouchMove}
      onMouseUp={handlePitchTouchEnd}
      onTouchMove={handlePitchTouchMove}
      onTouchEnd={handlePitchTouchEnd}
    >
      {/* --- ESTILOS DE IMPRESIÓN OFICIAL (MEMBRETE LIMPIO) --- */}
      <style>{`
        @media print {
          body, html { margin: 0; padding: 0; background: white !important; }
          .no-print { display: none !important; }
          .print-header { display: flex !important; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding: 12px 20px; color: black; }
          .print-footer { display: block !important; text-align: center; border-top: 1px solid #ccc; padding: 8px; font-size: 11px; color: #555; position: fixed; bottom: 0; width: 100%; }
          .pitch-board-print { border: 2px solid #000 !important; margin: 15px auto !important; width: 95% !important; }
        }
      `}</style>

      {/* --- MEMBRETE DE IMPRESIÓN --- */}
      <div className="hidden print-header bg-white">
        <div className="flex items-center gap-3">
          {institution.logo ? <img src={institution.logo} alt="Logo" className="h-14 w-14 object-contain" /> : <div className="h-12 w-12 bg-black text-white font-bold flex items-center justify-center rounded">EZ</div>}
          <div>
            <h1 className="text-xl font-black uppercase text-black">{institution.name}</h1>
            <p className="text-sm text-gray-700">Informe Táctico & Planificación Oficial</p>
          </div>
        </div>
        <div className="text-right text-xs text-gray-800">
          <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-CL')}</p>
          <p><strong>Profesor / Director:</strong> {currentUser?.name || directorProfile.name}</p>
        </div>
      </div>

      {/* --- BARRA SUPERIOR (HEADER) --- */}
      <header className="no-print h-14 bg-black/90 border-b border-neutral-800 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {institution.logo ? <img src={institution.logo} alt="Logo" className="h-8 w-8 object-contain" /> : <span className="font-extrabold text-amber-500 text-lg">ANDEZ FC</span>}
            <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider text-neutral-300">{institution.name}</span>
          </div>

          <button onClick={() => setShowAdminModal(true)} title="Biblioteca y Gestión" className="p-2 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition">
            📁 Gestión
          </button>
          
          <button onClick={() => setShowTacticsModal(true)} title="Sistemas Tácticos" className="p-2 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition">
            📋 Sistemas
          </button>

          <button onClick={() => setShowMaterialsModal(true)} title="Materiales de Entrenamiento" className="p-2 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition">
            🚧 Materiales
          </button>

          <button onClick={() => setShowTextModal(true)} title="Texto táctico flotante" className="p-2 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition">
            🔤 Texto
          </button>

          <button onClick={() => setShowAiModal(true)} className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-500/20 rounded font-bold text-xs transition">
            ✨ Prompt IA
          </button>
        </div>

        <div className="flex items-center gap-2">
          {selectedId && (
            <button onClick={rotateSelectedElement} className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded text-xs font-bold border border-neutral-700 flex items-center gap-1">
              🔄 45°
            </button>
          )}

          {!isRecording ? (
            <button onClick={startRecording} className="flex items-center gap-1 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs border border-neutral-700 transition">
              📹 Grabar
            </button>
          ) : (
            <button onClick={stopRecording} className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white animate-pulse rounded text-xs font-bold transition">
              ⏹ Detener
            </button>
          )}

          <button onClick={() => setShowMatchModal(true)} className="px-3 py-1 bg-blue-600/30 border border-blue-500 text-blue-300 hover:bg-blue-600/50 rounded text-xs font-bold transition">
            ⚽ Partido
          </button>

          <button onClick={() => window.print()} title="Imprimir informe táctico limpio" className="p-2 hover:bg-neutral-800 rounded text-neutral-300">
            🖨️
          </button>

          <button onClick={() => setShowSaveModal(true)} title="Guardar pizarra actual" className="p-2 hover:bg-neutral-800 rounded text-neutral-300">
            💾
          </button>

          <div className="flex items-center gap-2 border-l border-neutral-800 pl-3">
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
              {currentUser?.role || 'SUPER ADMIN'}
            </span>
          </div>
        </div>
      </header>

      {/* --- CONTENIDO PRINCIPAL: CANCHA TÁCTICA --- */}
      <main className="flex-1 relative flex items-center justify-center p-2 bg-neutral-950">
        <div className="pitch-board-print relative w-full h-full max-w-5xl max-h-[85vh] bg-green-700 rounded-lg shadow-2xl border-4 border-neutral-800 overflow-hidden flex items-center justify-center">
          
          <svg
            ref={pitchSvgRef}
            className="w-full h-full cursor-crosshair"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          >
            <rect width="100" height="100" fill="#15803d" />
            
            {/* Líneas Reglamentarias */}
            <rect x="5" y="5" width="90" height="90" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <line x1="50" y1="5" x2="50" y2="95" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="50" cy="50" r="10" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="50" cy="50" r="0.8" fill="#ffffff" />

            {/* Áreas Izquierda */}
            <rect x="5" y="25" width="16" height="50" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <rect x="5" y="38" width="6" height="24" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="16" cy="50" r="0.8" fill="#ffffff" />
            <path d="M 21 42 A 10 10 0 0 1 21 58" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <rect x="1" y="44" width="4" height="12" fill="none" stroke="#eab308" strokeWidth="1.2" />

            {/* Áreas Derecha */}
            <rect x="79" y="25" width="16" height="50" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <rect x="89" y="38" width="6" height="24" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="84" cy="50" r="0.8" fill="#ffffff" />
            <path d="M 79 42 A 10 10 0 0 0 79 58" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <rect x="95" y="44" width="4" height="12" fill="none" stroke="#eab308" strokeWidth="1.2" />

            {/* Marcadores de Flechas */}
            <defs>
              <marker id="arrowhead" markerWidth="3" markerHeight="3" refX="2" refY="1.5" orient="auto">
                <polygon points="0 0, 3 1.5, 0 3" fill={drawColor} />
              </marker>
            </defs>

            {/* Trazos Dibujados */}
            {[...drawings, ...(currentLine ? [currentLine] : [])].map((line, idx) => (
              <path
                key={idx}
                d={renderPathD(line)}
                fill="none"
                stroke={line.color}
                strokeWidth={line.width * 0.25}
                strokeDasharray={line.type === 'dash' ? '3,3' : undefined}
                markerEnd={['arrow', 'zigzag'].includes(line.type) ? 'url(#arrowhead)' : undefined}
              />
            ))}

            {/* Elementos Dinámicos */}
            {elements.map((el) => {
              const isSelected = selectedId === el.id;
              const transform = `translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`;

              if (el.type === 'token') {
                return (
                  <g 
                    key={el.id} 
                    transform={transform} 
                    onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                    className="cursor-move"
                  >
                    <circle cx="0" cy="0" r="3.2" fill={el.color} stroke={isSelected ? '#eab308' : '#ffffff'} strokeWidth={isSelected ? '0.8' : '0.4'} />
                    <text x="0" y="1.1" textAnchor="middle" fill={el.color === '#ffffff' ? '#000000' : '#ffffff'} fontSize="3.2" fontWeight="bold">
                      {el.number}
                    </text>
                    {el.label && (
                      <text x="0" y="5.5" textAnchor="middle" fill="#ffffff" fontSize="2" fontWeight="bold">
                        {el.label}
                      </text>
                    )}
                  </g>
                );
              }

              if (el.type === 'ball') {
                return (
                  <g key={el.id} transform={transform} onMouseDown={(e) => handleElementMouseDown(e, el.id)} className="cursor-move">
                    <circle cx="0" cy="0" r="1.8" fill="#ffffff" stroke="#000000" strokeWidth="0.4" />
                    <polygon points="0,-1 0.95,-0.31 0.59,0.81 -0.59,0.81 -0.95,-0.31" fill="#000000" />
                  </g>
                );
              }

              if (el.type === 'mannequin') {
                return (
                  <g key={el.id} transform={transform} onMouseDown={(e) => handleElementMouseDown(e, el.id)} className="cursor-move">
                    <circle cx="0" cy="-2.5" r="1" fill="#eab308" />
                    <rect x="-1.2" y="-1.5" width="2.4" height="4.5" rx="0.5" fill="#eab308" />
                    <line x1="-1.5" y1="3" x2="1.5" y2="3" stroke="#eab308" strokeWidth="0.6" />
                  </g>
                );
              }

              if (el.type === 'slalom') {
                return (
                  <g key={el.id} transform={transform} onMouseDown={(e) => handleElementMouseDown(e, el.id)} className="cursor-move">
                    <rect x="-0.3" y="-3.5" width="0.6" height="7" fill="#eab308" rx="0.2" />
                    <circle cx="0" cy="3.5" r="0.8" fill="#000000" />
                  </g>
                );
              }

              if (el.type === 'text') {
                const fSize = el.size === 'small' ? '2.2' : el.size === 'large' ? '4.5' : '3.2';
                return (
                  <g key={el.id} transform={transform} onMouseDown={(e) => handleElementMouseDown(e, el.id)} className="cursor-move">
                    <rect x="-10" y="-3" width="20" height="6" rx="1" fill="rgba(0,0,0,0.75)" stroke={isSelected ? '#eab308' : 'none'} strokeWidth="0.4" />
                    <text x="0" y="1" textAnchor="middle" fill="#ffffff" fontSize={fSize} fontWeight="bold">
                      {el.content}
                    </text>
                  </g>
                );
              }

              return null;
            })}
          </svg>
        </div>
      </main>

      {/* --- BARRA INFERIOR COMPACTA --- */}
      <footer className="no-print bg-black/95 border-t border-neutral-800 p-2 z-20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setElements(prev => [...prev, { id: 'tk_' + Math.random(), type: 'token', color: '#f97316', number: 1, label: 'Portero', x: 20, y: 50, rotation: 0 }])}
            className="flex items-center justify-center h-8 px-2.5 rounded bg-amber-600 hover:bg-amber-500 font-black text-xs text-white"
            title="Añadir Portero directo"
          >
            🧤 1
          </button>

          {PALETTE_COLORS.map(c => (
            <button
              key={c.id}
              onClick={() => setElements(prev => [...prev, { id: 'tk_' + Math.random(), type: 'token', color: c.hex, number: 10, label: '', x: 50, y: 50, rotation: 0 }])}
              className="h-6 w-6 rounded-full border border-neutral-600 flex items-center justify-center font-bold text-[10px]"
              style={{ backgroundColor: c.hex, color: c.text }}
              title={`Ficha ${c.name}`}
            >
              10
            </button>
          ))}

          <button 
            onClick={() => setElements(prev => [...prev, { id: 'ball_' + Math.random(), type: 'ball', x: 50, y: 50, rotation: 0 }])}
            className="h-7 w-7 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold shadow"
            title="Añadir Balón"
          >
            ⚽
          </button>
        </div>

        {/* Trazos Compactos */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded">
          <button 
            onClick={() => setIsDrawingMode(!isDrawingMode)} 
            className={`px-2 py-0.5 rounded text-xs font-bold transition ${isDrawingMode ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-300'}`}
          >
            ✏️ Dibujo
          </button>

          {isDrawingMode && (
            <>
              <div className="flex items-center gap-1 border-l border-neutral-700 pl-2">
                <button onClick={() => setDrawType('arrow')} className={`px-1.5 py-0.5 text-xs rounded ${drawType === 'arrow' ? 'bg-amber-500/20 text-amber-300 border border-amber-500' : 'text-neutral-400'}`}>➔ Pase</button>
                <button onClick={() => setDrawType('dash')} className={`px-1.5 py-0.5 text-xs rounded ${drawType === 'dash' ? 'bg-amber-500/20 text-amber-300 border border-amber-500' : 'text-neutral-400'}`}>⇢ Carrera</button>
                <button onClick={() => setDrawType('straight')} className={`px-1.5 py-0.5 text-xs rounded ${drawType === 'straight' ? 'bg-amber-500/20 text-amber-300 border border-amber-500' : 'text-neutral-400'}`}>— Línea</button>
                <button onClick={() => setDrawType('zigzag')} className={`px-1.5 py-0.5 text-xs rounded ${drawType === 'zigzag' ? 'bg-amber-500/20 text-amber-300 border border-amber-500' : 'text-neutral-400'}`}>〰 Conducción</button>
              </div>

              <div className="flex items-center gap-1 border-l border-neutral-700 pl-2">
                {['#ffffff', '#dc2626', '#2563eb', '#eab308'].map(hex => (
                  <button key={hex} onClick={() => setDrawColor(hex)} className="h-4 w-4 rounded-full border border-neutral-600" style={{ backgroundColor: hex }} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              if (selectedId) {
                setElements(prev => prev.filter(el => el.id !== selectedId));
                setSelectedId(null);
              }
            }}
            className="p-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-red-400 rounded"
            title="Borrar elemento"
          >
            🗑️
          </button>
          <button 
            onClick={() => { setElements([]); setDrawings([]); }}
            className="p-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded"
            title="Limpiar pizarra"
          >
            🧹 Limpiar
          </button>
        </div>
      </footer>

      {/* --- PIE DE PÁGINA IMPRESIÓN OFICIAL --- */}
      <div className="hidden print-footer">
        {institution.name} • Andez Sports FC PRO • Software de Planificación & Táctica Deportiva
      </div>

      {/* --- MODAL 1: PROMPT IA --- */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md rounded-xl p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-base text-amber-400">Generador Asistido por IA</h3>
              <button onClick={() => setShowAiModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-neutral-400 mb-3">
              Escribe exactamente lo que necesitas (ej: <em>"un portero, 4 maniquies, un balon, una ficha roja con el numero 10"</em>).
            </p>
            <textarea
              rows="3"
              value={aiPromptText}
              onChange={(e) => setAiPromptText(e.target.value)}
              placeholder="Indica cantidades, elementos y colores..."
              className="w-full bg-neutral-800 border border-neutral-700 rounded p-2.5 text-sm text-white focus:outline-none focus:border-amber-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAiModal(false)} className="px-4 py-1.5 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300">
                Cancelar
              </button>
              <button onClick={() => parseAndExecutePrompt(aiPromptText)} className="px-4 py-1.5 text-xs rounded bg-amber-500 hover:bg-amber-600 text-black font-bold">
                Aplicar a la Pizarra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: TEXTO TÁCTICO FLOTANTE --- */}
      {showTextModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-sm rounded-xl p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-white">Añadir Texto a la Pizarra</h3>
              <button onClick={() => setShowTextModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Consigna táctica..."
              className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm text-white mb-3"
            />
            <div className="flex items-center gap-2 mb-4">
              <label className="text-xs text-neutral-400">Jerarquía:</label>
              <button onClick={() => setTextSize('small')} className={`px-2 py-1 text-xs rounded ${textSize === 'small' ? 'bg-amber-500 text-black font-bold' : 'bg-neutral-800'}`}>Nota</button>
              <button onClick={() => setTextSize('medium')} className={`px-2 py-1 text-xs rounded ${textSize === 'medium' ? 'bg-amber-500 text-black font-bold' : 'bg-neutral-800'}`}>Consigna</button>
              <button onClick={() => setTextSize('large')} className={`px-2 py-1 text-xs rounded ${textSize === 'large' ? 'bg-amber-500 text-black font-bold' : 'bg-neutral-800'}`}>Título</button>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowTextModal(false)} className="px-3 py-1.5 text-xs bg-neutral-800 rounded">Cancelar</button>
              <button onClick={addFloatingText} className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 font-bold rounded">Insertar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: SISTEMAS TÁCTICOS DINÁMICOS --- */}
      {showTacticsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md rounded-xl p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-amber-400">Sistemas Tácticos Dinámicos</h3>
              <button onClick={() => setShowTacticsModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 mb-4 max-h-56 overflow-y-auto">
              {tacticalSystems.map(sys => (
                <div key={sys.id} className="flex items-center justify-between p-2 bg-neutral-800 rounded">
                  <span className="text-sm font-semibold">{sys.name} <span className="text-xs text-neutral-400">({sys.code})</span></span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => applyTacticalSystem(sys.code)} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-xs rounded font-bold">Aplicar</button>
                    <button onClick={() => setTacticalSystems(prev => prev.filter(s => s.id !== sys.id))} className="p-1 text-red-400 text-xs hover:bg-neutral-700 rounded">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-neutral-800">
              <label className="text-xs text-neutral-400 block mb-1">Crear esquema propio (ej. 1-3-3-3):</label>
              <div className="flex gap-2">
                <input id="customCode" type="text" placeholder="1-3-3-3" className="w-1/2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs" />
                <button 
                  onClick={() => {
                    const inp = document.getElementById('customCode');
                    if (inp && inp.value.trim()) {
                      const newSys = { id: 's_' + Math.random(), name: `Esquema ${inp.value}`, code: inp.value.trim() };
                      setTacticalSystems(prev => [...prev, newSys]);
                      sbSet('tactical_systems', [...tacticalSystems, newSys]);
                      inp.value = '';
                    }
                  }}
                  className="w-1/2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded py-1"
                >
                  Guardar Sistema
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: MATERIALES DE ENTRENAMIENTO --- */}
      {showMaterialsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-sm rounded-xl p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-white">Materiales de Entrenamiento</h3>
              <button onClick={() => setShowMaterialsModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => { setElements(prev => [...prev, { id: 'm_' + Math.random(), type: 'mannequin', x: 50, y: 50, rotation: 0 }]); setShowMaterialsModal(false); }}
                className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded flex items-center gap-2 text-xs font-bold"
              >
                🧍 Maniquí de Barrera
              </button>
              <button 
                onClick={() => { setElements(prev => [...prev, { id: 'sl_' + Math.random(), type: 'slalom', x: 50, y: 50, rotation: 0 }]); setShowMaterialsModal(false); }}
                className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded flex items-center gap-2 text-xs font-bold text-amber-400"
              >
                📍 Bastón / Slalom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 5: GUARDAR SESIÓN --- */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-sm rounded-xl p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-white">Guardar Ejercicio</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <input id="sessName" type="text" placeholder="Nombre del ejercicio..." className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm text-white mb-2" />
            <input id="sessCategory" type="text" placeholder="Categoría (ej: Sub-12)..." className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm text-white mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSaveModal(false)} className="px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300">
                Cancelar
              </button>
              <button 
                onClick={() => {
                  const name = document.getElementById('sessName')?.value || 'Ejercicio Táctico';
                  const cat = document.getElementById('sessCategory')?.value || 'General';
                  const newSession = {
                    id: 'sess_' + Math.random(),
                    name,
                    category: cat,
                    date: new Date().toLocaleDateString('es-CL'),
                    elements,
                    drawings
                  };
                  const updated = [...sessionsList, newSession];
                  setSessionsList(updated);
                  sbSet('tactical_sessions', updated);
                  setShowSaveModal(false);
                }}
                className="px-4 py-1.5 text-xs bg-red-600 hover:bg-red-500 font-bold rounded"
              >
                Confirmar Guardado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 6: CENTRO DE MANDO DE PARTIDO (MATCH CENTER) --- */}
      {showMatchModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-2xl rounded-xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚽</span>
                <h2 className="font-black text-base text-white uppercase tracking-wider">Centro de Mando de Partido</h2>
              </div>
              <button onClick={() => setShowMatchModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>

            {/* Marcador y Cronómetro en Vivo */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex items-center justify-between mb-4">
              <div className="text-center w-1/3">
                <p className="text-xs text-neutral-400 uppercase font-bold">{institution.name}</p>
                <div className="text-4xl font-black text-green-400">{matchData.goalsOwn}</div>
                <div className="flex justify-center gap-1 mt-1">
                  <button onClick={() => setMatchData(p => ({ ...p, goalsOwn: p.goalsOwn + 1 }))} className="px-2 py-0.5 bg-neutral-800 text-xs rounded">+</button>
                  <button onClick={() => setMatchData(p => ({ ...p, goalsOwn: Math.max(0, p.goalsOwn - 1) }))} className="px-2 py-0.5 bg-neutral-800 text-xs rounded">-</button>
                </div>
              </div>

              <div className="text-center w-1/3 border-x border-neutral-800">
                <p className="text-xs text-amber-400 font-mono tracking-widest">
                  {String(Math.floor(matchData.timerSeconds / 60)).padStart(2, '0')}:{String(matchData.timerSeconds % 60).padStart(2, '0')}
                </p>
                <button 
                  onClick={() => setMatchData(p => ({ ...p, timerRunning: !p.timerRunning }))}
                  className={`mt-2 px-3 py-1 rounded text-xs font-bold ${matchData.timerRunning ? 'bg-red-600' : 'bg-green-600'}`}
                >
                  {matchData.timerRunning ? 'Pausar' : 'Iniciar'}
                </button>
              </div>

              <div className="text-center w-1/3">
                <p className="text-xs text-neutral-400 uppercase font-bold">{matchData.rival || 'Rival'}</p>
                <div className="text-4xl font-black text-red-400">{matchData.goalsRival}</div>
                <div className="flex justify-center gap-1 mt-1">
                  <button onClick={() => setMatchData(p => ({ ...p, goalsRival: p.goalsRival + 1 }))} className="px-2 py-0.5 bg-neutral-800 text-xs rounded">+</button>
                  <button onClick={() => setMatchData(p => ({ ...p, goalsRival: Math.max(0, p.goalsRival - 1) }))} className="px-2 py-0.5 bg-neutral-800 text-xs rounded">-</button>
                </div>
              </div>
            </div>

            {/* Datos Oficiales del Partido */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 text-xs">
              <input 
                type="text" 
                placeholder="Nombre del Rival..." 
                value={matchData.rival} 
                onChange={e => setMatchData({ ...matchData, rival: e.target.value })} 
                className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-white" 
              />
              <input 
                type="date" 
                value={matchData.date} 
                onChange={e => setMatchData({ ...matchData, date: e.target.value })} 
                className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-white" 
              />
              <input 
                type="text" 
                placeholder="Cancha / Lugar..." 
                value={matchData.pitchPlace} 
                onChange={e => setMatchData({ ...matchData, pitchPlace: e.target.value })} 
                className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-white" 
              />
              <input 
                type="text" 
                placeholder="Hora Partido (ej: 11:00)..." 
                value={matchData.matchTime} 
                onChange={e => setMatchData({ ...matchData, matchTime: e.target.value })} 
                className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-white" 
              />
              <input 
                type="text" 
                placeholder="Hora Llegada (ej: 09:45)..." 
                value={matchData.meetTime} 
                onChange={e => setMatchData({ ...matchData, meetTime: e.target.value })} 
                className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-white" 
              />
              <input 
                type="text" 
                placeholder="Árbitro Principal..." 
                value={matchData.referee} 
                onChange={e => setMatchData({ ...matchData, referee: e.target.value })} 
                className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-white" 
              />
            </div>

            {/* Citaciones Automatizadas */}
            <div className="border-t border-neutral-800 pt-3 mb-4">
              <h4 className="text-xs font-bold text-amber-400 mb-2 uppercase">Citación Individual vía WhatsApp</h4>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {studentsList.map(st => (
                  <div key={st.id} className="flex items-center justify-between p-2 bg-neutral-800/60 rounded text-xs">
                    <span>{st.name} <strong className="text-neutral-400">({st.position || 'Jugador'})</strong></span>
                    <div className="flex gap-1.5">
                      <button onClick={() => sendWhatsAppCitation(st, 'Titular')} className="px-2 py-0.5 bg-green-600 hover:bg-green-500 rounded text-[11px] font-bold">
                        💬 Titular
                      </button>
                      <button onClick={() => sendWhatsAppCitation(st, 'Suplente')} className="px-2 py-0.5 bg-neutral-700 hover:bg-neutral-600 rounded text-[11px]">
                        💬 Suplente
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-neutral-800 pt-3">
              <button onClick={() => window.print()} className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs rounded font-bold">
                🖨️ Imprimir Ficha Oficial
              </button>
              <button onClick={() => setShowMatchModal(false)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded">
                Guardar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 7: GESTIÓN INTEGRAL --- */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-3xl rounded-xl p-5 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-3">
                <button onClick={() => setAdminTab('sessions')} className={`text-xs font-bold px-3 py-1.5 rounded ${adminTab === 'sessions' ? 'bg-amber-500 text-black' : 'text-neutral-400'}`}>📁 Sesiones</button>
                <button onClick={() => setAdminTab('students')} className={`text-xs font-bold px-3 py-1.5 rounded ${adminTab === 'students' ? 'bg-amber-500 text-black' : 'text-neutral-400'}`}>📋 Alumnos</button>
                <button onClick={() => setAdminTab('teachers')} className={`text-xs font-bold px-3 py-1.5 rounded ${adminTab === 'teachers' ? 'bg-amber-500 text-black' : 'text-neutral-400'}`}>👔 Profesores</button>
                <button onClick={() => setAdminTab('settings')} className={`text-xs font-bold px-3 py-1.5 rounded ${adminTab === 'settings' ? 'bg-amber-500 text-black' : 'text-neutral-400'}`}>⚙️ Club</button>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {/* TAB SESIONES */}
              {adminTab === 'sessions' && (
                <div className="space-y-2">
                  {sessionsList.map(sess => (
                    <div key={sess.id} className="flex items-center justify-between p-3 bg-neutral-800 rounded">
                      <div>
                        <h4 className="font-bold text-sm text-white">{sess.name}</h4>
                        <p className="text-xs text-neutral-400">{sess.category} • {sess.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setElements(sess.elements || []);
                            setDrawings(sess.drawings || []);
                            setShowAdminModal(false);
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded"
                        >
                          Cargar
                        </button>
                        <button 
                          onClick={() => {
                            const updated = sessionsList.filter(s => s.id !== sess.id);
                            setSessionsList(updated);
                            sbSet('tactical_sessions', updated);
                          }}
                          className="p-1 text-red-400 text-xs hover:bg-neutral-700 rounded"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                  {sessionsList.length === 0 && <p className="text-xs text-neutral-500 text-center py-8">No hay ejercicios guardados aún.</p>}
                </div>
              )}

              {/* TAB ALUMNOS */}
              {adminTab === 'students' && (
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 bg-neutral-950 p-3 rounded">
                    <input id="stName" type="text" placeholder="Nombre Alumno..." className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-xs text-white" />
                    <input id="stRut" type="text" placeholder="RUT / ID..." className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-xs text-white" />
                    <input id="stBirth" type="date" className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-xs text-white" />
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
                          birth: document.getElementById('stBirth')?.value || '',
                          phone: document.getElementById('stPhone')?.value || '',
                          position: document.getElementById('stPos')?.value || 'Volante'
                        };
                        const updated = [...studentsList, newSt];
                        setStudentsList(updated);
                        sbSet('students_list', updated);
                      }}
                      className="col-span-2 sm:col-span-3 bg-red-600 hover:bg-red-500 text-xs font-bold rounded py-1.5"
                    >
                      + Agregar Alumno
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {studentsList.map(st => (
                      <div key={st.id} className="flex items-center justify-between p-2.5 bg-neutral-800 rounded text-xs">
                        <div>
                          <p className="font-bold text-white">{st.name} <span className="text-amber-400">({st.position})</span></p>
                          <p className="text-neutral-400 text-[11px]">RUT: {st.rut || 'N/A'} • F.Nac: {st.birth || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {st.phone && (
                            <a href={`https://wa.me/${st.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="px-2 py-0.5 bg-green-600 hover:bg-green-500 rounded text-[11px]">
                              WhatsApp
                            </a>
                          )}
                          <button 
                            onClick={() => {
                              const newName = prompt("Modificar Nombre:", st.name);
                              const newPos = prompt("Modificar Posición (Portero/Defensa/Volante/Delantero):", st.position);
                              if (newName) {
                                const updated = studentsList.map(s => s.id === st.id ? { ...s, name: newName, position: newPos || s.position } : s);
                                setStudentsList(updated);
                                sbSet('students_list', updated);
                              }
                            }}
                            className="p-1 hover:bg-neutral-700 rounded text-amber-400"
                            title="Editar datos sin borrar"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => {
                              const updated = studentsList.filter(s => s.id !== st.id);
                              setStudentsList(updated);
                              sbSet('students_list', updated);
                            }}
                            className="p-1 text-red-400 hover:bg-neutral-700 rounded"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB PROFESORES */}
              {adminTab === 'teachers' && (
                <div className="space-y-3">
                  <div className="bg-neutral-950 p-3 rounded border border-amber-500/40">
                    <p className="text-xs font-bold text-amber-400 uppercase">Contacto Directo Dirección</p>
                    <p className="text-sm font-black">{directorProfile.name}</p>
                    <a href={`https://wa.me/${directorProfile.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="inline-block mt-2 px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-xs font-bold">
                      💬 Contactar al Director por WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {/* TAB CONFIGURACIÓN CLUB */}
              {adminTab === 'settings' && (
                <div className="space-y-3 bg-neutral-950 p-4 rounded text-xs">
                  <h4 className="font-bold text-amber-400 uppercase">Configuración Oficial de la Escuela</h4>
                  <div>
                    <label className="block text-neutral-400 mb-1">Nombre Oficial de la Escuela:</label>
                    <input 
                      type="text" 
                      value={institution.name} 
                      onChange={e => {
                        const updated = { ...institution, name: e.target.value };
                        setInstitution(updated);
                        sbSet('institution_profile', updated);
                      }} 
                      className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">URL Escudo / Logotipo:</label>
                    <input 
                      type="text" 
                      value={institution.logo} 
                      onChange={e => {
                        const updated = { ...institution, logo: e.target.value };
                        setInstitution(updated);
                        sbSet('institution_profile', updated);
                      }} 
                      className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
