import React, { useState, useRef, useEffect } from 'react';
import {
  Folder, Play, RotateCcw, Shirt, Share2, Save, Undo2, Redo2, Trash2, PenTool, X, ChevronRight,
  Eraser, Lock, ShieldCheck, Plus, Calendar, AlertTriangle, RotateCw, LogOut, MessageCircle,
  Upload, Printer, Edit2, Video, Square, Download, Sparkles, Gift
} from 'lucide-react';

const DEFAULT_CATEGORIES = [
  { id: 'sub10', name: 'Sub-8 a Sub-10 (Iniciación)' },
  { id: 'sub14', name: 'Sub-12 a Sub-14 (Formación)' },
  { id: 'sub18', name: 'Sub-16 a Juvenil (Especialización)' },
  { id: 'senior', name: 'Adulto / Senior (Rendimiento)' },
];

const GET_TACTICAL_SYSTEMS = (isLand) => {
  if (isLand) {
    return {
      '4-3-3': [{n:'1',r:'GK',x:8,y:34},{n:'4',r:'CB',x:22,y:24},{n:'3',r:'CB',x:22,y:44},{n:'2',r:'RB',x:30,y:10},{n:'5',r:'LB',x:30,y:58},{n:'6',r:'CDM',x:40,y:34},{n:'8',r:'CM',x:52,y:22},{n:'10',r:'CAM',x:52,y:46},{n:'7',r:'RW',x:74,y:12},{n:'11',r:'LW',x:74,y:56},{n:'9',r:'ST',x:82,y:34}],
      '4-4-2': [{n:'1',r:'GK',x:8,y:34},{n:'4',r:'CB',x:22,y:24},{n:'3',r:'CB',x:22,y:44},{n:'2',r:'RB',x:30,y:10},{n:'5',r:'LB',x:30,y:58},{n:'6',r:'CM',x:48,y:24},{n:'8',r:'CM',x:48,y:44},{n:'7',r:'RM',x:56,y:10},{n:'11',r:'LM',x:56,y:58},{n:'9',r:'ST',x:78,y:26},{n:'10',r:'ST',x:78,y:42}],
      '3-5-2': [{n:'1',r:'GK',x:8,y:34},{n:'2',r:'CB',x:22,y:18},{n:'4',r:'CB',x:21,y:34},{n:'3',r:'CB',x:22,y:50},{n:'6',r:'CDM',x:38,y:34},{n:'8',r:'CM',x:50,y:23},{n:'10',r:'CM',x:50,y:45},{n:'7',r:'RWB',x:56,y:8},{n:'11',r:'LWB',x:56,y:60},{n:'9',r:'ST',x:78,y:26},{n:'19',r:'ST',x:78,y:42}]
    };
  }
  return {
    '4-3-3': [{n:'1',r:'GK',x:34,y:96},{n:'4',r:'CB',x:23,y:82},{n:'3',r:'CB',x:45,y:82},{n:'2',r:'RB',x:10,y:74},{n:'5',r:'LB',x:58,y:74},{n:'6',r:'CDM',x:34,y:64},{n:'8',r:'CM',x:22,y:52},{n:'10',r:'CAM',x:46,y:52},{n:'7',r:'RW',x:12,y:32},{n:'11',r:'LW',x:56,y:32},{n:'9',r:'ST',x:34,y:24}],
    '4-4-2': [{n:'1',r:'GK',x:34,y:96},{n:'4',r:'CB',x:23,y:82},{n:'3',r:'CB',x:45,y:82},{n:'2',r:'RB',x:10,y:74},{n:'5',r:'LB',x:58,y:74},{n:'6',r:'CM',x:24,y:56},{n:'8',r:'CM',x:44,y:56},{n:'7',r:'RM',x:10,y:48},{n:'11',r:'LM',x:58,y:48},{n:'9',r:'ST',x:26,y:26},{n:'10',r:'ST',x:42,y:26}],
    '3-5-2': [{n:'1',r:'GK',x:34,y:96},{n:'2',r:'CB',x:18,y:82},{n:'4',r:'CB',x:34,y:83},{n:'3',r:'CB',x:50,y:82},{n:'6',r:'CDM',x:34,y:66},{n:'8',r:'CM',x:23,y:54},{n:'10',r:'CM',x:45,y:54},{n:'7',r:'RWB',x:8,y:48},{n:'11',r:'LWB',x:60,y:48},{n:'9',r:'ST',x:26,y:26},{n:'19',r:'ST',x:42,y:26}]
  };
};

function SoccerBall({ x, y, onPointerDown }) {
  return (
    <g transform={`translate(${x}, ${y})`} onPointerDown={onPointerDown} className="cursor-grab active:cursor-grabbing touch-none select-none">
      <circle r="2.9" fill="rgba(0,0,0,0.3)" transform="translate(0.3, 0.4)" />
      <circle r="2.6" fill="#f8fafc" stroke="#0f172a" strokeWidth="0.4" />
      <polygon points="0,-0.9 0.85,-0.28 0.53,0.73 -0.53,0.73 -0.85,-0.28" fill="#0f172a" />
      {[0, 72, 144, 216, 288].map((ang, i) => (
        <line key={i} x1="0" y1="0" x2={Math.cos((ang * Math.PI)/180) * 1.8} y2={Math.sin((ang * Math.PI)/180) * 1.8} stroke="#0f172a" strokeWidth="0.25" />
      ))}
    </g>
  );
}

