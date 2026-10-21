import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import {
  Folder, Play, RotateCcw, Save, Undo2, Redo2, Trash2, PenTool, X,
  Eraser, Lock, Plus, AlertTriangle, RotateCw, LogOut, MessageCircle,
  Upload, Printer, Edit2, Video, Square, Download, Sparkles, Gift,
  CheckCircle2, Clock, Users, DollarSign, Type, Shield, Eye, Move
} from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';

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

const GET_TACTICAL_SYSTEMS = (isLandscape) => {
  if (isLandscape) {
    return {
      '4-3-3': [
        { n: '1', r: 'GK', x: 8, y: 34 },
        { n: '4', r: 'CB', x: 22, y: 24 },
        { n: '3', r: 'CB', x: 22, y: 44 },
        { n: '2', r: 'RB', x: 30, y: 10 },
        { n: '5', r: 'LB', x: 30, y: 58 },
        { n: '6', r: 'CDM', x: 40, y: 34 },
        { n: '8', r: 'CM', x: 52, y: 22 },
        { n: '10', r: 'CAM', x: 52, y: 46 },
        { n: '7', r: 'RW', x: 74, y: 12 },
        { n: '11', r: 'LW', x: 74, y: 56 },
        { n: '9', r: 'ST', x: 82, y: 34 }
      ],
      '4-4-2': [
        { n: '1', r: 'GK', x: 8, y: 34 },
        { n: '4', r: 'CB', x: 22, y: 24 },
        { n: '3', r: 'CB', x: 22, y: 44 },
        { n: '2', r: 'RB', x: 30, y: 10 },
        { n: '5', r: 'LB', x: 30, y: 58 },
        { n: '6', r: 'CM', x: 48, y: 24 },
        { n: '8', r: 'CM', x: 48, y: 44 },
        { n: '7', r: 'RM', x: 56, y: 10 },
        { n: '11', r: 'LM', x: 56, y: 58 },
        { n: '9', r: 'ST', x: 78, y: 26 },
        { n: '10', r: 'ST', x: 78, y: 42 }
      ],
      '3-5-2': [
        { n: '1', r: 'GK', x: 8, y: 34 },
        { n: '2', r: 'CB', x: 22, y: 18 },
        { n: '4', r: 'CB', x: 21, y: 34 },
        { n: '3', r: 'CB', x: 22, y: 50 },
        { n: '6', r: 'CDM', x: 38, y: 34 },
        { n: '8', r: 'CM', x: 50, y: 23 },
        { n: '10', r: 'CM', x: 50, y: 45 },
        { n: '7', r: 'RWB', x: 56, y: 8 },
        { n: '11', r: 'LWB', x: 56, y: 60 },
        { n: '9', r: 'ST', x: 78, y: 26 },
        { n: '19', r: 'ST', x: 78, y: 42 }
      ]
    };
  }
  return {
    '4-3-3': [
      { n: '1', r: 'GK', x: 34, y: 96 },
      { n: '4', r: 'CB', x: 23, y: 82 },
      { n: '3', r: 'CB', x: 45, y: 82 },
      { n: '2', r: 'RB', x: 10, y: 74 },
      { n: '5', r: 'LB', x: 58, y: 74 },
      { n: '6', r: 'CDM', x: 34, y: 64 },
      { n: '8', r: 'CM', x: 22, y: 52 },
      { n: '10', r: 'CAM', x: 46, y: 52 },
      { n: '7', r: 'RW', x: 12, y: 32 },
      { n: '11', r: 'LW', x: 56, y: 32 },
      { n: '9', r: 'ST', x: 34, y: 24 }
    ],
    '4-4-2': [
      { n: '1', r: 'GK', x: 34, y: 96 },
      { n: '4', r: 'CB', x: 23, y: 82 },
      { n: '3', r: 'CB', x: 45, y: 82 },
      { n: '2', r: 'RB', x: 10, y: 74 },
      { n: '5', r: 'LB', x: 58, y: 74 },
      { n: '6', r: 'CM', x: 24, y: 56 },
      { n: '8', r: 'CM', x: 44, y: 56 },
      { n: '7', r: 'RM', x: 10, y: 48 },
      { n: '11', r: 'LM', x: 58, y: 48 },
      { n: '9', r: 'ST', x: 26, y: 26 },
      { n: '10', r: 'ST', x: 42, y: 26 }
    ],
    '3-5-2': [
      { n: '1', r: 'GK', x: 34, y: 96 },
      { n: '2', r: 'CB', x: 18, y: 82 },
      { n: '4', r: 'CB', x: 34, y: 83 },
      { n: '3', r: 'CB', x: 50, y: 82 },
      { n: '6', r: 'CDM', x: 34, y: 66 },
      { n: '8', r: 'CM', x: 23, y: 54 },
      { n: '10', r: 'CM', x: 45, y: 54 },
      { n: '7', r: 'RWB', x: 8, y: 48 },
      { n: '11', r: 'LWB', x: 60, y: 48 },
      { n: '9', r: 'ST', x: 26, y: 26 },
      { n: '19', r: 'ST', x: 42, y: 26 }
    ]
  };
};

