// Reunión de Grupo en línea — invitados y miembros desde el navegador.
//
// La sala `reunion_rooms/{CÓDIGO}` la crea alguien desde Peregrino APP. Aquí
// cada persona entra con una sesión anónima, recibe el nombre de un apóstol o
// de una mujer del Evangelio y sigue los cuatro momentos de la reunión.
// Cualquiera que esté dentro puede avanzar o retroceder: la reunión no la
// preside nadie. En la sala nunca se escribe lo que cada uno comparte.
//
// Los textos vienen de `reunion_fundamental_v1.json`, copia exacta del archivo
// de la app (assets/data/reunion_fundamental_v1.json).

import { getApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {
  getAuth,
  signInAnonymously,
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

import {
  NOMBRES_POR_CONJUNTO,
  anterior,
  mismaPosicion,
  miembrosEnOrden,
  posicion,
  puedeRetroceder,
  quienComparte,
  siguiente,
} from './logica.js';

const COLECCION = 'reunion_rooms';
const VERSION_AGENDA = 2;
const VOCES = { es: 'es-ES', pt: 'pt-BR', en: 'en-US' };

// ── Contenido ─────────────────────────────────────────────────────────────

let contenidoPromesa = null;

function cargarContenido() {
  if (!contenidoPromesa) {
    contenidoPromesa = fetch(new URL('./reunion_fundamental_v1.json', import.meta.url))
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error('contenido');
        return respuesta.json();
      })
      .catch((error) => {
        contenidoPromesa = null;
        throw error;
      });
  }
  return contenidoPromesa;
}

function paquete(contenido, idioma) {
  const idiomas = contenido.languages || {};
  return idiomas[idioma] || idiomas.es;
}

function etiqueta(pack, clave, valores = {}) {
  let texto = (pack.labels && pack.labels[clave]) || '';
  for (const [nombre, valor] of Object.entries(valores)) {
    texto = texto.split(`{${nombre}}`).join(String(valor));
  }
  return texto;
}

function nombreDe(pack, miembro) {
  const lista = (pack.names && pack.names[miembro.set]) || [];
  return lista[miembro.index] || '—';
}

// ── Firebase ──────────────────────────────────────────────────────────────

function db() {
  return getFirestore(getApp());
}

async function entrarAnonimo() {
  const auth = getAuth(getApp());
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser.uid;
  const credencial = await signInAnonymously(auth);
  return credencial.user.uid;
}

