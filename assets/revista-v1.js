// Portada revista: fecha de la edición y oración del día.
//
// La oración del día sale de la misma hoja publicada que usa la Biblioteca
// (assets/oracion-v1.js) y cambia cada día: la misma para todas las personas
// ese día. Si la hoja no responde, se queda la oración escrita en la portada.
(() => {
  "use strict";

  const MAX_CARACTERES = 340;

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
  // Se reza en el idioma de cada persona (es, pt, en o la) con las mismas
  // etiquetas que la Biblioteca, y se puede cambiar de idioma en la tarjeta.
  const O = window.PeregrinoOracion;
  const el = {
    tarjeta: document.getElementById("rvOracion"),
    idiomas: document.getElementById("rvOracionIdiomas"),
    titulo: document.getElementById("rvOracionTitulo"),
    texto: document.getElementById("rvOracionTexto"),
    categoria: document.getElementById("rvOracionCategoria"),
    enlace: document.getElementById("rvOracionEnlace"),
  };
  if (!O || !el.titulo || !el.texto) return;

  // Número de día estable (mismo valor para todo el día, en hora local).
  const numeroDeDia = Math.floor(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) / 86400000);

  function recortar(texto) {
    const t = texto.replace(/[ \t]+/g, " ");
    const corte = t.slice(0, MAX_CARACTERES);
    const fin = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf(".\n"), corte.lastIndexOf("; "));
    return fin > 120 ? corte.slice(0, fin + 1) : corte.replace(/\s+\S*$/, "") + "…";
  }

  // Los primeros bloques de la oración, hasta unos MAX_CARACTERES.
  function extracto(bloques) {
    const elegidos = [];
    let total = 0, cortado = false;
    for (const bloque of bloques) {
      if (bloque.type === "silence" || (bloque.type === "heading" && !elegidos.length)) continue;
      if (total + bloque.text.length > MAX_CARACTERES) {
        if (!elegidos.length) elegidos.push({ ...bloque, text: recortar(bloque.text) });
        cortado = true;
        break;
      }
      elegidos.push(bloque);
      total += bloque.text.length;
    }
    while (elegidos.length && elegidos[elegidos.length - 1].type === "heading") { elegidos.pop(); cortado = true; }
    return { elegidos, cortado };
  }

  let oracion = null;
  let idioma = O.preferredLang();

  function pintarIdiomas() {
    el.idiomas.innerHTML = "";
    O.LANGS.filter((l) => O.hasLang(oracion, l.code)).forEach((l) => {
      const boton = O.el("button", "rv-oracion-idioma", l.badge);
      boton.type = "button";
      boton.title = l.label;
      boton.setAttribute("aria-label", l.label);
      boton.setAttribute("aria-pressed", String(l.code === idioma));
      boton.addEventListener("click", () => {
        if (l.code === idioma) return;
        idioma = l.code;
        O.savePreferredLang(l.code);
        pintar();
      });
      el.idiomas.appendChild(boton);
    });
    el.idiomas.hidden = el.idiomas.childElementCount < 2;
  }

  function pintar() {
    idioma = O.bestLang(oracion, idioma);
    const variante = oracion.variants[idioma];
    pintarIdiomas();
    el.titulo.textContent = variante.title;
    el.titulo.lang = idioma;
    el.texto.lang = idioma;
    el.texto.innerHTML = "";
    const { elegidos, cortado } = extracto(O.parseBlocks(variante.text));
    O.renderBlockList(elegidos, el.texto);
    if (cortado) el.texto.appendChild(O.el("p", "rv-oracion-sigue", "…"));
    if (el.categoria) el.categoria.textContent = oracion.category;
    if (el.enlace) {
      el.enlace.href = O.prayerHref(oracion, idioma);
      el.enlace.firstChild.textContent = cortado ? "Seguir rezándola en la Biblioteca " : "Abrirla en la Biblioteca ";
    }
  }

  // Solo lectura, como en la Biblioteca.
  O.protect({ zone: el.tarjeta || el.texto, isActive: () => false, appHref: "#app" });

  if (!("fetch" in window)) return;
  const control = "AbortController" in window ? new AbortController() : null;
  const espera = setTimeout(() => control && control.abort(), 8000);

  O.loadPrayers({ signal: control ? control.signal : undefined })
    .then((oraciones) => {
      const lista = oraciones.filter((o) => O.hasLang(o, "es")).sort((a, b) => a.id.localeCompare(b.id));
      if (!lista.length) return;
      oracion = lista[numeroDeDia % lista.length];
      pintar();
    })
    .catch(() => { /* se queda la oración de reserva */ })
    .finally(() => clearTimeout(espera));
})();
