// Reunión de Grupo en línea — reglas de la sala, sin dependencias.
//
// Es la misma lógica que `ReunionRoomTransitions` en Peregrino APP. Si se
// cambia aquí, hay que cambiarla también en la app (y al revés).

export const ETAPA_COMPARTIR = 1;
export const ULTIMA_ETAPA = 3;
export const NOMBRES_POR_CONJUNTO = 20;
export const CONJUNTOS = ['apostles', 'women'];

/** Personas de la sala en el orden en que entraron (orden de la ronda). */
export function miembrosEnOrden(sala) {
  const miembros = sala && typeof sala.members === 'object' && sala.members ? sala.members : {};
  return Object.entries(miembros)
    .filter(([, m]) => m && CONJUNTOS.includes(m.set) && Number.isInteger(m.index) && Number.isInteger(m.seq))
    .map(([uid, m]) => ({ uid, set: m.set, index: m.index, seq: m.seq }))
    .sort((a, b) => a.seq - b.seq);
}

function entero(valor, porDefecto = 0) {
  return Number.isInteger(valor) ? valor : porDefecto;
}

/** Estado de avance de la sala, normalizado. */
export function posicion(sala) {
  return {
    started: sala?.started === true,
    finished: sala?.finished === true,
    stageIndex: Math.min(Math.max(entero(sala?.stageIndex), 0), ULTIMA_ETAPA),
    completedTurns: Math.max(entero(sala?.completedTurns), 0),
  };
}

/** Quién comparte ahora, o null si no es el momento de la ronda. */
export function quienComparte(sala) {
  const p = posicion(sala);
  if (!p.started || p.finished || p.stageIndex !== ETAPA_COMPARTIR) return null;
  const orden = miembrosEnOrden(sala);
  return orden[p.completedTurns] ?? null;
}

/** Posición siguiente: un turno más en la ronda, o el momento siguiente. */
export function siguiente(sala) {
  const p = posicion(sala);
  const personas = entero(sala?.memberCount);
  if (p.finished) return p;
  if (!p.started) return { started: true, finished: false, stageIndex: 0, completedTurns: 0 };
  if (p.stageIndex === ETAPA_COMPARTIR && p.completedTurns + 1 < personas) {
    return { ...p, completedTurns: p.completedTurns + 1 };
  }
  if (p.stageIndex < ULTIMA_ETAPA) {
    return { ...p, stageIndex: p.stageIndex + 1, completedTurns: 0 };
  }
  return { ...p, finished: true };
}

/** Posición anterior: un turno menos en la ronda, o el momento anterior. */
export function anterior(sala) {
  const p = posicion(sala);
  if (!p.started || p.finished) return p;
  if (p.stageIndex === ETAPA_COMPARTIR && p.completedTurns > 0) {
    return { ...p, completedTurns: p.completedTurns - 1 };
  }
  if (p.stageIndex > 0) {
    return { ...p, stageIndex: p.stageIndex - 1, completedTurns: 0 };
  }
  return p;
}

export function puedeRetroceder(sala) {
  const p = posicion(sala);
  return p.started && !p.finished && (p.stageIndex > 0 || p.completedTurns > 0);
}

export function mismaPosicion(a, b) {
  return a.started === b.started &&
    a.finished === b.finished &&
    a.stageIndex === b.stageIndex &&
    a.completedTurns === b.completedTurns;
}
