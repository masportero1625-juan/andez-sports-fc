// --- CONFIGURACIÓN SUPABASE NATIVA (REST API SIN DEPENDENCIAS) ---
export const SUPABASE_URL = "https://hzfvckmgycvvshckwypf.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6ZnZja21neWN2dnNoY2t3eXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDcxNzcsImV4cCI6MjA2MDAxMTE3N30.Z651c6c6b328a64ed41e3d489da924cf3832d2fe102874136427a1e050ff8156";

export const MASTER_PIN = "ANDEZ2026";
export const WHATSAPP_SOPORTE = "56932100183";

export const sbGet = async (key) => {
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

export const sbSet = async (key, value) => {
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

// 8 Colores Oficiales
export const PALETTE_COLORS = [
  { id: 'white', name: 'Blanco', hex: '#ffffff', text: '#000000' },
  { id: 'blue', name: 'Azul', hex: '#2563eb', text: '#ffffff' },
  { id: 'red', name: 'Rojo', hex: '#dc2626', text: '#ffffff' },
  { id: 'orange', name: 'Naranjo', hex: '#f97316', text: '#ffffff' },
  { id: 'yellow', name: 'Amarillo', hex: '#eab308', text: '#000000' },
  { id: 'green', name: 'Verde', hex: '#16a34a', text: '#ffffff' },
  { id: 'black', name: 'Negro', hex: '#111827', text: '#ffffff' },
  { id: 'purple', name: 'Violeta', hex: '#9333ea', text: '#ffffff' }
];

// Sistemas Tácticos Predefinidos
export const INITIAL_TACTICAL_SYSTEMS = [
  { id: 's1', name: 'Formación 4-3-3', code: '1-4-3-3' },
  { id: 's2', name: 'Formación 4-4-2', code: '1-4-4-2' },
  { id: 's3', name: 'Formación 3-5-2', code: '1-3-5-2' },
  { id: 's4', name: 'Formación 4-2-3-1', code: '1-4-2-3-1' },
  { id: 's5', name: 'Fútbol 7 (1-2-3-1)', code: '1-2-3-1' }
];

// Catálogo Completo de Materiales de Entrenamiento
export const TRAINING_MATERIALS = [
  { id: 'mannequin', name: 'Maniquí de Barrera', icon: '🧍', color: '#eab308' },
  { id: 'slalom', name: 'Bastón / Estaca Slalom', icon: '📍', color: '#eab308' },
  { id: 'cone_orange', name: 'Cono Naranja', icon: '🔺', color: '#f97316' },
  { id: 'cone_yellow', name: 'Cono Amarillo', icon: '⚠️', color: '#eab308' },
  { id: 'cone_blue', name: 'Cono Azul', icon: '🔹', color: '#2563eb' },
  { id: 'saucer_orange', name: 'Plato Chino Naranja', icon: '🟠', color: '#f97316' },
  { id: 'saucer_yellow', name: 'Plato Chino Amarillo', icon: '🟡', color: '#eab308' },
  { id: 'saucer_blue', name: 'Plato Chino Azul', icon: '🔵', color: '#2563eb' },
  { id: 'hurdle', name: 'Valla de Salto', icon: '⛩️', color: '#ffffff' },
  { id: 'ladder', name: 'Escalera de Coordinación', icon: '🪜', color: '#eab308' },
  { id: 'hoop', name: 'Aro de Agilidad', icon: '⭕', color: '#ef4444' }
];
