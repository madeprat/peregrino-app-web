// Portada revista: fecha de la edición y oración del día.
//
// La oración del día sale de la misma hoja publicada que usa la Biblioteca y
// cambia cada día (la misma para todas las personas ese día). Si la hoja no
// responde, se usa una pequeña selección propia.
(() => {
  "use strict";

  const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRP8CBTj_hONpVId_i6C_qaKRR4eOM0my7oJ8OvB3f_TAi5OTymTeMu99L5JTnJOQlBqvJSv-1UZjVB/pub?gid=833946696&single=true&output=csv";
  const MAX_CARACTERES = 340;

  const RESERVA = [
    { titulo: "Ofrecimiento del día", categoria: "Oraciones de la mañana",
      texto: "Señor, te ofrezco este día: mis pensamientos, mis palabras y mis obras. Que todo lo que haga sea para tu gloria y para el bien de quienes me rodean. Amén." },
    { titulo: "Ven, Espíritu Santo", categoria: "Espíritu Santo",
      texto: "Ven, Espíritu Santo, llena los corazones de tus fieles y enciende en ellos el fuego de tu amor. Envía tu Espíritu y todo será creado, y renovarás la faz de la tierra." },
    { titulo: "Alma de Cristo", categoria: "Oraciones eucarísticas",
      texto: "Alma de Cristo, santifícame. Cuerpo de Cristo, sálvame. Sangre de Cristo, embriágame. Agua del costado de Cristo, lávame. Pasión de Cristo, confórtame. Oh, buen Jesús, óyeme." },
    { titulo: "Oración de la paz", categoria: "Oraciones de siempre",
      texto: "Señor, hazme un instrumento de tu paz: donde haya odio, que yo ponga amor; donde haya ofensa, perdón; donde haya discordia, unión; donde haya duda, fe." },
  ];

  const hoy = new Date();

  // ── Fecha de la edición ────────────────────────────────────────────────
  const fecha = document.getElementById("rvFecha");
  if (fecha) {
    try {
      fecha.textContent = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(hoy);
      fecha.dateTime = hoy.toISOString().slice(0, 10);
    } catch (_) {
      fecha.hidden = true;
    }
  }

  // ── Oración del día ────────────────────────────────────────────────────
  const el = {
    titulo: document.getElementById("rvOracionTitulo"),
    texto: document.getElementById("rvOracionTexto"),
    categoria: document.getElementById("rvOracionCategoria"),
  };
  if (!el.titulo || !el.texto) return;

  // Número de día estable (mismo valor para todo el día, en hora local).
  const numeroDeDia = Math.floor(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) / 86400000);

  const limpiar = (v) => String(v ?? "").replace(/^﻿/, "").replace(/\r\n?/g, "\n").trim();
  const normalizar = (v) => limpiar(v).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  function extracto(texto) {
    const t = limpiar(texto).replace(/[ \t]+/g, " ");
    if (t.length <= MAX_CARACTERES) return t;
    const corte = t.slice(0, MAX_CARACTERES);
    const fin = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf(".\n"), corte.lastIndexOf("; "));
    return (fin > 120 ? corte.slice(0, fin + 1) : corte.replace(/\s+\S*$/, "") + "…");
  }

  function mostrar(oracion) {
    el.titulo.textContent = oracion.titulo;
    el.texto.textContent = extracto(oracion.texto);
    if (el.categoria) el.categoria.textContent = oracion.categoria || "";
  }

  // Lector CSV mínimo (comillas, separador coma, punto y coma o tabulador).
  function leerCSV(texto) {
    const primera = texto.split(/\r?\n/, 1)[0] || "";
    const sep = [",", ";", "\t"].reduce((a, b) => (primera.split(b).length > primera.split(a).length ? b : a), ",");
    const filas = [];
    let fila = [], campo = "", entreComillas = false;
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (entreComillas) {
        if (c === '"') {
          if (texto[i + 1] === '"') { campo += '"'; i++; } else entreComillas = false;
        } else campo += c;
      } else if (c === '"') entreComillas = true;
      else if (c === sep) { fila.push(campo); campo = ""; }
      else if (c === "\n") { fila.push(campo); filas.push(fila); fila = []; campo = ""; }
      else if (c !== "\r") campo += c;
    }
    if (campo.length || fila.length) { fila.push(campo); filas.push(fila); }
    const utiles = filas.filter((f) => f.some((v) => limpiar(v)));
    if (utiles.length < 2) return [];
    const cab = utiles[0].map((h) => limpiar(h).toLowerCase());
    return utiles.slice(1).map((v) => Object.fromEntries(cab.map((h, i) => [h, limpiar(v[i])])));
  }

  // Mismos criterios de publicación que la Biblioteca.
  function publicable(r) {
    if (["no", "false", "0"].includes(normalizar(r.incluir))) return false;
    if (!limpiar(r.id) || !limpiar(r.titulo) || !limpiar(r.texto)) return false;
    if (normalizar(r.confianza_idioma) === "baja" || normalizar(r.revision).includes("error")) return false;
    return true;
  }

  mostrar(RESERVA[numeroDeDia % RESERVA.length]);

  if (!("fetch" in window)) return;
  const control = "AbortController" in window ? new AbortController() : null;
  const espera = setTimeout(() => control && control.abort(), 8000);

  fetch(CSV_URL, { cache: "no-store", credentials: "omit", signal: control ? control.signal : undefined })
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
    .then((csv) => {
      const oraciones = leerCSV(csv)
        .filter(publicable)
        .sort((a, b) => limpiar(a.id).localeCompare(limpiar(b.id)));
      if (!oraciones.length) return;
      const elegida = oraciones[numeroDeDia % oraciones.length];
      mostrar({ titulo: limpiar(elegida.titulo), texto: elegida.texto, categoria: limpiar(elegida.categoria) });
    })
    .catch(() => { /* se queda la oración de reserva */ })
    .finally(() => clearTimeout(espera));
})();