function fecha(valor) {
  if (!valor) return null;
  if (typeof valor.toDate === 'function') return valor.toDate();
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

function caducada(sala) {
  const expira = fecha(sala.expiresAt);
  return expira != null && Date.now() > expira.getTime();
}

// ── DOM ───────────────────────────────────────────────────────────────────

function nodo(etiquetaHtml, clase, texto) {
  const el = document.createElement(etiquetaHtml);
  if (clase) el.className = clase;
  if (texto != null) el.textContent = texto;
  return el;
}

// ── Voz del navegador (opcional) ──────────────────────────────────────────

const voz = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window ? window.speechSynthesis : null;

function leer(frases, idioma) {
  if (!voz) return;
  voz.cancel();
  for (const frase of frases) {
    const limpia = String(frase)
      .replace(/^[VR]\. /gm, '')
      .replace(/[¡¿"“”]/g, '')
      .replace(/\s*\n\s*/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!limpia) continue;
    const u = new SpeechSynthesisUtterance(limpia);
    u.lang = VOCES[idioma] || VOCES.es;
    u.rate = 0.95;
    voz.speak(u);
  }
}

function pararVoz() {
  if (voz) voz.cancel();
}

/** Lo que se lee al llegar a un momento: igual que la voz de la app. */
function guionDeVoz(id, textos) {
  const frases = [textos.voice || textos.title];
  if (id === 'reunion:opening_prayer' && textos.prayer) frases.push(textos.prayer);
  for (const parte of textos.parts || []) frases.push(parte.title, ...(parte.questions || []));
  for (const paso of textos.steps || []) {
    frases.push(paso.title);
    if (paso.detail) frases.push(paso.detail);
    if (paso.prayer) frases.push(paso.prayer);
  }
  return frases;
}

// ── Sala ──────────────────────────────────────────────────────────────────

export async function abrirReunion(ui) {
  const { codigo, $, mostrar, mostrarCodigo, mostrarFin, actualizarUrl, sigueActiva } = ui;

  let contenido;
  let uid;
  let primera;
  const ref = doc(db(), COLECCION, codigo);
  try {
    [contenido, uid] = await Promise.all([cargarContenido(), entrarAnonimo()]);
    primera = await getDoc(ref);
  } catch (_) {
    if (sigueActiva()) {
      mostrarCodigo('No hemos podido abrir la sala. Comprueba tu conexión e inténtalo de nuevo.');
    }
    return null;
  }
  if (!sigueActiva()) return null;

  if (!primera.exists()) {
    mostrarCodigo('No encontramos esa sala o ya ha caducado. Revisa el código.');
    return null;
  }

  const inicial = primera.data();
  const pack = paquete(contenido, inicial.language);
  if (caducada(inicial)) {
    mostrarCodigo(etiqueta(pack, 'roomExpired') || 'Esta sala ha caducado.');
    return null;
  }
  if (inicial.contentVersion !== contenido.schemaVersion || inicial.agendaVersion !== VERSION_AGENDA) {
    mostrarFin(
      'Esta sala usa otra versión de la reunión',
      'Pide a quien creó la sala que actualice Peregrino APP y te envíe un enlace nuevo.',
      '🔄',
    );
    return null;
  }

  actualizarUrl(codigo);

  const idioma = inicial.language in VOCES ? inicial.language : 'es';
  const etapas = contenido.stages || [];
  const t = (clave, valores) => etiqueta(pack, clave, valores);

  let ultima = inicial;
  let momentoPintado = null;
  let ocupado = false;
  let escuchando = false;

  // ── Elegir nombre ───────────────────────────────────────

  function pintarEleccion(sala) {
    $('nombreSala').textContent = t('roomCode', { code: codigo });
    $('nombreTitulo').textContent = t('roomChooseName');
    $('nombreAyuda').textContent = t('roomChooseNameHelp');
    for (const boton of document.querySelectorAll('[data-conjunto]')) {
      const conjunto = boton.dataset.conjunto;
      const contador = conjunto === 'women' ? sala.womenCount : sala.apostleCount;
      boton.textContent = t(conjunto === 'women' ? 'roomWoman' : 'roomApostle');
      boton.disabled = ocupado || (Number.isInteger(contador) && contador >= NOMBRES_POR_CONJUNTO);
    }
    if ($('viewNombre').hidden) mostrar('viewNombre');
  }

  async function entrarComo(conjunto) {
    if (ocupado) return;
    ocupado = true;
    pintarEleccion(ultima);
    const estado = $('nombreEstado');
    estado.hidden = true;
    try {
      await runTransaction(db(), async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error('sala');
        const sala = snap.data();
        if (sala.members && sala.members[uid]) return;
        const campo = conjunto === 'women' ? 'womenCount' : 'apostleCount';
        const indice = Number.isInteger(sala[campo]) ? sala[campo] : 0;
        if (indice >= NOMBRES_POR_CONJUNTO) throw new Error('llena');
        const personas = Number.isInteger(sala.memberCount) ? sala.memberCount : 0;
        tx.update(ref, {
          [`members.${uid}`]: { set: conjunto, index: indice, seq: personas },
          memberCount: personas + 1,
          [campo]: indice + 1,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      estado.textContent = error && error.message === 'llena'
        ? t('roomFull')
        : 'No hemos podido entrar en la sala. Inténtalo de nuevo.';
      estado.hidden = false;
    } finally {
      ocupado = false;
      if (sigueActiva() && !(ultima.members && ultima.members[uid])) pintarEleccion(ultima);
    }
  }

  for (const boton of document.querySelectorAll('[data-conjunto]')) {
    boton.onclick = () => entrarComo(boton.dataset.conjunto);
  }

  // ── Avanzar y retroceder ────────────────────────────────

  async function mover(adelante) {
    if (ocupado) return;
    ocupado = true;
    const esperada = posicion(ultima);
    pintarReunion(ultima);
    $('reunionError').hidden = true;
    try {
      await runTransaction(db(), async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const sala = snap.data();
        // Si otra persona ya ha movido la reunión, no se repite el paso.
        if (!mismaPosicion(posicion(sala), esperada)) return;
        const nueva = adelante ? siguiente(sala) : anterior(sala);
        if (mismaPosicion(nueva, esperada)) return;
        tx.update(ref, { ...nueva, updatedAt: serverTimestamp() });
      });
    } catch (_) {
      const error = $('reunionError');
      error.textContent = 'No hemos podido actualizar la sala. Inténtalo de nuevo.';
      error.hidden = false;
    } finally {
      ocupado = false;
      if (sigueActiva()) pintarReunion(ultima);
    }
  }

  $('reunionSiguiente').onclick = () => mover(true);
  $('reunionAtras').onclick = () => mover(false);

  if (voz) {
    const boton = $('reunionEscuchar');
    boton.hidden = false;
    boton.onclick = () => {
      escuchando = !escuchando;
      boton.setAttribute('aria-pressed', String(escuchando));
      boton.textContent = escuchando ? '⏹ Dejar de escuchar' : '🔈 Escuchar';
      if (escuchando) leerMomentoActual();
      else pararVoz();
    };
  }

  function leerMomentoActual() {
    const p = posicion(ultima);
    const etapa = etapas[p.stageIndex];
    if (!p.started || !etapa) return;
    const textos = (pack.stages && pack.stages[etapa.id]) || {};
    leer(guionDeVoz(etapa.id, textos), idioma);
  }

  // ── Pintar la reunión ───────────────────────────────────

  function pintarCuerpo(cuerpo, id, textos, sala) {
    cuerpo.replaceChildren();
    if (textos.description) cuerpo.append(nodo('p', 'momento-desc', textos.description));

    if (id === 'reunion:opening_prayer' && textos.prayer) {
      cuerpo.append(nodo('p', 'oracion', textos.prayer));
    }

    if (id === 'reunion:sharing') {
      const ahora = quienComparte(sala);
      if (ahora) cuerpo.append(nodo('p', 'parte', t('roomSharing', { name: nombreDe(pack, ahora) })));
      for (const parte of textos.parts || []) {
        cuerpo.append(nodo('p', 'parte', `${parte.icon || ''} ${parte.title}`.trim()));
        for (const pregunta of parte.questions || []) cuerpo.append(nodo('p', 'pregunta', pregunta));
        if (parte.hint) cuerpo.append(nodo('p', 'ayuda', parte.hint));
      }
    }

    for (const pregunta of textos.questions || []) cuerpo.append(nodo('p', 'pregunta', pregunta));

    for (const paso of textos.steps || []) {
      cuerpo.append(nodo('p', 'parte', paso.title));
      if (paso.detail) cuerpo.append(nodo('p', 'ayuda', paso.detail));
      if (paso.prayer) cuerpo.append(nodo('p', 'oracion', paso.prayer));
    }
  }

  function pintarPresentes(sala) {
    const p = posicion(sala);
    const ahora = quienComparte(sala);
    const lista = $('reunionPresentes');
    lista.replaceChildren();
    for (const miembro of miembrosEnOrden(sala)) {
      const li = nodo('li', '', nombreDe(pack, miembro));
      if (miembro.uid === uid) li.classList.add('yo');
      if (ahora && ahora.uid === miembro.uid) li.classList.add('ahora');
      if (ahora && p.stageIndex === 1 && miembro.seq < p.completedTurns) li.classList.add('hecho');
      lista.append(li);
    }
    $('reunionPresentesTitulo').textContent = `${t('roomPresent')} · ${miembrosEnOrden(sala).length}`;
  }

  function pintarReunion(sala) {
    const yo = sala.members && sala.members[uid];
    if (!yo) return;
    const p = posicion(sala);
    const total = etapas.length || 4;

    $('reunionSala').textContent = `${t('roomTitle')} · ${t('roomCode', { code: codigo })}`;
    $('reunionSoy').textContent = t('roomYouAre', { name: nombreDe(pack, { ...yo }) });
    $('reunionNadiePreside').textContent = t('roomAnyone');
    pintarPresentes(sala);

    const siguienteBoton = $('reunionSiguiente');
    const atrasBoton = $('reunionAtras');
    atrasBoton.textContent = t('roomBack');
    atrasBoton.hidden = !puedeRetroceder(sala);
    atrasBoton.disabled = ocupado;
    siguienteBoton.disabled = ocupado;

    const tarjeta = $('reunionMomento');
    const cuerpo = $('reunionCuerpo');

    if (!p.started) {
      $('reunionTitulo').textContent = t('roomTitle');
      cuerpo.replaceChildren(nodo('p', 'momento-desc', t('roomWaiting')));
      $('reunionPaso').textContent = '';
      $('reunionBarra').style.width = '0%';
      $('reunionTuTurno').hidden = true;
      siguienteBoton.textContent = t('roomStart');
      momentoPintado = 'espera';
      if ($('viewReunion').hidden) mostrar('viewReunion');
      return;
    }

    const etapa = etapas[p.stageIndex];
    const textos = (etapa && pack.stages && pack.stages[etapa.id]) || {};
    $('reunionTitulo').textContent = textos.title || '';
    pintarCuerpo(cuerpo, etapa ? etapa.id : '', textos, sala);

    $('reunionPaso').textContent = `${p.stageIndex + 1} / ${total}`;
    $('reunionBarra').style.width = `${((p.stageIndex + 1) / total) * 100}%`;

    const ahora = quienComparte(sala);
    const tuTurno = $('reunionTuTurno');
    tuTurno.textContent = t('roomYourTurn');
    tuTurno.hidden = !(ahora && ahora.uid === uid);

    siguienteBoton.textContent = p.stageIndex >= total - 1 ? t('roomFinish') : t('roomNext');

    if ($('viewReunion').hidden) mostrar('viewReunion');

    const clave = `${p.stageIndex}`;
    if (clave !== momentoPintado) {
      momentoPintado = clave;
      tarjeta.classList.remove('cambio');
      void tarjeta.offsetWidth;
      tarjeta.classList.add('cambio');
      tarjeta.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (escuchando) leerMomentoActual();
    }
  }

  /** Pinta la sala. Devuelve false si la reunión ya no sigue. */
  function aplicar(sala) {
    ultima = sala;
    if (caducada(sala)) {
      mostrarFin(t('roomExpired') || 'Esta sala ha caducado.', 'Pide un enlace nuevo para la próxima reunión.', '⏳');
      return false;
    }
    if (posicion(sala).finished) {
      pararVoz();
      mostrarFin(t('roomFinished'), t('roomFinishedText'), '🌈');
      return false;
    }
    if (sala.members && sala.members[uid]) pintarReunion(sala);
    else pintarEleccion(sala);
    return true;
  }

  if (!aplicar(inicial)) return null;

  const cancelarEscucha = onSnapshot(
    ref,
    (snap) => {
      if (!sigueActiva()) return;
      if (!snap.exists()) {
        mostrarFin(t('roomFinished'), t('roomFinishedText'), '🌈');
        return;
      }
      aplicar(snap.data());
    },
    () => {
      const error = $('reunionError');
      error.textContent = 'Se ha perdido la conexión con la sala. Recarga la página para volver a entrar.';
      error.hidden = false;
    },
  );

  return () => {
    cancelarEscucha();
    pararVoz();
  };
}
