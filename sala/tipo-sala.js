// Tipo de una sala `group_sessions/{CÓDIGO}` — sin dependencias.
//
// Es la misma regla que `ContratoOracionGrupo.tipoSala` en Peregrino APP.
// Si se cambia aquí, hay que cambiarla también en la app (y al revés).
//
// Solo se reconocen explícitamente 'oracion' y 'rosario'. Cualquier otro
// valor, o la ausencia del campo, es 'desconocido': nunca se trata como
// Rosario por defecto.

export const TIPO_ORACION = 'oracion';
export const TIPO_ROSARIO = 'rosario';
export const TIPO_DESCONOCIDO = 'desconocido';

export function tipoSala(data) {
  const valor = data && data.prayerType;
  const tipo = typeof valor === 'string' ? valor.trim().toLowerCase() : '';
  if (tipo === TIPO_ORACION) return TIPO_ORACION;
  if (tipo === TIPO_ROSARIO) return TIPO_ROSARIO;
  return TIPO_DESCONOCIDO;
}
