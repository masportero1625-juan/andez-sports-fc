import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import {
  Folder, Play, RotateCcw, Save, Undo2, Redo2, Trash2, PenTool, X,
  Eraser, Lock, Plus, AlertTriangle, RotateCw, LogOut, MessageCircle,
  Upload, Printer, Edit2, Video, Square, Download, Sparkles, Gift,
  CheckCircle2, Clock, Users, DollarSign, Type, Shield, Move
} from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, useGLTF } from '@react-three/drei';
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
  const defMsg = `Hola ${name || ''}, te contacto desde Andez Sports FC.`;
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

  // Portería profesional FIFA: 7.32m ancho x 2.44m alto x 2.0m profundidad hacia afuera de la cancha
  const goal = (xPos, isLeft) => {
    const dir = isLeft ? -1 : 1;
    const depth = 2.0;
    return (
      <group position={[xPos, 0, 0]}>
        {/* Postes verticales blancos */}
        <mesh position={[0, 1.22, -3.66]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 2.44, 20]} />
          {postMat}
        </mesh>
        <mesh position={[0, 1.22, 3.66]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 2.44, 20]} />
          {postMat}
        </mesh>
        {/* Travesaño horizontal */}
        <mesh position={[0, 2.44, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 7.32, 20]} />
          {postMat}
        </mesh>

        {/* Marco inferior en el suelo */}
        <mesh position={[dir * (depth / 2), 0.05, -3.66]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, depth, 16]} />
          {postMat}
        </mesh>
        <mesh position={[dir * (depth / 2), 0.05, 3.66]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, depth, 16]} />
          {postMat}
        </mesh>
        <mesh position={[dir * depth, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 7.32, 16]} />
          {postMat}
        </mesh>

        {/* Soportes traseros superiores */}
        <mesh position={[dir * (depth / 2), 2.44, -3.66]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, depth, 16]} />
          {postMat}
        </mesh>
        <mesh position={[dir * (depth / 2), 2.44, 3.66]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, depth, 16]} />
          {postMat}
        </mesh>
        <mesh position={[dir * depth, 2.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 7.32, 16]} />
          {postMat}
        </mesh>

        {/* Postes traseros verticales */}
        <mesh position={[dir * depth, 1.22, -3.66]}>
          <cylinderGeometry args={[0.04, 0.04, 2.44, 16]} />
          {postMat}
        </mesh>
        <mesh position={[dir * depth, 1.22, 3.66]}>
          <cylinderGeometry args={[0.04, 0.04, 2.44, 16]} />
          {postMat}
        </mesh>

        {/* Red posterior (malla procedural) */}
        <NetPanel position={[dir * depth, 1.22, 0]} rotation={[0, Math.PI / 2, 0]} width={7.32} height={2.44} />
        {/* Red lateral (lado -Z) */}
        <NetPanel position={[dir * (depth / 2), 1.22, -3.66]} width={depth} height={2.44} />
        {/* Red lateral (lado +Z) */}
        <NetPanel position={[dir * (depth / 2), 1.22, 3.66]} width={depth} height={2.44} />
        {/* Red superior (techo de la red) */}
        <NetPanel position={[dir * (depth / 2), 2.44, 0]} rotation={[-Math.PI / 2, 0, 0]} width={depth} height={7.32} />
      </group>
    );
  };

  return (
    <group>
      {/* Césped perimetral exterior */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[116, 78]} />
        <meshStandardMaterial color="#195928" roughness={0.9} />
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
          <meshStandardMaterial
            color={i % 2 === 0 ? '#237332' : '#1d632b'}
            roughness={0.85}
          />
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

// ===== JUGADOR TÁCTICO PROCEDURAL (estilo TacticalPad) =====
// Anatomía estilizada con primitivas FUSIONADAS en pocas mallas por rol (campo / arquero): ~10 draw calls por jugador.
// Origen local = [0,0,0] en la base de los pies. No aplica traslaciones globales: el <group> padre de Scene3D lo posiciona.
// Modelo construido mirando a +Z; la prop `facing` (por defecto Math.PI) lo gira para que el dorsal se vea desde la cámara táctica.
const SELECTOR_COLOR = '#facc15'; // dorado; cámbialo por '#2563eb' para el selector azul
const PLAYER_ANKLE = 0.1;         // altura del tobillo sobre el césped
const PLAYER_THIGH = 0.44;        // largo del muslo
const PLAYER_SHIN = 0.48;         // largo de la pierna inferior
const PLAYER_HIP_OFFSET = 0.02;   // el hueso de la cadera cuelga 2 cm bajo el centro de la pelvis

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

// Dado el largo de la cadera y la flexión del muslo (alpha), calcula la flexión de rodilla (beta) para que el pie quede a ras de césped.
function solvePlayerKnee(hipY, alpha) {
  const c = (hipY - PLAYER_HIP_OFFSET - PLAYER_ANKLE - PLAYER_THIGH * Math.cos(alpha)) / PLAYER_SHIN;
  return alpha + Math.acos(Math.min(1, Math.max(-1, c)));
}

// Fusiona una lista de BufferGeometry (position + normal + index) en una sola.
function mergePlayerGeos(list) {
  let vCount = 0;
  let iCount = 0;
  list.forEach((g) => {
    vCount += g.attributes.position.count;
    iCount += g.index ? g.index.count : g.attributes.position.count;
  });
  const pos = new Float32Array(vCount * 3);
  const nor = new Float32Array(vCount * 3);
  const idx = vCount > 65000 ? new Uint32Array(iCount) : new Uint16Array(iCount);
  let vOff = 0;
  let iOff = 0;
  list.forEach((g) => {
    const p = g.attributes.position;
    const n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      pos[(vOff + i) * 3] = p.getX(i); pos[(vOff + i) * 3 + 1] = p.getY(i); pos[(vOff + i) * 3 + 2] = p.getZ(i);
      nor[(vOff + i) * 3] = n.getX(i); nor[(vOff + i) * 3 + 1] = n.getY(i); nor[(vOff + i) * 3 + 2] = n.getZ(i);
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
  merged.setIndex(new THREE.BufferAttribute(idx, 1));
  merged.computeBoundingSphere();
  merged.computeBoundingBox();
  return merged;
}

// Construye (una sola vez por rol) las mallas fusionadas por "slot" de material.
const _playerModelCache = {};
function getPlayerModel(isGK) {
  const cacheKey = isGK ? 'gk' : 'field';
  if (_playerModelCache[cacheKey]) return _playerModelCache[cacheKey];

  // Postura por rol
  const pose = isGK
    ? { hipY: 0.8, lean: 0.3, legX: 0.2, abd: 0.12, alphaL: 0.72, alphaR: 0.72, armX: [-0.2, -0.2], armZ: 0.95, elbow: [0.4, 0.4], headTilt: 0.85 }
    : { hipY: 1.0, lean: 0.05, legX: 0.13, abd: 0.0, alphaL: 0.3, alphaR: -0.12, armX: [-0.38, 0.28], armZ: 0.1, elbow: [1.1, 0.75], headTilt: 0.8 };

  const root = new THREE.Group();
  const node = (parent, pos, rot) => {
    const g = new THREE.Group();
    if (pos) g.position.set(pos[0], pos[1], pos[2]);
    if (rot) g.rotation.set(rot[0], rot[1], rot[2]);
    parent.add(g);
    return g;
  };
  const part = (parent, slot, geo, pos, rot, scl) => {
    const m = new THREE.Mesh(geo);
    m.userData.slot = slot;
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    if (scl) m.scale.set(scl[0], scl[1], scl[2]);
    parent.add(m);
    return m;
  };
  const cyl = (rt, rb, h, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg);
  const sph = (r, ws = 10, hs = 8) => new THREE.SphereGeometry(r, ws, hs);

  const hips = node(root, [0, pose.hipY, 0]);
  // Pantalón: pelvis
  part(hips, 'shorts', cyl(0.22, 0.2, 0.24, 14), [0, 0, 0], null, [1, 1, 0.72]);

  // ----- Piernas -----
  [-1, 1].forEach((side) => {
    const alpha = side < 0 ? pose.alphaL : pose.alphaR;
    const beta = solvePlayerKnee(pose.hipY, alpha);
    const hip = node(hips, [side * pose.legX, -PLAYER_HIP_OFFSET, 0], [-alpha, 0, side * pose.abd]);
    // Muslo (piel) + pernera del pantalón
    part(hip, 'skin', cyl(0.105, 0.078, PLAYER_THIGH, 10), [0, -PLAYER_THIGH / 2, 0]);
    part(hip, 'shorts', cyl(0.135, 0.125, 0.27, 12), [0, -0.12, 0]);
    // Rodilla y pierna inferior con media alta + ribete
    const knee = node(hip, [0, -PLAYER_THIGH, 0], [beta, 0, 0]);
    part(knee, 'skin', sph(0.075, 8, 6), [0, 0, 0]);
    part(knee, 'sock', cyl(0.078, 0.058, 0.43, 10), [0, -0.235, 0]);
    part(knee, 'sock', sph(0.08, 8, 6), [0, -0.13, -0.015], null, [1, 1.7, 1]); // gemelo
    part(knee, 'ribete', cyl(0.084, 0.082, 0.045, 12), [0, -0.06, 0]);
    // Botín: caña, empeine y suela diferenciada
    const foot = node(knee, [0, -PLAYER_SHIN, 0], [alpha - beta, 0, 0]);
    part(foot, 'boot', cyl(0.062, 0.066, 0.07, 8), [0, 0, 0]);
    part(foot, 'boot', sph(0.08, 10, 8), [0, -0.045, 0.075], null, [1, 0.95, 2.0]);
    part(foot, 'sole', new THREE.BoxGeometry(0.15, 0.03, 0.3), [0, -0.088, 0.08]);
  });

  // ----- Torso (caída en V), hombros, cuello y cabeza -----
  const torso = node(hips, [0, 0.06, 0], [pose.lean, 0, 0]);
  part(torso, 'jersey', cyl(0.3, 0.2, 0.54, 14), [0, 0.3, 0], null, [1, 1, 0.58]);
  [-1, 1].forEach((side) => {
    part(torso, 'jersey', sph(0.115, 10, 8), [side * 0.33, 0.53, 0], null, [1, 1.05, 0.95]); // deltoides
  });
  part(torso, 'skin', cyl(0.075, 0.085, 0.14, 10), [0, 0.64, 0]); // cuello
  part(torso, 'collar', new THREE.TorusGeometry(0.085, 0.018, 6, 14), [0, 0.585, 0], [Math.PI / 2, 0, 0]);

  const head = node(torso, [0, 0.7, 0.02], [-pose.lean * pose.headTilt, 0, 0]);
  part(head, 'skin', sph(0.19, 14, 12), [0, 0.17, 0]);
  part(head, 'hair', new THREE.SphereGeometry(0.196, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), [0, 0.185, -0.02]);
  [-1, 1].forEach((side) => part(head, 'hair', sph(0.017, 6, 6), [side * 0.07, 0.19, 0.172]));

  // ----- Brazos con codos semi-doblados -----
  [-1, 1].forEach((side) => {
    const i = side < 0 ? 0 : 1;
    const shoulder = node(torso, [side * 0.345, 0.52, 0], [pose.armX[i], 0, side * pose.armZ]);
    part(shoulder, 'skin', cyl(0.062, 0.052, 0.3, 8), [0, -0.15, 0]);
    part(shoulder, 'jersey', cyl(0.088, 0.08, 0.17, 10), [0, -0.085, 0]); // manga corta
    const elbow = node(shoulder, [0, -0.3, 0], [-pose.elbow[i], 0, 0]);
    part(elbow, 'skin', sph(0.055, 8, 6), [0, 0, 0]);
    part(elbow, 'skin', cyl(0.052, 0.042, 0.27, 8), [0, -0.14, 0]);
    if (isGK) {
      part(elbow, 'boot', cyl(0.062, 0.06, 0.07, 8), [0, -0.23, 0]);                      // puño del guante
      part(elbow, 'glove', sph(0.09, 10, 8), [0, -0.325, 0.012], null, [1, 1.15, 0.8]);   // guante
    } else {
      part(elbow, 'skin', sph(0.052, 8, 6), [0, -0.29, 0]);                               // mano
    }
  });

  root.updateMatrixWorld(true);
  const buckets = {};
  root.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    (buckets[o.userData.slot] = buckets[o.userData.slot] || []).push(g);
    o.geometry.dispose();
  });
  const geos = {};
  Object.keys(buckets).forEach((slot) => {
    geos[slot] = mergePlayerGeos(buckets[slot]);
    buckets[slot].forEach((g) => g.dispose());
  });

  const model = { geos, hipY: pose.hipY, lean: pose.lean };
  _playerModelCache[cacheKey] = model;
  return model;
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

function TacticalPlayer3D({ color, number, isSelected, onClick, facing = Math.PI }) {
  const { scene } = useGLTF('/player.glb');
  const clone = useMemo(() => scene.clone(true), [scene]);
  const jerseyColor = color || '#2563eb';

  useEffect(() => {
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = new THREE.MeshStandardMaterial({
          color: jerseyColor,
          roughness: 0.4,
          metalness: 0.1
        });
      }
    });
  }, [clone, jerseyColor]);

  return (
    <group dispose={null} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
      {/* Sombra de contacto */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.55, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Selector táctico en el suelo */}
      {isSelected && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <circleGeometry args={[0.85, 32]} />
            <meshBasicMaterial color="#facc15" transparent opacity={0.35} depthWrite={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
            <ringGeometry args={[0.85, 0.98, 36]} />
            <meshBasicMaterial color="#facc15" depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* Reducción drástica del contenedor principal */}
      <group rotation={[0, facing, 0]} scale={[0.00001, 0.00001, 0.00001]}>
        <primitive object={clone} />
      </group>
    </group>
  );
}

