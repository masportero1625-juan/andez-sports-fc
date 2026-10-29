import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, Suspense } from 'react';
import {
  Folder, Play, RotateCcw, Save, Undo2, Redo2, Trash2, PenTool, X,
  Eraser, Lock, Plus, AlertTriangle, RotateCw, LogOut, MessageCircle,
  Upload, Printer, Edit2, Video, Square, Download, Sparkles, Gift,
  CheckCircle2, Clock, Users, DollarSign, Type, Shield, Move
} from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, useGLTF, useAnimations, PerspectiveCamera } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import * as THREE from 'three';

// CREDENCIALES SUPABASE
const SB_URL = import.meta.env.VITE_SUPABASE_URL || 'https://btpzlnatmnmtmzdygcge.supabase.co';
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_r0tfzyI2VCIHLHJb5H6kNw_x4euzZSg';

// Copia local (localStorage) para que la app siga funcionando si la tabla app_data aún no existe o no hay conexión
const sbLocalKey = (k) => `sbcache:${k}`;
function sbLocalRead(key) {
  try {
    const raw = window.localStorage.getItem(sbLocalKey(key));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
function sbLocalWrite(key, value) {
  try {
    window.localStorage.setItem(sbLocalKey(key), JSON.stringify(value));
  } catch (e) { /* cuota llena o almacenamiento bloqueado */ }
}

// Se comprueba UNA sola vez si la tabla existe; así no se disparan decenas de peticiones 404 en paralelo
let _sbAvailable = null;
let _sbProbe = null;
function sbIsAvailable() {
  if (_sbAvailable !== null) return Promise.resolve(_sbAvailable);
  if (!_sbProbe) {
    _sbProbe = fetch(`${SB_URL}/rest/v1/app_data?select=key&limit=1`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    })
      .then((res) => { _sbAvailable = res.ok; return _sbAvailable; })
      .catch(() => { _sbAvailable = false; return false; });
  }
  return _sbProbe;
}

async function sbGet(key) {
  try {
    if (await sbIsAvailable()) {
      const res = await fetch(`${SB_URL}/rest/v1/app_data?key=eq.${encodeURIComponent(key)}&select=value`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
      });
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d) && d.length > 0) {
          sbLocalWrite(key, d[0].value);
          return d[0].value;
        }
      }
    }
  } catch (e) { /* silencioso */ }
  return sbLocalRead(key);
}

async function sbSet(key, value) {
  sbLocalWrite(key, value);
  try {
    if (!(await sbIsAvailable())) return;
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
  } catch (e) { /* silencioso */ }
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
  const s = obj.scale || 1.0;

  const renderContent = () => {
    switch (obj.type) {
      case 'mini_goal':
        return (
          <g>
            <rect x="-2.6" y="-1.6" width="5.2" height="1.8" rx="0.2" fill="rgba(0,0,0,0.25)" />
            <rect x="-2.5" y="-1.5" width="5.0" height="1.5" fill="rgba(255,255,255,0.4)" stroke="#94a3b8" strokeWidth="0.12" strokeDasharray="0.3,0.3" />
            <line x1="-2.5" y1="-1.5" x2="2.5" y2="-1.5" stroke="#cbd5e1" strokeWidth="0.2" />
            <line x1="-2.5" y1="-1.5" x2="-2.5" y2="0" stroke="#cbd5e1" strokeWidth="0.2" />
            <line x1="2.5" y1="-1.5" x2="2.5" y2="0" stroke="#cbd5e1" strokeWidth="0.2" />
            <line x1="-2.5" y1="0" x2="2.5" y2="0" stroke="#ffffff" strokeWidth="0.4" strokeLinecap="round" />
          </g>
        );
      case 'ladder':
        return (
          <g>
            <rect x="-2" y="-6" width="4" height="12" fill="none" stroke="#ffffff" strokeWidth="0.4" />
            {[-4, -2, 0, 2, 4].map((ly) => (
              <line key={ly} x1="-2" y1={ly} x2="2" y2={ly} stroke="#facc15" strokeWidth="0.5" />
            ))}
          </g>
        );
      case 'dummy':
        return (
          <g>
            <ellipse cx="1.2" cy="1.2" rx="2.2" ry="0.9" fill="rgba(0,0,0,0.35)" transform="rotate(-15, 1.2, 1.2)" />
            <line x1="-1.4" y1="0" x2="1.4" y2="0" stroke="#0f172a" strokeWidth="0.35" strokeLinecap="round" />
            <line x1="0" y1="-1.0" x2="0" y2="1.0" stroke="#0f172a" strokeWidth="0.35" strokeLinecap="round" />
            <circle cx="-1.4" cy="0" r="0.2" fill="#0f172a" />
            <circle cx="1.4" cy="0" r="0.2" fill="#0f172a" />
            <circle cx="0" cy="-1.0" r="0.2" fill="#0f172a" />
            <circle cx="0" cy="1.0" r="0.2" fill="#0f172a" />
            <ellipse cx="0" cy="0" rx="1.6" ry="0.75" fill="#eab308" stroke="#ca8a04" strokeWidth="0.25" />
            <ellipse cx="0" cy="-0.1" rx="1.3" ry="0.5" fill="#facc15" />
            <line x1="-1.1" y1="0" x2="1.1" y2="0" stroke="#ca8a04" strokeWidth="0.25" strokeLinecap="round" />
            <circle cx="0" cy="0" r="0.48" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.2" />
            <circle cx="0" cy="-0.08" r="0.25" fill="#ffffff" opacity="0.6" />
          </g>
        );
      case 'hurdle':
        return (
          <g>
            <ellipse cx="-2.6" cy="0.6" rx="1.0" ry="0.4" fill="rgba(0,0,0,0.28)" />
            <ellipse cx="2.6" cy="0.6" rx="1.0" ry="0.4" fill="rgba(0,0,0,0.28)" />
            <line x1="-2.6" y1="-0.9" x2="-2.6" y2="0.9" stroke="#713f12" strokeWidth="0.45" strokeLinecap="round" />
            <line x1="2.6" y1="-0.9" x2="2.6" y2="0.9" stroke="#713f12" strokeWidth="0.45" strokeLinecap="round" />
            <line x1="-2.6" y1="0" x2="2.6" y2="0" stroke="#ca8a04" strokeWidth="0.65" strokeLinecap="round" />
            <line x1="-2.6" y1="-0.1" x2="2.6" y2="-0.1" stroke="#facc15" strokeWidth="0.4" strokeLinecap="round" />
            <line x1="-1.0" y1="0" x2="1.0" y2="0" stroke="#000000" strokeWidth="0.3" strokeDasharray="0.6,0.6" />
          </g>
        );
      case 'cone': {
        const cFill = obj.color && obj.color !== '#ea580c' ? obj.color : '#f97316';
        return (
          <g>
            <ellipse cx="0.5" cy="0.6" rx="1.8" ry="1.0" fill="rgba(0,0,0,0.35)" />
            <rect x="-1.5" y="-1.5" width="3.0" height="3.0" rx="0.3" fill="#7c2d12" stroke="#000000" strokeWidth="0.2" />
            <rect x="-1.3" y="-1.3" width="2.6" height="2.6" rx="0.2" fill={cFill} />
            <circle cx="0" cy="0" r="1.1" fill="#ea580c" stroke="#000000" strokeWidth="0.15" />
            <circle cx="0" cy="0" r="0.75" fill="#ffffff" stroke="#000000" strokeWidth="0.1" />
            <circle cx="0" cy="0" r="0.35" fill={cFill} />
          </g>
        );
      }
      case 'saucer': {
        const c = obj.color || '#facc15';
        return (
          <g>
            <ellipse cx="0.4" cy="0.4" rx="1.7" ry="1.0" fill="rgba(0,0,0,0.3)" />
            <circle cx="0" cy="0" r="1.5" fill={c} stroke="#000000" strokeWidth="0.25" />
            <circle cx="0" cy="-0.1" r="1.0" fill="#ffffff" opacity="0.35" />
            <circle cx="0" cy="0" r="0.4" fill="#0f172a" stroke="#000000" strokeWidth="0.1" />
          </g>
        );
      }
      case 'ring': {
        const c = obj.color || '#38bdf8';
        return (
          <g>
            <circle cx="0" cy="0" r="2.8" fill="none" stroke={c} strokeWidth="0.6" />
          </g>
        );
      }
      case 'pole': {
        const c = obj.color || '#facc15';
        return (
          <g>
            <line x1="0" y1="0" x2="3.2" y2="3.2" stroke="rgba(0,0,0,0.35)" strokeWidth="0.6" strokeLinecap="round" />
            <circle cx="0" cy="0" r="1.3" fill="#09090b" stroke="#000000" strokeWidth="0.2" />
            <circle cx="0" cy="0" r="0.8" fill="#27272a" />
            <circle cx="0" cy="0" r="0.45" fill={c} stroke="#000000" strokeWidth="0.15" />
            <circle cx="0" cy="0" r="0.15" fill="#ffffff" />
          </g>
        );
      }
      case 'rebounder':
        return (
          <g>
            <rect x="-3.7" y="-0.7" width="7.4" height="2.0" rx="0.3" fill="rgba(0,0,0,0.28)" />
            <rect x="-3.5" y="-0.5" width="7.0" height="1.0" rx="0.25" fill="#78350f" stroke="#451a03" strokeWidth="0.2" />
            <rect x="-3.3" y="-0.4" width="6.6" height="0.6" rx="0.15" fill="#d97706" />
            <line x1="-3.0" y1="-0.1" x2="3.0" y2="-0.1" stroke="#fef3c7" strokeWidth="0.15" opacity="0.6" />
          </g>
        );
      case 'trampoline':
        return (
          <g>
            <ellipse cx="0.4" cy="0.4" rx="2.7" ry="2.7" fill="rgba(0,0,0,0.28)" />
            <circle cx="0" cy="0" r="2.6" fill="#1e293b" stroke="#0f172a" strokeWidth="0.2" />
            <circle cx="0" cy="0" r="2.35" fill="#0284c7" />
            <circle cx="0" cy="0" r="1.85" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.25" />
            <circle cx="0" cy="0" r="1.7" fill="#0369a1" stroke="#bae6fd" strokeWidth="0.15" strokeDasharray="0.5,0.5" />
          </g>
        );
      case 'mat':
        return (
          <g>
            <rect x="-3.7" y="-1.9" width="7.4" height="3.8" rx="0.35" fill="rgba(0,0,0,0.22)" />
            <rect x="-3.5" y="-1.7" width="7.0" height="3.4" rx="0.25" fill="#1e3a8a" stroke="#172554" strokeWidth="0.2" />
            <rect x="-3.3" y="-1.5" width="6.6" height="3.0" rx="0.2" fill="#2563eb" />
            <rect x="-3.1" y="-1.3" width="6.2" height="2.6" fill="none" stroke="#60a5fa" strokeWidth="0.15" strokeDasharray="0.8,0.8" opacity="0.7" />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <g
      transform={`translate(${obj.x}, ${obj.y}) rotate(${rot}) scale(${s})`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className="cursor-grab active:cursor-grabbing touch-none select-none"
    >
      {renderContent()}
    </g>
  );
}

function WhatsAppButton({ phone, label = '', name = '', customMessage = '' }) {
  if (!phone) return <span className="text-[10px] text-zinc-600 italic">Sin WhatsApp</span>;
  const num = phone.replace(/[^0-9]/g, '');
  const finalNum = num.startsWith('56') ? num : `56${num}`;
  const defMsg = `Hola ${name || ''}, te contacto desde Andez Sports Tactics Pro.`;
  const msg = encodeURIComponent(customMessage || defMsg);
  return (
    <a href={`https://wa.me/${finalNum}?text=${msg}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow transition active:scale-95">
      <MessageCircle className="w-3.5 h-3.5" />
      <span>{label || phone}</span>
    </a>
  );
}

// ===== RED DE PORTERÍA PROCEDURAL (sin imágenes externas) =====
// Malla romboidal con nudos dibujada en un canvas; se usa como alphaMap para que solo se vean los hilos.
const NET_CELL = 0.35; // tamaño de cada rombo de la red en metros (sube el valor para hilos más gruesos a la distancia)
let _netCanvas = null;
function getNetCanvas() {
  if (_netCanvas) return _netCanvas;
  const S = 64;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  // Rombo que conecta los puntos medios de los bordes: el patrón teselado forma la malla continua.
  ctx.moveTo(0, S / 2); ctx.lineTo(S / 2, 0);
  ctx.moveTo(S / 2, 0); ctx.lineTo(S, S / 2);
  ctx.moveTo(S, S / 2); ctx.lineTo(S / 2, S);
  ctx.moveTo(S / 2, S); ctx.lineTo(0, S / 2);
  ctx.stroke();
  // Nudos en los cruces
  ctx.fillStyle = '#ffffff';
  [[0, S / 2], [S, S / 2], [S / 2, 0], [S / 2, S]].forEach(([x, y]) => {
    ctx.beginPath(); ctx.arc(x, y, 3.6, 0, Math.PI * 2); ctx.fill();
  });
  _netCanvas = c;
  return c;
}

function NetPanel({ position, rotation = [0, 0, 0], width, height }) {
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(getNetCanvas());
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(width / NET_CELL, height / NET_CELL);
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  }, [width, height]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        color="#f1f5f9"
        alphaMap={texture}
        transparent
        alphaTest={0.04}
        side={THREE.DoubleSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

// MOTOR 3D
function Pitch3D() {
  const lineMat = <meshBasicMaterial color="#ffffff" toneMapped={false} />;
  const postMat = <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.05} />;
  const stripeGrassTex = useMemo(() => getGrassTexture(2, 17), []);
  const outerGrassTex = useMemo(() => getGrassTexture(29, 19), []);

  const line = (x, z, w, d, key) => (
    <mesh key={key} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.035, z]}>
      <planeGeometry args={[w, d]} />
      {lineMat}
    </mesh>
  );

  // Cuadrante de córner hacia el INTERIOR de la cancha.
  // El mesh se rota -PI/2 en X, por eso el ángulo local θ del anillo cae en el mundo como (x = cosθ, z = -sinθ).
  // Dirección hacia el interior desde el vértice (x, z): (-sign(x), -sign(z))  ->  θ_medio = atan2(sign(z), -sign(x)).
  // El arco de 90° se centra en esa dirección:  startAngle = θ_medio - PI/4.
  //   [-52.5,-34] -> -PI/2   [-52.5, 34] -> 0   [52.5,-34] -> PI (=-PI)   [52.5, 34] -> PI/2
  const corner = (x, z, key) => {
    const startAngle = Math.atan2(Math.sign(z), -Math.sign(x)) - Math.PI / 4;
    return (
      <mesh key={key} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.036, z]}>
        <ringGeometry args={[0.92, 1.04, 32, 1, startAngle, Math.PI / 2]} />
        {lineMat}
      </mesh>
    );
  };

  // Banderines de córner oficiales
  const flag = (x, z, rotY, key) => (
    <group key={key} position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 1.6, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>
      <mesh position={[0.26, 1.4, 0]}>
        <boxGeometry args={[0.48, 0.32, 0.02]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} />
      </mesh>
    </group>
  );

  // Portería profesional FIFA 7.32 x 2.44 m (marco trasero inclinado y red tensada): ver <GoalFrame />
  const goal = (xPos, isLeft) => <GoalFrame key={`goal-${xPos}`} xPos={xPos} dir={isLeft ? -1 : 1} />;

  return (
    <group>
      {/* Césped perimetral exterior */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[116, 78]} />
        <meshStandardMaterial color="#1f6b30" roughness={0.92} map={outerGrassTex} />
      </mesh>

      {/* Franjas reglamentarias de césped (14 bandas de 7.5 m) */}
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh
          key={`stripe-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-52.5 + i * 7.5 + 3.75, 0.005, 0]}
          receiveShadow
        >
          <planeGeometry args={[7.5, 68]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#2a8a3c' : '#237532'} roughness={0.88} map={stripeGrassTex} />
        </mesh>
      ))}

      {/* LÍNEAS DE BANDA Y FONDO (105m x 68m) */}
      {line(0, -34, 105, 0.12, 'touch-top')}
      {line(0, 34, 105, 0.12, 'touch-bottom')}
      {line(-52.5, 0, 0.12, 68, 'goal-left')}
      {line(52.5, 0, 0.12, 68, 'goal-right')}

      {/* MEDIO CAMPO Y CÍRCULO CENTRAL (Radio 9.15 m) */}
      {line(0, 0, 0.12, 68, 'halfway')}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.036, 0]}>
        <ringGeometry args={[9.09, 9.21, 64]} />
        {lineMat}
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.037, 0]}>
        <circleGeometry args={[0.22, 24]} />
        {lineMat}
      </mesh>

      {/* ÁREAS LADO IZQUIERDO */}
      {line(-44.25, -20.16, 16.5, 0.12, 'pa-top-l')}
      {line(-44.25, 20.16, 16.5, 0.12, 'pa-bottom-l')}
      {line(-36.0, 0, 0.12, 40.32, 'pa-front-l')}
      {line(-49.75, -9.16, 5.5, 0.12, 'ga-top-l')}
      {line(-49.75, 9.16, 5.5, 0.12, 'ga-bottom-l')}
      {line(-47.0, 0, 0.12, 18.32, 'ga-front-l')}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-41.5, 0.037, 0]}>
        <circleGeometry args={[0.2, 20]} />
        {lineMat}
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, -0.925]} position={[-41.5, 0.036, 0]}>
        <ringGeometry args={[9.09, 9.21, 36, 1, 0, 1.85]} />
        {lineMat}
      </mesh>

      {/* ÁREAS LADO DERECHO */}
      {line(44.25, -20.16, 16.5, 0.12, 'pa-top-r')}
      {line(44.25, 20.16, 16.5, 0.12, 'pa-bottom-r')}
      {line(36.0, 0, 0.12, 40.32, 'pa-front-r')}
      {line(49.75, -9.16, 5.5, 0.12, 'ga-top-r')}
      {line(49.75, 9.16, 5.5, 0.12, 'ga-bottom-r')}
      {line(47.0, 0, 0.12, 18.32, 'ga-front-r')}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[41.5, 0.037, 0]}>
        <circleGeometry args={[0.2, 20]} />
        {lineMat}
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 2.215]} position={[41.5, 0.036, 0]}>
        <ringGeometry args={[9.09, 9.21, 36, 1, 0, 1.85]} />
        {lineMat}
      </mesh>

      {/* 4 CÓRNERS INTERNOS REGLAMENTARIOS (startAngle calculado dentro de corner(), siempre hacia el césped) */}
      {corner(-52.5, -34, 'c-tl')}
      {corner(-52.5, 34, 'c-bl')}
      {corner(52.5, -34, 'c-tr')}
      {corner(52.5, 34, 'c-br')}

      {/* BANDERINES DE CÓRNER */}
      {flag(-52.5, -34, 0.4, 'f-tl')}
      {flag(-52.5, 34, -0.4, 'f-bl')}
      {flag(52.5, -34, 2.7, 'f-tr')}
      {flag(52.5, 34, -2.7, 'f-br')}

      {/* PORTERÍAS PROFESIONALES TIPO CAJÓN FIFA */}
      {goal(-52.5, true)}
      {goal(52.5, false)}
    </group>
  );
}

// ===== JUGADOR TÁCTICO PROCEDURAL v2 (siluetas orgánicas, sin archivos externos) =====
// Cada extremidad es una superficie "loft": una malla suave barrida a lo largo del hueso con secciones elípticas
// de radio variable (músculo, rodilla, gemelo, bíceps...). Todo se fusiona en pocas mallas por rol -> ~10 draw calls/jugador.
// Origen local = [0,0,0] en la planta de los pies. El <group> padre de Scene3D ya lo posiciona en la cancha.
const SELECTOR_COLOR = '#facc15'; // aro/disco del selector (dorado). Para azul: '#2563eb'
const PLAYER_HEIGHT_M = 1.8;      // altura real del jugador de campo erguido
const PLAYER_ANKLE = 0.08;        // altura del tobillo sobre el césped
const PLAYER_THIGH = 0.42;        // cadera -> rodilla
const PLAYER_SHIN = 0.42;         // rodilla -> tobillo
const PLAYER_HIP_DROP = 0.03;     // la articulación de la cadera queda 3 cm bajo el centro de la pelvis
const PLAYER_SKINS = ['#d9a47e', '#b9825f', '#8d5a3b', '#f0c29b', '#6f4630', '#a47551', '#fadcc0', '#c58c63'];
const PLAYER_HAIRS = ['#1c1411', '#3a2a1f', '#5a3d2b', '#2b2b2b', '#7a4a28', '#a8703a', '#d4b06a'];

const _playerMatCache = new Map();
function playerStdMat(color, roughness = 0.7, metalness = 0) {
  const key = `${color}|${roughness}|${metalness}`;
  if (!_playerMatCache.has(key)) {
    _playerMatCache.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
  }
  return _playerMatCache.get(key);
}

function playerHexLuma(hex) {
  let h = String(hex || '#2563eb').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  h = h.padEnd(6, '0');
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Flexión de rodilla (beta) para que el pie quede a ras de césped dado el alto de cadera y la flexión del muslo (alpha)
function solvePlayerKnee(hipY, alpha) {
  const c = (hipY - PLAYER_HIP_DROP - PLAYER_ANKLE - PLAYER_THIGH * Math.cos(alpha)) / PLAYER_SHIN;
  return alpha + Math.acos(Math.min(1, Math.max(-1, c)));
}

// ---------- Superficies loft ----------
// Sección: u = posición a lo largo del eje, a/b = semiejes de la elipse, ca/cb = desplazamiento del centro de la elipse
const PK = (u, a, b, ca = 0, cb = 0) => ({ u, a, b, ca, cb });

function playerCatmull(p0, p1, p2, p3, t) {
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
}

function playerProfileAt(keys, u) {
  let i = 0;
  while (i < keys.length - 2 && u > keys[i + 1].u) i++;
  const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(keys.length - 1, i + 2)];
  const span = k2.u - k1.u;
  const t = span > 0 ? Math.min(1, Math.max(0, (u - k1.u) / span)) : 0;
  const f = (n) => playerCatmull(k0[n], k1[n], k2[n], k3[n], t);
  return { u, a: Math.max(0.002, f('a')), b: Math.max(0.002, f('b')), ca: f('ca'), cb: f('cb') };
}

// Recorta un tramo del perfil (opcionalmente "inflado" para prendas que cubren la piel)
function playerSlice(keys, u0, u1, n, inflate = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = playerProfileAt(keys, u0 + ((u1 - u0) * i) / (n - 1));
    out.push(PK(p.u, p.a + inflate, p.b + inflate, p.ca, p.cb));
  }
  return out;
}