function TrainingMaterial({ obj, onPointerDown, onDoubleClick }) {
  const rot = obj.rotation || 0;
  let body = null;
  if (obj.type === 'mini_goal') {
    body = (
      <>
        <rect x="-4.2" y="-2.2" width="8.4" height="4.4" fill="rgba(255,255,255,0.25)" stroke="#eab308" strokeWidth="0.7" rx="0.4" />
        <rect x="-4.2" y="1.8" width="8.4" height="0.6" fill="#ca8a04" />
      </>
    );
  } else if (obj.type === 'ladder') {
    body = (
      <>
        <line x1="-2.2" y1="-7.2" x2="-2.2" y2="7.2" stroke="#0f172a" strokeWidth="0.6" />
        <line x1="2.2" y1="-7.2" x2="2.2" y2="7.2" stroke="#0f172a" strokeWidth="0.6" />
        {[-5.4, -3.6, -1.8, 0, 1.8, 3.6, 5.4].map(s => <line key={s} x1="-2.2" y1={s} x2="2.2" y2={s} stroke="#facc15" strokeWidth="0.7" />)}
      </>
    );
  } else if (obj.type === 'dummy') {
    body = (
      <>
        <circle cx="0" cy="-3.6" r="1.3" fill="#eab308" stroke="#ca8a04" strokeWidth="0.3" />
        <path d="M -2.2 -2.1 Q 0 -2.6 2.2 -2.1 L 1.8 2.2 Q 0 2.5 -1.8 2.2 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="0.35" />
      </>
    );
  } else if (obj.type === 'hurdle') {
    body = (
      <>
        <ellipse cx="0" cy="2.2" rx="3.2" ry="0.7" fill="rgba(0,0,0,0.25)" />
        <line x1="-3" y1="2" x2="-3" y2="-1.8" stroke="#ca8a04" strokeWidth="0.5" />
        <line x1="3" y1="2" x2="3" y2="-1.8" stroke="#ca8a04" strokeWidth="0.5" />
        <rect x="-3.2" y="-2.2" width="6.4" height="0.8" fill="#facc15" stroke="#ca8a04" strokeWidth="0.2" rx="0.2" />
      </>
    );
  } else if (obj.type === 'cone') {
    body = (
      <>
        <ellipse cx="0" cy="1.2" rx="2.0" ry="0.7" fill={obj.color || '#ea580c'} />
        <polygon points="-1.6,1.2 1.6,1.2 0,-2.6" fill={obj.color || '#f97316'} stroke="#c2410c" strokeWidth="0.25" />
      </>
    );
  } else if (obj.type === 'saucer') {
    body = (
      <>
        <ellipse cx="0" cy="0.6" rx="2.2" ry="0.9" fill={obj.color || '#facc15'} stroke="#000" strokeWidth="0.2" />
        <ellipse cx="0" cy="0.3" rx="0.7" ry="0.35" fill="#1e293b" />
      </>
    );
  } else if (obj.type === 'ring') {
    body = <circle cx="0" cy="0" r="3.0" fill="none" stroke={obj.color || '#38bdf8'} strokeWidth="0.7" />;
  }

  return (
    <g transform={`translate(${obj.x}, ${obj.y}) rotate(${rot})`} onPointerDown={onPointerDown} onDoubleClick={onDoubleClick} className="cursor-grab active:cursor-grabbing touch-none select-none">
      {body}
    </g>
  );
}

