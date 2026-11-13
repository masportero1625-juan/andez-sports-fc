import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, Suspense } from 'react';
import {
  Folder, Play, RotateCcw, Save, Undo2, Redo2, Trash2, PenTool, X,
  Eraser, Lock, Plus, AlertTriangle, RotateCw, LogOut, MessageCircle,
  Upload, Printer, Edit2, Video, Square, Download, Sparkles, Gift,
  CheckCircle2, Clock, Users, DollarSign, Type, Shield, Move
} from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html, useGLTF, useAnimations, PerspectiveCamera } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';
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

const TACTICAL_SYSTEMS_LIST = [
  '4-4-2', '4-5-1', '4-3-3', '3-5-2', '3-4-3',
  '4-2-3-1', '4-3-2-1', '4-3-1-2', '3-4-2-1', '3-4-1-2'
];

const GET_TACTICAL_SYSTEMS = (isLand) => {
  if (isLand) {
    return {
      '4-4-2': [
        {n:'1',r:'GK',x:8,y:34},{n:'4',r:'CB',x:22,y:24},{n:'3',r:'CB',x:22,y:44},{n:'2',r:'RB',x:30,y:10},{n:'5',r:'LB',x:30,y:58},
        {n:'6',r:'CM',x:48,y:24},{n:'8',r:'CM',x:48,y:44},{n:'7',r:'RM',x:56,y:10},{n:'11',r:'LM',x:56,y:58},{n:'9',r:'ST',x:78,y:26},{n:'10',r:'ST',x:78,y:42}
      ],
      '4-5-1': [
        {n:'1',r:'GK',x:8,y:34},{n:'4',r:'CB',x:22,y:24},{n:'3',r:'CB',x:22,y:44},{n:'2',r:'RB',x:30,y:10},{n:'5',r:'LB',x:30,y:58},
        {n:'6',r:'CDM',x:42,y:34},{n:'8',r:'CM',x:52,y:22},{n:'10',r:'CM',x:52,y:46},{n:'7',r:'RM',x:64,y:10},{n:'11',r:'LM',x:64,y:58},{n:'9',r:'ST',x:82,y:34}
      ],
      '4-3-3': [
        {n:'1',r:'GK',x:8,y:34},{n:'4',r:'CB',x:22,y:24},{n:'3',r:'CB',x:22,y:44},{n:'2',r:'RB',x:30,y:10},{n:'5',r:'LB',x:30,y:58},
        {n:'6',r:'CDM',x:42,y:34},{n:'8',r:'CM',x:52,y:22},{n:'10',r:'CAM',x:52,y:46},{n:'7',r:'RW',x:74,y:12},{n:'11',r:'LW',x:74,y:56},{n:'9',r:'ST',x:82,y:34}
      ],
      '3-5-2': [
        {n:'1',r:'GK',x:8,y:34},{n:'2',r:'CB',x:22,y:18},{n:'4',r:'CB',x:21,y:34},{n:'3',r:'CB',x:22,y:50},
        {n:'6',r:'CDM',x:38,y:34},{n:'8',r:'CM',x:50,y:23},{n:'10',r:'CM',x:50,y:45},{n:'7',r:'RWB',x:56,y:8},{n:'11',r:'LWB',x:56,y:60},
        {n:'9',r:'ST',x:78,y:26},{n:'10',r:'ST',x:78,y:42}
      ],
      '3-4-3': [
        {n:'1',r:'GK',x:8,y:34},{n:'2',r:'CB',x:22,y:18},{n:'4',r:'CB',x:21,y:34},{n:'3',r:'CB',x:22,y:50},
        {n:'6',r:'CM',x:45,y:24},{n:'8',r:'CM',x:45,y:44},{n:'7',r:'RM',x:54,y:10},{n:'11',r:'LM',x:54,y:58},
        {n:'17',r:'RW',x:74,y:14},{n:'19',r:'LW',x:74,y:54},{n:'9',r:'ST',x:82,y:34}
      ],
      '4-2-3-1': [
        {n:'1',r:'GK',x:8,y:34},{n:'4',r:'CB',x:22,y:24},{n:'3',r:'CB',x:22,y:44},{n:'2',r:'RB',x:30,y:10},{n:'5',r:'LB',x:30,y:58},
        {n:'6',r:'CDM',x:42,y:25},{n:'8',r:'CDM',x:42,y:43},{n:'10',r:'CAM',x:60,y:34},{n:'7',r:'RAM',x:64,y:12},{n:'11',r:'LAM',x:64,y:56},{n:'9',r:'ST',x:82,y:34}
      ],
      '4-3-2-1': [
        {n:'1',r:'GK',x:8,y:34},{n:'4',r:'CB',x:22,y:24},{n:'3',r:'CB',x:22,y:44},{n:'2',r:'RB',x:30,y:10},{n:'5',r:'LB',x:30,y:58},
        {n:'6',r:'CM',x:45,y:18},{n:'8',r:'CDM',x:44,y:34},{n:'10',r:'CM',x:45,y:50},{n:'7',r:'CAM',x:64,y:24},{n:'11',r:'CAM',x:64,y:44},{n:'9',r:'ST',x:82,y:34}
      ],
      '4-3-1-2': [
        {n:'1',r:'GK',x:8,y:34},{n:'4',r:'CB',x:22,y:24},{n:'3',r:'CB',x:22,y:44},{n:'2',r:'RB',x:30,y:10},{n:'5',r:'LB',x:30,y:58},
        {n:'6',r:'CM',x:45,y:18},{n:'8',r:'CDM',x:44,y:34},{n:'11',r:'CM',x:45,y:50},{n:'10',r:'CAM',x:60,y:34},{n:'7',r:'ST',x:78,y:26},{n:'9',r:'ST',x:78,y:42}
      ],
      '3-4-2-1': [
        {n:'1',r:'GK',x:8,y:34},{n:'2',r:'CB',x:22,y:18},{n:'4',r:'CB',x:21,y:34},{n:'3',r:'CB',x:22,y:50},
        {n:'6',r:'CM',x:45,y:24},{n:'8',r:'CM',x:45,y:44},{n:'7',r:'RM',x:52,y:10},{n:'11',r:'LM',x:52,y:58},
        {n:'17',r:'CAM',x:65,y:24},{n:'18',r:'CAM',x:65,y:44},{n:'9',r:'ST',x:82,y:34}
      ],
      '3-4-1-2': [
        {n:'1',r:'GK',x:8,y:34},{n:'2',r:'CB',x:22,y:18},{n:'4',r:'CB',x:21,y:34},{n:'3',r:'CB',x:22,y:50},
        {n:'6',r:'CM',x:45,y:24},{n:'8',r:'CM',x:45,y:44},{n:'7',r:'RM',x:52,y:10},{n:'11',r:'LM',x:52,y:58},
        {n:'10',r:'CAM',x:62,y:34},{n:'9',r:'ST',x:78,y:26},{n:'19',r:'ST',x:78,y:42}
      ]
    };
  }
  return {
    '4-4-2': [
      {n:'1',r:'GK',x:34,y:96},{n:'4',r:'CB',x:23,y:82},{n:'3',r:'CB',x:45,y:82},{n:'2',r:'RB',x:10,y:74},{n:'5',r:'LB',x:58,y:74},
      {n:'6',r:'CM',x:24,y:56},{n:'8',r:'CM',x:44,y:56},{n:'7',r:'RM',x:10,y:48},{n:'11',r:'LM',x:58,y:48},{n:'9',r:'ST',x:26,y:26},{n:'10',r:'ST',x:42,y:26}
    ],
    '4-5-1': [
      {n:'1',r:'GK',x:34,y:96},{n:'4',r:'CB',x:23,y:82},{n:'3',r:'CB',x:45,y:82},{n:'2',r:'RB',x:10,y:74},{n:'5',r:'LB',x:58,y:74},
      {n:'6',r:'CDM',x:34,y:65},{n:'8',r:'CM',x:22,y:52},{n:'10',r:'CM',x:46,y:52},{n:'7',r:'RM',x:10,y:42},{n:'11',r:'LM',x:58,y:42},{n:'9',r:'ST',x:34,y:24}
    ],
    '4-3-3': [
      {n:'1',r:'GK',x:34,y:96},{n:'4',r:'CB',x:23,y:82},{n:'3',r:'CB',x:45,y:82},{n:'2',r:'RB',x:10,y:74},{n:'5',r:'LB',x:58,y:74},
      {n:'6',r:'CDM',x:34,y:64},{n:'8',r:'CM',x:22,y:52},{n:'10',r:'CAM',x:46,y:52},{n:'7',r:'RW',x:12,y:32},{n:'11',r:'LW',x:56,y:32},{n:'9',r:'ST',x:34,y:24}
    ],
    '3-5-2': [
      {n:'1',r:'GK',x:34,y:96},{n:'2',r:'CB',x:18,y:82},{n:'4',r:'CB',x:34,y:83},{n:'3',r:'CB',x:50,y:82},
      {n:'6',r:'CDM',x:34,y:66},{n:'8',r:'CM',x:23,y:54},{n:'10',r:'CM',x:45,y:54},{n:'7',r:'RWB',x:8,y:48},{n:'11',r:'LWB',x:60,y:48},
      {n:'9',r:'ST',x:26,y:26},{n:'10',r:'ST',x:42,y:26}
    ],
    '3-4-3': [
      {n:'1',r:'GK',x:34,y:96},{n:'2',r:'CB',x:18,y:82},{n:'4',r:'CB',x:34,y:83},{n:'3',r:'CB',x:50,y:82},
      {n:'6',r:'CM',x:24,y:58},{n:'8',r:'CM',x:44,y:58},{n:'7',r:'RM',x:10,y:50},{n:'11',r:'LM',x:58,y:50},
      {n:'17',r:'RW',x:14,y:32},{n:'19',r:'LW',x:54,y:32},{n:'9',r:'ST',x:34,y:24}
    ],
    '4-2-3-1': [
      {n:'1',r:'GK',x:34,y:96},{n:'4',r:'CB',x:23,y:82},{n:'3',r:'CB',x:45,y:82},{n:'2',r:'RB',x:10,y:74},{n:'5',r:'LB',x:58,y:74},
      {n:'6',r:'CDM',x:25,y:64},{n:'8',r:'CDM',x:43,y:64},{n:'10',r:'CAM',x:34,y:46},{n:'7',r:'RAM',x:12,y:42},{n:'11',r:'LAM',x:56,y:42},{n:'9',r:'ST',x:34,y:24}
    ],
    '4-3-2-1': [
      {n:'1',r:'GK',x:34,y:96},{n:'4',r:'CB',x:23,y:82},{n:'3',r:'CB',x:45,y:82},{n:'2',r:'RB',x:10,y:74},{n:'5',r:'LB',x:58,y:74},
      {n:'6',r:'CM',x:18,y:60},{n:'8',r:'CDM',x:34,y:62},{n:'10',r:'CM',x:50,y:60},{n:'7',r:'CAM',x:24,y:42},{n:'11',r:'CAM',x:44,y:42},{n:'9',r:'ST',x:34,y:24}
    ],
    '4-3-1-2': [
      {n:'1',r:'GK',x:34,y:96},{n:'4',r:'CB',x:23,y:82},{n:'3',r:'CB',x:45,y:82},{n:'2',r:'RB',x:10,y:74},{n:'5',r:'LB',x:58,y:74},
      {n:'6',r:'CM',x:18,y:60},{n:'8',r:'CDM',x:34,y:62},{n:'11',r:'CM',x:50,y:60},{n:'10',r:'CAM',x:34,y:46},{n:'7',r:'ST',x:26,y:26},{n:'9',r:'ST',x:42,y:26}
    ],
    '3-4-2-1': [
      {n:'1',r:'GK',x:34,y:96},{n:'2',r:'CB',x:18,y:82},{n:'4',r:'CB',x:34,y:83},{n:'3',r:'CB',x:50,y:82},
      {n:'6',r:'CM',x:24,y:58},{n:'8',r:'CM',x:44,y:58},{n:'7',r:'RM',x:10,y:52},{n:'11',r:'LM',x:58,y:52},
      {n:'17',r:'CAM',x:24,y:40},{n:'18',r:'CAM',x:44,y:40},{n:'9',r:'ST',x:34,y:24}
    ],
    '3-4-1-2': [
      {n:'1',r:'GK',x:34,y:96},{n:'2',r:'CB',x:18,y:82},{n:'4',r:'CB',x:34,y:83},{n:'3',r:'CB',x:50,y:82},
      {n:'6',r:'CM',x:24,y:58},{n:'8',r:'CM',x:44,y:58},{n:'7',r:'RM',x:10,y:52},{n:'11',r:'LM',x:58,y:52},
      {n:'10',r:'CAM',x:34,y:44},{n:'9',r:'ST',x:26,y:26},{n:'19',r:'ST',x:42,y:26}
    ]
  };
};

// --- COMPONENTES GRÁFICOS ESTILO TACTICALPAD ---

function SoccerBall({ x, y, onPointerDown }) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onPointerDown={onPointerDown}
      className="cursor-pointer select-none"
    >
      <defs>
        {/* Sombra de caída suave en el césped */}
        <radialGradient id="ballGroundShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        {/* Volumen 3D del balón con punto de luz */}
        <radialGradient id="ballShading" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="65%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#64748b" />
        </radialGradient>
      </defs>

      {/* Sombra arrojada */}
      <ellipse cx="0.4" cy="1.3" rx="1.6" ry="0.65" fill="url(#ballGroundShadow)" />

      {/* Esfera base con degradado */}
      <circle cx="0" cy="0" r="1.45" fill="url(#ballShading)" stroke="#334155" strokeWidth="0.08" />

      {/* Costuras y gajos clásicos pentagonales */}
      {/* Pentágono central */}
      <polygon
        points="0,-0.45 0.42,-0.15 0.26,0.36 -0.26,0.36 -0.42,-0.15"
        fill="#1e293b"
      />
      {/* Costuras radiales hacia los bordes */}
      <line x1="0" y1="-0.45" x2="0" y2="-1.0" stroke="#334155" strokeWidth="0.09" strokeLinecap="round" />
      <line x1="0.42" y1="-0.15" x2="0.95" y2="-0.35" stroke="#334155" strokeWidth="0.09" strokeLinecap="round" />
      <line x1="0.26" y1="0.36" x2="0.65" y2="0.85" stroke="#334155" strokeWidth="0.09" strokeLinecap="round" />
      <line x1="-0.26" y1="0.36" x2="-0.65" y2="0.85" stroke="#334155" strokeWidth="0.09" strokeLinecap="round" />
      <line x1="-0.42" y1="-0.15" x2="-0.95" y2="-0.35" stroke="#334155" strokeWidth="0.09" strokeLinecap="round" />

      {/* Parches periféricos curvados */}
      <path d="M -0.35,-1.3 A 1.4 1.4 0 0 1 0.35,-1.3 L 0,-1.0 Z" fill="#1e293b" />
      <path d="M 1.25,-0.6 A 1.4 1.4 0 0 1 1.4,0.1 L 0.95,-0.35 Z" fill="#1e293b" />
      <path d="M 0.9,1.0 A 1.4 1.4 0 0 1 0.2,1.4 L 0.65,0.85 Z" fill="#1e293b" />
      <path d="M -0.9,1.0 A 1.4 1.4 0 0 0 -0.2,1.4 L -0.65,0.85 Z" fill="#1e293b" />
      <path d="M -1.25,-0.6 A 1.4 1.4 0 0 0 -1.4,0.1 L -0.95,-0.35 Z" fill="#1e293b" />

      {/* Reflejo de brillo especular superior */}
      <ellipse cx="-0.4" cy="-0.45" rx="0.45" ry="0.25" fill="#ffffff" opacity="0.45" transform="rotate(-25 -0.4 -0.45)" />
    </g>
  );
}

