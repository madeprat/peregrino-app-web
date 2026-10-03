// Rezar en grupo desde la web — solo invitados.
//
// Esta página nunca crea salas ni mueve la oración: únicamente lee la sala
// `group_sessions/{CÓDIGO}` que creó quien guía desde Peregrino APP y sigue
// la sección actual. La única escritura es la señal anónima `guestJoined`,
// la misma que envía la app al unirse.
//
// Solo se siguen oraciones universales (prayerType == 'oracion'). El Santo
// Rosario en grupo es una experiencia exclusiva de la app.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyA7xKVVL42LZFFu_J28xiGJBBh6lEjTVoY',
  authDomain: 'peregrino-app-94435.firebaseapp.com',
  projectId: 'peregrino-app-94435',
  storageBucket: 'peregrino-app-94435.firebasestorage.app',
  messagingSenderId: '267938085739',
  appId: '1:267938085739:web:1c4aca13d19843bbebea2e',
};

const db = getFirestore(initializeApp(firebaseConfig));

// Mismo alfabeto que genera la app (sin I, O, 0 ni 1).
const CODIGO_VALIDO = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;

const IDIOMAS = {
  es: { label: 'Español', voz: 'es-ES' },
  la: { label: 'Latina', voz: 'it-IT' },
  pt: { label: 'Português', voz: 'pt-PT' },
  en: { label: 'English', voz: 'en-US' },
};

const $ = (id) => document.getElementById(id);
const vistas = ['viewCodigo', 'viewCargando', 'viewEspera', 'viewRezo', 'viewRosario', 'viewFin'];

const estado = {
  codigo: '',
  cancelar: null,
  documentoRaw: null,
  documento: null,
  secciones: [],
  indice: -1,
  escuchando: false,
};

// ── Vistas ────────────────────────────────────────────────────────────────

function mostrar(id) {
  for (const vista of vistas) $(vista).hidden = vista !== id;
  window.scrollTo({ top: 0 });
}

function rellenar(selector, texto) {
  for (const el of document.querySelectorAll(selector)) {
    el.textContent = texto;
    if (el.tagName === 'P') el.hidden = !texto;
  }
}

function mostrarCodigo(error = '') {
  detener();
  estado.codigo = '';
  actualizarUrl('');
  const ayuda = $('codigoAyuda');
  ayuda.textContent = error;
  ayuda.hidden = !error;
  ayuda.classList.toggle('error', Boolean(error));
  $('btnUnirme').disabled = false;
  mostrar('viewCodigo');
  $('inputCodigo').focus();
}

function mostrarFin(titulo, texto, icono = '🕊️') {
  detener();
  $('finTitulo').textContent = titulo;
  $('finTexto').textContent = texto;
  $('finIcono').textContent = icono;
  mostrar('viewFin');
}

function actualizarUrl(codigo) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('sala');
    if (codigo) url.searchParams.set('c', codigo);
    else url.searchParams.delete('c');
    history.replaceState(null, '', url);
  } catch (_) {}
}

// ── Lectura de datos de Firestore (todo es texto no confiable) ────────────

function texto(valor) {
  return valor == null ? '' : String(valor).trim();
}

function fecha(valor) {
  if (!valor) return null;
  if (typeof valor.toDate === 'function') return valor.toDate();
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

function caducada(data) {
  const expira = fecha(data.expiresAt);
  return expira != null && Date.now() > expira.getTime();
}

function esOracion(data) {
  return texto(data.prayerType) === 'oracion';
}

function leerIndice(data) {
  const n = Number.parseInt(data.currentSectionIndex, 10);
  return Number.isFinite(n) ? n : 0;
}

// ── Documento de oración (equivalente a PrayerDocument / PrayerBlock) ─────

function tipoBloque(valor) {
  switch (texto(valor).toLowerCase()) {
    case 'heading': case 'title': case 'titulo': return 'heading';
    case 'dialogue': case 'dialogo': case 'response': case 'respuesta': return 'dialogue';
    case 'rubric': case 'rubrica': return 'rubric';
    case 'silence': case 'silencio': case 'pause': case 'pausa': return 'silence';
    case 'reference': case 'referencia': return 'reference';
    default: return 'text';
  }
}

function booleano(valor, porDefecto) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') return valor !== 0;
  const t = texto(valor).toLowerCase();
  if (['true', '1', 'si', 'sí'].includes(t)) return true;
  if (['false', '0', 'no'].includes(t)) return false;
  return porDefecto;
}

