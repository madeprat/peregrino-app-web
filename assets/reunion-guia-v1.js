// Reunión de Grupo en la web: el guion gratuito de Peregrino APP.
//
// Usa el mismo contenido que la app y que la sala online
// (sala/reunion/reunion_fundamental_v1.json): la guía, los cuatro momentos
// y sus oraciones. Se sigue en un solo dispositivo, en persona. No guarda
// nada ni pide datos. La voz es la del navegador y es opcional.
//
// Idioma: el del traductor de la web si es portugués o inglés (las oraciones
// nunca se traducen a máquina); en otro caso, español.
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const raiz = $("rgApp");
  if (!raiz) return;

  const RUTA = new URL("../sala/reunion/reunion_fundamental_v1.json", document.currentScript.src);
  const VOCES = { es: "es-ES", pt: "pt-BR", en: "en-US" };
  const FIJOS = {
    es: { kicker: "Guion de la reunión", escuchar: "🔈 Escuchar", parar: "⏹ Dejar de escuchar", minutos: "unos {n} min", otra: "Volver al guion", error: "No hemos podido cargar el guion. Comprueba tu conexión y vuelve a intentarlo." },
    pt: { kicker: "Guião da reunião", escuchar: "🔈 Ouvir", parar: "⏹ Parar de ouvir", minutos: "cerca de {n} min", otra: "Voltar ao guião", error: "Não foi possível carregar o guião. Verifica a ligação e tenta de novo." },
    en: { kicker: "Reunion guide", escuchar: "🔈 Listen", parar: "⏹ Stop listening", minutos: "about {n} min", otra: "Back to the guide", error: "We couldn't load the guide. Check your connection and try again." },
  };

  let idioma = "es";
  try {
    const elegido = (localStorage.getItem("gTranslateLang") || "").slice(0, 2);
    if (elegido === "pt" || elegido === "en") idioma = elegido;
  } catch (_) { /* sin almacenamiento */ }
  const f = FIJOS[idioma];
  raiz.lang = idioma;

  const nodo = (etiqueta, clase, texto) => {
    const el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto != null) el.textContent = texto;
    return el;
  };

  // ── Voz (opcional) ───────────────────────────────────────
  const voz = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window ? window.speechSynthesis : null;
  let escuchando = false;
  const pararVoz = () => { if (voz) voz.cancel(); };
  function leer(frases) {
    if (!voz) return;
    voz.cancel();
    for (const frase of frases) {
      const limpia = String(frase || "").replace(/^[VR]\. /gm, "").replace(/[¡¿"“”]/g, "")
        .replace(/\s*\n\s*/g, ". ").replace(/\s+/g, " ").trim();
      if (!limpia) continue;
      const u = new SpeechSynthesisUtterance(limpia);
      u.lang = VOCES[idioma];
      u.rate = 0.95;
      voz.speak(u);
    }
  }

  fetch(RUTA, { credentials: "omit" })
    .then((r) => { if (!r.ok) throw new Error("guion"); return r.json(); })
    .then(montar)
    .catch(() => {
      raiz.replaceChildren(nodo("p", "rg-error", f.error));
    });

  function montar(contenido) {
    const pack = (contenido.languages && (contenido.languages[idioma] || contenido.languages.es)) || {};
    const etapas = contenido.stages || [];
    const label = (clave) => (pack.labels && pack.labels[clave]) || "";
    const guia = pack.guide || {};
    let actual = 0;

    // Portada: la guía de la app.
    $("rgKicker").textContent = f.kicker;
    $("rgTagline").textContent = guia.tagline || "";
    $("rgIntro").textContent = guia.intro || "";
    const claves = $("rgClaves");
    claves.replaceChildren(...(guia.keys || []).map((k) => nodo("li", "", k)));
    $("rgFuente").textContent = guia.source || "";
    $("rgEmpezar").textContent = label("roomStart");
    $("rgAtras").textContent = label("roomBack");
    $("rgFinTitulo").textContent = label("roomFinished");
    $("rgFinTexto").textContent = label("roomFinishedText");
    $("rgOtra").textContent = f.otra;

    const vistas = ["rgInicio", "rgMomento", "rgFin"];
    const mostrar = (id) => vistas.forEach((v) => { $(v).hidden = v !== id; });

    function cuerpoDe(id, t) {
      const cuerpo = [];
      if (t.description) cuerpo.push(nodo("p", "rg-desc", t.description));
      if (id === "reunion:opening_prayer" && t.prayer) cuerpo.push(nodo("p", "rg-oracion", t.prayer));
      for (const parte of t.parts || []) {
        cuerpo.push(nodo("p", "rg-parte", `${parte.icon || ""} ${parte.title}`.trim()));
        for (const q of parte.questions || []) cuerpo.push(nodo("p", "rg-pregunta", q));
        if (parte.hint) cuerpo.push(nodo("p", "rg-ayuda", parte.hint));
      }
      for (const q of t.questions || []) cuerpo.push(nodo("p", "rg-pregunta", q));
      for (const paso of t.steps || []) {
        cuerpo.push(nodo("p", "rg-parte", paso.title));
        if (paso.detail) cuerpo.push(nodo("p", "rg-ayuda", paso.detail));
        if (paso.prayer) cuerpo.push(nodo("p", "rg-oracion", paso.prayer));
      }
      return cuerpo;
    }

    function frasesDe(id, t) {
      const frases = [t.voice || t.title];
      if (id === "reunion:opening_prayer" && t.prayer) frases.push(t.prayer);
      for (const parte of t.parts || []) frases.push(parte.title, ...(parte.questions || []));
      for (const paso of t.steps || []) frases.push(paso.title, paso.detail, paso.prayer);
      return frases;
    }

    function pintar() {
      const etapa = etapas[actual];
      const t = (pack.stages && pack.stages[etapa.id]) || {};
      const total = etapas.length;
      $("rgBarra").style.width = `${((actual + 1) / total) * 100}%`;
      $("rgPaso").textContent = `${actual + 1} / ${total}` +
        (etapa.durationMinutes ? ` · ${f.minutos.replace("{n}", etapa.durationMinutes)}` : "");
      $("rgTitulo").textContent = t.title || "";
      $("rgCuerpo").replaceChildren(...cuerpoDe(etapa.id, t));
      $("rgSiguiente").textContent = actual >= total - 1 ? label("roomFinish") : label("roomNext");
      mostrar("rgMomento");
      raiz.scrollIntoView({ behavior: "smooth", block: "start" });
      if (escuchando) leer(frasesDe(etapa.id, t));
    }

    $("rgEmpezar").onclick = () => { actual = 0; pintar(); };
    $("rgAtras").onclick = () => {
      if (actual === 0) { pararVoz(); mostrar("rgInicio"); return; }
      actual -= 1; pintar();
    };
    $("rgSiguiente").onclick = () => {
      if (actual < etapas.length - 1) { actual += 1; pintar(); return; }
      pararVoz();
      mostrar("rgFin");
      raiz.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    $("rgOtra").onclick = () => { mostrar("rgInicio"); raiz.scrollIntoView({ behavior: "smooth", block: "start" }); };

    if (voz) {
      const boton = $("rgEscuchar");
      boton.hidden = false;
      boton.textContent = f.escuchar;
      boton.onclick = () => {
        escuchando = !escuchando;
        boton.setAttribute("aria-pressed", String(escuchando));
        boton.textContent = escuchando ? f.parar : f.escuchar;
        if (escuchando) {
          const etapa = etapas[actual];
          leer(frasesDe(etapa.id, (pack.stages && pack.stages[etapa.id]) || {}));
        } else pararVoz();
      };
    }

    mostrar("rgInicio");
  }
})();