// COMPONENTES 3D
function Pitch3D() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[105, 68]} />
        <meshStandardMaterial color="#16a34a" roughness={0.8} />
      </mesh>
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh
          key={`stripe-3d-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-52.5 + i * 7.5 + 3.75, 0.01, 0]}
          receiveShadow
        >
          <planeGeometry args={[7.4, 66]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#15803d' : '#16a34a'} roughness={0.8} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[9.1, 9.25, 64]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-51, 1.22, 0]}>
        <boxGeometry args={[0.4, 2.44, 7.32]} />
        <meshStandardMaterial color="#ffffff" metalness={0.2} roughness={0.4} />
      </mesh>
      <mesh position={[51, 1.22, 0]}>
        <boxGeometry args={[0.4, 2.44, 7.32]} />
        <meshStandardMaterial color="#ffffff" metalness={0.2} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Player3D({ position, color, number, isSelected, onClick }) {
  const groupRef = useRef();
  useFrame(() => {
    if (groupRef.current && isSelected) {
      groupRef.current.position.y = Math.sin(Date.now() * 0.005) * 0.15;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[position.x - 52.5, 0, position.y - 34]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow>
        <capsuleGeometry args={[0.55, 1.2, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.3, 0]} castShadow>
        <sphereGeometry args={[0.38, 16, 16]} />
        <meshStandardMaterial color="#fcd34d" roughness={0.5} />
      </mesh>
      <Html center position={[0, 1.4, 0.6]}>
        <div style={{ color: '#ffffff', fontWeight: 900, fontSize: '14px', textShadow: '0 1px 3px rgba(0,0,0,0.9)', pointerEvents: 'none' }}>
          {number}
        </div>
      </Html>
      {isSelected && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 1.5, 32]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
      )}
    </group>
  );
}

function Ball3D({ position, onClick }) {
  return (
    <group
      position={[position.x - 52.5, 0.35, position.y - 34]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <mesh castShadow>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.33, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function Scene3D({ objects, selectedObj, setSelectedObj, teamColors, cameraLocked }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 32, 42]} fov={55} />
      <OrbitControls
        enabled={!cameraLocked}
        target={[0, 0, 0]}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={12}
        maxDistance={75}
      />
      <ambientLight intensity={0.7} />
      <directionalLight position={[15, 30, 20]} intensity={1.2} castShadow />
      <Pitch3D />
      {objects.map((obj) => {
        if (obj.type === 'player') {
          const col = obj.customColor || (
            obj.role === 'GK'
              ? (obj.team === 'red' || obj.team === 'gk_away' ? teamColors.gk_away : teamColors.gk)
              : (obj.team === 'blue' ? teamColors.blue : teamColors.red)
          );
          return (
            <Player3D
              key={obj.id}
              position={{ x: obj.x, y: obj.y }}
              color={col}
              number={obj.number}
              isSelected={selectedObj?.id === obj.id}
              onClick={() => setSelectedObj(obj)}
            />
          );
        }
        if (obj.type === 'ball') {
          return <Ball3D key={obj.id} position={{ x: obj.x, y: obj.y }} onClick={() => setSelectedObj(obj)} />;
        }
        return null;
      })}
    </>
  );
}

// MATERIALES DISPONIBLES
const TRAINING_ITEMS = [
  { id: 'mini_goal', name: 'Mini Portería', icon: '🥅' },
  { id: 'ladder', name: 'Escalera', icon: '🪜' },
  { id: 'dummy', name: 'Maniquí', icon: '🧍' },
  { id: 'hurdle', name: 'Valla', icon: '🚧' },
  { id: 'cone_orange', name: 'Cono Naranja', icon: '▲', color: '#ea580c' },
  { id: 'cone_blue', name: 'Cono Azul', icon: '▲', color: '#2563eb' },
  { id: 'cone_yellow', name: 'Cono Amarillo', icon: '▲', color: '#eab308' },
  { id: 'disc', name: 'Plato Chino', icon: '🟡' },
  { id: 'ring', name: 'Aro', icon: '⭕' },
  { id: 'pole', name: 'Estaca', icon: '🥢' }
];

export default function App() {
  const [isPC, setIsPC] = useState(typeof window !== 'undefined' ? window.innerWidth > 768 : true);
  const [viewMode, setViewMode] = useState('2d');
  const [cameraLocked, setCameraLocked] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsPC(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [teamColors, setTeamColors] = useState({
    blue: '#2563eb',
    red: '#dc2626',
    gk: '#f59e0b',
    gk_away: '#16a34a'
  });

  const [authenticatedUser, setAuthenticatedUser] = useState(() => {
    const s = localStorage.getItem('andez_auth_session');
    return s ? JSON.parse(s) : null;
  });

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
    setLoginError('Código de activación no válido.');
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
  const [showKitPalette, setShowKitPalette] = useState(false);
  const [kitTarget, setKitTarget] = useState('blue');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedObj, setSelectedObj] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [playerCustomName, setPlayerCustomName] = useState('');
  const [playerCustomNumber, setPlayerCustomNumber] = useState('');

  // IA Gemini
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  // Trazados
  const [tool, setTool] = useState('move');
  const [lineType, setLineType] = useState('arrow');
  const [lineColor, setLineColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(1.4);
  const [showLinePalette, setShowLinePalette] = useState(false);
  const [drawings, setDrawings] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);

  const [objects, setObjects] = useState(() => {
    const sys = GET_TACTICAL_SYSTEMS(isPC)['4-3-3'];
    const pts = sys.map((p) => ({
      id: 'init-' + p.n,
      type: 'player',
      number: p.n,
      role: p.r,
      x: p.x,
      y: p.y,
      team: p.r === 'GK' ? 'gk' : 'blue',
      name: ''
    }));
    return [
      ...pts,
      { id: 'ball-1', type: 'ball', x: isPC ? 52.5 : 34, y: isPC ? 34 : 52.5 }
    ];
  });

  const [history, setHistory] = useState([objects]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const svgRef = useRef(null);
  const isDraggingRef = useRef(false);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const startRecording = async () => {
    recordedChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 } });
      const mr = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pizarra-andez-${Date.now()}.webm`;
        a.click();
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
      };
      mr.start();
      setIsRecording(true);
    } catch (err) {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
  };

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
      downloadLink.download = `pizarra-andez-${Date.now()}.png`;
      downloadLink.click();
      URLObject.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  const recordHistory = (objs) => {
    const nextH = history.slice(0, historyIndex + 1);
    nextH.push(JSON.parse(JSON.stringify(objs)));
    setHistory(nextH);
    setHistoryIndex(nextH.length - 1);
  };

  const maxX = isPC ? (pitchMode === 'half' ? 55 : 105) : 68;
  const maxY = isPC ? 68 : (pitchMode === 'half' ? 85 : 105);

  const getCoordinates = (e) => {
    if (!svgRef.current) return { x: maxX / 2, y: maxY / 2 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.touches ? e.touches[0].clientX : e.clientX;
    pt.y = e.touches ? e.touches[0].clientY : e.clientY;
    const c = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
    return {
      x: Math.max(1, Math.min(maxX - 1, c.x)),
      y: Math.max(1, Math.min(maxY - 1, c.y))
    };
  };

  const handlePointerDown = (e, obj) => {
    e.stopPropagation();
    if (tool === 'eraser') {
      const f = objects.filter((o) => o.id !== obj.id);
      setObjects(f);
      recordHistory(f);
      return;
    }
    if (tool !== 'move') return;
    setSelectedMaterial(obj.type !== 'player' && obj.type !== 'ball' ? obj : null);
    setSelectedObj(obj);
    isDraggingRef.current = true;
  };

  const handlePitchPointerDown = (e) => {
    const c = getCoordinates(e);
    if (tool === 'move' || tool === 'eraser') {
      setSelectedObj(null);
      setSelectedMaterial(null);
      return;
    }
    setCurrentLine({ id: Date.now(), start: c, end: c, type: lineType, color: lineColor, width: lineWidth });
  };

  const handlePointerMove = useCallback((e) => {
    if (isDraggingRef.current && selectedObj) {
      if (e.cancelable) e.preventDefault();
      const c = getCoordinates(e);
      setObjects((prev) => prev.map((o) => (o.id === selectedObj.id ? { ...o, x: c.x, y: c.y } : o)));
    } else if (currentLine) {
      if (e.cancelable) e.preventDefault();
      const c = getCoordinates(e);
      setCurrentLine((prev) => ({ ...prev, end: c }));
    }
  }, [selectedObj, currentLine]);

  const handlePointerUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      recordHistory(objects);
    }
    if (currentLine) {
      setDrawings((prev) => [...prev, currentLine]);
      setCurrentLine(null);
    }
  }, [objects, currentLine]);

  const rotateObject = (id) => {
    const u = objects.map((o) =>
      o.id === id ? { ...o, rotation: ((o.rotation || 0) + 45) % 360 } : o
    );
    setObjects(u);
    recordHistory(u);
  };

  const addElement = (itemType, extra = {}) => {
    const id = 'item-' + Date.now();
    const spawnX = isPC ? (pitchMode === 'half' ? 27.5 : 52.5) : 34;
    const spawnY = isPC ? 34 : (pitchMode === 'half' ? 42.5 : 52.5);
    const count = objects.filter((o) => o.type === 'player' && o.team === (extra.team || 'blue')).length + 1;
    const item = {
      id,
      type: itemType,
      x: spawnX,
      y: spawnY,
      rotation: 0,
      name: '',
      number: String(extra.number || count),
      ...extra
    };
    const nextObjs = [...objects, item];
    setObjects(nextObjs);
    recordHistory(nextObjs);
  };

  const applyTacticalSystem = (sysKey) => {
    const baseSystems = GET_TACTICAL_SYSTEMS(isPC);
    const sys = baseSystems[sysKey];
    if (!sys || !Array.isArray(sys)) return;
    const players = sys.map((p, idx) => ({
      id: 'sys-p-' + Date.now() + '-' + idx,
      type: 'player',
      number: String(p.n ?? (idx === 0 ? '1' : idx + 1)),
      role: p.r ?? (idx === 0 ? 'GK' : 'JUG'),
      x: Number(p.x),
      y: Number(p.y),
      team: p.team || (idx === 0 ? 'gk' : 'blue'),
      name: ''
    }));
    const nonPlayers = objects.filter((o) => o.type !== 'player');
    const u = [...players, ...nonPlayers];
    setObjects(u);
    recordHistory(u);
    setShowSystemsMenu(false);
  };

  const handleGenerateTacticalPrompt = async (e) => {
    e.preventDefault();
    if (!promptText.trim() || isGeneratingPrompt) return;
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert('Clave VITE_GEMINI_API_KEY no detectada.');
      return;
    }
    setIsGeneratingPrompt(true);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Instrucción táctica: "${promptText}"` }] }],
            systemInstruction: {
              parts: [{
                text: `Eres DT profesional. Devuelve exclusivamente un array JSON válido con coordenadas (X de 0 a 105, Y de 0 a 68).