function leerDocumento(raw) {
  if (!raw || !texto(raw)) return null;
  let json;
  try {
    json = JSON.parse(raw);
  } catch (_) {
    return null;
  }
  if (!json || typeof json !== 'object') return null;

  const crudos = Array.isArray(json.blocks) ? json.blocks : Array.isArray(json.bloques) ? json.bloques : [];
  const bloques = crudos
    .filter((b) => b && typeof b === 'object')
    .map((b) => {
      const tipo = tipoBloque(b.type ?? b.tipo);
      return {
        tipo,
        texto: String(b.text ?? b.texto ?? ''),
        locutor: texto(b.speaker ?? b.locutor),
        habla: booleano(b.speak, tipo !== 'rubric' && tipo !== 'silence'),
        visible: booleano(b.visible, tipo !== 'silence'),
      };
    });

  const metadata = json.metadata && typeof json.metadata === 'object' ? json.metadata : {};
  return {
    titulo: texto(json.title ?? json.titulo) || 'Oración',
    idioma: texto(metadata.language).toLowerCase(),
    bloques,
  };
}

function esSustantivo(b) {
  return Boolean(b.texto.trim()) && (b.tipo === 'text' || b.tipo === 'dialogue' || b.tipo === 'reference');
}

// Mismas reglas que PrayerSectionBuilder: cada encabezado abre una sección y
// la app sincroniza el índice de esa lista, así que deben coincidir.
function construirSecciones(documento) {
  const secciones = [];
  let actuales = [];
  let titulo = null;

  const volcar = () => {
    if (!actuales.length) return;
    const t = titulo && titulo.trim() ? titulo.trim() : secciones.length === 0 ? 'Inicio' : `Sección ${secciones.length + 1}`;
    secciones.push({ titulo: t, bloques: actuales });
    actuales = [];
    titulo = null;
  };

  for (const bloque of documento.bloques) {
    if (bloque.tipo === 'heading') {
      if (actuales.some(esSustantivo)) volcar();
      else actuales = [];
      titulo = bloque.texto.trim() || `Sección ${secciones.length + 1}`;
    }
    actuales.push(bloque);
  }
  volcar();
  return secciones;
}

function bloquesVisibles(seccion) {
  return seccion.bloques.filter((b) => {
    if (!b.visible || b.tipo === 'silence' || !b.texto.trim()) return false;
    if (b.tipo === 'heading' && b.texto.trim().toLowerCase() === seccion.titulo.trim().toLowerCase()) return false;
    return true;
  });
}

// ── Pintar ────────────────────────────────────────────────────────────────

function pintarCabecera(data, documento) {
  const titulo = documento?.titulo || texto(data.prayerTitle) || 'Oración en grupo';
  const guia = texto(data.hostNickname);
  rellenar('[data-codigo]', estado.codigo);
  rellenar('[data-titulo]', titulo);
  rellenar('[data-guia]', guia || 'quien guía');

  const intencion = texto(data.intention);
  rellenar('[data-intencion]', intencion ? `Intención: ${intencion}` : '');

  const programada = fecha(data.scheduledFor);
  rellenar('[data-fecha]', programada
    ? new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(programada)
    : '');

  const idioma = IDIOMAS[documento?.idioma];
  rellenar('[data-idioma]', idioma && documento.idioma !== 'es' ? `🌐 ${idioma.label}` : '');
  document.title = `${titulo} | Rezar en grupo`;
}