function TrainingMaterial({ obj, onPointerDown, onDoubleClick }) {
  const rot = obj.rotation || 0;
  const s = obj.scale || 1.0;
  const itemColor = obj.color;

  const renderContent = () => {
    switch (obj.type) {

      // --- MINI PORTERÍA ESTILO TACTICALPAD (2D ISOMÉTRICA CON RED CAÍDA) ---
      case 'mini_goal':
        return (
          <g>
            <defs>
              <pattern id="tpMiniNet" width="0.32" height="0.32" patternUnits="userSpaceOnUse">
                <path d="M 0 0 L 0.32 0.32 M 0 0.32 L 0.32 0" fill="none" stroke="#e2e8f0" strokeWidth="0.04" opacity="0.8" />
              </pattern>
            </defs>

            {/* Sombra de la base en el césped */}
            <polygon points="-2.5,0.4 2.5,0.4 3.1,-1.8 -1.9,-1.8" fill="#000000" opacity="0.22" />

            {/* Malla lateral izquierda y fondo */}
            <polygon points="-2.4,0 -2.4,-1.8 -1.7,-2.7 -1.7,-0.9" fill="url(#tpMiniNet)" stroke="#94a3b8" strokeWidth="0.05" />
            <polygon points="-1.7,-0.9 3.1,-0.9 3.1,-2.7 -1.7,-2.7" fill="url(#tpMiniNet)" stroke="#94a3b8" strokeWidth="0.05" />
            <polygon points="-2.4,-1.8 2.4,-1.8 3.1,-2.7 -1.7,-2.7" fill="url(#tpMiniNet)" stroke="#94a3b8" strokeWidth="0.05" />
            <polygon points="2.4,0 2.4,-1.8 3.1,-2.7 3.1,-0.9" fill="url(#tpMiniNet)" stroke="#94a3b8" strokeWidth="0.05" />

            {/* Tubulares traseros de tensión */}
            <line x1="-2.4" y1="-1.8" x2="-1.7" y2="-2.7" stroke="#cbd5e1" strokeWidth="0.16" />
            <line x1="2.4" y1="-1.8" x2="3.1" y2="-2.7" stroke="#cbd5e1" strokeWidth="0.16" />
            <line x1="-1.7" y1="-2.7" x2="3.1" y2="-2.7" stroke="#cbd5e1" strokeWidth="0.16" />

            {/* Marco frontal blanco reflectante */}
            <line x1="-2.4" y1="0.1" x2="-2.4" y2="-1.8" stroke="#ffffff" strokeWidth="0.28" strokeLinecap="round" />
            <line x1="2.4" y1="0.1" x2="2.4" y2="-1.8" stroke="#ffffff" strokeWidth="0.28" strokeLinecap="round" />
            <line x1="-2.45" y1="-1.8" x2="2.45" y2="-1.8" stroke="#ffffff" strokeWidth="0.28" strokeLinecap="round" />

            {/* Sombra de contorno del marco */}
            <line x1="-2.4" y1="0.1" x2="-2.4" y2="-1.8" stroke="#64748b" strokeWidth="0.06" strokeLinecap="round" />
            <line x1="2.4" y1="0.1" x2="2.4" y2="-1.8" stroke="#64748b" strokeWidth="0.06" strokeLinecap="round" />
            <line x1="-2.4" y1="-1.75" x2="2.4" y2="-1.75" stroke="#94a3b8" strokeWidth="0.06" />
          </g>
        );

      // --- MANIQUÍ DEFENSIVO ESTILO TACTICALPAD (SILUETA DE PECHO, CUELLO Y PICAS EXACTAS) ---
      case 'dummy':
        const dummyFill = itemColor || '#eab308';
        return (
          <g>
            {/* Sombra arrojada de la base en el suelo */}
            <ellipse cx="0" cy="2.9" rx="1.3" ry="0.45" fill="#000000" opacity="0.32" />

            {/* Silueta completa del maniquí con calados internos */}
            <g stroke="#854d0e" strokeWidth="0.12" fill={dummyFill}>
              {/* Cabeza anatómica ovalada */}
              <circle cx="0" cy="-2.8" r="0.68" />
              <circle cx="0" cy="-2.8" r="0.4" fill="#ffffff" opacity="0.18" stroke="none" />

              {/* Cuello */}
              <rect x="-0.22" y="-2.15" width="0.44" height="0.45" rx="0.08" />

              {/* Torso con hombros caídos y costillas estilizadas */}
              <path d="M -1.35,-1.7 C -0.8,-1.85 0.8,-1.85 1.35,-1.7 L 1.15,0.7 L -1.15,0.7 Z" />
              {/* Ranuras/rejillas interiores del maniquí */}
              <line x1="-0.75" y1="-1.4" x2="-0.65" y2="0.45" stroke="#854d0e" strokeWidth="0.14" />
              <line x1="0" y1="-1.55" x2="0" y2="0.45" stroke="#854d0e" strokeWidth="0.16" />
              <line x1="0.75" y1="-1.4" x2="0.65" y2="0.45" stroke="#854d0e" strokeWidth="0.14" />
              <line x1="-1.05" y1="-0.8" x2="1.05" y2="-0.8" stroke="#854d0e" strokeWidth="0.14" />
              <line x1="-0.95" y1="-0.1" x2="0.95" y2="-0.1" stroke="#854d0e" strokeWidth="0.14" />

              {/* Soporte de cintura */}
              <rect x="-1.15" y="0.7" width="2.3" height="0.32" rx="0.08" />

              {/* Piernas / Picas verticales que bajan al césped */}
              <line x1="-0.7" y1="1.02" x2="-0.7" y2="2.7" stroke={dummyFill} strokeWidth="0.26" strokeLinecap="round" />
              <line x1="-0.7" y1="1.02" x2="-0.7" y2="2.7" stroke="#854d0e" strokeWidth="0.06" strokeLinecap="round" />
              <line x1="0.7" y1="1.02" x2="0.7" y2="2.7" stroke={dummyFill} strokeWidth="0.26" strokeLinecap="round" />
              <line x1="0.7" y1="1.02" x2="0.7" y2="2.7" stroke="#854d0e" strokeWidth="0.06" strokeLinecap="round" />

              {/* Travesaño inferior estabilizador */}
              <line x1="-0.7" y1="2.1" x2="0.7" y2="2.1" stroke="#854d0e" strokeWidth="0.18" />
              {/* Puntas metálicas clavadas al suelo */}
              <line x1="-0.7" y1="2.7" x2="-0.7" y2="3.1" stroke="#334155" strokeWidth="0.18" strokeLinecap="round" />
              <line x1="0.7" y1="2.7" x2="0.7" y2="3.1" stroke="#334155" strokeWidth="0.18" strokeLinecap="round" />
            </g>
          </g>
        );

      // --- ESCALERA DE COORDINACIÓN PROFESIONAL ---
      case 'ladder':
        return (
          <g>
            <rect x="-1.8" y="-5.9" width="3.6" height="11.8" fill="#000000" opacity="0.15" />
            <line x1="-1.6" y1="-6.0" x2="-1.6" y2="6.0" stroke="#0284c7" strokeWidth="0.22" strokeLinecap="round" />
            <line x1="1.6" y1="-6.0" x2="1.6" y2="6.0" stroke="#0284c7" strokeWidth="0.22" strokeLinecap="round" />
            {[-4.8, -3.2, -1.6, 0.0, 1.6, 3.2, 4.8].map((ly) => (
              <g key={ly}>
                <rect x="-1.7" y={ly - 0.12} width="3.4" height="0.24" rx="0.06" fill="#facc15" stroke="#ca8a04" strokeWidth="0.04" />
                <rect x="-1.7" y={ly - 0.12} width="0.3" height="0.24" fill="#0369a1" />
                <rect x="1.4" y={ly - 0.12} width="0.3" height="0.24" fill="#0369a1" />
              </g>
            ))}
          </g>
        );

      // --- VALLAS DE SALTO ---
      case 'hurdle':
        const hurdleColor = itemColor || '#facc15';
        return (
          <g>
            <ellipse cx="0.2" cy="0.8" rx="2.4" ry="0.4" fill="#000000" opacity="0.26" />
            <line x1="-2.1" y1="0.5" x2="-2.1" y2="1.2" stroke="#475569" strokeWidth="0.24" strokeLinecap="round" />
            <line x1="2.1" y1="0.5" x2="2.1" y2="1.2" stroke="#475569" strokeWidth="0.24" strokeLinecap="round" />
            <line x1="-2.1" y1="0.7" x2="-2.1" y2="-0.7" stroke={hurdleColor} strokeWidth="0.26" strokeLinecap="round" />
            <line x1="2.1" y1="0.7" x2="2.1" y2="-0.7" stroke={hurdleColor} strokeWidth="0.26" strokeLinecap="round" />
            <line x1="-2.2" y1="-0.7" x2="2.2" y2="-0.7" stroke={hurdleColor} strokeWidth="0.34" strokeLinecap="round" />
            <line x1="-2.2" y1="-0.7" x2="2.2" y2="-0.7" stroke="#ffffff" strokeWidth="0.08" opacity="0.6" strokeLinecap="round" />
          </g>
        );

      // --- ESTACAS CON BASE DE GOMA ---
      case 'pole':
        const poleColor = itemColor || '#facc15';
        return (
          <g>
            <line x1="0" y1="0" x2="2.6" y2="2.6" stroke="#000000" strokeWidth="0.26" strokeLinecap="round" opacity="0.28" />
            <circle cx="0" cy="0" r="0.9" fill="#1e293b" stroke="#0f172a" strokeWidth="0.1" />
            <circle cx="0" cy="0" r="0.55" fill="#334155" />
            <line x1="0" y1="0" x2="-0.8" y2="-3.2" stroke={poleColor} strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="-0.8" cy="-3.2" r="0.25" fill="#1e293b" />
          </g>
        );

      // --- CONOS CON BASE CUADRADA ---
      case 'cone':
        const coneCol = itemColor || '#ea580c';
        return (
          <g>
            <ellipse cx="0.2" cy="0.5" rx="1.3" ry="0.55" fill="#000000" opacity="0.28" />
            <rect x="-1.0" y="-0.4" width="2.0" height="1.4" rx="0.18" fill={coneCol} stroke="#9a3412" strokeWidth="0.08" />
            <path d="M -0.85,0.7 L 0,-1.3 L 0.85,0.7 Z" fill={coneCol} stroke="#c2410c" strokeWidth="0.08" strokeLinejoin="round" />
            <polygon points="-0.45,0.0 0.45,0.0 0.28,-0.55 -0.28,-0.55" fill="#ffffff" opacity="0.9" />
          </g>
        );

      // --- AROS DE COORDINACIÓN ---
      case 'hoop':
        const hoopCol = itemColor || '#3b82f6';
        return (
          <g>
            <ellipse cx="0.1" cy="0.2" rx="1.5" ry="0.75" fill="none" stroke="#000000" strokeWidth="0.18" opacity="0.22" />
            <ellipse cx="0" cy="0" rx="1.5" ry="0.75" fill="none" stroke={hoopCol} strokeWidth="0.24" />
          </g>
        );

      default:
        return (
          <circle cx="0" cy="0" r="1.0" fill={itemColor || '#facc15'} stroke="#ffffff" strokeWidth="0.15" />
        );
    }
  };

  return (
    <g
      transform={`translate(${obj.x}, ${obj.y}) rotate(${rot}) scale(${s})`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className="cursor-pointer select-none"
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
  if (/shoe|boot|cleat|sneaker|calzado|footwear/i.test(label)) return 'shoes';
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

  // Brazos relajados hacia abajo al torso
    addMod(bones.leftarm, new THREE.Euler(0, 0, -1.35));
    addMod(bones.rightarm, new THREE.Euler(0, 0, 1.35));
    addMod(bones.leftforearm, new THREE.Euler(0.2, 0, 0));
    addMod(bones.rightforearm, new THREE.Euler(0.2, 0, 0));

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
// ---------- Animaciones FBX de Mixamo: catálogo, acciones tácticas y caché global ----------
const FBX_ANIMATIONS = {
  arquero: {
    idle: '/animations/arquero/gk_idle_ready.fbx',
    aerial_catch: '/animations/arquero/gk_aerial_catch.fbx',
    aerial_save: '/animations/arquero/gk_aerial_save.fbx',
    body_block: '/animations/arquero/gk_body_block.fbx',
    diving_low: '/animations/arquero/gk_diving_low_save.fbx',
    goal_kick: '/animations/arquero/gk_goal_kick.fbx',
    punt_kick: '/animations/arquero/gk_punt_kick.fbx',
    scoop_catch: '/animations/arquero/gk_scoop_catch.fbx',
    short_pass: '/animations/arquero/gk_short_pass.fbx',
    overhand_throw: '/animations/arquero/gk_overhand_throw.fbx',
    underhand_throw: '/animations/arquero/gk_underhand_throw.fbx'
  },
  campo: {
    idle: '/campo/field_idle.fbx',
    jog: '/campo/field_jog_forward.fbx',
    sprint: '/campo/field_sprint.fbx',
    kick_pass: '/campo/field_kick_pass.fbx',
    shot_power: '/campo/field_shot_power.fbx',
    strike_motion: '/campo/field_strike_in_motion.fbx',
    header: '/campo/field_header_jump.fbx',
    defensive: '/campo/field_idle.fbx',
    throw_in: '/campo/field_throw_in.fbx'
  }
};

// Opciones del menú contextual flotante (la clave coincide con FBX_ANIMATIONS)
const GK_ACTION_LIST = [
  { key: 'idle', label: 'Atento', icon: '🧤' },
  { key: 'aerial_catch', label: 'Atrapada Aérea', icon: '🙌' },
  { key: 'aerial_save', label: 'Desvío Volador', icon: '🦅' },
  { key: 'body_block', label: 'Bloqueo', icon: '🛡️' },
  { key: 'diving_low', label: 'Caída Baja', icon: '🤸' },
  { key: 'goal_kick', label: 'Saque de Meta', icon: '🥅' },
  { key: 'punt_kick', label: 'Volea', icon: '🦶' },
  { key: 'scoop_catch', label: 'Atrapada Baja', icon: '🧺' },
  { key: 'short_pass', label: 'Pase Corto', icon: '➡️' },
  { key: 'overhand_throw', label: 'Saque Alto', icon: '💪' },
  { key: 'underhand_throw', label: 'Saque Bajo', icon: '🎳' }
];
const FIELD_ACTION_LIST = [
  { key: 'defensive', label: 'Postura Base', icon: '🧍' },
  { key: 'jog', label: 'Trote', icon: '🏃' },
  { key: 'sprint', label: 'Sprint', icon: '⚡' },
  { key: 'kick_pass', label: 'Pase', icon: '➡️' },
  { key: 'shot_power', label: 'Remate Potente', icon: '🚀' },
  { key: 'strike_motion', label: 'Disparo en Carrera', icon: '🎯' },
  { key: 'header', label: 'Cabezazo', icon: '⬆️' },
  { key: 'throw_in', label: 'Saque Lateral', icon: '🙆' }
];

// Poses que se mantienen en bucle; el resto son acciones puntuales que vuelven solas a la postura base
const FBX_LOOPING = new Set(['idle', 'defensive', 'jog', 'sprint']);

// Acciones que despachan el balón: distancia (m), altura máxima de la parábola (m), instante del contacto (ms),
// duración del vuelo (ms) y altura inicial del balón si sale de las manos (hold)
const BALL_NEAR_M = 4.5; // el balón se considera "asignado" al jugador si está a esta distancia o menos
const BALL_ACTIONS = {
  kick_pass: { dist: 16, arc: 0.3, delay: 460, dur: 950 },
  short_pass: { dist: 9, arc: 0, delay: 420, dur: 800 },
  shot_power: { dist: 30, arc: 1.1, delay: 520, dur: 900 },
  strike_motion: { dist: 24, arc: 0.8, delay: 480, dur: 880 },
  goal_kick: { dist: 40, arc: 7, delay: 650, dur: 1900 },
  punt_kick: { dist: 38, arc: 10, delay: 720, dur: 2000 },
  overhand_throw: { dist: 30, arc: 4.5, delay: 620, dur: 1400, hold: 2.1 },
  underhand_throw: { dist: 14, arc: 0.8, delay: 520, dur: 950, hold: 0.9 },
  throw_in: { dist: 14, arc: 3.2, delay: 650, dur: 1250, hold: 2.1 },
  header: { dist: 9, arc: 0.9, delay: 620, dur: 900, hold: 1.8 }
};

// Misma regla que usa GLBPlayer para decidir si un jugador es arquero
function playerGoalkeeper(o) {
  if (!o) return false;
  const r = String(o.role || '').toUpperCase();
  return r === 'GK' || r === 'POR' || o.team === 'gk' || o.team === 'gk_away' || parseInt(o.number, 10) === 1;
}
const playerIsGoalkeeper = playerGoalkeeper;
// Medidas del esqueleto del clon en reposo (se calculan antes de aplicar cualquier postura o clip)
const _cloneRigCache = new WeakMap();
function fbxLegLength(root) {
  const b = {};
  root.traverse((o) => {
    if (o.isBone || o.type === 'Bone') {
      const k = glbBoneKey(o.name);
      if (k && !b[k]) b[k] = o;
    }
  });
  if (!b.leftleg || !b.leftfoot) return 0;
  const up = b.leftupleg ? b.leftupleg.position.length() : 0;
  return up + b.leftleg.position.length() + b.leftfoot.position.length();
}
function getCloneRig(root) {
  if (_cloneRigCache.has(root)) return _cloneRigCache.get(root);
  const bones = {};
  root.traverse((o) => {
    if (o.isBone) {
      const k = glbBoneKey(o.name);
      if (k && !bones[k]) bones[k] = o;
    }
  });
  const rig = {
    bones,
    restHips: bones.hips ? bones.hips.position.clone() : new THREE.Vector3(),
    legLen: fbxLegLength(root)
  };
  _cloneRigCache.set(root, rig);
  return rig;
}

// Caché en memoria: cada archivo .fbx se descarga UNA sola vez por sesión, aunque haya 22 jugadores pidiéndolo a la vez
const _fbxClipCache = new Map();
const _fbxLoader = new FBXLoader();

function loadFbxClip(url) {
  if (_fbxClipCache.has(url)) return _fbxClipCache.get(url);
  const promise = new Promise((resolve) => {
    _fbxLoader.load(
      url,
      (fbx) => {
        try {
          const clip = fbx.animations && fbx.animations.length > 0 ? fbx.animations[0] : null;
          if (clip) {
            clip.__legLen = fbxLegLength(fbx); // proporción del esqueleto Mixamo original (para escalar la altura de la cadera)
            resolve(clip);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      },
      undefined,
      (err) => {
        console.warn(`[Andez FBX] No se pudo cargar: ${url}`, err);
        resolve(null);
      }
    );
  });
  _fbxClipCache.set(url, promise);
  // Un fallo puntual no queda "pegado": en la próxima petición se vuelve a intentar
  promise.then((clip) => { if (!clip) _fbxClipCache.delete(url); });
  return promise;
}

// Descarga ordenada (de a un clip) de las acciones de un rol, para que el menú responda al instante
const _fbxPrefetched = new Set();
function prefetchFbxCategory(cat) {
  if (_fbxPrefetched.has(cat) || !FBX_ANIMATIONS[cat]) return;
  _fbxPrefetched.add(cat);
  const urls = [...new Set(Object.values(FBX_ANIMATIONS[cat]))];
  let i = 0;
  const next = () => {
    if (i >= urls.length) return;
    loadFbxClip(urls[i++]).then(() => setTimeout(next, 120));
  };
  next();
}

// Prepara un clip Mixamo para el esqueleto del GLB:
//  - reasigna los nombres de huesos (mixamorig:Hips / mixamorigHips / Hips)
//  - descarta pistas de escala y de traslación que no sean la de la cadera
//  - escala la altura de la cadera a las proporciones del GLB (cm -> m, piernas más largas o cortas)
//  - ANULA el root motion: Hips.position en X y Z queda fija (el jugador no se desliza ni se repliega de su coordenada táctica),
//    conservando la rotación y la altura natural en Y
const _fbxPlayableCache = new Map();
function getPlayableFbxClip(raw, url, clone) {
  if (!raw || !raw.tracks || !clone) return null;

  // Busca las caderas y mapa de huesos directamente en el modelo
  let hips = null;
  const boneMap = new Map();
  clone.traverse((o) => {
    if (o.isBone) {
      const lower = o.name.toLowerCase();
      boneMap.set(lower, o);
      boneMap.set(lower.replace(/^mixamorig:?/, ''), o);
      if (!hips && lower.includes('hips')) {
        hips = o;
      }
    }
  });

  if (!hips) return null;

  const sig = `v_perfect_ground_${url}|${hips.name}`;
  if (_fbxPlayableCache.has(sig)) return _fbxPlayableCache.get(sig);

  const out = [];
  raw.tracks.forEach((t) => {
    const parts = t.name.split('.');
    const prop = parts.pop();
    const rawBone = parts.join('.');
    const clean = rawBone.toLowerCase().replace(/^mixamorig:?/, '');
    const bone = boneMap.get(clean) || boneMap.get(rawBone.toLowerCase()) || (clean.includes('hips') ? hips : null);

    if (!bone) return;

    if (prop === 'quaternion') {
      out.push(new THREE.QuaternionKeyframeTrack(`${bone.name}.${prop}`, t.times.slice(), t.values.slice()));
    } else if (prop === 'position') {
      const isHipsTrack = clean.includes('hips') || t.name.toLowerCase().includes('hips');
      if (isHipsTrack) {
        const v = t.values.slice();
        for (let i = 0; i < v.length; i += 3) {
          v[i] = 0;     // Sin deriva lateral (X = 0)
          // Mantiene v[i + 1] intacto para que las piernas no se entierren
          v[i + 2] = 0; // Sin avance frontal (Z = 0)
        }
        out.push(new THREE.VectorKeyframeTrack(`${bone.name}.${prop}`, t.times.slice(), v));
      }
    }
  });

  if (out.length === 0) {
    _fbxPlayableCache.set(sig, null);
    return null;
  }

  const clip = new THREE.AnimationClip(`andez-${url.split('/').pop()}`, -1, out);
  _fbxPlayableCache.set(sig, clip);
  return clip;
}

// Entorno de iluminación procedural (sin descargas) para que piel, ojos, tela y botines reaccionen a la luz como materiales PBR reales
const _playerEnvCache = new WeakMap();
function getPlayerEnvMap(gl) {
  if (!gl) return null;
  if (_playerEnvCache.has(gl)) return _playerEnvCache.get(gl);
  let tex = null;
  try {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    tex = pmrem.fromScene(room, 0.04).texture;
    pmrem.dispose();
  } catch (e) {
    tex = null;
  }
  _playerEnvCache.set(gl, tex);
  return tex;
}
const GLB_ENV_INTENSITY = { shirt: 0.22, shorts: 0.18, hair: 0.1, eye: 1.0, skin: 0.4, shoes: 0.45 };
const GLB_SHOE_COLORS = ['#0b0f19', '#f8fafc', '#1e293b', '#16a34a', '#f97316'];

function GLBPlayer({ color, number, isSelected, onClick, facing = 0, role, animation, animNonce = 0 }) {
  const { scene } = useGLTF(GLB_URL, DRACO_URL);
  const gl = useThree((state) => state.gl);

  // Clonación limpia del esqueleto (las medidas de reposo se guardan antes de aplicar posturas o clips)
  const clone = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    getCloneRig(c);
    return c;
  }, [scene]);

  // Un mixer por instancia; se actualiza UNA sola vez por frame (más abajo)
  const mixer = useMemo(() => new THREE.AnimationMixer(clone), [clone]);

  const norm = useMemo(() => getGlbNormalization(scene), [scene]);
  const kit = useMemo(() => getGlbKitInfo(scene), [scene]);
  const envMap = useMemo(() => getPlayerEnvMap(gl), [gl]);

  const n = parseInt(number, 10) || 0;
  const isGK = role === 'GK' || n === 1;
  const jerseyColor = color || '#2563eb';
  const teamSeed = useMemo(() => glbHashStr(jerseyColor), [jerseyColor]);
  const seed = useMemo(() => glbHashStr(`${jerseyColor}|${number}`), [jerseyColor, number]);

  // Contextura física según rol táctico
  const customScale = useMemo(() => {
    const p = glbBodyProfile(role, n, seed);
    const base = norm.scale * 3.8;
    return [base * p.w, base * p.h, base * p.w];
  }, [norm.scale, role, n, seed]);

  // Postura atlética de respaldo: el jugador nunca se ve en T-pose mientras llegan los FBX (o si alguno no existe)
  useLayoutEffect(() => {
    return () => {};
  }, []);

  // Enlace y transición cruzada: obj.animation -> clip FBX (fadeIn 0.25 / fadeOut 0.2). Las acciones puntuales vuelven solas a la postura base
  const playState = useRef({ action: null, key: null, token: 0 });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const cat = isGK ? FBX_ANIMATIONS.arquero : FBX_ANIMATIONS.campo;
    const st = playState.current;

    const play = (reqKey, fade) => {
          const key = cat[reqKey] ? reqKey : 'idle';
        const url = cat[key] || cat[Object.keys(cat)[0]];
      if (!url) return;
      const token = ++st.token;
      loadFbxClip(url).then((raw) => {
        if (!alive || token !== st.token || !raw) return;
        const clip = getPlayableFbxClip(raw, url, clone);
          if (!clip) return;

          // Si es la postura base de campo, neutralizamos los tracks de posición para que no se desplace lateralmente
          if (!isGK && key === 'defensive') {
            clip.tracks = clip.tracks.filter(t => !t.name.endsWith('.position'));
          }
        const looping = false;
        const next = mixer.clipAction(clip, clone);
        const prev = st.action;
        next.reset();
        next.setLoop(looping ? THREE.LoopRepeat : THREE.LoopOnce, looping ? Infinity : 1);
        next.clampWhenFinished = true;
        next.enabled = true;
        next.setEffectiveTimeScale(1);
        next.setEffectiveWeight(1);
        // Desfase en las poses en bucle para que los 22 jugadores no respiren al unísono
        if (looping && !prev) next.time = ((seed % 997) / 997) * clip.duration;
        if (prev && prev !== next) prev.fadeOut(0.2);
        if (!prev) next.play(); else next.fadeIn(prev === next ? 0.05 : fade).play();
        if (key === 'sprint' || key === 'trote' || key === 'jog') {
          next.time = 0.25;
          next.paused = true;
        }
        setReady(true);
        st.action = next;
        st.key = key;
      });
    };

    const onFinished = (e) => {
      // Si es trote o sprint, no vuelve a base: se queda congelado en la pose
      if (st.key === 'jog' || st.key === 'sprint' || st.key === 'trote') {
        return;
      }
      if (e.action === st.action) {
        play(cat['base'] ? 'base' : (cat['idle'] ? 'idle' : Object.keys(cat)[0]), 0.3);
      }
    };

    mixer.addEventListener('finished', onFinished);

    const defaultStance = cat['base'] ? 'base' : (cat['idle'] ? 'idle' : Object.keys(cat)[0]);
const wanted = (animation && cat[animation]) ? animation : defaultStance;
play(wanted, 0.25);

    return () => {
      alive = false;
      mixer.removeEventListener('finished', onFinished);
    };
  }, [mixer, clone, isGK, animation, animNonce, seed]);

  // Limpieza al desmontar el jugador
  useEffect(() => {
    const st = playState.current;
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(clone);
      st.action = null;
      st.key = null;
    };
  }, [mixer, clone]);

  // Actualización única por frame (con tope de delta para evitar saltos al volver a la pestaña)
  useFrame((_, delta) => {
    mixer.update(Math.min(delta, 0.05));
  });

  // Materiales PBR, dorsales y render de equipación
  useLayoutEffect(() => {
    const owned = [];
    const skinColor = PLAYER_SKINS[(n * 3 + (teamSeed % PLAYER_SKINS.length)) % PLAYER_SKINS.length];
    const hairColor = PLAYER_HAIRS[(n * 5 + 3 + ((teamSeed >>> 3) % PLAYER_HAIRS.length)) % PLAYER_HAIRS.length];
    const shoeColor = GLB_SHOE_COLORS[(n * 7 + (teamSeed % 5)) % GLB_SHOE_COLORS.length];
    const lightKit = playerHexLuma(jerseyColor) > 0.78;

    if (!_glbNamesLogged) {
      _glbNamesLogged = true;
      console.info('[player.glb] partes detectadas:', kit.names.join(' · '));
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
        const label = glbPartLabel(child, mat);
        const kind = glbClassify(label);

        if (kind === 'shirt') {
          mat.roughness = 0.7;
          mat.metalness = 0.02;
          if (kit.ok) {
            const jt = getGlbJerseyTexture(jerseyColor, number, kit.shirt);
            mat.map = null;
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
          mat.metalness = 0;
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
          mat.metalness = 0;
        } else if (kind === 'eye') {
          if (/lash|pesta/.test(label)) {
            if (mat.color) mat.color.set('#0b0b0d');
            mat.roughness = 0.9;
            mat.metalness = 0;
          } else {
            if (mat.color) mat.color.set('#f8fafc');
            mat.roughness = 0.1;
            mat.metalness = 0.05;
          }
        } else if (kind === 'shoes') {
          glbTintTowards(mat, shoeColor, 0.25, 3);
          mat.roughness = 0.55;
          mat.metalness = 0.08;
        } else if (kind === 'skin') {
          glbTintTowards(mat, skinColor);
          mat.roughness = 0.65;
          mat.metalness = 0.05;
        }
        if (envMap) {
          mat.envMap = envMap;
          mat.envMapIntensity = GLB_ENV_INTENSITY[kind] ?? 0.2;
        }
        mat.needsUpdate = true;
        return mat;
      });
      child.material = Array.isArray(src) ? next : next[0];
    });

    return () => owned.forEach((m) => m.dispose());
  }, [clone, kit, jerseyColor, number, n, teamSeed, envMap]);

  const footY = -norm.minY * customScale[1];

  return (
    <group dispose={null} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
      <PlayerGroundMarks isSelected={isSelected} />
      <group rotation={[0, facing + Math.PI / 2, 0]}>
        <primitive
          object={clone}visible={ready}
          position={[0, footY, 0]}
          scale={customScale}
          
        />
        
      </group>
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
      {/* --- MANIQUÍ ESTILO TACTICALPAD 3D (SILUETA SÓLIDA CON COSTILLAS Y SOPORTE POSTERIOR) --- */}
          {obj.type === 'dummy' && (
            <group>
              {/* Sombra de contacto suave en césped */}
              <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ellipseCurve args={[0, 0, 0.5, 0.22, 0, 2 * Math.PI, false, 0]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.35} />
              </mesh>

              {/* Base / Picas clavadas al césped */}
              {[-0.24, 0.24].map((px) => (
                <group key={px}>
                  <mesh position={[px, 0.35, 0]} castShadow>
                    <cylinderGeometry args={[0.02, 0.02, 0.7, 12]} />
                    <meshStandardMaterial color="#ca8a04" metalness={0.4} roughness={0.3} />
                  </mesh>
                  <mesh position={[px, 0.03, 0]}>
                    <cylinderGeometry args={[0.016, 0.005, 0.07, 8]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.8} />
                  </mesh>
                </group>
              ))}

              {/* Barra transversal estabilizadora */}
              <mesh position={[0, 0.38, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.018, 0.018, 0.52, 12]} />
                <meshStandardMaterial color="#ca8a04" roughness={0.3} />
              </mesh>

              {/* Soporte triangular trasero antivuelco (como en las capturas de TacticalPad) */}
              <mesh position={[0, 0.45, -0.22]} rotation={[Math.PI / 4.8, 0, 0]} castShadow>
                <cylinderGeometry args={[0.016, 0.016, 0.85, 10]} />
                <meshStandardMaterial color="#eab308" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.03, -0.48]}>
                <boxGeometry args={[0.18, 0.04, 0.08]} />
                <meshStandardMaterial color="#1e293b" roughness={0.6} />
              </mesh>

              {/* Cuerpo / Silueta anatómica troquelada */}
              {/* Caderas y cintura estrecha */}
              <mesh position={[0, 0.82, 0]} castShadow>
                <boxGeometry args={[0.44, 0.22, 0.04]} />
                <meshStandardMaterial color="#eab308" roughness={0.25} />
              </mesh>

              {/* Torso con ranuras anatómicas caladas */}
              <mesh position={[0, 1.22, 0]} castShadow>
                <boxGeometry args={[0.56, 0.58, 0.04]} />
                <meshStandardMaterial color="#eab308" roughness={0.25} />
              </mesh>
              {/* Costillas / Ranuras interiores oscurecidas */}
              {[-0.14, 0, 0.14].map((rx) => (
                <mesh key={rx} position={[rx, 1.22, 0.002]}>
                  <boxGeometry args={[0.065, 0.44, 0.045]} />
                  <meshStandardMaterial color="#854d0e" roughness={0.8} />
                </mesh>
              ))}

              {/* Hombros con silueta anatómica caída */}
              <mesh position={[0, 1.56, 0]} castShadow>
                <boxGeometry args={[0.52, 0.12, 0.04]} />
                <meshStandardMaterial color="#eab308" roughness={0.25} />
              </mesh>

              {/* Cuello */}
              <mesh position={[0, 1.68, 0]} castShadow>
                <cylinderGeometry args={[0.055, 0.06, 0.12, 14]} />
                <meshStandardMaterial color="#ca8a04" roughness={0.3} />
              </mesh>

              {/* Cabeza anatómica con centro calado */}
              <mesh position={[0, 1.88, 0]} castShadow>
                <cylinderGeometry args={[0.16, 0.14, 0.26, 18]} />
                <meshStandardMaterial color="#eab308" roughness={0.25} />
              </mesh>
              <mesh position={[0, 1.88, 0.002]}>
                <cylinderGeometry args={[0.07, 0.07, 0.27, 14]} />
                <meshStandardMaterial color="#854d0e" roughness={0.8} />
              </mesh>
            </group>
          )}

          {/* --- MINI PORTERÍA ISOMÉTRICA CON RED CUADRICULADA REAL (24x12) --- */}
          {obj.type === 'mini_goal' && (
            <group>
              {/* Sombra de suelo */}
              <mesh position={[0, 0.01, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[2.5, 0.9]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.25} />
              </mesh>

              {/* Marco tubular frontal blanco */}
              {[-1.15, 1.15].map((side) => (
                <group key={side}>
                  <mesh position={[side, 0.5, 0]} castShadow>
                    <cylinderGeometry args={[0.035, 0.035, 1.0, 16]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.2} />
                  </mesh>
                  {/* Tirante diagonal hacia atrás */}
                  <mesh position={[side, 0.5, -0.38]} rotation={[Math.PI / 4.2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.022, 0.022, 1.15, 12]} />
                    <meshStandardMaterial color="#cbd5e1" roughness={0.3} />
                  </mesh>
                  {/* Barra de suelo lateral */}
                  <mesh position={[side, 0.03, -0.38]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.022, 0.022, 0.76, 12]} />
                    <meshStandardMaterial color="#94a3b8" roughness={0.4} />
                  </mesh>
                </group>
              ))}

              {/* Travesaño frontal superior */}
              <mesh position={[0, 1.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 2.34, 16]} />
                <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.2} />
              </mesh>

              {/* Barra de suelo trasera */}
              <mesh position={[0, 0.03, -0.76]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.022, 0.022, 2.32, 12]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.4} />
              </mesh>

              {/* RED REAL: Malla de alambre translúcida (sin lona blanca sólida) */}
              <mesh position={[0, 0.52, -0.38]} rotation={[Math.PI / 4.2, 0, 0]}>
                <planeGeometry args={[2.3, 1.15, 26, 13]} />
                <meshBasicMaterial color="#ffffff" wireframe={true} transparent opacity={0.6}fog={false} />
              </mesh>
              {/* Redes laterales */}
              {[-1.15, 1.15].map((side) => (
                <mesh key={side} position={[side, 0.48, -0.38]} rotation={[0, Math.PI / 2, 0]}>
                  <planeGeometry args={[0.76, 0.95, 8, 10]} />
                  <meshBasicMaterial color="#ffffff" wireframe={true} transparent opacity={0.4}fog={false} />
                </mesh>
              ))}
            </group>
          )}
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

