import React, { useState, useRef, useEffect } from 'react';
import {
  Folder, Play, RotateCcw, Shirt, Share2, Save,
  Undo2, Redo2, Trash2, PenTool, X, ChevronRight, Eraser,
  Lock, KeyRound, ShieldCheck, Check, Search, Plus, Calendar, AlertTriangle, Users
} from 'lucide-react';

const CATEGORIES = [
  { id: 'sub10', name: 'Sub-8 a Sub-10 (Iniciación)' },
  { id: 'sub14', name: 'Sub-12 a Sub-14 (Formación)' },
  { id: 'sub18', name: 'Sub-16 a Juvenil (Especialización)' },
  { id: 'senior', name: 'Adulto / Senior (Rendimiento)' },
];

const TACTICAL_SYSTEMS = {
  '4-3-3': [
    { number: '1', role: 'GK', x: 34, y: 96, team: 'blue' },
    { number: '4', role: 'CB', x: 23, y: 82, team: 'blue' },
    { number: '3', role: 'CB', x: 45, y: 82, team: 'blue' },
    { number: '2', role: 'RB', x: 10, y: 74, team: 'blue' },
    { number: '5', role: 'LB', x: 58, y: 74, team: 'blue' },
    { number: '6', role: 'CDM', x: 34, y: 64, team: 'blue' },
    { number: '8', role: 'CM', x: 22, y: 52, team: 'blue' },
    { number: '10', role: 'CAM', x: 46, y: 52, team: 'blue' },
    { number: '7', role: 'RW', x: 12, y: 32, team: 'blue' },
    { number: '11', role: 'LW', x: 56, y: 32, team: 'blue' },
    { number: '9', role: 'ST', x: 34, y: 24, team: 'blue' },
  ],
  '4-4-2': [
    { number: '1', role: 'GK', x: 34, y: 96, team: 'blue' },
    { number: '4', role: 'CB', x: 23, y: 82, team: 'blue' },
    { number: '3', role: 'CB', x: 45, y: 82, team: 'blue' },
    { number: '2', role: 'RB', x: 10, y: 74, team: 'blue' },
    { number: '5', role: 'LB', x: 58, y: 74, team: 'blue' },
    { number: '6', role: 'CM', x: 24, y: 56, team: 'blue' },
    { number: '8', role: 'CM', x: 44, y: 56, team: 'blue' },
    { number: '7', role: 'RM', x: 10, y: 48, team: 'blue' },
    { number: '11', role: 'LM', x: 58, y: 48, team: 'blue' },
    { number: '9', role: 'ST', x: 26, y: 26, team: 'blue' },
    { number: '10', role: 'ST', x: 42, y: 26, team: 'blue' },
  ],
  '3-5-2': [
    { number: '1', role: 'GK', x: 34, y: 96, team: 'blue' },
    { number: '2', role: 'CB', x: 18, y: 82, team: 'blue' },
    { number: '4', role: 'CB', x: 34, y: 83, team: 'blue' },
    { number: '3', role: 'CB', x: 50, y: 82, team: 'blue' },
    { number: '6', role: 'CDM', x: 34, y: 66, team: 'blue' },
    { number: '8', role: 'CM', x: 23, y: 54, team: 'blue' },
    { number: '10', role: 'CM', x: 45, y: 54, team: 'blue' },
    { number: '7', role: 'RWB', x: 8, y: 48, team: 'blue' },
    { number: '11', role: 'LWB', x: 60, y: 48, team: 'blue' },
    { number: '9', role: 'ST', x: 26, y: 26, team: 'blue' },
    { number: '19', role: 'ST', x: 42, y: 26, team: 'blue' },
  ]
};