function pintarSeccion(indice) {
  const total = estado.secciones.length;
  const seguro = Math.min(Math.max(indice, 0), total - 1);
  const cambio = seguro !== estado.indice;
  estado.indice = seguro;

  const seccion = estado.secciones[seguro];
  $('seccionTitulo').textContent = seccion.titulo;
  const cuerpo = $('seccionCuerpo');
  cuerpo.replaceChildren();

  for (const bloque of bloquesVisibles(seccion)) {
    const p = document.createElement('p');
    p.className = `b-${bloque.tipo}`;
    if (bloque.tipo === 'dialogue' && bloque.locutor) {
      const locutor = document.createElement('span');
      locutor.className = 'speaker';
      locutor.textContent = bloque.locutor;
      const contenido = document.createElement('span');
      contenido.textContent = bloque.texto;
      p.append(locutor, contenido);
    } else {
      p.textContent = bloque.texto;
    }
    cuerpo.append(p);
  }

  $('progresoTexto').textContent = `Parte ${seguro + 1} de ${total}`;
  $('barra').style.width = `${((seguro + 1) / total) * 100}%`;

  if (cambio) {
    const tarjeta = $('seccion');
    tarjeta.classList.remove('cambio');
    void tarjeta.offsetWidth;
    tarjeta.classList.add('cambio');
    tarjeta.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (estado.escuchando) leerSeccion();
  }
}

// ── Sala ──────────────────────────────────────────────────────────────────

function aplicar(data) {
  if (data == null) {
    mostrarFin('La oración ha terminado', 'Quien guiaba ha cerrado la sala. Gracias por rezar en comunidad.');
    return;
  }
  if (caducada(data)) {
    mostrarFin('Esta sala ha caducado', 'Pide a quien guía que te envíe un código nuevo.', '⏳');
    return;
  }
  if (!esOracion(data)) {
    detener();
    rellenar('[data-codigo]', estado.codigo);
    mostrar('viewRosario');
    return;
  }

  const raw = texto(data.prayerDocumentJson);
  if (raw !== estado.documentoRaw) {
    estado.documentoRaw = raw;
    estado.documento = leerDocumento(raw);
    estado.secciones = estado.documento ? construirSecciones(estado.documento) : [];
    estado.indice = -1;
  }
  if (!estado.secciones.length) {
    mostrarFin('No podemos mostrar esta oración', 'La sala no contiene una oración que se pueda leer desde la web. Puedes seguirla desde Peregrino APP.', '📖');
    return;
  }

  pintarCabecera(data, estado.documento);

  if (data.started !== true) {
    mostrar('viewEspera');
    return;
  }

  if ($('viewRezo').hidden) {
    mostrar('viewRezo');
    estado.indice = -1;
  }
  $('rezoError').hidden = true;
  pintarSeccion(leerIndice(data));
}

async function unirse(codigoBruto) {
  const codigo = texto(codigoBruto).toUpperCase().replace(/\s+/g, '');
  if (!CODIGO_VALIDO.test(codigo)) {
    mostrarCodigo('El código tiene 4 caracteres (letras y números). Revísalo e inténtalo de nuevo.');
    return;
  }

  detener();
  estado.codigo = codigo;
  $('cargandoTexto').textContent = 'Buscando la sala…';
  mostrar('viewCargando');

  const ref = doc(db, 'group_sessions', codigo);
  let snapshot;
  try {
    snapshot = await getDoc(ref);
  } catch (_) {
    mostrarCodigo('No hemos podido abrir la sala. Comprueba tu conexión e inténtalo de nuevo.');
    return;
  }
  if (estado.codigo !== codigo) return;

  if (!snapshot.exists()) {
    mostrarCodigo('No encontramos esa sala. Revisa el código.');
    return;
  }
  const data = snapshot.data();
  if (caducada(data)) {
    mostrarCodigo('Esa sala ya ha caducado.');
    return;
  }

  actualizarUrl(codigo);

  if (esOracion(data)) {
    // Señal de presencia anónima, igual que en la app. Si falla, se sigue igualmente.
    updateDoc(ref, { guestJoined: true }).catch(() => {});
  }

  aplicar(data);
  estado.cancelar = onSnapshot(
    ref,
    (snap) => {
      if (estado.codigo === codigo) aplicar(snap.exists() ? snap.data() : null);
    },
    () => {
      const error = $('rezoError');
      error.textContent = 'Se ha perdido la conexión con la sala. Recarga la página para volver a unirte.';
      error.hidden = false;
    },
  );
}