// axis: '+y' (hacia arriba), '-y' (hacia abajo; u crece hacia abajo), '+z' (hacia adelante)
function playerLoft(axis, keys, opts = {}) {
  const rings = opts.rings || 10;
  const seg = opts.seg || 12;
  const stride = seg + 1; // la última columna duplica la primera para tener UV continuas
  const u0 = keys[0].u;
  const u1 = keys[keys.length - 1].u;
  const pt = (p, th) => {
    const x = p.ca + p.a * Math.cos(th);
    const y = p.cb + p.b * Math.sin(th);
    if (axis === '+y') return [x, p.u, y];
    if (axis === '-y') return [x, -p.u, y];
    return [x, y, p.u];
  };
  const pos = [];
  const uv = [];
  for (let i = 0; i < rings; i++) {
    const lin = rings === 1 ? 0 : i / (rings - 1);
    const s = 0.5 * lin + 0.5 * (0.5 - 0.5 * Math.cos(Math.PI * lin)); // más anillos hacia los extremos
    const p = playerProfileAt(keys, u0 + (u1 - u0) * s);
    for (let j = 0; j <= seg; j++) {
      const v = pt(p, (2 * Math.PI * (j % seg)) / seg);
      pos.push(v[0], v[1], v[2]);
      uv.push(j / seg, lin);
    }
  }
  const idx = [];
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < seg; j++) {
      const a = i * stride + j;
      const b = a + 1;
      const c = (i + 1) * stride + j;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  if (opts.capStart) {
    const p0 = playerProfileAt(keys, u0);
    const c = pt({ ...p0, a: 0, b: 0 }, 0);
    const ci = pos.length / 3;
    pos.push(c[0], c[1], c[2]); uv.push(0.5, 0);
    for (let j = 0; j < seg; j++) idx.push(j, j + 1, ci);
  }
  if (opts.capEnd) {
    const p1 = playerProfileAt(keys, u1);
    const c = pt({ ...p1, a: 0, b: 0 }, 0);
    const ci = pos.length / 3;
    pos.push(c[0], c[1], c[2]); uv.push(0.5, 1);
    const base = (rings - 1) * stride;
    for (let j = 0; j < seg; j++) idx.push(base + j + 1, base + j, ci);
  }
  // En '+y' el orden (a,c,b) mira hacia afuera; en los otros ejes hay que invertirlo
  if (axis !== '+y') {
    for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
  }
  // Normales suaves (área ponderada); la columna de costura comparte normal con la columna 0
  const ringVerts = rings * stride;
  const canon = (vi) => (vi < ringVerts && vi % stride === seg ? vi - seg : vi);
  const nor = new Float32Array(pos.length);
  for (let k = 0; k < idx.length; k += 3) {
    const ia = idx[k] * 3, ib = idx[k + 1] * 3, ic = idx[k + 2] * 3;
    const ux = pos[ib] - pos[ia], uy = pos[ib + 1] - pos[ia + 1], uz = pos[ib + 2] - pos[ia + 2];
    const vx = pos[ic] - pos[ia], vy = pos[ic + 1] - pos[ia + 1], vz = pos[ic + 2] - pos[ia + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    [idx[k], idx[k + 1], idx[k + 2]].forEach((vi) => {
      const o = canon(vi) * 3;
      nor[o] += nx; nor[o + 1] += ny; nor[o + 2] += nz;
    });
  }
  for (let o = 0; o < nor.length; o += 3) {
    const l = Math.hypot(nor[o], nor[o + 1], nor[o + 2]) || 1;
    nor[o] /= l; nor[o + 1] /= l; nor[o + 2] /= l;
  }
  for (let i = 0; i < rings; i++) {
    const from = (i * stride) * 3;
    const to = (i * stride + seg) * 3;
    nor[to] = nor[from]; nor[to + 1] = nor[from + 1]; nor[to + 2] = nor[from + 2];
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(new THREE.BufferAttribute(new Uint16Array(idx), 1));
  return g;
}

// Elipsoide suave (articulaciones, deltoides, nariz, orejas...)
function playerEllipsoid(rx, ry, rz, seg = 10, rings = 9) {
  const keys = [];
  for (let i = 0; i <= 8; i++) {
    const th = (Math.PI * i) / 8;
    keys.push(PK(-ry * Math.cos(th), rx * Math.sin(th), rz * Math.sin(th)));
  }
  return playerLoft('+y', keys, { rings, seg, capStart: true, capEnd: true });
}

// Fusiona geometrías (position + normal + uv + index) en una sola
function mergePlayerGeos(list) {
  let vCount = 0;
  let iCount = 0;
  list.forEach((g) => {
    vCount += g.attributes.position.count;
    iCount += g.index ? g.index.count : g.attributes.position.count;
  });
  const pos = new Float32Array(vCount * 3);
  const nor = new Float32Array(vCount * 3);
  const uvs = new Float32Array(vCount * 2);
  const idx = vCount > 65000 ? new Uint32Array(iCount) : new Uint16Array(iCount);
  let vOff = 0;
  let iOff = 0;
  list.forEach((g) => {
    const p = g.attributes.position;
    const n = g.attributes.normal;
    const t = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      pos[(vOff + i) * 3] = p.getX(i); pos[(vOff + i) * 3 + 1] = p.getY(i); pos[(vOff + i) * 3 + 2] = p.getZ(i);
      nor[(vOff + i) * 3] = n.getX(i); nor[(vOff + i) * 3 + 1] = n.getY(i); nor[(vOff + i) * 3 + 2] = n.getZ(i);
      if (t) { uvs[(vOff + i) * 2] = t.getX(i); uvs[(vOff + i) * 2 + 1] = t.getY(i); }
    }
    if (g.index) {
      for (let i = 0; i < g.index.count; i++) idx[iOff + i] = g.index.getX(i) + vOff;
      iOff += g.index.count;
    } else {
      for (let i = 0; i < p.count; i++) idx[iOff + i] = vOff + i;
      iOff += p.count;
    }
    vOff += p.count;
  });
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.setIndex(new THREE.BufferAttribute(idx, 1));
  return merged;
}

// ---------- Perfiles anatómicos (metros; el modelo mira hacia +Z) ----------
const P_THIGH = [PK(0, 0.090, 0.096), PK(0.07, 0.098, 0.104, 0, 0.004), PK(0.18, 0.094, 0.100, 0, 0.010), PK(0.30, 0.078, 0.084, 0, 0.010), PK(0.39, 0.062, 0.068, 0, 0.007), PK(0.42, 0.058, 0.062, 0, 0.004)];
const P_SHORTS_LEG = [PK(0, 0.098, 0.104, 0, 0.004), PK(0.04, 0.110, 0.115, 0, 0.006), PK(0.12, 0.112, 0.118, 0, 0.010), PK(0.20, 0.110, 0.116, 0, 0.013), PK(0.25, 0.107, 0.113, 0, 0.013), PK(0.272, 0.103, 0.109, 0, 0.012)];
const P_PELVIS = [PK(-0.11, 0.128, 0.094), PK(-0.06, 0.158, 0.110), PK(0, 0.164, 0.112), PK(0.05, 0.158, 0.110), PK(0.10, 0.144, 0.102), PK(0.12, 0.140, 0.100)];
const P_SHIN = [PK(0, 0.066, 0.070), PK(0.06, 0.068, 0.075, 0, -0.004), PK(0.13, 0.074, 0.082, 0, -0.010), PK(0.22, 0.062, 0.066, 0, -0.006), PK(0.32, 0.048, 0.050, 0, -0.002), PK(0.40, 0.043, 0.046), PK(0.42, 0.043, 0.045)];
const P_BOOT = [PK(-0.075, 0.032, 0.045, 0, -0.036), PK(-0.05, 0.044, 0.052, 0, -0.028), PK(0.02, 0.048, 0.050, 0, -0.030), PK(0.10, 0.053, 0.040, 0, -0.040), PK(0.17, 0.045, 0.031, 0, -0.049), PK(0.205, 0.027, 0.022, 0, -0.054)];
const P_SOLE = [PK(-0.078, 0.031, 0.012, 0, -0.072), PK(-0.05, 0.044, 0.012, 0, -0.072), PK(0.02, 0.049, 0.012, 0, -0.072), PK(0.10, 0.054, 0.012, 0, -0.074), PK(0.17, 0.046, 0.011, 0, -0.074), PK(0.21, 0.028, 0.010, 0, -0.072)];
const P_TORSO = [PK(0.02, 0.176, 0.130, 0, -0.002), PK(0.10, 0.150, 0.118), PK(0.21, 0.160, 0.120, 0, 0.005), PK(0.32, 0.190, 0.128, 0, 0.012), PK(0.42, 0.212, 0.136, 0, 0.018), PK(0.50, 0.214, 0.128, 0, 0.008), PK(0.565, 0.160, 0.100, 0, 0.004), PK(0.60, 0.088, 0.078), PK(0.62, 0.064, 0.064)];
const P_NECK = [PK(0.56, 0.060, 0.062), PK(0.66, 0.052, 0.056, 0, 0.006), PK(0.72, 0.050, 0.054, 0, 0.008)];
const P_COLLAR = [PK(0.585, 0.086, 0.084, 0, 0.003), PK(0.60, 0.080, 0.078, 0, 0.004), PK(0.625, 0.070, 0.070, 0, 0.005)];
const P_HEAD = [PK(0, 0.028, 0.040, 0, 0.045), PK(0.025, 0.060, 0.070, 0, 0.035), PK(0.06, 0.078, 0.088, 0, 0.020), PK(0.105, 0.083, 0.097, 0, 0.010), PK(0.15, 0.084, 0.100, 0, 0.005), PK(0.19, 0.076, 0.092), PK(0.22, 0.050, 0.065, 0, -0.005), PK(0.23, 0.020, 0.030, 0, -0.008)];
const P_HAIR = [PK(0.085, 0.090, 0.104, 0, -0.030), PK(0.13, 0.091, 0.104, 0, -0.014), PK(0.165, 0.086, 0.102, 0, -0.002), PK(0.20, 0.074, 0.092, 0, -0.004), PK(0.225, 0.048, 0.064, 0, -0.008), PK(0.236, 0.022, 0.030)];
const P_ARM = [PK(0, 0.058, 0.060), PK(0.06, 0.064, 0.066), PK(0.14, 0.057, 0.061, 0, 0.004), PK(0.24, 0.045, 0.047), PK(0.30, 0.039, 0.041)];
const P_FOREARM = [PK(0, 0.039, 0.041), PK(0.06, 0.044, 0.044), PK(0.16, 0.037, 0.036), PK(0.25, 0.026, 0.023), PK(0.28, 0.025, 0.021)];
const P_PALM = [PK(0, 0.020, 0.034), PK(0.04, 0.018, 0.041), PK(0.085, 0.014, 0.040)];

// ---------- Construcción del modelo (una vez por rol) ----------
const _playerModelCache = {};
function getPlayerModel(isGK) {
  const cacheKey = isGK ? 'gk' : 'field';
  if (_playerModelCache[cacheKey]) return _playerModelCache[cacheKey];

  // Postura por rol: portero en "posición de espera" (rodillas flexionadas, brazos abiertos y listos), campo erguido y dinámico
  const pose = isGK
    ? { hipY: 0.8, lean: 0.18, legX: 0.13, abd: 0.06, alphaL: 0.5, alphaR: 0.5, armX: [-0.45, -0.45], armZ: 0.55, elbow: [0.6, 0.6], headTilt: 0.9 }
    : { hipY: 0.92, lean: 0.06, legX: 0.09, abd: 0.03, alphaL: 0.28, alphaR: -0.1, armX: [-0.28, 0.22], armZ: 0.12, elbow: [0.85, 0.6], headTilt: 0.8 };

  const root = new THREE.Group();
  const node = (parent, pos, rot, scl) => {
    const g = new THREE.Group();
    if (pos) g.position.set(pos[0], pos[1], pos[2]);
    if (rot) g.rotation.set(rot[0], rot[1], rot[2]);
    if (scl) g.scale.set(scl, scl, scl);
    parent.add(g);
    return g;
  };
  const part = (parent, slot, geo, pos, rot) => {
    const m = new THREE.Mesh(geo);
    m.userData.slot = slot;
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    parent.add(m);
    return m;
  };

  const hips = node(root, [0, pose.hipY, 0]);
  part(hips, 'shorts', playerLoft('+y', P_PELVIS, { rings: 8, seg: 18, capStart: true }));

  // Piernas
  [-1, 1].forEach((side) => {
    const alpha = side < 0 ? pose.alphaL : pose.alphaR;
    const beta = solvePlayerKnee(pose.hipY, alpha);
    const hip = node(hips, [side * pose.legX, -PLAYER_HIP_DROP, 0], [-alpha, 0, side * pose.abd]);
    part(hip, 'skin', playerLoft('-y', P_THIGH, { rings: 9, seg: 14, capStart: true, capEnd: true }));
    part(hip, 'shorts', playerLoft('-y', P_SHORTS_LEG, { rings: 8, seg: 16, capStart: true }));
    const knee = node(hip, [0, -PLAYER_THIGH, 0], [beta, 0, 0]);
    part(knee, 'skin', playerEllipsoid(0.066, 0.066, 0.07, 10, 9));
    part(knee, 'skin', playerLoft('-y', playerSlice(P_SHIN, 0, 0.09, 4), { rings: 4, seg: 14, capEnd: true }));
    part(knee, 'sock', playerLoft('-y', playerSlice(P_SHIN, 0.075, 0.42, 9, 0.003), { rings: 10, seg: 14, capEnd: true }));
    part(knee, 'ribete', playerLoft('-y', playerSlice(P_SHIN, 0.06, 0.11, 3, 0.008), { rings: 3, seg: 14 }));
    const foot = node(knee, [0, -PLAYER_SHIN, 0], [alpha - beta, 0, 0]);
    part(foot, 'boot', playerLoft('+z', P_BOOT, { rings: 10, seg: 14, capStart: true, capEnd: true }));
    part(foot, 'sole', playerLoft('+z', P_SOLE, { rings: 8, seg: 12, capStart: true, capEnd: true }));
  });

  // Torso con caída en V, cuello y cabeza
  const torso = node(hips, [0, 0, 0], [pose.lean, 0, 0]);
  part(torso, 'jersey', playerLoft('+y', P_TORSO, { rings: 16, seg: 22, capEnd: true }));
  part(torso, 'collar', playerLoft('+y', P_COLLAR, { rings: 3, seg: 18 }));
  part(torso, 'skin', playerLoft('+y', P_NECK, { rings: 4, seg: 12 }));

  const head = node(torso, [0, 0.7, 0.015], [-pose.lean * pose.headTilt, 0, 0]);
  part(head, 'skin', playerLoft('+y', P_HEAD, { rings: 14, seg: 20, capStart: true, capEnd: true }));
  // Pelo: casquete + mechones con caída natural hacia atrás/arriba
  part(head, 'hair', playerLoft('+y', P_HAIR, { rings: 8, seg: 20, capEnd: true }));
  // [x, y, z, inclinación X (adelante +), inclinación Z, largo, ancho]
  const tufts = [
    [-0.05, 0.205, 0.07, 1.05, 0.2, 0.04, 0.022], [-0.016, 0.21, 0.074, 1.1, 0.05, 0.042, 0.022], [0.016, 0.21, 0.074, 1.1, -0.05, 0.042, 0.022], [0.05, 0.205, 0.07, 1.05, -0.2, 0.04, 0.022],
    [-0.078, 0.18, 0.03, 0.1, 1.15, 0.036, 0.02], [0.078, 0.18, 0.03, 0.1, -1.15, 0.036, 0.02],
    [-0.035, 0.228, 0.0, -0.55, 0.2, 0.045, 0.024], [0.035, 0.228, 0.0, -0.55, -0.2, 0.045, 0.024], [0.0, 0.232, -0.02, -0.6, 0, 0.046, 0.025],
    [-0.055, 0.2, -0.07, -1.0, 0.25, 0.045, 0.023], [0.0, 0.205, -0.085, -1.1, 0, 0.05, 0.025], [0.055, 0.2, -0.07, -1.0, -0.25, 0.045, 0.023],
    [-0.07, 0.14, -0.065, -0.8, 0.5, 0.04, 0.02], [0.07, 0.14, -0.065, -0.8, -0.5, 0.04, 0.02], [0.0, 0.12, -0.09, -1.0, 0, 0.04, 0.022],
  ];
  tufts.forEach(([x, y, z, rx, rz, len, w]) => {
    part(head, 'hair', playerLoft('+y', [PK(0, w, w * 0.8), PK(len * 0.5, w * 0.9, w * 0.7), PK(len, w * 0.2, w * 0.15)], { rings: 4, seg: 6, capEnd: true }), [x, y, z], [rx, 0, rz]);
  });
  // Superficie frontal de la cabeza a la altura y (y lateral x): sirve para apoyar ojos, nariz y boca sin enterrarlos
  const headZ = (y, x = 0) => {
    const p = playerProfileAt(P_HEAD, y);
    const k = 1 - ((x - p.ca) / p.a) * ((x - p.ca) / p.a);
    return p.cb + p.b * Math.sqrt(Math.max(0, k));
  };
  [-1, 1].forEach((sd) => {
    const ex = sd * 0.034;
    part(head, 'hair', playerEllipsoid(0.01, 0.03, 0.02, 6, 5), [sd * 0.082, 0.12, 0.03]);                              // patillas
    part(head, 'skin', playerEllipsoid(0.011, 0.027, 0.018, 8, 7), [sd * 0.083, 0.1, -0.004]);                          // orejas
    part(head, 'sclera', playerEllipsoid(0.0115, 0.0072, 0.0045, 8, 6), [ex, 0.128, headZ(0.128, ex) + 0.0015]);        // esclerótica
    part(head, 'hair', playerEllipsoid(0.0062, 0.0062, 0.0035, 6, 5), [ex + sd * 0.0008, 0.128, headZ(0.128, ex) + 0.0042]); // iris
    part(head, 'hair', playerEllipsoid(0.024, 0.0048, 0.007, 6, 5), [sd * 0.037, 0.152, headZ(0.152, sd * 0.037) + 0.001], [0.1, 0, -sd * 0.18]); // cejas
    part(head, 'skin', playerEllipsoid(0.0085, 0.0075, 0.0085, 6, 5), [sd * 0.0125, 0.082, headZ(0.082, sd * 0.0125) + 0.004]);       // aletas de la nariz
  });
  part(head, 'skin', playerEllipsoid(0.0095, 0.024, 0.016, 8, 7), [0, 0.1, headZ(0.1) + 0.006], [0.28, 0, 0]);          // puente y punta de la nariz
  part(head, 'lip', playerEllipsoid(0.022, 0.0048, 0.0075, 8, 6), [0, 0.0605, headZ(0.0605) + 0.0012], [0.1, 0, 0]);    // labio superior
  part(head, 'lip', playerEllipsoid(0.019, 0.0052, 0.0075, 8, 6), [0, 0.0525, headZ(0.0525) + 0.0012], [0.1, 0, 0]);    // labio inferior
  part(head, 'hair', playerEllipsoid(0.021, 0.0013, 0.004, 8, 5), [0, 0.0567, headZ(0.0567) + 0.0035]);                 // línea de la boca

  // Brazos con codos semi-doblados y manos con dedos
  [-1, 1].forEach((side) => {
    const i = side < 0 ? 0 : 1;
    const shoulder = node(torso, [side * 0.205, 0.515, 0], [pose.armX[i], 0, side * pose.armZ]);
    part(shoulder, 'jersey', playerEllipsoid(0.057, 0.062, 0.056, 10, 9));                                      // deltoides
    part(shoulder, 'jersey', playerLoft('-y', playerSlice(P_ARM, 0, 0.17, 5, 0.007), { rings: 6, seg: 14, capStart: true }));
    part(shoulder, 'collar', playerLoft('-y', playerSlice(P_ARM, 0.15, 0.185, 3, 0.011), { rings: 3, seg: 14 })); // puño de manga
    part(shoulder, 'skin', playerLoft('-y', playerSlice(P_ARM, 0.12, 0.3, 6), { rings: 6, seg: 12, capStart: true, capEnd: true }));
    const elbow = node(shoulder, [0, -0.3, 0], [-pose.elbow[i], 0, 0]);
    part(elbow, 'skin', playerEllipsoid(0.042, 0.042, 0.044, 8, 7));
    part(elbow, 'skin', playerLoft('-y', P_FOREARM, { rings: 8, seg: 12, capStart: true, capEnd: true }));

    // Mano: palma + 4 dedos (2 falanges) + pulgar. El arquero usa guantes (más grandes) con puño oscuro.
    const handSlot = isGK ? 'glove' : 'skin';
    if (isGK) part(elbow, 'boot', playerLoft('-y', playerSlice(P_FOREARM, 0.17, 0.27, 3, 0.008), { rings: 3, seg: 12 }));
    const hand = node(elbow, [0, -0.275, 0], [0, 0, 0], isGK ? 1.18 : 1);
    part(hand, handSlot, playerLoft('-y', P_PALM, { rings: 5, seg: 10, capStart: true, capEnd: true }));
    const L1 = [0.042, 0.047, 0.044, 0.034];
    const L2 = [0.03, 0.034, 0.031, 0.025];
    for (let k = 0; k < 4; k++) {
      const zOff = -0.0285 + k * 0.019;
      const f1 = node(hand, [0, -0.085, zOff], [0, 0, -side * 0.2]);
      part(f1, handSlot, playerLoft('-y', [PK(0, 0.009, 0.009), PK(L1[k], 0.0075, 0.0075)], { rings: 3, seg: 7, capStart: true, capEnd: true }));
      const f2 = node(f1, [0, -L1[k], 0], [0, 0, -side * 0.45]);
      part(f2, handSlot, playerLoft('-y', [PK(0, 0.0075, 0.0075), PK(L2[k], 0.0058, 0.0058)], { rings: 3, seg: 7, capStart: true, capEnd: true }));
    }
    const t1 = node(hand, [0, -0.02, 0.034], [-0.75, 0, 0]);
    part(t1, handSlot, playerLoft('-y', [PK(0, 0.012, 0.012), PK(0.038, 0.009, 0.009)], { rings: 3, seg: 7, capStart: true, capEnd: true }));
    const t2 = node(t1, [0, -0.038, 0], [-0.35, 0, 0]);
    part(t2, handSlot, playerLoft('-y', [PK(0, 0.009, 0.009), PK(0.03, 0.007, 0.007)], { rings: 3, seg: 7, capStart: true, capEnd: true }));
  });

  // Hornear jerarquía -> mallas fusionadas por material
  root.updateMatrixWorld(true);
  const buckets = {};
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.applyMatrix4(o.matrixWorld);
    (buckets[o.userData.slot] = buckets[o.userData.slot] || []).push(o.geometry);
  });
  const geos = {};
  let minY = Infinity;
  let maxY = -Infinity;
  Object.keys(buckets).forEach((slot) => {
    const g = mergePlayerGeos(buckets[slot]);
    buckets[slot].forEach((src) => src.dispose());
    g.computeBoundingBox();
    minY = Math.min(minY, g.boundingBox.min.y);
    maxY = Math.max(maxY, g.boundingBox.max.y);
    geos[slot] = g;
  });
  // Apoyar exactamente la suela más baja en y = 0
  Object.keys(geos).forEach((slot) => {
    geos[slot].translate(0, -minY, 0);
    geos[slot].computeBoundingBox();
    geos[slot].computeBoundingSphere();
  });

  const model = { geos, hipY: pose.hipY - minY, lean: pose.lean, height: maxY - minY };
  _playerModelCache[cacheKey] = model;
  return model;
}

