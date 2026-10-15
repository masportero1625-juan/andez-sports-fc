import React, { useState, useRef, useEffect } from 'react';
import {
  Folder, Play, RotateCcw, Shirt, Share2, Save,
  Undo2, Redo2, Trash2, PenTool, X, ChevronRight, Eraser,
  Lock, KeyRound, ShieldCheck, Check, Search, Plus, Calendar, AlertTriangle, Users, Gift, RotateCw, LogOut, MessageCircle
} from 'lucide-react';

const CATEGORIES = [
  { id: 'sub10', name: 'Sub-8 a Sub-10 (Iniciación)' },
  { id: 'sub14', name: 'Sub-12 a Sub-14 (Formación)' },
  { id: 'sub18', name: 'Sub-16 a Juvenil (Especialización)' },
  { id: 'senior', name: 'Adulto / Senior (Rendimiento)' },
];

const GET_TACTICAL_SYSTEMS = (isLandscape) => {
  if (isLandscape) {
    return {
      '4-3-3': [
        { number: '1', role: 'GK', x: 8, y: 34, team: 'blue' },
        { number: '4', role: 'CB', x: 22, y: 24, team: 'blue' },
        { number: '3', role: 'CB', x: 22, y: 44, team: 'blue' },
        { number: '2', role: 'RB', x: 30, y: 10, team: 'blue' },
        { number: '5', role: 'LB', x: 30, y: 58, team: 'blue' },
        { number: '6', role: 'CDM', x: 40, y: 34, team: 'blue' },
        { number: '8', role: 'CM', x: 52, y: 22, team: 'blue' },
        { number: '10', role: 'CAM', x: 52, y: 46, team: 'blue' },
        { number: '7', role: 'RW', x: 74, y: 12, team: 'blue' },
        { number: '11', role: 'LW', x: 74, y: 56, team: 'blue' },
        { number: '9', role: 'ST', x: 82, y: 34, team: 'blue' },
      ],
      '4-4-2': [
        { number: '1', role: 'GK', x: 8, y: 34, team: 'blue' },
        { number: '4', role: 'CB', x: 22, y: 24, team: 'blue' },
        { number: '3', role: 'CB', x: 22, y: 44, team: 'blue' },
        { number: '2', role: 'RB', x: 30, y: 10, team: 'blue' },
        { number: '5', role: 'LB', x: 30, y: 58, team: 'blue' },
        { number: '6', role: 'CM', x: 48, y: 24, team: 'blue' },
        { number: '8', role: 'CM', x: 48, y: 44, team: 'blue' },
        { number: '7', role: 'RM', x: 56, y: 10, team: 'blue' },
        { number: '11', role: 'LM', x: 56, y: 58, team: 'blue' },
        { number: '9', role: 'ST', x: 78, y: 26, team: 'blue' },
        { number: '10', role: 'ST', x: 78, y: 42, team: 'blue' },
      ],
      '3-5-2': [
        { number: '1', role: 'GK', x: 8, y: 34, team: 'blue' },
        { number: '2', role: 'CB', x: 22, y: 18, team: 'blue' },
        { number: '4', role: 'CB', x: 21, y: 34, team: 'blue' },
        { number: '3', role: 'CB', x: 22, y: 50, team: 'blue' },
        { number: '6', role: 'CDM', x: 38, y: 34, team: 'blue' },
        { number: '8', role: 'CM', x: 50, y: 23, team: 'blue' },
        { number: '10', role: 'CM', x: 50, y: 45, team: 'blue' },
        { number: '7', role: 'RWB', x: 56, y: 8, team: 'blue' },
        { number: '11', role: 'LWB', x: 56, y: 60, team: 'blue' },
        { number: '9', role: 'ST', x: 78, y: 26, team: 'blue' },
        { number: '19', role: 'ST', x: 78, y: 42, team: 'blue' },
      ]
    };
  }

  return {
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

function TrainingMaterial({ obj, onPointerDown, onDoubleClick }) {
  const rotation = obj.rotation || 0;
  let content = null;

  if (obj.type === 'mini_goal') {
    content = (
      <>
        <rect x="-4.2" y="-2.2" width="8.4" height="4.4" fill="rgba(0,0,0,0.2)" rx="0.5" transform="translate(0.3, 0.4)" />
        <rect x="-4.2" y="-2.2" width="8.4" height="4.4" fill="rgba(255,255,255,0.25)" stroke="#eab308" strokeWidth="0.7" rx="0.4" />
        <line x1="-4.2" y1="-0.7" x2="4.2" y2="-0.7" stroke="#ffffff" strokeWidth="0.25" strokeDasharray="0.8,0.8" />
        <line x1="-4.2" y1="0.7" x2="4.2" y2="0.7" stroke="#ffffff" strokeWidth="0.25" strokeDasharray="0.8,0.8" />
        <line x1="-2.1" y1="-2.2" x2="-2.1" y2="2.2" stroke="#ffffff" strokeWidth="0.25" strokeDasharray="0.8,0.8" />
        <line x1="0" y1="-2.2" x2="0" y2="2.2" stroke="#ffffff" strokeWidth="0.25" strokeDasharray="0.8,0.8" />
        <line x1="2.1" y1="-2.2" x2="2.1" y2="2.2" stroke="#ffffff" strokeWidth="0.25" strokeDasharray="0.8,0.8" />
        <rect x="-4.2" y="1.8" width="8.4" height="0.6" fill="#ca8a04" />
      </>
    );
  } else if (obj.type === 'ladder') {
    content = (
      <>
        <rect x="-2.2" y="-7.2" width="4.4" height="14.4" fill="rgba(0,0,0,0.25)" rx="0.3" transform="translate(0.3, 0.3)" />
        <line x1="-2.2" y1="-7.2" x2="-2.2" y2="7.2" stroke="#0f172a" strokeWidth="0.6" />
        <line x1="2.2" y1="-7.2" x2="2.2" y2="7.2" stroke="#0f172a" strokeWidth="0.6" />
        {[-5.4, -3.6, -1.8, 0, 1.8, 3.6, 5.4].map((step) => (
          <line key={step} x1="-2.2" y1={step} x2="2.2" y2={step} stroke="#facc15" strokeWidth="0.7" />
        ))}
      </>
    );
  } else if (obj.type === 'dummy') {
    content = (
      <>
        <ellipse cx="0" cy="4.2" rx="2" ry="0.8" fill="rgba(0,0,0,0.3)" />
        <circle cx="0" cy="-3.6" r="1.3" fill="#eab308" stroke="#ca8a04" strokeWidth="0.3" />
        <path d="M -2.2 -2.1 Q 0 -2.6 2.2 -2.1 L 1.8 2.2 Q 0 2.5 -1.8 2.2 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="0.35" />
        <line x1="-1.1" y1="2.2" x2="-1.1" y2="4.2" stroke="#0f172a" strokeWidth="0.5" />
        <line x1="1.1" y1="2.2" x2="1.1" y2="4.2" stroke="#0f172a" strokeWidth="0.5" />
      </>
    );
  } else if (obj.type === 'cone') {
    content = (
      <>
        <ellipse cx="0" cy="1.6" rx="2.2" ry="0.9" fill="rgba(0,0,0,0.3)" />
        <ellipse cx="0" cy="1.2" rx="2.0" ry="0.7" fill={obj.color || '#ea580c'} />
        <polygon points="-1.6,1.2 1.6,1.2 0,-2.6" fill={obj.color || '#f97316'} stroke="#c2410c" strokeWidth="0.25" />
        <polygon points="-0.8,0.2 0.8,0.2 0,-1.4" fill="#ffffff" />
      </>
    );
  } else if (obj.type === 'saucer') {
    content = (
      <>
        <ellipse cx="0" cy="0.9" rx="2.4" ry="1.1" fill="rgba(0,0,0,0.3)" />
        <ellipse cx="0" cy="0.6" rx="2.2" ry="0.9" fill={obj.color || '#facc15'} stroke="#000" strokeWidth="0.2" />
        <ellipse cx="0" cy="0.3" rx="0.7" ry="0.35" fill="#1e293b" />
      </>
    );
  } else if (obj.type === 'ring') {
    content = (
      <>
        <ellipse cx="0" cy="0.4" rx="3.1" ry="3.1" fill="rgba(0,0,0,0.25)" />
        <circle cx="0" cy="0" r="3.0" fill="none" stroke={obj.color || '#facc15'} strokeWidth="0.7" />
      </>
    );
  } else if (obj.type === 'hurdle') {
    content = (
      <>
        <ellipse cx="0" cy="2.2" rx="3.2" ry="0.7" fill="rgba(0,0,0,0.25)" />
        <line x1="-3" y1="2" x2="-3" y2="-1.8" stroke="#ca8a04" strokeWidth="0.5" />
        <line x1="3" y1="2" x2="3" y2="-1.8" stroke="#ca8a04" strokeWidth="0.5" />
        <rect x="-3.2" y="-2.2" width="6.4" height="0.8" fill="#facc15" stroke="#ca8a04" strokeWidth="0.2" rx="0.2" />
      </>
    );
  }

  return (
    <g
      transform={`translate(${obj.x}, ${obj.y}) rotate(${rotation})`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className="cursor-grab active:cursor-grabbing touch-none select-none"
    >
      {content}
    </g>
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
    const localLic = localStorage.getItem('andez_licenses');
    if (localLic) {
      try { return JSON.parse(localLic); } catch (e) {}
    }
    return [
      { id: 'lic-1', coach: 'Prof. Carlos Morales', club: 'Escuela Los Andes', code: 'AND-7821', seats: 5, status: 'active', plan: 'Escuela / Club (5 Equipos: 4 Móviles + 1 PC)', price: 35000, expiry: '2026-11-15' },
      { id: 'lic-2', coach: 'DT Matías Soto', club: 'Academia Biobío', code: 'AND-4412', seats: 2, status: 'active', plan: 'DT Personal (2 Equipos: Móvil + PC)', price: 15000, expiry: '2026-11-10' },
      { id: 'lic-3', coach: 'Prof. Esteban Tapia', club: 'Deportivo Central', code: 'AND-9934', seats: 2, status: 'suspended', plan: 'DT Personal (2 Equipos: Móvil + PC)', price: 15000, expiry: '2026-10-01' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('andez_licenses', JSON.stringify(adminLicenses));
  }, [adminLicenses]);

  // AUTENTICACIÓN / CERROJO
  const [authenticatedUser, setAuthenticatedUser] = useState(() => {
    const savedAuth = localStorage.getItem('andez_auth_session');
    if (savedAuth) {
      try { return JSON.parse(savedAuth); } catch (e) {}
    }
    return null;
  });

  const [inputLicenseCode, setInputLicenseCode] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleClientLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const codeClean = inputLicenseCode.trim().toUpperCase();

    if (codeClean === 'ANDEZ2026') {
      const ownerUser = { role: 'owner', name: 'Administrador Maestro' };
      setAuthenticatedUser(ownerUser);
      localStorage.setItem('andez_auth_session', JSON.stringify(ownerUser));
      return;
    }

    const found = adminLicenses.find(l => l.code.toUpperCase() === codeClean);
    if (!found) {
      setLoginError('Código de activación no válido. Solicita tu acceso por WhatsApp.');
      return;
    }

    if (found.status === 'suspended') {
      setLoginError('Suscripción suspendida. Contacta a Andez Sports FC para renovar.');
      return;
    }

    if (new Date(found.expiry) < new Date()) {
      setLoginError(`Suscripción vencida el ${found.expiry}. Renueva tu plan por WhatsApp.`);
      return;
    }

    const clientUser = { role: 'client', ...found };
    setAuthenticatedUser(clientUser);
    localStorage.setItem('andez_auth_session', JSON.stringify(clientUser));
  };

  const handleLogout = () => {
    if (confirm('¿Deseas cerrar sesión en este equipo?')) {
      setAuthenticatedUser(null);
      localStorage.removeItem('andez_auth_session');
    }
  };

  const [pitchMode, setPitchMode] = useState('full');
  const [showTrainingMenu, setShowTrainingMenu] = useState(false);
  const [showLineMenu, setShowLineMenu] = useState(false);
  const [showSystemsMenu, setShowSystemsMenu] = useState(false);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [activeTabLibrary, setActiveTabLibrary] = useState('sessions');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('sub14');

  const [editingPlayer, setEditingPlayer] = useState(null);
  const [playerCustomName, setPlayerCustomName] = useState('');
  const [playerCustomNumber, setPlayerCustomNumber] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const [rosters, setRosters] = useState(() => {
    const local = localStorage.getItem('andez_category_rosters');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return {
      sub10: [
        { id: 'p1', name: 'Lucas Valenzuela', rut: '24.123.456-7', birth: '2016-04-12', role: 'Delantero' },
        { id: 'p2', name: 'Joaquín Navarrete', rut: '24.789.012-3', birth: '2016-08-25', role: 'Volante' }
      ],
      sub14: [
        { id: 'p3', name: 'Martín Sepúlveda', rut: '22.345.678-9', birth: '2012-02-14', role: 'Portero' },
        { id: 'p4', name: 'Benjamín Castro', rut: '22.987.654-1', birth: '2012-11-03', role: 'Defensa' }
      ],
      sub18: [],
      senior: []
    };
  });

  useEffect(() => {
    localStorage.setItem('andez_category_rosters', JSON.stringify(rosters));
  }, [rosters]);

  const [newRosterName, setNewRosterName] = useState('');
  const [newRosterRut, setNewRosterRut] = useState('');
  const [newRosterBirth, setNewRosterBirth] = useState('');
  const [newRosterRole, setNewRosterRole] = useState('Delantero');

  const [drillTitle, setDrillTitle] = useState('Salida de Balón y Transición');
  const [drillCategory, setDrillCategory] = useState('sub14');
  const [drillNotes, setDrillNotes] = useState('Bloques de 6 minutos. Énfasis en el tercer hombre.');

  const [savedDrills, setSavedDrills] = useState(() => {
    const local = localStorage.getItem('andez_saved_drills');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('andez_saved_drills', JSON.stringify(savedDrills));
  }, [savedDrills]);

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  const [newCoachName, setNewCoachName] = useState('');
  const [newCoachClub, setNewCoachClub] = useState('');
  const [newCoachPlan, setNewCoachPlan] = useState('DT Personal (2 Equipos: Móvil + PC) - $15.000');
  const [newCoachExpiry, setNewCoachExpiry] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });

  const [tool, setTool] = useState('move');
  const [lineType, setLineType] = useState('arrow');
  const [lineColor, setLineColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(1.4);

  const [objects, setObjects] = useState(() => {
    const systems = GET_TACTICAL_SYSTEMS(window.innerWidth > 768);
    const initialPlayers = systems['4-3-3'].map((p) => ({ ...p, id: 'init-' + p.number, type: 'player', name: '' }));
    const ballPos = window.innerWidth > 768 ? { x: 52.5, y: 34 } : { x: 34, y: 52.5 };
    return [...initialPlayers, { id: 'ball-1', type: 'ball', ...ballPos }];
  });

  const [drawings, setDrawings] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);

  const [history, setHistory] = useState([objects]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const svgRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [selectedObj, setSelectedObj] = useState(null);

  const maxX = isPC ? (pitchMode === 'half' ? 55 : 105) : 68;
  const maxY = isPC ? 68 : (pitchMode === 'half' ? 85 : 105);

  const getCoordinates = (e) => {
    if (!svgRef.current) return { x: maxX / 2, y: maxY / 2 };
    const pt = svgRef.current.createSVGPoint();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    pt.x = clientX;
    pt.y = clientY;
    const cursorPt = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
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

    if (obj.type !== 'player' && obj.type !== 'ball') {
      setSelectedMaterial(obj);
    } else {
      setSelectedMaterial(null);
    }

    setSelectedObj(obj);
    isDraggingRef.current = true;
  };

  const rotateObject = (objId) => {
    const updated = objects.map(o => {
      if (o.id === objId) {
        const nextRot = ((o.rotation || 0) + 45) % 360;
        return { ...o, rotation: nextRot };
      }
      return o;
    });
    setObjects(updated);
    recordHistory(updated);
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
      setSelectedMaterial(null);
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
    const spawnX = isPC ? (pitchMode === 'half' ? 27.5 : 52.5) : 34;
    const spawnY = isPC ? 34 : (pitchMode === 'half' ? 42.5 : 52.5);
    let newItem = { id, type: itemType, x: spawnX, y: spawnY, rotation: 0, name: '', ...extra };
    if (itemType === 'player') {
      const count = objects.filter((o) => o.type === 'player' && o.team === (extra.team || 'blue')).length + 1;
      newItem.number = String(extra.number || count);
    }
    const nextObjs = [...objects, newItem];
    setObjects(nextObjs);
    recordHistory(nextObjs);
  };

  const handleSavePlayerDetails = (e) => {
    e.preventDefault();
    if (!editingPlayer) return;
    const updated = objects.map(o => {
      if (o.id === editingPlayer.id) {
        return {
          ...o,
          number: playerCustomNumber || o.number,
          name: playerCustomName.trim()
        };
      }
      return o;
    });
    setObjects(updated);
    recordHistory(updated);
    setEditingPlayer(null);
  };

  const handleErasePlayerName = (e, objId) => {
    if (tool === 'eraser') {
      e.stopPropagation();
      const updated = objects.map(o => o.id === objId ? { ...o, name: '' } : o);
      setObjects(updated);
      recordHistory(updated);
    }
  };

  const handleAddPlayerToRoster = (e) => {
    e.preventDefault();
    if (!newRosterName.trim()) return;
    const newPlayer = {
      id: 'ros-' + Date.now(),
      name: newRosterName,
      rut: newRosterRut || 'Sin RUT',
      birth: newRosterBirth || '2012-01-01',
      role: newRosterRole
    };
    const currentList = rosters[selectedCategoryFilter] || [];
    setRosters({
      ...rosters,
      [selectedCategoryFilter]: [...currentList, newPlayer]
    });
    setNewRosterName('');
    setNewRosterRut('');
  };

  const handleDeletePlayerFromRoster = (catId, playerId) => {
    setRosters({
      ...rosters,
      [catId]: rosters[catId].filter(p => p.id !== playerId)
    });
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

  const applySevenDaysTrial = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setNewCoachExpiry(d.toISOString().split('T')[0]);
    setNewCoachPlan('Prueba Gratuita (7 Días - 2 Equipos)');
  };

  const handleCreateNewUser = (e) => {
    e.preventDefault();
    if (!newCoachName.trim()) {
      alert('Ingresa el nombre del profesor o club');
      return;
    }
    const randomCode = 'AND-' + Math.floor(1000 + Math.random() * 9000);
    const isSchool = newCoachPlan.includes('Escuela');
    const isTrial = newCoachPlan.includes('Prueba');
    const finalSeats = isSchool ? 5 : 2;
    const finalPrice = isTrial ? 0 : (isSchool ? 35000 : 15000);

    const newLicense = {
      id: 'lic-' + Date.now(),
      coach: newCoachName,
      club: newCoachClub || 'Club Particular',
      code: randomCode,
      seats: finalSeats,
      status: 'active',
      plan: newCoachPlan,
      price: finalPrice,
      expiry: newCoachExpiry
    };

    setAdminLicenses([newLicense, ...adminLicenses]);
    setShowNewUserModal(false);
    setNewCoachName('');
    setNewCoachClub('');
    alert(`¡Usuario creado exitosamente!\n\nProfesor: ${newCoachName}\nPlan: ${newCoachPlan}\nEquipos simultáneos: ${finalSeats}\nCódigo de Activación: ${randomCode}\nVence el: ${newCoachExpiry}`);
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
      alert('Contraseña incorrecta. (Clave: andez2026)');
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
    const systems = GET_TACTICAL_SYSTEMS(isPC);
    const sys = systems[systemKey];
    if (!sys) return;
    const newPlayers = sys.map((p, idx) => ({
      id: 'sys-p-' + idx,
      type: 'player',
      name: '',
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
    .reduce((sum, l) => sum + (l.price || 0), 0);

  // MURO DE PAGO INICIAL
  if (!authenticatedUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-[#09090b] text-white p-4 font-sans select-none relative">
        <button
          onClick={() => setShowAdminLogin(true)}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition"
        >
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span>Acceso Dueño</span>
        </button>

        <div className="w-full max-w-md bg-zinc-950 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 p-0.5 mb-4 shadow-lg">
            <img
              src="/logo-andez.png"
              alt="Andez Logo"
              className="w-full h-full object-cover rounded-2xl"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>

          <span className="text-[10px] font-black tracking-widest text-red-500 uppercase px-2.5 py-0.5 rounded-full bg-red-950/60 border border-red-800/60 mb-2">
            Plataforma Profesional
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white mb-1">
            Andez Sports FC <span className="text-amber-400">PRO</span>
          </h1>
          <p className="text-xs text-zinc-400 mb-6">
            Pizarra táctica y gestión metodológica para Directores Técnicos y Escuelas de Fútbol
          </p>

          <form onSubmit={handleClientLogin} className="w-full space-y-3 mb-6">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block text-left mb-1.5">
                Código de Activación
              </label>
              <input
                type="text"
                value={inputLicenseCode}
                onChange={(e) => setInputLicenseCode(e.target.value)}
                placeholder="Ej. AND-7821"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 text-sm text-center font-mono font-bold text-white uppercase tracking-wider focus:outline-none focus:border-red-500 transition"
                required
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-950/70 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition active:scale-95"
            >
              Activar Pizarra Táctica
            </button>
          </form>

          <div className="w-full pt-4 border-t border-zinc-900">
            <span className="text-[11px] text-zinc-500 block mb-2">¿Aún no tienes tu código de acceso?</span>
            <a
              href="https://wa.me/56900000000?text=Hola%20Andez%20Sports%20FC,%20deseo%20solicitar%20mi%20c%C3%B3digo%20de%20acceso%20o%207%20d%C3%ADas%20de%20prueba%20gratis"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/40 rounded-2xl text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <MessageCircle className="w-4 h-4" /> Solicitar Acceso por WhatsApp
            </a>
          </div>
        </div>

        {showAdminLogin && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xs p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-red-500" /> Acceso Superadmin
                </h3>
                <button onClick={() => setShowAdminLogin(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (adminPasswordInput === 'andez2026') {
                  const owner = { role: 'owner', name: 'Administrador Maestro' };
                  setAuthenticatedUser(owner);
                  localStorage.setItem('andez_auth_session', JSON.stringify(owner));
                  setShowAdminLogin(false);
                } else {
                  alert('Contraseña incorrecta');
                }
              }} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Clave Maestra</label>
                  <input
                    type="password"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="Ingresa clave de dueño"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    autoFocus
                  />
                  <p className="text-[9px] text-zinc-500 mt-1">Clave: andez2026</p>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-red-600 hover:bg-red-500 font-bold text-xs uppercase tracking-wider rounded-xl text-white shadow"
                >
                  Entrar a la Plataforma
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // PIZARRA ACTIVA
  return (
    <div className="flex flex-col h-screen w-screen bg-[#000000] overflow-hidden select-none font-sans">
      <header className="bg-black px-3 py-1.5 flex items-center justify-between shrink-0 z-30 border-b border-zinc-900 shadow-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setShowLibraryModal(true)}
            className="text-zinc-300 hover:text-amber-400 active:scale-95 transition"
            title="Mis Sesiones / Nóminas por Categoría"
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

        <div className="flex items-center gap-2 sm:gap-3">
          {selectedMaterial && (
            <button
              onClick={() => rotateObject(selectedMaterial.id)}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-black px-2 py-1 rounded-full text-[10px] font-black active:scale-95 shadow transition"
              title="Girar Material 45°"
            >
              <RotateCw className="w-3.5 h-3.5" /> Girar 45°
            </button>
          )}

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

          {authenticatedUser.role === 'owner' ? (
            <button
              onClick={() => setShowAdminDashboard(true)}
              title="Panel de Dueño / Licencias"
              className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full active:scale-95 transition"
            >
              <img
                src="/logo-andez.png"
                alt="Logo Andez"
                className="w-5 h-5 rounded-full object-cover border border-red-500"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Dueño</span>
              <Lock className="w-3 h-3 text-zinc-400" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full">
              <span className="text-[10px] font-bold text-zinc-300 max-w-[100px] truncate">
                {authenticatedUser.coach || 'DT Pro'}
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="p-1.5 text-zinc-400 hover:text-red-400 active:scale-95 transition"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. LIENZO */}
      <main
        className="flex-1 w-full h-full flex items-center justify-center p-0 overflow-hidden touch-none relative bg-[#1e881b]"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <svg
          ref={svgRef}
          viewBox={
            isPC
              ? (pitchMode === 'half' ? "0 0 55 68" : "0 0 105 68")
              : (pitchMode === 'half' ? "0 0 68 85" : "0 0 68 105")
          }
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full touch-none select-none drop-shadow-2xl"
          onPointerDown={handlePitchPointerDown}
        >
          <rect width="300" height="300" x="-100" y="-100" fill="#228b22" />

          {isPC ? (
            pitchMode === 'half' ? (
              <g>
                <rect x="2" y="2" width="51" height="64" fill="none" stroke="white" strokeWidth="0.8" />
                <rect x="2" y="13.84" width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.8" />
                <rect x="2" y="24.84" width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.8" />
                <circle cx="11" cy="34" r="0.6" fill="white" />
                <path d="M 18.5 27.5 A 9.15 9.15 0 0 1 18.5 40.5" fill="none" stroke="white" strokeWidth="0.8" />
                <rect x="0.2" y="30.34" width="1.8" height="7.32" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />
                <line x1="53" y1="2" x2="53" y2="66" stroke="white" strokeWidth="0.8" />
                <path d="M 53 24.85 A 9.15 9.15 0 0 0 53 43.15" fill="none" stroke="white" strokeWidth="0.8" />
                <circle cx="53" cy="34" r="0.6" fill="white" />
              </g>
            ) : (
              <g>
                <rect x="2" y="2" width="101" height="64" fill="none" stroke="white" strokeWidth="0.8" />
                <line x1="52.5" y1="2" x2="52.5" y2="66" stroke="white" strokeWidth="0.8" />
                <circle cx="52.5" cy="34" r="9.15" fill="none" stroke="white" strokeWidth="0.8" />
                <circle cx="52.5" cy="34" r="0.6" fill="white" />

                <rect x="2" y="13.84" width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.8" />
                <rect x="2" y="24.84" width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.8" />
                <circle cx="11" cy="34" r="0.6" fill="white" />
                <path d="M 18.5 27.5 A 9.15 9.15 0 0 1 18.5 40.5" fill="none" stroke="white" strokeWidth="0.8" />
                <rect x="0.2" y="30.34" width="1.8" height="7.32" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />

                <rect x="86.5" y="13.84" width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.8" />
                <rect x="97.5" y="24.84" width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.8" />
                <circle cx="94" cy="34" r="0.6" fill="white" />
                <path d="M 86.5 27.5 A 9.15 9.15 0 0 0 86.5 40.5" fill="none" stroke="white" strokeWidth="0.8" />
                <rect x="103" y="30.34" width="1.8" height="7.32" fill="rgba(255,255,255,0.4)" stroke="white" strokeWidth="0.6" />
              </g>
            )
          ) : (
            pitchMode === 'half' ? (
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
            )
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
                  onDoubleClick={() => {
                    setEditingPlayer(obj);
                    setPlayerCustomName(obj.name || '');
                    setPlayerCustomNumber(obj.number);
                  }}
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

                  {obj.name && (
                    <g onPointerDown={(e) => handleErasePlayerName(e, obj.id)}>
                      <rect
                        x="-7"
                        y="3.8"
                        width="14"
                        height="3.4"
                        rx="1"
                        fill="rgba(0,0,0,0.75)"
                        stroke="#ffffff"
                        strokeWidth="0.2"
                      />
                      <text
                        x="0"
                        y="6.2"
                        textAnchor="middle"
                        fontSize="1.9"
                        fontWeight="bold"
                        fill="#ffffff"
                      >
                        {obj.name}
                      </text>
                    </g>
                  )}

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
                onDoubleClick={() => rotateObject(obj.id)}
              />
            );
          })}
        </svg>

        {/* 3. MODAL EDITAR JUGADOR */}
        {editingPlayer && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xs p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
                <h3 className="font-black text-sm text-white">Editar Jugador</h3>
                <button onClick={() => setEditingPlayer(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePlayerDetails} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Nombre / Apodo (Opcional)</label>
                  <input
                    type="text"
                    value={playerCustomName}
                    onChange={(e) => setPlayerCustomName(e.target.value)}
                    placeholder="Ej. Alexis o Soto"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Dorsal / Número</label>
                  <input
                    type="text"
                    value={playerCustomNumber}
                    onChange={(e) => setPlayerCustomNumber(e.target.value)}
                    placeholder="Ej. 7"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  {editingPlayer.name && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = objects.map(o => o.id === editingPlayer.id ? { ...o, name: '' } : o);
                        setObjects(updated);
                        recordHistory(updated);
                        setEditingPlayer(null);
                      }}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-red-400 rounded-xl text-xs font-bold"
                    >
                      Quitar Nombre
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-red-600 hover:bg-red-500 font-bold text-xs uppercase tracking-wider rounded-xl text-white shadow"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. MODAL BIBLIOTECA + NÓMINAS */}
        {showLibraryModal && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl flex flex-col max-h-[88vh]">
              <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTabLibrary('sessions')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition ${activeTabLibrary === 'sessions' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    📁 Sesiones Guardadas
                  </button>
                  <button
                    onClick={() => setActiveTabLibrary('roster')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition ${activeTabLibrary === 'roster' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    📋 Nóminas del Plantel
                  </button>
                </div>
                <button onClick={() => setShowLibraryModal(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 shrink-0 mb-3">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategoryFilter(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition shrink-0 ${selectedCategoryFilter === c.id ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400'}`}
                  >
                    {c.name.split(' ')[0]}
                  </button>
                ))}
              </div>

              {activeTabLibrary === 'sessions' && (
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
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                              {drill.category}
                            </span>
                            <span className="text-[10px] text-zinc-500">{drill.date}</span>
                          </div>
                          <h4 className="font-bold text-xs text-white truncate">{drill.title}</h4>
                          {drill.notes && <p className="text-[10px] text-zinc-400 truncate">{drill.notes}</p>}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => loadDrillFromLibrary(drill)}
                            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow"
                          >
                            Cargar
                          </button>
                          <button
                            onClick={() => deleteDrill(drill.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTabLibrary === 'roster' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <form onSubmit={handleAddPlayerToRoster} className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl mb-3 shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre y Apellido"
                      value={newRosterName}
                      onChange={(e) => setNewRosterName(e.target.value)}
                      className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                    <input
                      type="text"
                      placeholder="RUT / ID"
                      value={newRosterRut}
                      onChange={(e) => setNewRosterRut(e.target.value)}
                      className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-400"
                    />
                    <input
                      type="date"
                      value={newRosterBirth}
                      onChange={(e) => setNewRosterBirth(e.target.value)}
                      className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] rounded-lg py-1 flex items-center justify-center gap-1 shadow"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar
                    </button>
                  </form>

                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {(rosters[selectedCategoryFilter] || []).length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-6">No hay alumnos registrados en esta categoría aún.</p>
                    ) : (
                      (rosters[selectedCategoryFilter] || []).map((player) => (
                        <div
                          key={player.id}
                          className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-xs text-white">{player.name}</div>
                            <div className="text-[10px] text-zinc-400">
                              RUT: <span className="text-zinc-300 font-mono">{player.rut}</span> • Nacimiento: <span className="text-zinc-300">{player.birth}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePlayerFromRoster(selectedCategoryFilter, player.id)}
                            className="p-1 text-zinc-500 hover:text-red-400 rounded"
                            title="Eliminar de nómina"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. MODAL GUARDAR */}
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

        {/* 6. MODAL PANEL SUPERADMIN: CONTROL DE LICENCIAS */}
        {showAdminDashboard && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2 shrink-0">
                <div>
                  <span className="bg-red-600 text-[9px] font-black px-1.5 py-0.5 rounded text-white">DUEÑO</span>
                  <h3 className="font-black text-base text-white mt-1">Control de Licencias SaaS</h3>
                </div>
                <button onClick={() => setShowAdminDashboard(false)} className="text-zinc-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block font-bold">Ingresos Recurrentes</span>
                  <span className="text-lg font-black text-emerald-400">${totalRevenue.toLocaleString('es-CL')} CLP</span>
                </div>
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-bold">Clubes Activos</span>
                    <span className="text-lg font-black text-white">{adminLicenses.filter(l => l.status === 'active').length}</span>
                  </div>
                  <button
                    onClick={() => setShowNewUserModal(true)}
                    className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
                  >
                    <Plus className="w-4 h-4" /> Nuevo
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {adminLicenses.map((lic) => {
                  const isExpired = new Date(lic.expiry) < new Date();
                  return (
                    <div key={lic.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-bold text-xs text-white truncate">{lic.coach}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-amber-400 font-mono font-bold border border-zinc-700">
                            {lic.code}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate">{lic.club} • {lic.plan}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-bold flex items-center gap-1 ${isExpired ? 'text-red-400' : 'text-zinc-400'}`}>
                            <Calendar className="w-3 h-3" /> Vence: {lic.expiry}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-bold">({lic.seats} Equipos)</span>
                          {isExpired && (
                            <span className="text-[8px] bg-red-950 text-red-400 px-1 rounded border border-red-800 font-bold">
                              Vencido
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setAdminLicenses(adminLicenses.map(l => l.id === lic.id ? { ...l, status: l.status === 'active' ? 'suspended' : 'active' } : l))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${lic.status === 'active' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}
                        >
                          {lic.status === 'active' ? 'Suspender' : 'Reactivar'}
                        </button>
                        <button
                          onClick={() => handleDeleteLicense(lic.id)}
                          className="p-1 text-zinc-600 hover:text-red-400 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 7. MODAL CREAR NUEVO USUARIO */}
        {showNewUserModal && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
                <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-red-500" /> Crear Nuevo Acceso
                </h3>
                <button onClick={() => setShowNewUserModal(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={applySevenDaysTrial}
                className="w-full mb-3 py-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Gift className="w-4 h-4" /> Asignar 7 Días de Prueba Gratis
              </button>

              <form onSubmit={handleCreateNewUser} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Nombre del Profesor / DT</label>
                  <input
                    type="text"
                    value={newCoachName}
                    onChange={(e) => setNewCoachName(e.target.value)}
                    placeholder="Ej. DT Juan Arriagada"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Club o Escuela</label>
                  <input
                    type="text"
                    value={newCoachClub}
                    onChange={(e) => setNewCoachClub(e.target.value)}
                    placeholder="Ej. Cd Porvenir"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Plan Contratado</label>
                  <select
                    value={newCoachPlan}
                    onChange={(e) => setNewCoachPlan(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="DT Personal (2 Equipos: Móvil + PC) - \$15.000">
                      DT Personal (2 Equipos: Móvil + PC) - \$15.000
                    </option>
                    <option value="Escuela / Club (5 Equipos: 4 Móviles + 1 PC) - \$35.000">
                      Escuela / Club (5 Equipos: 4 Móviles + 1 PC) - \$35.000
                    </option>
                    <option value="Prueba Gratuita (7 Días - 2 Equipos)">
                      Prueba Gratuita (7 Días - 2 Equipos) - \$0
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Fecha de Vencimiento de Acceso</label>
                  <input
                    type="date"
                    value={newCoachExpiry}
                    onChange={(e) => setNewCoachExpiry(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 font-bold text-xs uppercase tracking-wider rounded-xl text-white shadow-lg transition mt-2"
                >
                  Generar Clave y Guardar
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 8. MENÚ FLOTANTE DE MATERIALES */}
        {showTrainingMenu && (
          <aside className="absolute right-2 top-2 bg-black/90 backdrop-blur-md border border-zinc-800 p-3 rounded-2xl flex flex-col gap-2 shadow-2xl z-40 max-h-[82vh] overflow-y-auto w-44">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-1">
              <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">Materiales</span>
              <button onClick={() => setShowTrainingMenu(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <button onClick={() => addElement('mini_goal')} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-amber-400 font-bold">🥅</span> Mini Portería
            </button>
            <button onClick={() => addElement('ladder')} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-amber-400 font-bold">🪜</span> Escalera
            </button>
            <button onClick={() => addElement('dummy')} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-amber-400 font-bold">🧍</span> Maniquí Barrera
            </button>
            <button onClick={() => addElement('hurdle')} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-amber-400 font-bold">🚧</span> Valla de Salto
            </button>
            <button onClick={() => addElement('cone', { color: '#ea580c' })} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-orange-500 font-bold">▲</span> Cono Naranja
            </button>
            <button onClick={() => addElement('cone', { color: '#2563eb' })} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-blue-500 font-bold">▲</span> Cono Azul
            </button>
            <button onClick={() => addElement('cone', { color: '#eab308' })} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-yellow-400 font-bold">▲</span> Cono Amarillo
            </button>
            <button onClick={() => addElement('saucer', { color: '#facc15' })} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-yellow-300 font-bold">🟡</span> Plato Chino
            </button>
            <button onClick={() => addElement('ring', { color: '#38bdf8' })} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg text-xs text-white">
              <span className="text-sky-400 font-bold">⭕</span> Aro de Salto
            </button>
          </aside>
        )}

        {/* 9. MODAL SISTEMAS */}
        {showSystemsMenu && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xs p-4 shadow-2xl">
              <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
                <h3 className="font-black text-sm text-white">Sistemas Tácticos</h3>
                <button onClick={() => setShowSystemsMenu(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {Object.keys(GET_TACTICAL_SYSTEMS(isPC)).map((sysKey) => (
                  <button
                    key={sysKey}
                    onClick={() => applyTacticalSystem(sysKey)}
                    className="flex items-center justify-between p-2.5 bg-zinc-900 hover:bg-red-600 rounded-xl text-xs font-bold text-white transition"
                  >
                    <span>Formación {sysKey}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 10. MODAL TRAZOS */}
        {showLineMenu && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xs p-4 shadow-2xl">
              <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
                <h3 className="font-black text-sm text-white">Tipo de Línea</h3>
                <button onClick={() => setShowLineMenu(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => { setTool('draw'); setShowLineMenu(false); }}
                className="w-full py-2 bg-red-600 hover:bg-red-500 font-bold text-xs uppercase tracking-wider rounded-xl text-white mb-3 shadow"
              >
                Activar Trazo Seleccionado
              </button>

              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Estilo de Línea</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setLineType('arrow')}
                  className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-2 ${lineType === 'arrow' ? 'border-amber-400 bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-400'}`}
                >
                  <span className="font-black text-sm">→</span> Pase Directo
                </button>
                <button
                  onClick={() => setLineType('dashed-arrow')}
                  className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-2 ${lineType === 'dashed-arrow' ? 'border-amber-400 bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-400'}`}
                >
                  <span className="font-black text-sm">⇢</span> Desmarque
                </button>
                <button
                  onClick={() => setLineType('wavy-arrow')}
                  className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-2 ${lineType === 'wavy-arrow' ? 'border-amber-400 bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-400'}`}
                >
                  <span className="font-black text-sm">∿></span> Conducción
                </button>
                <button
                  onClick={() => setLineType('stop')}
                  className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-2 ${lineType === 'stop' ? 'border-amber-400 bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-400'}`}
                >
                  <span className="font-black text-sm">—|</span> Bloqueo
                </button>
              </div>

              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Color</label>
              <div className="flex items-center justify-between mb-3 bg-zinc-900 p-2 rounded-xl">
                {['#ffffff', '#ef4444', '#3b82f6', '#facc15'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setLineColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-7 h-7 rounded-full border-2 transition ${lineColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                  />
                ))}
              </div>

              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Grosor</label>
              <div className="flex items-center justify-between bg-zinc-900 p-2 rounded-xl">
                {[0.8, 1.4, 2.0, 2.8].map((w) => (
                  <button
                    key={w}
                    onClick={() => setLineWidth(w)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg ${lineWidth === w ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'}`}
                  >
                    {w === 0.8 ? 'Fino' : w === 1.4 ? 'Medio' : w === 2.0 ? 'Grueso' : 'Extra'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 11. PIE INFERIOR */}
      <footer className="bg-black px-4 py-2 flex items-center justify-between shrink-0 z-30 border-t border-zinc-900 shadow-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-1.5 text-zinc-300 hover:text-white disabled:opacity-30 active:scale-95 transition"
            title="Deshacer"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 text-zinc-300 hover:text-white disabled:opacity-30 active:scale-95 transition"
            title="Rehacer"
          >
            <Redo2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => addElement('player', { team: 'blue' })}
            className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center font-black text-white text-xs shadow-lg active:scale-95 transition"
            title="Agregar Jugador Azul"
          >
            11
          </button>

          <button
            onClick={() => addElement('player', { team: 'red' })}
            className="w-9 h-9 rounded-full bg-red-600 border-2 border-white flex items-center justify-center font-black text-white text-xs shadow-lg active:scale-95 transition"
            title="Agregar Jugador Rojo"
          >
            11
          </button>

          <button
            onClick={() => addElement('ball')}
            className="w-9 h-9 rounded-full bg-white border border-zinc-800 flex items-center justify-center text-sm shadow-lg active:scale-95 transition"
            title="Agregar Balón"
          >
            ⚽
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTool(tool === 'eraser' ? 'move' : 'eraser')}
            className={`p-1.5 rounded active:scale-95 transition ${tool === 'eraser' ? 'bg-red-600 text-white animate-pulse' : 'text-zinc-400 hover:text-red-400'}`}
            title="Goma de Borrar: Toca cualquier elemento, línea o nombre para borrarlo"
          >
            <Eraser className="w-5 h-5" />
          </button>

          <button
            onClick={removeLastLineOrAll}
            onDoubleClick={() => setDrawings([])}
            className="p-1.5 text-zinc-400 hover:text-amber-400 active:scale-95 transition"
            title="Borrar última línea (Doble clic borra todas)"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowLineMenu(true)}
            className={`p-1.5 rounded active:scale-95 transition ${tool === 'draw' ? 'bg-amber-500 text-black' : 'text-zinc-300 hover:text-white'}`}
            title="Herramienta de Trazo"
          >
            <PenTool className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