function WhatsAppButton({ phone, label = '', name = '' }) {
  if (!phone) return <span className="text-[10px] text-zinc-600 italic">Sin WhatsApp</span>;
  const num = phone.replace(/[^0-9]/g, '');
  const finalNum = num.startsWith('56') ? num : `56${num}`;
  const msg = encodeURIComponent(`Hola ${name || ''}, te contacto desde Andez Sports FC.`);
  return (
    <a href={`https://wa.me/${finalNum}?text=${msg}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow transition active:scale-95">
      <MessageCircle className="w-3.5 h-3.5" />
      <span>{label || phone}</span>
    </a>
  );
}

export default function App() {
  const [isPC, setIsPC] = useState(window.innerWidth > 768);
  useEffect(() => {
    const handleResize = () => setIsPC(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [adminLicenses, setAdminLicenses] = useState(() => {
    const l = localStorage.getItem('andez_licenses');
    return l ? JSON.parse(l) : [
      { id: 'lic-1', coach: 'Prof. Carlos Morales', club: 'Escuela Los Andes', code: 'AND-7821', seats: 5, status: 'active', plan: 'Escuela / Club (5 Equipos)', price: 35000, expiry: '2026-11-15' },
      { id: 'lic-2', coach: 'DT Matías Soto', club: 'Academia Biobío', code: 'AND-4412', seats: 2, status: 'active', plan: 'DT Personal (2 Equipos)', price: 15000, expiry: '2026-11-10' }
    ];
  });
  useEffect(() => localStorage.setItem('andez_licenses', JSON.stringify(adminLicenses)), [adminLicenses]);

  const [authenticatedUser, setAuthenticatedUser] = useState(() => {
    const s = localStorage.getItem('andez_auth_session');
    return s ? JSON.parse(s) : null;
  });

  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newCoachName, setNewCoachName] = useState('');
  const [newCoachClub, setNewCoachClub] = useState('');
  const [newCoachPlan, setNewCoachPlan] = useState('DT Personal (2 Equipos: Móvil + PC) - $15.000');
  const [newCoachExpiry, setNewCoachExpiry] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0];
  });

  const [customLogo, setCustomLogo] = useState(() => localStorage.getItem('andez_custom_club_logo') || null);
  const handleLogoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCustomLogo(ev.target.result);
        localStorage.setItem('andez_custom_club_logo', ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const [categories, setCategories] = useState(() => {
    const c = localStorage.getItem('andez_dynamic_categories');
    return c ? JSON.parse(c) : DEFAULT_CATEGORIES;
  });
  useEffect(() => localStorage.setItem('andez_dynamic_categories', JSON.stringify(categories)), [categories]);

  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');

  const [coachesList, setCoachesList] = useState(() => {
    const c = localStorage.getItem('andez_coaches_staff');
    return c ? JSON.parse(c) : [
      { id: 'c1', name: 'Prof. Carlos Morales', role: 'DT Principal', categoryId: 'sub10', phone: '+56932100183' }
    ];
  });
  useEffect(() => localStorage.setItem('andez_coaches_staff', JSON.stringify(coachesList)), [coachesList]);

  const [newCoachStaffName, setNewCoachStaffName] = useState('');
  const [newCoachStaffRole, setNewCoachStaffRole] = useState('Director Técnico');
  const [newCoachStaffCategory, setNewCoachStaffCategory] = useState(categories[0]?.id || 'sub10');
  const [newCoachStaffPhone, setNewCoachStaffPhone] = useState('+569');

  const [rosters, setRosters] = useState(() => {
    const r = localStorage.getItem('andez_category_rosters');
    return r ? JSON.parse(r) : {
      sub10: [{ id: 'p1', name: 'Lucas Valenzuela', rut: '24.123.456-7', birth: '2016-04-12', role: 'Delantero', phone: '+56932100183' }],
      sub14: [{ id: 'p3', name: 'Martín Sepúlveda', rut: '22.345.678-9', birth: '2012-02-14', role: 'Portero', phone: '+56932100183' }],
      sub18: [], senior: []
    };
  });
  useEffect(() => localStorage.setItem('andez_category_rosters', JSON.stringify(rosters)), [rosters]);

  const [newRosterName, setNewRosterName] = useState('');
  const [newRosterRut, setNewRosterRut] = useState('');
  const [newRosterBirth, setNewRosterBirth] = useState('');
  const [newRosterRole, setNewRosterRole] = useState('Delantero');
  const [newRosterPhone, setNewRosterPhone] = useState('+569');

  const [inputLicenseCode, setInputLicenseCode] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleClientLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const code = inputLicenseCode.trim().toUpperCase();
    if (code === 'ANDEZ2026') {
      const u = { role: 'owner', name: 'Administrador Maestro', club: 'Andez Sports FC Principal' };
      setAuthenticatedUser(u);
      localStorage.setItem('andez_auth_session', JSON.stringify(u));
      return;
    }
    const found = adminLicenses.find(l => l.code.toUpperCase() === code);
    if (!found) { setLoginError('Código de activación no válido.'); return; }
    if (found.status === 'suspended') { setLoginError('Suscripción suspendida.'); return; }
    const cl = { role: 'client', ...found };
    setAuthenticatedUser(cl);
    localStorage.setItem('andez_auth_session', JSON.stringify(cl));
  };

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión en este equipo?')) {
      setAuthenticatedUser(null);
      localStorage.removeItem('andez_auth_session');
    }
  };

  const [pitchMode, setPitchMode] = useState('full');
  const [showTrainingMenu, setShowTrainingMenu] = useState(false);
  const [showSystemsMenu, setShowSystemsMenu] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [activeTabLibrary, setActiveTabLibrary] = useState('sessions');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  const [drillTitle, setDrillTitle] = useState('Salida de Balón y Transición');
  const [drillCategory, setDrillCategory] = useState(categories[0]?.id || 'sub14');
  const [drillNotes, setDrillNotes] = useState('Bloques de 6 minutos. Énfasis en el tercer hombre.');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const [savedDrills, setSavedDrills] = useState(() => {
    const d = localStorage.getItem('andez_saved_drills');
    return d ? JSON.parse(d) : [];
  });
  useEffect(() => localStorage.setItem('andez_saved_drills', JSON.stringify(savedDrills)), [savedDrills]);

  const [editingPlayer, setEditingPlayer] = useState(null);
  const [playerCustomName, setPlayerCustomName] = useState('');
  const [playerCustomNumber, setPlayerCustomNumber] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const [tool, setTool] = useState('move');
  const [lineType, setLineType] = useState('arrow');
  const [lineColor, setLineColor] = useState('#ffffff');

  const [objects, setObjects] = useState(() => {
    const sys = GET_TACTICAL_SYSTEMS(window.innerWidth > 768)['4-3-3'];
    const pts = sys.map(p => ({ id: 'init-' + p.n, type: 'player', number: p.n, role: p.r, x: p.x, y: p.y, team: 'blue', name: '' }));
    return [...pts, { id: 'ball-1', type: 'ball', x: window.innerWidth > 768 ? 52.5 : 34, y: window.innerWidth > 768 ? 34 : 52.5 }];
  });

  const [drawings, setDrawings] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  const [history, setHistory] = useState([objects]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const svgRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [selectedObj, setSelectedObj] = useState(null);

  // GRABACIÓN DE VIDEO NATIVO
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const startRecording = async () => {
    setRecordedVideoUrl(null);
    recordedChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 } });
      const mr = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setRecordedVideoUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
      };
      mr.start();
      setIsRecording(true);
    } catch (err) {
      alert('Selecciona la ventana de la pizarra para grabar.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
  };

  // GENERADOR TÁCTICO POR PROMPT
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptText, setPromptText] = useState('');

  const handleGenerateTacticalPrompt = (e) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    const txt = promptText.toLowerCase();
    let newObjs = [];
    const midX = isPC ? (pitchMode === 'half' ? 27.5 : 52.5) : 34;
    const midY = isPC ? 34 : (pitchMode === 'half' ? 42.5 : 52.5);

    if (txt.includes('rondo') || txt.includes('posesion')) {
      newObjs = [
        { id: 'p-r1', type: 'player', number: '1', name: 'Apoyo', x: midX - 10, y: midY, team: 'blue' },
        { id: 'p-r2', type: 'player', number: '2', name: 'Apoyo', x: midX + 10, y: midY, team: 'blue' },
        { id: 'p-r3', type: 'player', number: '3', name: 'Apoyo', x: midX, y: midY - 10, team: 'blue' },
        { id: 'p-r4', type: 'player', number: '4', name: 'Apoyo', x: midX, y: midY + 10, team: 'blue' },
        { id: 'p-r5', type: 'player', number: '5', name: 'Presión', x: midX - 3, y: midY, team: 'red' },
        { id: 'p-r6', type: 'player', number: '6', name: 'Presión', x: midX + 3, y: midY, team: 'red' },
        { id: 'b-r1', type: 'ball', x: midX - 7, y: midY },
        { id: 'c-1', type: 'cone', color: '#ea580c', x: midX - 14, y: midY - 14, rotation: 0 },
        { id: 'c-2', type: 'cone', color: '#ea580c', x: midX + 14, y: midY - 14, rotation: 0 },
        { id: 'c-3', type: 'cone', color: '#ea580c', x: midX - 14, y: midY + 14, rotation: 0 },
        { id: 'c-4', type: 'cone', color: '#ea580c', x: midX + 14, y: midY + 14, rotation: 0 },
      ];
    } else {
      newObjs = [
        { id: 'gen-1', type: 'player', number: '1', name: 'Portero', x: isPC ? 12 : 34, y: isPC ? 34 : 90, team: 'blue' },
        { id: 'gen-2', type: 'player', number: '4', name: 'Central', x: midX - 8, y: midY, team: 'blue' },
        { id: 'gen-3', type: 'player', number: '9', name: 'Delantero', x: midX + 8, y: midY, team: 'red' },
        { id: 'b-gen', type: 'ball', x: midX - 5, y: midY },
        { id: 'mg-1', type: 'mini_goal', x: isPC ? 90 : 34, y: isPC ? 34 : 20, rotation: 0 }
      ];
    }
    setObjects(newObjs);
    recordHistory(newObjs);
    setShowPromptModal(false);
    setPromptText('');
  };

  const maxX = isPC ? (pitchMode === 'half' ? 55 : 105) : 68;
  const maxY = isPC ? 68 : (pitchMode === 'half' ? 85 : 105);

  const getCoordinates = (e) => {
    if (!svgRef.current) return { x: maxX / 2, y: maxY / 2 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.touches ? e.touches[0].clientX : e.clientX;
    pt.y = e.touches ? e.touches[0].clientY : e.clientY;
    const c = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
    return { x: Math.max(2, Math.min(maxX - 2, c.x)), y: Math.max(2, Math.min(maxY - 2, c.y)) };
  };

  const recordHistory = (objs) => {
    const nextH = history.slice(0, historyIndex + 1);
    nextH.push(JSON.parse(JSON.stringify(objs)));
    setHistory(nextH);
    setHistoryIndex(nextH.length - 1);
  };

  const handlePointerDown = (e, obj) => {
    e.stopPropagation();
    if (tool === 'eraser') {
      const f = objects.filter(o => o.id !== obj.id);
      setObjects(f); recordHistory(f); return;
    }
    if (tool !== 'move') return;
    setSelectedMaterial(obj.type !== 'player' && obj.type !== 'ball' ? obj : null);
    setSelectedObj(obj);
    isDraggingRef.current = true;
  };

  const handlePitchPointerDown = (e) => {
    if (tool === 'move' || tool === 'eraser') {
      setSelectedObj(null); setSelectedMaterial(null); return;
    }
    const c = getCoordinates(e);
    setCurrentLine({ id: Date.now(), start: c, end: c, type: lineType, color: lineColor, width: 1.4 });
  };

  const handlePointerMove = (e) => {
    if (isDraggingRef.current && selectedObj) {
      if (e.cancelable) e.preventDefault();
      const c = getCoordinates(e);
      setObjects(prev => prev.map(o => o.id === selectedObj.id ? { ...o, x: c.x, y: c.y } : o));
    } else if (currentLine) {
      if (e.cancelable) e.preventDefault();
      const c = getCoordinates(e);
      setCurrentLine(prev => ({ ...prev, end: c }));
    }
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current) { isDraggingRef.current = false; recordHistory(objects); }
    if (currentLine) { setDrawings(prev => [...prev, currentLine]); setCurrentLine(null); }
  };

  const rotateObject = (id) => {
    const u = objects.map(o => o.id === id ? { ...o, rotation: ((o.rotation || 0) + 45) % 360 } : o);
    setObjects(u); recordHistory(u);
  };

  const addElement = (itemType, extra = {}) => {
    const id = 'item-' + Date.now();
    const spawnX = isPC ? (pitchMode === 'half' ? 27.5 : 52.5) : 34;
    const spawnY = isPC ? 34 : (pitchMode === 'half' ? 42.5 : 52.5);
    const count = objects.filter(o => o.type === 'player' && o.team === (extra.team || 'blue')).length + 1;
    const item = { id, type: itemType, x: spawnX, y: spawnY, rotation: 0, name: '', number: String(extra.number || count), ...extra };
    const nextObjs = [...objects, item];
    setObjects(nextObjs);
    recordHistory(nextObjs);
  };

  const applyTacticalSystem = (sysKey) => {
    const sys = GET_TACTICAL_SYSTEMS(isPC)[sysKey];
    if (!sys) return;
    const players = sys.map((p, idx) => ({ id: 'sys-p-' + idx, type: 'player', number: p.n, role: p.r, x: p.x, y: p.y, team: 'blue', name: '' }));
    const nonPlayers = objects.filter(o => o.type !== 'player');
    const u = [...players, ...nonPlayers];
    setObjects(u); recordHistory(u); setShowSystemsMenu(false);
  };

  const currentDisplayLogo = customLogo || '/logo-andez.png';
  const totalRevenue = adminLicenses.filter(l => l.status === 'active').reduce((sum, l) => sum + (l.price || 0), 0);

  if (!authenticatedUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-[#070b12] text-white p-4 font-sans select-none relative">
        <div className="w-full max-w-md bg-zinc-950/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
          <img src={currentDisplayLogo} alt="Logo" className="w-16 h-16 rounded-2xl mb-4 border border-amber-400 object-cover" />
          <h1 className="text-2xl font-black text-white mb-1">ANDEZ SPORTS FC <span className="text-amber-400">PRO</span></h1>
          <form onSubmit={handleClientLogin} className="w-full space-y-3 my-4">
            <input type="text" value={inputLicenseCode} onChange={e => setInputLicenseCode(e.target.value)} placeholder="Clave (ej. ANDEZ2026)" className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 text-sm text-center font-mono font-bold text-white uppercase focus:border-red-500 outline-none" required />
            {loginError && <p className="text-xs text-red-400">{loginError}</p>}
            <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase rounded-2xl shadow">Ingresar</button>
          </form>
          <a href="https://wa.me/56932100183?text=Hola%20Andez%20Sports%20FC,%20solicito%20acceso" target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-emerald-700/40 border border-emerald-500 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" /> Solicitar Acceso por WhatsApp (+56932100183)
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-black overflow-hidden select-none font-sans print:bg-white print:text-black">
      <header className="bg-black px-3 py-1.5 flex items-center justify-between shrink-0 z-30 border-b border-zinc-900 no-print">
        <div className="flex items-center gap-2 sm:gap-3">
          {isPC ? (
            <label htmlFor="logo-up" className="cursor-pointer" title="Cambiar Logo Club (PC)">
              <img src={currentDisplayLogo} alt="Logo" className="w-8 h-8 rounded-full border-2 border-amber-400 object-cover" />
              <input id="logo-up" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          ) : (
            <img src={currentDisplayLogo} alt="Logo" className="w-8 h-8 rounded-full border-2 border-amber-400 object-cover" />
          )}

          <button onClick={() => setShowLibraryModal(true)} className="text-zinc-300 hover:text-amber-400" title="Biblioteca y Nóminas"><Folder className="w-5 h-5" /></button>
          <button onClick={() => setShowSystemsMenu(true)} className="text-zinc-300 hover:text-amber-400" title="Sistemas Tácticos"><Play className="w-5 h-5" /></button>
          <button onClick={() => setPitchMode(pitchMode === 'full' ? 'half' : 'full')} className={`p-1 rounded ${pitchMode === 'half' ? 'bg-red-600 text-white' : 'text-zinc-300'}`}><RotateCcw className="w-5 h-5" /></button>
          <button onClick={() => setShowTrainingMenu(!showTrainingMenu)} className={`p-1 rounded ${showTrainingMenu ? 'bg-amber-500 text-black' : 'text-amber-400'}`}><span className="font-bold">▲</span></button>
          
          <button onClick={() => setShowPromptModal(true)} className="flex items-center gap-1 bg-amber-500/20 border border-amber-400 text-amber-300 px-2 py-1 rounded-full text-[11px] font-bold shadow active:scale-95">
            <Sparkles className="w-3.5 h-3.5" /> Prompt IA
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {selectedMaterial && (
            <button onClick={() => rotateObject(selectedMaterial.id)} className="flex items-center gap-1 bg-amber-500 text-black px-2 py-1 rounded-full text-[10px] font-black"><RotateCw className="w-3.5 h-3.5" /> 45°</button>
          )}

          {isRecording ? (
            <button onClick={stopRecording} className="flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black animate-pulse shadow">
              <Square className="w-3.5 h-3.5" /> Detener
            </button>
          ) : (
            <button onClick={startRecording} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow">
              <Video className="w-3.5 h-3.5 text-red-500" /> Grabar
            </button>
          )}

          <button onClick={() => window.print()} className="text-zinc-300 hover:text-amber-400"><Printer className="w-5 h-5" /></button>
          <button onClick={() => setShowSaveModal(true)} className="text-zinc-300 hover:text-red-400"><Save className="w-5 h-5" /></button>

          {/* BOTÓN PANEL DE DUEÑO */}
          {authenticatedUser.role === 'owner' ? (
            <button onClick={() => setShowAdminDashboard(true)} className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded-full text-[10px] font-black text-amber-400 uppercase tracking-wider">
              <span>Dueño</span> <Lock className="w-3 h-3 text-zinc-400" />
            </button>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full text-[10px] font-bold text-zinc-300 max-w-[100px] truncate">
              {authenticatedUser.club || authenticatedUser.coach || 'DT Pro'}
            </div>
          )}

          <button onClick={handleLogout} className="text-zinc-400 hover:text-red-400"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      {/* LIENZO DE CANCHA */}
      <main className="flex-1 w-full h-full flex items-center justify-center p-0 overflow-hidden touch-none relative bg-[#1e881b]" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        <svg ref={svgRef} viewBox={isPC ? (pitchMode === 'half' ? "0 0 55 68" : "0 0 105 68") : (pitchMode === 'half' ? "0 0 68 85" : "0 0 68 105")} className="w-full h-full select-none drop-shadow-2xl" onPointerDown={handlePitchPointerDown}>
          <rect width="300" height="300" x="-100" y="-100" fill="#228b22" />
          {isPC ? (
            <g stroke="white" strokeWidth="0.8" fill="none">
              <rect x="2" y="2" width={pitchMode === 'half' ? 51 : 101} height="64" />
              <line x1={pitchMode === 'half' ? 53 : 52.5} y1="2" x2={pitchMode === 'half' ? 53 : 52.5} y2="66" />
              <circle cx={pitchMode === 'half' ? 53 : 52.5} cy="34" r="9.15" />
              <rect x="2" y="13.8" width="16.5" height="40.4" />
              {!pitchMode.includes('half') && <rect x="86.5" y="13.8" width="16.5" height="40.4" />}
            </g>
          ) : (
            <g stroke="white" strokeWidth="0.8" fill="none">
              <rect x="2" y="2" width="64" height={pitchMode === 'half' ? 79 : 101} />
              <line x1="2" y1={pitchMode === 'half' ? 81 : 52.5} x2="66" y2={pitchMode === 'half' ? 81 : 52.5} />
              <circle cx="34" cy={pitchMode === 'half' ? 81 : 52.5} r="9.15" />
              <rect x="13.8" y="2" width="40.4" height="16.5" />
              {!pitchMode.includes('half') && <rect x="13.8" y="86.5" width="40.4" height="16.5" />}
            </g>
          )}

          {drawings.map(l => (
            <g key={l.id} onPointerDown={(e) => { if (tool === 'eraser') { e.stopPropagation(); setDrawings(prev => prev.filter(d => d.id !== l.id)); } }}>
              <line x1={l.start.x} y1={l.start.y} x2={l.end.x} y2={l.end.y} stroke={l.color} strokeWidth="1.4" strokeDasharray={l.type === 'dashed-arrow' ? '3,2' : 'none'} />
            </g>
          ))}
          {currentLine && <line x1={currentLine.start.x} y1={currentLine.start.y} x2={currentLine.end.x} y2={currentLine.end.y} stroke={currentLine.color} strokeWidth="1.4" />}

          {objects.map(obj => {
            if (obj.type === 'player') {
              const hasName = obj.name && obj.name.trim().length > 0;
              const w = Math.max(14, (obj.name || '').length * 1.5 + 4);
              return (
                <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={e => handlePointerDown(e, obj)} onDoubleClick={() => { setEditingPlayer(obj); setPlayerCustomName(obj.name || ''); setPlayerCustomNumber(obj.number); }} className="cursor-grab active:cursor-grabbing touch-none select-none">
                  <circle r="3.0" fill={obj.role === 'GK' ? '#f59e0b' : obj.team === 'blue' ? '#2563eb' : '#dc2626'} stroke="#ffffff" strokeWidth="0.6" />
                  <text textAnchor="middle" dy="1.0" fontSize="2.5" fontWeight="bold" fill="#ffffff" pointerEvents="none">{obj.number}</text>
                  {hasName && (
                    <g>
                      <rect x={-w / 2} y="3.8" width={w} height="3.6" rx="1" fill="rgba(10, 10, 10, 0.88)" stroke="#27272a" strokeWidth="0.25" />
                      <text x="0" y="6.3" textAnchor="middle" fontSize="1.9" fontWeight="bold" fill="#ffffff">{obj.name}</text>
                    </g>
                  )}
                </g>
              );
            }
            if (obj.type === 'ball') return <SoccerBall key={obj.id} x={obj.x} y={obj.y} onPointerDown={e => handlePointerDown(e, obj)} />;
            return <TrainingMaterial key={obj.id} obj={obj} onPointerDown={e => handlePointerDown(e, obj)} onDoubleClick={() => rotateObject(obj.id)} />;
          })}
        </svg>

        {/* MODAL FICHA JUGADOR */}
        {editingPlayer && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-[#121214] border border-zinc-800 rounded-3xl w-full max-w-xs p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-white">✏️ Editar Ficha Jugador</h3>
                <button onClick={() => setEditingPlayer(null)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const u = objects.map(o => o.id === editingPlayer.id ? { ...o, number: playerCustomNumber || o.number, name: playerCustomName.trim() } : o);
                setObjects(u); recordHistory(u); setEditingPlayer(null);
              }} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1">NOMBRE O APODO</label>
                  <input type="text" value={playerCustomName} onChange={e => setPlayerCustomName(e.target.value)} placeholder="Ej. Delantero" className="w-full bg-[#1c1c1f] border border-zinc-800 rounded-2xl px-4 py-2 text-xs text-white outline-none focus:border-red-500" autoFocus />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1">DORSAL / NÚMERO</label>
                  <input type="text" value={playerCustomNumber} onChange={e => setPlayerCustomNumber(e.target.value)} placeholder="9" className="w-full bg-[#1c1c1f] border border-zinc-800 rounded-2xl px-4 py-2 text-xs text-white outline-none focus:border-red-500" required />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => {
                    const u = objects.map(o => o.id === editingPlayer.id ? { ...o, name: '' } : o);
                    setObjects(u); recordHistory(u); setEditingPlayer(null);
                  }} className="flex-1 py-3 bg-[#242428] text-red-400 font-bold text-xs rounded-2xl">Eliminar</button>
                  <button type="submit" className="flex-1 py-3 bg-red-600 text-white font-bold text-xs rounded-2xl shadow">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL PROMPT TÁCTICO */}
        {showPromptModal && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-400" /> Generador por Texto</h3>
                <button onClick={() => setShowPromptModal(false)} className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleGenerateTacticalPrompt} className="space-y-3">
                <textarea rows={3} value={promptText} onChange={e => setPromptText(e.target.value)} placeholder="Escribe el ejercicio (Ej: 'Rondo 4v2 con 4 conos y balón')..." className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400 resize-none" autoFocus />
                <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-xl shadow">Crear en la Pizarra</button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL REPRODUCTOR / DESCARGA DE VIDEO */}
        {recordedVideoUrl && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md p-5 shadow-2xl flex flex-col items-center">
              <div className="w-full flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5"><Video className="w-4 h-4 text-red-500" /> Video del Ejercicio</h3>
                <button onClick={() => setRecordedVideoUrl(null)} className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <video src={recordedVideoUrl} controls autoPlay className="w-full rounded-2xl mb-4 border border-zinc-800 max-h-60" />
              <div className="w-full flex gap-2">
                <a href={recordedVideoUrl} download={`ejercicio-${drillTitle.replace(/\s+/g, '_')}.webm`} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 shadow">
                  <Download className="w-4 h-4" /> Descargar
                </a>
                <button onClick={() => {
                  if (navigator.share) {
                    fetch(recordedVideoUrl).then(r => r.blob()).then(blob => {
                      const file = new File([blob], 'ejercicio.webm', { type: 'video/webm' });
                      navigator.share({ title: drillTitle, files: [file] });
                    });
                  } else {
                    alert('Descarga el video para enviarlo directamente a tu WhatsApp.');
                  }
                }} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 shadow">
                  <MessageCircle className="w-4 h-4" /> Enviar WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MENÚ DE MATERIALES COMPLETO */}
        {showTrainingMenu && (
          <aside className="absolute right-2 top-2 bg-black/90 border border-zinc-800 p-3 rounded-2xl flex flex-col gap-2 shadow-2xl z-40 w-44 no-print">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-1 mb-1">
              <span className="text-[11px] font-bold text-amber-400">Materiales</span>
              <button onClick={() => setShowTrainingMenu(false)} className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <button onClick={() => addElement('mini_goal')} className="p-1.5 text-left hover:bg-zinc-800 rounded text-xs text-white">🥅 Mini Portería</button>
            <button onClick={() => addElement('ladder')} className="p-1.5 text-left hover:bg-zinc-800 rounded text-xs text-white">🪜 Escalera</button>
            <button onClick={() => addElement('dummy')} className="p-1.5 text-left hover:bg-zinc-800 rounded text-xs text-white">🧍 Maniquí</button>
            <button onClick={() => addElement('hurdle')} className="p-1.5 text-left hover:bg-zinc-800 rounded text-xs text-white">🚧 Valla de Salto</button>
            <button onClick={() => addElement('cone', { color: '#ea580c' })} className="p-1.5 text-left hover:bg-zinc-800 rounded text-xs text-white"><span className="text-orange-500">▲</span> Cono Naranja</button>
            <button onClick={() => addElement('cone', { color: '#2563eb' })} className="p-1.5 text-left hover:bg-zinc-800 rounded text-xs text-white"><span className="text-blue-500">▲</span> Cono Azul</button>
            <button onClick={() => addElement('cone', { color: '#eab308' })} className="p-1.5 text-left hover:bg-zinc-800 rounded text-xs text-white"><span className="text-yellow-400">▲</span> Cono Amarillo</button>
            <button onClick={() => addElement('saucer', { color: '#facc15' })} className="p-1.5 text-left hover:bg-zinc-800 rounded-xs text-xs text-white">🟡 Plato Chino</button>
            <button onClick={() => addElement('ring', { color: '#38bdf8' })} className="p-1.5 text-left hover:bg-zinc-800 rounded text-xs text-white">⭕ Aro de Salto</button>
          </aside>
        )}

        {/* MENÚ SISTEMAS */}
        {showSystemsMenu && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xs p-4 shadow-2xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm text-white">Sistemas Tácticos</h3>
                <button onClick={() => setShowSystemsMenu(false)} className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              {['4-3-3', '4-4-2', '3-5-2'].map(sys => (
                <button key={sys} onClick={() => applyTacticalSystem(sys)} className="w-full text-left p-2.5 hover:bg-red-600 rounded-xl text-xs font-bold text-white mb-1 transition">
                  Formación {sys}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MODAL BIBLIOTECA, ALUMNOS, PROFESORES Y CATEGORÍAS */}
        {showLibraryModal && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-4 z-50 no-print">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl p-5 shadow-2xl flex flex-col max-h-[92vh]">
              <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={() => setActiveTabLibrary('sessions')} className={`px-3 py-1 rounded-lg text-xs font-bold ${activeTabLibrary === 'sessions' ? 'bg-red-600 text-white' : 'text-zinc-400'}`}>📁 Sesiones</button>
                  <button onClick={() => setActiveTabLibrary('roster')} className={`px-3 py-1 rounded-lg text-xs font-bold ${activeTabLibrary === 'roster' ? 'bg-red-600 text-white' : 'text-zinc-400'}`}>📋 Alumnos</button>
                  <button onClick={() => setActiveTabLibrary('coaches')} className={`px-3 py-1 rounded-lg text-xs font-bold ${activeTabLibrary === 'coaches' ? 'bg-red-600 text-white' : 'text-zinc-400'}`}>🧑‍🏫 Profesores</button>
                  <button onClick={() => setActiveTabLibrary('categories')} className={`px-3 py-1 rounded-lg text-xs font-bold ${activeTabLibrary === 'categories' ? 'bg-amber-500 text-black' : 'text-zinc-400'}`}>⚙️ Categorías</button>
                  {isPC && <button onClick={() => setActiveTabLibrary('club_settings')} className={`px-3 py-1 rounded-lg text-xs font-bold ${activeTabLibrary === 'club_settings' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}>🛡️ Logo Club</button>}
                </div>
                <button onClick={() => setShowLibraryModal(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              {/* PESTAÑA: SESIONES */}
              {activeTabLibrary === 'sessions' && (
                <div className="flex-1 overflow-y-auto space-y-2">
                  {savedDrills.length === 0 ? <p className="text-xs text-zinc-500 text-center py-8">No hay sesiones guardadas aún.</p> : savedDrills.map(d => (
                    <div key={d.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="font-bold text-xs text-white">{d.title}</div>
                        <div className="text-[10px] text-zinc-400">{d.date} • {categories.find(c => c.id === d.category)?.name || d.category}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setObjects(d.objects); setDrawings(d.drawings || []); setDrillTitle(d.title); setShowLibraryModal(false); }} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg shadow">Cargar</button>
                        <button onClick={() => setSavedDrills(savedDrills.filter(x => x.id !== d.id))} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PESTAÑA: ALUMNOS (FORMULARIO Y LISTA) */}
              {activeTabLibrary === 'roster' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newRosterName.trim()) return;
                    const target = selectedCategoryFilter === 'all' ? (categories[0]?.id || 'sub10') : selectedCategoryFilter;
                    const newP = { id: 'ros-' + Date.now(), name: newRosterName.trim(), rut: newRosterRut || 'Sin RUT', birth: newRosterBirth || '2012-01-01', role: newRosterRole, phone: newRosterPhone.trim() || '+56932100183' };
                    setRosters({ ...rosters, [target]: [...(rosters[target] || []), newP] });
                    setNewRosterName(''); setNewRosterRut(''); setNewRosterPhone('+569');
                  }} className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl mb-3 shrink-0 grid grid-cols-1 sm:grid-cols-5 gap-2">
                    <input type="text" placeholder="Nombre Alumno" value={newRosterName} onChange={e => setNewRosterName(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-amber-400" required />
                    <input type="text" placeholder="RUT / ID" value={newRosterRut} onChange={e => setNewRosterRut(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-amber-400" />
                    <input type="date" value={newRosterBirth} onChange={e => setNewRosterBirth(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-amber-400" />
                    <input type="tel" placeholder="WhatsApp" value={newRosterPhone} onChange={e => setNewRosterPhone(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-amber-400" required />
                    <button type="submit" className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg py-1 shadow flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5" /> Agregar</button>
                  </form>
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {Object.entries(rosters).flatMap(([catKey, list]) => (list || []).map(p => ({ ...p, catKey }))).map(p => (
                      <div key={p.id} className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="font-bold text-xs text-white">{p.name} <span className="text-[10px] text-zinc-400 font-normal">({categories.find(c => c.id === p.catKey)?.name || p.catKey})</span></div>
                          <div className="text-[10px] text-zinc-400">RUT: {p.rut} • Nac: {p.birth}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <WhatsAppButton phone={p.phone} name={p.name} label="WhatsApp" />
                          <button onClick={() => setRosters({ ...rosters, [p.catKey]: rosters[p.catKey].filter(x => x.id !== p.id) })} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PESTAÑA: PROFESORES (FORMULARIO Y LISTA) */}
              {activeTabLibrary === 'coaches' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newCoachStaffName.trim()) return;
                    setCoachesList([...coachesList, { id: 'c-' + Date.now(), name: newCoachStaffName.trim(), role: newCoachStaffRole.trim(), categoryId: newCoachStaffCategory, phone: newCoachStaffPhone.trim() }]);
                    setNewCoachStaffName(''); setNewCoachStaffPhone('+569');
                  }} className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl mb-3 shrink-0 grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input type="text" placeholder="Nombre Profesor" value={newCoachStaffName} onChange={e => setNewCoachStaffName(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-amber-400" required />
                    <input type="text" placeholder="Cargo (DT, PF)" value={newCoachStaffRole} onChange={e => setNewCoachStaffRole(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-amber-400" />
                    <select value={newCoachStaffCategory} onChange={e => setNewCoachStaffCategory(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white outline-none">
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex gap-1">
                      <input type="tel" placeholder="WhatsApp" value={newCoachStaffPhone} onChange={e => setNewCoachStaffPhone(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white outline-none" required />
                      <button type="submit" className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg px-3 shadow"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  </form>
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {coachesList.map(c => (
                      <div key={c.id} className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="font-bold text-xs text-white">{c.name} <span className="text-amber-400 font-semibold text-[10px]">({c.role})</span></div>
                          <div className="text-[10px] text-zinc-400">Categoría: {categories.find(x => x.id === c.categoryId)?.name || 'Sin asignar'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <WhatsAppButton phone={c.phone} name={c.name} label="WhatsApp DT" />
                          <button onClick={() => setCoachesList(coachesList.filter(x => x.id !== c.id))} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PESTAÑA: CATEGORÍAS (CREAR, EDITAR, ELIMINAR) */}
              {activeTabLibrary === 'categories' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newCatName.trim()) return;
                    setCategories([...categories, { id: 'cat-' + Date.now(), name: newCatName.trim() }]);
                    setNewCatName('');
                  }} className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl mb-3 shrink-0 flex gap-2">
                    <input type="text" placeholder="Nueva Categoría (Ej: Sub-6, Femenino)" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400" required />
                    <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-3 py-1.5 rounded-lg shadow flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Crear</button>
                  </form>
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {categories.map(cat => (
                      <div key={cat.id} className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl flex justify-between items-center">
                        {editingCatId === cat.id ? (
                          <div className="flex gap-2 flex-1 mr-2">
                            <input type="text" value={editingCatName} onChange={e => setEditingCatName(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white" autoFocus />
                            <button onClick={() => { setCategories(categories.map(c => c.id === cat.id ? { ...c, name: editingCatName.trim() } : c)); setEditingCatId(null); }} className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold">Guardar</button>
                            <button onClick={() => setEditingCatId(null)} className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-xs">Cancelar</button>
                          </div>
                        ) : (
                          <span className="font-bold text-xs text-white">{cat.name}</span>
                        )}
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }} className="p-1 text-zinc-400 hover:text-amber-400"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { if (confirm('¿Eliminar categoría?')) setCategories(categories.filter(c => c.id !== cat.id)); }} className="p-1 text-zinc-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PESTAÑA: LOGO */}
              {activeTabLibrary === 'club_settings' && isPC && (
                <div className="flex-1 flex flex-col items-center justify-center p-4 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
                  <img src={currentDisplayLogo} alt="Logo" className="w-20 h-20 rounded-2xl mb-3 border-2 border-amber-400 object-cover" />
                  <label htmlFor="logo-up-modal" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl cursor-pointer shadow">
                    Subir Escudo del Club
                    <input id="logo-up-modal" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL PANEL DE DUEÑO Y LICENCIAS */}
        {showAdminDashboard && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg p-5 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
                <div>
                  <span className="bg-red-600 text-[9px] font-black px-1.5 py-0.5 rounded text-white">DUEÑO</span>
                  <h3 className="font-black text-base text-white mt-1">Control de Licencias SaaS</h3>
                </div>
                <button onClick={() => setShowAdminDashboard(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block font-bold">Ingresos Recurrentes</span>
                  <span className="text-lg font-black text-emerald-400">\${totalRevenue.toLocaleString('es-CL')} CLP</span>
                </div>
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-bold">Clubes Activos</span>
                    <span className="text-lg font-black text-white">{adminLicenses.filter(l => l.status === 'active').length}</span>
                  </div>
                  <button onClick={() => setShowNewUserModal(true)} className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow">
                    <Plus className="w-4 h-4" /> Nuevo
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {adminLicenses.map(lic => (
                  <div key={lic.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">{lic.coach}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 font-mono font-bold border border-zinc-700">{lic.code}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">{lic.club} • {lic.plan}</div>
                      <div className="text-[9px] text-zinc-500">Vence: {lic.expiry} ({lic.seats} Equipos)</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setAdminLicenses(adminLicenses.map(l => l.id === lic.id ? { ...l, status: l.status === 'active' ? 'suspended' : 'active' } : l))} className={`px-2 py-1 rounded text-xs font-bold ${lic.status === 'active' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                        {lic.status === 'active' ? 'Suspender' : 'Reactivar'}
                      </button>
                      <button onClick={() => { if (confirm('¿Eliminar licencia?')) setAdminLicenses(adminLicenses.filter(l => l.id !== lic.id)); }} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL CREAR NUEVO ACCESO / LICENCIA */}
        {showNewUserModal && (
          <div className="absolute inset-0 bg-black/95 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-1"><Plus className="w-4 h-4 text-red-500" /> Crear Acceso DT</h3>
                <button onClick={() => setShowNewUserModal(false)} className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <button type="button" onClick={() => {
                const d = new Date(); d.setDate(d.getDate() + 7);
                setNewCoachExpiry(d.toISOString().split('T')[0]);
                setNewCoachPlan('Prueba Gratuita (7 Días - 2 Equipos)');
              }} className="w-full mb-3 py-1.5 px-3 bg-amber-500/10 border border-amber-500/40 rounded-xl text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5">
                <Gift className="w-4 h-4" /> Asignar 7 Días Gratis
              </button>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newCoachName.trim()) return;
                const code = 'AND-' + Math.floor(1000 + Math.random() * 9000);
                const isSchool = newCoachPlan.includes('Escuela');
                const isTrial = newCoachPlan.includes('Prueba');
                const seats = isSchool ? 5 : 2;
                const price = isTrial ? 0 : (isSchool ? 35000 : 15000);
                setAdminLicenses([{ id: 'lic-' + Date.now(), coach: newCoachName.trim(), club: newCoachClub.trim() || 'Club Particular', code, seats, status: 'active', plan: newCoachPlan, price, expiry: newCoachExpiry }, ...adminLicenses]);
                setShowNewUserModal(false); setNewCoachName(''); setNewCoachClub('');
                alert(`¡Usuario creado!\nClave: ${code}`);
              }} className="space-y-3">
                <input type="text" placeholder="Nombre Profesor / DT" value={newCoachName} onChange={e => setNewCoachName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none" required />
                <input type="text" placeholder="Club o Escuela" value={newCoachClub} onChange={e => setNewCoachClub(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none" />
                <select value={newCoachPlan} onChange={e => setNewCoachPlan(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none">
                  <option value="DT Personal (2 Equipos: Móvil + PC) - \$15.000">DT Personal (2 Equipos) - \$15.000</option>
                  <option value="Escuela / Club (5 Equipos: 4 Móviles + 1 PC) - \$35.000">Escuela / Club (5 Equipos) - \$35.000</option>
                  <option value="Prueba Gratuita (7 Días - 2 Equipos)">Prueba Gratuita (7 Días) - \$0</option>
                </select>
                <input type="date" value={newCoachExpiry} onChange={e => setNewCoachExpiry(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none" required />
                <button type="submit" className="w-full py-2.5 bg-red-600 hover:bg-red-500 font-bold text-xs uppercase rounded-xl text-white shadow">Generar Clave</button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL GUARDAR SESIÓN */}
        {showSaveModal && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-3">
              <h3 className="font-bold text-sm text-white">Guardar Sesión</h3>
              <input type="text" value={drillTitle} onChange={e => setDrillTitle(e.target.value)} placeholder="Título" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none" />
              <select value={drillCategory} onChange={e => setDrillCategory(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <textarea value={drillNotes} onChange={e => setDrillNotes(e.target.value)} rows={3} placeholder="Consignas..." className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none" />
              <button onClick={() => {
                const n = { id: 'd-' + Date.now(), title: drillTitle, notes: drillNotes, category: drillCategory, date: new Date().toISOString().split('T')[0], objects, drawings };
                setSavedDrills([n, ...savedDrills]); setShowSaveModal(false); alert('¡Sesión guardada!');
              }} className="w-full py-2 bg-red-600 font-bold text-xs rounded-xl text-white shadow">Confirmar</button>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-black px-4 py-2 flex items-center justify-between shrink-0 z-30 border-t border-zinc-900 no-print">
        <div className="flex items-center gap-2">
          <button onClick={() => { if (historyIndex > 0) { setHistoryIndex(historyIndex - 1); setObjects(history[historyIndex - 1]); } }} disabled={historyIndex <= 0} className="p-1.5 text-zinc-300 disabled:opacity-30"><Undo2 className="w-5 h-5" /></button>
          <button onClick={() => { if (historyIndex < history.length - 1) { setHistoryIndex(historyIndex + 1); setObjects(history[historyIndex + 1]); } }} disabled={historyIndex >= history.length - 1} className="p-1.5 text-zinc-300 disabled:opacity-30"><Redo2 className="w-5 h-5" /></button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => addElement('player', { team: 'blue' })} className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white text-white font-bold text-xs shadow">11</button>
          <button onClick={() => addElement('player', { team: 'red' })} className="w-9 h-9 rounded-full bg-red-600 border-2 border-white text-white font-bold text-xs shadow">11</button>
          <button onClick={() => addElement('ball')} className="w-9 h-9 rounded-full bg-white text-sm shadow">⚽</button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setTool(tool === 'eraser' ? 'move' : 'eraser')} className={`p-1.5 rounded ${tool === 'eraser' ? 'bg-red-600 text-white animate-pulse' : 'text-zinc-400'}`} title="Borrador"><Eraser className="w-5 h-5" /></button>
          <button onClick={() => setDrawings([])} className="p-1.5 text-zinc-400 hover:text-amber-400"><Trash2 className="w-5 h-5" /></button>
          <button onClick={() => setTool(tool === 'draw' ? 'move' : 'draw')} className={`p-1.5 rounded ${tool === 'draw' ? 'bg-amber-500 text-black' : 'text-zinc-300'}`} title="Trazar Flecha"><PenTool className="w-5 h-5" /></button>
        </div>
      </footer>
    </div>
  );
}
