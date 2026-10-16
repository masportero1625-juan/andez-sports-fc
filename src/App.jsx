import React, { useState, useEffect, useRef } from 'react';

// --- CONFIGURACIÓN REST NATIVA SUPABASE (SIN DEPENDENCIAS EXTERNAS) ---
const SUPABASE_URL = "https://hzfvckmgycvvshckwypf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6ZnZja21neWN2dnNoY2t3eXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDcxNzcsImV4cCI6MjA2MDAxMTE3N30.Z651c6c6b328a64ed41e3d489da924cf3832d2fe102874136427a1e050ff8156";

const MASTER_PIN = "ANDEZ2026";
const WHATSAPP_SOPORTE = "56932100183";

// Métodos de Persistencia en la Nube
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

// Paleta Oficial de 8 Colores
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

// Catálogo Completo de Materiales de Entrenamiento
const TRAINING_MATERIALS = [
  { id: 'cone_orange', name: 'Cono Naranja', icon: '🔺', color: '#f97316' },
  { id: 'cone_yellow', name: 'Cono Amarillo', icon: '⚠️', color: '#eab308' },
  { id: 'cone_blue', name: 'Cono Azul', icon: '🔹', color: '#2563eb' },
  { id: 'saucer_orange', name: 'Plato Chino Naranja', icon: '🟠', color: '#f97316' },
  { id: 'saucer_yellow', name: 'Plato Chino Amarillo', icon: '🟡', color: '#eab308' },
  { id: 'saucer_blue', name: 'Plato Chino Azul', icon: '🔵', color: '#2563eb' },
  { id: 'slalom', name: 'Bastón de Slalom', icon: '📍', color: '#eab308' },
  { id: 'mannequin', name: 'Maniquí de Barrera', icon: '🧍', color: '#eab308' },
  { id: 'hurdle', name: 'Valla de Salto', icon: '⛩️', color: '#ffffff' },
  { id: 'ladder', name: 'Escalera de Coordinación', icon: '🪜', color: '#eab308' },
  { id: 'hoop', name: 'Aro de Agilidad', icon: '⭕', color: '#ef4444' }
];