function Scene3D({ objects, setObjects, drawings, textBlocks, selectedObj, setSelectedObj, teamColors, cameraLocked, recordHistory, isPC, onDragStart }) {
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
        x: (52.5 - obj.y),
        z: (obj.x - 34)
      };
  };
  const handlePointerDown = (e, obj) => {
    if (!cameraLocked) return;
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    if (onDragStart) onDragStart(obj);
    setSelectedObj(obj);
    dragId.current = obj.id;
    isDragging.current = true;
    setActiveDragId(obj.id);

    mathPlane.set(new THREE.Vector3(0, 1, 0), 0);

    const currentWorld = toWorld(obj);
    const cX = currentWorld?.x ?? 0;
    const cZ = currentWorld?.z ?? 0;

    if (e.ray && e.ray.intersectPlane(mathPlane, planeIntersect)) {
      dragOffset.current.set(
        planeIntersect.x - cX,
        0,
        planeIntersect.z - cZ
      );
    } else {
      dragOffset.current.set(0, 0, 0);
    }

    if (e.target && e.target.setPointerCapture && e.pointerId !== undefined) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current || !dragId.current) return;
    e.stopPropagation();

    if (e.ray && e.ray.intersectPlane(mathPlane, planeIntersect)) {
      const targetX = planeIntersect.x - dragOffset.current.x;
      const targetZ = planeIntersect.z - dragOffset.current.z;

      let newFieldX, newFieldY;
      if (isPC) {
        newFieldX = targetX + 52.5;
        newFieldY = targetZ + 34;
      } else {
        newFieldY = 52.5 - targetX;
        newFieldX = targetZ + 34;
      }

      setObjects((prev) =>
        prev.map((item) => {
          if (item.id !== dragId.current) return item;

          const currentW = toWorld(item);
          const dx = targetX - (currentW?.x ?? 0);
          const dz = targetZ - (currentW?.z ?? 0);

          let newRotY = item.rotationY || 0;
          if (dx * dx + dz * dz > 0.005) {
            newRotY = Math.atan2(-dz, dx);
          }

          return {
            ...item,
            x: newFieldX,
            y: newFieldY,
            rotationY: newRotY
          };
        })
      );
    }
  };

  const handlePointerUp = (e) => {
    if (isDragging.current) {
      isDragging.current = false;
      dragId.current = null;
      setActiveDragId(null);
      if (recordHistory) recordHistory(objects);
      if (e?.target?.releasePointerCapture && e?.pointerId !== undefined) {
        try {
          e.target.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
    }
  };

  // En móvil usamos una perspectiva diagonal para conservar el volumen 3D y
  // encuadrar la cancha con sus dos porterías. Se mantiene el eje vertical natural de Three.js.
  // Cámara cercana de ángulo bajo estilo TacticalPad
  const camPos = isPC ? [0, 23, 64] : [0, 26, 72];
  const camFov = isPC ? 47 : 52;

  return (
    <>
      <PerspectiveCamera makeDefault position={camPos} fov={camFov} up={[0, 1, 0]} />
      <OrbitControls
        enabled={!cameraLocked}
        target={[0, 4, 0]}
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
        shadow-mapSize-width={isPC ? 4096 : 2048}
        shadow-mapSize-height={isPC ? 4096 : 2048}
        shadow-camera-left={-64}
        shadow-camera-right={64}
        shadow-camera-top={64}
        shadow-camera-bottom={-64}
        shadow-camera-near={5}
        shadow-camera-far={140}
        shadow-bias={-0.0002}
        shadow-normalBias={0.03}
      />
      <directionalLight position={[-20, 24, -20]} intensity={0.45} color="#e0f2fe" />

      {/* Cancha 3D en coordenadas nativas, sin rotación CSS del viewport. */}
      <Pitch3D />
      <StadiumEnvironment />

      {/* Malla receptora de interacción táctil y mouse con rango amplio */}
      {/* Malla receptora de interacción táctil y mouse con rango amplio */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        onPointerDown={(e) => {
          if (window.__onPickFlightTarget && e.point) {
            e.stopPropagation();
            window.__onPickFlightTarget(e.point);
          } else if (cameraLocked) {
            // Si hace clic en el pasto sin tocar ficha, limpia la selección
            setSelectedObj(null);
          
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
        const onDown = (e) => {
    e.stopPropagation();
    if (!cameraLocked) return;
    setSelectedObj(obj);
    dragId.current = obj.id;
    isDragging.current = true;
    setActiveDragId(obj.id);
  };

        if (obj.type === 'player') {
  const col = obj.customColor || (
    obj.role === 'GK'
      ? (obj.team === 'red' || obj.team === 'gk_away' ? teamColors.gk_away : teamColors.gk)
      : (obj.team === 'blue' ? teamColors.blue : teamColors.red)
  );

  // Rotación unificada para PC, Tablet y Móvil (Azul izquierda -> derecha, Rojo derecha -> izquierda)
        const isBlueSide = (obj.team === 'blue' || obj.team === 'gk');
        const baseRot = isBlueSide ? 0 : Math.PI;
        const finalRotY = (obj.rotationY !== undefined && obj.rotationY !== 0) ? obj.rotationY : baseRot;
        
  return (
    <group
      key={obj.id}
      position={[pos?.x ?? pos?.[0] ?? 0, 0, pos?.z ?? pos?.[2] ?? 0]}
      rotation={[0, finalRotY, 0]}
      onPointerDown={onDown}
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
                role={(obj.role === 'GK' || obj.role === 'POR' || obj.team === 'gk' || obj.team === 'gk_away') ? 'GK' : obj.role}
                animation={obj.animation}
                animNonce={obj.animNonce}
                isSelected={selectedObj?.id === obj.id}
                onClick={() => setSelectedObj(obj)}
              />
            </group>
          );
        }
        if (obj.type === 'ball') {
        const bx = pos?.x ?? pos?.[0] ?? 0;
        const bz = pos?.z ?? pos?.[2] ?? 0;
        const by = Math.max(0.24, Number(obj?.elevation || obj?.altitude || 0.24));

        return (
          <group
            key={obj.id}
            position={[bx, by, bz]}
            onPointerDown={onDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Hitbox para arrastrar */}
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[1.2, 1.2, 1.8, 12]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Balón 3D visible garantizado */}
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.35, 24, 24]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
            </mesh>
            <mesh position={[0, 0, 0.22]}>
              <sphereGeometry args={[0.15, 12, 12]} />
              <meshStandardMaterial color="#111111" roughness={0.5} />
            </mesh>
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

// ---------- Menú contextual flotante de acciones del jugador 3D (PC y móvil) ----------
// ---------- Menú contextual flotante de acciones del jugador 3D (Dock lateral derecho) ----------
function PlayerActionBar({ player, onAction, onClose }) {
  const gk = playerIsGoalkeeper(player);
  const list = gk ? GK_ACTION_LIST : FIELD_ACTION_LIST;
  const active = player.animation && player.animation !== 'idle' ? player.animation : (gk ? 'idle' : 'defensive');

  useEffect(() => { 
    prefetchFbxCategory(gk ? 'arquero' : 'campo'); 
  }, [gk]);

  return (
    <div
      className="pointer-events-none no-print fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 bg-zinc-900/90 backdrop-blur-md p-3 rounded-2xl border border-zinc-700/60 shadow-2xl max-h-[85vh] overflow-y-auto"
      style={{ width: '160px' }}
    >
      <div className="pointer-events-auto flex items-center justify-between pb-2 border-b border-zinc-800">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
          {gk ? 'Arquero' : 'Jugador'} #{player.number}
        </span>
        <button 
          type="button" 
          onClick={onClose} 
          className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          aria-label="Cerrar menú"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="pointer-events-auto flex flex-col gap-1.5 pt-1">
        {list.map((act) => {
          const isSelected = active === act.key;
          return (
            <button
              key={act.key}
              type="button"
              onClick={() => onAction(act.key)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all ${
                isSelected
                  ? 'bg-amber-500 text-black font-bold shadow-md'
                  : 'bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 active:scale-95'
              }`}
            >
              <span>{act.icon}</span>
              <span className="truncate">{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  // PUNTO 6: ESTADO Y CONTROL DE SECUENCIA CÍCLICA EN BUCLE
  const [isLoopPlaying, setIsLoopPlaying] = useState(false);
  const loopIntervalRef = useRef(null);
  const initialPositionsRef = useRef(null);
  const [isPC, setIsPC] = useState(true);
  const [viewMode, setViewMode] = useState('2d');
  const [cameraLocked, setCameraLocked] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsPC(true);
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
  const [clubLogo, setClubLogo] = useState(() => localStorage.getItem('andez_club_logo') || null);


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

  const [objects, setObjects] = useState([]);

  const [drawings, setDrawings] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  const [history, setHistory] = useState([objects]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const svgRef = useRef(null);
  const isDraggingRef = useRef(false);
  const lastPlayerTapRef = useRef({ id: null, time: 0 });
  const [selectedObj, setSelectedObj] = useState(null);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [bottomBarMode, setBottomBarMode] = useState('menu');
  const [rosterTeam, setRosterTeam] = useState('blue');
  const [showSystemsModal, setShowSystemsModal] = useState(null);
  const [frames, setFrames] = useState([
    { id: 1, name: 'Marco 1', objects: [], drawings: [] }
  ]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);

  const handleAddFrame = () => {
    const currentObjs = JSON.parse(JSON.stringify(objects));
    const nextIdx = frames.length;
    setFrames(prev => [
      ...prev,
      { id: Date.now(), name: `Marco \${nextIdx + 1}`, objects: currentObjs, drawings: [] }
    ]);
    setActiveFrameIndex(nextIdx);
  };

  const handleDeleteFrame = (idx) => {
    if (frames.length <= 1) return;
    setFrames(prev => prev.filter((_, i) => i !== idx));
    setActiveFrameIndex(prev => Math.max(0, prev - 1));
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
      downloadLink.download = `pizarra-${drillTitle.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URLObject.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };
  // PUNTO 6: MOTOR DE SECUENCIA TÁCTICA INTELIGENTE (BASE ESTABLE 2 Y 3 JUGADORES PC/MÓVIL)
  const animFlightRef = useRef(null);
  const exerciseModeRef = useRef('piso');
  const currentObjectsRef = useRef(objects);
  currentObjectsRef.current = objects;

  const stopLoopSequence = () => {
    setIsLoopPlaying(false);
    if (loopIntervalRef.current) {
      clearTimeout(loopIntervalRef.current);
      loopIntervalRef.current = null;
    }
    if (animFlightRef.current) {
      clearInterval(animFlightRef.current);
      animFlightRef.current = null;
    }
  };

  const toggleLoopSequence = () => {
    if (isLoopPlaying) {
      stopLoopSequence();
      return;
    }

    const currentBall = currentObjectsRef.current.find((o) => o.type === 'ball');
    const currentPlayers = currentObjectsRef.current.filter((o) => o.type === 'player');

    if (!currentBall || currentPlayers.length < 2) {
      alert('Se requieren al menos 2 jugadores y 1 balón en la cancha para ejecutar la secuencia.');
      return;
    }

    // Fijar el modo de juego según la selección previa
    const initialElev = Number(currentBall.elevation || 0);
    if (Math.abs(initialElev - 1.8) < 0.3 || Math.abs(initialElev - 1.76) < 0.3) {
      exerciseModeRef.current = 'cabeza';
    } else if (initialElev >= 2.4) {
      exerciseModeRef.current = 'aereo';
    } else {
      exerciseModeRef.current = 'piso';
    }

    setIsLoopPlaying(true);

    // Pasador inicial: el más cercano a la pelota
    let passer = currentPlayers.reduce((prev, curr) => {
      const dPrev = Math.hypot(prev.x - currentBall.x, prev.y - currentBall.y);
      const dCurr = Math.hypot(curr.x - currentBall.x, curr.y - currentBall.y);
      return dCurr < dPrev ? curr : prev;
    }, currentPlayers[0]);

    const executePass = () => {
      if (animFlightRef.current) {
        clearInterval(animFlightRef.current);
        animFlightRef.current = null;
      }

      const freshObjs = currentObjectsRef.current;
      const ball = freshObjs.find((o) => o.type === 'ball');
      const players = freshObjs.filter((o) => o.type === 'player');

      if (!ball || players.length < 2) {
        stopLoopSequence();
        return;
      }

      const currentPasser = players.find((p) => p.id === passer.id) || players[0];
      const candidateReceivers = players.filter((p) => p.id !== currentPasser.id);

      if (candidateReceivers.length === 0) {
        stopLoopSequence();
        return;
      }

      // La orientación exacta que ya te funcionó en PC y móvil
      const rot = currentPasser.rotationY || 0;
      const dirX = isPC ? Math.sin(rot) : -Math.cos(rot);
      const dirY = isPC ? Math.cos(rot) : Math.sin(rot);

      let bestReceiver = candidateReceivers[0];
      let bestDot = -Infinity;

      candidateReceivers.forEach((p) => {
        const dx = p.x - currentPasser.x;
        const dy = p.y - currentPasser.y;
        const dist = Math.hypot(dx, dy) || 1;
        const dot = (dx / dist) * dirX + (dy / dist) * dirY;
        if (dot > bestDot) {
          bestDot = dot;
          bestReceiver = p;
        }
      });

      const startX = ball.x;
      const startY = ball.y;
      const targetX = bestReceiver.x;
      const targetY = bestReceiver.y;

      const mode = exerciseModeRef.current;
      const headHeight = 1.76;
      let t = 0;

      animFlightRef.current = setInterval(() => {
        t += 0.03;
        if (t >= 1) {
          clearInterval(animFlightRef.current);
          animFlightRef.current = null;

          // Llegada al receptor
          const arrivalElevation = mode === 'cabeza' ? headHeight : 0;

          setObjects((stepObjs) =>
            stepObjs.map((o) =>
              o.type === 'ball'
                ? {
                    ...o,
                    x: targetX,
                    y: targetY,
                    elevation: arrivalElevation,
                    altitude: arrivalElevation,
                    animProgress: undefined
                  }
                : o
            )
          );

          // El receptor toma el balón y es el siguiente pasador
          passer = bestReceiver;
          loopIntervalRef.current = setTimeout(executePass, 550);
        } else {
          const curX = startX + (targetX - startX) * t;
          const curY = startY + (targetY - startY) * t;

          let elevVal = 0;

          if (mode === 'cabeza') {
            elevVal = headHeight + 0.18 * (4 * t * (1 - t));
          } else if (mode === 'aereo') {
            elevVal = 2.8 * (4 * t * (1 - t));
          } else {
            elevVal = 0;
          }

          setObjects((stepObjs) =>
            stepObjs.map((o) =>
              o.type === 'ball'
                ? {
                    ...o,
                    x: curX,
                    y: curY,
                    elevation: elevVal,
                    altitude: elevVal,
                    animProgress: undefined
                  }
                : o
            )
          );
        }
      }, 16);
    };

    loopIntervalRef.current = setTimeout(executePass, 200);
  };
  // ---------- ACCIONES TÁCTICAS DEL JUGADOR 3D: animación Mixamo + cinemática jugador-balón ----------
  const actionFxRef = useRef({ raf: null, runRaf: null, timers: [] });
  const cancelPlayerFx = () => {
    const fx = actionFxRef.current;
    if (fx.raf) { cancelAnimationFrame(fx.raf); fx.raf = null; }
    if (fx.runRaf) { cancelAnimationFrame(fx.runRaf); fx.runRaf = null; }
    fx.timers.forEach((t) => clearTimeout(t));
    fx.timers = [];
  };
  useEffect(() => () => cancelPlayerFx(), []);

  // Dirección a la que apunta el jugador, en coordenadas 2D (misma convención que la secuencia de pases)
  const facingDir2D = (rot) => ({
    dx: isPC ? Math.sin(rot) : -Math.cos(rot),
    dy: isPC ? Math.cos(rot) : Math.sin(rot)
  });
  const clampPitch = (x, y) => ({
    x: Math.max(1, Math.min(isPC ? 104 : 67, x)),
    y: Math.max(1, Math.min(isPC ? 67 : 104, y))
  });
  const findNearBall = (pl) => {
    let best = null;
    let bestD = BALL_NEAR_M;
    currentObjectsRef.current.forEach((o) => {
      if (o.type !== 'ball') return;
      const d = Math.hypot(o.x - pl.x, o.y - pl.y);
      if (d <= bestD) { bestD = d; best = o; }
    });
    return best;
  };

  // Salida del balón hacia donde apunta el jugador (pase, remate, saque, lanzamiento)
  const launchBallFromAction = (pl, key) => {
    const cfg = BALL_ACTIONS[key];
    const ball = cfg ? findNearBall(pl) : null;
    if (!cfg || !ball) return;
    const { dx, dy } = facingDir2D(pl.rotationY || 0);
    const fx = actionFxRef.current;
    const timer = setTimeout(() => {
      const fresh = currentObjectsRef.current.find((o) => o.id === ball.id) || ball;
      const sx = fresh.x;
      const sy = fresh.y;
      const end = clampPitch(sx + dx * cfg.dist, sy + dy * cfg.dist);
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / cfg.dur);
        const e = cfg.arc >= 1.5 ? p : 1 - Math.pow(1 - p, 1.5);
        const bx = sx + (end.x - sx) * e;
        const by = sy + (end.y - sy) * e;
        const elev = p >= 1 ? 0 : (cfg.hold || 0) * (1 - p) + 4 * cfg.arc * p * (1 - p);
        setObjects((prev) => prev.map((o) => (
          o.id === ball.id ? { ...o, x: bx, y: by, elevation: elev, altitude: elev, animProgress: undefined } : o
        )));
        fx.raf = p < 1 ? requestAnimationFrame(step) : null;
      };
      if (fx.raf) cancelAnimationFrame(fx.raf);
      fx.raf = requestAnimationFrame(step);
    }, cfg.delay);
    fx.timers.push(timer);
  };

  // Trote / sprint con el balón cerca: el jugador avanza hacia donde mira y conduce el balón a sus pies
  const startCarryRun = (pl, key) => {
    const ball = findNearBall(pl);
    if (!ball) return;
    const sprint = key === 'sprint';
    const speed = sprint ? 6.5 : 3.4;
    const dur = sprint ? 2400 : 3000;
    const { dx, dy } = facingDir2D(pl.rotationY || 0);
    const sx = pl.x;
    const sy = pl.y;
    const end = clampPitch(sx + dx * speed * (dur / 1000), sy + dy * speed * (dur / 1000));
    const relX0 = ball.x - sx;
    const relY0 = ball.y - sy;
    const AHEAD = 0.9;
    const t0 = performance.now();
    const fx = actionFxRef.current;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 0.5 * p + 0.5 * p * p * (3 - 2 * p);
      const px = sx + (end.x - sx) * e;
      const py = sy + (end.y - sy) * e;
      const k = Math.min(1, p / 0.2);
      const kk = k * k * (3 - 2 * k);
      const ob = clampPitch(px + relX0 + (dx * AHEAD - relX0) * kk, py + relY0 + (dy * AHEAD - relY0) * kk);
      const bounce = p >= 1 ? 0 : 0.14 * Math.abs(Math.sin(p * (dur / 1000) * (sprint ? 9 : 6)));
      setObjects((prev) => prev.map((o) => {
        if (o.id === pl.id) return { ...o, x: px, y: py };
        if (o.id === ball.id) return { ...o, x: ob.x, y: ob.y, elevation: bounce, altitude: bounce, animProgress: undefined };
        return o;
      }));
      if (p < 1) {
        fx.runRaf = requestAnimationFrame(step);
      } else {
        fx.runRaf = null;
        const settle = (o) => ({ ...o, animation: 'defensive', animNonce: (o.animNonce || 0) + 1 });
        setObjects((prev) => prev.map((o) => (o.id === pl.id ? settle(o) : o)));
        setSelectedObj((prev) => (prev && prev.id === pl.id ? settle(prev) : prev));
      }
    };
    fx.runRaf = requestAnimationFrame(step);
  };

  // Botón del menú: actualiza obj.animation (el GLBPlayer hace la transición suave) y dispara la cinemática del balón
  const handlePlayerAction = (playerId, key) => {
    cancelPlayerFx();
    const pl = currentObjectsRef.current.find((o) => o.id === playerId);
    if (!pl) return;
    const patch = (o) => ({ ...o, animation: key, animNonce: (o.animNonce || 0) + 1 });
    setObjects((prev) => prev.map((o) => (o.id === playerId ? patch(o) : o)));
    setSelectedObj((prev) => (prev && prev.id === playerId ? patch(prev) : prev));
    if (BALL_ACTIONS[key]) launchBallFromAction(pl, key);
    else if (key === 'jog' || key === 'sprint') startCarryRun(pl, key);
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

      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert('Tu navegador móvil no soporta la grabación de pantalla nativa. Por favor, utiliza la función "Grabar Pantalla" integrada en tu celular (iOS/Android).');
        return;
      }

      const canvasEl = document.querySelector('canvas');
      if (canvasEl && (viewMode === '3d')) {
        stream = canvasEl.captureStream(30);
      } else {
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
    if (e && e.preventDefault) e.preventDefault();
    if (!promptText.trim() || isGeneratingPrompt) return;

    setIsGeneratingPrompt(true);

    const dispatchTacticalElements = (list) => {
      const fieldObjects = [];
      const newDrawings = [];
      const newTextBlocks = [];

      list.forEach((item, idx) => {
        const itemType = (item.type || '').toLowerCase();
        const baseId = item.id || `${itemType}_${idx}_${Date.now()}`;

        if (itemType === 'arrow' || itemType === 'line' || itemType === 'curve' || itemType === 'dribble') {
          newDrawings.push({
            id: baseId,
            type: item.style || (itemType === 'arrow' ? 'arrow' : itemType),
            start: { x: Number(item.startX ?? item.start?.x ?? 11), y: Number(item.startY ?? item.start?.y ?? 34) },
            end: { x: Number(item.endX ?? item.end?.x ?? 20), y: Number(item.endY ?? item.end?.y ?? 34) },
            color: item.color || '#ffffff',
            width: item.strokeW || item.width || 1.4
          });
          return;
        }

        if (itemType === 'text') {
          const val = (item.text || '').trim();
          if (!val || val.length > 25) return;
          newTextBlocks.push({
            id: baseId,
            text: val.toUpperCase(),
            x: Math.max(8, Math.min(95, Number(item.x ?? 25))),
            y: Math.max(8, Math.min(60, Number(item.y ?? 34))),
            color: item.color || '#ffffff',
            size: item.size || 2.8,
            isBold: true,
            isUnderline: false
          });
          return;
        }

        let rot = item.rotation ?? 0;
        if (item.rotation === undefined && (itemType === 'ladder' || itemType === 'hurdle')) rot = 90;

        fieldObjects.push({
          ...item,
          id: baseId,
          type: itemType,
          x: Number(item.x ?? 52.5),
          y: Number(item.y ?? 34),
          rotation: rot,
          color: item.color || (itemType === 'cone' ? '#ea580c' : itemType === 'dummy' ? '#eab308' : undefined)
        });
      });

      if (fieldObjects.length > 0) {
        setObjects(fieldObjects);
        if (typeof recordHistory === 'function') {
          recordHistory(fieldObjects);
        }
      }
      if (newDrawings.length > 0) {
        setDrawings(prev => [...prev, ...newDrawings]);
      }
      if (newTextBlocks.length > 0) {
        setTextBlocks(prev => [...prev, ...newTextBlocks]);
      }
    };

    const rawKey = import.meta.env.VITE_GEMINI_API_KEY || "AQ.Ab8RN6KxpkZkpf_2B6GmHER07VzWZkrXBESDXRn9Xi-AcfZnXg";
    const apiKey = String(rawKey).replace(/[^a-zA-Z0-9_.-]/g, '');

    if (!apiKey) {
      alert("Error: No se encontró la API Key de Gemini.");
      setIsGeneratingPrompt(false);
      return;
    }

    const promptDirecto = `Cancha fútbol (105x68 m). Centro (52.5, 34).
Instrucción: "${promptText}".
Devuelve ÚNICAMENTE un array JSON plano:
- Jugadores: {"id":"p1","type":"player","number":"10","role":"MCO","team":"blue"|"red","x":28,"y":31,"rotation":180}
- Balón: {"id":"b1","type":"ball","x":27,"y":31}
- Flechas y vectores: {"id":"l1","type":"arrow","startX":28,"startY":31,"endX":5,"endY":30,"style":"curve"|"dribble"|"dashed"|"solid","color":"#facc15"|"#38bdf8"|"#ffffff"}
- Textos: {"id":"t1","type":"text","text":"TITULO","x":15,"y":15,"color":"#ffffff"}
- Materiales: {"id":"m1","type":"cone"|"hurdle"|"pole"|"ladder"|"dummy"|"mini_goal"|"hoop","x":20,"y":20,"rotation":0,"color":"#ea580c"|"#eab308"}
Sin markdown. Inicia con [ y termina con ]:`;

    try {
      let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: promptDirecto }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
        })
      });

      if (!response.ok) {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: promptDirecto }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      
      rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) rawText = jsonMatch[0];

      const parsedObjects = JSON.parse(rawText);
      if (Array.isArray(parsedObjects) && parsedObjects.length > 0) {
        dispatchTacticalElements(parsedObjects);
      } else {
        throw new Error("La IA devolvió una respuesta vacía o mal formateada.");
      }
    } catch (err) {
      console.error("[Motor IA] Error crítico:", err);
      alert(`Error al generar táctica: ${err.message}`);
    } finally {
      setIsGeneratingPrompt(false);
      setShowPromptModal(false);
      setPromptText('');
    }
    };
  

  const handlePitchPointerDown = (e) => {
    if (e.cancelable) e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    const c = { x: svgP.x, y: svgP.y };
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
    if (!isDraggingRef.current && !currentLine) return;
    if (e.cancelable) e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const c = pt.matrixTransform(svg.getScreenCTM().inverse());

    if (isDraggingRef.current) {
      setObjects(prev => prev.map(o => o.id === isDraggingRef.current ? { ...o, x: c.x, y: c.y } : o));
      setTextBlocks(prev => prev.map(t => t.id === isDraggingRef.current ? { ...t, x: c.x, y: c.y } : t));
    } else if (currentLine) {
      setCurrentLine(prev => ({ ...prev, end: { x: c.x, y: c.y } }));
    }
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current) { isDraggingRef.current = false; }
    if (currentLine) { setDrawings(prev => [...prev, currentLine]); setCurrentLine(null); }
  };

  const rotateObject = (id) => {
    const u = objects.map(o => o.id === id ? { ...o, rotation: ((o.rotation || 0) + 45) % 360 } : o);
    setObjects(u);
  };

  const addElement = (itemType, extra = {}) => {
    const id = 'item-' + Date.now();
    const spawnX = isPC ? (pitchMode === 'half' ? 27.5 : 52.5) : 34;
    const spawnY = isPC ? 34 : (pitchMode === 'half' ? 42.5 : 52.5);
    const count = objects.filter(o => o.type === 'player' && o.team === (extra.team || 'blue')).length + 1;
    const item = { id, type: itemType, x: spawnX, y: spawnY, rotation: 0, name: '', number: String(extra.number || count), ...extra };
    const nextObjs = [...objects, item];
    setObjects(nextObjs);
    
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
    <div className="flex flex-col h-[100dvh] w-screen bg-black overflow-hidden select-none font-sans print:bg-white print:text-black">
      
      

      {/* MEMBRETE INSTITUCIONAL EXCLUSIVO PARA IMPRESIÓN (PDF / HOJA FÍSICA) */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-black pb-4 mb-4 w-full px-6 pt-2 bg-white">
        <div className="flex items-center gap-4">
          {clubLogo ? (
            <img src={clubLogo} alt="Logo Institución" className="h-16 w-16 object-contain" />
          ) : (
            <div className="h-16 w-16 border-2 border-black flex items-center justify-center font-black text-sm text-black">
              ANDEZ
            </div>
          )}
          <div>
            <h1 className="text-xl font-black uppercase tracking-wide text-black">
              {drillTitle || 'Sesión de Entrenamiento'}
            </h1>
            <p className="text-xs text-zinc-700 font-semibold mt-0.5">
              Categoría: {drillCategory || 'Plantel Principal'} | Fecha: {new Date().toLocaleDateString('es-CL')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-black tracking-widest text-black block">ANDEZ SPORTS FC</span>
          <span className="text-[10px] text-zinc-600 block">Sistema Táctico Profesional</span>
        </div>
      </div>

      {/* HEADER DE GESTIÓN Y ADMINISTRACIÓN (ALTURA FIJA RESPONSIVA) */}
      <header className="bg-[#121214] border-b border-zinc-800/80 px-4 flex items-center justify-between z-30 select-none shadow-md h-10 sm:h-12 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {/* Lado Izquierdo: Marca Institucional y Gestión */}
        <div className="flex items-center gap-3">
          <label className="relative cursor-pointer group flex items-center justify-center" title="Cambiar Logo Institucional">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => setClubLogo(ev.target?.result);
                  reader.readAsDataURL(file);
                }
              }} 
            />
            {clubLogo ? (
              <img src={clubLogo} alt="Logo Club" className="w-7 h-7 sm:w-9 sm:h-9 object-contain rounded-full border border-zinc-700 group-hover:ring-2 ring-amber-400 transition" />
            ) : (
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-black text-[8px] sm:text-[10px] text-amber-400 group-hover:scale-105 transition">
                ANDEZ
              </div>
            )}
          </label>

          <button 
            onClick={() => setShowLibraryModal(true)} 
            className="p-1.5 sm:p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition flex items-center justify-center"
            title="Biblioteca de Sesiones"
          >
            <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Lado Derecho: Controles Administrativos */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button 
            onClick={startRecording} 
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-[10px] sm:text-xs font-semibold border border-zinc-700/60 transition"
            title="Grabar Video / Sesión"
          >
            <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500" />
            <span className="hidden sm:inline">Grabar</span>
          </button>

          <button 
            onClick={() => { if (typeof handleExportImage === 'function') handleExportImage(); else alert('Exportando imagen...'); }} 
            className="p-1.5 sm:p-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg border border-zinc-700/60 transition"
            title="Descargar Imagen PNG"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button 
            onClick={() => window.print()} 
            className="p-1.5 sm:p-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg border border-zinc-700/60 transition"
            title="Imprimir Pizarra"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button 
            onClick={() => setShowSaveModal(true)} 
            className="p-1.5 sm:p-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg border border-zinc-700/60 transition"
            title="Guardar Sesión"
          >
            <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <div className="w-px h-4 sm:h-6 bg-zinc-800 mx-0.5 sm:mx-1"></div>

          {/* BOTÓN SUPER ADMIN CON SOPORTE TÁCTIL */}
          <button 
            onClick={() => setShowAdminDashboard(true)}
            onTouchEnd={(e) => { e.preventDefault(); setShowAdminDashboard(true); }}
            className="px-2 sm:px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[9px] sm:text-[11px] tracking-wider flex items-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95"
          >
            <span>SUPER ADMIN</span>
            <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </button>
          <button
            onClick={async () => {
              try {
                if (!document.fullscreenElement) {
                  await document.documentElement.requestFullscreen();
                  if (screen.orientation && screen.orientation.lock) {
                    await screen.orientation.lock('landscape').catch(() => {});
                  }
                } else {
                  await document.exitFullscreen();
                }
              } catch (err) {}
            }}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
            title="Pantalla Completa Horizontal"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>

          <button
            onClick={handleLogout}
            className="p-2 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
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
          {/* PANELES FLOTANTES LATERALES IDÉNTICOS A TACTICALPAD */}
        {/* PANELES LATERALES FLOTANTES (ESTILO TACTICALPAD DEFINITIVO) */}
        
        {/* LADO IZQUIERDO: EQUIPO LOCAL Y MENÚ */}
        <div className="absolute top-3 bottom-3 left-2 sm:left-4 lg:left-[7%] lg:top-16 lg:bottom-20 z-40 flex flex-col items-center justify-center gap-2 lg:justify-between pointer-events-auto">
          {/* Cápsula Superior Local */}
          <div className="flex flex-col items-center bg-[#252528] border border-zinc-600/70 rounded-2xl p-1.5 shadow-2xl pointer-events-auto">
            <button
              onClick={() => { setRosterTeam('blue'); setBottomBarMode(bottomBarMode === 'roster' && rosterTeam === 'blue' ? 'menu' : 'roster'); }}
              className="w-9 h-10 sm:w-11 sm:h-14 rounded-xl flex items-center justify-center font-black text-white text-xs sm:text-sm shadow-lg pointer-events-auto transition-transform active:scale-95"
              style={{ backgroundColor: teamColors.blue }}
              title="Plantilla Local"
            >
              LOC
            </button>
            <button
              onClick={() => setShowSystemsModal(showSystemsModal === 'home' ? null : 'home')}
              className="p-1.5 hover:bg-white/10 rounded-lg transition flex flex-col items-center justify-center"
              title="Formaciones Tácticas"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-zinc-200">
                <rect x="2" y="3" width="20" height="18" rx="2"></rect>
                <line x1="12" y1="3" x2="12" y2="21"></line>
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M2 9h3v6H2"></path>
                <path d="M22 9h-3v6h3"></path>
              </svg>
            </button>
          </div>

          {/* Botón Menú Casa */}
          <button
            onClick={() => setBottomBarMode('menu')}
            className={`w-12 h-11 lg:w-14 lg:h-16 rounded-xl lg:rounded-2xl flex flex-col items-center justify-center border shadow-2xl transition-all ${
              bottomBarMode === 'menu' ? 'bg-blue-600 border-blue-400 scale-105 shadow-blue-500/40 ring-2 ring-blue-400/50' : 'bg-[#252528] border-zinc-600/70 hover:bg-[#303035]'
            }`}
            title="Menú Principal"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white mb-1">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span className="text-[10px] font-medium text-white">Menu</span>
          </button>
        </div>

        {/* LADO DERECHO: EQUIPO VISITANTE Y HERRAMIENTAS */}
        <div className="absolute top-3 bottom-3 right-2 sm:right-4 lg:right-[7%] lg:top-16 lg:bottom-20 z-40 flex flex-col items-center justify-center gap-2 lg:justify-between pointer-events-auto">
          {/* Cápsula Superior Visitante */}
          <div className="flex flex-col items-center bg-[#252528] border border-zinc-600/70 rounded-2xl p-1.5 shadow-2xl pointer-events-auto">
            <button
              onClick={() => { setRosterTeam('red'); setBottomBarMode(bottomBarMode === 'roster' && rosterTeam === 'red' ? 'menu' : 'roster'); }}
              className="w-9 h-10 sm:w-11 sm:h-14 rounded-xl flex items-center justify-center font-black text-white text-xs sm:text-sm shadow-lg pointer-events-auto transition-transform active:scale-95"
              style={{ backgroundColor: teamColors.red }}
              title="Plantilla Visitante"
            >
              VIS
            </button>
            <button
              onClick={() => setShowSystemsModal(showSystemsModal === 'away' ? null : 'away')}
              className="p-1.5 hover:bg-white/10 rounded-lg transition flex flex-col items-center justify-center"
              title="Formaciones Tácticas"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-zinc-200">
                <rect x="2" y="3" width="20" height="18" rx="2"></rect>
                <line x1="12" y1="3" x2="12" y2="21"></line>
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M2 9h3v6H2"></path>
                <path d="M22 9h-3v6h3"></path>
              </svg>
            </button>
          </div>

          {/* Botón Herramientas Lápiz */}
          <button
            onClick={() => setBottomBarMode('tools')}
            className={`w-12 h-11 lg:w-14 lg:h-16 rounded-xl lg:rounded-2xl flex flex-col items-center justify-center border shadow-2xl transition-all ${
              bottomBarMode === 'tools' ? 'bg-blue-600 border-blue-400 scale-105 shadow-blue-500/40 ring-2 ring-blue-400/50' : 'bg-[#252528] border-zinc-600/70 hover:bg-[#303035]'
            }`}
            title="Herramientas y Trazados"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white mb-1">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
            <span className="text-[9px] font-medium text-white">Herram.</span>
          </button>
        </div>

        {/* POPUP DE 10 SISTEMAS TÁCTICOS */}
        {showSystemsModal && (
          <div className={`absolute top-24 ${showSystemsModal === 'home' ? 'left-20' : 'right-20'} z-50 bg-zinc-950/95 border border-zinc-700 rounded-2xl p-3 shadow-2xl backdrop-blur-xl w-52`}>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Sistemas ({showSystemsModal === 'home' ? 'Local' : 'Visitante'})</span>
              <button onClick={() => setShowSystemsModal(null)} className="text-zinc-400 hover:text-white text-sm font-bold">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto">
              {TACTICAL_SYSTEMS_LIST.map(sysKey => (
                <button
                  key={sysKey}
                  onClick={() => {
                    const sysCoords = GET_TACTICAL_SYSTEMS(isPC)[sysKey];
                    if (sysCoords) {
                      const teamTarget = showSystemsModal === 'home' ? 'blue' : 'red';
                      const newPlayers = sysCoords.map(p => ({
                        id: `${teamTarget}-${p.n}-${Date.now()}`,
                        type: 'player',
                        number: p.n,
                        role: p.r,
                        x: showSystemsModal === 'home' ? p.x : (isPC ? 105 - p.x : 68 - p.x),
                  y: showSystemsModal === 'home' ? p.y : (isPC ? 68 - p.y : 105 - p.y),
                        team: p.r === 'GK' ? (teamTarget === 'blue' ? 'gk' : 'gk_away') : teamTarget,
                        customColor: p.r === 'GK' ? teamColors[teamTarget === 'blue' ? 'gk' : 'gk_away'] : teamColors[teamTarget],
                        name: ''
                      }));
                      setObjects(prev => [...prev.filter(o => o.team !== teamTarget && o.team !== (teamTarget === 'blue' ? 'gk' : 'gk_away')), ...newPlayers]);
                    }
                    setShowSystemsModal(null);
                  }}
                  className="px-2 py-2 bg-zinc-900 hover:bg-amber-500 hover:text-black border border-zinc-800 hover:border-amber-400 rounded-xl text-xs font-bold text-zinc-200 transition text-center"
                >
                  {sysKey}
                </button>
              ))}
            </div>
          </div>
        )}
          <svg
            ref={svgRef}
            onPointerDown={handlePitchPointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-full h-full object-contain touch-none select-none"
            style={{ touchAction: 'none' }}
            preserveAspectRatio="xMidYMid meet"
          
            viewBox={isPC ? "-3 -1 111 70" : "-3 -1 111 70"}
          >
      <defs>
              <marker id="arrow-white" viewBox="0 0 10 10" refX="1" refY="5" markerUnits="strokeWidth" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 1 L 8 5 L 0 9 L 2 5 z" fill="#ffffff" stroke="none" /></marker>
              <marker id="arrow-red" viewBox="0 0 10 10" refX="1" refY="5" markerUnits="strokeWidth" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 1 L 8 5 L 0 9 L 2 5 z" fill="#ef4444" stroke="none" /></marker>
              <marker id="arrow-blue" viewBox="0 0 10 10" refX="1" refY="5" markerUnits="strokeWidth" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 1 L 8 5 L 0 9 L 2 5 z" fill="#3b82f6" stroke="none" /></marker>
              <marker id="arrow-yellow" viewBox="0 0 10 10" refX="1" refY="5" markerUnits="strokeWidth" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 1 L 8 5 L 0 9 L 2 5 z" fill="#facc15" stroke="none" /></marker>
              <marker id="arrow-black" viewBox="0 0 10 10" refX="1" refY="5" markerUnits="strokeWidth" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 1 L 8 5 L 0 9 L 2 5 z" fill="#000000" stroke="none" /></marker>
              <marker id="block-mark" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="strokeWidth" markerWidth="3.5" markerHeight="3.5" orient="auto"><line x1="5" y1="0" x2="5" y2="10" stroke="#ffffff" strokeWidth="2.5" /></marker>
            </defs>

            {/* CÉSPED NATURAL PROFESIONAL TACTICALPAD */}
            <defs>
              <pattern id="tp-grass-stripes" width="10.5" height="100" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="5.25" height="100" fill="#739b3a" />
                <rect x="5.25" y="0" width="5.25" height="100" fill="#7ba440" />
              </pattern>
            </defs>
            <rect width="600" height="600" x="-250" y="-250" fill="url(#tp-grass-stripes)" />

            {/* LÍNEAS REGLAMENTARIAS Y ARCOS */}
            {isPC ? (
              <g stroke="white" strokeWidth="0.8" fill="none">
                <rect x="2" y="2" width={pitchMode === 'half' ? 51 : 101} height="64" />
                <line x1={pitchMode === 'half' ? 53 : 52.5} y1="2" x2={pitchMode === 'half' ? 53 : 52.5} y2="66" />
                <circle cx={pitchMode === 'half' ? 53 : 52.5} cy="34" r="9.15" />
                <circle cx={pitchMode === 'half' ? 53 : 52.5} cy="34" r="0.8" fill="white" />
                <rect x="2" y="13.8" width="16.5" height="40.4" />
                <rect x="2" y="24.8" width="5.5" height="18.4" />
                {/* ARCO IZQUIERDO CENITAL CON RED BLANCA */}
                <g>
                  <rect x="-0.8" y="30.34" width="2.8" height="7.32" fill="rgba(255,255,255,0.08)" stroke="#ffffff" strokeWidth="0.5" />
                  {Array.from({ length: 4 }).map((_, i) => (
                    <line key={`lh-${i}`} x1="-0.8" y1={30.34 + (i + 1) * 1.46} x2="2" y2={30.34 + (i + 1) * 1.46} stroke="#ffffff" strokeWidth="0.2" opacity="0.6" strokeDasharray="0.5 0.5" />
                  ))}
                  {Array.from({ length: 3 }).map((_, j) => (
                    <line key={`lv-${j}`} x1={-0.8 + (j + 1) * 0.7} y1="30.34" x2={-0.8 + (j + 1) * 0.7} y2="37.66" stroke="#ffffff" strokeWidth="0.2" opacity="0.6" strokeDasharray="0.5 0.5" />
                  ))}
                  <line x1="2" y1="30.34" x2="2" y2="37.66" stroke="#ffffff" strokeWidth="1.1" />
                </g>

                <path d="M 18.5 28 A 9.15 9.15 0 0 1 18.5 40" />

                {!pitchMode.includes('half') && (
                  <>
                    <rect x="86.5" y="13.8" width="16.5" height="40.4" />
                    <rect x="97.5" y="24.8" width="5.5" height="18.4" />
                    {/* ARCO DERECHO CENITAL CON RED BLANCA */}
                    <g>
                      <rect x="103" y="30.34" width="2.8" height="7.32" fill="rgba(255,255,255,0.08)" stroke="#ffffff" strokeWidth="0.5" />
                      {Array.from({ length: 4 }).map((_, i) => (
                        <line key={`rh-${i}`} x1="103" y1={30.34 + (i + 1) * 1.46} x2="105.8" y2={30.34 + (i + 1) * 1.46} stroke="#ffffff" strokeWidth="0.2" opacity="0.6" strokeDasharray="0.5 0.5" />
                      ))}
                      {Array.from({ length: 3 }).map((_, j) => (
                        <line key={`rv-${j}`} x1={103 + (j + 1) * 0.7} y1="30.34" x2={103 + (j + 1) * 0.7} y2="37.66" stroke="#ffffff" strokeWidth="0.2" opacity="0.6" strokeDasharray="0.5 0.5" />
                      ))}
                      <line x1="103" y1="30.34" x2="103" y2="37.66" stroke="#ffffff" strokeWidth="1.1" />
                    </g>
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
            if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
            setSelectedTextId(tb.id);
            setSelectedObj(tb);
            isDraggingRef.current = tb.id;
            if (typeof setTool === 'function') setTool('move');
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
          const nameTxt = (obj.name || '').trim();
          const posTxt = (obj.position || '').trim();
          const hasLabel = nameTxt.length > 0 || posTxt.length > 0;
          const bothLines = nameTxt.length > 0 && posTxt.length > 0;
          const longestLen = Math.max(nameTxt.length, posTxt.length);
          const w = Math.max(10, longestLen * 1.45 + 3.2);
          const boxH = bothLines ? 5.6 : 3.4;
          return (
            <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`} onPointerDown={(e) => {
              e.stopPropagation();
              const now = Date.now();
              if (lastPlayerTapRef.current.id === obj.id && now - lastPlayerTapRef.current.time < 350) {
                setEditingPlayerId(obj.id);
                lastPlayerTapRef.current = { id: null, time: 0 };
                return;
              }
              lastPlayerTapRef.current = { id: obj.id, time: now };
              if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
              setSelectedObj(obj);
              isDraggingRef.current = obj.id;
              if (typeof setTool === 'function') setTool('move');
            }}>
              <circle r="3.0" fill={obj.customColor || (obj.role === 'GK' ? (obj.team === 'red' || obj.team === 'gk_away' ? teamColors.gk_away : teamColors.gk) : (obj.team === 'red' ? teamColors.red : teamColors.blue))} stroke="#ffffff" strokeWidth="0.45" />
              <text textAnchor="middle" dy="1.0" fontSize="2.5" fontWeight="bold" fill="#ffffff" className="select-none pointer-events-none">{obj.number}</text>
              {hasLabel && (
                <g>
                  <rect x={-w / 2} y="3.7" width={w} height={boxH} rx="1" fill="rgba(10, 10, 10, 0.88)" />
                  {bothLines ? (
                    <>
                      <text x="0" y="6.0" textAnchor="middle" fontSize="1.8" fontWeight="bold" fill="#ffffff" className="select-none pointer-events-none">{nameTxt}</text>
                      <text x="0" y="8.3" textAnchor="middle" fontSize="1.5" fontWeight="bold" fill="#fbbf24" className="select-none pointer-events-none">{posTxt}</text>
                    </>
                  ) : (
                    <text x="0" y="6.1" textAnchor="middle" fontSize="1.8" fontWeight="bold" fill={nameTxt ? '#ffffff' : '#fbbf24'} className="select-none pointer-events-none">{nameTxt || posTxt}</text>
                  )}
                </g>
              )}
            </g>
          );
        }
              if (obj.type === 'ball') return (
            <SoccerBall
              key={obj.id}
              x={obj.x}
              y={obj.y}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
                setSelectedObj(obj);
                isDraggingRef.current = obj.id;
                if (typeof setTool === 'function') setTool('move');
              }}
            />
          );

          const isMatSelected = selectedMaterial?.id === obj.id;
          const matScale = obj.scale || 1.0;
          return (
            <g key={obj.id}>
              <TrainingMaterial
                obj={obj}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
                  setSelectedMaterial(obj);
                  setSelectedObj(null);
                  isDraggingRef.current = obj.id;
                  if (typeof setTool === 'function') setTool('move');
                }}
                onDoubleClick={() => rotateObject(obj.id)}
              />
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
            className={`absolute inset-0 ${
              viewMode === '3d' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none -z-10'
            }`}
          >
            <div className="absolute top-4 left-4 z-40 bg-zinc-950/90 border border-zinc-800 rounded-2xl">
              <button
                onClick={() => setCameraLocked(!cameraLocked)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  cameraLocked ? 'bg-emerald-600 text-white shadow-lg' : 'bg-amber-500 text-black shadow-lg'
                }`}
              >
                {cameraLocked ? <Lock className="w-4 h-4" /> : <Move className="w-4 h-4" />}
                <span>{cameraLocked ? 'Cámara Bloqueada' : 'Rotar Cancha (Orbitar)'}</span>
              </button>
            </div>
            <Scene3DBoundary>
              <Suspense fallback={<div className="text-white font-bold text-sm flex items-center justify-center h-full">Cargando motor 3D...</div>}>
                <Canvas
                  frameloop="always"
                  dpr={[1, isPC ? 1.5 : 1]}
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
                    
                      isPC={isPC}
                      onDragStart={cancelPlayerFx}
                    />
                  </Suspense>
                </Canvas>
              </Suspense>
            </Scene3DBoundary>
          </div>
        {/* Selector de nombre y posición del jugador (solo doble clic / doble toque) */}
      {(() => {
        const editingPlayer = editingPlayerId ? objects.find((o) => o.id === editingPlayerId && o.type === 'player') : null;
        if (!editingPlayer) return null;
        return (
          <div className="fixed bottom-16 lg:bottom-24 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/95 border border-zinc-700 text-white px-3 py-2 rounded-2xl shadow-2xl flex items-center gap-2">
            <span
              className="w-6 h-6 rounded-full border border-white flex items-center justify-center text-[11px] font-black shrink-0"
              style={{ backgroundColor: editingPlayer.customColor || '#2563eb' }}
            >
              {editingPlayer.number}
            </span>
            <input
              type="text"
              placeholder="Nombre..."
              value={editingPlayer.name || ''}
              onChange={(e) => {
                const val = e.target.value;
                setObjects((prev) => prev.map((o) => (o.id === editingPlayer.id ? { ...o, name: val } : o)));
              }}
              className="bg-zinc-800 border border-zinc-600 rounded-lg px-2 py-1 text-xs text-white w-28 lg:w-36 focus:outline-none focus:border-amber-400"
            />
            <input
              type="text"
              placeholder="Posición (ej. DC)"
              value={editingPlayer.position || ''}
              onChange={(e) => {
                const val = e.target.value;
                setObjects((prev) => prev.map((o) => (o.id === editingPlayer.id ? { ...o, position: val } : o)));
              }}
              className="bg-zinc-800 border border-zinc-600 rounded-lg px-2 py-1 text-xs text-white w-28 lg:w-32 focus:outline-none focus:border-amber-400"
            />
            {(editingPlayer.name || editingPlayer.position) && (
              <button
                type="button"
                onClick={() => {
                  setObjects((prev) => prev.map((o) => (o.id === editingPlayer.id ? { ...o, name: '', position: '' } : o)));
                }}
                className="text-[10px] px-2 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-bold"
                title="Quitar etiqueta"
              >
                Quitar
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditingPlayerId(null)}
              className="text-zinc-400 hover:text-white text-xs px-1 font-bold"
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        );
      })()}
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

                    // Inversa matemática exacta 1:1 de toWorld
                    const isDesk = window.innerWidth > 768;
                    let targetX, targetY;

                    if (isDesk) {
                      targetX = Math.max(1, Math.min(104, pt3D.x + 52.5));
                      targetY = Math.max(1, Math.min(67, pt3D.z + 34));
                    } else {
                      // Inversa exacta para móvil: x = 34 - pt3D.z, y = pt3D.x + 52.5
                      targetX = Math.max(1, Math.min(67, 34 - pt3D.z));
                      targetY = Math.max(1, Math.min(104, pt3D.x + 52.5));
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
        
        {/* Menú contextual de acciones del jugador seleccionado (vista 3D) */}
        {viewMode === '3d' && selectedObj && selectedObj.type === 'player' && (() => {
          const livePlayer = objects.find((o) => o.id === selectedObj.id);
          if (!livePlayer) return null;
          return (
            <PlayerActionBar
              player={livePlayer}
              onAction={(key) => handlePlayerAction(livePlayer.id, key)}
              onClose={() => setSelectedObj(null)}
            />
          );
        })()}

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

        {/* SUB-BARRA DE MATERIALES UNIFICADA EN HERRAMIENTAS */}

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
      <footer className="bg-[#1a1a1a] flex flex-col shrink-0 z-30 border-t border-zinc-800 no-print w-full select-none h-12 text-xs">
        
        {/* LÍNEA DE TIEMPO / FOTOGRAMAS */}
        {bottomBarMode === 'timeline' && (
          <div className="w-full bg-zinc-950/95 border-b border-zinc-800 py-1.5 px-4 flex items-center justify-between shadow-2xl backdrop-blur-md overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400">🎬 Marcos:</span>
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-xl py-0.5 [&::-webkit-scrollbar]:hidden">
                {frames.map((f, idx) => (
                  <button
                    key={f.id || idx}
                    onClick={() => {
                      setActiveFrameIndex(idx);
                      if (frames[idx]?.objects) setObjects(frames[idx].objects);
                      if (frames[idx]?.drawings) setDrawings(frames[idx].drawings);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      activeFrameIndex === idx
                        ? 'bg-amber-500 text-black shadow-lg scale-105'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddFrame}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow flex items-center gap-1 transition"
                title="Nuevo Marco (Duplicar Jugada)"
              >
                <span>+</span> Añadir
              </button>
              <button
                onClick={() => handleDeleteFrame(activeFrameIndex)}
                className="p-1 bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white rounded-lg text-xs transition"
                title="Eliminar Marco Actual"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLoopSequence}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  isLoopPlaying ? 'bg-amber-500 text-black animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-500'
                }`}
              >
                <Play className={`w-3.5 h-3.5 ${isLoopPlaying ? 'fill-black' : 'fill-white'}`} />
                <span>{isLoopPlaying ? 'Pausar' : 'Reproducir'}</span>
              </button>
            </div>
          </div>
        )}

        {/* PALETA DE CAMISETAS EXPANDIBLE */}
        {showKitPalette && (
          <div className="w-full bg-zinc-950 border-b border-zinc-800 py-1.5 px-3 flex items-center justify-between gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-zinc-400 text-xs font-bold mr-1">Camisetas:</span>
              {[
                { id: 'blue', label: 'Local' },
                { id: 'red', label: 'Visita' },
                { id: 'gk', label: 'Arq. Loc' },
                { id: 'gk_away', label: 'Arq. Vis' }
              ].map(target => (
                <button
                  key={target.id}
                  onClick={() => setKitTarget(target.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                    kitTarget === target.id ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {target.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {officialKitColors.map(c => (
                <button
                  key={c.hex}
                  title={c.name}
                  onClick={() => handleUpdateKitColor(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-5 h-5 rounded-full border border-black/30 transition-transform ${
                    teamColors[kitTarget] === c.hex ? 'scale-125 ring-2 ring-amber-400' : 'hover:scale-110'
                  }`}
                />
              ))}
            </div>
            <button onClick={() => setShowKitPalette(false)} className="text-zinc-400 hover:text-white text-xs px-2">✕</button>
          </div>
        )}

        {/* CONTENEDOR PRINCIPAL DE LA BARRA INFERIOR */}
        <div className="w-full h-full px-1 flex items-center justify-between overflow-hidden">
          
          {/* MODO: MENÚ PRINCIPAL */}
          {/* MODO: MENÚ PRINCIPAL (ESTILO TACTICALPAD VECTORIAL) */}
          {/* MODO: MENÚ PRINCIPAL (CALIBRADO EXACTO TACTICALPAD) */}
          {/* MODO: MENÚ PRINCIPAL (RÉPLICA EXACTA TACTICALPAD) */}
          {/* MODO: MENÚ PRINCIPAL (CALIBRACIÓN CLON EXACTO TACTICALPAD) */}
          {/* MODO: MENÚ PRINCIPAL (TACTICALPAD 1:1 VECTOR OFICIAL) */}
          {/* MODO: MENÚ PRINCIPAL (ESCALA REAL TACTICALPAD) */}
          {bottomBarMode === 'menu' && (
        <div className="w-full h-full flex items-center justify-between gap-0.5 px-1 [&_button]:!min-w-0 [&_button]:!w-auto [&_button]:!flex-1 [&_button]:!px-0.5 [&_button]:!h-12 lg:[&_button]:!h-18 lg:[&_button]:!w-24 lg:[&_button]:!flex-none [&_svg]:!w-4 [&_svg]:!h-4 lg:[&_svg]:!w-8 lg:[&_svg]:!h-8 [&_span]:!text-[8px] sm:[&_span]:!text-[9px] lg:[&_span]:!text-xs [&_span]:!tracking-tighter lg:[&_span]:!tracking-tight">
    
    {/* 1. Nuevo Proyecto */}
    <button 
      onClick={() => { if (confirm('¿Vaciar toda la pizarra?')) { setObjects([]); setDrawings([]); setTextBlocks([]); } }} 
      className="flex flex-col items-center justify-center flex-1 min-w-0 px-0.5 py-0.5 w-14 sm:w-24 h-12 sm:h-18 hover:bg-white/10 rounded-xl transition gap-0.5 sm:gap-1.5 shrink-0 group"
    >
      <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white fill-none stroke-current stroke-[2.6]" viewBox="0 0 32 32">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h11l7 7v16a1.5 1.5 0 01-1.5 1.5H7A1.5 1.5 0 015.5 27V5.5A1.5 1.5 0 017 4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 4v7h7M16 15v8M12 19h8" />
      </svg>
      <span className="text-[8px] sm:text-xs text-white font-medium tracking-tight whitespace-nowrap">Nuevo</span>
    </button>

    {/* 2. Abrir Proyecto */}
    <button 
      onClick={() => setShowLibraryModal(true)} 
      className="flex flex-col items-center justify-center min-w-[3.5rem] w-14 sm:w-24 h-12 sm:h-18 hover:bg-white/10 rounded-xl transition gap-0.5 sm:gap-1.5 shrink-0 group"
    >
      <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white fill-current" viewBox="0 0 32 32">
        <path d="M4 8.5A1.5 1.5 0 015.5 7h7.1l2.4 2.5H26A1.5 1.5 0 0127.5 11v1.5H6.8a2 2 0 00-1.95 1.6L3 25V8.5z" opacity="0.85" />
        <path d="M6.5 13h22.2a1.2 1.2 0 011.18 1.53l-2.6 11a1.2 1.2 0 01-1.18.87H4.8a1.2 1.2 0 01-1.18-1.53l2.6-11a1.2 1.2 0 011.18-.87z" />
      </svg>
      <span className="text-[8px] sm:text-xs text-white font-medium tracking-tight whitespace-nowrap">Abrir</span>
    </button>

    {/* 3. Guardar */}
    <button 
      onClick={() => {
        const n = { id: 'd-' + Date.now(), title: drillTitle, notes: drillNotes, category: drillCategory, date: new Date().toISOString().split('T')[0], objects, drawings };
        setSavedDrills([n, ...savedDrills]); alert('¡Sesión guardada!');
      }} 
      className="flex flex-col items-center justify-center min-w-[3.5rem] w-14 sm:w-24 h-12 sm:h-18 hover:bg-white/10 rounded-xl transition gap-0.5 sm:gap-1.5 shrink-0 group"
    >
      <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white fill-none stroke-current stroke-[2.6]" viewBox="0 0 32 32">
        <rect x="5.5" y="4" width="21" height="24" rx="2.5" />
        <path strokeLinecap="round" d="M9 4v7h14V4" />
        <rect x="10" y="17" width="12" height="11" rx="1.5" />
      </svg>
      <span className="text-[8px] sm:text-xs text-white font-medium tracking-tight whitespace-nowrap">Guardar</span>
    </button>

    {/* 4. Guardar como */}
    <button 
      onClick={() => setShowSaveModal(true)} 
      className="flex flex-col items-center justify-center min-w-[3.5rem] w-14 sm:w-24 h-12 sm:h-18 hover:bg-white/10 rounded-xl transition gap-0.5 sm:gap-1.5 shrink-0 group"
    >
      <div className="relative">
        <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white fill-none stroke-current stroke-[2.6]" viewBox="0 0 32 32">
          <rect x="5.5" y="4" width="21" height="24" rx="2.5" />
          <path strokeLinecap="round" d="M9 4v7h14V4" />
          <rect x="10" y="17" width="12" height="11" rx="1.5" />
        </svg>
        <div className="absolute -bottom-1 -right-1 bg-black border border-white rounded-full w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center shadow">
          <span className="text-white text-[7px] sm:text-[10px] font-black leading-none mb-0.5">+</span>
        </div>
      </div>
      <span className="text-[8px] sm:text-xs text-white font-medium tracking-tight whitespace-nowrap">Guardar +</span>
    </button>

    {/* Separador fino */}
    <div className="w-px h-6 sm:h-10 bg-zinc-700/60 mx-0.5 shrink-0"></div>

    {/* 5. Ajustes */}
    <button 
      onClick={() => setShowKitPalette(prev => !prev)} 
      className="flex flex-col items-center justify-center min-w-[3.5rem] w-14 sm:w-24 h-12 sm:h-18 hover:bg-white/10 rounded-xl transition gap-0.5 sm:gap-1.5 shrink-0 group"
    >
      <div className="relative w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center">
        <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white fill-current" viewBox="0 0 24 24">
          <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.32.07-.65.07-.98 0-.33-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.488.488 0 0 0 13.5 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65z" />
        </svg>
        <div className="absolute -top-1 -right-1 bg-black rounded-full border border-white w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center">
          <span className="text-[7px] sm:text-[9px] font-black text-white leading-none">?</span>
        </div>
      </div>
      <span className="text-[8px] sm:text-xs text-white font-medium tracking-tight whitespace-nowrap">Ajustes</span>
    </button>

    {/* 6. Compartir */}
    <button 
      onClick={startRecording} 
      className="flex flex-col items-center justify-center min-w-[3.5rem] w-14 sm:w-24 h-12 sm:h-18 hover:bg-white/10 rounded-xl transition gap-0.5 sm:gap-1.5 shrink-0 group"
    >
      <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white fill-none stroke-current stroke-[2.6]" viewBox="0 0 32 32">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 21v5a1.5 1.5 0 001.5 1.5h17A1.5 1.5 0 0026 26v-5M16 5v16M10 11l6-6 6 6" />
      </svg>
      <span className="text-[8px] sm:text-xs text-white font-medium tracking-tight whitespace-nowrap">Compartir</span>
    </button>

    {/* 7. Pizarras */}
    <button 
      onClick={() => setBottomBarMode(bottomBarMode === 'timeline' ? 'menu' : 'timeline')} 
      className="flex flex-col items-center justify-center min-w-[3.5rem] w-14 sm:w-24 h-12 sm:h-18 hover:bg-white/10 rounded-xl transition gap-0.5 sm:gap-1.5 shrink-0 group"
    >
      <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white fill-none stroke-current stroke-[2.4]" viewBox="0 0 32 32">
        <rect x="6" y="5" width="20" height="24" rx="2" strokeWidth="2.4" />
        <path d="M12 5V3a1 1 0 011-1h6a1 1 0 011 1v2" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="16" cy="17" r="3.5" strokeWidth="2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 13l4.5 3 6-3m-6 8l3-2" />
        <circle cx="10" cy="13" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="20.5" cy="13" r="1.5" fill="currentColor" stroke="none" />
      </svg>
      <span className="text-[8px] sm:text-xs text-white font-medium tracking-tight whitespace-nowrap">Pizarras</span>
    </button>

    {/* 8. Campo */}
    <button 
      onClick={() => setPitchMode(pitchMode === 'full' ? 'half' : 'full')} 
      className="flex flex-col items-center justify-center min-w-[3.5rem] w-14 sm:w-24 h-12 sm:h-18 hover:bg-white/10 rounded-xl transition gap-0.5 sm:gap-1.5 shrink-0 group"
    >
      <svg className="w-6 h-4 sm:w-9 sm:h-7 text-white fill-none stroke-current stroke-[2.4]" viewBox="0 0 38 28">
        <rect x="4" y="3" width="30" height="22" rx="1.5" strokeWidth="2.4" />
        <line x1="19" y1="3" x2="19" y2="25" strokeWidth="2" />
        <circle cx="19" cy="14" r="4.5" strokeWidth="2" />
        <rect x="4" y="8" width="5.5" height="12" strokeWidth="2" />
        <rect x="28.5" y="8" width="5.5" height="12" strokeWidth="2" />
        <path d="M1.5 10v8M36.5 10v8" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span className="text-[8px] sm:text-xs text-white font-medium tracking-tight whitespace-nowrap">Campo</span>
    </button>

    {/* 9. 3D */}
    <button 
      onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')} 
      className={`flex flex-col items-center justify-center min-w-[3.5rem] w-14 sm:w-24 h-12 sm:h-18 rounded-xl transition shrink-0 group ${
        viewMode === '3d' ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400' : 'hover:bg-white/10 text-white'
      }`}
    >
      <div className="flex flex-col items-center justify-center w-7 h-5 sm:w-10 sm:h-8">
        <span className="text-[9px] sm:text-xs font-black italic tracking-wider text-white leading-none">3D</span>
        <svg className="w-7 h-3 sm:w-10 sm:h-5 text-white fill-none stroke-current stroke-[2.6]" viewBox="0 0 44 18">
          <polygon points="11,2 33,2 41,16 3,16" strokeLinejoin="round" />
          <line x1="22" y1="2" x2="22" y2="16" strokeWidth="2" />
          <ellipse cx="22" cy="9" rx="4.5" ry="2.2" strokeWidth="1.8" />
        </svg>
      </div>
      <span className="text-[8px] sm:text-xs text-white font-medium tracking-tight whitespace-nowrap">3D</span>
    </button>

    {/* 10. Repositorios */}
    <button 
      onClick={() => setShowTrainingMenu(!showTrainingMenu)} 
      className={`flex flex-col items-center justify-center min-w-[3.5rem] w-14 sm:w-24 h-12 sm:h-18 rounded-xl transition gap-0.5 sm:gap-1.5 shrink-0 group ${
        showTrainingMenu ? 'bg-amber-500 text-black shadow-lg' : 'hover:bg-white/10 text-white'
      }`}
    >
      <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white fill-none stroke-current stroke-[2.4]" viewBox="0 0 32 32">
        <circle cx="23" cy="7" r="3" fill="currentColor" stroke="none" />
        <path d="M10 9l2.5-6h3l2.5 6" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 13l11-4.5 11 4.5v10l-11 5-11-5V13z" strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M5 13l11 4.5 11-4.5M16 17.5v10" strokeWidth="2.6" />
      </svg>
      <span className="text-[8px] sm:text-xs text-white font-medium tracking-tight whitespace-nowrap">Materiales</span>
    </button>

    {/* Separador fino */}
    <div className="w-px h-6 sm:h-10 bg-zinc-700/60 mx-0.5 shrink-0"></div>

    {/* 11. IA Táctica */}
    <button 
      onClick={() => setShowPromptModal(true)} 
      className="flex flex-col items-center justify-center min-w-[3.5rem] w-14 sm:w-24 h-12 sm:h-18 hover:bg-amber-500/20 rounded-xl transition gap-0.5 sm:gap-1.5 shrink-0 group"
    >
      <svg className="w-5 h-5 sm:w-8 sm:h-8 text-amber-400 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L14.39 8.26L21 9.27L16.5 14.14L17.77 21L12 17.77L6.23 21L7.5 14.14L3 9.27L9.61 8.26L12 2Z" />
      </svg>
      <span className="text-[8px] sm:text-xs text-amber-400 font-bold tracking-tight whitespace-nowrap">IA Táctica</span>
    </button>

  </div>
)}

          {/* MODO: HERRAMIENTAS ESTILO TACTICALPAD + CATÁLOGO TRAS ARCO DERECHO */}
          {bottomBarMode === 'tools' && (
            <>
              {/* CATÁLOGO LATERAL DE ARTÍCULOS TRAS EL ARCO DERECHO (NO INVADE LA CANCHA NI GRABACIONES) */}
              {showTrainingMenu && !isRecording && (
                <aside className="fixed right-2 sm:right-3 top-14 sm:top-16 bottom-16 sm:bottom-20 w-36 sm:w-48 bg-zinc-950/95 border border-zinc-700/80 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden no-print">
                  <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-zinc-800 bg-zinc-900/90 shrink-0">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-400">Artículos</span>
                    <button
                      onClick={() => setShowTrainingMenu(false)}
                      className="p-0.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800"
                      title="Cerrar catálogo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-1.5 sm:p-2 grid grid-cols-2 gap-1.5 sm:gap-2">
                    {[
                      {
                        label: 'Cono N.',
                        action: () => addElement('cone', { color: '#ea580c' }),
                        svg: (
                          <svg viewBox="0 0 48 48" className="w-8 h-8 sm:w-10 sm:h-10">
                            <ellipse cx="24" cy="40" rx="16" ry="5" fill="#9a3412" />
                            <polygon points="11,39 21,9 27,9 37,39" fill="#f97316" />
                            <polygon points="15.5,26 32.5,26 34.5,32 13.5,32" fill="#ffffff" opacity="0.92" />
                            <polygon points="18.5,17 29.5,17 31,21.5 17,21.5" fill="#ffffff" opacity="0.92" />
                          </svg>
                        ),
                      },
                      {
                        label: 'Cono A.',
                        action: () => addElement('cone', { color: '#2563eb' }),
                        svg: (
                          <svg viewBox="0 0 48 48" className="w-8 h-8 sm:w-10 sm:h-10">
                            <ellipse cx="24" cy="40" rx="16" ry="5" fill="#1e3a8a" />
                            <polygon points="11,39 21,9 27,9 37,39" fill="#3b82f6" />
                            <polygon points="15.5,26 32.5,26 34.5,32 13.5,32" fill="#ffffff" opacity="0.92" />
                          </svg>
                        ),
                      },
                      {
                        label: 'Cono Am.',
                        action: () => addElement('cone', { color: '#eab308' }),
                        svg: (
                          <svg viewBox="0 0 48 48" className="w-8 h-8 sm:w-10 sm:h-10">
                            <ellipse cx="24" cy="40" rx="16" ry="5" fill="#854d0e" />
                            <polygon points="11,39 21,9 27,9 37,39" fill="#facc15" />
                            <polygon points="15.5,26 32.5,26 34.5,32 13.5,32" fill="#ffffff" opacity="0.92" />
                          </svg>
                        ),
                      },
                      {
                        label: 'Estaca',
                        action: () => addElement('pole', { color: '#facc15' }),
                        svg: (
                          <svg viewBox="0 0 48 48" className="w-8 h-8 sm:w-10 sm:h-10">
                            <ellipse cx="24" cy="41" rx="9" ry="3.5" fill="#18181b" stroke="#52525b" strokeWidth="1.2" />
                            <rect x="22.3" y="7" width="3.4" height="34" rx="1.5" fill="#facc15" />
                            <rect x="22.3" y="7" width="3.4" height="5" rx="1" fill="#ef4444" />
                          </svg>
                        ),
                      },
                      {
                        label: 'Plato',
                        action: () => addElement('saucer', { color: '#facc15' }),
                        svg: (
                          <svg viewBox="0 0 48 48" className="w-8 h-8 sm:w-10 sm:h-10">
                            <ellipse cx="24" cy="30" rx="15" ry="6" fill="#ca8a04" />
                            <path d="M10,29 Q24,18 38,29 Z" fill="#facc15" />
                            <ellipse cx="24" cy="24" rx="5" ry="2" fill="#fef08a" />
                          </svg>
                        ),
                      },
                      {
                        label: 'Aro',
                        action: () => addElement('ring', { color: '#38bdf8' }),
                        svg: (
                          <svg viewBox="0 0 48 48" className="w-8 h-8 sm:w-10 sm:h-10">
                            <ellipse cx="24" cy="27" rx="16" ry="8" fill="none" stroke="#0284c7" strokeWidth="3.5" />
                            <ellipse cx="24" cy="26" rx="16" ry="8" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                          </svg>
                        ),
                      },
                      {
                        label: 'Valla',
                        action: () => addElement('hurdle'),
                        svg: (
                          <svg viewBox="0 0 48 48" className="w-8 h-8 sm:w-10 sm:h-10">
                            <path d="M11,37 L15,18 L33,18 L37,37" fill="none" stroke="#f97316" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="8" y1="37" x2="15" y2="37" stroke="#ea580c" strokeWidth="3.5" strokeLinecap="round" />
                            <line x1="33" y1="37" x2="40" y2="37" stroke="#ea580c" strokeWidth="3.5" strokeLinecap="round" />
                          </svg>
                        ),
                      },
                      {
                        label: 'Maniquí',
                        action: () => addElement('dummy'),
                        svg: (
                          <svg viewBox="0 0 48 48" className="w-8 h-8 sm:w-10 sm:h-10">
                            <ellipse cx="24" cy="42" rx="10" ry="3" fill="#27272a" />
                            <line x1="20" y1="33" x2="20" y2="41" stroke="#a1a1aa" strokeWidth="2.2" />
                            <line x1="28" y1="33" x2="28" y2="41" stroke="#a1a1aa" strokeWidth="2.2" />
                            <rect x="16" y="15" width="16" height="19" rx="5" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
                            <circle cx="24" cy="9.5" r="4.2" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
                          </svg>
                        ),
                      },
                      {
                        label: 'Portería',
                        action: () => addElement('mini_goal'),
                        svg: (
                          <svg viewBox="0 0 48 48" className="w-8 h-8 sm:w-10 sm:h-10">
                            <polygon points="10,16 34,13 40,29 14,34" fill="rgba(255,255,255,0.14)" stroke="#a1a1aa" strokeWidth="1" strokeDasharray="2 2" />
                            <polyline points="10,35 10,16 34,13 34,31" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinejoin="round" />
                            <polyline points="10,35 15,34 40,29 34,31" fill="none" stroke="#d4d4d8" strokeWidth="1.8" />
                          </svg>
                        ),
                      },
                      {
                        label: 'Escalera',
                        action: () => addElement('ladder'),
                        svg: (
                          <svg viewBox="0 0 48 48" className="w-8 h-8 sm:w-10 sm:h-10">
                            <line x1="15" y1="9" x2="11" y2="39" stroke="#facc15" strokeWidth="2.4" strokeLinecap="round" />
                            <line x1="33" y1="9" x2="37" y2="39" stroke="#facc15" strokeWidth="2.4" strokeLinecap="round" />
                            <line x1="14.5" y1="14" x2="33.5" y2="14" stroke="#ffffff" strokeWidth="2" />
                            <line x1="13.5" y1="21" x2="34.5" y2="21" stroke="#ffffff" strokeWidth="2" />
                            <line x1="12.5" y1="28" x2="35.5" y2="28" stroke="#ffffff" strokeWidth="2" />
                            <line x1="11.5" y1="35" x2="36.5" y2="35" stroke="#ffffff" strokeWidth="2" />
                          </svg>
                        ),
                      },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={item.action}
                        className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/60 transition active:scale-95"
                      >
                        {item.svg}
                        <span className="text-[9px] sm:text-[10px] font-medium text-zinc-200 mt-0.5 leading-tight">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </aside>
              )}

              {/* BARRA INFERIOR UNIFICADA ESTILO TACTICALPAD */}
              <div className="flex items-center gap-1.5 sm:gap-3 min-w-max px-3 w-full justify-start sm:justify-center">
                {/* Mover / Seleccionar */}
                <button
                  onClick={() => setTool('move')}
                  className={`flex flex-col items-center justify-center w-12 sm:w-16 h-12 sm:h-16 rounded-xl transition ${
                    tool === 'move' ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400' : 'hover:bg-white/10 text-zinc-300'
                  }`}
                >
                  <Move className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-[9px] sm:text-[10px] font-medium mt-0.5">Mover</span>
                </button>

                {/* Trazos y Flechas */}
                <button
                  onClick={() => setShowLinePalette(true)}
                  className={`flex flex-col items-center justify-center w-12 sm:w-16 h-12 sm:h-16 rounded-xl transition ${
                    tool === 'draw' ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400' : 'hover:bg-white/10 text-zinc-300'
                  }`}
                >
                  <PenTool className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-[9px] sm:text-[10px] font-medium mt-0.5">Trazos</span>
                </button>

                {/* Borrar trazo */}
                <button
                  onClick={() => setTool(tool === 'eraser' ? 'move' : 'eraser')}
                  className={`flex flex-col items-center justify-center w-12 sm:w-16 h-12 sm:h-16 rounded-xl transition ${
                    tool === 'eraser' ? 'bg-amber-500 text-black shadow-lg' : 'hover:bg-white/10 text-zinc-300'
                  }`}
                >
                  <Eraser className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-[9px] sm:text-[10px] font-medium mt-0.5">Borrar</span>
                </button>

                {/* Limpiar pizarra */}
                <button
                  onClick={() => { if (confirm('¿Vaciar toda la pizarra?')) { setObjects([]); setDrawings([]); } }}
                  className="flex flex-col items-center justify-center w-12 sm:w-16 h-12 sm:h-16 rounded-xl hover:bg-red-500/20 text-red-400 transition"
                >
                  <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-[9px] sm:text-[10px] font-medium mt-0.5">Limpiar</span>
                </button>

                <div className="w-px h-10 bg-zinc-700 mx-0.5 shrink-0"></div>

                {/* Artículos (Despliega catálogo lateral tras el arco derecho) */}
                <button
                  onClick={() => setShowTrainingMenu(!showTrainingMenu)}
                  className={`flex flex-col items-center justify-center w-14 sm:w-20 h-12 sm:h-16 rounded-xl transition ${
                    showTrainingMenu ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400' : 'hover:bg-white/10 text-white'
                  }`}
                >
                  <svg viewBox="0 0 32 32" className="w-5 h-5 sm:w-6 sm:h-6">
                    <circle cx="11" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
                    <polygon points="15,26 21,10 24,10 30,26" fill="currentColor" opacity="0.9" />
                    <line x1="13" y1="26" x2="31" y2="26" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                  <span className="text-[9px] sm:text-[10px] font-semibold mt-0.5">Artículos</span>
                </button>

                {/* Texto */}
                <button
                  onClick={() => setTool(tool === 'text' ? 'move' : 'text')}
                  className={`flex flex-col items-center justify-center w-12 sm:w-16 h-12 sm:h-16 rounded-xl transition ${
                    tool === 'text' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/10 text-zinc-300'
                  }`}
                >
                  <Type className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-[9px] sm:text-[10px] font-medium mt-0.5">Texto</span>
                </button>

                {/* Notas */}
                <button
                  onClick={() => setShowTrainingMenu(false)}
                  className="flex flex-col items-center justify-center w-12 sm:w-16 h-12 sm:h-16 rounded-xl hover:bg-white/10 text-zinc-300 transition"
                  title="Notas tácticas"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-current stroke-2">
                    <rect x="5" y="3" width="14" height="18" rx="2" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="9" y1="12" x2="15" y2="12" />
                    <line x1="9" y1="16" x2="12" y2="16" />
                  </svg>
                  <span className="text-[9px] sm:text-[10px] font-medium mt-0.5">Notas</span>
                </button>

                {/* Efectos */}
                <button
                  onClick={() => setShowTrainingMenu(false)}
                  className="flex flex-col items-center justify-center w-12 sm:w-16 h-12 sm:h-16 rounded-xl hover:bg-white/10 text-zinc-300 transition"
                  title="Efectos visuales"
                >
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-[9px] sm:text-[10px] font-medium mt-0.5">Efectos</span>
                </button>
              </div>
            </>
          )}

          {/* MODO: PLANTILLA (JUGADORES Y BALÓN) */}
          {bottomBarMode === 'roster' && (
        <div className="flex items-center gap-1.5 lg:gap-2.5 px-2 lg:px-4 w-full h-full overflow-x-auto justify-start lg:justify-center">
          {Array.from({ length: 15 }, (_, idx) => idx + 1).map((num) => {
            const isGK = num === 1;
            const onPitchObj = objects.find(
              (o) => o.type === 'player' && o.team === rosterTeam && Number(o.number) === num
            );
            const isActive = Boolean(onPitchObj);
            const badgeColor = isGK
              ? teamColors[rosterTeam === 'blue' ? 'gk' : 'gk_away']
              : teamColors[rosterTeam];

            return (
              <button
                key={num}
                type="button"
                onClick={() => {
                  if (isActive) {
                    setObjects((prev) => prev.filter((o) => o.id !== onPitchObj.id));
                  } else {
                    const defaultX = rosterTeam === 'blue' ? (isGK ? 6 : 22 + ((num % 4) * 7)) : (isGK ? 99 : 83 - ((num % 4) * 7));
                    const defaultY = isGK ? 34 : 12 + (((num * 13) % 44));
                    setObjects((prev) => [
                      ...prev,
                      {
                      id: `${rosterTeam}-${num}-${Date.now()}`,
                      type: 'player',
                      number: num,
                      role: isGK ? 'GK' : 'JUG',
                      x: defaultX,
                      y: defaultY,
                      team: rosterTeam,
                      customColor: badgeColor,
                      name: '',
                    },
                    ]);
                  }
                }}
                className={`flex flex-col items-center justify-center shrink-0 w-11 h-12 lg:w-16 lg:h-16 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-zinc-800 border-amber-400 shadow-md scale-105 opacity-100'
                    : 'bg-zinc-900/70 border-zinc-700/60 opacity-60 hover:opacity-100'
                }`}
                title={isActive ? `Devolver Jugador ${num} al fichero` : `Colocar Jugador ${num} en cancha`}
              >
                <div
                  className="w-6 h-6 lg:w-8 lg:h-8 rounded-full border-2 border-white flex items-center justify-center text-white font-black text-[10px] lg:text-xs shadow"
                  style={{ backgroundColor: badgeColor }}
                >
                  {num}
                </div>
                <span className="text-[7px] lg:text-[9px] text-zinc-300 font-medium mt-0.5 leading-none">
                  {isGK ? 'Arquero' : `Jug. ${num}`}
                </span>
              </button>
            );
          })}

          <div className="w-px h-8 lg:h-10 bg-zinc-700 mx-0.5 shrink-0"></div>

          <button
            type="button"
            onClick={() => {
              const existingBall = objects.find((o) => o.type === 'ball');
              if (existingBall) {
                setObjects((prev) => prev.filter((o) => o.id !== existingBall.id));
              } else {
                setObjects((prev) => [...prev, { id: `ball-${Date.now()}`, type: 'ball', x: 52.5, y: 34 }]);
              }
            }}
            className="flex flex-col items-center justify-center shrink-0 w-11 h-12 lg:w-16 lg:h-16 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 transition-all"
            title="Poner / Quitar Balón"
          >
            <span className="text-base lg:text-xl leading-none">⚽</span>
            <span className="text-[7px] lg:text-[9px] text-zinc-300 font-medium mt-0.5 leading-none">Balón</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setKitTarget(rosterTeam);
              setShowKitPalette((prev) => !prev);
            }}
            className="flex flex-col items-center justify-center shrink-0 w-11 h-12 lg:w-16 lg:h-16 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 transition-all"
            title="Configuración y Colores del Equipo"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 lg:w-6 lg:h-6 text-zinc-200">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="text-[7px] lg:text-[9px] text-zinc-300 font-medium mt-0.5 leading-none">Equipo</span>
          </button>
        </div>
      )}

        </div>
      </footer>
    </div>
  )}