// Camiseta con rayas tono sobre tono: textura procedural cacheada por color
const _jerseyMatCache = new Map();
function getJerseyMaterial(color) {
  if (_jerseyMatCache.has(color)) return _jerseyMatCache.get(color);
  const base = new THREE.Color(color);
  const alt = base.clone().offsetHSL(0, 0, playerHexLuma(color) > 0.6 ? -0.07 : 0.07);
  const c = document.createElement('canvas');
  c.width = 64; c.height = 8;
  const ctx = c.getContext('2d');
  ctx.fillStyle = `#${base.getHexString()}`; ctx.fillRect(0, 0, 32, 8);
  ctx.fillStyle = `#${alt.getHexString()}`; ctx.fillRect(32, 0, 32, 8);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(5, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  _jerseyMatCache.set(color, mat);
  return mat;
}

// Dorsal procedural: textura de canvas cacheada por número y contraste (sin <Html>, sin DOM)
const _playerNumMatCache = new Map();
function getPlayerNumberMaterial(number, darkText) {
  const label = String(number ?? '');
  const key = `${label}|${darkText ? 'd' : 'l'}`;
  if (_playerNumMatCache.has(key)) return _playerNumMatCache.get(key);
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${label.length > 1 ? 80 : 100}px Arial, Helvetica, sans-serif`;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 9;
  ctx.strokeStyle = darkText ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.65)';
  ctx.strokeText(label, 64, 68);
  ctx.fillStyle = darkText ? '#111827' : '#ffffff';
  ctx.fillText(label, 64, 68);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1 });
  _playerNumMatCache.set(key, mat);
  return mat;
}

// Número flotante sobre la cabeza (sprite que siempre mira a la cámara; sin <Text>, así no se pide ninguna fuente a internet)
const _numSpriteCache = new Map();
function getNumberSpriteMaterial(number) {
  const label = String(number ?? '');
  if (_numSpriteCache.has(label)) return _numSpriteCache.get(label);
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${label.length > 1 ? 78 : 96}px Arial, Helvetica, sans-serif`;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 12;
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.strokeText(label, 64, 68);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, 64, 68);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
  _numSpriteCache.set(label, mat);
  return mat;
}

// El jugador de campo erguido mide exactamente PLAYER_HEIGHT_M (1.80 m) en el mundo (la cancha está en metros reales)
function getPlayerScale() {
  return PLAYER_HEIGHT_M / getPlayerModel(false).height;
}

// Sombra de contacto + selector táctico amarillo (comunes al jugador GLB y al procedural)
function PlayerGroundMarks({ isSelected }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <circleGeometry args={[0.5, 28]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.32} depthWrite={false} />
      </mesh>
      {isSelected && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
            <circleGeometry args={[0.85, 40]} />
            <meshBasicMaterial color={SELECTOR_COLOR} transparent opacity={0.35} depthWrite={false} toneMapped={false} polygonOffset polygonOffsetFactor={-2} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]}>
            <ringGeometry args={[0.85, 0.98, 48]} />
            <meshBasicMaterial color={SELECTOR_COLOR} toneMapped={false} depthWrite={false} polygonOffset polygonOffsetFactor={-3} />
          </mesh>
        </group>
      )}
    </>
  );
}

// ---------- Jugador procedural (respaldo automático si el GLB no carga) ----------
// facing = 0 -> encara +Z (hacia la cámara táctica inicial). facing = Math.PI -> de espaldas a la cámara.
function ProceduralPlayer3D({ color, number, role, isSelected, onClick, facing = 0 }) {
  const bodyRef = useRef();
  const isGK = role === 'GK';
  const model = useMemo(() => getPlayerModel(isGK), [isGK]);
  const scale = useMemo(() => getPlayerScale(), []);
  const jersey = color || '#2563eb';
  const light = playerHexLuma(jersey) > 0.78;
  const n = parseInt(number, 10) || 0;

  const mats = useMemo(() => ({
    jersey: getJerseyMaterial(jersey),
    shorts: playerStdMat(light ? '#1f2937' : '#f8fafc', 0.7),
    sock: playerStdMat(light ? '#f8fafc' : jersey, 0.75),
    ribete: playerStdMat(light ? '#111827' : '#f8fafc', 0.6),
    collar: playerStdMat(light ? '#111827' : '#f8fafc', 0.6),
    skin: playerStdMat(PLAYER_SKINS[n % PLAYER_SKINS.length], 0.8),
    hair: playerStdMat(PLAYER_HAIRS[(n * 3 + 1) % PLAYER_HAIRS.length], 0.9),
    boot: playerStdMat('#15191f', 0.4),
    sole: playerStdMat('#d1d5db', 0.6),
    glove: playerStdMat('#f8fafc', 0.5),
    sclera: playerStdMat('#f8fafc', 0.4),
    lip: playerStdMat('#a8645a', 0.7),
  }), [jersey, light, n]);
  const numberMat = getPlayerNumberMaterial(number, light);

  // Rebote leve solo cuando está seleccionado (costo mínimo)
  useFrame(({ clock }) => {
    if (!bodyRef.current) return;
    const target = isSelected ? Math.abs(Math.sin(clock.getElapsedTime() * 5)) * 0.03 : 0;
    bodyRef.current.position.y += (target - bodyRef.current.position.y) * 0.2;
  });

  return (
    <group dispose={null} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
      <PlayerGroundMarks isSelected={isSelected} />
      <group ref={bodyRef} rotation={[0, facing, 0]} scale={[scale, scale, scale]}>
        {Object.keys(model.geos).map((slot) => (
          <mesh key={slot} geometry={model.geos[slot]} material={mats[slot]} />
        ))}
        {/* Dorsal en la espalda y número pequeño en el pecho (siguen la inclinación del torso) */}
        <group position={[0, model.hipY, 0]} rotation={[model.lean, 0, 0]}>
          <mesh position={[0, 0.32, -0.127]} rotation={[-0.035, Math.PI, 0]} material={numberMat}>
            <planeGeometry args={[0.26, 0.26]} />
          </mesh>
          <mesh position={[0, 0.4, 0.163]} rotation={[0.15, 0, 0]} material={numberMat}>
            <planeGeometry args={[0.13, 0.13]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ---------- Jugador GLB (Mixamo) ----------
const USE_GLB_PLAYER = true; // pon false para usar siempre el jugador procedural
const GLB_URL = '/player.glb';
const DRACO_URL = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/';
const GLB_POSE_TIME = 0;     // segundo de la animación en el que se congela la pose
let _glbFailed = false;       // si el GLB falla una vez, el resto de jugadores usa directamente el procedural
let _glbNamesLogged = false;

// Normaliza el modelo a 1.80 m y lo apoya en y = 0, sin importar si el GLB viene en centímetros o metros
const _glbNormCache = new WeakMap();
function getGlbNormalization(scene) {
  if (_glbNormCache.has(scene)) return _glbNormCache.get(scene);
  let result = { scale: 0.01, offsetY: 0, minY: 0 };
  try {
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3();
    scene.traverse((o) => {
      if (o.isMesh && o.geometry) {
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
      }
    });
    const h = box.max.y - box.min.y;
    if (Number.isFinite(h) && h > 0.01) {
      const sc = PLAYER_HEIGHT_M / h;
      result = { scale: sc, offsetY: -box.min.y * sc, minY: box.min.y };
    }
  } catch (e) { /* se mantiene la escala por defecto */ }
  _glbNormCache.set(scene, result);
  return result;
}

// ---------- Identidad visual de los jugadores GLB: equipación, contextura, rostro y postura ----------
const GLB_FRONT_NUMBER = false; // dorsal pequeño en el pecho (la cámara táctica inicial ve a los jugadores de frente). false = solo en la espalda

function glbHashStr(s) {
  let h = 2166136261;
  const str = String(s ?? '');
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function glbBoneKey(name) {
  return String(name || '').toLowerCase().replace(/^mixamorig[:_]?/, '').replace(/[^a-z0-9]/g, '');
}

// Clasificación de las partes del modelo por nombre de malla / material
const GLB_RE_SHIRT = /shirt|jersey|camis|t-?shirt|top|torso|sweater|polo/;
const GLB_RE_SHORTS = /short|pant|bottom|trouser|jean|bermuda/;
const GLB_RE_HAIR = /hair|pelo|cabello/;
const GLB_RE_SKIN = /body|skin|head|face|arm|hand|leg|cuerpo|piel/;
function glbClassify(label) {
  if (/eye|iris|cornea|pupil|ojo/i.test(label)) return 'eye';
  if (GLB_RE_SHIRT.test(label)) return 'shirt';
  if (GLB_RE_SHORTS.test(label)) return 'shorts';
  if (GLB_RE_HAIR.test(label)) return 'hair';
  if (GLB_RE_SKIN.test(label)) return 'skin';
  return null;
}
function glbPartLabel(mesh, mat) {
  return `${mesh.name || ''} ${(mat && mat.name) || ''}`.toLowerCase();
}

// Medidas del modelo en pose de referencia (se calculan una sola vez por escena y se cachean).
// Todo se expresa en unidades de altura corporal (H) para no depender de si el GLB viene en cm o en metros.
const _glbKitCache = new WeakMap();
function getGlbKitInfo(scene) {
  if (_glbKitCache.has(scene)) return _glbKitCache.get(scene);
  const info = {
    ok: false, y0: 0, H: 1.8, cx: 0, fwd: 1,
    shirt: { lo: 0.5, hi: 0.84, halfW: 0.3 },
    shorts: { lo: 0.3, hi: 0.53 },
    shirtFound: false, names: []
  };
  try {
    scene.updateMatrixWorld(true);
    const body = new THREE.Box3();
    const shirt = new THREE.Box3();
    const tmp = new THREE.Box3();
    const shorts = new THREE.Box3();
    let footBone = null;
    let toeBone = null;
    scene.traverse((o) => {
      if (o.isBone) {
        const k = glbBoneKey(o.name);
        if (k === 'leftfoot') footBone = o;
        if (k === 'lefttoebase') toeBone = o;
      }
      if (!o.isMesh || !o.geometry) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      body.union(tmp);
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const kinds = mats.map((m) => glbClassify(glbPartLabel(o, m)));
      info.names.push(`${o.name || '?'}[${mats.map((m) => (m && m.name) || '?').join(',')}]=${kinds.map((k) => k || '-').join(',')}`);
      if (kinds.includes('shirt')) shirt.union(tmp);
      if (kinds.includes('shorts')) shorts.union(tmp);
    });
    const H = body.max.y - body.min.y;
    if (Number.isFinite(H) && H > 0.01) {
      info.y0 = body.min.y;
      info.H = H;
      info.cx = (body.min.x + body.max.x) / 2;
      if (footBone && toeBone) {
        const a = new THREE.Vector3().setFromMatrixPosition(footBone.matrixWorld);
        const b = new THREE.Vector3().setFromMatrixPosition(toeBone.matrixWorld);
        info.fwd = (b.z - a.z) < 0 ? -1 : 1;
      }
      if (!shirt.isEmpty()) {
        info.shirtFound = true;
        const lo = (shirt.min.y - info.y0) / H;
        const hi = (shirt.max.y - info.y0) / H;
        const halfW = Math.max(Math.abs(shirt.min.x - info.cx), Math.abs(shirt.max.x - info.cx)) / H;
        if (hi - lo > 0.15 && hi - lo < 0.6 && lo > 0.3 && hi < 0.97) {
          info.shirt = { lo, hi, halfW: Math.min(0.55, Math.max(0.15, halfW)) };
        }
      }
      if (!shorts.isEmpty()) {
        const lo = (shorts.min.y - info.y0) / H;
        const hi = (shorts.max.y - info.y0) / H;
        if (hi - lo > 0.08 && hi < 0.7) info.shorts = { lo, hi };
      }
      info.ok = true;
    }
  } catch (e) { /* se mantienen los valores por defecto */ }
  _glbKitCache.set(scene, info);
  return info;
}

// Contextura según rol (o dorsal si no hay rol): arqueros y centrales más altos y corpulentos; laterales y extremos más estilizados
const GLB_ROLE_KIND = {
  GK: 'gk', CB: 'cb', SW: 'cb', RB: 'fb', LB: 'fb', RWB: 'fb', LWB: 'fb', WB: 'fb',
  CDM: 'dm', DM: 'dm', CM: 'cm', CAM: 'cm', AM: 'cm', MF: 'cm',
  RM: 'wing', LM: 'wing', RW: 'wing', LW: 'wing', W: 'wing',
  ST: 'st', CF: 'st', SS: 'st', FW: 'st'
};
const GLB_NUMBER_KIND = { 1: 'gk', 2: 'fb', 3: 'cb', 4: 'cb', 5: 'fb', 6: 'dm', 7: 'wing', 8: 'cm', 9: 'st', 10: 'cm', 11: 'wing' };
const GLB_BODY_PROFILES = {
  gk: { h: 1.07, w: 1.12 },
  cb: { h: 1.06, w: 1.10 },
  dm: { h: 1.03, w: 1.05 },
  st: { h: 1.03, w: 1.03 },
  cm: { h: 0.98, w: 0.96 },
  fb: { h: 0.98, w: 0.94 },
  wing: { h: 0.95, w: 0.92 }
};
function glbBodyProfile(role, n, seed) {
  const r = String(role || '').toUpperCase();
  const kind = (r === 'GK' || n === 1) ? 'gk' : (GLB_ROLE_KIND[r] || GLB_NUMBER_KIND[n] || 'cm');
  const p = GLB_BODY_PROFILES[kind];
  const jitterH = ((seed % 11) - 5) * 0.006;
  const jitterW = (((seed >>> 5) % 11) - 5) * 0.006;
  return { kind, h: p.h + jitterH, w: p.w + jitterW };
}

// Camiseta: textura de tela generada en canvas (color base, franja, ribetes de cuello/mangas/ruedo y dorsal).
// La mitad izquierda del canvas es el frente y la derecha la espalda; el shader la proyecta sobre el cuerpo.
const _glbJerseyTexCache = new Map();
function getGlbJerseyTexture(color, number, shirt) {
  const label = String(number ?? '');
  const key = `${color}|${label}|${shirt.lo.toFixed(3)}|${shirt.hi.toFixed(3)}|${shirt.halfW.toFixed(3)}`;
  if (_glbJerseyTexCache.has(key)) return _glbJerseyTexCache.get(key);

  const HALF_W = 480;
  const CH = 320;
  const yTop = shirt.hi + 0.012;
  const panelH = (shirt.hi - shirt.lo) + 0.03;
  const yBot = yTop - panelH;
  const hw = shirt.halfW;
  const pxX = HALF_W / (2 * hw); // píxeles por unidad de altura (horizontal)
  const pxY = CH / panelH;       // píxeles por unidad de altura (vertical)
  const X = (hx) => (hx + hw) * pxX;
  const Y = (hy) => (yTop - hy) * pxY;

  const lum = playerHexLuma(color);
  const base = new THREE.Color(color);
  const accent = `#${base.clone().offsetHSL(0, 0, lum > 0.62 ? -0.09 : 0.1).getHexString()}`;
  const trim = lum > 0.72 ? '#111827' : '#f8fafc';
  const numFill = lum > 0.62 ? '#0f172a' : '#ffffff';
  const numLine = lum > 0.62 ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)';
  const style = glbHashStr(color) % 3; // el diseño depende del color del equipo, nunca del jugador

  const c = document.createElement('canvas');
  c.width = HALF_W * 2;
  c.height = CH;
  const ctx = c.getContext('2d');

  const drawNumber = (txt, hx, hy, capH) => {
    const fontPx = (capH * pxY) / 0.72;
    const size = txt.length > 2 ? fontPx * 0.66 : txt.length > 1 ? fontPx * 0.86 : fontPx;
    ctx.save();
    ctx.translate(X(hx), Y(hy));
    ctx.scale(pxX / pxY, 1); // compensa la proporción del panel para que el número no se deforme
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${size}px Arial, Helvetica, sans-serif`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.13;
    ctx.strokeStyle = numLine;
    ctx.strokeText(txt, 0, 0);
    ctx.fillStyle = numFill;
    ctx.fillText(txt, 0, 0);
    ctx.restore();
  };

  for (let side = 0; side < 2; side++) {
    ctx.save();
    ctx.translate(side * HALF_W, 0);
    ctx.beginPath();
    ctx.rect(0, 0, HALF_W, CH);
    ctx.clip();

    // Color base de la tela
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, HALF_W, CH);

    // Franja / diseño del equipo
    ctx.fillStyle = accent;
    if (style === 0) {
      ctx.fillRect(X(-0.05), 0, 0.1 * pxX, CH);
      ctx.fillStyle = trim;
      ctx.fillRect(X(-0.066), 0, 0.007 * pxX, CH);
      ctx.fillRect(X(0.059), 0, 0.007 * pxX, CH);
    } else if (style === 1) {
      const w = 0.035;
      const steps = Math.ceil(hw / w);
      for (let k = -steps; k <= steps; k++) {
        if (k % 2 === 0) ctx.fillRect(X(k * w - w / 2), 0, w * pxX, CH);
      }
    } else {
      const top = Y(shirt.hi - 0.045);
      const bottom = Y(shirt.hi - 0.085);
      ctx.fillRect(0, top, HALF_W, bottom - top);
    }

    // Ribete del ruedo
    ctx.fillStyle = trim;
    ctx.fillRect(0, Y(shirt.lo + 0.014), HALF_W, CH);

    // Ribete del cuello
    ctx.fillStyle = trim;
    ctx.fillRect(X(-0.09), 0, 0.18 * pxX, Y(shirt.hi - 0.03));

    // Ribetes de las mangas (doble vivo)
    ctx.fillStyle = trim;
    ctx.fillRect(X(hw - 0.03), 0, 0.03 * pxX + 2, CH);
    ctx.fillRect(X(-hw) - 2, 0, 0.03 * pxX + 2, CH);
    ctx.fillRect(X(hw - 0.04), 0, 0.005 * pxX, CH);
    ctx.fillRect(X(-hw + 0.035), 0, 0.005 * pxX, CH);

    if (side === 1) {
      // Dorsal grande en la espalda
      const capH = Math.min(0.125, (shirt.hi - shirt.lo) * 0.36);
      drawNumber(label, 0, shirt.lo + 0.55 * (shirt.hi - shirt.lo), capH);
    } else if (GLB_FRONT_NUMBER) {
      // Dorsal pequeño en el pecho
      drawNumber(label, 0, shirt.lo + 0.66 * (shirt.hi - shirt.lo), 0.05);
    }
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;

  const res = { tex, yBot, panelH };
  _glbJerseyTexCache.set(key, res);
  return res;
}

// Inyecta en un MeshStandardMaterial un color procedural calculado con la posición/normal del modelo en pose de referencia
// (no depende del UV del GLB, así que no importa dónde esté el "7" de fábrica ni cómo esté desplegada su textura)
function glbInjectBindProjection(mat, key, fragDecl, fragBody, uniforms) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 uB2S;\nvarying vec3 vBP;\nvarying vec3 vBN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBP = (uB2S * vec4(position, 1.0)).xyz;\nvBN = mat3(uB2S) * normal;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vBP;\nvarying vec3 vBN;\n${fragDecl}`)
      .replace('#include <map_fragment>', fragBody);
  };
  mat.customProgramCacheKey = () => key;
  mat.needsUpdate = true;
}

const GLB_JERSEY_DECL = 'uniform sampler2D uJTex;\nuniform vec3 uJ0;\nuniform vec3 uJ1;\nuniform float uFwd;';
const GLB_JERSEY_FRAG = `
{
  vec3 jn = normalize(vBN);
  float jx = (vBP.x - uJ0.x) / uJ0.z;
  float jy = (vBP.y - uJ0.y) / uJ0.z;
  float jBack = (jn.z * uFwd) < 0.0 ? 1.0 : 0.0;
  float ju = ((jBack > 0.5 ? -jx : jx) / (2.0 * uJ1.x)) + 0.5;
  float jv = (jy - uJ1.y) / uJ1.z;
  vec2 juv = vec2(ju * 0.5 + jBack * 0.5, jv);
  juv.x = clamp(juv.x, jBack * 0.5 + 0.0007, jBack * 0.5 + 0.4993);
  vec2 jg = vec2(jx / (2.0 * uJ1.x) * 0.5, jv);
  diffuseColor.rgb = textureGrad(uJTex, juv, dFdx(jg), dFdy(jg)).rgb;
}
`;

const GLB_SHORTS_DECL = 'uniform vec3 uS0;\nuniform vec2 uS1;\nuniform vec3 uSBase;\nuniform vec3 uSStripe;\nuniform vec3 uSTrim;';
const GLB_SHORTS_FRAG = `
{
  vec3 sn = normalize(vBN);
  float sy = (vBP.y - uS0.y) / uS0.z;
  float sOuter = sn.x * sign(vBP.x - uS0.x);
  vec3 sCol = uSBase;
  if (sOuter > 0.8) sCol = uSTrim;
  if (sOuter > 0.88) sCol = uSStripe;
  if (sOuter > 0.97) sCol = uSTrim;
  if (sy < uS1.x + 0.02) sCol = uSStripe;
  if (sy < uS1.x + 0.008) sCol = uSTrim;
  if (sy > uS1.y - 0.022) sCol = uSTrim;
  diffuseColor.rgb = sCol;
}
`;

// Promedio de color de una textura (para teñir piel y pelo hacia un tono objetivo sin perder el detalle de la textura original)
const _glbTexAvg = new WeakMap();
function glbTextureAverage(tex) {
  if (!tex) return null;
  if (_glbTexAvg.has(tex)) return _glbTexAvg.get(tex);
  let res = null;
  try {
    const img = tex.image;
    if (img && (img.width || img.videoWidth)) {
      const c = document.createElement('canvas');
      c.width = 32; c.height = 32;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, 32, 32);
      const d = ctx.getImageData(0, 0, 32, 32).data;
      let r = 0, g = 0, b = 0, cnt = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 8) continue;
        r += d[i]; g += d[i + 1]; b += d[i + 2]; cnt++;
      }
      if (cnt) res = [r / cnt / 255, g / cnt / 255, b / cnt / 255];
    }
  } catch (e) { res = null; }
  _glbTexAvg.set(tex, res);
  return res;
}

function glbTintTowards(mat, hex, minGain = 0.35, maxGain = 2.6) {
  const target = new THREE.Color(hex);
  const avg = glbTextureAverage(mat.map);
  if (!avg) { mat.color.copy(target); return 1; }
  const a = new THREE.Color().setRGB(avg[0], avg[1], avg[2], THREE.SRGBColorSpace);
  const gain = (t, v) => Math.min(maxGain, Math.max(minGain, t / Math.max(v, 0.02)));
  mat.color.setRGB(gain(target.r, a.r), gain(target.g, a.g), gain(target.b, a.b));
  return 0.2126 * a.r + 0.7152 * a.g + 0.0722 * a.b;
}

