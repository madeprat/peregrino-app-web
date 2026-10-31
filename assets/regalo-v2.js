
(() => {
  const params = new URLSearchParams(location.search);
  const clean = (value,fallback) => String(value || "").replace(/[<>"'`]/g,"").replace(/\s+/g," ").trim().slice(0,42) || fallback;
  const nombreParam = params.get("nombre") || params.get("para") || params.get("n");
  const de = clean(params.get("de"), "");
  const tono = clean(params.get("tono") || params.get("luz"),"esperanza").toLowerCase();
  // Idioma de la oración regalada (?l=pt|en); por defecto, español.
  const lang = /^(pt|en)$/.test(params.get("l") || "") ? params.get("l") : "es";
  const T = {
    es: { alguien: "alguien especial", Alguien: "Alguien", firma: "alguien que te quiere bien", teRegala: (d) => `${d} te ha regalado una oración`,
          haQuerido: (d) => `${d} ha querido regalarte una oración.`, amen: "Amén.", carino: "Con cariño,", conCarino: (d) => `Con cariño, ${d}`, paraTi: (n) => `${n}, una oración para ti`, label: "Una oración para" },
    pt: { alguien: "alguém especial", Alguien: "Alguém", firma: "alguém que quer bem a você", teRegala: (d) => `${d} presenteou você com uma oração`,
          haQuerido: (d) => `${d} quis presentear você com uma oração.`, amen: "Amém.", carino: "Com carinho,", conCarino: (d) => `Com carinho, ${d}`, paraTi: (n) => `${n}, uma oração para você`, label: "Uma oração para" },
    en: { alguien: "someone special", Alguien: "Someone", firma: "someone who cares about you", teRegala: (d) => `${d} has given you a prayer`,
          haQuerido: (d) => `${d} wanted to give you a prayer.`, amen: "Amen.", carino: "With love,", conCarino: (d) => `With love, ${d}`, paraTi: (n) => `${n}, a prayer for you`, label: "A prayer for" }
  }[lang];
  const nombre = clean(nombreParam, T.alguien);
  const FIRMA = T.firma;

  // Catálogo: vive en la hoja de la Biblioteca (filas con columna «regalo»),
  // la misma fuente que usa la app. Cuatro momentos de la vida; cada oración
  // conserva su clave para los enlaces ya enviados.
  const MOMENTOS = [
    { id: "alma", nombre: "Para el alma" },
    { id: "dificil", nombre: "En lo difícil" },
    { id: "etapa", nombre: "Para una etapa" },
    { id: "celebrar", nombre: "Para celebrar" }
  ];
  // Si la hoja no responde, al menos una bendición (Nm 6,24-26).
  const RESERVA = {
    es: { nombre: "Bendición", sub: "para cualquier momento", text: "Que el Señor te bendiga y te guarde. Que haga brillar su rostro sobre ti y te conceda su gracia.\n\nQue el Señor te muestre su rostro y te conceda la paz." },
    pt: { nombre: "Bênção", sub: "para qualquer momento", text: "Que o Senhor abençoe você e o guarde. Que faça brilhar sobre você a sua face e lhe conceda a sua graça.\n\nQue o Senhor volte para você o seu rosto e lhe dê a paz." },
    en: { nombre: "Blessing", sub: "for any moment", text: "May the Lord bless you and keep you. May the Lord make his face shine on you and be gracious to you.\n\nMay the Lord look upon you kindly and give you peace." }
  };
  let CATALOGO = [];
  const templates = {};
  const grupoDe = {};

  async function cargarCatalogo() {
    const O = window.PeregrinoOracion;
    const res = await fetch(O.CSV_URL, { cache: "no-store", credentials: "omit" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const filas = O.parseDelimited(await res.text()).filter((f) => O.clean(f.regalo));
    const campo = (f, es, pt, en) => O.clean(lang === "pt" ? f[pt] : lang === "en" ? f[en] : "") || O.clean(f[es]);
    const grupos = MOMENTOS.map((m) => ({ id: m.id, nombre: m.nombre, tonos: [] }));
    filas
      .sort((a, b) => (parseInt(a.orden, 10) || 0) - (parseInt(b.orden, 10) || 0))
      .forEach((f) => {
        const grupo = grupos.find((g) => g.id === O.clean(f.regalo_momento).toLowerCase()) || grupos[0];
        const text = campo(f, "texto_es", "texto_portugues", "texto_ingles") || O.clean(f.texto);
        if (!text) return;
        grupo.tonos.push({
          clave: O.clean(f.regalo).toLowerCase(),
          nombre: campo(f, "titulo", "titulo_portuges", "titulo_ingles"),
          sub: campo(f, "subtitulo", "subtitulo_portuges", "subtitulo_ingles"),
          text
        });
      });
    return grupos.filter((g) => g.tonos.length);
  }

  const creando = document.body.dataset.modo === "crear";
  let deActual = de;
  let nombreActual = nombre, tonoActual = tono;
  let selected = null;
  let fullPrayer = "";

  function pintar() {
    selected = templates[tonoActual];
    fullPrayer = `${nombreActual},\n\n${T.haQuerido(deActual || T.Alguien)}\n\n${selected.text}\n\n${T.amen}` +
      (deActual ? `\n\n${T.conCarino(deActual)}` : "");
    document.getElementById("cardTitle").textContent = nombreActual;
    document.getElementById("cardFrom").textContent = deActual || FIRMA;
    document.getElementById("prayerText").textContent = selected.text;
  }

  function iniciar() {
  CATALOGO.forEach((g) => g.tonos.forEach((t) => { templates[t.clave] = t; grupoDe[t.clave] = g.id; }));
  if (!templates[tonoActual]) tonoActual = templates.esperanza ? "esperanza" : CATALOGO[0].tonos[0].clave;
  document.querySelector(".prayer-card .amen").textContent = T.amen;
  document.querySelector(".prayer-card .label").textContent = T.label;
  document.querySelector(".prayer-card .from").firstChild.textContent = T.carino;
  if (!creando) {
    document.title = `${T.paraTi(nombre)} | Peregrino APP`;
    document.getElementById("sobreNombre").textContent = nombre;
    document.getElementById("sobreDe").textContent = T.teRegala(de || T.Alguien);
    pintar();

    // Abrir el sobre: la tarjeta aparece con calma.
    document.getElementById("abrirSobre").addEventListener("click", () => {
      document.body.classList.add("sobre-abierto");
      window.scrollTo(0, 0);
      document.querySelector(".prayer-card")?.focus({ preventScroll: true });
    });

    // Responder con otra oración: la página de crear, ya rellenada.
    const devolver = document.getElementById("devolver");
    if (de) {
      devolver.textContent = `Regalarle una oración a ${de}`;
      const url = new URL("regalo-de-oracion.html", location.href);
      url.searchParams.set("a", de);
      if (nombre !== T.alguien) url.searchParams.set("yo", nombre);
      devolver.href = url.href;
    }
  } else {
    // Crear: la tarjeta de la derecha se actualiza mientras se escribe.
    const input = document.getElementById("nombreRegalo");
    const caja = document.getElementById("tonos");
    const remitente = document.getElementById("remitenteRegalo");
    // Al devolver una oración llegan rellenados el destinatario y la firma.
    input.value = clean(params.get("a"), "");
    remitente.value = clean(params.get("yo"), "");
    nombreActual = T.alguien;
    const enlace = () => {
      const url = new URL("regalo-de-oracion.html", location.href);
      url.search = "";
      url.searchParams.set("nombre", input.value.trim() ? nombreActual : T.alguien);
      if (lang !== "es") url.searchParams.set("l", lang);
      url.searchParams.set("tono", tonoActual);
      if (deActual) url.searchParams.set("de", deActual);
      return url.href;
    };
    const actualizar = () => {
      nombreActual = clean(input.value, T.alguien);
      deActual = clean(remitente.value, "");
      pintar();
      const link = enlace();
      document.getElementById("crearVer").href = link;
      document.getElementById("crearWhats").href = "https://wa.me/?text=" + encodeURIComponent(`Hoy pensé en ti y quise dejarte una pequeña luz:\n${link}`);
    };
    // Momentos arriba; dentro, solo las oraciones de ese momento.
    const momentos = document.createElement("div");
    momentos.className = "gift-momentos";
    momentos.setAttribute("role", "tablist");
    caja.before(momentos);
    const pintarTonos = (grupoId) => {
      caja.replaceChildren();
      [...momentos.children].forEach((m) => m.setAttribute("aria-selected", String(m.dataset.grupo === grupoId)));
      CATALOGO.find((g) => g.id === grupoId).tonos.forEach((t) => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "gift-tono";
        boton.setAttribute("aria-pressed", String(t.clave === tonoActual));
        boton.innerHTML = "<strong></strong><small></small>";
        boton.querySelector("strong").textContent = t.nombre;
        boton.querySelector("small").textContent = t.sub;
        boton.addEventListener("click", () => {
          tonoActual = t.clave;
          [...caja.children].forEach((b) => b.setAttribute("aria-pressed", String(b === boton)));
          actualizar();
        });
        caja.appendChild(boton);
      });
    };
    CATALOGO.forEach((g) => {
      const m = document.createElement("button");
      m.type = "button";
      m.className = "gift-momento";
      m.setAttribute("role", "tab");
      m.dataset.grupo = g.id;
      m.textContent = g.nombre;
      m.addEventListener("click", () => pintarTonos(g.id));
      momentos.appendChild(m);
    });
    pintarTonos(grupoDe[tonoActual]);
    input.addEventListener("input", actualizar);
    remitente.addEventListener("input", actualizar);
    document.getElementById("crearCopiar").addEventListener("click", () => copyText(enlace(), "Enlace copiado"));
    actualizar();
  }

  }

  cargarCatalogo()
    .then((grupos) => { CATALOGO = grupos.length ? grupos : null; })
    .catch(() => { CATALOGO = null; })
    .then(() => {
      if (!CATALOGO) {
        const r = RESERVA[lang];
        CATALOGO = [{ id: "alma", nombre: MOMENTOS[0].nombre, tonos: [{ clave: "bendicion", nombre: r.nombre, sub: r.sub, text: r.text }] }];
      }
      iniciar();
    });

  function showToast(message) {
    const toast = document.getElementById("toast"); toast.textContent=message || "Copiado"; toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"),1700);
  }
  function copyText(text, aviso) {
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => showToast(aviso));
    else {
      const area=document.createElement("textarea"); area.value=text; area.style.position="fixed"; area.style.left="-9999px";
      document.body.appendChild(area); area.focus(); area.select(); document.execCommand("copy"); area.remove(); showToast(aviso);
    }
  }
  document.getElementById("copyPrayer").addEventListener("click",() => copyText(fullPrayer, "Oración copiada"));

  function wrap(ctx,text,x,y,maxWidth,lineHeight) {
    const words=text.split(" "); let line="",currentY=y;
    words.forEach((word) => {
      const test=line+word+" ";
      if (ctx.measureText(test).width>maxWidth && line) { ctx.fillText(line.trim(),x,currentY); line=word+" "; currentY+=lineHeight; }
      else line=test;
    });
    ctx.fillText(line.trim(),x,currentY); return currentY+lineHeight;
  }
  function buildCard() {
    const canvas=document.createElement("canvas"); canvas.width=1080; canvas.height=1350; const ctx=canvas.getContext("2d");
    const gradient=ctx.createLinearGradient(0,0,0,1350); gradient.addColorStop(0,"#fffaf0"); gradient.addColorStop(.55,"#f4ecd7"); gradient.addColorStop(1,"#fff");
    ctx.fillStyle=gradient; ctx.fillRect(0,0,1080,1350); ctx.strokeStyle="rgba(200,148,26,.45)"; ctx.lineWidth=3; ctx.strokeRect(46,46,988,1258);
    ctx.beginPath(); ctx.arc(540,210,62,0,Math.PI*2);
    const seal=ctx.createRadialGradient(515,188,8,540,210,62); seal.addColorStop(0,"#fff4bf"); seal.addColorStop(.6,"#d8ac34"); seal.addColorStop(1,"#a6720b");
    ctx.fillStyle=seal; ctx.fill(); ctx.fillStyle="#33210a"; ctx.font="64px Georgia, serif"; ctx.textAlign="center"; ctx.fillText("✝",540,234);
    ctx.fillStyle="#c8941a"; ctx.font="700 26px Arial, sans-serif"; ctx.fillText(T.label.toUpperCase().split("").join(" ").replace(/   /g,"   "),540,330);
    ctx.fillStyle="#102b55"; ctx.font="600 92px \"Cormorant Garamond\", Georgia, serif"; ctx.fillText(nombreActual.length>16?nombreActual.slice(0,16)+"…":nombreActual,540,430);
    ctx.strokeStyle="rgba(200,148,26,.5)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(420,478);ctx.lineTo(660,478);ctx.stroke();
    ctx.fillStyle="#1f3327";ctx.font="italic 44px \"Cormorant Garamond\", Georgia, serif";const endY=wrap(ctx,selected.text.replace(/\n+/g," "),540,560,820,58);
    ctx.fillStyle="#c8941a";ctx.font="italic 600 50px \"Cormorant Garamond\", Georgia, serif";ctx.fillText(T.amen,540,Math.min(endY+30,1180));
    if (deActual) { ctx.fillStyle="#536176";ctx.font="italic 600 40px \"Cormorant Garamond\", Georgia, serif";ctx.fillText(T.conCarino(deActual),540,Math.min(endY+92,1212)); }
    ctx.fillStyle="rgba(27,33,27,.55)";ctx.font="700 28px Arial, sans-serif";ctx.fillText("✦  Peregrino APP",540,1262);
    return canvas;
  }
  async function shareImage() {
    try { await document.fonts.ready; } catch (_) { /* sin API de fuentes */ }
    buildCard().toBlob((blob) => {
      if (!blob) { showToast("No se pudo crear la imagen"); return; }
      const file=new File([blob],"oracion-peregrino.png",{type:"image/png"});
      if (navigator.canShare && navigator.canShare({files:[file]})) { navigator.share({files:[file]}).catch(()=>{}); return; }
      const anchor=document.createElement("a");anchor.href=URL.createObjectURL(blob);anchor.download="oracion-peregrino.png";anchor.click();
      setTimeout(() => URL.revokeObjectURL(anchor.href),400);
      showToast("Imagen guardada");
    },"image/png");
  }
  document.getElementById("shareImg").addEventListener("click",shareImage);
})();