useGLTF.preload('/player.glb');




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

function Ball3D({ position, isSelected, onClick }) {
  const posX = (position?.x ?? 52.5) - 52.5;
  const posZ = (position?.y ?? 34) - 34;
  const ballTexture = useMemo(() => getBallTexture(), []);

  return (
    <group position={[posX, 0.32, posZ]} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
      {/* Sombra proyectada por el balón */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <circleGeometry args={[0.34, 16]} />
        <meshBasicMaterial color="#000000" opacity={0.45} transparent />
      </mesh>

      {/* Balón: esfera con textura procedural de pentágonos y hexágonos */}
      <mesh castShadow rotation={[0.35, 0.6, 0.1]}>
        <sphereGeometry args={[0.32, 48, 32]} />
        <meshStandardMaterial map={ballTexture} roughness={0.42} metalness={0.02} />
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
// ===== GRADERÍAS ESCALONADAS CON VISERA =====
const STAND_STYLES = {
  red:  { seat: '#b91c1c', fans: ['#f8fafc', '#fbbf24', '#1f2937', '#fca5a5'], accent: '#dc2626' },
  blue: { seat: '#1d4ed8', fans: ['#f8fafc', '#fbbf24', '#93c5fd', '#111827'], accent: '#2563eb' },
};

function makeCrowdTexture(style, seed, length, rowDepth) {
  const cols = 32, rowsPx = 2, cell = 16; // 32 x 2 asientos de 0.5 m  => 16 m x 1 m por baldosa
  const c = document.createElement('canvas');
  c.width = cols * cell; c.height = rowsPx * cell;
  const ctx = c.getContext('2d');
  let s = ((seed * 7919 + 13) % 2147483646) + 1;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const skins = ['#e0b08a', '#c68642', '#8d5524', '#f1c27d'];
  ctx.fillStyle = style.seat;
  ctx.fillRect(0, 0, c.width, c.height);
  for (let r = 0; r < rowsPx; r++) {
    for (let k = 0; k < cols; k++) {
      const x = k * cell, y = r * cell;
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
      if (rnd() < 0.6) {
        ctx.fillStyle = style.fans[Math.floor(rnd() * style.fans.length)];
        ctx.beginPath(); ctx.arc(x + cell / 2, y + cell * 0.68, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = skins[Math.floor(rnd() * skins.length)];
        ctx.beginPath(); ctx.arc(x + cell / 2, y + cell * 0.3, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(length / 16, rowDepth);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

// Marco local de la tribuna: X = largo paralelo a la línea, Y = arriba, Z = hacia AFUERA de la cancha.
function Stand({ position, rotationY = 0, length, variant = 'blue', rows = 12, rowDepth = 1.1, rise = 0.55 }) {
  const seatColor = variant === 'red' ? '#b91c1c' : '#1d4ed8';
  const concreteColor = '#94a3b8';
  const roofColor = '#334155';
  const fasciaColor = variant === 'red' ? '#ef4444' : '#3b82f6';

  const depth = rows * rowDepth;
  const topH = rows * rise;
  const nCols = Math.max(2, Math.round(length / 16));

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Gradas escalonadas de hormigón */}
      {Array.from({ length: rows }).map((_, i) => {
        const h = (i + 1) * rise;
        const zPos = i * rowDepth + rowDepth / 2;
        return (
          <group key={`row-${i}`}>
            {/* Escalón de hormigón */}
            <mesh position={[0, h / 2, zPos]}>
              <boxGeometry args={[length, h, rowDepth]} />
              <meshStandardMaterial color={concreteColor} roughness={0.9} />
            </mesh>
            {/* Fila corrida de butacas de color nítido */}
            <mesh position={[0, h + 0.1, zPos]}>
              <boxGeometry args={[length - 0.4, 0.2, rowDepth * 0.65]} />
              <meshStandardMaterial color={seatColor} roughness={0.6} />
            </mesh>
          </group>
        );
      })}

      {/* Visera / Techo del estadio */}
      <mesh position={[0, topH + 5.2, depth / 2 + 1.5]} rotation={[-0.14, 0, 0]}>
        <boxGeometry args={[length, 0.35, depth + 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.7} metalness={0.15} />
      </mesh>
      {/* Borde frontal decorativo con color del club */}
      <mesh position={[0, topH + 4.9, 0]}>
        <boxGeometry args={[length, 0.5, 0.25]} />
        <meshStandardMaterial color={fasciaColor} roughness={0.5} />
      </mesh>

      {/* Pilares de soporte metálicos */}
      {Array.from({ length: nCols + 1 }).map((_, k) => (
        <mesh key={`col-${k}`} position={[-length / 2 + (k * length) / nCols, (topH + 5) / 2, depth - 0.5]}>
          <cylinderGeometry args={[0.26, 0.32, topH + 5, 12]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function StadiumEnvironment() {
  const towers = [[-68, -50], [68, -50], [-68, 50], [68, 50]];
  return (
    <group>
      {/* Fondos (norte y sur): largo 118 m, empiezan a 41 m del centro, justo fuera del césped perimetral */}
      <Stand position={[0, 0, -41]} rotationY={Math.PI} length={118} variant="red" seed={1} />
      <Stand position={[0, 0, 41]} rotationY={0} length={118} variant="red" seed={2} />
      {/* Laterales (oeste y este): largo 84 m, empiezan a 61 m del centro */}
      <Stand position={[-61, 0, 0]} rotationY={-Math.PI / 2} length={84} variant="blue" seed={3} />
      <Stand position={[61, 0, 0]} rotationY={Math.PI / 2} length={84} variant="blue" seed={4} />

      {/* Vallas publicitarias alrededor de la cancha (fuera de las líneas) */}
      {[-36.8, 36.8].map((z) => (
        <group key={`ad-z-${z}`}>
          <mesh position={[0, 0.5, z]}><boxGeometry args={[110, 1, 0.15]} /><meshStandardMaterial color="#0f2f6b" roughness={0.6} /></mesh>
          <mesh position={[0, 1.04, z]}><boxGeometry args={[110, 0.08, 0.18]} /><meshStandardMaterial color="#f8fafc" roughness={0.5} /></mesh>
        </group>
      ))}
      {[-55.8, 55.8].map((x) => (
        <group key={`ad-x-${x}`}>
          <mesh position={[x, 0.5, 0]}><boxGeometry args={[0.15, 1, 74]} /><meshStandardMaterial color="#0f2f6b" roughness={0.6} /></mesh>
          <mesh position={[x, 1.04, 0]}><boxGeometry args={[0.18, 0.08, 74]} /><meshStandardMaterial color="#f8fafc" roughness={0.5} /></mesh>
        </group>
      ))}

      {/* Torres de iluminación en las esquinas */}
      {towers.map(([x, z]) => (
        <group key={`tower-${x}-${z}`} position={[x, 0, z]}>
          <mesh position={[0, 15, 0]}><cylinderGeometry args={[0.3, 0.45, 30, 10]} /><meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.4} /></mesh>
          <group position={[0, 30, 0]} rotation={[0, Math.atan2(-x, -z), 0]}>
            <mesh><boxGeometry args={[6, 3.4, 0.5]} /><meshStandardMaterial color="#e2e8f0" emissive="#fef9c3" emissiveIntensity={1.1} roughness={0.4} /></mesh>
          </group>
        </group>
      ))}

      {/* Suelo perimetral de hormigón */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[160, 120]} />
        <meshStandardMaterial color="#3b4350" roughness={0.9} />
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

  // Proyección universal 1:1
  const toWorld = (obj) => ({ x: obj.x - 52.5, z: obj.y - 34 });

  const handlePointerDown = (e, obj) => {
    if (!cameraLocked) return;
    e.stopPropagation();
    setSelectedObj(obj);
    dragId.current = obj.id;
    isDragging.current = true;
    setActiveDragId(obj.id);

    // Fijar el anclaje exacto del puntero
    if (e.ray && e.ray.intersectPlane(mathPlane, planeIntersect)) {
      dragOffset.current.set(
        planeIntersect.x - (obj.x - 52.5),
        0,
        planeIntersect.z - (obj.y - 34)
      );
    } else {
      dragOffset.current.set(0, 0, 0);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current || !dragId.current || !cameraLocked) return;
    e.stopPropagation();

    if (e.ray && e.ray.intersectPlane(mathPlane, planeIntersect)) {
      // Arrastre continuo y suave sin saltos escalonados
      const targetWorldX = planeIntersect.x - dragOffset.current.x;
      const targetWorldZ = planeIntersect.z - dragOffset.current.z;

      const clampedX = Math.max(1, Math.min(104, targetWorldX + 52.5));
      const clampedY = Math.max(1, Math.min(67, targetWorldZ + 34));

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
  const camPos = isPC ? [0, 64, 58] : [0, 85, 48];
const camFov = isPC ? 46 : 68;

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
      <ambientLight intensity={0.95} />
      <hemisphereLight args={["#e0f2fe", "#14532d", 0.65]} />
      <directionalLight position={[12, 35, 18]} intensity={1.7} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />

      {/* Cancha 3D en coordenadas nativas, sin rotación CSS del viewport. */}
      <Pitch3D />
      <StadiumEnvironment />

      {/* Malla receptora de interacción táctil y mouse con rango amplio */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
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
              {/* Hitbox invisible ampliada para selección táctil del balón. */}
              <mesh position={[0, 0.9, 0]}>
                <sphereGeometry args={[1.4, 12, 10]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
              <Ball3D position={{ x: obj.x, y: obj.y }} isSelected={selectedObj?.id === obj.id} onClick={() => {}} />
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
    <div
      className="flex flex-col h-screen w-screen bg-black overflow-hidden select-none font-sans print:bg-white print:text-black"
    >
      {/* HEADER */}
      <header className="bg-black px-3 py-1.5 flex items-center justify-between shrink-0 z-30 border-b border-zinc-900 no-print overflow-x-auto max-w-full">
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
      <main className="flex-1 w-full h-full flex items-center justify-center p-0 overflow-hidden touch-none relative bg-[#1e881b]">
        {viewMode === '2d' ? (
          <svg ref={svgRef} viewBox={isPC ? (pitchMode === 'half' ? "0 0 55 68" : "0 0 105 68") : (pitchMode === 'half' ? "0 0 68 85" : "0 0 68 105")} className="w-full h-full select-none drop-shadow-2xl touch-none" onPointerDown={handlePitchPointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
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
        ) : (
          <div className="relative w-full h-full">
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
            <Suspense fallback={<div className="text-white font-bold text-sm flex items-center justify-center h-full">Cargando 3D...</div>}>
              <Canvas
              frameloop="always"
              dpr={[1, 1.5]}
              shadows
              gl={{ antialias: true, powerPreference: "high-performance" }}
              className="w-full h-full touch-none select-none"
              style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
            >
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
            </Canvas>
            </Suspense>
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
          <button onClick={() => addElement('ball')} className="w-9 h-9 rounded-full bg-white text-sm shadow hover:scale-105 transition-transform">⚽</button>
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