// Postura de expectativa del arquero: rodillas semiflexionadas, pies separados, torso levemente inclinado y manos al frente.
// Orienta cada hueso hacia una dirección objetivo (en el sistema del modelo), así queda simétrica sea cual sea la pose congelada.
function buildGlbGoalkeeperStance(root, fwd) {
  const bones = {};
  root.traverse((o) => { if (o.isBone) bones[glbBoneKey(o.name)] = o; });
  const hips = bones.hips;
  const lUp = bones.leftupleg, lLeg = bones.leftleg, rUp = bones.rightupleg, rLeg = bones.rightleg;
  if (!hips || !lUp || !lLeg || !rUp || !rLeg) return null;

  const saved = new Map();
  const touched = new Set();
  const keep = (b) => { if (!saved.has(b)) saved.set(b, { q: b.quaternion.clone(), p: b.position.clone() }); touched.add(b); };
  const scl = new THREE.Vector3();
  const tmpP = new THREE.Vector3();
  const invRoot = () => { root.updateMatrixWorld(true); return new THREE.Matrix4().copy(root.matrixWorld).invert(); };
  const posIn = (bone, inv) => new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld).applyMatrix4(inv);

  const align = (bone, child, target) => {
    if (!bone || !child) return;
    const inv = invRoot();
    const cur = posIn(child, inv).sub(posIn(bone, inv)).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(cur, target.clone().normalize());
    const parentQ = new THREE.Quaternion();
    if (bone.parent) new THREE.Matrix4().multiplyMatrices(inv, bone.parent.matrixWorld).decompose(tmpP, parentQ, scl);
    keep(bone);
    bone.quaternion.premultiply(parentQ).premultiply(q).premultiply(parentQ.clone().invert());
  };

  const inv0 = invRoot();
  const sideL = Math.sign(posIn(lUp, inv0).x - posIn(rUp, inv0).x) || 1;
  const thighLen = posIn(lUp, inv0).distanceTo(posIn(lLeg, inv0));
  const lFoot = bones.leftfoot, rFoot = bones.rightfoot;
  const shinLen = lFoot ? posIn(lLeg, inv0).distanceTo(posIn(lFoot, inv0)) : thighLen;
  const hipToFootL = lFoot ? posIn(lUp, inv0).y - posIn(lFoot, inv0).y : thighLen + shinLen;
  const hipToFootR = rFoot ? posIn(rUp, inv0).y - posIn(rFoot, inv0).y : thighLen + shinLen;

  const ALPHA = 0.42; // muslo hacia delante
  const GAMMA = 0.3;  // pierna hacia atrás respecto de la vertical (rodilla flexionada ~41°)
  const PHI = 0.14;   // apertura de los muslos
  const PHI2 = 0.08;  // apertura de las piernas
  const drop = Math.max(0, Math.max(hipToFootL, hipToFootR) - (thighLen * Math.cos(ALPHA) + shinLen * Math.cos(GAMMA)));

  // 1. Baja la cadera para que los pies sigan apoyados en el césped
  if (drop > 0) {
    const inv = invRoot();
    const m = new THREE.Matrix4().multiplyMatrices(inv, hips.parent ? hips.parent.matrixWorld : new THREE.Matrix4());
    const mi = m.clone().invert();
    const o = new THREE.Vector3().applyMatrix4(mi);
    const d = new THREE.Vector3(0, -drop, 0).applyMatrix4(mi).sub(o);
    keep(hips);
    hips.position.add(d);
  }

  // 2. Piernas semiflexionadas y abiertas al ancho de hombros
  [[lUp, lLeg, lFoot, sideL], [rUp, rLeg, rFoot, -sideL]].forEach(([up, leg, foot, s]) => {
    align(up, leg, new THREE.Vector3(s * Math.sin(PHI), -Math.cos(ALPHA), fwd * Math.sin(ALPHA)));
    if (foot) align(leg, foot, new THREE.Vector3(s * Math.sin(PHI2), -Math.cos(GAMMA), -fwd * Math.sin(GAMMA)));
  });

  // 3. Torso levemente inclinado hacia delante, cabeza al frente
  if (bones.spine && bones.spine1) align(bones.spine, bones.spine1, new THREE.Vector3(0, Math.cos(0.14), fwd * Math.sin(0.14)));
  if (bones.neck && bones.head) align(bones.neck, bones.head, new THREE.Vector3(0, Math.cos(0.04), fwd * Math.sin(0.04)));

  // 4. Brazos abiertos y manos al frente, listos para atajar
  [['left', sideL], ['right', -sideL]].forEach(([name, s]) => {
    const arm = bones[`${name}arm`], fore = bones[`${name}forearm`], hand = bones[`${name}hand`];
    if (arm && fore) align(arm, fore, new THREE.Vector3(s * Math.sin(0.5), -Math.cos(0.5), fwd * 0.15));
    if (fore && hand) align(fore, hand, new THREE.Vector3(s * 0.22, -0.3, fwd * 0.9));
  });

  const finals = [];
  touched.forEach((b) => finals.push({ bone: b, q: b.quaternion.clone(), p: b === hips ? b.position.clone() : null }));

  return {
    // El mixer (pose congelada) reescribe los huesos en cada frame: se vuelve a imponer la postura del arquero después de él
    apply() {
      for (let i = 0; i < finals.length; i++) {
        const f = finals[i];
        f.bone.quaternion.copy(f.q);
        if (f.p) f.bone.position.copy(f.p);
      }
    },
    restore() {
      saved.forEach((s, b) => { b.quaternion.copy(s.q); b.position.copy(s.p); });
    }
  };
}

function buildGlbFieldPlayerStance(root, fwd = 1) {
  const bones = {};
  root.traverse((c) => {
    if (c.isBone) {
      const k = glbBoneKey(c.name);
      if (k) bones[k] = c;
    }
  });

  const saved = [];
  const targets = [];
  const addMod = (bone, eulerRot) => {
    if (!bone) return;
    saved.push({ b: bone, q: bone.quaternion.clone(), p: bone.position.clone() });
    const targetQ = bone.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(eulerRot));
    targets.push({ bone, q: targetQ });
  };

  // Brazos pegados al torso
  addMod(bones.leftarm, new THREE.Euler(0, 0, -0.32));
  addMod(bones.rightarm, new THREE.Euler(0, 0, 0.32));

  // Codos flexionados hacia adelante
  addMod(bones.leftforearm, new THREE.Euler(0.45 * fwd, 0, -0.2));
  addMod(bones.rightforearm, new THREE.Euler(0.45 * fwd, 0, 0.2));

  // Semiflexion de rodillas atletica
  addMod(bones.leftleg, new THREE.Euler(0.12 * fwd, 0, 0));
  addMod(bones.rightleg, new THREE.Euler(0.12 * fwd, 0, 0));

  return {
    apply() {
      targets.forEach((t) => t.bone.quaternion.copy(t.q));
    },
    restore() {
      saved.forEach((s) => {
        s.b.quaternion.copy(s.q);
        s.b.position.copy(s.p);
      });
    }
  };
}

function GLBPlayer({ color, number, isSelected, onClick, facing = 0, role }) {
  const { scene, animations } = useGLTF(GLB_URL, DRACO_URL);
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions, mixer } = useAnimations(animations, clone);
  const norm = useMemo(() => getGlbNormalization(scene), [scene]);
  const kit = useMemo(() => getGlbKitInfo(scene), [scene]);

  const n = parseInt(number, 10) || 0;
  const isGK = role === 'GK' || n === 1;
  const jerseyColor = color || '#2563eb';
  const teamSeed = useMemo(() => glbHashStr(jerseyColor), [jerseyColor]);
  const seed = useMemo(() => glbHashStr(`${jerseyColor}|${number}`), [jerseyColor, number]);

  // 1. Contextura segun rol / dorsal
  const customScale = useMemo(() => {
    const p = glbBodyProfile(role, n, seed);
    const base = norm.scale;
    return [base * p.w, base * p.h, base * p.w];
  }, [norm.scale, role, n, seed]);

  // Congelar la pose
  useEffect(() => {
    const names = Object.keys(actions || {});
    const action = (actions && actions['mixamo.com']) || (names.length ? actions[names[0]] : null);
    if (action) {
      action.reset();
      action.play();
      action.paused = true;
      action.time = GLB_POSE_TIME;
      if (mixer) mixer.update(0);
    }
    return () => { if (mixer) mixer.stopAllAction(); };
  }, [actions, mixer]);

  // 2. Postura atletica (arquero y jugadores de campo)
  const stanceRef = useRef(null);
  useEffect(() => {
    stanceRef.current = null;
    let stance = null;
    try {
      clone.updateMatrixWorld(true);
      if (isGK) {
        stance = buildGlbGoalkeeperStance(clone, kit.fwd);
      } else {
        stance = buildGlbFieldPlayerStance(clone, kit.fwd);
      }
    } catch (e) { stance = null; }
    stanceRef.current = stance;
    return () => {
      if (stance) stance.restore();
      stanceRef.current = null;
    };
  }, [clone, actions, mixer, isGK, kit]);
  useFrame(() => { if (stanceRef.current) stanceRef.current.apply(); });

  // 3. Piel, cabello, camiseta (textura procedural con dorsal) y shorts con ribete lateral
  useLayoutEffect(() => {
    const owned = [];
    const skinColor = PLAYER_SKINS[(n * 3 + (teamSeed % PLAYER_SKINS.length)) % PLAYER_SKINS.length];
    const hairColor = PLAYER_HAIRS[(n * 5 + 3 + ((teamSeed >>> 3) % PLAYER_HAIRS.length)) % PLAYER_HAIRS.length];
    const lightKit = playerHexLuma(jerseyColor) > 0.78;

    if (!_glbNamesLogged) {
      _glbNamesLogged = true;
      console.info('[player.glb] partes detectadas:', kit.names.join(' · '));
      if (!kit.shirtFound) console.warn('[player.glb] No se encontró ninguna malla de camiseta (nombre con shirt/jersey/camis/top/torso). Revisa los nombres de arriba.');
    }

    clone.updateMatrixWorld(true);
    const invRoot = new THREE.Matrix4().copy(clone.matrixWorld).invert();

    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.frustumCulled = false;
      child.castShadow = true;
      if (!child.userData.glbOrigMaterial) child.userData.glbOrigMaterial = child.material;
      const src = child.userData.glbOrigMaterial;
      if (!src) return;
      const list = Array.isArray(src) ? src : [src];
      const rel = new THREE.Matrix4().multiplyMatrices(invRoot, child.matrixWorld);

      const next = list.map((m) => {
        const mat = m.clone();
        owned.push(mat);
        const kind = glbClassify(glbPartLabel(child, mat));

        if (kind === 'shirt') {
          mat.roughness = 0.65;
          mat.metalness = 0.05;
          if (kit.ok) {
            const jt = getGlbJerseyTexture(jerseyColor, number, kit.shirt);
            mat.map = null; // se descarta la textura de fábrica (y su "7")
            mat.color.set('#ffffff');
            glbInjectBindProjection(mat, 'glb-jersey-v1', GLB_JERSEY_DECL, GLB_JERSEY_FRAG, {
              uB2S: { value: rel },
              uJTex: { value: jt.tex },
              uJ0: { value: new THREE.Vector3(kit.cx, kit.y0, kit.H) },
              uJ1: { value: new THREE.Vector3(kit.shirt.halfW, jt.yBot, jt.panelH) },
              uFwd: { value: kit.fwd }
            });
          } else {
            mat.color.set(jerseyColor);
          }
        } else if (kind === 'shorts') {
          mat.roughness = 0.8;
          const baseHex = lightKit ? '#1f2937' : '#f8fafc';
          const trimHex = lightKit ? '#f8fafc' : '#0f172a';
          if (kit.ok) {
            mat.map = null;
            mat.color.set('#ffffff');
            glbInjectBindProjection(mat, 'glb-shorts-v1', GLB_SHORTS_DECL, GLB_SHORTS_FRAG, {
              uB2S: { value: rel },
              uS0: { value: new THREE.Vector3(kit.cx, kit.y0, kit.H) },
              uS1: { value: new THREE.Vector2(kit.shorts.lo, kit.shorts.hi) },
              uSBase: { value: new THREE.Color(baseHex) },
              uSStripe: { value: new THREE.Color(jerseyColor) },
              uSTrim: { value: new THREE.Color(trimHex) }
            });
          } else {
            mat.color.set(baseHex);
          }
        } else if (kind === 'hair') {
        const avgLuma = glbTintTowards(mat, hairColor, 0.4, 4);
        if (avgLuma < 0.2) mat.emissive.set(hairColor).multiplyScalar(0.45);
        mat.roughness = 0.9;
      } else if (kind === 'eye') {
        // Ojos realistas: esclerótica clara con brillo corneal vivo
        if (mat.color) mat.color.set('#f8fafc');
        mat.roughness = 0.1;
        mat.metalness = 0.1;
      } else if (kind === 'skin') {
        glbTintTowards(mat, skinColor);
        // Piel humana PBR: dispersión suave sin brillo plástico
        mat.roughness = 0.65;
        mat.metalness = 0.05;
      }
        mat.needsUpdate = true;
        return mat;
      });
      child.material = Array.isArray(src) ? next : next[0];
    });

    return () => owned.forEach((m) => m.dispose());
  }, [clone, kit, jerseyColor, number, n, teamSeed]);

  // Los pies del modelo se apoyan en y = 0 con la escala real de este jugador
  const footY = -norm.minY * customScale[1];

  return (
    <group dispose={null} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
      <PlayerGroundMarks isSelected={isSelected} />
      <group rotation={[0, facing, 0]}>
        <primitive
          object={clone}
          position={[0, footY, 0]}
          scale={customScale}
        />
      </group>
      {/* Sin sprites ni parches: el dorsal está impreso en la textura de la camiseta */}
    </group>
  );
}

// Si el GLB falla (404, Draco bloqueado, etc.) se muestra el jugador procedural en lugar de tumbar el WebGL
class PlayerErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) {
    if (!_glbFailed) {
      _glbFailed = true;
      console.warn('[player.glb] No se pudo cargar; se usa el jugador procedural.', error && error.message);
    }
  }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

// Misma firma que usa Scene3D: <TacticalPlayer3D color number role isSelected onClick />
// El <group> padre de Scene3D ya posiciona al jugador con position={[pos.x, 0, pos.z]}: aquí NO se aplica ninguna traslación.
function TacticalPlayer3D(props) {
  const fallback = <ProceduralPlayer3D {...props} />;
  if (!USE_GLB_PLAYER || _glbFailed) return fallback;
  return (
    <PlayerErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GLBPlayer {...props} />
      </Suspense>
    </PlayerErrorBoundary>
  );
}

useGLTF.preload(GLB_URL, DRACO_URL);

// Si algo del 3D lanza un error, solo cae la vista 3D (con opción de reintentar) y no toda la aplicación
class Scene3DBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error('[3D] Error en la escena:', error); }
  render() {
    if (this.state.error) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-zinc-950 text-zinc-200 p-6 text-center">
          <p className="text-sm font-bold">No se pudo mostrar la vista 3D.</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold active:scale-95"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


function TrainingObject3D({ obj, position, onClick }) {
  const s = obj.scale || 1;
  const color = obj.color || '#f97316';
  const rotation = (obj.rotation || 0) * Math.PI / 180;
  return (
    <group position={[position.x - 52.5, 0, position.y - 34]} rotation={[0, -rotation, 0]} scale={[s, s, s]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {obj.type === 'cone' && <group position={[0, 0, 0]}>
        <mesh position={[0, 0.08, 0]} castShadow><cylinderGeometry args={[0.42, 0.55, 0.16, 20]} /><meshStandardMaterial color={color} roughness={0.72} /></mesh>
        <mesh position={[0, 0.46, 0]} castShadow><coneGeometry args={[0.38, 0.72, 20]} /><meshStandardMaterial color={color} roughness={0.65} /></mesh>
        <mesh position={[0, 0.42, 0]}><cylinderGeometry args={[0.29, 0.32, 0.12, 20]} /><meshStandardMaterial color="#fff7ed" roughness={0.75} /></mesh>
      </group>}
      {obj.type === 'saucer' && <group position={[0, 0.12, 0]}>
        <mesh castShadow><cylinderGeometry args={[0.46, 0.58, 0.18, 24]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
        <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.22, 0.28, 0.04, 24]} /><meshStandardMaterial color="#f8fafc" roughness={0.65} /></mesh>
      </group>}
      {obj.type === 'ring' && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}><torusGeometry args={[0.72, 0.09, 8, 28]} /><meshStandardMaterial color={color} roughness={0.55} /></mesh>}
      {obj.type === 'pole' && <group>
        <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.22, 0.27, 0.18, 16]} /><meshStandardMaterial color="#1f2937" /></mesh>
        <mesh position={[0, 1.35, 0]} castShadow><cylinderGeometry args={[0.045, 0.055, 2.5, 10]} /><meshStandardMaterial color={color} roughness={0.45} /></mesh>
        <mesh position={[0, 2.57, 0]}><sphereGeometry args={[0.09, 12, 12]} /><meshStandardMaterial color={color} /></mesh>
      </group>}
      {obj.type === 'hurdle' && <group>
        {[-0.9, 0.9].map((x) => <mesh key={x} position={[x, 0.48, 0]} castShadow><cylinderGeometry args={[0.055, 0.07, 0.96, 10]} /><meshStandardMaterial color="#facc15" /></mesh>)}
        <mesh position={[0, 0.91, 0]} castShadow><boxGeometry args={[2.05, 0.12, 0.12]} /><meshStandardMaterial color="#facc15" roughness={0.55} /></mesh>
        <mesh position={[0, 0.91, 0.068]}><boxGeometry args={[0.48, 0.125, 0.015]} /><meshStandardMaterial color="#18181b" /></mesh>
        {[-1.02, 1.02].map((x) => <mesh key={`foot-${x}`} position={[x, 0.07, 0]}><boxGeometry args={[0.42, 0.1, 0.34]} /><meshStandardMaterial color="#713f12" /></mesh>)}
      </group>}
      {obj.type === 'dummy' && <group>
        <mesh position={[0, 0.16, 0]} castShadow><cylinderGeometry args={[0.34, 0.44, 0.24, 16]} /><meshStandardMaterial color="#374151" /></mesh>
        <mesh position={[0, 1.15, 0]} castShadow><capsuleGeometry args={[0.35, 1.15, 6, 12]} /><meshStandardMaterial color="#eab308" roughness={0.68} /></mesh>
        <mesh position={[0, 2.0, 0]} castShadow><sphereGeometry args={[0.26, 16, 14]} /><meshStandardMaterial color="#f8d1b0" roughness={0.9} /></mesh>
        <mesh position={[0, 1.5, 0.345]}><boxGeometry args={[0.42, 0.38, 0.02]} /><meshStandardMaterial color="#fef3c7" /></mesh>
      </group>}
      {obj.type === 'mini_goal' && <group>
        {[-1, 1].map(side => <mesh key={side} position={[0, 0.55, side * 1.2]} castShadow><cylinderGeometry args={[0.045, 0.045, 1.1, 10]} /><meshStandardMaterial color="#f8fafc" metalness={0.25} /></mesh>)}
        <mesh position={[0, 1.08, 0]} castShadow><boxGeometry args={[0.08, 0.08, 2.45]} /><meshStandardMaterial color="#f8fafc" metalness={0.25} /></mesh>
        <mesh position={[-0.62, 0.54, 0]}><boxGeometry args={[1.25, 1.0, 2.35]} /><meshBasicMaterial color="#e2e8f0" transparent opacity={0.18} wireframe /></mesh>
      </group>}
      {obj.type === 'ladder' && <group rotation={[0, 0, 0]}>
        {[-0.65, 0.65].map(x => <mesh key={x} position={[x, 0.045, 0]}><boxGeometry args={[0.06, 0.08, 3.3]} /><meshStandardMaterial color="#f8fafc" /></mesh>)}
        {[-1.35, -0.81, -0.27, 0.27, 0.81, 1.35].map(z => <mesh key={z} position={[0, 0.09, z]}><boxGeometry args={[1.35, 0.07, 0.055]} /><meshStandardMaterial color="#facc15" /></mesh>)}
      </group>}
      {obj.type === 'rebounder' && <group rotation={[Math.PI / 5, 0, 0]}>
        <mesh position={[0, 0.7, 0]} castShadow><boxGeometry args={[2.5, 1.4, 0.12]} /><meshStandardMaterial color="#f59e0b" roughness={0.55} /></mesh>
        <mesh position={[0, 0.7, 0.075]}><boxGeometry args={[2.28, 1.18, 0.03]} /><meshBasicMaterial color="#f8fafc" wireframe transparent opacity={0.55} /></mesh>
        {[-0.9, 0.9].map(x => <mesh key={x} position={[x, 0.25, -0.35]}><cylinderGeometry args={[0.055, 0.07, 0.6, 8]} /><meshStandardMaterial color="#374151" /></mesh>)}
      </group>}
      {obj.type === 'trampoline' && <group position={[0, 0.18, 0]}>
        <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.9, 0.95, 0.12, 24]} /><meshStandardMaterial color="#1e293b" /></mesh>
        <mesh position={[0, 0.13, 0]}><cylinderGeometry args={[0.78, 0.78, 0.035, 24]} /><meshStandardMaterial color="#0284c7" roughness={0.8} /></mesh>
        {[-0.58, 0.58].flatMap(x => [-0.58, 0.58].map(z => <mesh key={`${x}-${z}`} position={[x, -0.08, z]}><cylinderGeometry args={[0.045, 0.06, 0.42, 8]} /><meshStandardMaterial color="#475569" /></mesh>))}
      </group>}
      {obj.type === 'mat' && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]} receiveShadow><boxGeometry args={[2.6, 1.35, 0.12]} /><meshStandardMaterial color={color === '#f97316' ? '#2563eb' : color} roughness={0.86} /></mesh>}
    </group>
  );
}