function SoccerBall({ x, y, onPointerDown }) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onPointerDown={onPointerDown}
      className="cursor-grab active:cursor-grabbing touch-none select-none"
    >
      <circle r="2.9" fill="rgba(0,0,0,0.3)" transform="translate(0.3, 0.4)" />
      <circle r="2.6" fill="#f8fafc" stroke="#0f172a" strokeWidth="0.4" />
      <polygon points="0,-0.9 0.85,-0.28 0.53,0.73 -0.53,0.73 -0.85,-0.28" fill="#0f172a" />
      <polygon points="0,-1.7 0.6,-2.3 -0.6,-2.3" fill="#0f172a" />
      <polygon points="1.7,-0.6 2.4,-0.8 2.1,-0.1" fill="#0f172a" />
      <polygon points="1.2,1.6 1.8,1.9 1.5,2.4" fill="#0f172a" />
      <polygon points="-1.2,1.6 -1.5,2.4 -1.8,1.9" fill="#0f172a" />
      <polygon points="-1.7,-0.6 -2.1,-0.1 -2.4,-0.8" fill="#0f172a" />
      <line x1="0" y1="-0.9" x2="0" y2="-1.7" stroke="#0f172a" strokeWidth="0.25" />
      <line x1="0.85" y1="-0.28" x2="1.7" y2="-0.6" stroke="#0f172a" strokeWidth="0.25" />
      <line x1="0.53" y1="0.73" x2="1.2" y2="1.6" stroke="#0f172a" strokeWidth="0.25" />
      <line x1="-0.53" y1="0.73" x2="-1.2" y2="1.6" stroke="#0f172a" strokeWidth="0.25" />
      <line x1="-0.85" y1="-0.28" x2="-1.7" y2="-0.6" stroke="#0f172a" strokeWidth="0.25" />
    </g>
  );
}

function TrainingMaterial({ obj, onPointerDown }) {
  if (obj.type === 'mini_goal') {
    return (
      <g transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={onPointerDown} className="cursor-grab touch-none select-none">
        <rect x="-4.2" y="-2.2" width="8.4" height="4.4" fill="rgba(0,0,0,0.2)" rx="0.5" transform="translate(0.3, 0.4)" />
        <rect x="-4.2" y="-2.2" width="8.4" height="4.4" fill="rgba(255,255,255,0.25)" stroke="#eab308" strokeWidth="0.7" rx="0.4" />
        <line x1="-4.2" y1="-0.7" x2="4.2" y2="-0.7" stroke="#ffffff" strokeWidth="0.25" strokeDasharray="0.8,0.8" />
        <line x1="-4.2" y1="0.7" x2="4.2" y2="0.7" stroke="#ffffff" strokeWidth="0.25" strokeDasharray="0.8,0.8" />
        <line x1="-2.1" y1="-2.2" x2="-2.1" y2="2.2" stroke="#ffffff" strokeWidth="0.25" strokeDasharray="0.8,0.8" />
        <line x1="0" y1="-2.2" x2="0" y2="2.2" stroke="#ffffff" strokeWidth="0.25" strokeDasharray="0.8,0.8" />
        <line x1="2.1" y1="-2.2" x2="2.1" y2="2.2" stroke="#ffffff" strokeWidth="0.25" strokeDasharray="0.8,0.8" />
        <rect x="-4.2" y="1.8" width="8.4" height="0.6" fill="#ca8a04" />
      </g>
    );
  }

  if (obj.type === 'ladder') {
    return (
      <g transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={onPointerDown} className="cursor-grab touch-none select-none">
        <rect x="-2.2" y="-7.2" width="4.4" height="14.4" fill="rgba(0,0,0,0.25)" rx="0.3" transform="translate(0.3, 0.3)" />
        <line x1="-2.2" y1="-7.2" x2="-2.2" y2="7.2" stroke="#0f172a" strokeWidth="0.6" />
        <line x1="2.2" y1="-7.2" x2="2.2" y2="7.2" stroke="#0f172a" strokeWidth="0.6" />
        {[-5.4, -3.6, -1.8, 0, 1.8, 3.6, 5.4].map((step) => (
          <line key={step} x1="-2.2" y1={step} x2="2.2" y2={step} stroke="#facc15" strokeWidth="0.7" />
        ))}
      </g>
    );
  }

  if (obj.type === 'dummy') {
    return (
      <g transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={onPointerDown} className="cursor-grab touch-none select-none">
        <ellipse cx="0" cy="4.2" rx="2" ry="0.8" fill="rgba(0,0,0,0.3)" />
        <circle cx="0" cy="-3.6" r="1.3" fill="#eab308" stroke="#ca8a04" strokeWidth="0.3" />
        <path d="M -2.2 -2.1 Q 0 -2.6 2.2 -2.1 L 1.8 2.2 Q 0 2.5 -1.8 2.2 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="0.35" />
        <line x1="-1.1" y1="2.2" x2="-1.1" y2="4.2" stroke="#0f172a" strokeWidth="0.5" />
        <line x1="1.1" y1="2.2" x2="1.1" y2="4.2" stroke="#0f172a" strokeWidth="0.5" />
      </g>
    );
  }

  if (obj.type === 'cone') {
    return (
      <g transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={onPointerDown} className="cursor-grab touch-none select-none">
        <ellipse cx="0" cy="1.6" rx="2.2" ry="0.9" fill="rgba(0,0,0,0.3)" />
        <ellipse cx="0" cy="1.2" rx="2.0" ry="0.7" fill={obj.color || '#ea580c'} />
        <polygon points="-1.6,1.2 1.6,1.2 0,-2.6" fill={obj.color || '#f97316'} stroke="#c2410c" strokeWidth="0.25" />
        <polygon points="-0.8,0.2 0.8,0.2 0,-1.4" fill="#ffffff" />
      </g>
    );
  }

  if (obj.type === 'saucer') {
    return (
      <g transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={onPointerDown} className="cursor-grab touch-none select-none">
        <ellipse cx="0" cy="0.9" rx="2.4" ry="1.1" fill="rgba(0,0,0,0.3)" />
        <ellipse cx="0" cy="0.6" rx="2.2" ry="0.9" fill={obj.color || '#facc15'} stroke="#000" strokeWidth="0.2" />
        <ellipse cx="0" cy="0.3" rx="0.7" ry="0.35" fill="#1e293b" />
      </g>
    );
  }

  if (obj.type === 'ring') {
    return (
      <g transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={onPointerDown} className="cursor-grab touch-none select-none">
        <ellipse cx="0" cy="0.4" rx="3.1" ry="3.1" fill="rgba(0,0,0,0.25)" />
        <circle cx="0" cy="0" r="3.0" fill="none" stroke={obj.color || '#facc15'} strokeWidth="0.7" />
      </g>
    );
  }

  if (obj.type === 'hurdle') {
    return (
      <g transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={onPointerDown} className="cursor-grab touch-none select-none">
        <ellipse cx="0" cy="2.2" rx="3.2" ry="0.7" fill="rgba(0,0,0,0.25)" />
        <line x1="-3" y1="2" x2="-3" y2="-1.8" stroke="#ca8a04" strokeWidth="0.5" />
        <line x1="3" y1="2" x2="3" y2="-1.8" stroke="#ca8a04" strokeWidth="0.5" />
        <rect x="-3.2" y="-2.2" width="6.4" height="0.8" fill="#facc15" stroke="#ca8a04" strokeWidth="0.2" rx="0.2" />
      </g>
    );
  }

  return null;
}

