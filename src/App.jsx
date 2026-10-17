import React, { useState, useRef, useEffect } from 'react';
import {
  Folder, Play, RotateCcw, Save, Undo2, Redo2, Trash2, PenTool, X,
  Eraser, Lock, Plus, AlertTriangle, RotateCw, LogOut, MessageCircle,
  Upload, Printer, Edit2, Video, Square, Download, Sparkles, Gift,
 CheckCircle2, Clock, Users, DollarSign, Type, Shield, Image as ImageIcon
} from 'lucide-react';

// CREDENCIALES SUPABASE
const SB_URL = import.meta.env.VITE_SUPABASE_URL || 'https://btpzlnatmnmtmzdygcge.supabase.co';
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_r0tfzyI2VCIHLHJb5H6kNw_x4euzZSg';

async function sbGet(key) {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/app_data?key=eq.${encodeURIComponent(key)}&select=value`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    });
    const d = await res.json();
    return d && d.length > 0 ? d[0].value : null;
  } catch (e) {
    return null;
  }
}

async function sbSet(key, value) {
  try {
    await fetch(`${SB_URL}/rest/v1/app_data`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ key, value, updated_at: new Date().toISOString() })
    });
  } catch (e) {}
}

const DEFAULT_CATEGORIES = [
  { id: 'sub10', name: 'Sub-8 a Sub-10 (Iniciación)' },
  { id: 'sub14', name: 'Sub-12 a Sub-14 (Formación)' },
  { id: 'sub18', name: 'Sub-16 a Juvenil (Especialización)' },
  { id: 'senior', name: 'Adulto / Senior (Rendimiento)' },
];

const DEFAULT_PLANS = [
  { id: 'p-trial', name: 'Prueba Gratuita (7 Días)', seats: 2, price: 0 },
  { id: 'p-ind', name: 'Plan Individual (2 Dispositivos)', seats: 2, price: 15000 },
  { id: 'p-silver', name: 'Plan Plata (4 Dispositivos)', seats: 4, price: 25000 },
  { id: 'p-gold', name: 'Plan Oro (6 Dispositivos)', seats: 6, price: 35000 }
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
  }  else if (obj.type === 'pole') {
    body = (
      <>
        <ellipse cx="0" cy="4.2" rx="1.8" ry="0.6" fill="rgba(0,0,0,0.35)" />
        <rect x="-0.4" y="-7.5" width="0.8" height="11.5" rx="0.3" fill={obj.color || '#facc15'} stroke="#ca8a04" strokeWidth="0.2" />
        <circle cx="0" cy="-7.5" r="0.8" fill="#ef4444" />
      </>
    );
  }

  return (
    <g transform={`translate(${obj.x}, ${obj.y}) rotate(${rot})`} onPointerDown={onPointerDown} onDoubleClick={onDoubleClick} className="cursor-grab active:cursor-grabbing touch-none select-none">
      {body}
    </g>
  );
}

function WhatsAppButton({ phone, label = '', name = '', customMessage = '' }) {
  if (!phone) return <span className="text-[10px] text-zinc-600 italic">Sin WhatsApp</span>;
  const num = phone.replace(/[^0-9]/g, '');
  const finalNum = num.startsWith('56') ? num : `56${num}`;
  const defMsg = `Hola ${name || ''}, te contacto desde Andez Sports FC.`;
  const msg = encodeURIComponent(customMessage || defMsg);
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

  const [deviceId] = useState(() => {
    let id = localStorage.getItem('andez_device_id');
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem('andez_device_id', id);
    }
    return id;
  });

  const [customPlans, setCustomPlans] = useState(() => {
    const p = localStorage.getItem('andez_custom_plans');
    return p ? JSON.parse(p) : DEFAULT_PLANS;
  });
  useEffect(() => {
    localStorage.setItem('andez_custom_plans', JSON.stringify(customPlans));
    sbSet('andez_custom_plans', customPlans);
  }, [customPlans]);

  const [adminLicenses, setAdminLicenses] = useState(() => {
    const l = localStorage.getItem('andez_licenses');
    return l ? JSON.parse(l) : [
      { id: 'lic-1', coach: 'Prof. Carlos Morales', club: 'Escuela Los Andes', code: 'AND-7821', seats: 4, devices: [], status: 'active', plan: 'Plan Plata (4 Dispositivos)', price: 25000, expiry: '2026-11-15' },
      { id: 'lic-2', coach: 'DT Matías Soto', club: 'Academia Biobío', code: 'AND-4412', seats: 2, devices: [], status: 'active', plan: 'Plan Individual (2 Dispositivos)', price: 15000, expiry: '2026-11-10' }
    ];
  });

  useEffect(() => {
    sbGet('andez_licenses').then(data => {
      if (data && Array.isArray(data)) setAdminLicenses(data);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('andez_licenses', JSON.stringify(adminLicenses));
    sbSet('andez_licenses', adminLicenses);
  }, [adminLicenses]);

  const [authenticatedUser, setAuthenticatedUser] = useState(() => {
    const s = localStorage.getItem('andez_auth_session');
    return s ? JSON.parse(s) : null;
  });

  const [categories, setCategories] = useState(() => {
    const c = localStorage.getItem('andez_dynamic_categories');
    return c ? JSON.parse(c) : DEFAULT_CATEGORIES;
  });
  useEffect(() => {
    localStorage.setItem('andez_dynamic_categories', JSON.stringify(categories));
    sbSet('andez_dynamic_categories', categories);
  }, [categories]);

  const [coachesList, setCoachesList] = useState(() => {
    const c = localStorage.getItem('andez_coaches_staff');
    return c ? JSON.parse(c) : [
      { id: 'c1', name: 'Prof. Carlos Morales', role: 'DT Principal', categoryId: 'sub10', phone: '+56932100183', code: 'DT-101' }
    ];
  });
  useEffect(() => {
    localStorage.setItem('andez_coaches_staff', JSON.stringify(coachesList));
    sbSet('andez_coaches_staff', coachesList);
  }, [coachesList]);

  const [rosters, setRosters] = useState(() => {
    const r = localStorage.getItem('andez_category_rosters');
    return r ? JSON.parse(r) : {
      sub10: [{ id: 'p1', name: 'Lucas Valenzuela', rut: '24.123.456-7', birth: '2016-04-12', role: 'Delantero', phone: '+56932100183', paid: true }],
      sub14: [{ id: 'p3', name: 'Martín Sepúlveda', rut: '22.345.678-9', birth: '2012-02-14', role: 'Portero', phone: '+56932100183', paid: false }],
      sub18: [], senior: []
    };
  });
  useEffect(() => {
    localStorage.setItem('andez_category_rosters', JSON.stringify(rosters));
    sbSet('andez_category_rosters', rosters);
  }, [rosters]);

  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    const a = localStorage.getItem('andez_attendance_records');
    return a ? JSON.parse(a) : {};
  });
  useEffect(() => {
    localStorage.setItem('andez_attendance_records', JSON.stringify(attendanceRecords));
    sbSet('andez_attendance_records', attendanceRecords);
  }, [attendanceRecords]);

  const [billingDay, setBillingDay] = useState(() => localStorage.getItem('andez_billing_day') || '5');
  const [billingMessageTemplate, setBillingMessageTemplate] = useState(() => localStorage.getItem('andez_billing_template') || 'Estimado(a) apoderado(a) de {ALUMNO}, le recordamos desde Andez Sports FC que la mensualidad correspondiente al mes en curso se encuentra pendiente. Agradecemos regularizar el pago.');

  const [inputLicenseCode, setInputLicenseCode] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleClientLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const code = inputLicenseCode.trim().toUpperCase();

    if (code === 'ANDEZ2026') {
      const u = { role: 'owner', name: 'Administrador Maestro', club: 'Andez Sports FC Principal' };
      setAuthenticatedUser(u);
      localStorage.setItem('andez_auth_session', JSON.stringify(u));
      return;
    }

    const coachUser = coachesList.find(c => c.code && c.code.toUpperCase() === code);
    if (coachUser) {
      const u = { role: 'coach', name: coachUser.name, categoryId: coachUser.categoryId, club: 'Escuela de Fútbol' };
      setAuthenticatedUser(u);
      localStorage.setItem('andez_auth_session', JSON.stringify(u));
      return;
    }

    const cloudLic = await sbGet('andez_licenses');
    const currentLics = cloudLic && Array.isArray(cloudLic) ? cloudLic : adminLicenses;
    const found = currentLics.find(l => l.code.toUpperCase() === code);

    if (!found) {
      setLoginError('Código de activación no válido.');
      return;
    }
    if (found.status === 'suspended') {
      setLoginError('Suscripción suspendida. Contacta a soporte.');
      return;
    }

    const activeDevices = found.devices || [];
    if (!activeDevices.includes(deviceId)) {
      if (activeDevices.length >= (found.seats || 2)) {
        setLoginError(`Límite de dispositivos alcanzado (${found.seats} máx). Cierra sesión en otro equipo.`);
        return;
      }
      found.devices = [...activeDevices, deviceId];
      const updated = currentLics.map(l => l.id === found.id ? found : l);
      setAdminLicenses(updated);
      sbSet('andez_licenses', updated);
    }

    const dirUser = { role: 'director', ...found };
    setAuthenticatedUser(dirUser);
    localStorage.setItem('andez_auth_session', JSON.stringify(dirUser));
  };

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión en este equipo?')) {
      if (authenticatedUser && authenticatedUser.role === 'director' && authenticatedUser.id) {
        const updated = adminLicenses.map(l => {
          if (l.id === authenticatedUser.id) {
            return { ...l, devices: (l.devices || []).filter(d => d !== deviceId) };
          }
          return l;
        });
        setAdminLicenses(updated);
        sbSet('andez_licenses', updated);
      }
      setAuthenticatedUser(null);
      localStorage.removeItem('andez_auth_session');
    }
  };

  // ESTADOS DE LA PIZARRA
  const [pitchMode, setPitchMode] = useState('full');
  const [showTrainingMenu, setShowTrainingMenu] = useState(false);
  const [showSystemsMenu, setShowSystemsMenu] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [activeTabLibrary, setActiveTabLibrary] = useState('sessions');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newCoachName, setNewCoachName] = useState('');
  const [newCoachClub, setNewCoachClub] = useState('');
  const [newCoachPlan, setNewCoachPlan] = useState('p-silver');
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

  // NÓMINAS Y GESTIÓN
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');

  const [newCoachStaffName, setNewCoachStaffName] = useState('');
  const [newCoachStaffRole, setNewCoachStaffRole] = useState('Director Técnico');
  const [newCoachStaffCategory, setNewCoachStaffCategory] = useState(categories[0]?.id || 'sub10');
  const [newCoachStaffPhone, setNewCoachStaffPhone] = useState('+569');
  const [newCoachStaffCode, setNewCoachStaffCode] = useState('');

  const [newRosterName, setNewRosterName] = useState('');
  const [newRosterRut, setNewRosterRut] = useState('');
  const [newRosterBirth, setNewRosterBirth] = useState('');
  const [newRosterRole, setNewRosterRole] = useState('Delantero');
  const [newRosterPhone, setNewRosterPhone] = useState('+569');
  const [newRosterBlood, setNewRosterBlood] = useState('O+');
  const [newRosterAllergies, setNewRosterAllergies] = useState('');
  const [newRosterEmergencyPhone, setNewRosterEmergencyPhone] = useState('+569');
  const [editingStudent, setEditingStudent] = useState(null);
  const [schoolMonthlyFee, setSchoolMonthlyFee] = useState(() => localStorage.getItem('andez_monthly_fee') || '25000');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);

  // SESIONES
  const [drillTitle, setDrillTitle] = useState('Salida y Progresión');
  const [drillCategory, setDrillCategory] = useState(categories[0]?.id || 'sub14');
  const [drillNotes, setDrillNotes] = useState('Transición rápida a 2 toques.');
  const [showSaveModal, setShowSaveModal] = useState(false);
 const [savedDrills, setSavedDrills] = useState(() => {
    const d = localStorage.getItem('andez_saved_drills');
    return d ? JSON.parse(d) : [];
  });

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 1. PRIMERO DESCARGA DESDE SUPABASE
  useEffect(() => {
    async function hydrateFromCloud() {
      try {
        const [cloudPlans, cloudLics, cloudCats, cloudCoaches, cloudRosters, cloudAtt, cloudDrills] = await Promise.all([
          sbGet('andez_custom_plans'),
          sbGet('andez_licenses'),
          sbGet('andez_dynamic_categories'),
          sbGet('andez_coaches_staff'),
          sbGet('andez_category_rosters'),
          sbGet('andez_attendance_records'),
          sbGet('andez_saved_drills')
        ]);

        if (cloudPlans && Array.isArray(cloudPlans)) setCustomPlans(cloudPlans);
        if (cloudLics && Array.isArray(cloudLics)) setAdminLicenses(cloudLics);
        if (cloudCats && Array.isArray(cloudCats)) setCategories(cloudCats);
        if (cloudCoaches && Array.isArray(cloudCoaches)) setCoachesList(cloudCoaches);
        if (cloudRosters && typeof cloudRosters === 'object') setRosters(cloudRosters);
        if (cloudAtt && typeof cloudAtt === 'object') setAttendanceRecords(cloudAtt);
        if (cloudDrills && Array.isArray(cloudDrills)) setSavedDrills(cloudDrills);
      } catch (err) {
        console.error('Error al sincronizar con Supabase:', err);
      } finally {
        setIsDataLoaded(true);
      }
    }
    hydrateFromCloud();
  }, []);

  // 2. SOLO GUARDA EN LA NUBE SI YA SE CARGARON LOS DATOS PREVIOS
  useEffect(() => {
    if (!isDataLoaded) return;
    localStorage.setItem('andez_saved_drills', JSON.stringify(savedDrills));
    sbSet('andez_saved_drills', savedDrills);
  }, [savedDrills, isDataLoaded]);

  const [editingPlayer, setEditingPlayer] = useState(null);
  const [playerCustomName, setPlayerCustomName] = useState('');
  const [playerCustomNumber, setPlayerCustomNumber] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // HERRAMIENTAS DE DIBUJO Y TEXTO
  const [tool, setTool] = useState('move');
  const [lineType, setLineType] = useState('arrow');
  const [lineColor, setLineColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(1.4);
  const [showLinePalette, setShowLinePalette] = useState(false);

  const [textBlocks, setTextBlocks] = useState([]);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [pendingTextPos, setPendingTextPos] = useState({ x: 50, y: 50 });
  const [inputTextVal, setInputTextVal] = useState('');

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
// FUNCIÓN PARA DESCARGAR LA PIZARRA COMO FOTO PNG
  const exportBoardAsImage = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URLObject = window.URL || window.webkitURL || window;
    const blobURL = URLObject.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = isPC ? 1920 : 1080;
      canvas.height = isPC ? 1080 : 1920;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      
      const pngURL = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngURL;
      downloadLink.download = `pizarra-${drillTitle.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URLObject.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };
  // VIDEO & IA PROMPT
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
    return { x: Math.max(1, Math.min(maxX - 1, c.x)), y: Math.max(1, Math.min(maxY - 1, c.y)) };
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
    const c = getCoordinates(e);
    if (tool === 'text') {
      setPendingTextPos(c);
      setInputTextVal('');
      setTextModalOpen(true);
      return;
    }
    if (tool === 'move' || tool === 'eraser') {
      setSelectedObj(null); setSelectedMaterial(null); return;
    }
    setCurrentLine({ id: Date.now(), start: c, end: c, type: lineType, color: lineColor, width: lineWidth });
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

  // PANTALLA DE INGRESO
  if (!authenticatedUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-[#070b12] text-white p-4 font-sans select-none relative">
        <div className="w-full max-w-md bg-zinc-950/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
          <img src={currentDisplayLogo} alt="Logo" className="w-16 h-16 rounded-2xl mb-4 border border-amber-400 object-cover" />
          <h1 className="text-2xl font-black text-white mb-1">ANDEZ SPORTS FC <span className="text-amber-400">PRO</span></h1>
          <p className="text-xs text-zinc-400 mb-4">Ingreso de Director Técnico, Profesor o Administrador</p>
          <form onSubmit={handleClientLogin} className="w-full space-y-3 my-2">
            <input type="text" value={inputLicenseCode} onChange={e => setInputLicenseCode(e.target.value)} placeholder="Código (ej. ANDEZ2026 / AND-7821)" className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 text-sm text-center font-mono font-bold text-white uppercase focus:border-red-500 outline-none" required />
            {loginError && <p className="text-xs text-red-400 font-bold bg-red-950/50 p-2 rounded-xl border border-red-800">{loginError}</p>}
            <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase rounded-2xl shadow">Ingresar al Sistema</button>
          </form>
          <a href="https://wa.me/56932100183?text=Hola%20Andez%20Sports%20FC,%20solicito%20acceso" target="_blank" rel="noopener noreferrer" className="w-full mt-3 py-3 bg-zinc-900 border border-zinc-800 hover:border-emerald-500 rounded-2xl text-xs font-bold text-zinc-300 flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-400" /> Soporte Oficial (+56932100183)
          </a>
        </div>
      </div>
    );
  }

  const isTeacherRestricted = authenticatedUser.role === 'coach';
  const currentCategoryContext = isTeacherRestricted ? authenticatedUser.categoryId : (selectedCategoryFilter === 'all' ? (categories[0]?.id || 'sub10') : selectedCategoryFilter);

  return (
    <div className="flex flex-col h-screen w-screen bg-black overflow-hidden select-none font-sans print:bg-white print:text-black">
      {/* HEADER */}
      <header className="bg-black px-3 py-1.5 flex items-center justify-between shrink-0 z-30 border-b border-zinc-900 no-print">
        <div className="flex items-center gap-2 sm:gap-3">
          {isPC ? (
            <label htmlFor="logo-up" className="cursor-pointer" title="Cambiar Logo Club">
              <img src={currentDisplayLogo} alt="Logo" className="w-8 h-8 rounded-full border-2 border-amber-400 object-cover" />
              <input id="logo-up" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          ) : (
            <img src={currentDisplayLogo} alt="Logo" className="w-8 h-8 rounded-full border-2 border-amber-400 object-cover" />
          )}

          <button onClick={() => setShowLibraryModal(true)} className="text-zinc-300 hover:text-amber-400" title="Biblioteca y Gestión"><Folder className="w-5 h-5" /></button>
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

          {authenticatedUser.role === 'owner' ? (
            <button onClick={() => setShowAdminDashboard(true)} className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded-full text-[10px] font-black text-amber-400 uppercase tracking-wider">
              <span>Super Admin</span> <Lock className="w-3 h-3 text-zinc-400" />
            </button>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full text-[10px] font-bold text-zinc-300 max-w-[120px] truncate">
              {authenticatedUser.role === 'director' ? `Director: ${authenticatedUser.club}` : `Prof: ${authenticatedUser.name}`}
            </div>
          )}

          <button onClick={handleLogout} className="text-zinc-400 hover:text-red-400"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>
{/* CANCHA CON SOPORTE TÁCTIL TOTAL */}
      <main className="flex-1 w-full h-full flex items-center justify-center p-0 overflow-hidden touch-none relative bg-[#1e881b]" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        <svg ref={svgRef} viewBox={isPC ? (pitchMode === 'half' ? "0 0 55 68" : "0 0 105 68") : (pitchMode === 'half' ? "0 0 68 85" : "0 0 68 105")} className="w-full h-full select-none drop-shadow-2xl touch-none" onPointerDown={handlePitchPointerDown}>
          <defs>
            <marker id="arrow-white" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#ffffff" /></marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" /></marker>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" /></marker>
            <marker id="arrow-yellow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#facc15" /></marker>
            <marker id="arrow-black" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#000000" /></marker>
            <marker id="block-mark" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><line x1="5" y1="0" x2="5" y2="10" stroke="#ffffff" strokeWidth="2.5" /></marker>
          </defs>

          <rect width="300" height="300" x="-100" y="-100" fill="#228b22" />

          {/* DIBUJO DE CANCHA, ARCOS Y ÁREAS */}
          {isPC ? (
            <g stroke="white" strokeWidth="0.8" fill="none">
              <rect x="2" y="2" width={pitchMode === 'half' ? 51 : 101} height="64" />
              <line x1={pitchMode === 'half' ? 53 : 52.5} y1="2" x2={pitchMode === 'half' ? 53 : 52.5} y2="66" />
              <circle cx={pitchMode === 'half' ? 53 : 52.5} cy="34" r="9.15" />
              <circle cx={pitchMode === 'half' ? 53 : 52.5} cy="34" r="0.8" fill="white" />
              {/* Lado izquierdo */}
              <rect x="2" y="13.8" width="16.5" height="40.4" />
              <rect x="2" y="24.8" width="5.5" height="18.4" />
              <rect x="-0.8" y="30.3" width="2.8" height="7.32" stroke="#eab308" strokeWidth="0.9" fill="rgba(255,255,255,0.2)" />
              <path d="M 18.5 28 A 9.15 9.15 0 0 1 18.5 40" />
              {/* Lado derecho */}
              {!pitchMode.includes('half') && (
                <>
                  <rect x="86.5" y="13.8" width="16.5" height="40.4" />
                  <rect x="97.5" y="24.8" width="5.5" height="18.4" />
                  <rect x="103" y="30.3" width="2.8" height="7.32" stroke="#eab308" strokeWidth="0.9" fill="rgba(255,255,255,0.2)" />
                  <path d="M 86.5 28 A 9.15 9.15 0 0 0 86.5 40" />
                </>
              )}
            </g>
          ) : (
            <g stroke="white" strokeWidth="0.8" fill="none">
              <rect x="2" y="2" width="64" height={pitchMode === 'half' ? 79 : 101} />
              <line x1="2" y1={pitchMode === 'half' ? 81 : 52.5} x2="66" y2={pitchMode === 'half' ? 81 : 52.5} />
              <circle cx="34" cy={pitchMode === 'half' ? 81 : 52.5} r="9.15" />
              <circle cx="34" cy={pitchMode === 'half' ? 81 : 52.5} r="0.8" fill="white" />
              {/* Portería norte */}
              {!pitchMode.includes('half') && (
                <>
                  <rect x="13.8" y="2" width="40.4" height="16.5" />
                  <rect x="24.8" y="2" width="18.4" height="5.5" />
                  <rect x="30.3" y="-0.8" width="7.32" height="2.8" stroke="#eab308" strokeWidth="0.9" fill="rgba(255,255,255,0.2)" />
                  <path d="M 28 18.5 A 9.15 9.15 0 0 0 40 18.5" />
                </>
              )}
              {/* Portería sur */}
              <rect x="13.8" y={pitchMode === 'half' ? 64.5 : 86.5} width="40.4" height="16.5" />
              <rect x="24.8" y={pitchMode === 'half' ? 75.5 : 97.5} width="18.4" height="5.5" />
              <rect x="30.3" y={pitchMode === 'half' ? 81 : 103} width="7.32" height="2.8" stroke="#eab308" strokeWidth="0.9" fill="rgba(255,255,255,0.2)" />
              <path d={`M 28 ${pitchMode === 'half' ? 64.5 : 86.5} A 9.15 9.15 0 0 1 40 ${pitchMode === 'half' ? 64.5 : 86.5}`} />
            </g>
          )}

          {/* DIBUJOS Y TRAZOS */}
          {drawings.map(l => {
            const markerId = l.type === 'straight' ? '' : (l.type === 'block' ? 'url(#block-mark)' : (l.color === '#ef4444' ? 'url(#arrow-red)' : l.color === '#3b82f6' ? 'url(#arrow-blue)' : l.color === '#facc15' ? 'url(#arrow-yellow)' : l.color === '#000000' ? 'url(#arrow-black)' : 'url(#arrow-white)'));
            return (
              <g key={l.id} onPointerDown={(e) => { if (tool === 'eraser') { e.stopPropagation(); setDrawings(prev => prev.filter(d => d.id !== l.id)); } }}>
                <line x1={l.start.x} y1={l.start.y} x2={l.end.x} y2={l.end.y} stroke={l.color} strokeWidth={l.width || 1.4} strokeDasharray={l.type === 'dashed' ? '3,2' : 'none'} markerEnd={markerId} />
              </g>
            );
          })}

          {currentLine && (
            <line x1={currentLine.start.x} y1={currentLine.start.y} x2={currentLine.end.x} y2={currentLine.end.y} stroke={currentLine.color} strokeWidth={currentLine.width || 1.4} strokeDasharray={currentLine.type === 'dashed' ? '3,2' : 'none'} />
          )}

          {/* TEXTOS LIBRES */}
          {textBlocks.map(tb => (
            <g key={tb.id} transform={`translate(${tb.x}, ${tb.y})`} onPointerDown={(e) => { if (tool === 'eraser') { e.stopPropagation(); setTextBlocks(textBlocks.filter(t => t.id !== tb.id)); } }} className="cursor-pointer select-none">
              <rect x="-2" y="-3.5" width={tb.text.length * 2.2 + 5} height="6.5" rx="1.5" fill="rgba(0,0,0,0.85)" stroke="#eab308" strokeWidth="0.3" />
              <text x="1" y="0.8" fill="#ffffff" fontSize="2.8" fontWeight="bold">{tb.text}</text>
            </g>
          ))}

          {/* OBJETOS Y JUGADORES */}
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

        {/* MODAL AGREGAR TEXTO LIBRE */}
        {textModalOpen && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-[#121214] border border-zinc-800 rounded-3xl w-full max-w-xs p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5"><Type className="w-4 h-4 text-amber-400" /> Insertar Nota Táctica</h3>
                <button onClick={() => setTextModalOpen(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <input type="text" value={inputTextVal} onChange={e => setInputTextVal(e.target.value)} placeholder="Ej: Máximo 2 toques / Salida rápida" className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-2 text-xs text-white outline-none focus:border-amber-400 mb-3" autoFocus />
              <button onClick={() => {
                if (inputTextVal.trim()) {
                  setTextBlocks([...textBlocks, { id: 'txt-' + Date.now(), x: pendingTextPos.x, y: pendingTextPos.y, text: inputTextVal.trim() }]);
                }
                setTextModalOpen(false);
                setTool('move');
              }} className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-2xl shadow">Agregar a la Pizarra</button>
            </div>
          </div>
        )}

        {/* MODAL PALETA DE TRAZOS Y LÍNEAS AVANZADA */}
        {showLinePalette && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-white">Selector de Trazos y Líneas</h3>
                <button onClick={() => setShowLinePalette(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <span className="text-[10px] font-bold text-zinc-400 block mb-2">TIPO DE LÍNEA</span>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button onClick={() => setLineType('arrow')} className={`p-2.5 rounded-xl border text-xs font-bold text-white flex items-center justify-center gap-2 ${lineType === 'arrow' ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900 border-zinc-800'}`}>
                  <span>➜</span> Flecha Normal
                </button>
                <button onClick={() => setLineType('straight')} className={`p-2.5 rounded-xl border text-xs font-bold text-white flex items-center justify-center gap-2 ${lineType === 'straight' ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900 border-zinc-800'}`}>
                  <span>━</span> Línea Recta
                </button>
                <button onClick={() => setLineType('dashed')} className={`p-2.5 rounded-xl border text-xs font-bold text-white flex items-center justify-center gap-2 ${lineType === 'dashed' ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900 border-zinc-800'}`}>
                  <span>⤏</span> Flecha Discontinua
                </button>
                <button onClick={() => setLineType('block')} className={`p-2.5 rounded-xl border text-xs font-bold text-white flex items-center justify-center gap-2 ${lineType === 'block' ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900 border-zinc-800'}`}>
                  <span>⊣</span> Bloqueo en T
                </button>
              </div>

              <span className="text-[10px] font-bold text-zinc-400 block mb-2">COLOR DEL TRAZO</span>
              <div className="flex gap-3 mb-4">
                {['#ffffff', '#ef4444', '#3b82f6', '#facc15', '#000000'].map(c => (
                  <button key={c} onClick={() => setLineColor(c)} style={{ backgroundColor: c }} className={`w-8 h-8 rounded-full border-2 ${lineColor === c ? 'border-amber-400 scale-110 shadow-lg' : 'border-zinc-700'}`} />
                ))}
              </div>

              <span className="text-[10px] font-bold text-zinc-400 block mb-2">GROSOR</span>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: 'Fino', val: 0.8 },
                  { label: 'Medio', val: 1.4 },
                  { label: 'Grueso', val: 2.2 },
                  { label: 'Extra', val: 3.2 }
                ].map(g => (
                  <button key={g.val} onClick={() => setLineWidth(g.val)} className={`py-1.5 rounded-lg text-xs font-bold border ${lineWidth === g.val ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900 text-zinc-300 border-zinc-800'}`}>
                    {g.label}
                  </button>
                ))}
              </div>

              <button onClick={() => { setTool('draw'); setShowLinePalette(false); }} className="w-full py-2.5 bg-red-600 hover:bg-red-500 font-bold text-xs uppercase text-white rounded-xl shadow">Aplicar a la Pizarra</button>
            </div>
          </div>
        )}

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
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1">NOMBRE O ROL</label>
                  <input type="text" value={playerCustomName} onChange={e => setPlayerCustomName(e.target.value)} placeholder="Ej. Central" className="w-full bg-[#1c1c1f] border border-zinc-800 rounded-2xl px-4 py-2 text-xs text-white outline-none focus:border-red-500" autoFocus />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1">DORSAL</label>
                  <input type="text" value={playerCustomNumber} onChange={e => setPlayerCustomNumber(e.target.value)} placeholder="4" className="w-full bg-[#1c1c1f] border border-zinc-800 rounded-2xl px-4 py-2 text-xs text-white outline-none focus:border-red-500" required />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => {
                    const u = objects.map(o => o.id === editingPlayer.id ? { ...o, name: '' } : o);
                    setObjects(u); recordHistory(u); setEditingPlayer(null);
                  }} className="flex-1 py-3 bg-[#242428] text-red-400 font-bold text-xs rounded-2xl">Borrar Nombre</button>
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
                <textarea rows={3} value={promptText} onChange={e => setPromptText(e.target.value)} placeholder="Ej: Rondo 4v2 con conos y balón..." className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400 resize-none" autoFocus />
                <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-xl shadow">Crear en la Pizarra</button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL VIDEO */}
        {recordedVideoUrl && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md p-5 shadow-2xl flex flex-col items-center">
              <div className="w-full flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5"><Video className="w-4 h-4 text-red-500" /> Video Grabado</h3>
                <button onClick={() => setRecordedVideoUrl(null)} className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <video src={recordedVideoUrl} controls autoPlay className="w-full rounded-2xl mb-4 border border-zinc-800 max-h-60" />
              <div className="w-full flex gap-2">
                <a href={recordedVideoUrl} download={`ejercicio-${drillTitle.replace(/\s+/g, '_')}.webm`} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 shadow">
                  <Download className="w-4 h-4" /> Descargar
                </a>
              </div>
            </div>
          </div>
        )}

        {/* MENÚ DE MATERIALES */}
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
            <button onClick={() => addElement('saucer', { color: '#facc15' })} className="p-1.5 text-left hover:bg-zinc-800 rounded text-xs text-white">🟡 Plato Chino</button>
            <button onClick={() => addElement('ring', { color: '#38bdf8' })} className="p-1.5 text-left hover:bg-zinc-800 rounded text-xs text-white">⭕ Aro de Salto</button> 
            <button onClick={() => addElement('pole', { color: '#facc15' })} className="p-1.5 text-left hover:bg-zinc-800 rounded text-xs text-white">🦯 Bastón / Estaca Slalom</button>
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

        {/* MODAL GESTIÓN: SESIONES, ALUMNOS, ASISTENCIA, PAGOS Y PROFESORES */}
        {showLibraryModal && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-4 z-50 no-print">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl p-5 shadow-2xl flex flex-col max-h-[92vh]">
              <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={() => setActiveTabLibrary('sessions')} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${activeTabLibrary === 'sessions' ? 'bg-red-600 text-white' : 'text-zinc-400'}`}>📁 Sesiones</button>
                  <button onClick={() => setActiveTabLibrary('roster')} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${activeTabLibrary === 'roster' ? 'bg-red-600 text-white' : 'text-zinc-400'}`}>📋 Alumnos</button>
                  <button onClick={() => setActiveTabLibrary('attendance')} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${activeTabLibrary === 'attendance' ? 'bg-emerald-600 text-white' : 'text-zinc-400'}`}>✅ Asistencia</button>
                  {!isTeacherRestricted && (
                    <>
                      <button onClick={() => setActiveTabLibrary('billing')} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${activeTabLibrary === 'billing' ? 'bg-amber-500 text-black' : 'text-zinc-400'}`}>💰 Mensualidades</button>
                      <button onClick={() => setActiveTabLibrary('coaches')} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${activeTabLibrary === 'coaches' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}>🧑‍🏫 Profesores</button>
                      <button onClick={() => setActiveTabLibrary('categories')} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${activeTabLibrary === 'categories' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}>⚙️ Categorías</button>
                    </>
                  )}
                </div>
                <button onClick={() => setShowLibraryModal(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              {/* SESIONES */}
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

              {/* ALUMNOS */}
              {activeTabLibrary === 'roster' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newRosterName.trim()) return;
                    if (editingStudent) {
                      const updated = (rosters[currentCategoryContext] || []).map(p => 
                        p.id === editingStudent.id 
                          ? { ...p, name: newRosterName.trim(), rut: newRosterRut || 'Sin RUT', birth: newRosterBirth || '2012-01-01', role: newRosterRole, phone: newRosterPhone.trim(), blood: newRosterBlood, allergies: newRosterAllergies.trim(), emergencyPhone: newRosterEmergencyPhone.trim() } 
                          : p
                      );
                      setRosters({ ...rosters, [currentCategoryContext]: updated });
                      setEditingStudent(null);
                    } else {
                      const newP = { 
                        id: 'ros-' + Date.now(), 
                        name: newRosterName.trim(), 
                        rut: newRosterRut || 'Sin RUT', 
                        birth: newRosterBirth || '2012-01-01', 
                        role: newRosterRole, 
                        phone: newRosterPhone.trim() || '+56932100183', 
                        blood: newRosterBlood,
                        allergies: newRosterAllergies.trim(),
                        emergencyPhone: newRosterEmergencyPhone.trim(),
                        paid: false 
                      };
                      setRosters({ ...rosters, [currentCategoryContext]: [...(rosters[currentCategoryContext] || []), newP] });
                    }
                    setNewRosterName(''); setNewRosterRut(''); setNewRosterBirth(''); setNewRosterPhone('+569'); setNewRosterAllergies(''); setNewRosterEmergencyPhone('+569');
                  }} className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl mb-3 shrink-0 space-y-2">
                    <div className="flex justify-between items-center pb-1 border-b border-zinc-800">
                      <span className="text-[11px] font-bold text-amber-400">{editingStudent ? '✏️ Editando Ficha de Alumno' : '➕ Ficha Integral de Alumno (Técnica y Médica)'}</span>
                      {editingStudent && (
                        <button type="button" onClick={() => { setEditingStudent(null); setNewRosterName(''); setNewRosterRut(''); setNewRosterBirth(''); setNewRosterPhone('+569'); setNewRosterAllergies(''); setNewRosterEmergencyPhone('+569'); }} className="text-[10px] text-zinc-400 hover:text-white">Cancelar Edición</button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input type="text" placeholder="Nombre Completo" value={newRosterName} onChange={e => setNewRosterName(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400" required />
                      <input type="text" placeholder="RUT / Pasaporte" value={newRosterRut} onChange={e => setNewRosterRut(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400" />
                      <input type="date" value={newRosterBirth} onChange={e => setNewRosterBirth(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400" />
                      <select value={newRosterRole} onChange={e => setNewRosterRole(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none">
                        <option value="Portero">Portero (GK)</option>
                        <option value="Defensa Central">Defensa Central</option>
                        <option value="Lateral">Lateral</option>
                        <option value="Mediocampista">Mediocampista</option>
                        <option value="Extremo">Extremo</option>
                        <option value="Delantero">Delantero</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input type="tel" placeholder="WhatsApp Alumno/Apoderado" value={newRosterPhone} onChange={e => setNewRosterPhone(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400" required />
                      <select value={newRosterBlood} onChange={e => setNewRosterBlood(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none">
                        <option value="O+">Grupo Sanguíneo: O+</option>
                        <option value="O-">Grupo Sanguíneo: O-</option>
                        <option value="A+">Grupo Sanguíneo: A+</option>
                        <option value="A-">Grupo Sanguíneo: A-</option>
                        <option value="B+">Grupo Sanguíneo: B+</option>
                        <option value="B-">Grupo Sanguíneo: B-</option>
                        <option value="AB+">Grupo Sanguíneo: AB+</option>
                        <option value="AB-">Grupo Sanguíneo: AB-</option>
                      </select>
                      <input type="text" placeholder="Alergias / Ficha Médica" value={newRosterAllergies} onChange={e => setNewRosterAllergies(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400" />
                      <div className="flex gap-1.5">
                        <input type="tel" placeholder="Urgencias SOS" value={newRosterEmergencyPhone} onChange={e => setNewRosterEmergencyPhone(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400" />
                        <button type="submit" className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl px-3 py-1.5 shadow flex items-center justify-center gap-1 shrink-0">
                          {editingStudent ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          <span>{editingStudent ? 'Actualizar' : 'Guardar'}</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="flex-1 overflow-y-auto space-y-2">
                    {(rosters[currentCategoryContext] || []).length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-8">No hay alumnos registrados en esta categoría.</p>
                    ) : (
                      (rosters[currentCategoryContext] || []).map(p => (
                        <div key={p.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-white">{p.name}</span>
                              <span className="text-[10px] bg-zinc-800 text-amber-400 px-2 py-0.5 rounded-full font-semibold">{p.role}</span>
                              {p.blood && <span className="text-[9px] bg-red-950/80 border border-red-800 text-red-300 px-1.5 py-0.2 rounded font-mono font-bold">🩸 {p.blood}</span>}
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">
                              RUT: {p.rut} • Nac: {p.birth} {p.allergies ? `• ⚠️ ${p.allergies}` : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <WhatsAppButton phone={p.phone} name={p.name} label="WhatsApp" />
                            {p.emergencyPhone && p.emergencyPhone !== '+569' && (
                              <WhatsAppButton phone={p.emergencyPhone} name={p.name} label="SOS" customMessage={`URGENCIA: Nos comunicamos desde Andez Sports FC respecto al alumno ${p.name}.`} />
                            )}
                            <button 
                              type="button"
                              onClick={() => {
                                setEditingStudent(p);
                                setNewRosterName(p.name);
                                setNewRosterRut(p.rut || '');
                                setNewRosterBirth(p.birth || '');
                                setNewRosterRole(p.role || 'Delantero');
                                setNewRosterPhone(p.phone || '+569');
                                setNewRosterBlood(p.blood || 'O+');
                                setNewRosterAllergies(p.allergies || '');
                                setNewRosterEmergencyPhone(p.emergencyPhone || '+569');
                              }}
                              className="p-1.5 bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-300 rounded-lg transition"
                              title="Editar Ficha Alumno"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm(`¿Eliminar a ${p.name}?`)) {
                                  setRosters({ ...rosters, [currentCategoryContext]: rosters[currentCategoryContext].filter(x => x.id !== p.id) });
                                }
                              }} 
                              className="p-1.5 text-zinc-500 hover:text-red-400"
                              title="Eliminar Alumno"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              {/* ASISTENCIA */}
              {activeTabLibrary === 'attendance' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-3 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-xs font-bold text-white">Fecha de Entrenamiento:</span>
                    <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white outline-none" />
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {(rosters[currentCategoryContext] || []).map(p => {
                      const attKey = `${currentCategoryContext}_${attendanceDate}`;
                      const currentStatus = attendanceRecords[attKey]?.[p.id] || 'pending';
                      return (
                        <div key={p.id} className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl flex justify-between items-center">
                          <span className="font-bold text-xs text-white">{p.name}</span>
                          <div className="flex gap-1.5">
                            <button onClick={() => {
                              const updated = { ...attendanceRecords, [attKey]: { ...(attendanceRecords[attKey] || {}), [p.id]: 'present' } };
                              setAttendanceRecords(updated);
                            }} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${currentStatus === 'present' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>Presente</button>
                            <button onClick={() => {
                              const updated = { ...attendanceRecords, [attKey]: { ...(attendanceRecords[attKey] || {}), [p.id]: 'absent' } };
                              setAttendanceRecords(updated);
                            }} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${currentStatus === 'absent' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>Ausente</button>
                            <button onClick={() => {
                              const updated = { ...attendanceRecords, [attKey]: { ...(attendanceRecords[attKey] || {}), [p.id]: 'excused' } };
                              setAttendanceRecords(updated);
                            }} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${currentStatus === 'excused' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>Justificado</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* COBRANZA Y MENSUALIDADES (DIRECTOR) */}
              {activeTabLibrary === 'billing' && !isTeacherRestricted && (
                <div className="flex-1 flex flex-col min-h-0">
                 {/* CONFIGURACIÓN Y BALANCE FINANCIERO */}
                  {(() => {
                    const allStudents = Object.values(rosters).flat();
                    const totalStudents = allStudents.length;
                    const paidCount = allStudents.filter(s => s.paid).length;
                    const fee = Number(schoolMonthlyFee) || 0;
                    const totalCollected = paidCount * fee;
                    const totalPending = (totalStudents - paidCount) * fee;

                    return (
                      <div className="space-y-2 mb-3 shrink-0">
                        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-white block">Cuota Mensual Escuela:</span>
                              <span className="text-[10px] text-zinc-400">Valor CLP por alumno</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-zinc-400 font-bold">$</span>
                              <input 
                                type="number" 
                                value={schoolMonthlyFee} 
                                onChange={e => { setSchoolMonthlyFee(e.target.value); localStorage.setItem('andez_monthly_fee', e.target.value); }} 
                                className="w-24 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-right text-emerald-400 font-bold outline-none" 
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-white block">Día de Cobro:</span>
                              <span className="text-[10px] text-zinc-400">Día límite del mes</span>
                            </div>
                            <input 
                              type="number" 
                              min="1" 
                              max="31" 
                              value={billingDay} 
                              onChange={e => { setBillingDay(e.target.value); localStorage.setItem('andez_billing_day', e.target.value); }} 
                              className="w-14 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-center text-white font-bold outline-none" 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-xl">
                            <span className="text-[10px] text-zinc-400 block font-bold">Total Recaudado</span>
                            <span className="text-sm sm:text-base font-black text-emerald-400">${totalCollected.toLocaleString('es-CL')} CLP</span>
                          </div>
                          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-xl">
                            <span className="text-[10px] text-zinc-400 block font-bold">Por Recaudar</span>
                            <span className="text-sm sm:text-base font-black text-amber-400">${totalPending.toLocaleString('es-CL')} CLP</span>
                          </div>
                          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-xl col-span-2 sm:col-span-1">
                            <span className="text-[10px] text-zinc-400 block font-bold">Estado General</span>
                            <span className="text-xs font-bold text-white">{paidCount} al día / {totalStudents - paidCount} morosos</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {Object.entries(rosters).flatMap(([catKey, list]) => (list || []).map(p => ({ ...p, catKey }))).map(p => {
                      const msg = billingMessageTemplate.replace('{ALUMNO}', p.name);
                      return (
                        <div key={p.id} className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl flex justify-between items-center">
                          <div>
                            <div className="font-bold text-xs text-white">{p.name} <span className="text-[10px] text-zinc-400">({categories.find(c => c.id === p.catKey)?.name || p.catKey})</span></div>
                            <div className="text-[10px] flex items-center gap-1.5 mt-0.5">
                              {p.paid ? <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Al Día</span> : <span className="text-red-400 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Pendiente de Pago</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => {
                              const updatedList = rosters[p.catKey].map(x => x.id === p.id ? { ...x, paid: !x.paid } : x);
                              setRosters({ ...rosters, [p.catKey]: updatedList });
                            }} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${p.paid ? 'bg-zinc-800 text-zinc-400' : 'bg-emerald-600 text-white'}`}>
                              {p.paid ? 'Marcar Pendiente' : 'Recibir Pago'}
                            </button>
                            {!p.paid && <WhatsAppButton phone={p.phone} name={p.name} label="Avisar Cobro" customMessage={msg} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PROFESORES */}
              {activeTabLibrary === 'coaches' && !isTeacherRestricted && (
                <div className="flex-1 flex flex-col min-h-0">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newCoachStaffName.trim()) return;
                    const code = newCoachStaffCode.trim() || 'DT-' + Math.floor(100 + Math.random() * 900);
                    setCoachesList([...coachesList, { id: 'c-' + Date.now(), name: newCoachStaffName.trim(), role: newCoachStaffRole.trim(), categoryId: newCoachStaffCategory, phone: newCoachStaffPhone.trim(), code }]);
                    setNewCoachStaffName(''); setNewCoachStaffCode('');
                  }} className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl mb-3 shrink-0 grid grid-cols-1 sm:grid-cols-5 gap-2">
                    <input type="text" placeholder="Nombre Profesor" value={newCoachStaffName} onChange={e => setNewCoachStaffName(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white outline-none" required />
                    <input type="text" placeholder="Cargo (DT, PF)" value={newCoachStaffRole} onChange={e => setNewCoachStaffRole(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white outline-none" />
                    <select value={newCoachStaffCategory} onChange={e => setNewCoachStaffCategory(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white outline-none">
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input type="text" placeholder="Clave Acceso DT" value={newCoachStaffCode} onChange={e => setNewCoachStaffCode(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white outline-none uppercase font-mono" />
                    <button type="submit" className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg py-1 shadow flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5" /> Agregar</button>
                  </form>
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {coachesList.map(c => (
                      <div key={c.id} className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="font-bold text-xs text-white">{c.name} <span className="text-amber-400 font-semibold text-[10px]">({c.role})</span></div>
                          <div className="text-[10px] text-zinc-400">Categoría: {categories.find(x => x.id === c.categoryId)?.name || 'Sin asignar'} • Clave: <span className="font-mono text-white font-bold">{c.code}</span></div>
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

              {/* CATEGORÍAS */}
              {activeTabLibrary === 'categories' && !isTeacherRestricted && (
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
            </div>
          </div>
        )}

        {/* MODAL PANEL DE DUEÑO: PLANES DINÁMICOS Y LICENCIAS */}
        {showAdminDashboard && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
                <div>
                  <span className="bg-red-600 text-[9px] font-black px-1.5 py-0.5 rounded text-white">SUPERADMINISTRADOR</span>
                  <h3 className="font-black text-base text-white mt-1">Gestión de Planes y Licencias</h3>
                </div>
                <button onClick={() => setShowAdminDashboard(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              {/* EDITOR DE PRECIOS Y CUPOS */}
              <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl mb-3">
                <span className="text-[11px] font-black text-amber-400 uppercase block mb-2">Configurar Planes Comerciales</span>
                <div className="grid grid-cols-2 gap-2">
                  {customPlans.map(pl => (
                    <div key={pl.id} className="bg-zinc-950 p-2 rounded-xl border border-zinc-800 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-white truncate">{pl.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-400">\$</span>
                        <input type="number" value={pl.price} onChange={e => {
                          const val = Number(e.target.value);
                          setCustomPlans(customPlans.map(p => p.id === pl.id ? { ...p, price: val } : p));
                        }} className="w-20 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-[11px] font-bold text-emerald-400" />
                        <span className="text-[10px] text-zinc-400">Cupos:</span>
                        <input type="number" value={pl.seats} onChange={e => {
                          const val = Number(e.target.value);
                          setCustomPlans(customPlans.map(p => p.id === pl.id ? { ...p, seats: val } : p));
                        }} className="w-12 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-[11px] font-bold text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block font-bold">Ingresos Totales</span>
                  <span className="text-lg font-black text-emerald-400">\${totalRevenue.toLocaleString('es-CL')} CLP</span>
                </div>
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-bold">Clubes Activos</span>
                    <span className="text-lg font-black text-white">{adminLicenses.filter(l => l.status === 'active').length}</span>
                  </div>
                  <button onClick={() => setShowNewUserModal(true)} className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow">
                    <Plus className="w-4 h-4" /> Nuevo Club
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
                      <div className="text-[9px] text-zinc-500">Equipos conectados: {(lic.devices || []).length} / {lic.seats} máx</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => {
                        const updated = adminLicenses.map(l => l.id === lic.id ? { ...l, status: l.status === 'active' ? 'suspended' : 'active' } : l);
                        setAdminLicenses(updated);
                      }} className={`px-2 py-1 rounded text-xs font-bold ${lic.status === 'active' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
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

        {/* MODAL CREAR NUEVA LICENCIA */}
        {showNewUserModal && (
          <div className="absolute inset-0 bg-black/95 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-1"><Plus className="w-4 h-4 text-red-500" /> Crear Licencia de Club</h3>
                <button onClick={() => setShowNewUserModal(false)} className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newCoachName.trim()) return;
                const code = 'AND-' + Math.floor(1000 + Math.random() * 9000);
                const chosenPlan = customPlans.find(p => p.id === newCoachPlan) || customPlans[0];
                setAdminLicenses([{ id: 'lic-' + Date.now(), coach: newCoachName.trim(), club: newCoachClub.trim() || 'Club Deportivo', code, seats: chosenPlan.seats, devices: [], status: 'active', plan: chosenPlan.name, price: chosenPlan.price, expiry: newCoachExpiry }, ...adminLicenses]);
                setShowNewUserModal(false); setNewCoachName(''); setNewCoachClub('');
                alert(`¡Club Creado!\nClave: ${code}\nDispositivos: ${chosenPlan.seats}`);
              }} className="space-y-3">
                <input type="text" placeholder="Director del Club" value={newCoachName} onChange={e => setNewCoachName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none" required />
                <input type="text" placeholder="Nombre de la Escuela / Club" value={newCoachClub} onChange={e => setNewCoachClub(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none" />
                <select value={newCoachPlan} onChange={e => setNewCoachPlan(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none">
                  {customPlans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - \${p.price.toLocaleString('es-CL')}</option>
                  ))}
                </select>
                <input type="date" value={newCoachExpiry} onChange={e => setNewCoachExpiry(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none" required />
                <button type="submit" className="w-full py-2.5 bg-red-600 hover:bg-red-500 font-bold text-xs uppercase rounded-xl text-white shadow">Generar Acceso</button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL GUARDAR SESIÓN */}
        {showSaveModal && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-3">
              <h3 className="font-bold text-sm text-white">Guardar Ejercicio</h3>
              <input type="text" value={drillTitle} onChange={e => setDrillTitle(e.target.value)} placeholder="Título" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none" />
              <select value={drillCategory} onChange={e => setDrillCategory(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <textarea value={drillNotes} onChange={e => setDrillNotes(e.target.value)} rows={3} placeholder="Consignas y variantes..." className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none" />
              <button onClick={() => {
                const n = { id: 'd-' + Date.now(), title: drillTitle, notes: drillNotes, category: drillCategory, date: new Date().toISOString().split('T')[0], objects, drawings };
                setSavedDrills([n, ...savedDrills]); setShowSaveModal(false); alert('¡Sesión guardada!');
              }} className="w-full py-2 bg-red-600 font-bold text-xs rounded-xl text-white shadow">Confirmar Guardado</button>
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

        <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => addElement('player', { role: 'GK', number: '1', team: 'gk' })} className="w-9 h-9 rounded-full bg-amber-500 border-2 border-white text-white font-black text-xs shadow flex items-center justify-center gap-0.5" title="Añadir Portero">🧤1</button>
            <button onClick={() => addElement('player', { team: 'blue' })} className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white text-white font-bold text-xs shadow">11</button>
            <button onClick={() => addElement('player', { team: 'red' })} className="w-9 h-9 rounded-full bg-red-600 border-2 border-white text-white font-bold text-xs shadow">11</button>
            <button onClick={() => addElement('ball')} className="w-9 h-9 rounded-full bg-white text-sm shadow">⚽</button>
          </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setTool(tool === 'text' ? 'move' : 'text')} className={`p-1.5 rounded ${tool === 'text' ? 'bg-amber-500 text-black' : 'text-zinc-400'}`} title="Texto Explicativo"><Type className="w-5 h-5" /></button>
          <button onClick={() => setTool(tool === 'eraser' ? 'move' : 'eraser')} className={`p-1.5 rounded ${tool === 'eraser' ? 'bg-red-600 text-white animate-pulse' : 'text-zinc-400'}`} title="Goma de Borrar"><Eraser className="w-5 h-5" /></button>
          <button onClick={() => { setDrawings([]); setTextBlocks([]); }} className="p-1.5 text-zinc-400 hover:text-amber-400" title="Limpiar Dibujos"><Trash2 className="w-5 h-5" /></button>
          <button onClick={() => setShowLinePalette(true)} className={`p-1.5 rounded ${tool === 'draw' ? 'bg-amber-500 text-black' : 'text-zinc-300'}`} title="Trazados y Flechas"><PenTool className="w-5 h-5" /></button>
        </div>
      </footer>
    </div>
  );
}