// ===== BALÓN CLÁSICO (icosaedro truncado: 12 pentágonos + 20 hexágonos) =====
// Textura equirectangular generada una sola vez. Cada píxel se proyecta sobre la esfera y se asigna a la cara del
// poliedro que el rayo desde el centro toca primero: maximiza (n · centro_cara) / distancia_plano_cara.
let _ballTexture = null;
function getBallTexture() {
  if (_ballTexture) return _ballTexture;
  const W = 1024, H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const phi = (1 + Math.sqrt(5)) / 2;
  const unit = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  const DP = 0.9392336; // distancia (radio=1) del plano de cada pentágono
  const DH = 0.9149584; // distancia del plano de cada hexágono
  const faces = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    faces.push({ c: unit([0, a, b * phi]), k: 1 / DP, pent: true });
    faces.push({ c: unit([a, b * phi, 0]), k: 1 / DP, pent: true });
    faces.push({ c: unit([b * phi, 0, a]), k: 1 / DP, pent: true });
    for (const c of [-1, 1]) faces.push({ c: unit([a, b, c]), k: 1 / DH, pent: false });
    faces.push({ c: unit([a / phi, 0, b * phi]), k: 1 / DH, pent: false });
    faces.push({ c: unit([a * phi, b / phi, 0]), k: 1 / DH, pent: false });
    faces.push({ c: unit([0, a * phi, b / phi]), k: 1 / DH, pent: false });
  }
  const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  const white = [248, 250, 252], black = [17, 24, 39], seam = [46, 52, 64];
  for (let py = 0; py < H; py++) {
    const th = Math.PI * (py + 0.5) / H;
    const sinT = Math.sin(th), y = Math.cos(th);
    for (let px = 0; px < W; px++) {
      const ph = 2 * Math.PI * (px + 0.5) / W;
      const x = -Math.cos(ph) * sinT, z = Math.sin(ph) * sinT;
      let v1 = -9, v2 = -9, p1 = false;
      for (let i = 0; i < faces.length; i++) {
        const f = faces[i];
        const v = (f.c[0] * x + f.c[1] * y + f.c[2] * z) * f.k;
        if (v > v1) { v2 = v1; v1 = v; p1 = f.pent; } else if (v > v2) { v2 = v; }
      }
      const base = p1 ? black : white;
      const s = 1 - smooth(0.004, 0.017, v1 - v2);
      const o = (py * W + px) * 4;
      img.data[o] = base[0] + (seam[0] - base[0]) * s;
      img.data[o + 1] = base[1] + (seam[1] - base[1]) * s;
      img.data[o + 2] = base[2] + (seam[2] - base[2]) * s;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  _ballTexture = tex;
  return tex;
}

// Calculo matematico de parabola aerea (Curva cuadratica tipo Bezier)
function getParabolicElevation(progress, maxElevation = 2.8) {
  if (maxElevation <= 0) return 0;
  // Ecuacion parabolica f(t) = 4 * h * t * (1 - t), donde t va de 0 a 1
  const t = Math.max(0, Math.min(1, progress));
  return 4 * maxElevation * t * (1 - t);
}

function Ball3D({ position, isSelected, onClick }) {
  // Si el balon trae un progreso de animacion (0 a 1), calcula el vuelo parabolico; de lo contrario usa la altura fija
  const baseAlt = Math.max(0, position?.elevation ?? position?.altitude ?? position?.z ?? 0);
  const altitude = position?.animProgress !== undefined 
    ? getParabolicElevation(position.animProgress, baseAlt || 2.8) 
    : baseAlt;

  const ballTexture = useMemo(() => getBallTexture(), []);

  // La sombra se mantiene en el cesped, se atenua y se achica segun la altura del vuelo
  const shadowOpacity = Math.max(0.12, 0.45 - altitude * 0.09);
  const shadowScale = Math.max(0.55, 1 - altitude * 0.12);

  return (
    <group position={[0, 0, 0]} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
      {/* Sombra proyectada fija a ras de cesped */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.015, 0]}
        scale={[shadowScale, shadowScale, 1]}
        raycast={() => null}
      >
        <circleGeometry args={[0.15, 24]} />
        <meshBasicMaterial
          color="#000000"
          opacity={shadowOpacity}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Balon con elevacion tridimensional variable o vuelo parabolico */}
      <mesh
        castShadow
        position={[0, 0.11 + altitude, 0]}
        rotation={[0.35, 0.6, 0.1]}
      >
        <sphereGeometry args={[0.11, 32, 24]} />
        <meshStandardMaterial
          map={ballTexture}
          roughness={0.42}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
}

function TacticalDrawing3D({ drawing }) {
  const geometry = useMemo(() => {
    // Coordenadas universales: el largo de la cancha corresponde al eje X y el ancho al eje Z.
    const convert = (p) => new THREE.Vector3(p.x - 52.5, 0.14, p.y - 34);
    const a = convert(drawing.start);
    const b = convert(drawing.end);
    const delta = b.clone().sub(a);
    const length = Math.max(delta.length(), 0.001);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize());
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const head = b.clone().add(new THREE.Vector3(0, 0, 0));
    const direction = delta.normalize();
    const dashSegments = [];
    for (let offset = 0; offset < length; offset += 1.35) {
      const segmentLength = Math.min(0.72, length - offset);
      if (segmentLength > 0.02) dashSegments.push({ mid: a.clone().add(direction.clone().multiplyScalar(offset + segmentLength / 2)), length: segmentLength });
    }
    return { a, b, length, quaternion, mid, head, direction, dashSegments };
  }, [drawing.start.x, drawing.start.y, drawing.end.x, drawing.end.y]);
  const radius = Math.max(0.025, Math.min(0.075, (drawing.width || 1.2) * 0.025));
  return (
    <group>
      {drawing.type === 'dashed' ? geometry.dashSegments.map((segment, index) => <mesh key={index} position={segment.mid} quaternion={geometry.quaternion}>
        <cylinderGeometry args={[radius, radius, segment.length, 7]} />
        <meshBasicMaterial color={drawing.color || '#ffffff'} toneMapped={false} />
      </mesh>) : <mesh position={geometry.mid} quaternion={geometry.quaternion}>
        <cylinderGeometry args={[radius, radius, geometry.length, 7]} />
        <meshBasicMaterial color={drawing.color || '#ffffff'} toneMapped={false} />
      </mesh>}
      {drawing.type !== 'straight' && drawing.type !== 'dashed' && <mesh position={geometry.head} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), geometry.direction)}>
        <coneGeometry args={[radius * 3.2, 0.52, 8]} />
        <meshBasicMaterial color={drawing.color || '#ffffff'} toneMapped={false} />
      </mesh>}
    </group>
  );
}

function TacticalText3D({ item }) {
  const x = item.x - 52.5;
  const z = item.y - 34;
  return <Html position={[x, 0.3, z]} center distanceFactor={24}>
    <div style={{ color: item.color || '#ffffff', fontWeight: item.isBold === false ? 600 : 900, fontSize: `${Math.max(10, Math.min(22, (item.size || 2.8) * 4))}px`, textDecoration: item.isUnderline ? 'underline' : 'none', textShadow: '0 1px 4px rgba(0,0,0,.95)', whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none' }}>
      {item.text}
    </div>
  </Html>;
}
// ===== ENTORNO REALISTA: CIELO, CÉSPED, VALLAS, PORTERÍAS Y GRADERÍAS CON BUTACAS (todo procedural) =====

// ---- Utilidades de textura de canvas (cacheadas) ----
const _envTexCache = new Map();
function envCanvasTexture(key, w, h, draw, opts = {}) {
  if (_envTexCache.has(key)) return _envTexCache.get(key);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = opts.clampT ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  _envTexCache.set(key, t);
  return t;
}

// Césped: ruido de briznas sin costuras (cada trazo se repite en los bordes)
function getGrassTexture(rx, ry) {
  return envCanvasTexture(`grass|${rx}|${ry}`, 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d4d9d0';
    ctx.fillRect(0, 0, w, h);
    let s = 1234567;
    const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    for (let i = 0; i < 5200; i++) {
      const x = rnd() * w, y = rnd() * h, len = 4 + rnd() * 9, lean = (rnd() - 0.5) * 3;
      const v = Math.floor(170 + rnd() * 85);
      ctx.strokeStyle = `rgba(${v},${Math.min(255, v + 12)},${Math.max(0, v - 18)},${0.25 + rnd() * 0.35})`;
      ctx.lineWidth = 1 + rnd() * 1.2;
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
        ctx.beginPath(); ctx.moveTo(x + ox, y + oy); ctx.lineTo(x + ox + lean, y + oy - len); ctx.stroke();
      }
    }
    for (let i = 0; i < 900; i++) {
      const x = rnd() * w, y = rnd() * h;
      ctx.fillStyle = `rgba(60,70,50,${0.05 + rnd() * 0.08})`;
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) ctx.fillRect(x + ox, y + oy, 2, 2);
    }
  }, { repeat: [rx, ry] });
}

// Cielo azul con degradado, sol suave y nubes (esfera interior)
function getSkyTexture() {
  return envCanvasTexture('sky', 2048, 1024, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1c64c7');
    g.addColorStop(0.32, '#3d8fe0');
    g.addColorStop(0.46, '#8cc4f2');
    g.addColorStop(0.5, '#d6ecfb');
    g.addColorStop(0.56, '#cfe6f7');
    g.addColorStop(1, '#a9c9e2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    let s = 987654;
    const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    // sol
    const sun = ctx.createRadialGradient(w * 0.62, h * 0.3, 0, w * 0.62, h * 0.3, 150);
    sun.addColorStop(0, 'rgba(255,252,230,0.95)');
    sun.addColorStop(0.25, 'rgba(255,248,215,0.45)');
    sun.addColorStop(1, 'rgba(255,248,215,0)');
    ctx.fillStyle = sun; ctx.fillRect(0, 0, w, h);
    // nubes (grupos de manchas suaves, repetidas en los bordes para cerrar el panorama)
    for (let n = 0; n < 34; n++) {
      const cx = rnd() * w, cy = h * (0.2 + rnd() * 0.27), size = 50 + rnd() * 120;
      const blobs = 6 + Math.floor(rnd() * 7);
      for (let b = 0; b < blobs; b++) {
        const bx = cx + (rnd() - 0.5) * size * 2.2, by = cy + (rnd() - 0.5) * size * 0.35, br = size * (0.35 + rnd() * 0.45);
        for (const ox of [-w, 0, w]) {
          const rg = ctx.createRadialGradient(bx + ox, by, 0, bx + ox, by, br);
          rg.addColorStop(0, 'rgba(255,255,255,0.62)');
          rg.addColorStop(0.55, 'rgba(255,255,255,0.28)');
          rg.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = rg;
          ctx.fillRect(bx + ox - br, by - br, br * 2, br * 2);
        }
      }
    }
  }, { clampT: true });
}

// Publicidad perimetral LED profesional sin sobreposición de textos
function getAdTexture() {
  return envCanvasTexture('ads-led-calibrated', 2048, 128, (ctx, w, h) => {
    // Fondo base negro LED
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, w, h);

    const panels = [
      { bg: '#061325', border: '#0284c7', fg: '#38bdf8', text: '★ ANDEZ SPORTS TACTICS PRO ★' },
      { bg: '#18181b', border: '#eab308', fg: '#facc15', text: 'PIZARRA TÁCTICA MULTIDEPORTE' },
      { bg: '#062817', border: '#10b981', fg: '#34d399', text: 'METODOLOGÍA & RENDIMIENTO' },
      { bg: '#1c1917', border: '#f43f5e', fg: '#fb7185', text: 'ANDEZTPRO.COM • SISTEMA OFICIAL' }
    ];

    const slotW = w / panels.length;
    const gap = 16; // Separación física negra para evitar cualquier choque de texto

    panels.forEach((p, i) => {
      const x = i * slotW + gap / 2;
      const pw = slotW - gap;

      // Pantalla individual de cada módulo LED
      ctx.fillStyle = p.bg;
      ctx.fillRect(x, 4, pw, h - 8);

      // Marco perimetral luminoso
      ctx.strokeStyle = p.border;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, 4, pw, h - 8);

      // Líneas de acento LED superior e inferior
      ctx.fillStyle = p.fg;
      ctx.fillRect(x + 10, 8, pw - 20, 2);
      ctx.fillRect(x + 10, h - 10, pw - 20, 2);

      // Tipografía calibrada con límite estricto de ancho
      ctx.fillStyle = p.fg;
      ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.text, x + pw / 2, h / 2, pw - 40); // Margen de seguridad lateral de 40px
    });
  }, { repeat: [1, 1] });
}

const _envMatCache = new Map();
function envMat(key, make) {
  if (!_envMatCache.has(key)) _envMatCache.set(key, make());
  return _envMatCache.get(key);
}

// ---- Cielo + suelo exterior ----
function SkyAndGround() {
  const sky = useMemo(() => getSkyTexture(), []);
  return (
    <group dispose={null} raycast={() => null}>
      <mesh renderOrder={-10} raycast={() => null}>
        <sphereGeometry args={[480, 48, 24]} />
        <meshBasicMaterial map={sky} side={THREE.BackSide} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
      {/* Terreno exterior al estadio */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} raycast={() => null}>
        <circleGeometry args={[470, 48]} />
        <meshStandardMaterial color="#3b5e2b" roughness={0.95} />
      </mesh>
    </group>
  );
}

// ---- Red de portería (malla romboidal procedural, UV en metros) ----
const GOAL_NET_CELL = 0.2;
let _goalNetMat = null;
function getGoalNetMaterial() {
  if (_goalNetMat) return _goalNetMat;
  const S = 64;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4.6; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, S / 2); ctx.lineTo(S / 2, 0); ctx.moveTo(S / 2, 0); ctx.lineTo(S, S / 2);
  ctx.moveTo(S, S / 2); ctx.lineTo(S / 2, S); ctx.moveTo(S / 2, S); ctx.lineTo(0, S / 2);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  [[0, S / 2], [S, S / 2], [S / 2, 0], [S / 2, S]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 4.6, 0, Math.PI * 2); ctx.fill(); });
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.needsUpdate = true;
  _goalNetMat = new THREE.MeshBasicMaterial({ color: '#eef2f6', alphaMap: t, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
  return _goalNetMat;
}

// Panel plano de red a partir de 4 puntos 3D (UV proyectadas al plano del panel, en celdas de red)
function goalNetPanelGeometry(p) {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const e1 = nrm(sub(p[1], p[0]));
  let e2 = sub(p[3], p[0]);
  const k = dot(e2, e1);
  e2 = nrm([e2[0] - e1[0] * k, e2[1] - e1[1] * k, e2[2] - e1[2] * k]);
  const pos = [];
  const uv = [];
  p.forEach((q) => {
    const d = sub(q, p[0]);
    pos.push(q[0], q[1], q[2]);
    uv.push(dot(d, e1) / GOAL_NET_CELL, dot(d, e2) / GOAL_NET_CELL);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}

function GoalBar({ a, b, r = 0.05, mat }) {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const d = vb.clone().sub(va);
    const l = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    return { pos: va.clone().add(vb).multiplyScalar(0.5), quat: q, len: l };
  }, [a[0], a[1], a[2], b[0], b[1], b[2]]);
  return (
    <mesh position={pos} quaternion={quat} material={mat} castShadow>
      <cylinderGeometry args={[r, r, len, 12]} />
    </mesh>
  );
}

// Portería FIFA 7.32 x 2.44 m con marco trasero inclinado y red tensada (techo 1.0 m, base 2.0 m)
function GoalFrame({ xPos, dir }) {
  const W = 3.66, H = 2.44, DT = 1.0, DB = 2.0;
  const frameMat = envMat('goal-frame', () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.28, metalness: 0.1 }));
  const netMat = getGoalNetMaterial();
  const X = (d) => dir * d;
  const geos = useMemo(() => {
    const sideL = goalNetPanelGeometry([[0, 0, -W], [0, H, -W], [X(DT), H, -W], [X(DB), 0, -W]]);
    const sideR = goalNetPanelGeometry([[0, 0, W], [0, H, W], [X(DT), H, W], [X(DB), 0, W]]);
    const top = goalNetPanelGeometry([[0, H, -W], [0, H, W], [X(DT), H, W], [X(DT), H, -W]]);
    const back = goalNetPanelGeometry([[X(DT), H, -W], [X(DT), H, W], [X(DB), 0, W], [X(DB), 0, -W]]);
    return [sideL, sideR, top, back];
  }, [dir]);
  useEffect(() => () => geos.forEach((g) => g.dispose()), [geos]);
  return (
    <group position={[xPos, 0, 0]} dispose={null}>
      {/* Postes y travesaño */}
      <GoalBar a={[0, 0, -W]} b={[0, H, -W]} r={0.06} mat={frameMat} />
      <GoalBar a={[0, 0, W]} b={[0, H, W]} r={0.06} mat={frameMat} />
      <GoalBar a={[0, H, -W]} b={[0, H, W]} r={0.06} mat={frameMat} />
      {/* Brazos superiores hacia atrás, parantes traseros inclinados y bases */}
      {[-W, W].map((z) => (
        <group key={`frame-${z}`}>
          <GoalBar a={[0, H, z]} b={[X(DT), H, z]} r={0.035} mat={frameMat} />
          <GoalBar a={[X(DT), H, z]} b={[X(DB), 0.04, z]} r={0.035} mat={frameMat} />
          <GoalBar a={[0, 0.04, z]} b={[X(DB), 0.04, z]} r={0.035} mat={frameMat} />
        </group>
      ))}
      <GoalBar a={[X(DT), H, -W]} b={[X(DT), H, W]} r={0.03} mat={frameMat} />
      <GoalBar a={[X(DB), 0.04, -W]} b={[X(DB), 0.04, W]} r={0.035} mat={frameMat} />
      {/* Redes */}
      {geos.map((g, i) => <mesh key={`net-${i}`} geometry={g} material={netMat} />)}
    </group>
  );
}

// ---- Graderías: dos niveles, butacas visibles (InstancedMesh), pasillos, vomitorios, techo con vigas ----
const STAND_STYLES = {
  red:  { seat: '#c1272d', alt: '#f4f1ea', accent: '#c1272d' },
  blue: { seat: '#1f4fb8', alt: '#f4f1ea', accent: '#1f4fb8' },
};
const STAND_SEAT_SPACING = 0.62; // sube a 0.8 si necesitas más rendimiento en móviles
const ST = { R1: 12, RISE1: 0.4, RD: 0.82, CONC: 2.4, FASCIA: 1.4, R2: 14, RISE2: 0.5 };

let _seatGeo = null;
function getSeatGeometry() {
  if (_seatGeo) return _seatGeo;
  // faces de BoxGeometry: 0:+x 1:-x 2:+y 3:-y 4:+z 5:-z. El asiento mira hacia -z (hacia la cancha).
  const mk = (w, h, d, cx, cy, cz, faces) => {
    const g = new THREE.BoxGeometry(w, h, d);
    const src = g.index.array;
    const keep = [];
    faces.forEach((f) => { for (let k = 0; k < 6; k++) keep.push(src[f * 6 + k]); });
    g.setIndex(keep);
    g.translate(cx, cy, cz);
    return g;
  };
  const cushion = mk(0.46, 0.1, 0.42, 0, 0.22, -0.05, [0, 1, 2, 5]);
  const back = mk(0.46, 0.46, 0.07, 0, 0.5, 0.17, [0, 1, 2, 5]);
  _seatGeo = mergePlayerGeos([cushion, back]);
  cushion.dispose(); back.dispose();
  return _seatGeo;
}

function buildStandSeats(length, style, seed) {
  const rows = [];
  for (let i = 0; i < ST.R1; i++) rows.push({ z: i * ST.RD + ST.RD / 2, y: (i + 1) * ST.RISE1, r: i });
  const zUp0 = ST.R1 * ST.RD + ST.CONC;
  const base2 = ST.R1 * ST.RISE1 + ST.FASCIA;
  for (let j = 0; j < ST.R2; j++) rows.push({ z: zUp0 + j * ST.RD + ST.RD / 2, y: base2 + (j + 1) * ST.RISE2, r: ST.R1 + 1.6 + j });

  // Estrella blanca central (motivo del asiento) y variación sutil de tono
  const star = [];
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5; const rad = k % 2 === 0 ? 11 : 4.6; star.push([Math.cos(a) * rad, Math.sin(a) * rad]); }
  const inStar = (x, y) => {
    let inside = false;
    for (let i = 0, j = star.length - 1; i < star.length; j = i++) {
      const [xi, yi] = star[i], [xj, yj] = star[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  const totalRows = ST.R1 + 1.6 + ST.R2;
  const cy = (totalRows * 0.85) / 2;

  const mats = [];
  const cols = [];
  const dummy = new THREE.Object3D();
  let s = seed * 7919 + 17;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const base = new THREE.Color(style.seat);
  const alt = new THREE.Color(style.alt);
  const nSeats = Math.floor((length - 1) / STAND_SEAT_SPACING);
  rows.forEach((row) => {
    for (let k = 0; k < nSeats; k++) {
      const x = -length / 2 + 0.5 + (k + 0.5) * STAND_SEAT_SPACING;
      const aisle = Math.abs((((x + length / 2) % 18) + 18) % 18 - 9);
      if (aisle < 0.75) continue; // pasillo de escaleras
      dummy.position.set(x, row.y, row.z);
      dummy.updateMatrix();
      mats.push(dummy.matrix.clone());
      const white = inStar(x, row.r * 0.85 - cy);
      const c = (white ? alt : base).clone();
      c.offsetHSL(0, 0, (rnd() - 0.5) * 0.05);
      cols.push(c);
    }
  });
  const mesh = new THREE.InstancedMesh(getSeatGeometry(), envMat('seat-mat', () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, metalness: 0.05 })), mats.length);
  mats.forEach((m, i) => { mesh.setMatrixAt(i, m); mesh.setColorAt(i, cols[i]); });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere && mesh.computeBoundingSphere();
  return mesh;
}