Formato: [{"id":"p_1","type":"player","number":"1","name":"Arquero","x":4,"y":34,"team":"blue"}]`
              }]
            },
            generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
          })
        }
      );
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setObjects(parsed);
        recordHistory(parsed);
        setShowPromptModal(false);
        setPromptText('');
      }
    } catch (err) {
      alert('Error al conectar con Gemini: ' + err.message);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  if (!authenticatedUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-[#070b12] text-white p-4 font-sans select-none">
        <div className="w-full max-w-md bg-zinc-950/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl mb-4 border border-amber-400 bg-zinc-900 flex items-center justify-center font-black text-amber-400 text-xl">
            AZ
          </div>
          <h1 className="text-2xl font-black text-white mb-1">
            ANDEZ SPORTS FC <span className="text-amber-400">PRO</span>
          </h1>
          <p className="text-xs text-zinc-400 mb-4">Ingreso de Director Técnico o Administrador</p>
          <form onSubmit={handleClientLogin} className="w-full space-y-3 my-2">
            <input
              type="text"
              value={inputLicenseCode}
              onChange={(e) => setInputLicenseCode(e.target.value)}
              placeholder="Código Maestro: ANDEZ2026"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 text-sm text-center font-mono font-bold text-white uppercase focus:border-red-500 outline-none"
              required
            />
            {loginError && (
              <p className="text-xs text-red-400 font-bold bg-red-950/50 p-2 rounded-xl border border-red-800">
                {loginError}
              </p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase rounded-2xl shadow transition"
            >
              Ingresar al Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-black overflow-hidden select-none font-sans">
      {/* HEADER SUPERIOR */}
      <header className="bg-black px-3 py-1.5 flex items-center justify-between shrink-0 z-30 border-b border-zinc-900 overflow-x-auto max-w-full">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 bg-zinc-900 flex items-center justify-center font-black text-amber-400 text-xs">
            AZ
          </div>
          <button onClick={() => setShowSystemsMenu(true)} className="text-zinc-300 hover:text-amber-400" title="Sistemas Tácticos">
            <Play className="w-5 h-5" />
          </button>
          <button
            onClick={() => setPitchMode(pitchMode === 'full' ? 'half' : 'full')}
            className={`p-1 rounded transition ${pitchMode === 'half' ? 'bg-red-600 text-white px-1.5' : 'text-zinc-300 hover:text-amber-400'}`}
          >
            <RotateCcw className="w-5 h-5" />
            {pitchMode === 'half' && <span className="text-xs font-bold ml-0.5">1/2</span>}
          </button>
          <button
            onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')}
            className="flex items-center gap-1 bg-blue-600/20 border border-blue-400 text-blue-300 px-2.5 py-1 rounded-full text-[11px] font-bold shadow active:scale-95"
          >
            <Shield className="w-3.5 h-3.5" /> {viewMode === '2d' ? '3D' : '2D'}
          </button>
          <button
            onClick={() => setShowTrainingMenu(!showTrainingMenu)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${showTrainingMenu ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-amber-400 border border-amber-500/30'}`}
          >
            ▲ Materiales
          </button>
          <button
            onClick={() => setShowPromptModal(true)}
            className="flex items-center gap-1 bg-amber-500/20 border border-amber-400 text-amber-300 px-2.5 py-1 rounded-full text-[11px] font-bold shadow active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" /> Prompt IA
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {selectedMaterial && (
            <button
              onClick={() => rotateObject(selectedMaterial.id)}
              className="flex items-center gap-1 bg-amber-500 text-black px-2 py-1 rounded-full text-[10px] font-black"
            >
              <RotateCw className="w-3.5 h-3.5" /> 45°
            </button>
          )}
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black animate-pulse shadow"
            >
              <Square className="w-3.5 h-3.5" /> Detener
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow"
            >
              <Video className="w-3.5 h-3.5 text-red-500" /> Grabar
            </button>
          )}
          <button onClick={exportBoardAsImage} className="text-zinc-300 hover:text-amber-400" title="Exportar PNG">
            <Download className="w-5 h-5" />
          </button>
          <button onClick={handleLogout} className="text-zinc-400 hover:text-red-400">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* BARRA DE MATERIALES HORIZONTAL COMPLETA */}
      {showTrainingMenu && (
        <div className="bg-zinc-950 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto border-b border-zinc-800 z-20">
          <span className="text-[10px] font-black uppercase text-amber-400 mr-2 shrink-0">Materiales:</span>
          {TRAINING_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => addElement(item.id, { color: item.color || '#ffffff' })}
              className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-400 rounded-xl text-xs font-bold text-zinc-200 shrink-0 shadow transition"
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
          <button
            onClick={() => setShowTrainingMenu(false)}
            className="p-1 text-red-400 hover:text-white shrink-0 ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CANCHA CENTRAL */}
      <main className="flex-1 w-full h-full flex items-center justify-center p-0 overflow-hidden touch-none relative bg-[#1e881b]">
        {viewMode === '2d' ? (
          <svg
            ref={svgRef}
            viewBox={isPC ? (pitchMode === 'half' ? '0 0 55 68' : '0 0 105 68') : (pitchMode === 'half' ? '0 0 68 85' : '0 0 68 105')}
            className="w-full h-full select-none drop-shadow-2xl touch-none"
            onPointerDown={handlePitchPointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <defs>
              {['#ffffff', '#ef4444', '#3b82f6', '#facc15', '#000000'].map((c) => (
                <marker key={c} id={`arrow-${c.replace('#', '')}`} viewBox="0 0 10 10" refX="1" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                  <path d="M 0 1 L 8 5 L 0 9 L 2 5 z" fill={c} />
                </marker>
              ))}
              <linearGradient id="grassMain" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>
              <linearGradient id="grassDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#14532d" />
              </linearGradient>
            </defs>

            <rect width="500" height="500" x="-200" y="-200" fill="#0f2e1a" />
            {Array.from({ length: isPC ? 14 : 10 }).map((_, i) => (
              <rect
                key={`stripe-${i}`}
                x={i * 7.5}
                y="0"
                width={7.5}
                height={isPC ? 68 : pitchMode === 'half' ? 85 : 105}
                fill={i % 2 === 0 ? 'url(#grassMain)' : 'url(#grassDark)'}
              />
            ))}

            {/* LÍNEAS REGLAMENTARIAS */}
            {isPC ? (
              <g stroke="white" strokeWidth="0.7" fill="none" strokeLinecap="round">
                <rect x="2" y="2" width={pitchMode === 'half' ? 51 : 101} height="64" rx="0.2" />
                <line x1={pitchMode === 'half' ? 53 : 52.5} y1="2" x2={pitchMode === 'half' ? 53 : 52.5} y2="66" />
                <circle cx={pitchMode === 'half' ? 53 : 52.5} cy="34" r="9.15" />
                <circle cx={pitchMode === 'half' ? 53 : 52.5} cy="34" r="0.7" fill="white" />
                <rect x="2" y="13.8" width="16.5" height="40.4" />
                <rect x="2" y="24.8" width="5.5" height="18.4" />
                <circle cx="11" cy="34" r="0.6" fill="white" />
                <path d="M 18.5 28 A 9.15 9.15 0 0 1 18.5 40" />
                {pitchMode !== 'half' && (
                  <>
                    <rect x="86.5" y="13.8" width="16.5" height="40.4" />
                    <rect x="97.5" y="24.8" width="5.5" height="18.4" />
                    <circle cx="94" cy="34" r="0.6" fill="white" />
                    <path d="M 86.5 28 A 9.15 9.15 0 0 0 86.5 40" />
                  </>
                )}
              </g>
            ) : (
              <g stroke="white" strokeWidth="0.7" fill="none" strokeLinecap="round">
                <rect x="2" y="2" width="64" height={pitchMode === 'half' ? 79 : 101} rx="0.2" />
                <line x1="2" y1={pitchMode === 'half' ? 81 : 52.5} x2="66" y2={pitchMode === 'half' ? 81 : 52.5} />
                <circle cx="34" cy={pitchMode === 'half' ? 81 : 52.5} r="9.15" />
                <circle cx="34" cy={pitchMode === 'half' ? 81 : 52.5} r="0.7" fill="white" />
                {pitchMode !== 'half' && (
                  <>
                    <rect x="13.8" y="2" width="40.4" height="16.5" />
                    <rect x="24.8" y="2" width="18.4" height="5.5" />
                    <circle cx="34" cy="11" r="0.6" fill="white" />
                    <path d="M 28 18.5 A 9.15 9.15 0 0 0 40 18.5" />
                  </>
                )}
                <rect x="13.8" y={pitchMode === 'half' ? 64.5 : 86.5} width="40.4" height="16.5" />
                <rect x="24.8" y={pitchMode === 'half' ? 75.5 : 97.5} width="18.4" height="5.5" />
                <circle cx="34" cy={pitchMode === 'half' ? 70 : 94} r="0.6" fill="white" />
                <path d={`M 28 ${pitchMode === 'half' ? 64.5 : 86.5} A 9.15 9.15 0 0 1 40 ${pitchMode === 'half' ? 64.5 : 86.5}`} />
              </g>
            )}

            {/* TRAZADOS TÁCTICOS */}
            {drawings.map((l) => {
              const markerId = l.type === 'straight' || l.type === 'dashed' ? '' : `url(#arrow-${(l.color || '#ffffff').replace('#', '')})`;
              return (
                <g key={l.id} onPointerDown={(e) => {
                  if (tool === 'eraser') {
                    e.stopPropagation();
                    setDrawings((prev) => prev.filter((d) => d.id !== l.id));
                  }
                }}>
                  <line
                    x1={l.start.x}
                    y1={l.start.y}
                    x2={l.end.x}
                    y2={l.end.y}
                    stroke={l.color}
                    strokeWidth={l.width || 1.4}
                    strokeLinecap="round"
                    strokeDasharray={l.type === 'dashed' ? '3,2' : 'none'}
                    markerEnd={markerId}
                  />
                </g>
              );
            })}

            {currentLine && (
              <line
                x1={currentLine.start.x}
                y1={currentLine.start.y}
                x2={currentLine.end.x}
                y2={currentLine.end.y}
                stroke={currentLine.color}
                strokeWidth={currentLine.width}
                strokeLinecap="round"
                strokeDasharray={currentLine.type === 'dashed' ? '3,2' : 'none'}
              />
            )}

            {/* ELEMENTOS Y MATERIALES EN CANCHA */}
            {objects.map((obj) => {
              if (obj.type === 'player') {
                const playerColor = obj.customColor || (
                  obj.role === 'GK'
                    ? (obj.team === 'red' || obj.team === 'gk_away' ? teamColors.gk_away : teamColors.gk)
                    : (obj.team === 'blue' ? teamColors.blue : teamColors.red)
                );
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
                    className="cursor-grab active:cursor-grabbing touch-none select-none"
                  >
                    <ellipse cx="0.15" cy="3.2" rx="2.6" ry="1.1" fill="rgba(0,0,0,0.22)" />
                    <circle
                      r="3.0"
                      fill={playerColor}
                      stroke={selectedObj?.id === obj.id ? '#facc15' : '#ffffff'}
                      strokeWidth={selectedObj?.id === obj.id ? 0.7 : 0.4}
                    />
                    <text textAnchor="middle" dy="1.1" fontSize="2.4" fontWeight="900" fill="#ffffff" pointerEvents="none">
                      {obj.number}
                    </text>
                    {obj.name && (
                      <g>
                        <rect x={-10} y="3.8" width={20} height="3.6" rx="1" fill="rgba(10,10,10,0.88)" />
                        <text x="0" y="6.3" textAnchor="middle" fontSize="1.9" fontWeight="bold" fill="#ffffff">
                          {obj.name}
                        </text>
                      </g>
                    )}
                  </g>
                );
              }
              if (obj.type === 'ball') {
                return (
                  <g
                    key={obj.id}
                    transform={`translate(${obj.x}, ${obj.y})`}
                    onPointerDown={(e) => handlePointerDown(e, obj)}
                    className="cursor-grab active:cursor-grabbing touch-none select-none"
                  >
                    <ellipse cx="0.2" cy="0.5" rx="2.4" ry="1.0" fill="rgba(0,0,0,0.25)" />
                    <circle r="2.6" fill="#ffffff" stroke="#0f172a" strokeWidth="0.4" />
                    <polygon points="0,-0.9 0.85,-0.28 0.53,0.73 -0.53,0.73 -0.85,-0.28" fill="#0f172a" />
                  </g>
                );
              }

              // MATERIALES DE ENTRENAMIENTO SVG CON ROTACIÓN
              const rot = obj.rotation || 0;
              const isSel = selectedObj?.id === obj.id;
              return (
                <g
                  key={obj.id}
                  transform={`translate(${obj.x}, ${obj.y}) rotate(${rot})`}
                  onPointerDown={(e) => handlePointerDown(e, obj)}
                  className="cursor-grab active:cursor-grabbing touch-none select-none"
                >
                  {isSel && <circle r="4.5" fill="none" stroke="#facc15" strokeWidth="0.5" strokeDasharray="1,1" />}
                  {obj.type.startsWith('cone') && (
                    <polygon points="0,-2.8 -2.4,2.2 2.4,2.2" fill={obj.color || '#ea580c'} stroke="#ffffff" strokeWidth="0.3" />
                  )}
                  {obj.type === 'mini_goal' && (
                    <g>
                      <rect x="-4" y="-2" width="8" height="4" fill="none" stroke="#ffffff" strokeWidth="0.6" rx="0.5" />
                      <line x1="-4" y1="0" x2="4" y2="0" stroke="#facc15" strokeWidth="0.4" strokeDasharray="1,1" />
                    </g>
                  )}
                  {obj.type === 'ladder' && (
                    <g>
                      <rect x="-2" y="-6" width="4" height="12" fill="none" stroke="#ffffff" strokeWidth="0.4" />
                      {[-4, -2, 0, 2, 4].map((ly) => (
                        <line key={ly} x1="-2" y1={ly} x2="2" y2={ly} stroke="#facc15" strokeWidth="0.5" />
                      ))}
                    </g>
                  )}
                  {obj.type === 'hurdle' && (
                    <g>
                      <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#facc15" strokeWidth="1" strokeLinecap="round" />
                      <line x1="-3" y1="-1" x2="-3" y2="1" stroke="#ffffff" strokeWidth="0.5" />
                      <line x1="3" y1="-1" x2="3" y2="1" stroke="#ffffff" strokeWidth="0.5" />
                    </g>
                  )}
                  {obj.type === 'dummy' && (
                    <g>
                      <circle cx="0" cy="-2.5" r="1.3" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.3" />
                      <path d="M -2.2 2.5 L -1.5 -0.8 L 1.5 -0.8 L 2.2 2.5 Z" fill="#0284c7" stroke="#ffffff" strokeWidth="0.3" />
                    </g>
                  )}
                  {obj.type === 'disc' && (
                    <ellipse cx="0" cy="0" rx="2.5" ry="1.2" fill="#eab308" stroke="#ffffff" strokeWidth="0.3" />
                  )}
                  {obj.type === 'ring' && (
                    <circle cx="0" cy="0" r="3" fill="none" stroke="#ef4444" strokeWidth="0.8" />
                  )}
                  {obj.type === 'pole' && (
                    <line x1="0" y1="-4" x2="0" y2="4" stroke="#eab308" strokeWidth="1.2" strokeLinecap="round" />
                  )}
                </g>
              );
            })}
          </svg>
        ) : (
          <div className="relative w-full h-full">
            {/* BOTÓN FLOTANTE PARA ACTIVAR / BLOQUEAR CÁMARA */}
            <div className="absolute top-4 left-4 z-40 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-2 shadow-2xl flex items-center gap-2">
              <button
                onClick={() => setCameraLocked(!cameraLocked)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  cameraLocked
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-amber-500 text-black shadow-lg animate-pulse'
                }`}
              >
                {cameraLocked ? <Lock className="w-4 h-4" /> : <Move className="w-4 h-4" />}
                <span>{cameraLocked ? 'Cámara Bloqueada (Mover Fichas)' : 'Rotando Cancha (Orbitar)'}</span>
              </button>
            </div>

            <Suspense fallback={<div className="text-white font-bold text-sm flex items-center justify-center h-full">Cargando 3D...</div>}>
              <Canvas frameloop="demand" dpr={[1, 1.5]} shadows className="w-full h-full">
                <Scene3D
                  objects={objects}
                  selectedObj={selectedObj}
                  setSelectedObj={setSelectedObj}
                  teamColors={teamColors}
                  cameraLocked={cameraLocked}
                />
              </Canvas>
            </Suspense>
          </div>
        )}
      </main>

      {/* FOOTER INFERIOR */}
      <footer className="bg-black px-4 py-2 flex items-center justify-between shrink-0 z-30 border-t border-zinc-900 overflow-x-auto max-w-full">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (historyIndex > 0) {
                setHistoryIndex(historyIndex - 1);
                setObjects(history[historyIndex - 1]);
              }
            }}
            disabled={historyIndex <= 0}
            className="p-1.5 text-zinc-300 disabled:opacity-30"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (historyIndex < history.length - 1) {
                setHistoryIndex(historyIndex + 1);
                setObjects(history[historyIndex + 1]);
              }
            }}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 text-zinc-300 disabled:opacity-30"
          >
            <Redo2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowKitPalette((prev) => !prev)}
            className={`px-2 py-1 rounded-xl text-xs font-bold border transition ${
              showKitPalette ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900 text-zinc-300 border-zinc-700'
            }`}
          >
            Camisetas
          </button>
          <button
            onClick={() => addElement('player', { role: 'GK', number: '1', team: 'gk' })}
            style={{ backgroundColor: teamColors.gk }}
            className="w-8 h-8 rounded-full border-2 border-white text-white font-black text-xs shadow"
          >
            1
          </button>
          <button
            onClick={() => addElement('player', { team: 'blue' })}
            style={{ backgroundColor: teamColors.blue }}
            className="w-8 h-8 rounded-full border-2 border-white text-white font-bold text-xs shadow"
          >
            11
          </button>
          <button
            onClick={() => addElement('player', { team: 'red' })}
            style={{ backgroundColor: teamColors.red }}
            className="w-8 h-8 rounded-full border-2 border-white text-white font-bold text-xs shadow"
          >
            11
          </button>
          <button onClick={() => addElement('ball')} className="w-8 h-8 rounded-full bg-white text-black font-black text-xs shadow">
            ⚽
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setTool(tool === 'eraser' ? 'move' : 'eraser')}
            className={`p-1.5 rounded ${tool === 'eraser' ? 'bg-red-600 text-white animate-pulse' : 'text-zinc-400'}`}
          >
            <Eraser className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (confirm('¿Vaciar toda la pizarra?')) {
                setObjects([]);
                setDrawings([]);
                recordHistory([]);
              }
            }}
            className="p-1.5 text-red-400"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowLinePalette(true)}
            className={`p-1.5 rounded ${tool === 'draw' ? 'bg-amber-500 text-black' : 'text-zinc-300'}`}
          >
            <PenTool className="w-5 h-5" />
          </button>
        </div>
      </footer>

      {/* MODAL SISTEMAS */}
      {showSystemsMenu && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 max-w-xs w-full text-white">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm">Sistemas Tácticos</h3>
              <button onClick={() => setShowSystemsMenu(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2">
              {['4-3-3', '4-4-2', '3-5-2'].map((sys) => (
                <button
                  key={sys}
                  onClick={() => applyTacticalSystem(sys)}
                  className="w-full py-2 bg-zinc-900 border border-zinc-800 hover:border-amber-400 rounded-xl text-xs font-bold text-left px-3"
                >
                  Sistema {sys}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PALETA CAMISETAS */}
      {showKitPalette && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-zinc-950 border border-zinc-800 rounded-2xl p-2.5 shadow-2xl flex items-center gap-3 z-40">
          <div className="flex items-center gap-1">
            {[
              { id: 'blue', label: 'Eq. 1' },
              { id: 'red', label: 'Eq. 2' },
              { id: 'gk', label: 'Arq. 1' },
              { id: 'gk_away', label: 'Arq. 2' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setKitTarget(t.id)}
                className={`px-2 py-1 rounded-lg text-xs font-bold ${kitTarget === t.id ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-300'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {['#ffffff', '#18181b', '#2563eb', '#dc2626', '#eab308', '#16a34a', '#f97316', '#06b6d4'].map((c) => (
              <button
                key={c}
                onClick={() => {
                  setTeamColors((prev) => ({ ...prev, [kitTarget]: c }));
                }}
                style={{ backgroundColor: c }}
                className="w-5 h-5 rounded-full border border-zinc-700"
              />
            ))}
          </div>
          <button onClick={() => setShowKitPalette(false)} className="px-2 py-1 bg-red-600 text-white rounded-lg text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* MODAL TRAZADOS */}
      {showLinePalette && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-zinc-950 border border-zinc-800 rounded-2xl p-2 shadow-2xl z-40 flex items-center gap-2">
          <button
            onClick={() => {
              setLineType('arrow');
              setTool('draw');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${lineType === 'arrow' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-white'}`}
          >
            ➔ Normal
          </button>
          <button
            onClick={() => {
              setLineType('dashed');
              setTool('draw');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${lineType === 'dashed' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-white'}`}
          >
            ⤏ Discontinua
          </button>
          <div className="flex items-center gap-1">
            {['#ffffff', '#ef4444', '#3b82f6', '#facc15'].map((c) => (
              <button
                key={c}
                onClick={() => setLineColor(c)}
                style={{ backgroundColor: c }}
                className="w-4 h-4 rounded-full border border-zinc-700"
              />
            ))}
          </div>
          <button onClick={() => setShowLinePalette(false)} className="px-2 py-1 bg-red-600 text-white rounded-lg text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* MODAL GEMINI IA */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">🤖 Generador Táctico IA</h3>
              <button onClick={() => setShowPromptModal(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleGenerateTacticalPrompt}>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Ejemplo: Salida 4-3-3 con laterales abiertos y presión alta..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white text-sm mb-3 outline-none focus:border-amber-400"
                rows={3}
              />
              <button
                type="submit"
                disabled={isGeneratingPrompt}
                className="w-full bg-amber-500 text-black py-2.5 rounded-xl font-bold disabled:opacity-50"
              >
                {isGeneratingPrompt ? 'Generando posiciones...' : '✨ Armar en la Cancha'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR FICHA */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 max-w-xs w-full text-white">
            <h3 className="font-bold text-sm mb-3">Editar Ficha</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={playerCustomName}
                onChange={(e) => setPlayerCustomName(e.target.value)}
                placeholder="Nombre / Rol"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs outline-none"
              />
              <input
                type="text"
                value={playerCustomNumber}
                onChange={(e) => setPlayerCustomNumber(e.target.value)}
                placeholder="Dorsal"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs outline-none"
              />
              <button
                onClick={() => {
                  setObjects((prev) =>
                    prev.map((o) =>
                      o.id === editingPlayer.id ? { ...o, name: playerCustomName.trim(), number: playerCustomNumber || o.number } : o
                    )
                  );
                  setEditingPlayer(null);
                }}
                className="w-full py-2 bg-red-600 rounded-xl text-xs font-bold shadow"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