export default function App() {
  // --- AUTENTICACIÓN & SESIÓN ---
  const [currentUser, setCurrentUser] = useState({ role: 'SUPER ADMIN', name: 'Director Deportivo' });
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Identidad Institucional
  const [institution, setInstitution] = useState({ name: 'Andez Sports FC', logo: '' });
  const [directorProfile, setDirectorProfile] = useState({ name: 'Director Deportivo', rut: '', phone: WHATSAPP_SOPORTE });

  // Vistas de Cancha (Entera, Media, ABP)
  const [pitchView, setPitchView] = useState('full');

  // Modales
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showTacticsModal, setShowTacticsModal] = useState(false);
  const [showMaterialsBar, setShowMaterialsBar] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showSuperAdminModal, setShowSuperAdminModal] = useState(false);
  const [adminTab, setAdminTab] = useState('sessions');

  // Pizarra
  const [elements, setElements] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // Barra de Dibujo
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawType, setDrawType] = useState('arrow');
  const [drawColor, setDrawColor] = useState('#ffffff');
  const [drawWidth, setDrawWidth] = useState(3);
  const [currentLine, setCurrentLine] = useState(null);

  // Ficha y Portero
  const [activeTokenColor, setActiveTokenColor] = useState('#2563eb');

  // Grabador
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Base de Datos
  const [sessionsList, setSessionsList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [tacticalSystems, setTacticalSystems] = useState([
    { id: 's1', name: 'Formación 4-3-3', code: '1-4-3-3' },
    { id: 's2', name: 'Formación 4-4-2', code: '1-4-4-2' },
    { id: 's3', name: 'Formación 3-5-2', code: '1-3-5-2' },
    { id: 's4', name: 'Formación 4-2-3-1', code: '1-4-2-3-1' }
  ]);

  // Planes de Pago y Licencias SaaS (Super Admin)
  const [saasPlans, setSaasPlans] = useState([
    { id: 'p1', name: 'Plan Básico Escuela', price: 29990, maxTeachers: 3, maxStudents: 50, status: 'Activo' },
    { id: 'p2', name: 'Plan Profesional Club', price: 59990, maxTeachers: 10, maxStudents: 200, status: 'Activo' },
    { id: 'p3', name: 'Plan Élite Ilimitado', price: 99990, maxTeachers: 999, maxStudents: 9999, status: 'Activo' }
  ]);
  const [assignedLicenses, setAssignedLicenses] = useState([
    { id: 'lic_1', clubName: 'Andez Sports FC', pinCode: 'ANDEZ2026', plan: 'Plan Élite Ilimitado', expireDate: '2027-12-31', active: true }
  ]);

  // Centro de Partido (Match Center)
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

  // Carga Cloud
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
    const plans = await sbGet('saas_plans');
    if (plans) setSaasPlans(plans);
    const lics = await sbGet('saas_licenses');
    if (lics) setAssignedLicenses(lics);
  };

  useEffect(() => {
    loadCloud();
  }, []);

  // Login por PIN
  const handleLogin = (e) => {
    e.preventDefault();
    const cleanPin = pinInput.trim().toUpperCase();
    if (cleanPin === MASTER_PIN) {
      setCurrentUser({ role: 'SUPER ADMIN', name: directorProfile.name });
      setAuthError('');
      return;
    }
    const licFound = assignedLicenses.find(l => l.pinCode.trim().toUpperCase() === cleanPin && l.active);
    if (licFound) {
      setCurrentUser({ role: 'SUPER ADMIN', name: licFound.clubName });
      setAuthError('');
      return;
    }
    const teacherFound = teachersList.find(t => t.code && t.code.trim().toUpperCase() === cleanPin);
    if (teacherFound) {
      setCurrentUser({ role: 'PROFESOR', ...teacherFound });
      setAuthError('');
      return;
    }
    setAuthError('Clave incorrecta. Usa ANDEZ2026 o tu clave asignada.');
  };

  // Subir Escudo Base64
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
      newItems.push({ id: 'ai_' + Math.random(), type: 'token', color: '#f97316', number: 1, name: 'Portero', x: 14, y: 50, rotation: 0 });
    }

    const maniquiMatch = lower.match(/(\d+|un|una|dos|tres|cuatro|cinco)\s+maniqu/);
    const maniquiCount = maniquiMatch ? extractCount(/(\d+|un|una|dos|tres|cuatro|cinco)\s+maniqu/) : (lower.includes('maniqu') ? 1 : 0);
    if (maniquiCount > 0) {
      const startY = 50 - ((maniquiCount - 1) * 6) / 2;
      for (let i = 0; i < maniquiCount; i++) {
        newItems.push({ id: 'ai_m_' + Math.random(), type: 'material', icon: '🧍', color: '#eab308', name: '', x: 32, y: startY + i * 6, rotation: 0 });
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
        newItems.push({ id: 'ai_t_' + Math.random(), type: 'token', color: hex, number: numStr + i, name: '', x: 45 + i * 5, y: 45 + i * 5, rotation: 0 });
      }
    }

    if (!foundTokens && (lower.includes('jugador') || lower.includes('ficha'))) {
      newItems.push({ id: 'ai_def_' + Math.random(), type: 'token', color: '#dc2626', number: 10, name: '', x: 46, y: 50, rotation: 0 });
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

  // Coordenadas SVG Proporcionales
  const pitchSvgRef = useRef(null);
  const getSvgCoordinates = (e) => {
    const svg = pitchSvgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;

    if (pitchView === 'half') {
      return {
        x: ((cx - rect.left) / rect.width) * 50,
        y: ((cy - rect.top) / rect.height) * 100
      };
    }
    if (pitchView === 'box') {
      return {
        x: ((cx - rect.left) / rect.width) * 40,
        y: 20 + ((cy - rect.top) / rect.height) * 60
      };
    }
    return {
      x: ((cx - rect.left) / rect.width) * 100,
      y: ((cy - rect.top) / rect.height) * 100
    };
  };

  // Trazos Bézier
  const handlePointerDown = (e) => {
    if (!isDrawingMode) return;
    const coords = getSvgCoordinates(e);
    setCurrentLine({ id: 'draw_' + Math.random(), type: drawType, color: drawColor, width: drawWidth, points: [coords] });
  };

  const handlePointerMove = (e) => {
    if (!isDrawingMode || !currentLine) return;
    const coords = getSvgCoordinates(e);
    const lastPt = currentLine.points[currentLine.points.length - 1];
    const dist = Math.hypot(coords.x - lastPt.x, coords.y - lastPt.y);
    if (dist >= 1.5) {
      setCurrentLine(prev => ({ ...prev, points: [...prev.points, coords] }));
    }
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
        const p1 = pts[i - 1];
        const p2 = pts[i];
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const offset = (i % 2 === 0 ? 1.5 : -1.5) * (line.width * 0.35);
        d += ` Q ${mx + nx * offset} ${my + ny * offset}, ${p2.x} ${p2.y}`;
      }
      return d;
    }
    return pts.reduce((acc, p, idx) => acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), '');
  };

  // Arrastre
  const [dragItem, setDragItem] = useState(null);
  const handlePitchMouseMove = (e) => {
    if (!dragItem) return;
    const coords = getSvgCoordinates(e);
    setElements(prev => prev.map(el => el.id === dragItem ? { ...el, x: coords.x, y: coords.y } : el));
  };

  // Grabador
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

  // Citación WhatsApp
  const sendWhatsAppCitation = (student, role) => {
    if (!student.phone) {
      alert("El alumno no tiene registrado teléfono WhatsApp.");
      return;
    }
    const msg = `Estimado(a) apoderado(a) de ${student.name}, le informamos desde ${institution.name} que ha sido CITADO (${role.toUpperCase()}) para el partido frente a ${matchData.rival || 'el rival'}. Fecha: ${matchData.date} a las ${matchData.matchTime} hrs en ${matchData.pitchPlace}. Presentarse puntualmente a las ${matchData.meetTime} hrs con indumentaria oficial.`;
    window.open(`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Dimensiones de Cancha
  const pitchContainerStyle = pitchView === 'half'
    ? { aspectRatio: '34 / 50', maxWidth: '420px' }
    : pitchView === 'box'
    ? { aspectRatio: '40 / 60', maxWidth: '450px' }
    : { aspectRatio: '100 / 68', maxWidth: '980px' };

  const currentViewBox = pitchView === 'half'
    ? '0 0 50 100'
    : pitchView === 'box'
    ? '0 20 40 60'
    : '0 0 100 100';

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

          <div className="mt-6 border-t border-neutral-800 pt-4">
            <a 
              href={`https://wa.me/${WHATSAPP_SOPORTE}?text=${encodeURIComponent('Hola, necesito asistencia o clave de acceso para Andez Sports FC')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/40 rounded-lg text-xs font-bold transition"
            >
              💬 Contactar Soporte WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-screen w-screen bg-neutral-900 text-white select-none overflow-hidden font-sans"
      onMouseMove={handlePitchMouseMove}
      onMouseUp={() => setDragItem(null)}
      onTouchMove={handlePitchMouseMove}
      onTouchEnd={() => setDragItem(null)}
    >
      <style>{`
        @media print {
          body, html { margin: 0; padding: 0; background: white !important; }
          .no-print { display: none !important; }
          .print-header { display: flex !important; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding: 12px 20px; color: black; }
          .print-footer { display: block !important; text-align: center; border-top: 1px solid #ccc; padding: 8px; font-size: 11px; color: #555; position: fixed; bottom: 0; width: 100%; }
        }
      `}</style>

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
          <p>Profesor / Director: {currentUser.name}</p>
        </div>
      </div>

      {/* HEADER SUPERIOR */}
      <header className="no-print h-14 bg-black/95 border-b border-neutral-800 flex items-center justify-between px-3 z-20">
        <div className="flex items-center gap-2">
          {institution.logo ? <img src={institution.logo} alt="Logo" className="h-8 w-8 object-contain" /> : <span className="font-extrabold text-amber-500 text-base">EZ</span>}
          <span className="font-bold text-xs uppercase tracking-wider text-neutral-300 hidden md:inline">{institution.name}</span>

          <div className="flex items-center bg-neutral-800 p-0.5 rounded ml-2">
            <button onClick={() => setPitchView('full')} className={`px-2 py-1 text-[11px] rounded transition ${pitchView === 'full' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400'}`}>Entera</button>
            <button onClick={() => setPitchView('half')} className={`px-2 py-1 text-[11px] rounded transition ${pitchView === 'half' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400'}`}>Media</button>
            <button onClick={() => setPitchView('box')} className={`px-2 py-1 text-[11px] rounded transition ${pitchView === 'box' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400'}`}>Área ABP</button>
          </div>

          <button onClick={() => setShowAdminModal(true)} className="p-2 hover:bg-neutral-800 rounded text-xs text-neutral-300">📁 Gestión</button>
          <button onClick={() => setShowTacticsModal(true)} className="p-2 hover:bg-neutral-800 rounded text-xs text-neutral-300">📋 Sistemas</button>
          <button onClick={() => setShowMaterialsBar(!showMaterialsBar)} className={`p-2 rounded text-xs transition ${showMaterialsBar ? 'bg-amber-500 text-black font-bold' : 'hover:bg-neutral-800 text-neutral-300'}`}>🚧 Materiales</button>
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

          <button 
            onClick={() => setShowSuperAdminModal(true)}
            className="text-[11px] px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider transition shadow cursor-pointer border border-amber-300"
            title="Abrir Panel Maestro de Super Administrador (Planes y Licencias)"
          >
            👑 SUPER ADMIN
          </button>

          <button onClick={() => setCurrentUser(null)} title="Cerrar Sesión" className="text-xs text-neutral-400 hover:text-white border-l border-neutral-800 pl-2">
            🔒 Salir
          </button>
        </div>
      </header>

      {/* CANCHA TÁCTICA */}
      <main className="flex-1 relative flex items-center justify-center p-2 bg-neutral-950">
        <div 
          style={pitchContainerStyle}
          className="relative w-full h-full max-h-[85vh] bg-green-700 rounded-lg shadow-2xl border-4 border-neutral-800 overflow-hidden flex items-center justify-center transition-all duration-300"
        >
          <svg
            ref={pitchSvgRef}
            className="w-full h-full cursor-crosshair"
            viewBox={currentViewBox}
            preserveAspectRatio="xMidYMid meet"
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
            <path d="M 21 42 A 10 10 0 0 1 21 58" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <rect x="1" y="44" width="4" height="12" fill="none" stroke="#eab308" strokeWidth="1.2" />

            <rect x="79" y="25" width="16" height="50" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <rect x="89" y="38" width="6" height="24" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="84" cy="50" r="0.8" fill="#ffffff" />
            <path d="M 79 42 A 10 10 0 0 0 79 58" fill="none" stroke="#ffffff" strokeWidth="0.8" />
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
                  <g 
                    key={el.id} 
                    transform={transform} 
                    onMouseDown={(e) => { e.stopPropagation(); setSelectedId(el.id); setDragItem(el.id); }} 
                    onDoubleClick={() => {
                      const newNum = prompt("Modificar Dorsal:", el.number);
                      const newName = prompt("Modificar Nombre Jugador:", el.name || '');
                      setElements(prev => prev.map(item => item.id === el.id ? { ...item, number: newNum !== null ? newNum : item.number, name: newName !== null ? newName : item.name } : item));
                    }}
                    className="cursor-move"
                  >
                    <circle cx="0" cy="0" r="3.2" fill={el.color} stroke={isSelected ? '#eab308' : '#ffffff'} strokeWidth={isSelected ? '0.8' : '0.4'} />
                    <text x="0" y="1.1" textAnchor="middle" fill={el.color === '#ffffff' ? '#000000' : '#ffffff'} fontSize="3.2" fontWeight="bold">
                      {el.number}
                    </text>
                    {el.name && (
                      <text x="0" y="5.8" textAnchor="middle" fill="#ffffff" fontSize="2" fontWeight="bold" stroke="#000000" strokeWidth="0.3">
                        {el.name}
                      </text>
                    )}
                  </g>
                );
              }

              if (el.type === 'ball') {
                return (
                  <g key={el.id} transform={transform} onMouseDown={(e) => { e.stopPropagation(); setSelectedId(el.id); setDragItem(el.id); }} className="cursor-move">
                    <circle cx="0" cy="0" r="1.8" fill="#ffffff" stroke="#000000" strokeWidth="0.4" />
                    <polygon points="0,-1 0.95,-0.31 0.59,0.81 -0.59,0.81 -0.95,-0.31" fill="#000000" />
                  </g>
                );
              }

              if (el.type === 'text') {
                const fs = el.size === 'small' ? '2.4' : el.size === 'large' ? '4.8' : '3.4';
                return (
                  <g 
                    key={el.id} 
                    transform={transform} 
                    onMouseDown={(e) => { e.stopPropagation(); setSelectedId(el.id); setDragItem(el.id); }} 
                    onDoubleClick={() => {
                      const newTxt = prompt("Editar texto:", el.content);
                      if (newTxt) setElements(prev => prev.map(item => item.id === el.id ? { ...item, content: newTxt } : item));
                    }}
                    className="cursor-move"
                  >
                    <rect x="-12" y="-3.2" width="24" height="6.4" rx="1.2" fill="rgba(0,0,0,0.65)" stroke={isSelected ? '#eab308' : '#ffffff'} strokeWidth="0.3" />
                    <text x="0" y="1.2" textAnchor="middle" fill="#ffffff" fontSize={fs} fontWeight="bold" className="font-sans">
                      {el.content}
                    </text>
                  </g>
                );
              }

              return (
                <g key={el.id} transform={transform} onMouseDown={(e) => { e.stopPropagation(); setSelectedId(el.id); setDragItem(el.id); }} className="cursor-move">
                  <circle cx="0" cy="0" r="2.2" fill={el.color || '#eab308'} stroke={isSelected ? '#ffffff' : '#000000'} strokeWidth="0.4" />
                  <text x="0" y="0.8" textAnchor="middle" fontSize="2.2">{el.icon || '📍'}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </main>

      {/* BARRA INFERIOR DE MATERIALES */}
      {showMaterialsBar && (
        <div className="no-print bg-neutral-900 border-t border-neutral-800 px-3 py-1.5 flex items-center gap-2 overflow-x-auto z-20">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider shrink-0">Materiales:</span>
          {TRAINING_MATERIALS.map(mat => (
            <button
              key={mat.id}
              onClick={() => setElements(p => [...p, { id: 'mat_' + Math.random(), type: 'material', icon: mat.icon, color: mat.color, x: 50, y: 50, rotation: 0 }])}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 rounded flex items-center gap-1.5 text-xs shrink-0 border border-neutral-700"
            >
              <span>{mat.icon}</span> <span>{mat.name}</span>
            </button>
          ))}
          <button onClick={() => setShowMaterialsBar(false)} className="ml-auto text-xs text-neutral-400 hover:text-white px-2">✕</button>
        </div>
      )}

      {/* FOOTER BARRA COMPACTA */}
      <footer className="no-print bg-black/95 border-t border-neutral-800 p-2 z-20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setElements(p => [...p, { id: 'tk_' + Math.random(), type: 'token', color: activeTokenColor, number: 1, name: 'Portero', x: 20, y: 50, rotation: 0 }])}
            className="h-7 px-2.5 rounded font-black text-xs text-white shadow border border-neutral-700 flex items-center gap-1"
            style={{ backgroundColor: activeTokenColor }}
            title="Añadir Portero con color activo"
          >
            🧤 1
          </button>

          {PALETTE_COLORS.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setActiveTokenColor(c.hex);
                setElements(p => [...p, { id: 'tk_' + Math.random(), type: 'token', color: c.hex, number: 10, name: '', x: 50, y: 50, rotation: 0 }]);
              }}
              className={`h-6 w-6 rounded-full border flex items-center justify-center font-bold text-[10px] transition ${activeTokenColor === c.hex ? 'ring-2 ring-amber-400 scale-110' : 'border-neutral-600'}`}
              style={{ backgroundColor: c.hex, color: c.text }}
              title={`Ficha ${c.name}`}
            >
              10
            </button>
          ))}

          <button 
            onClick={() => setElements(p => [...p, { id: 'ball_' + Math.random(), type: 'ball', x: 50, y: 50, rotation: 0 }])}
            className="h-6 w-6 rounded-full bg-white text-black flex items-center justify-center text-xs"
            title="Añadir Balón"
          >
            ⚽
          </button>
        </div>

        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded">
          <button onClick={() => setIsDrawingMode(!isDrawingMode)} className={`px-2 py-0.5 rounded text-xs font-bold transition ${isDrawingMode ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-300'}`}>
            ✏️ Dibujo
          </button>

          {isDrawingMode && (
            <>
              <div className="flex items-center gap-1 border-l border-neutral-700 pl-2">
                <button onClick={() => setDrawType('arrow')} className={`px-1.5 py-0.5 text-xs rounded ${drawType === 'arrow' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400'}`}>➔ Pase</button>
                <button onClick={() => setDrawType('dash')} className={`px-1.5 py-0.5 text-xs rounded ${drawType === 'dash' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400'}`}>⇢ Carrera</button>
                <button onClick={() => setDrawType('straight')} className={`px-1.5 py-0.5 text-xs rounded ${drawType === 'straight' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400'}`}>— Línea</button>
                <button onClick={() => setDrawType('zigzag')} className={`px-1.5 py-0.5 text-xs rounded ${drawType === 'zigzag' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400'}`}>〰 Conducción</button>
              </div>

              <div className="flex items-center gap-1 border-l border-neutral-700 pl-2">
                {['#ffffff', '#dc2626', '#2563eb', '#eab308'].map(hex => (
                  <button 
                    key={hex} 
                    onClick={() => setDrawColor(hex)} 
                    className={`h-4 w-4 rounded-full border ${drawColor === hex ? 'ring-2 ring-white scale-110' : 'border-neutral-600'}`} 
                    style={{ backgroundColor: hex }} 
                  />
                ))}
              </div>

              <div className="flex items-center gap-1 border-l border-neutral-700 pl-2">
                <button onClick={() => setDrawWidth(2)} className={`px-1 py-0.5 text-[10px] rounded ${drawWidth === 2 ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400'}`}>Fino</button>
                <button onClick={() => setDrawWidth(4)} className={`px-1 py-0.5 text-[10px] rounded ${drawWidth === 4 ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400'}`}>Medio</button>
                <button onClick={() => setDrawWidth(6)} className={`px-1 py-0.5 text-[10px] rounded ${drawWidth === 6 ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400'}`}>Grueso</button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => { if (selectedId) { setElements(p => p.filter(e => e.id !== selectedId)); setSelectedId(null); } }} 
            className="p-1.5 text-red-400 hover:bg-neutral-800 rounded text-xs" 
            title="Borrar elemento"
          >
            🗑️
          </button>
          <button 
            onClick={() => { setElements([]); setDrawings([]); }} 
            className="p-1.5 text-neutral-400 hover:bg-neutral-800 rounded text-xs" 
            title="Limpiar pizarra"
          >
            🧹 Limpiar
          </button>
        </div>
      </footer>

      {/* MODAL MAESTRO: SUPER ADMINISTRADOR */}
      {showSuperAdminModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border-2 border-amber-500 w-full max-w-4xl rounded-2xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👑</span>
                <div>
                  <h2 className="text-lg font-black text-amber-400 uppercase tracking-wider">Centro de Control Super Administrador</h2>
                  <p className="text-xs text-neutral-400">Gestión de Planes SaaS, Cobros, Licencias y Claves Maestras</p>
                </div>
              </div>
              <button onClick={() => setShowSuperAdminModal(false)} className="text-neutral-400 hover:text-white text-base">✕</button>
            </div>

            {/* PLANES SAAS */}
            <div className="mb-6 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
              <h3 className="text-xs font-bold text-amber-400 uppercase mb-3 tracking-wider">Configuración de Planes y Tarifas Comerciales</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {saasPlans.map(plan => (
                  <div key={plan.id} className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 relative">
                    <p className="font-black text-white text-sm">{plan.name}</p>
                    <p className="text-lg font-mono font-bold text-green-400 my-1">\${plan.price.toLocaleString('es-CL')} / mes</p>
                    <p className="text-[11px] text-neutral-400">Máx. DTs: <strong>{plan.maxTeachers}</strong></p>
                    <p className="text-[11px] text-neutral-400">Máx. Alumnos: <strong>{plan.maxStudents}</strong></p>
                    <button 
                      onClick={() => {
                        const newPrice = prompt(`Nuevo precio para ${plan.name} (en CLP):`, plan.price);
                        if (newPrice) {
                          const updated = saasPlans.map(p => p.id === plan.id ? { ...p, price: parseInt(newPrice) || p.price } : p);
                          setSaasPlans(updated);
                          sbSet('saas_plans', updated);
                        }
                      }}
                      className="mt-3 w-full py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-bold rounded"
                    >
                      ✏️ Modificar Precio
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ASIGNACIÓN DE LICENCIAS */}
            <div className="mb-6 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
              <h3 className="text-xs font-bold text-amber-400 uppercase mb-3 tracking-wider">Emisión de Licencias y Asignación de Claves PIN</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3">
                <input id="licClub" type="text" placeholder="Nombre Club / Escuela..." className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-xs text-white" />
                <input id="licPin" type="text" placeholder="PIN Clave (ej: COLO2026)..." className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-xs text-white" />
                <select id="licPlan" className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-xs text-white">
                  {saasPlans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
                <button 
                  onClick={() => {
                    const club = document.getElementById('licClub')?.value;
                    const pin = document.getElementById('licPin')?.value;
                    const plan = document.getElementById('licPlan')?.value;
                    if (!club || !pin) return alert("Completa Club y PIN");
                    const newLic = {
                      id: 'lic_' + Math.random(),
                      clubName: club,
                      pinCode: pin.toUpperCase(),
                      plan,
                      expireDate: '2027-12-31',
                      active: true
                    };
                    const updated = [...assignedLicenses, newLic];
                    setAssignedLicenses(updated);
                    sbSet('saas_licenses', updated);
                  }}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded py-1.5"
                >
                  + Asignar Licencia
                </button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {assignedLicenses.map(lic => (
                  <div key={lic.id} className="flex items-center justify-between p-2.5 bg-neutral-900 rounded border border-neutral-800 text-xs">
                    <div>
                      <p className="font-bold text-white">{lic.clubName} — <span className="text-amber-400 font-mono">PIN: {lic.pinCode}</span></p>
                      <p className="text-[11px] text-neutral-400">Plan: {lic.plan} • Vence: {lic.expireDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${lic.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {lic.active ? 'ACTIVA' : 'SUSPENDIDA'}
                      </span>
                      <button 
                        onClick={() => {
                          const updated = assignedLicenses.map(l => l.id === lic.id ? { ...l, active: !l.active } : l);
                          setAssignedLicenses(updated);
                          sbSet('saas_licenses', updated);
                        }}
                        className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px]"
                      >
                        {lic.active ? 'Suspender' : 'Activar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end border-t border-neutral-800 pt-3">
              <button onClick={() => setShowSuperAdminModal(false)} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs rounded-lg">
                Cerrar Panel Maestro
              </button>
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
                        const name = document.getElementById('tcName')?.value;
                        const code = document.getElementById('tcCode')?.value;
                        if (!name || !code) return alert("Ingresa al menos Nombre y Clave");
                        const newTc = {
                          id: 'tc_' + Math.random(),
                          name,
                          role: document.getElementById('tcRole')?.value || 'DT',
                          category: document.getElementById('tcCat')?.value || 'General',
                          phone: document.getElementById('tcPhone')?.value || '',
                          code
                        };
                        const updated = [...teachersList, newTc];
                        setTeachersList(updated);
                        sbSet('teachers_list', updated);
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded py-1.5"
                    >
                      + Guardar Profesor
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {teachersList.map(tc => (
                      <div key={tc.id} className="flex items-center justify-between p-2.5 bg-neutral-800 rounded text-xs">
                        <div>
                          <p className="font-bold text-white">{tc.name} <span className="text-amber-400">({tc.role})</span></p>
                          <p className="text-[11px] text-neutral-400">Cat: {tc.category} • Clave: <strong>{tc.code}</strong></p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {tc.phone && (
                            <a href={`https://wa.me/${tc.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="px-2 py-0.5 bg-green-600 rounded text-[11px]">WhatsApp</a>
                          )}
                          <button onClick={() => { const up = teachersList.filter(t => t.id !== tc.id); setTeachersList(up); sbSet('teachers_list', up); }} className="p-1 text-red-400 hover:bg-neutral-700 rounded">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminTab === 'settings' && (
                <div className="space-y-4 bg-neutral-950 p-4 rounded text-xs">
                  <h4 className="font-bold text-amber-400 uppercase">Identidad Oficial del Club</h4>
                  <div>
                    <label className="block text-neutral-400 mb-1">Nombre Oficial de la Escuela:</label>
                    <input 
                      type="text" 
                      value={institution.name} 
                      onChange={e => {
                        const up = { ...institution, name: e.target.value };
                        setInstitution(up);
                        sbSet('institution_profile', up);
                      }} 
                      className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Subir Escudo / Logo desde tu Computador:</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoUpload}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white" 
                    />
                    {institution.logo && (
                      <div className="mt-2 flex items-center gap-3">
                        <img src={institution.logo} alt="Vista previa" className="h-12 w-12 object-contain rounded bg-neutral-900 border border-neutral-700 p-1" />
                        <span className="text-[11px] text-green-400">Logo cargado y sincronizado en Supabase</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL TEXTO FLOTANTE */}
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

      {/* MODAL GUARDAR SESIÓN */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-sm rounded-xl p-4 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-white">Guardar Ejercicio</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <input id="sessName" type="text" placeholder="Nombre del ejercicio..." className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm text-white mb-2" />
            <input id="sessCategory" type="text" placeholder="Categoría (ej: Sub-12)..." className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm text-white mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSaveModal(false)} className="px-3 py-1.5 text-xs bg-neutral-800 rounded text-neutral-300">
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

      {/* MODAL MATCH CENTER */}
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

      {/* MODAL SISTEMAS TÁCTICOS */}
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
                    <button 
                      onClick={() => {
                        const parts = sys.code.split('-').map(Number);
                        const newItems = [{ id: 't_gk', type: 'token', color: activeTokenColor, number: 1, name: 'Portero', x: 12, y: 50, rotation: 0 }];
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
                              name: '',
                              x: curX,
                              y: 10 + (c + 1) * stepY,
                              rotation: 0
                            });
                            dorsalCounter++;
                          }
                        }
                        setElements(newItems);
                        setShowTacticsModal(false);
                      }} 
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-xs rounded font-bold"
                    >
                      Aplicar
                    </button>
                    <button onClick={() => setTacticalSystems(prev => prev.filter(s => s.id !== sys.id))} className="p-1 text-red-400 text-xs hover:bg-neutral-700 rounded">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROMPT IA */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md rounded-xl p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-base text-amber-400">Generador Asistido por IA</h3>
              <button onClick={() => setShowAiModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-neutral-400 mb-3">
              Escribe elementos y cantidades (ej: <em>"un portero, 4 maniquies, un balon, 3 fichas rojas con el dorsal 7"</em>).
            </p>
            <textarea
              rows="3"
              value={aiPromptText}
              onChange={(e) => setAiPromptText(e.target.value)}
              placeholder="Indica qué posicionar en el campo..."
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
    </div>
  );
}