// Marco local: X = largo, Y = arriba, Z = hacia AFUERA de la cancha
function Stand({ position, rotationY = 0, length, variant = 'blue', seed = 1 }) {
  const style = STAND_STYLES[variant] || STAND_STYLES.blue;
  const zUp0 = ST.R1 * ST.RD + ST.CONC;
  const base2 = ST.R1 * ST.RISE1 + ST.FASCIA;
  const depth = zUp0 + ST.R2 * ST.RD;
  const topH = base2 + ST.R2 * ST.RISE2;

  const seats = useMemo(() => buildStandSeats(length, style, seed), [length, style, seed]);
  useEffect(() => () => seats.dispose && seats.dispose(), [seats]);

  const concrete = envMat('st-concrete', () => new THREE.MeshStandardMaterial({ color: '#aab2bd', roughness: 0.92 }));
  const riser = envMat('st-riser', () => new THREE.MeshStandardMaterial({ color: '#d3d9e0', roughness: 0.9 }));
  const back = envMat('st-back', () => new THREE.MeshStandardMaterial({ color: '#7b8592', roughness: 0.95 }));
  const stepMats = useMemo(() => [concrete, concrete, concrete, concrete, back, riser], [concrete, riser, back]);
  const accent = envMat(`st-accent-${variant}`, () => new THREE.MeshStandardMaterial({ color: style.accent, roughness: 0.5 }));
  const dark = envMat('st-dark', () => new THREE.MeshStandardMaterial({ color: '#2b3340', roughness: 0.6, metalness: 0.35 }));
  const roofTop = envMat('st-roof-top', () => new THREE.MeshStandardMaterial({ color: '#e6ebf0', roughness: 0.55, metalness: 0.2 }));
  const roofMats = useMemo(() => [dark, dark, roofTop, dark, dark, dark], [dark, roofTop]);
  const voidMat = envMat('st-void', () => new THREE.MeshStandardMaterial({ color: '#0d141f', roughness: 1 }));

  // Techo en voladizo
  const zf = zUp0 + 2, yf = topH - 1.2;
  const zb = depth + 2.5, yb = topH + 4.4;
  const roofLen = Math.hypot(zb - zf, yb - yf);
  const roofTilt = -Math.atan2(yb - yf, zb - zf);
  const yAt = (z) => yf + ((yb - yf) / (zb - zf)) * (z - zf);
  const nRibs = Math.max(3, Math.round(length / 7));
  const nCols = Math.max(2, Math.round(length / 14));
  const nDoors = Math.max(2, Math.round(length / 36));

  return (
    <group position={position} rotation={[0, rotationY, 0]} dispose={null}>
      {/* Nivel inferior: escalones macizos */}
      {Array.from({ length: ST.R1 }).map((_, i) => {
        const h = (i + 1) * ST.RISE1;
        return (
          <mesh key={`l-${i}`} position={[0, h / 2, i * ST.RD + ST.RD / 2]} material={stepMats}>
            <boxGeometry args={[length, h, ST.RD]} />
          </mesh>
        );
      })}
      {/* Pasillo (concourse) entre niveles */}
      <mesh position={[0, (ST.R1 * ST.RISE1) / 2, ST.R1 * ST.RD + ST.CONC / 2]} material={stepMats}>
        <boxGeometry args={[length, ST.R1 * ST.RISE1, ST.CONC]} />
      </mesh>
      {/* Nivel superior */}
      {Array.from({ length: ST.R2 }).map((_, j) => {
        const h = base2 + (j + 1) * ST.RISE2;
        return (
          <mesh key={`u-${j}`} position={[0, h / 2, zUp0 + j * ST.RD + ST.RD / 2]} material={stepMats}>
            <boxGeometry args={[length, h, ST.RD]} />
          </mesh>
        );
      })}
      {/* Franja de color en la contrahuella del nivel superior y barandilla del nivel inferior */}
      <mesh position={[0, ST.R1 * ST.RISE1 + 0.9, zUp0 - 0.02]} material={accent}>
        <boxGeometry args={[length, 0.5, 0.06]} />
      </mesh>
      <mesh position={[0, 0.55, -0.15]} material={accent}>
        <boxGeometry args={[length, 1.1, 0.15]} />
      </mesh>
      {/* Vomitorios (accesos oscuros) en el muro del pasillo */}
      {Array.from({ length: nDoors }).map((_, d) => (
        <mesh key={`door-${d}`} position={[-length / 2 + ((d + 0.5) * length) / nDoors, ST.R1 * ST.RISE1 + 1.3, zUp0 - 0.05]} material={voidMat}>
          <boxGeometry args={[3.6, 1.8, 0.08]} />
        </mesh>
      ))}
      {/* Butacas (instanciadas) */}
      <primitive object={seats} />

      {/* Techo: placa, canto frontal, vigas inferiores y columnas */}
      <mesh position={[0, (yf + yb) / 2, (zf + zb) / 2]} rotation={[roofTilt, 0, 0]} material={roofMats}>
        <boxGeometry args={[length, 0.35, roofLen]} />
      </mesh>
      <mesh position={[0, yf, zf]} material={accent}>
        <boxGeometry args={[length, 0.6, 0.3]} />
      </mesh>
      {Array.from({ length: nRibs + 1 }).map((_, k) => (
        <mesh key={`rib-${k}`} position={[-length / 2 + (k * length) / nRibs, (yf + yb) / 2 - 0.38, (zf + zb) / 2]} rotation={[roofTilt, 0, 0]} material={dark}>
          <boxGeometry args={[0.22, 0.5, roofLen]} />
        </mesh>
      ))}
      {Array.from({ length: nCols + 1 }).map((_, k) => {
        const colZ = zb - 1.2;
        const colH = yAt(colZ) - 0.4;
        return (
          <mesh key={`col-${k}`} position={[-length / 2 + (k * length) / nCols, colH / 2, colZ]} material={dark}>
            <boxGeometry args={[0.55, colH, 0.55]} />
          </mesh>
        );
      })}
    </group>
  );
}

function AdBoards() {
  const base = useMemo(() => getAdTexture(), []);
  const mats = useMemo(() => {
    const mk = (len, repeats) => {
      const t = base.clone();
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      t.repeat.set(repeats, 1);
      t.needsUpdate = true;
      return new THREE.MeshStandardMaterial({
        map: t,
        emissiveMap: t,
        emissive: '#ffffff',
        emissiveIntensity: 0.45,
        roughness: 0.45
      });
    };
    // Repeticiones enteras exactas para evitar que los textos se corten
    return { long: mk(110, 5), short: mk(74, 3) };
  }, [base]);
  useEffect(() => () => { mats.long.map.dispose(); mats.short.map.dispose(); mats.long.dispose(); mats.short.dispose(); }, [mats]);
  return (
    <group dispose={null} raycast={() => null}>
      {[-36.8, 36.8].map((z) => (
        <mesh key={`bz-${z}`} position={[0, 0.55, z]} rotation={[0, z < 0 ? 0 : Math.PI, 0]} material={mats.long} raycast={() => null}>
          <boxGeometry args={[110, 1.1, 0.12]} />
        </mesh>
      ))}
      {[-55.8, 55.8].map((x) => (
        <mesh key={`bx-${x}`} position={[x, 0.55, 0]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]} material={mats.short} raycast={() => null}>
          <boxGeometry args={[74, 1.1, 0.12]} />
        </mesh>
      ))}
    </group>
  );
}

function StadiumEnvironment() {
  const towers = [[-96, -76], [96, -76], [-96, 76], [96, 76]];
  return (
    <group>
      <SkyAndGround />
      {/* Graderías largas (detrás de las bandas) cierran las esquinas; las de fondo (detrás de las porterías) completan el óvalo */}
      <Stand position={[0, 0, -41]} rotationY={Math.PI} length={169.4} variant="blue" seed={1} />
      <Stand position={[0, 0, 41]} rotationY={0} length={169.4} variant="blue" seed={2} />
      <Stand position={[-61, 0, 0]} rotationY={-Math.PI / 2} length={82} variant="red" seed={3} />
      <Stand position={[61, 0, 0]} rotationY={Math.PI / 2} length={82} variant="red" seed={4} />

      <AdBoards />

      {/* Torres de iluminación exteriores */}
      {towers.map(([x, z]) => (
        <group key={`tower-${x}-${z}`} position={[x, 0, z]}>
          <mesh position={[0, 21, 0]}><cylinderGeometry args={[0.35, 0.55, 42, 10]} /><meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.4} /></mesh>
          <group position={[0, 42, 0]} rotation={[0, Math.atan2(-x, -z), 0]}>
            <mesh><boxGeometry args={[7, 4, 0.6]} /><meshStandardMaterial color="#e2e8f0" emissive="#fff7d6" emissiveIntensity={0.9} roughness={0.4} /></mesh>
          </group>
        </group>
      ))}

      {/* Explanada de hormigón entre el césped y las graderías */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <planeGeometry args={[190, 150]} />
        <meshStandardMaterial color="#6d7580" roughness={0.95} />
      </mesh>
    </group>
  );
}