export default function App() {
  const [pitchMode, setPitchMode] = useState('full');
  const [showTrainingMenu, setShowTrainingMenu] = useState(false);
  const [showLineMenu, setShowLineMenu] = useState(false);
  const [showSystemsMenu, setShowSystemsMenu] = useState(false);

  // Estados metodológicos
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  const [drillTitle, setDrillTitle] = useState('Salida de Balón y Transición');
  const [drillCategory, setDrillCategory] = useState('sub14');
  const [drillNotes, setDrillNotes] = useState('Bloques de 6 minutos. Énfasis en el tercer hombre.');

  const [savedDrills, setSavedDrills] = useState(() => {
    const local = localStorage.getItem('andez_saved_drills');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return [
      {
        id: 'drill-1',
        title: 'Rondo 4v2 con Tercer Hombre',
        category: 'sub10',
        notes: 'Iniciación en apoyos diagonales',
        pitchMode: 'half',
        date: '2026-10-12',
        objects: [
          ...TACTICAL_SYSTEMS['4-3-3'].slice(0, 6).map(p => ({ ...p, id: 'r-' + p.number, type: 'player' })),
          { id: 'b-1', type: 'ball', x: 34, y: 42.5 }
        ],
        drawings: []
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('andez_saved_drills', JSON.stringify(savedDrills));
  }, [savedDrills]);

  // Panel de Administrador / Dueño
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  // Formulario nuevo usuario
  const [newCoachName, setNewCoachName] = useState('');
  const [newCoachClub, setNewCoachClub] = useState('');
  const [newCoachPlan, setNewCoachPlan] = useState('Coach Single (\$15.000)');
  const [newCoachExpiry, setNewCoachExpiry] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });

  const [adminLicenses, setAdminLicenses] = useState(() => {
    const localLic = localStorage.getItem('andez_licenses');
    if (localLic) {
      try { return JSON.parse(localLic); } catch (e) {}
    }
    return [
      { id: 'lic-1', coach: 'Prof. Carlos Morales', club: 'Escuela Los Andes', code: 'AND-7821', seats: 2, status: 'active', plan: 'Club Dúo (\$25.000)', price: 25000, expiry: '2026-11-15' },
      { id: 'lic-2', coach: 'DT Matías Soto', club: 'Academia Biobío', code: 'AND-4412', seats: 2, status: 'active', plan: 'Coach Single (\$15.000)', price: 15000, expiry: '2026-11-10' },
      { id: 'lic-3', coach: 'Prof. Esteban Tapia', club: 'Deportivo Central', code: 'AND-9934', seats: 2, status: 'suspended', plan: 'Coach Single (\$15.000)', price: 15000, expiry: '2026-10-01' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('andez_licenses', JSON.stringify(adminLicenses));
  }, [adminLicenses]);

  const [tool, setTool] = useState('move');
  const [lineType, setLineType] = useState('arrow');
  const [lineColor, setLineColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(1.4);

  const [objects, setObjects] = useState([
    ...TACTICAL_SYSTEMS['4-3-3'].map((p) => ({ ...p, id: 'init-' + p.number, type: 'player' })),
    { id: 'ball-1', type: 'ball', x: 34, y: 52.5 }
  ]);
  const [drawings, setDrawings] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);

  const [history, setHistory] = useState([objects]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const svgRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [selectedObj, setSelectedObj] = useState(null);

  const getCoordinates = (e) => {
    if (!svgRef.current) return { x: 34, y: 50 };
    const pt = svgRef.current.createSVGPoint();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    pt.x = clientX;
    pt.y = clientY;
    const cursorPt = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
    const maxX = 68;
    const maxY = pitchMode === 'half' ? 85 : 105;
    return {
      x: Math.max(2, Math.min(maxX - 2, cursorPt.x)),
      y: Math.max(2, Math.min(maxY - 2, cursorPt.y))
    };
  };

  const handlePointerDown = (e, obj) => {
    e.stopPropagation();
    if (tool === 'eraser') {
      const filtered = objects.filter((o) => o.id !== obj.id);
      setObjects(filtered);
      recordHistory(filtered);
      return;
    }
    if (tool !== 'move') return;
    setSelectedObj(obj);
    isDraggingRef.current = true;
  };

  const handleLinePointerDown = (e, lineId) => {
    if (tool === 'eraser') {
      e.stopPropagation();
      setDrawings((prev) => prev.filter((l) => l.id !== lineId));
    }
  };

  const handlePitchPointerDown = (e) => {
    if (tool === 'move' || tool === 'eraser') {
      setSelectedObj(null);
      return;
    }
    const coords = getCoordinates(e);
    setCurrentLine({
      id: Date.now(),
      start: coords,
      end: coords,
      type: lineType,
      color: lineColor,
      width: lineWidth
    });
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

  const recordHistory = (newObjects) => {
    const nextH = history.slice(0, historyIndex + 1);
    nextH.push(JSON.parse(JSON.stringify(newObjects)));
    setHistory(nextH);
    setHistoryIndex(nextH.length - 1);
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      recordHistory(objects);
    }
    if (currentLine) {
      setDrawings((prev) => [...prev, currentLine]);
      setCurrentLine(null);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setObjects(JSON.parse(JSON.stringify(history[prevIdx])));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setObjects(JSON.parse(JSON.stringify(history[nextIdx])));
    }
  };

  const addElement = (itemType, extra = {}) => {
    const id = 'item-' + Date.now();
    const spawnY = pitchMode === 'half' ? 42.5 : 52.5;
    let newItem = { id, type: itemType, x: 34, y: spawnY, ...extra };
    if (itemType === 'player') {
      const count = objects.filter((o) => o.type === 'player' && o.team === (extra.team || 'blue')).length + 1;
      newItem.number = String(extra.number || count);
    }
    const nextObjs = [...objects, newItem];
    setObjects(nextObjs);
    recordHistory(nextObjs);
  };

  const removeLastLineOrAll = () => {
    if (drawings.length === 0) return;
    setDrawings((prev) => prev.slice(0, -1));
  };

  const handleConfirmSaveDrill = () => {
    const newDrill = {
      id: 'drill-' + Date.now(),
      title: drillTitle,
      category: drillCategory,
      notes: drillNotes,
      pitchMode: pitchMode,
      date: new Date().toISOString().split('T')[0],
      objects: JSON.parse(JSON.stringify(objects)),
      drawings: JSON.parse(JSON.stringify(drawings))
    };
    setSavedDrills([newDrill, ...savedDrills]);
    setShowSaveModal(false);
    alert('¡Sesión guardada exitosamente en la biblioteca!');
  };

  const loadDrillFromLibrary = (drill) => {
    setPitchMode(drill.pitchMode || 'full');
    setObjects(drill.objects);
    setDrawings(drill.drawings || []);
    setDrillTitle(drill.title);
    setDrillCategory(drill.category);
    setShowLibraryModal(false);
  };

  const deleteDrill = (drillId) => {
    if (confirm('¿Deseas eliminar este ejercicio guardado?')) {
      setSavedDrills(savedDrills.filter(d => d.id !== drillId));
    }
  };

  // Crear Usuario en Panel
  const handleCreateNewUser = (e) => {
    e.preventDefault();
    if (!newCoachName.trim()) {
      alert('Ingresa el nombre del profesor o club');
      return;
    }
    const randomCode = 'AND-' + Math.floor(1000 + Math.random() * 9000);
    const priceVal = newCoachPlan.includes('Dúo') ? 25000 : 15000;
    const newLicense = {
      id: 'lic-' + Date.now(),
      coach: newCoachName,
      club: newCoachClub || 'Club Particular',
      code: randomCode,
      seats: newCoachPlan.includes('Dúo') ? 2 : 1,
      status: 'active',
      plan: newCoachPlan,
      price: priceVal,
      expiry: newCoachExpiry
    };

    setAdminLicenses([newLicense, ...adminLicenses]);
    setShowNewUserModal(false);
    setNewCoachName('');
    setNewCoachClub('');
    alert(`¡Usuario creado exitosamente!\n\nProfesor: ${newCoachName}\nCódigo de Activación: ${randomCode}\nFecha de Vencimiento: ${newCoachExpiry}`);
  };

  const handleDeleteLicense = (id) => {
    if (confirm('¿Seguro que deseas eliminar esta licencia?')) {
      setAdminLicenses(adminLicenses.filter(l => l.id !== id));
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPasswordInput === 'andez2026') {
      setShowAdminLogin(false);
      setShowAdminDashboard(true);
      setAdminPasswordInput('');
    } else {
      alert('Contraseña incorrecta. (Clave por defecto: andez2026)');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Andez Sports FC - ${drillTitle}`,
          text: `Sesión: ${drillTitle} | Categoría: ${drillCategory.toUpperCase()} | Andez Sports FC PRO`,
          url: window.location.href,
        });
      } catch (err) {
        console.log(err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace del ejercicio copiado al portapapeles!');
    }
  };

  const applyTacticalSystem = (systemKey) => {
    const sys = TACTICAL_SYSTEMS[systemKey];
    if (!sys) return;
    const newPlayers = sys.map((p, idx) => ({
      id: 'sys-p-' + idx,
      type: 'player',
      ...p
    }));
    const nonPlayers = objects.filter((o) => o.type !== 'player');
    const updated = [...newPlayers, ...nonPlayers];
    setObjects(updated);
    recordHistory(updated);
    setShowSystemsMenu(false);
  };

  const renderLinePath = (line, isPreview = false) => {
    const { id, start, end, type, color, width } = line;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const length = Math.hypot(dx, dy);

    const arrowLength = Math.max(3.8, width * 2.6);
    const arrowWing = Math.max(2.6, width * 1.9);

    const lineEndX = length > arrowLength ? end.x - (arrowLength * 0.75) * Math.cos(angle) : end.x;
    const lineEndY = length > arrowLength ? end.y - (arrowLength * 0.75) * Math.sin(angle) : end.y;

    const arrowP1x = end.x - arrowLength * Math.cos(angle) + arrowWing * Math.sin(angle);
    const arrowP1y = end.y - arrowLength * Math.sin(angle) - arrowWing * Math.cos(angle);
    const arrowP2x = end.x - arrowLength * Math.cos(angle) - arrowWing * Math.sin(angle);
    const arrowP2y = end.y - arrowLength * Math.sin(angle) + arrowWing * Math.cos(angle);

    if (type === 'wavy-arrow') {
      const waves = 4;
      let pathD = `M ${start.x} ${start.y}`;
      for (let i = 1; i <= waves; i++) {
        const segX = start.x + (dx * i) / waves;
        const segY = start.y + (dy * i) / waves;
        const perpX = -Math.sin(angle) * (i % 2 === 0 ? -2.2 : 2.2);
        const perpY = Math.cos(angle) * (i % 2 === 0 ? -2.2 : 2.2);
        pathD += ` Q ${segX + perpX} ${segY + perpY} ${segX} ${segY}`;
      }
      return (
        <g
          key={id || 'curr'}
          onPointerDown={(e) => !isPreview && handleLinePointerDown(e, id)}
          className={tool === 'eraser' ? 'cursor-pointer hover:opacity-50' : ''}
        >
          <path d={pathD} fill="none" stroke="transparent" strokeWidth={Math.max(8, width * 4)} />
          <path d={pathD} fill="none" stroke={color} strokeWidth={width} />
          <polygon points={`${end.x},${end.y} ${arrowP1x},${arrowP1y} ${arrowP2x},${arrowP2y}`} fill={color} />
        </g>
      );
    }

    if (type === 'stop') {
      const stopLen = Math.max(3.2, width * 2.2);
      const p1x = end.x - Math.sin(angle) * stopLen;
      const p1y = end.y + Math.cos(angle) * stopLen;
      const p2x = end.x + Math.sin(angle) * stopLen;
      const p2y = end.y - Math.cos(angle) * stopLen;
      return (
        <g
          key={id || 'curr'}
          onPointerDown={(e) => !isPreview && handleLinePointerDown(e, id)}
          className={tool === 'eraser' ? 'cursor-pointer hover:opacity-50' : ''}
        >
          <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="transparent" strokeWidth={Math.max(8, width * 4)} />
          <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={color} strokeWidth={width} strokeLinecap="round" />
          <line x1={p1x} y1={p1y} x2={p2x} y2={p2y} stroke={color} strokeWidth={width * 1.5} strokeLinecap="round" />
        </g>
      );
    }

    const isDashed = type === 'dashed-arrow';
    const hasArrow = type === 'arrow' || type === 'dashed-arrow';

    return (
      <g
        key={id || 'curr'}
        onPointerDown={(e) => !isPreview && handleLinePointerDown(e, id)}
        className={tool === 'eraser' ? 'cursor-pointer hover:opacity-50' : ''}
      >
        <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="transparent" strokeWidth={Math.max(8, width * 4)} />
        <line
          x1={start.x}
          y1={start.y}
          x2={hasArrow && length > arrowLength ? lineEndX : end.x}
          y2={hasArrow && length > arrowLength ? lineEndY : end.y}
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeDasharray={isDashed ? `${width * 2.5},${width * 1.8}` : 'none'}
        />
        {hasArrow && length > 2.5 && (
          <polygon
            points={`${end.x},${end.y} ${arrowP1x},${arrowP1y} ${arrowP2x},${arrowP2y}`}
            fill={color}
            stroke={color}
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        )}
      </g>
    );
  };

  const filteredDrills = selectedCategoryFilter === 'all'
    ? savedDrills
    : savedDrills.filter(d => d.category === selectedCategoryFilter);

  const totalRevenue = adminLicenses
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + (l.price || 15000), 0);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#000000] overflow-hidden select-none font-sans">
      {/* 1. BARRA SUPERIOR CON ACCESO CLARO A ADMINISTRADOR */}
      <header className="bg-black px-3 py-1.5 flex items-center justify-between shrink-0 z-30 border-b border-zinc-900 shadow-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setShowLibraryModal(true)}
            className="text-zinc-300 hover:text-amber-400 active:scale-95 transition"
            title="Mis Sesiones / Categorías"
          >
            <Folder className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowSystemsMenu(true)}
            className="text-zinc-300 hover:text-amber-400 active:scale-95 transition"
            title="Sistemas Tácticos"
          >
            <Play className="w-5 h-5" />
          </button>

          <button
            onClick={() => setPitchMode(pitchMode === 'full' ? 'half' : 'full')}
            className={`p-1 rounded active:scale-95 transition ${pitchMode === 'half' ? 'bg-red-600 text-white' : 'text-zinc-300 hover:text-white'}`}
            title="Alternar Cancha Entera / Media Cancha"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowTrainingMenu(!showTrainingMenu)}
            className={`p-1 rounded active:scale-95 transition ${showTrainingMenu ? 'bg-amber-500 text-black font-black' : 'text-amber-400'}`}
            title="Material de Entrenamiento"
          >
            <span className="text-base font-bold">▲</span>
          </button>

          <button
            onClick={() => addElement('player', { team: 'blue' })}
            className="text-blue-400 hover:text-blue-300 active:scale-95 transition"
            title="Agregar Jugador Azul"
          >
            <Shirt className="w-5 h-5" />
          </button>
        </div>

        {/* Acciones Derecha: Compartir, Guardar y Botón Dueño */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleShare}
            className="text-zinc-300 hover:text-emerald-400 active:scale-95 transition"
            title="Compartir por WhatsApp"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowSaveModal(true)}
            className="text-zinc-300 hover:text-red-400 active:scale-95 transition"
            title="Guardar Sesión"
          >
            <Save className="w-5 h-5" />
          </button>

          {/* BOTÓN MAESTRO DE DUEÑO: Área táctil amplia y visible */}
          <button
            onClick={() => setShowAdminLogin(true)}
            title="Panel de Dueño / Licencias"
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-full active:scale-95 transition"
          >
            <img
              src="/logo-andez.png"
              alt="Logo Andez"
              className="w-5 h-5 rounded-full object-cover border border-red-500"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider hidden sm:inline">Dueño</span>
            <Lock className="w-3 h-3 text-zinc-400" />
          </button>
        </div>
      </header>

      {/* 2. LIENZO DE CANCHA */}
      <main
        className="flex-1 w-full h-full flex items-center justify-center p-0 overflow-hidden touch-none relative bg-[#1e881b]"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <svg
          ref={svgRef}
          viewBox={pitchMode === 'half' ? "0 0 68 85" : "0 0 68 105"}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full touch-none select-none drop-shadow-2xl"
          onPointerDown={handlePitchPointerDown}
        >
          <rect width="200" height="200" x="-50" y="-50" fill="#228b22" />

          {pitchMode === 'half' ? (
            <g>
              <rect x="2" y="3" width="64" height="79" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="2" y="19" width="22" height="47" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="2" y="30.5" width="7" height="24" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="15" cy="42.5" r="0.6" fill="white" />
              <path d="M 24 33.5 A 10 10 0 0 1 24 51.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="0.2" y="37.5" width="1.8" height="10" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />
              <line x1="66" y1="3" x2="66" y2="82" stroke="white" strokeWidth="0.8" />
              <path d="M 66 30.5 A 12 12 0 0 0 66 54.5" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="66" cy="42.5" r="0.6" fill="white" />
            </g>
          ) : (
            <g>
              <rect x="2" y="2" width="64" height="101" fill="none" stroke="white" strokeWidth="0.8" />
              <line x1="2" y1="52.5" x2="66" y2="52.5" stroke="white" strokeWidth="0.8" />
              <circle cx="34" cy="52.5" r="9.15" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="34" cy="52.5" r="0.6" fill="white" />

              <rect x="13.84" y="2" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="24.84" y="2" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="34" cy="13" r="0.6" fill="white" />
              <path d="M 27.5 18.5 A 9.15 9.15 0 0 0 40.5 18.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="30.34" y="0.2" width="7.32" height="1.8" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />

              <rect x="13.84" y="86.5" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="24.84" y="97.5" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="34" cy="92" r="0.6" fill="white" />
              <path d="M 27.5 86.5 A 9.15 9.15 0 0 1 40.5 86.5" fill="none" stroke="white" strokeWidth="0.8" />
              <rect x="30.34" y="103" width="7.32" height="1.8" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />
            </g>
          )}

          {drawings.map((line) => renderLinePath(line, false))}
          {currentLine && renderLinePath(currentLine, true)}

          {objects.map((obj) => {
            if (obj.type === 'player') {
              return (
                <g
                  key={obj.id}
                  transform={`translate(${obj.x}, ${obj.y})`}
                  onPointerDown={(e) => handlePointerDown(e, obj)}
                  className={`touch-none select-none ${tool === 'eraser' ? 'cursor-pointer hover:opacity-50' : 'cursor-grab active:cursor-grabbing'}`}
                >
                  <circle r="3.2" fill="rgba(0,0,0,0.25)" transform="translate(0.3, 0.3)" />
                  <circle
                    r="3.0"
                    fill={obj.role === 'GK' ? '#f59e0b' : obj.team === 'blue' ? '#2563eb' : '#dc2626'}
                    stroke="#ffffff"
                    strokeWidth="0.6"
                  />
                  <text
                    textAnchor="middle"
                    dy="1.0"
                    fontSize="2.5"
                    fontWeight="bold"
                    fill="#ffffff"
                    pointerEvents="none"
                  >
                    {obj.number}
                  </text>
                  {tool === 'eraser' && (
                    <circle r="3.4" fill="none" stroke="#ef4444" strokeWidth="0.6" strokeDasharray="1,1" />
                  )}
                </g>
              );
            }

            if (obj.type === 'ball') {
              return (
                <SoccerBall
                  key={obj.id}
                  x={obj.x}
                  y={obj.y}
                  onPointerDown={(e) => handlePointerDown(e, obj)}
                />
              );
            }

            return (
              <TrainingMaterial
                key={obj.id}
                obj={obj}
                onPointerDown={(e) => handlePointerDown(e, obj)}
              />
            );
          })}
        </svg>

        {/* 3. MODAL PARA GUARDAR CON CATEGORÍA */}
        {showSaveModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <Save className="w-4 h-4 text-red-500" /> Guardar Ejercicio
                </h3>
                <button onClick={() => setShowSaveModal(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Título de la Sesión</label>
                  <input
                    type="text"
                    value={drillTitle}
                    onChange={(e) => setDrillTitle(e.target.value)}
                    placeholder="Ej. Salida 3v2 + Transición"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Categoría</label>
                  <select
                    value={drillCategory}
                    onChange={(e) => setDrillCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Objetivos / Observaciones</label>
                  <textarea
                    value={drillNotes}
                    onChange={(e) => setDrillNotes(e.target.value)}
                    rows={3}
                    placeholder="Consignas, repeticiones, dimensiones..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 resize-none"
                  />
                </div>

                <button
                  onClick={handleConfirmSaveDrill}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 font-black text-xs uppercase tracking-wider rounded-xl text-white shadow-lg transition mt-2"
                >
                  Guardar en la Nube
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. MODAL BIBLIOTECA DE SESIONES */}
        {showLibraryModal && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-5 shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2 shrink-0">
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <Folder className="w-4 h-4 text-amber-400" /> Mis Sesiones Guardadas
                </h3>
                <button onClick={() => setShowLibraryModal(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 shrink-0 mb-2">
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition shrink-0 ${selectedCategoryFilter === 'all' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}
                >
                  Todas ({savedDrills.length})
                </button>
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategoryFilter(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition shrink-0 ${selectedCategoryFilter === c.id ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}
                  >
                    {c.name.split(' ')[0]} ({savedDrills.filter(d => d.category === c.id).length})
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredDrills.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-8">No hay ejercicios en esta categoría aún.</p>
                ) : (
                  filteredDrills.map((drill) => (
                    <div
                      key={drill.id}
                      className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center justify-between hover:border-zinc-700 transition"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-950 text-