function detener() {
  if (estado.cancelar) {
    estado.cancelar();
    estado.cancelar = null;
  }
  pararVoz();
  estado.documentoRaw = null;
  estado.documento = null;
  estado.secciones = [];
  estado.indice = -1;
}

// ── Lectura en voz alta (opcional, voz del navegador) ─────────────────────

const voz = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window ? window.speechSynthesis : null;

function textoParaVoz(raw) {
  return raw
    .replace(/[¡¿"“”]/g, '')
    .replace(/\s*\n\s*/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

function trozos(frase, max = 180) {
  const partes = frase.match(/[^.,;:!?]+[.,;:!?]*/g) || [frase];
  const resultado = [];
  let actual = '';
  for (const parte of partes) {
    const candidato = actual ? `${actual} ${parte.trim()}` : parte.trim();
    if (candidato.length <= max) actual = candidato;
    else {
      if (actual) resultado.push(actual);
      actual = parte.trim();
    }
  }
  if (actual) resultado.push(actual);
  return resultado;
}

function leerSeccion() {
  if (!voz) return;
  voz.cancel();
  const seccion = estado.secciones[estado.indice];
  if (!seccion) return;
  const lang = (IDIOMAS[estado.documento?.idioma] || IDIOMAS.es).voz;
  const frases = [seccion.titulo];
  for (const b of seccion.bloques) {
    if (b.habla && b.tipo !== 'silence' && b.texto.trim() && b.texto.trim() !== seccion.titulo) frases.push(b.texto);
  }
  for (const frase of frases) {
    for (const trozo of trozos(textoParaVoz(frase))) {
      const u = new SpeechSynthesisUtterance(trozo);
      u.lang = lang;
      u.rate = 0.95;
      voz.speak(u);
    }
  }
}

function pararVoz() {
  if (voz) voz.cancel();
}

function alternarEscucha() {
  estado.escuchando = !estado.escuchando;
  const boton = $('btnEscuchar');
  boton.setAttribute('aria-pressed', String(estado.escuchando));
  boton.textContent = estado.escuchando ? '⏹ Dejar de escuchar' : '🔈 Escuchar';
  if (estado.escuchando) leerSeccion();
  else pararVoz();
}

// ── Arranque ──────────────────────────────────────────────────────────────

$('formCodigo').addEventListener('submit', (e) => {
  e.preventDefault();
  $('btnUnirme').disabled = true;
  unirse($('inputCodigo').value);
});

$('inputCodigo').addEventListener('input', (e) => {
  const limpio = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  if (limpio !== e.target.value) e.target.value = limpio;
});

for (const boton of document.querySelectorAll('[data-otro-codigo]')) {
  boton.addEventListener('click', () => {
    $('inputCodigo').value = '';
    mostrarCodigo();
  });
}

if (voz) {
  $('btnEscuchar').hidden = false;
  $('btnEscuchar').addEventListener('click', alternarEscucha);
}

const params = new URLSearchParams(window.location.search);
const inicial = params.get('c') || params.get('sala') || '';
if (inicial) {
  $('inputCodigo').value = inicial.toUpperCase().slice(0, 4);
  unirse(inicial);
} else {
  mostrarCodigo();
}