function Scene3D({ objects, setObjects, drawings, textBlocks, selectedObj, setSelectedObj, teamColors, cameraLocked, recordHistory, isPC }) {
  const isDragging = useRef(false);
  const dragId = useRef(null);
  const dragOffset = useRef(new THREE.Vector3());
  const [activeDragId, setActiveDragId] = useState(null);
  const mathPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const planeIntersect = useMemo(() => new THREE.Vector3(), []);

  // Proyección universal 1:1 (Calibrada para PC horizontal y Celular vertical)
  const toWorld = (obj) => {
    if (isPC) {
      return { x: obj.x - 52.5, z: obj.y - 34 };
    }
    // En celular: el eje vertical Y (0..105) se mapea al largo X de la cancha 3D (-52.5..+52.5)
    // y el ancho X (0..68) se mapea al ancho Z (-34..+34)
    return {
      x: (obj.y - 52.5),
      z: (34 - obj.x)
    };
  };
  const handlePointerDown = (e, obj) => {
    if (!cameraLocked) return;
    e.stopPropagation();
    setSelectedObj(obj);
    dragId.current = obj.id;
    isDragging.current = true;
    setActiveDragId(obj.id);

    // Ajustar el plano a la altura del objeto antes de calcular el impacto
    const objAlt = obj?.elevation || obj?.altitude || obj?.z || 0;
    mathPlane.constant = -objAlt;

    // Fijar el anclaje exacto del puntero
    if (e.ray && e.ray.intersectPlane(mathPlane, planeIntersect)) {
      dragOffset.current.set(
        planeIntersect.x - (isPC ? obj.x - 52.5 : obj.y - 52.5),
        0,
        planeIntersect.z - (isPC ? obj.y - 34 : 34 - obj.x)
      );
    } else {
      dragOffset.current.set(0, 0, 0);
    }
  };
  const handlePointerMove = (e) => {
    if (!isDragging.current || !dragId.current || !cameraLocked) return;
    e.stopPropagation();

    // 1. Obtener la altura del objeto que se esta arrastrando (0 si es jugador o balon en piso)
    const activeObj = objects.find((o) => o.id === dragId.current);
    const objAlt = activeObj?.elevation || activeObj?.altitude || activeObj?.z || 0;

    // 2. Ajustar el plano matematico a la altura real del objeto para que el zoom no desvie el puntero
    mathPlane.constant = -objAlt;

    if (e.ray && e.ray.intersectPlane(mathPlane, planeIntersect)) {
      const targetWorldX = planeIntersect.x - dragOffset.current.x;
      const targetWorldZ = planeIntersect.z - dragOffset.current.z;

      let clampedX, clampedY;
      if (isPC) {
        clampedX = Math.max(1, Math.min(104, targetWorldX + 52.5));
        clampedY = Math.max(1, Math.min(67, targetWorldZ + 34));
      } else {
        // En celular: inversión simétrica exacta 1:1 con la huella táctil
        clampedX = Math.max(1, Math.min(67, 34 - targetWorldZ));
        clampedY = Math.max(1, Math.min(104, targetWorldX + 52.5));
      }

      setObjects((prev) =>
        prev.map((o) =>
          o.id === dragId.current ? { ...o, x: clampedX, y: clampedY } : o
        )
      );
    }
  };

  const handlePointerUp = (e) => {
    if (isDragging.current) {
      if (e && e.stopPropagation) e.stopPropagation();
      isDragging.current = false;
      dragId.current = null;
      setActiveDragId(null);
      if (recordHistory) recordHistory(objects);
    }
  };

  // En móvil usamos una perspectiva diagonal para conservar el volumen 3D y
  // encuadrar la cancha con sus dos porterías. Se mantiene el eje vertical natural de Three.js.
  const camPos = isPC ? [0, 26, 46] : [0, 38, 52];
const camFov = isPC ? 45 : 55;

  return (
    <>
      <PerspectiveCamera makeDefault position={camPos} fov={camFov} up={[0, 1, 0]} />
      <OrbitControls
        enabled={!cameraLocked}
        target={[0, 0, 0]}
        maxPolarAngle={Math.PI / 2.05}
        minPolarAngle={0.2}
        minDistance={15}
        maxDistance={140}
        enableDamping
        dampingFactor={0.08}
      />
      {/* Atmósfera e iluminación natural de estadio con niebla de horizonte */}
      <fog attach="fog" args={["#93c5fd", 80, 260]} />
      <ambientLight intensity={0.88} color="#ffffff" />
      <hemisphereLight args={["#bae6fd", "#1e3a24", 0.72]} />
      <directionalLight
        position={[22, 42, 24]}
        intensity={2.1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-20, 24, -20]} intensity={0.45} color="#e0f2fe" />

      {/* Cancha 3D en coordenadas nativas, sin rotación CSS del viewport. */}
      <Pitch3D />
      <StadiumEnvironment />

      {/* Malla receptora de interacción táctil y mouse con rango amplio */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        onPointerDown={(e) => {
          if (window.__onPickFlightTarget && e.point) {
            e.stopPropagation();
            window.__onPickFlightTarget(e.point);
          }
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <planeGeometry args={[160, 160]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {(drawings || []).map((drawing) => <TacticalDrawing3D key={`drawing-${drawing.id}`} drawing={drawing} />)}
      {(textBlocks || []).map((item) => <TacticalText3D key={`text-${item.id}`} item={item} />)}

      {objects.map((obj) => {
        const pos = toWorld(obj);
        const onDown = (e) => handlePointerDown(e, obj);

        if (obj.type === 'player') {
          const col = obj.customColor || (
            obj.role === 'GK'
              ? (obj.team === 'red' || obj.team === 'gk_away' ? teamColors.gk_away : teamColors.gk)
              : (obj.team === 'blue' ? teamColors.blue : teamColors.red)
          );
          return (
            <group
              key={obj.id}
              position={[pos.x, 0, pos.z]}
              onPointerDown={onDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* Hitbox táctil ampliada para móvil */}
              <mesh position={[0, 1.1, 0]}>
                <cylinderGeometry args={[1.4, 1.4, 2.4, 12]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
              <TacticalPlayer3D
                color={col}
                number={obj.number}
                role={(obj.role === 'GK' || obj.team === 'gk' || obj.team === 'gk_away') ? 'GK' : obj.role}
                isSelected={selectedObj?.id === obj.id}
                onClick={() => {}}
              />
            </group>
          );
        }
        if (obj.type === 'ball') {
          return (
            <group
              key={obj.id}
              position={[pos.x, 0, pos.z]}
              onPointerDown={onDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* Hitbox vertical integral: permite arrastrar el balón tanto en el piso como en el aire */}
    <mesh position={[0, 2.0, 0]}>
      <cylinderGeometry args={[1.6, 1.6, 4.2, 12]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
              <Ball3D position={obj} isSelected={selectedObj?.id === obj.id} onClick={() => setSelectedObj(obj)} />
            </group>
          );
        }
        if (['cone', 'saucer', 'ring', 'pole', 'hurdle', 'dummy', 'mini_goal', 'ladder', 'rebounder', 'trampoline', 'mat'].includes(obj.type)) {
          return (
            <group
              key={obj.id}
              position={[pos.x, 0, pos.z]}
              onPointerDown={onDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* Hitbox invisible común para conos y material: facilita tocar sin cambiar su aspecto. */}
              <mesh position={[0, 0.85, 0]}>
                <cylinderGeometry args={[1.35, 1.35, 1.7, 12]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
              <TrainingObject3D obj={obj} position={{ x: 52.5, y: 34 }} onClick={() => {}} />
            </group>
          );
        }
        return null;
      })}
    </>
  );
}

export default function App() {
  const [isPC, setIsPC] = useState(window.innerWidth > 768);
  const [viewMode, setViewMode] = useState('2d');
  const [cameraLocked, setCameraLocked] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsPC(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [showKitPalette, setShowKitPalette] = useState(false);
  const [kitTarget, setKitTarget] = useState('blue');
  const [teamColors, setTeamColors] = useState({
    blue: '#2563eb',
    red: '#dc2626',
    gk: '#f59e0b',
    gk_away: '#16a34a'
  });

  const officialKitColors = [
    { name: 'Blanco', hex: '#ffffff' },
    { name: 'Negro', hex: '#18181b' },
    { name: 'Azul', hex: '#2563eb' },
    { name: 'Rojo', hex: '#dc2626' },
    { name: 'Amarillo', hex: '#eab308' },
    { name: 'Verde', hex: '#16a34a' },
    { name: 'Naranja', hex: '#f97316' },
    { name: 'Celeste', hex: '#06b6d4' }
  ];

  const handleUpdateKitColor = (colorHex) => {
    setTeamColors(prev => ({ ...prev, [kitTarget]: colorHex }));
    setObjects(prev => prev.map(obj => {
      if (obj.type !== 'player') return obj;
      if (kitTarget === 'gk' && obj.role === 'GK' && (obj.team === 'gk' || obj.team === 'blue')) {
        return { ...obj, customColor: colorHex };
      }
      if (kitTarget === 'gk_away' && obj.role === 'GK' && (obj.team === 'gk_away' || obj.team === 'red')) {
        return { ...obj, customColor: colorHex };
      }
      if (kitTarget === 'blue' && obj.role !== 'GK' && obj.team === 'blue') {
        return { ...obj, customColor: colorHex };
      }
      if (kitTarget === 'red' && obj.role !== 'GK' && obj.team === 'red') {
        return { ...obj, customColor: colorHex };
      }
      return obj;
    }));
  };

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
      { id: 'lic-1', coach: 'Prof. Carlos Morales', club: 'Escuela Los Andes', code: 'AND-7821', seats: 4, devices: [], status: 'active', plan: 'Plan Plata (4 Dispositivos)', price: 25000, expiry: '2026-11-15', disciplines: ['soccer'] },
      { id: 'lic-2', coach: 'DT Matías Soto', club: 'Academia Biobío', code: 'AND-4412', seats: 2, devices: [], status: 'active', plan: 'Plan Individual (2 Dispositivos)', price: 15000, expiry: '2026-11-10', disciplines: ['soccer'] }
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
  const [billingMessageTemplate, setBillingMessageTemplate] = useState(() => localStorage.getItem('andez_billing_template') || 'Estimado(a) apoderado(a) de {ALUMNO}, le recordamos desde Andez Sports Tactics Pro que la mensualidad correspondiente al mes en curso se encuentra pendiente. Agradecemos regularizar el pago.');

  const [inputLicenseCode, setInputLicenseCode] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleClientLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const code = inputLicenseCode.trim().toUpperCase();

    if (code === 'ANDEZ2026') {
      const u = { role: 'owner', name: 'Administrador Maestro', club: 'Andez Sports Tactics Pro Principal' };
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
        sbSet('andez_custom_club_logo', ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');

  const [newCoachStaffName, setNewCoachStaffName] = useState('');
  const [newCoachStaffRole, setNewCoachStaffRole] = useState('Director Técnico');
  const [newCoachStaffCategory, setNewCoachStaffCategory] = useState(categories[0]?.id || 'sub10');
  const [newCoachStaffPhone, setNewCoachStaffPhone] = useState('+569');
  const [newCoachStaffCode, setNewCoachStaffCode] = useState('');
  const [editingCoach, setEditingCoach] = useState(null);
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

  const [drillTitle, setDrillTitle] = useState('Salida y Progresión');
  const [drillCategory, setDrillCategory] = useState(categories[0]?.id || 'sub14');
  const [drillNotes, setDrillNotes] = useState('Transición rápida a 2 toques.');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [customSystems, setCustomSystems] = useState(() => {
    const s = localStorage.getItem('andez_custom_tactical_systems');
    return s ? JSON.parse(s) : null;
  });
  const [newSystemNameInput, setNewSystemNameInput] = useState('');
  const [savedDrills, setSavedDrills] = useState(() => {
    const d = localStorage.getItem('andez_saved_drills');
    return d ? JSON.parse(d) : [];
  });

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    async function hydrateFromCloud() {
      try {
        const [cloudPlans, cloudLics, cloudCats, cloudCoaches, cloudRosters, cloudAtt, cloudDrills, cloudLogo] = await Promise.all([
          sbGet('andez_custom_plans'),
          sbGet('andez_licenses'),
          sbGet('andez_dynamic_categories'),
          sbGet('andez_coaches_staff'),
          sbGet('andez_category_rosters'),
          sbGet('andez_attendance_records'),
          sbGet('andez_saved_drills'),
          sbGet('andez_custom_club_logo')
        ]);

        if (cloudPlans && Array.isArray(cloudPlans)) setCustomPlans(cloudPlans);
        if (cloudLics && Array.isArray(cloudLics)) setAdminLicenses(cloudLics);
        if (cloudCats && Array.isArray(cloudCats)) setCategories(cloudCats);
        if (cloudCoaches && Array.isArray(cloudCoaches)) setCoachesList(cloudCoaches);
        if (cloudRosters && typeof cloudRosters === 'object') setRosters(cloudRosters);
        if (cloudAtt && typeof cloudAtt === 'object') setAttendanceRecords(cloudAtt);
        if (cloudDrills && Array.isArray(cloudDrills)) setSavedDrills(cloudDrills);
        if (cloudLogo) { setCustomLogo(cloudLogo); localStorage.setItem('andez_custom_club_logo', cloudLogo); }
      } catch (err) {
        console.error('Error al sincronizar con Supabase:', err);
      } finally {
        setIsDataLoaded(true);
      }
    }
    hydrateFromCloud();
  }, []);

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
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textIsBold, setTextIsBold] = useState(true);
  const [textIsUnderline, setTextIsUnderline] = useState(false);
  const [textSize, setTextSize] = useState(2.8);

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

  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const startRecording = async () => {
    setRecordedVideoUrl(null);
    recordedChunksRef.current = [];
    try {
      let stream = null;

      // 1. En móviles o en modo 3D, capturar directamente el lienzo WebGL sin pedir pantalla completa
      const canvasEl = document.querySelector('canvas');
      if (canvasEl && (viewMode === '3d' || !navigator.mediaDevices?.getDisplayMedia)) {
        stream = canvasEl.captureStream(30);
      } else if (navigator.mediaDevices?.getDisplayMedia) {
        // 2. En PC permite la selección de pantalla/ventana habitual
        stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 } });
      }

      if (!stream) {
        alert('Tu navegador no admite la grabación directa en este modo.');
        return;
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const mr = new MediaRecorder(stream, { mimeType });
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
      alert('No se pudo iniciar la grabación.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
  };

  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const handleGenerateTacticalPrompt = async (e) => {
    e.preventDefault();
    if (!promptText.trim() || isGeneratingPrompt) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert("No se encontró la clave VITE_GEMINI_API_KEY en las variables de entorno.");
      return;
    }

    setIsGeneratingPrompt(true);
    const isHalf = pitchMode === 'half';
    const systemInstruction = `Eres un DT y analista táctico profesional de fútbol.
Convierte la solicitud del usuario en un array JSON con las posiciones exactas en el campo.
GEOMETRÍA Y MEDIDAS OFICIALES (Eje X: 0 a 105 largo, Eje Y: 0 a 68 ancho):
- Centro del campo: X=52.5, Y=34.
- Portería Izquierda: X=2, Y=34.
- Área Chica Izquierda: X va de 0 a 5.5, Y va de 24.8 a 43.2.
- Área Grande Izquierda: X va de 0 a 16.5, Y va de 13.8 a 54.2.
- Punto penal: X=11, Y=34.
- Medialuna: X=18 a 22, Y entre 26 y 42.
- Bandas: Y=8 e Y=60.
FORMATO OBLIGATORIO:
- Jugador: {"id": "p_1", "type": "player", "number": "1", "name": "Arquero", "x": 3, "y": 34, "team": "blue"}
- Balón: {"id": "b_1", "type": "ball", "x": 6, "y": 34}
- Maniquí: {"id": "m_1", "type": "dummy", "name": "Barrera", "x": 20, "y": 34, "rotation": 90}
- Cono: {"id": "c_1", "type": "cone", "color": "#ea580c", "x": 30, "y": 34, "rotation": 0}
- Mini portería: {"id": "mg_1", "type": "mini_goal", "x": 35, "y": 34, "rotation": 0}
Devuelve estricta y únicamente el array JSON.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Instrucción táctica: "${promptText}"` }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
        })
      });
      const data = await response.json();
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const parsedObjects = JSON.parse(rawText);

      if (Array.isArray(parsedObjects) && parsedObjects.length > 0) {
        setObjects(parsedObjects);
        recordHistory(parsedObjects);
        setShowPromptModal(false);
        setPromptText('');
      }
    } catch (err) {
      alert("Error al consultar Gemini: " + err.message);
    } finally {
      setIsGeneratingPrompt(false);
    }
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
      setTextBlocks(prev => prev.map(t => t.id === selectedObj.id ? { ...t, x: c.x, y: c.y } : t));
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
    const baseSystems = typeof GET_TACTICAL_SYSTEMS === 'function' ? GET_TACTICAL_SYSTEMS(isPC) : {};
    const all = { ...baseSystems, ...(customSystems || {}) };
    const sys = all[sysKey];
    if (!sys || !Array.isArray(sys)) return;

    const players = sys.map((p, idx) => ({
      id: 'sys-p-' + Date.now() + '-' + idx,
      type: 'player',
      number: String(p.n ?? p.number ?? (idx === 0 ? '1' : idx + 1)),
      role: p.r ?? p.role ?? (idx === 0 ? 'POR' : 'JUG'),
      x: Number(p.x),
      y: Number(p.y),
      team: p.team || (idx === 0 ? 'gk' : 'blue'),
      name: p.name || ''
    }));

    const nonPlayers = objects.filter(o => o.type !== 'player');
    const u = [...players, ...nonPlayers];
    setObjects(u);
    recordHistory(u);
    setShowSystemsMenu(false);
  };

  const currentDisplayLogo = customLogo || '/logo-andez.png';
  const totalRevenue = adminLicenses.filter(l => l.status === 'active').reduce((sum, l) => sum + (l.price || 0), 0);

  if (!authenticatedUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-[#070b12] text-white p-4 font-sans select-none relative">
        <div className="w-full max-w-md bg-zinc-950/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
          <img src={currentDisplayLogo} alt="Logo" className="w-16 h-16 rounded-2xl mb-4 border border-amber-400 object-cover" />
          <h1 className="text-2xl font-black text-white mb-1">ANDEZ SPORTS TACTICS <span className="text-amber-400">PRO</span></h1>
          <p className="text-xs text-zinc-400 mb-4">Ingreso de Director Técnico, Profesor o Administrador</p>
          <form onSubmit={handleClientLogin} className="w-full space-y-3 my-2">
            <input type="text" value={inputLicenseCode} onChange={e => setInputLicenseCode(e.target.value)} placeholder="Código (ej. ANDEZ2026 / AND-7821)" className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 text-sm text-center font-mono font-bold text-white uppercase focus:border-red-500 outline-none" required />
            {loginError && <p className="text-xs text-red-400 font-bold bg-red-950/50 p-2 rounded-xl border border-red-800">{loginError}</p>}
            <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase rounded-2xl shadow">Ingresar al Sistema</button>
          </form>
          <a href="https://wa.me/56932100183?text=Hola%20Andez%20Sports%20Tactics%20Pro,%20solicito%20acceso" target="_blank" rel="noopener noreferrer" className="w-full mt-3 py-3 bg-zinc-900 border border-zinc-800 hover:border-emerald-500 rounded-2xl text-xs font-bold text-zinc-300 flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-400" /> Soporte Oficial (+56932100183)
          </a>
        </div>
      </div>
    );
  }

  const isTeacherRestricted = authenticatedUser.role === 'coach';
  const currentCategoryContext = isTeacherRestricted ? authenticatedUser.categoryId : (selectedCategoryFilter === 'all' ? (categories[0]?.id || 'sub10') : selectedCategoryFilter);

  return (
    <div
      className="flex flex-col h-screen w-screen bg-black overflow-hidden select-none font-sans print:bg-white print:text-black"
    >
      {/* HEADER */}
      <header className="bg-black px-3 py-1.5 flex items-center justify-between shrink-0 z-30 border-b border-zinc-900 no-print overflow-x-auto max-w-full">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
          <button onClick={() => setPitchMode(pitchMode === 'full' ? 'half' : 'full')} title={`Vista: ${pitchMode === 'full' ? 'Media Cancha' : 'Cancha Entera'}`} className={`p-1 rounded transition ${pitchMode === 'half' ? 'bg-red-600 text-white px-1.5' : 'text-zinc-300 hover:text-amber-400'}`}><RotateCcw className="w-5 h-5" />{pitchMode === 'half' && <span className="text-xs font-bold ml-0.5">1/2</span>}</button>
          
          <button
            onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')}
            className="flex items-center gap-1 bg-blue-600/20 border border-blue-400 text-blue-300 px-2.5 py-1 rounded-full text-[11px] font-bold shadow active:scale-95"
          >
            <Shield className="w-3.5 h-3.5" /> {viewMode === '2d' ? '3D' : '2D'}
          </button>

          <button onClick={() => setShowTrainingMenu(!showTrainingMenu)} className={`p-1 rounded ${showTrainingMenu ? 'bg-amber-500 text-black' : 'text-amber-400'}`}><span className="font-bold">▲</span></button>

          <button onClick={() => setShowPromptModal(true)} className="flex items-center gap-1 bg-amber-500/20 border border-amber-400 text-amber-300 px-2 py-1 rounded-full text-[11px] font-bold shadow active:scale-95">
            <Sparkles className="w-3.5 h-3.5" /> Prompt IA
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
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

          <button onClick={exportBoardAsImage} className="text-zinc-300 hover:text-amber-400" title="Descargar PNG"><Download className="w-5 h-5" /></button>
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

      {/* CANCHA 2D CON TEXTOS INTERACTIVOS (+ / - / ↻) O VISOR 3D */}
      <main className="flex-1 min-h-0 w-full h-full relative overflow-hidden touch-none bg-black flex items-center justify-center">
        <div 
          className={`w-full h-full flex items-center justify-center p-2 sm:p-3 transition-opacity duration-150 ${
            viewMode === '2d' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none absolute inset-0'
          }`}
          style={{ visibility: viewMode === '2d' ? 'visible' : 'hidden' }}
        >
          <svg
            ref={svgRef}
            onPointerDown={handlePitchPointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-full h-full max-h-full max-w-full touch-none select-none"
            preserveAspectRatio="xMidYMid meet"
            viewBox={isPC ? (pitchMode === 'half' ? "-2 -1 59 70" : "-3 -1 111 70") : (pitchMode === 'half' ? "-1 -2 70 89" : "-1 -2 70 109")}
          >
      <defs>
              <marker id="arrow-white" viewBox="0 0 10 10" refX="1" refY="5" markerUnits="strokeWidth" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 1 L 8 5 L 0 9 L 2 5 z" fill="#ffffff" stroke="none" /></marker>
              <marker id="arrow-red" viewBox="0 0 10 10" refX="1" refY="5" markerUnits="strokeWidth" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 1 L 8 5 L 0 9 L 2 5 z" fill="#ef4444" stroke="none" /></marker>
              <marker id="arrow-blue" viewBox="0 0 10 10" refX="1" refY="5" markerUnits="strokeWidth" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 1 L 8 5 L 0 9 L 2 5 z" fill="#3b82f6" stroke="none" /></marker>
              <marker id="arrow-yellow" viewBox="0 0 10 10" refX="1" refY="5" markerUnits="strokeWidth" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 1 L 8 5 L 0 9 L 2 5 z" fill="#facc15" stroke="none" /></marker>
              <marker id="arrow-black" viewBox="0 0 10 10" refX="1" refY="5" markerUnits="strokeWidth" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 1 L 8 5 L 0 9 L 2 5 z" fill="#000000" stroke="none" /></marker>
              <marker id="block-mark" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="strokeWidth" markerWidth="3.5" markerHeight="3.5" orient="auto"><line x1="5" y1="0" x2="5" y2="10" stroke="#ffffff" strokeWidth="2.5" /></marker>
            </defs>

            {/* CÉSPED PRO TOTAL DE BORDE A BORDE */}
            <rect width="600" height="600" x="-250" y="-250" fill="#15803d" />
            <g opacity="0.15">
              {Array.from({ length: 40 }).map((_, i) => (
                <rect key={i} x={-60 + i * 5.61} y="-100" width="2.805" height="300" fill={i % 2 === 0 ? "#ffffff" : "transparent"} />
              ))}
            </g>

            {/* LÍNEAS REGLAMENTARIAS Y ARCOS */}
            {isPC ? (
              <g stroke="white" strokeWidth="0.8" fill="none">
                <rect x="2" y="2" width={pitchMode === 'half' ? 51 : 101} height="64" />
                <line x1={pitchMode === 'half' ? 53 : 52.5} y1="2" x2={pitchMode === 'half' ? 53 : 52.5} y2="66" />
                <circle cx={pitchMode === 'half' ? 53 : 52.5} cy="34" r="9.15" />
                <circle cx={pitchMode === 'half' ? 53 : 52.5} cy="34" r="0.8" fill="white" />
                <rect x="2" y="13.8" width="16.5" height="40.4" />
                <rect x="2" y="24.8" width="5.5" height="18.4" />
                <rect x="-0.8" y="30.3" width="2.8" height="7.32" stroke="#eab308" strokeWidth="0.9" fill="rgba(255,255,255,0.2)" />
                <path d="M 18.5 28 A 9.15 9.15 0 0 1 18.5 40" />
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
                <rect x="2" y="2" width="64" height={pitchMode === 'half' ? 79 : 101} rx="0.2" />
                <line x1="2" y1={pitchMode === 'half' ? 81 : 52.5} x2="66" y2={pitchMode === 'half' ? 81 : 52.5} />
                <circle cx="34" cy={pitchMode === 'half' ? 81 : 52.5} r="9.15" />
                <circle cx="34" cy={pitchMode === 'half' ? 81 : 52.5} r="0.7" fill="white" />
                {!pitchMode.includes('half') && (
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

            {/* TRAZADOS TÁCTICOS CON 5 ESTILOS */}
            {drawings.map(l => {
              const markerId = l.type === 'straight' ? '' : (l.type === 'block' ? 'url(#block-mark)' : (l.color === '#ef4444' ? 'url(#arrow-red)' : l.color === '#3b82f6' ? 'url(#arrow-blue)' : l.color === '#facc15' ? 'url(#arrow-yellow)' : l.color === '#000000' ? 'url(#arrow-black)' : 'url(#arrow-white)'));
              const dx = l.end.x - l.start.x;
              const dy = l.end.y - l.start.y;
              const dist = Math.hypot(dx, dy) || 0.001;
              const ux = dx / dist;
              const uy = dy / dist;
              const isArrow = l.type !== 'straight' && l.type !== 'block';
              const strokeW = l.width || 1.4;
              const shortenDist = isArrow ? (strokeW * 3.2) : 0;
              const endX = dist > shortenDist ? l.start.x + ux * (dist - shortenDist) : l.start.x;
              const endY = dist > shortenDist ? l.start.y + uy * (dist - shortenDist) : l.start.y;
              const effectiveDist = dist > shortenDist ? dist - shortenDist : 0.001;

              let pathD = '';
              if (l.type === 'wavy') {
                const numWaves = Math.max(1, Math.round(effectiveDist / 8));
                const waveLen = effectiveDist / numWaves;
                const amp = 2.4;
                const px = -uy;
                const py = ux;
                pathD = `M ${l.start.x} ${l.start.y}`;
                for (let i = 0; i < numWaves; i++) {
                  const bX = l.start.x + ux * (i * waveLen);
                  const bY = l.start.y + uy * (i * waveLen);
                  const eX = l.start.x + ux * ((i + 1) * waveLen);
                  const eY = l.start.y + uy * ((i + 1) * waveLen);
                  const cp1X = bX + ux * (waveLen * 0.35) + px * amp;
                  const cp1Y = bY + uy * (waveLen * 0.35) + py * amp;
                  const cp2X = bX + ux * (waveLen * 0.65) - px * amp;
                  const cp2Y = bY + uy * (waveLen * 0.65) - py * amp;
                  pathD += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${eX} ${eY}`;
                }
              }

              return (
                <g key={l.id} onPointerDown={(e) => { if (tool === 'eraser') { e.stopPropagation(); setDrawings(prev => prev.filter(d => d.id !== l.id)); } }}>
                  {l.type === 'wavy' ? (
                    <path d={pathD} fill="none" stroke={l.color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" markerEnd={markerId} />
                  ) : (
                    <line x1={l.start.x} y1={l.start.y} x2={endX} y2={endY} stroke={l.color} strokeWidth={strokeW} strokeLinecap="round" strokeDasharray={l.type === 'dashed' ? '3,2' : 'none'} markerEnd={markerId} />
                  )}
                </g>
              );
            })}

            {currentLine && (
              <line x1={currentLine.start.x} y1={currentLine.start.y} x2={currentLine.end.x} y2={currentLine.end.y} stroke={currentLine.color} strokeWidth={currentLine.width} strokeLinecap="round" strokeDasharray={currentLine.type === 'dashed' ? '3,2' : 'none'} />
            )}

            {/* TEXTOS TÁCTICOS CON BOTONES AGRANDAR, ACHICAR Y ROTAR */}
            {textBlocks.map(tb => {
              const isSelected = selectedObj?.id === tb.id;
              const rot = tb.rotation || 0;
              const size = tb.size || 2.8;
              const col = tb.color || '#ffffff';
              const isBold = tb.isBold !== undefined ? tb.isBold : true;
              const isUnder = Boolean(tb.isUnderline);

              return (
                <g
                  key={tb.id}
                  transform={`translate(${tb.x}, ${tb.y}) rotate(${rot})`}
                  className="cursor-move select-none"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (tool === 'eraser') {
                      setTextBlocks(prev => prev.filter(t => t.id !== tb.id));
                      return;
                    }
                    setSelectedTextId(isSelected ? null : tb.id);
                    setSelectedObj(tb);
                    isDraggingRef.current = true;
                  }}
                >
                  <rect
                    x={-(tb.text.length * size * 0.35 + 2)}
                    y={-(size * 1.1)}
                    width={tb.text.length * size * 0.7 + 4}
                    height={size * 1.8}
                    rx={size * 0.4}
                    fill="transparent"
                    stroke={isSelected ? '#facc15' : 'transparent'}
                    strokeWidth={0.4}
                    strokeDasharray={isSelected ? '1,1' : 'none'}
                  />

                  <text
                    x={0}
                    y={size * 0.35}
                    textAnchor="middle"
                    fill={col}
                    fontSize={size}
                    fontWeight={isBold ? 'bold' : 'normal'}
                    textDecoration={isUnder ? 'underline' : 'none'}
                    style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.9))' }}
                  >
                    {tb.text}
                  </text>

                  {/* Botón Rotar 45° */}
                  {isSelected && (
                    <g
                      transform={`translate(${tb.text.length * size * 0.35 + 3.5}, ${-size * 0.6})`}
                      className="cursor-pointer"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setTextBlocks(prev => prev.map(t => t.id === tb.id ? { ...t, rotation: ((t.rotation || 0) + 45) % 360 } : t));
                      }}
                    >
                      <circle r={2} fill="#eab308" />
                      <text x={0} y={0.8} textAnchor="middle" fontSize={1.8} fill="#000000" fontWeight="bold">↻</text>
                    </g>
                  )}

                  {/* Botón Agrandar (+) */}
                  {isSelected && (
                    <g
                      transform={`translate(${tb.text.length * size * 0.35 + 3.5}, ${size * 0.6})`}
                      className="cursor-pointer"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setTextBlocks(prev => prev.map(t => t.id === tb.id ? { ...t, size: Math.min((t.size || 2.8) + 0.5, 7.0) } : t));
                      }}
                    >
                      <circle r={1.8} fill="#22c55e" />
                      <text x={0} y={0.7} textAnchor="middle" fontSize={1.8} fill="#ffffff" fontWeight="bold">+</text>
                    </g>
                  )}

                  {/* Botón Achicar (-) */}
                  {isSelected && (
                    <g
                      transform={`translate(${-(tb.text.length * size * 0.35 + 3.5)}, ${size * 0.6})`}
                      className="cursor-pointer"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setTextBlocks(prev => prev.map(t => t.id === tb.id ? { ...t, size: Math.max((t.size || 2.8) - 0.5, 1.4) } : t));
                      }}
                    >
                      <circle r={1.8} fill="#ef4444" />
                      <text x={0} y={0.6} textAnchor="middle" fontSize={1.8} fill="#ffffff" fontWeight="bold">-</text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* JUGADORES, BALÓN Y MATERIALES */}
            {objects.map(obj => {
              if (obj.type === 'player') {
                const hasName = obj.name && obj.name.trim().length > 0;
                const w = Math.max(14, (obj.name || '').length * 1.5 + 4);
                return (
                  <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={e => handlePointerDown(e, obj)} onDoubleClick={() => { setEditingPlayer(obj); setPlayerCustomName(obj.name || ''); setPlayerCustomNumber(obj.number); }} className="cursor-grab active:cursor-grabbing touch-none select-none">
                    <circle r="3.0" fill={obj.customColor || (obj.role === 'GK' ? (obj.team === 'red' || obj.team === 'gk_away' ? teamColors.gk_away : teamColors.gk) : (obj.team === 'blue' ? teamColors.blue : teamColors.red))} stroke="#ffffff" strokeWidth="0.6" />
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
              
              const isMatSelected = selectedMaterial?.id === obj.id;
              const matScale = obj.scale || 1.0;
              return (
                <g key={obj.id}>
                  <TrainingMaterial obj={obj} onPointerDown={e => handlePointerDown(e, obj)} onDoubleClick={() => rotateObject(obj.id)} />
                  {isMatSelected && (
                    <g transform={`translate(${obj.x}, ${obj.y})`} className="select-none">
                      <circle r={6 * matScale + 2} fill="none" stroke="#facc15" strokeWidth="0.5" strokeDasharray="1.2,1.2" />
                      {/* Rotar Arriba */}
                      <g transform={`translate(0, ${-(6 * matScale + 4)})`} className="cursor-pointer" onPointerDown={(e) => { e.stopPropagation(); rotateObject(obj.id); }}>
                        <circle r={2.0} fill="#eab308" stroke="#000" strokeWidth="0.2" />
                        <text x="0" y="0.8" textAnchor="middle" fontSize="1.8" fill="#000" fontWeight="bold">↻</text>
                      </g>
                      {/* Agrandar Derecha */}
                      <g transform={`translate(${6 * matScale + 4}, 0)`} className="cursor-pointer" onPointerDown={(e) => {
                        e.stopPropagation();
                        const next = objects.map(o => o.id === obj.id ? { ...o, scale: Math.min(Number((o.scale || 1.0) + 0.2).toFixed(1), 3.0) } : o);
                        setObjects(next);
                        setSelectedMaterial(next.find(o => o.id === obj.id));
                        recordHistory(next);
                      }}>
                        <circle r={2.0} fill="#22c55e" stroke="#000" strokeWidth="0.2" />
                        <text x="0" y="0.8" textAnchor="middle" fontSize="2.0" fill="#ffffff" fontWeight="bold">+</text>
                      </g>
                      {/* Achicar Izquierda */}
                      <g transform={`translate(${-(6 * matScale + 4)}, 0)`} className="cursor-pointer" onPointerDown={(e) => {
                        e.stopPropagation();
                        const next = objects.map(o => o.id === obj.id ? { ...o, scale: Math.max(Number((o.scale || 1.0) - 0.2).toFixed(1), 0.4) } : o);
                        setObjects(next);
                        setSelectedMaterial(next.find(o => o.id === obj.id));
                        recordHistory(next);
                      }}>
                        <circle r={2.0} fill="#ef4444" stroke="#000" strokeWidth="0.2" />
                        <text x="0" y="0.7" textAnchor="middle" fontSize="2.0" fill="#ffffff" fontWeight="bold">-</text>
                      </g>
                      {/* Borrar Abajo */}
                      <g transform={`translate(0, ${6 * matScale + 4})`} className="cursor-pointer" onPointerDown={(e) => { e.stopPropagation(); const next = objects.filter(o => o.id !== obj.id); setObjects(next); setSelectedMaterial(null); recordHistory(next); }}>
                        <circle r={2.0} fill="#18181b" stroke="#ef4444" strokeWidth="0.3" />
                        <text x="0" y="0.8" textAnchor="middle" fontSize="1.6" fill="#ef4444" fontWeight="bold">✕</text>
                      </g>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
  </div>
  <div 
    className={`absolute inset-0 transition-opacity duration-150 ${
      viewMode === '3d' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    }`}
    style={{ visibility: viewMode === '3d' ? 'visible' : 'hidden' }}
  >
            <div className="absolute top-4 left-4 z-40 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-2 shadow-2xl flex items-center gap-2">
              <button
                onClick={() => setCameraLocked(!cameraLocked)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  cameraLocked ? 'bg-emerald-600 text-white shadow-lg' : 'bg-amber-500 text-black shadow-lg animate-pulse'
                }`}
              >
                {cameraLocked ? <Lock className="w-4 h-4" /> : <Move className="w-4 h-4" />}
                <span>{cameraLocked ? 'Cámara Bloqueada' : 'Rotar Cancha (Orbitar)'}</span>
              </button>
            </div>
            <Scene3DBoundary>
              <Suspense fallback={<div className="text-white font-bold text-sm flex items-center justify-center h-full">Cargando 3D...</div>}>
                <Canvas
                  frameloop={viewMode === '3d' ? 'always' : 'never'}
                  dpr={[1, 1.5]}
                  shadows
                  gl={{ antialias: true, powerPreference: "high-performance" }}
                  className="w-full h-full touch-none select-none"
                  style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
                  onCreated={({ gl }) => {
                    // Permite que el navegador restaure el contexto WebGL si se pierde
                    gl.domElement.addEventListener('webglcontextlost', (ev) => ev.preventDefault(), false);
                  }}
                >
                  <Suspense fallback={null}>
                    <Scene3D
                      objects={objects}
                      setObjects={setObjects}
                      drawings={drawings}
                      textBlocks={textBlocks}
                      selectedObj={selectedObj}
                      setSelectedObj={setSelectedObj}
                      teamColors={teamColors}
                      cameraLocked={cameraLocked}
                      recordHistory={recordHistory}
                      isPC={isPC}
                    />
                  </Suspense>
                </Canvas>
              </Suspense>
            </Scene3DBoundary>
          </div>
        
        {/* Selector de altura y gestion del balon seleccionado */}
      {selectedObj && selectedObj.type === 'ball' && (
        <div className="fixed bottom-16 left-4 md:left-6 z-50 bg-slate-900/95 text-white px-3 py-2 rounded-xl backdrop-blur-md border border-slate-700 flex items-center gap-2 shadow-2xl">
          <span className="text-xs font-semibold text-amber-400">Balón:</span>
          <button
            type="button"
            onClick={() => {
              setObjects((prev) => prev.map((o) => o.id === selectedObj.id ? { ...o, elevation: 0 } : o));
              setSelectedObj((prev) => ({ ...prev, elevation: 0 }));
            }}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${(!selectedObj.elevation || selectedObj.elevation === 0) ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            Piso
          </button>
          <button
            type="button"
            onClick={() => {
              setObjects((prev) => prev.map((o) => o.id === selectedObj.id ? { ...o, elevation: 1.8 } : o));
              setSelectedObj((prev) => ({ ...prev, elevation: 1.8 }));
            }}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${selectedObj.elevation === 1.8 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            Cabeza
          </button>
          <button
            type="button"
            onClick={() => {
              setObjects((prev) => prev.map((o) => o.id === selectedObj.id ? { ...o, elevation: 2.8 } : o));
              setSelectedObj((prev) => ({ ...prev, elevation: 2.8 }));
            }}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${selectedObj.elevation === 2.8 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            Aéreo
          </button>
          <button
              type="button"
              onClick={() => {
                if (!selectedObj) return;
                const ballId = selectedObj.id;

                window.__onPickFlightTarget = (pt3D) => {
                  window.__onPickFlightTarget = null;

                  setObjects((currentObjs) => {
                    const currentBall = currentObjs.find((o) => o.id === ballId);
                    if (!currentBall) return currentObjs;

                    const startX = currentBall.x;
                    const startY = currentBall.y;

                    // Detección de orientación de cancha: PC vs Móvil
                    const isDesk = window.innerWidth > 768;
                    let targetX, targetY;

                    if (isDesk) {
                      targetX = Math.max(1, Math.min(104, pt3D.x + 52.5));
                      targetY = Math.max(1, Math.min(67, pt3D.z + 34));
                    } else {
                      // Corrección de rotación ortogonal táctil para móvil
                      targetX = Math.max(1, Math.min(104, pt3D.z + 52.5));
                      targetY = Math.max(1, Math.min(67, -pt3D.x + 34));
                    }

                    const maxHeight = 3.2;
                    let t = 0;

                    const interval = setInterval(() => {
                      t += 0.025;
                      if (t >= 1) {
                        clearInterval(interval);
                        setObjects((prev) =>
                          prev.map((o) =>
                            o.id === ballId
                              ? { ...o, x: targetX, y: targetY, elevation: 0, animProgress: undefined }
                              : o
                          )
                        );
                        setSelectedObj((prev) =>
                          prev && prev.id === ballId
                            ? { ...prev, x: targetX, y: targetY, elevation: 0, animProgress: undefined }
                            : prev
                        );
                      } else {
                        const curX = startX + (targetX - startX) * t;
                        const curY = startY + (targetY - startY) * t;
                        setObjects((prev) =>
                          prev.map((o) =>
                            o.id === ballId
                              ? { ...o, x: curX, y: curY, elevation: maxHeight, animProgress: t }
                              : o
                          )
                        );
                      }
                    }, 16);

                    return currentObjs;
                  });
                };
              }}
              className="px-2.5 py-1 text-xs rounded-lg font-medium transition bg-amber-500 hover:bg-amber-400 text-black shadow animate-pulse"
              title="Toca Dirigir Vuelo y luego pincha el punto exacto de la cancha para enviar el balón"
            >
              Dirigir Vuelo
            </button>
            <div className="h-4 w-px bg-slate-700 mx-1" />

            {/* Boton para eliminar UNICAMENTE este balon */}
            <button
              type="button"
              title="Eliminar este balón"
              onClick={() => {
                setObjects((prev) => prev.filter((o) => o.id !== selectedObj.id));
                setSelectedObj(null);
              }}
              className="px-2 py-1 text-xs rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition flex items-center gap-1"
            >
              Borrar
            </button>
          </div>
        )}
        {/* MODAL INSERTAR TEXTO TÁCTICO */}
        {textModalOpen && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-xs p-4 shadow-2xl space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs uppercase text-amber-400 flex items-center gap-1.5"><Type className="w-4 h-4" /> Texto Táctico</h3>
                <button onClick={() => setTextModalOpen(false)} className="text-zinc-400 hover:text-white text-xs">✕</button>
              </div>
              <input
                type="text" autoFocus value={inputTextVal} onChange={e => setInputTextVal(e.target.value)}
                placeholder="Ej: Presión alta" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              />
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800">
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setTextIsBold(!textIsBold)} className={`w-7 h-7 rounded-lg font-black text-xs border ${textIsBold ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900 text-zinc-300 border-zinc-700'}`}>B</button>
                  <button type="button" onClick={() => setTextIsUnderline(!textIsUnderline)} className={`w-7 h-7 rounded-lg underline font-bold text-xs border ${textIsUnderline ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900 text-zinc-300 border-zinc-700'}`}>U</button>
                </div>
                <div className="flex items-center gap-1.5">
                  {['#ffffff', '#facc15', '#ef4444', '#38bdf8', '#000000'].map(c => (
                    <button key={c} type="button" onClick={() => setTextColor(c)} style={{ backgroundColor: c }} className={`w-5 h-5 rounded-full border ${textColor === c ? 'border-amber-400 scale-110' : 'border-zinc-700'}`} />
                  ))}
                </div>
              </div>
              <button onClick={() => {
                if (inputTextVal.trim()) {
                  setTextBlocks(prev => [...prev, { id: 'txt-' + Date.now(), x: pendingTextPos.x, y: pendingTextPos.y, text: inputTextVal.trim(), color: textColor, isBold: textIsBold, isUnderline: textIsUnderline, size: textSize }]);
                }
                setTextModalOpen(false); setTool('move');
              }} className="w-full py-2 bg-amber-500 text-black font-bold text-xs uppercase rounded-xl">Insertar</button>
            </div>
          </div>
        )}

        {/* SUB-BARRA DE MATERIALES */}
        {showTrainingMenu && (
          <aside className="fixed top-12 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:w-max bg-zinc-950/95 backdrop-blur border border-zinc-800 rounded-2xl p-1.5 shadow-2xl z-40 flex items-center gap-1.5 overflow-x-auto max-w-[96vw] shrink-0 no-print [&::-webkit-scrollbar]:hidden">
            <span className="text-[10px] font-bold text-amber-400 uppercase shrink-0 px-1">Materiales:</span>
            <button onClick={() => addElement('mini_goal')} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white shrink-0 flex items-center gap-1">🥅 Mini Portería</button>
            <button onClick={() => addElement('ladder')} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white shrink-0 flex items-center gap-1">🪜 Escalera</button>
            <button onClick={() => addElement('dummy')} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white shrink-0 flex items-center gap-1">🧍 Maniquí</button>
            <button onClick={() => addElement('hurdle')} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white shrink-0 flex items-center gap-1">🚧 Valla</button>
            <button onClick={() => addElement('cone', { color: '#ea580c' })} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white shrink-0 flex items-center gap-1"><span className="text-orange-500">▲</span> Cono Naranja</button>
            <button onClick={() => addElement('cone', { color: '#2563eb' })} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white shrink-0 flex items-center gap-1"><span className="text-blue-500">▲</span> Cono Azul</button>
            <button onClick={() => addElement('cone', { color: '#eab308' })} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white shrink-0 flex items-center gap-1"><span className="text-yellow-400">▲</span> Cono Amarillo</button>
            <button onClick={() => addElement('saucer', { color: '#facc15' })} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white shrink-0 flex items-center gap-1">🟡 Plato Chino</button>
            <button onClick={() => addElement('ring', { color: '#38bdf8' })} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white shrink-0 flex items-center gap-1">⭕ Aro</button>
            <button onClick={() => addElement('pole', { color: '#facc15' })} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white shrink-0 flex items-center gap-1">🥢 Estaca</button>
            <button onClick={() => setShowTrainingMenu(false)} className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shrink-0 ml-1">✕</button>
          </aside>
        )}

        {/* MODAL SISTEMAS */}
        {showSystemsMenu && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5"><Play className="w-4 h-4 text-amber-400" /> Sistemas Tácticos</h3>
                <button onClick={() => setShowSystemsMenu(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5">
                {Object.keys({ ...(GET_TACTICAL_SYSTEMS(isPC)), ...(customSystems || {}) }).map(sysKey => (
                  <button key={sysKey} onClick={() => applyTacticalSystem(sysKey)} className="w-full text-left font-bold text-xs text-white bg-zinc-900 hover:border-amber-400 border border-zinc-800 p-2.5 rounded-xl">
                    Formación {sysKey}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUB-BARRA FLOTANTE DE LÍNEAS AVANZADA CON 5 TIPOS Y 3 GROSORES */}
        {showLinePalette && (
          <div className="fixed bottom-16 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:w-max bg-zinc-950/95 backdrop-blur border border-zinc-800 rounded-2xl p-1.5 shadow-2xl z-40 flex items-center gap-1.5 overflow-x-auto max-w-[96vw] shrink-0 no-print [&::-webkit-scrollbar]:hidden">
            {/* 5 Tipos de trazo */}
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => { setLineType('arrow'); setTool('draw'); }} className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${lineType === 'arrow' ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900 text-white border-zinc-700'}`}>➔ Normal</button>
              <button onClick={() => { setLineType('straight'); setTool('draw'); }} className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${lineType === 'straight' ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900 text-white border-zinc-700'}`}>― Recta</button>
              <button onClick={() => { setLineType('dashed'); setTool('draw'); }} className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${lineType === 'dashed' ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900 text-white border-zinc-700'}`}>⤏ Discontinua</button>
              <button onClick={() => { setLineType('block'); setTool('draw'); }} className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${lineType === 'block' ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900 text-white border-zinc-700'}`}>┫ Bloqueo</button>
              <button onClick={() => { setLineType('wavy'); setTool('draw'); }} className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${lineType === 'wavy' ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900 text-white border-zinc-700'}`}>〰 Dribling</button>
            </div>

            <div className="h-5 w-[1px] bg-zinc-800 shrink-0 mx-1" />

            {/* Colores */}
            <div className="flex items-center gap-1.5 shrink-0">
              {['#ffffff', '#ef4444', '#3b82f6', '#facc15', '#000000'].map(c => (
                <button key={c} onClick={() => setLineColor(c)} style={{ backgroundColor: c }} className={`w-5 h-5 rounded-full border ${lineColor === c ? 'border-amber-400 scale-110 shadow-md ring-2 ring-amber-400/50' : 'border-zinc-700'}`} />
              ))}
            </div>

            <div className="h-5 w-[1px] bg-zinc-800 shrink-0 mx-1" />

            {/* 3 Grosores */}
            <div className="flex items-center gap-1 shrink-0">
              {[
                { label: 'Fino', val: 0.8 },
                { label: 'Medio', val: 1.4 },
                { label: 'Grueso', val: 2.2 }
              ].map(g => (
                <button key={g.val} onClick={() => setLineWidth(g.val)} className={`px-2 py-0.5 rounded text-[11px] font-bold border ${lineWidth === g.val ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900 text-zinc-300 border-zinc-800'}`}>
                  {g.label}
                </button>
              ))}
            </div>

            <div className="h-5 w-[1px] bg-zinc-800 shrink-0 mx-1" />

            <button onClick={() => setShowLinePalette(false)} className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shrink-0">
              Listo ✕
            </button>
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

        {/* MODAL PROMPT TÁCTICO GEMINI */}
        {showPromptModal && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-400" /> Generador Táctico IA</h3>
                <button onClick={() => setShowPromptModal(false)} className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleGenerateTacticalPrompt} className="space-y-3">
                <textarea rows={3} value={promptText} onChange={e => setPromptText(e.target.value)} placeholder="Ej: Rondo 4v2 con conos y balón..." className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400 resize-none" autoFocus />
                <button type="submit" disabled={isGeneratingPrompt} className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black text-xs uppercase rounded-xl shadow">{isGeneratingPrompt ? 'Generando con Gemini...' : 'Crear en la Pizarra'}</button>
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

        {/* MODAL GESTIÓN COMPLETA */}
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
                    {(rosters[currentCategoryContext] || []).map(p => (
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
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
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

              {/* COBRANZA Y MENSUALIDADES */}
              {activeTabLibrary === 'billing' && !isTeacherRestricted && (
                <div className="flex-1 flex flex-col min-h-0">
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
                    if (editingCoach) {
                      const updated = coachesList.map(c => 
                        c.id === editingCoach.id 
                          ? { ...c, name: newCoachStaffName.trim(), role: newCoachStaffRole.trim(), categoryId: newCoachStaffCategory, phone: newCoachStaffPhone.trim(), code } 
                          : c
                      );
                      setCoachesList(updated);
                      setEditingCoach(null);
                    } else {
                      setCoachesList([...coachesList, { id: 'c-' + Date.now(), name: newCoachStaffName.trim(), role: newCoachStaffRole.trim(), categoryId: newCoachStaffCategory, phone: newCoachStaffPhone.trim(), code }]);
                    }
                    setNewCoachStaffName(''); setNewCoachStaffRole('Director Técnico'); setNewCoachStaffPhone('+569'); setNewCoachStaffCode('');
                  }} className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-2xl mb-3 shrink-0 space-y-2">
                    <div className="flex justify-between items-center pb-1 border-b border-zinc-800">
                      <span className="text-[11px] font-bold text-amber-400">{editingCoach ? '✏️ Editando Profesor / DT' : '➕ Registrar Nuevo Profesor / DT'}</span>
                      {editingCoach && (
                        <button type="button" onClick={() => { setEditingCoach(null); setNewCoachStaffName(''); setNewCoachStaffRole('Director Técnico'); setNewCoachStaffPhone('+569'); setNewCoachStaffCode(''); }} className="text-[10px] text-zinc-400 hover:text-white">Cancelar Edición</button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      <input type="text" placeholder="Nombre Profesor" value={newCoachStaffName} onChange={e => setNewCoachStaffName(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1 text-xs text-white outline-none focus:border-amber-400" required />
                      <input type="text" placeholder="Cargo (DT, PF)" value={newCoachStaffRole} onChange={e => setNewCoachStaffRole(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1 text-xs text-white outline-none focus:border-amber-400" />
                      <select value={newCoachStaffCategory} onChange={e => setNewCoachStaffCategory(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1 text-xs text-white outline-none">
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input type="tel" placeholder="WhatsApp" value={newCoachStaffPhone} onChange={e => setNewCoachStaffPhone(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1 text-xs text-white outline-none focus:border-amber-400" />
                      <div className="flex gap-1.5">
                        <input type="text" placeholder="Clave DT" value={newCoachStaffCode} onChange={e => setNewCoachStaffCode(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1 text-xs text-white outline-none uppercase font-mono focus:border-amber-400" />
                        <button type="submit" className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl px-3 py-1 shadow flex items-center justify-center gap-1 shrink-0">
                          {editingCoach ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          <span>{editingCoach ? 'Actualizar' : 'Agregar'}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {coachesList.map(c => (
                      <div key={c.id} className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-2xl flex justify-between items-center">
                        <div>
                          <div className="font-bold text-xs text-white">{c.name} <span className="text-amber-400 font-semibold text-[10px]">({c.role})</span></div>
                          <div className="text-[10px] text-zinc-400">Categoría: {categories.find(x => x.id === c.categoryId)?.name || 'Sin asignar'} • Clave: <span className="font-mono text-white font-bold">{c.code}</span></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <WhatsAppButton phone={c.phone} name={c.name} label="WhatsApp DT" />
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingCoach(c);
                              setNewCoachStaffName(c.name);
                              setNewCoachStaffRole(c.role || 'Director Técnico');
                              setNewCoachStaffCategory(c.categoryId || categories[0]?.id || 'sub10');
                              setNewCoachStaffPhone(c.phone || '+569');
                              setNewCoachStaffCode(c.code || '');
                            }}
                            className="p-1.5 bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-300 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { if (confirm(`¿Eliminar al profesor ${c.name}?`)) setCoachesList(coachesList.filter(x => x.id !== c.id)); }} className="p-1.5 text-zinc-500 hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

        {/* MODAL PANEL DE DUEÑO SUPERADMINISTRADOR */}
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
                        <span className="text-[10px] text-zinc-400">$</span>
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
                  <span className="text-lg font-black text-emerald-400">${totalRevenue.toLocaleString('es-CL')} CLP</span>
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
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
  <span>{lic.club} • {lic.plan}</span>
  <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
    {(lic.disciplines || ['soccer']).map(d => d === 'soccer' ? '⚽ Fútbol' : d === 'basketball' ? '🏀 Básquet' : d === 'volleyball' ? '🏐 Vóley' : d).join(' | ')}
  </span>
</div>
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
                setAdminLicenses([{ id: 'lic-' + Date.now(), coach: newCoachName.trim(), club: newCoachClub.trim() || 'Club Deportivo', code, seats: chosenPlan.seats, devices: [], status: 'active', plan: chosenPlan.name, price: chosenPlan.price, expiry: newCoachExpiry, disciplines: ['soccer'] }, ...adminLicenses]);
                setShowNewUserModal(false); setNewCoachName(''); setNewCoachClub('');
                alert(`¡Club Creado!\nClave: ${code}\nDispositivos: ${chosenPlan.seats}`);
              }} className="space-y-3">
                <input type="text" placeholder="Director del Club" value={newCoachName} onChange={e => setNewCoachName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none" required />
                <input type="text" placeholder="Nombre de la Escuela / Club" value={newCoachClub} onChange={e => setNewCoachClub(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none" />
                <select value={newCoachPlan} onChange={e => setNewCoachPlan(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none">
                  {customPlans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - ${p.price.toLocaleString('es-CL')}</option>
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
      <footer className="bg-black px-4 py-2 flex items-center justify-between shrink-0 z-30 border-t border-zinc-900 no-print overflow-x-auto max-w-full">
        <div className="flex items-center gap-2">
          <button onClick={() => { if (historyIndex > 0) { setHistoryIndex(historyIndex - 1); setObjects(history[historyIndex - 1]); } }} disabled={historyIndex <= 0} className="p-1.5 text-zinc-300 disabled:opacity-30"><Undo2 className="w-5 h-5" /></button>
          <button onClick={() => { if (historyIndex < history.length - 1) { setHistoryIndex(historyIndex + 1); setObjects(history[historyIndex + 1]); } }} disabled={historyIndex >= history.length - 1} className="p-1.5 text-zinc-300 disabled:opacity-30"><Redo2 className="w-5 h-5" /></button>
        </div>

        {/* PALETA DE CAMISETAS FLOTANTE */}
        {showKitPalette && (
          <div className="fixed bottom-16 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:w-max bg-zinc-950/95 backdrop-blur border border-zinc-800 rounded-2xl p-2.5 shadow-2xl flex items-center gap-3 overflow-x-auto z-40 animate-fade-in no-print">
            <div className="flex items-center gap-1 shrink-0">
              {[
                { id: 'blue', label: 'Eq. 1' },
                { id: 'red', label: 'Eq. 2' },
                { id: 'gk', label: 'Arq. 1' },
                { id: 'gk_away', label: 'Arq. 2' }
              ].map(target => (
                <button
                  key={target.id}
                  onClick={() => setKitTarget(target.id)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition ${kitTarget === target.id ? 'bg-amber-500 text-black shadow' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                >
                  {target.label}
                </button>
              ))}
            </div>
            <div className="h-5 w-[1px] bg-zinc-800 shrink-0 mx-0.5" />
            <div className="flex items-center gap-1.5 shrink-0">
              {officialKitColors.map(c => (
                <button
                  key={c.hex}
                  title={c.name}
                  onClick={() => handleUpdateKitColor(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-6 h-6 rounded-full border border-black/30 transition-transform ${teamColors[kitTarget] === c.hex ? 'scale-125 ring-2 ring-amber-400 ring-offset-2 ring-offset-black' : 'hover:scale-110'}`}
                />
              ))}
            </div>
            <div className="h-5 w-[1px] bg-zinc-800 shrink-0 mx-0.5" />
            <button onClick={() => setShowKitPalette(false)} className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shrink-0">
              Listo ✕
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowKitPalette(prev => !prev)}
            className={`px-2 py-1 rounded-xl text-xs font-bold border transition ${showKitPalette ? 'bg-amber-500 text-black border-amber-400 shadow-md' : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800'}`}
            title="Personalizar colores de camisetas y arqueros"
          >
            🎨 Camisetas
          </button>
          <button onClick={() => addElement('player', { role: 'GK', number: '1', team: 'gk', customColor: teamColors.gk })} style={{ backgroundColor: teamColors.gk }} className="w-9 h-9 rounded-full border-2 border-white text-white font-black text-xs shadow hover:scale-105 transition-transform" title="Arquero Local">1</button>
          <button onClick={() => addElement('player', { role: 'GK', number: '1', team: 'gk_away', customColor: teamColors.gk_away })} style={{ backgroundColor: teamColors.gk_away }} className="w-9 h-9 rounded-full border-2 border-white text-white font-black text-xs shadow hover:scale-105 transition-transform" title="Arquero Visitante">1</button>
          <button onClick={() => addElement('player', { team: 'blue', customColor: teamColors.blue })} style={{ backgroundColor: teamColors.blue }} className="w-9 h-9 rounded-full border-2 border-white text-white font-bold text-xs shadow hover:scale-105 transition-transform" title="Jugador Equipo 1">11</button>
          <button onClick={() => addElement('player', { team: 'red', customColor: teamColors.red })} style={{ backgroundColor: teamColors.red }} className="w-9 h-9 rounded-full border-2 border-white text-white font-bold text-xs shadow hover:scale-105 transition-transform" title="Jugador Equipo 2">11</button>
          <button
  type="button"
  onClick={() => {
    const isDesk = window.innerWidth > 768;
    const newBall = {
      id: `ball-${Date.now()}`,
      type: 'ball',
      x: isDesk ? 52.5 : 34,
      y: isDesk ? 34 : 52.5,
      elevation: 0
    };
    setObjects((prev) => [...prev, newBall]);
    setSelectedObj(newBall);
  }}
  className="w-9 h-9 rounded-full bg-white text-sm shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition"
>
  ⚽
</button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setTool(tool === 'text' ? 'move' : 'text')} className={`p-1.5 rounded ${tool === 'text' ? 'bg-amber-500 text-black' : 'text-zinc-400'}`} title="Texto Explicativo"><Type className="w-5 h-5" /></button>
          <button onClick={() => setTool(tool === 'eraser' ? 'move' : 'eraser')} className={`p-1.5 rounded ${tool === 'eraser' ? 'bg-red-600 text-white animate-pulse' : 'text-zinc-400'}`} title="Goma de Borrar"><Eraser className="w-5 h-5" /></button>
          <button onClick={() => { if (confirm('¿Vaciar toda la pizarra?')) { setObjects([]); setDrawings([]); setTextBlocks([]); recordHistory([]); } }} className="p-1.5 text-red-400 hover:text-red-300" title="Vaciar Cancha Completa"><Trash2 className="w-5 h-5" /></button>
          <button onClick={() => setShowLinePalette(true)} className={`p-1.5 rounded ${tool === 'draw' ? 'bg-amber-500 text-black' : 'text-zinc-300'}`} title="Trazados y Flechas"><PenTool className="w-5 h-5" /></button>
        </div>
      </footer>
    </div>
  );
}
