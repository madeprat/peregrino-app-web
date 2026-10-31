// Rincón de la Luz: encender una velita.
//
// La persona elige una intención (o la escribe), enciende la vela y reza una
// oración breve. La velita "arde" hasta el final del día: si vuelve a la
// página ese día, la encuentra encendida. Todo se guarda solo en este
// dispositivo (localStorage "peregrinoVelita"); no se envía a ningún sitio.
(() => {
  "use strict";

  const KEY = "peregrinoVelita";
  const $ = (id) => document.getElementById(id);
  const enlaceRincon = new URL("rincon-de-la-luz.html", location.href).href;

  // Las intenciones viven en la hoja de la Biblioteca (filas con la columna
  // «velita»), la misma fuente que usa la app.
  let TEMAS = [];
  const oracionPropia = (intencion) =>
    `Señor, enciendo esta luz ante ti ${intencion.replace(/[.\s]+$/, "")}.\n\nTú conoces lo que llevo en el corazón: recíbelo, cuídalo y haz en todo tu voluntad. Que esta pequeña llama sea mi oración mientras arde. Amén.`;

  const el = {
    elegir: $("velitaElegir"), temas: $("velitaTemas"), propia: $("velitaPropia"), encender: $("velitaEncender"),
    encendida: $("velitaEncendida"), por: $("velitaPor"), oracion: $("velitaOracion"), arde: $("velitaArde"),
    whats: $("velitaWhats"), otra: $("velitaOtra"),
  };
  if (!el.elegir || !el.temas) return;

  function leer() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "null");
      return v && v.hasta > Date.now() ? v : null;
    } catch (_) { return null; }
  }
  function guardar(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (_) { /* sin almacenamiento */ } }
  function borrar() { try { localStorage.removeItem(KEY); } catch (_) { /* sin almacenamiento */ } }

  let tema = -1;
  function actualizarBoton() { el.encender.disabled = tema < 0 && !el.propia.value.trim(); }

  function pintarTemas() {
    TEMAS.forEach((t, i) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "velita-tema";
      boton.setAttribute("aria-pressed", "false");
      boton.innerHTML = `<strong></strong><small></small>`;
      boton.querySelector("strong").textContent = t.titulo;
      boton.querySelector("small").textContent = t.sub;
      boton.addEventListener("click", () => {
        tema = tema === i ? -1 : i;
        [...el.temas.children].forEach((b, k) => b.setAttribute("aria-pressed", String(k === tema)));
        if (tema >= 0) el.propia.value = "";
        actualizarBoton();
      });
      el.temas.appendChild(boton);
    });
  }
  (async () => {
    try {
      const O = window.PeregrinoOracion;
      const res = await fetch(O.CSV_URL, { cache: "no-store", credentials: "omit" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      TEMAS = O.parseDelimited(await res.text())
        .filter((f) => O.clean(f.velita) && O.clean(f.titulo) && O.clean(f.texto))
        .sort((x, y) => (parseInt(x.orden, 10) || 0) - (parseInt(y.orden, 10) || 0))
        .map((f) => ({ titulo: O.clean(f.titulo), sub: O.clean(f.subtitulo), oracion: O.clean(f.texto_es) || O.clean(f.texto) }));
    } catch (_) { TEMAS = []; /* sin conexión: queda escribirla con tus palabras */ }
    pintarTemas();
  })();

  el.propia.addEventListener("input", () => {
    if (el.propia.value.trim() && tema >= 0) {
      tema = -1;
      [...el.temas.children].forEach((b) => b.setAttribute("aria-pressed", "false"));
    }
    actualizarBoton();
  });
  el.propia.addEventListener("keydown", (event) => { if (event.key === "Enter" && !el.encender.disabled) el.encender.click(); });

  function mostrar(v, recien) {
    el.elegir.hidden = true;
    el.encendida.hidden = false;
    el.encendida.classList.toggle("is-recien", Boolean(recien));
    el.por.textContent = v.por;
    el.oracion.textContent = v.oracion;
    el.arde.textContent = recien ? "Tu velita arderá hasta esta noche." : "Tu velita sigue encendida hasta esta noche.";
    const mensaje = v.tipo === "tema"
      ? `Hoy he encendido una velita ${v.por.charAt(0).toLowerCase()}${v.por.slice(1)}.\n\n${v.oracion}\n\n¿Rezas conmigo? ${enlaceRincon}`
      : `Hoy he encendido una velita en el Rincón de la Luz. ¿Rezas conmigo? ${enlaceRincon}`;
    el.whats.href = "https://wa.me/?text=" + encodeURIComponent(mensaje);
    if (recien) el.encendida.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  el.encender.addEventListener("click", () => {
    const propia = el.propia.value.replace(/\s+/g, " ").trim();
    if (tema < 0 && !propia) return;
    const finDelDia = new Date(); finDelDia.setHours(23, 59, 59, 999);
    const v = tema >= 0
      ? { tipo: "tema", por: TEMAS[tema].titulo, oracion: TEMAS[tema].oracion, hasta: finDelDia.getTime() }
      : { tipo: "propia", por: propia.charAt(0).toUpperCase() + propia.slice(1), oracion: oracionPropia(/^(por|para|en)\b/i.test(propia) ? propia.charAt(0).toLowerCase() + propia.slice(1) : `por ${propia}`), hasta: finDelDia.getTime() };
    guardar(v);
    mostrar(v, true);
  });

  el.otra.addEventListener("click", () => {
    borrar();
    tema = -1;
    el.propia.value = "";
    [...el.temas.children].forEach((b) => b.setAttribute("aria-pressed", "false"));
    actualizarBoton();
    el.encendida.hidden = true;
    el.elegir.hidden = false;
    el.temas.firstElementChild?.focus({ preventScroll: true });
  });

  const guardada = leer();
  if (guardada) mostrar(guardada, false);
})();
