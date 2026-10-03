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

  const TEMAS = [
    { titulo: "Por los enfermos", sub: "sanación y compañía", oracion: "Señor Jesús, acompaña a quienes sienten dolor, miedo o cansancio. Lleva consuelo a sus cuerpos y paz a sus familias. Que nadie se sienta solo en la noche. Amén." },
    { titulo: "Por mi familia", sub: "unidad y ternura", oracion: "Señor, bendice mi hogar y a los que quiero. Danos paciencia y paz, sana las heridas pequeñas y grandes, y enséñanos a cuidarnos mejor. Amén." },
    { titulo: "Por quien vive un duelo", sub: "consuelo en la ausencia", oracion: "Señor de la Vida, abraza a quienes lloran una ausencia. Que tu luz entre despacio en su tristeza y que la esperanza no se apague. Amén." },
    { titulo: "Por los jóvenes", sub: "sentido y esperanza", oracion: "Señor, acompaña sus búsquedas y sus heridas. Pon en su camino amistades buenas y una esperanza que no dependa del ruido del mundo. Amén." },
    { titulo: "Por quien busca trabajo", sub: "puertas y dignidad", oracion: "Señor, abre caminos donde parece no haber salida. Sostén la dignidad de quien espera una oportunidad y bendice el esfuerzo de cada familia. Amén." },
    { titulo: "Por los candidatos a Cursillo", sub: "corazones abiertos", oracion: "Señor, prepara sus corazones con delicadeza. Que se sepan amados y descubran una fe viva para caminar el Cuarto Día. Amén." },
    { titulo: "Por la paz en el mundo", sub: "paz y misericordia", oracion: "Señor, mira a los pueblos que sufren violencia, pobreza o miedo. Despierta solidaridad y protege a los más vulnerables. Amén." },
    { titulo: "En acción de gracias", sub: "por lo recibido", oracion: "Señor, gracias por los dones visibles e invisibles, por quienes sostienen mi camino y por la luz que vuelve incluso tras los días difíciles. Amén." },
  ];
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
