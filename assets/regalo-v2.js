
(() => {
  const params = new URLSearchParams(location.search);
  const clean = (value,fallback) => String(value || "").replace(/[<>"'`]/g,"").replace(/\s+/g," ").trim().slice(0,42) || fallback;
  const nombre = clean(params.get("nombre") || params.get("para") || params.get("n"),"alguien especial");
  const FIRMA = "alguien que te quiere bien";
  const de = clean(params.get("de"), "");
  const tono = clean(params.get("tono") || params.get("luz"),"esperanza").toLowerCase();
  const templates = {
    paz:{label:"paz",text:"Que el Señor ponga paz en tu corazón, serenidad en tus pensamientos y descanso en todo lo que hoy llevas por dentro.\n\nQue, en medio del ruido, puedas sentir una luz pequeña pero fiel acompañando tu camino."},
    fortaleza:{label:"fortaleza",text:"Que el Señor te sostenga en lo difícil, te regale paciencia para atravesar cada paso y te recuerde que ningún esfuerzo hecho con amor se pierde.\n\nQue Cristo camine contigo y fortalezca tu corazón."},
    esperanza:{label:"esperanza",text:"Que el Señor ilumine tu camino con esperanza. Que donde haya cansancio vuelva a nacer una pequeña alegría, y donde haya incertidumbre aparezca una señal de luz.\n\nNo caminas solo. Tu vida está en manos de Dios."},
    consuelo:{label:"consuelo",text:"Que el Señor te abrace con ternura en todo lo que hoy pesa. Que encuentres consuelo, compañía y una paz suave que no borra la historia, pero ayuda a respirar.\n\nQue la Virgen te cubra con su manto y te acompañe."},
    gratitud:{label:"gratitud",text:"Gracias, Señor, por su vida, por el bien que ha sembrado y por la luz que deja en quienes le quieren.\n\nBendice su camino, sus alegrías, sus luchas y todo lo que guarda en el corazón."}
  };
  const TONOS = {
    paz: "para un corazón cansado", fortaleza: "para seguir adelante", esperanza: "para mirar con luz",
    consuelo: "para una etapa difícil", gratitud: "para bendecir su vida"
  };
  const creando = document.body.dataset.modo === "crear";
  let deActual = de;
  let nombreActual = nombre, tonoActual = templates[tono] ? tono : "esperanza";
  let selected = templates[tonoActual];
  let fullPrayer = "";

  function pintar() {
    selected = templates[tonoActual];
    fullPrayer = `${nombreActual},\n\n${deActual || "alguien"} ha querido regalarte una oración.\n\n${selected.text}\n\nAmén.` +
      (deActual ? `\n\nCon cariño, ${deActual}` : "");
    document.getElementById("cardTitle").textContent = nombreActual;
    document.getElementById("cardFrom").textContent = deActual || FIRMA;
    document.getElementById("prayerText").textContent = selected.text;
  }

  if (!creando) {
    document.title = `${nombre}, una oración para ti | Peregrino APP`;
    document.getElementById("sobreNombre").textContent = nombre;
    document.getElementById("sobreDe").textContent = `${de || "Alguien"} te ha regalado una oración`;
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
      if (nombre !== "alguien especial") url.searchParams.set("yo", nombre);
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
    nombreActual = "alguien especial";
    const enlace = () => {
      const url = new URL("regalo-de-oracion.html", location.href);
      url.search = "";
      url.searchParams.set("nombre", input.value.trim() ? nombreActual : "alguien especial");
      url.searchParams.set("tono", tonoActual);
      if (deActual) url.searchParams.set("de", deActual);
      return url.href;
    };
    const actualizar = () => {
      nombreActual = clean(input.value, "alguien especial");
      deActual = clean(remitente.value, "");
      pintar();
      const link = enlace();
      document.getElementById("crearVer").href = link;
      document.getElementById("crearWhats").href = "https://wa.me/?text=" + encodeURIComponent(`Hoy pensé en ti y quise dejarte una pequeña luz:\n${link}`);
    };
    Object.entries(TONOS).forEach(([clave, sub]) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "gift-tono";
      boton.setAttribute("aria-pressed", String(clave === tonoActual));
      boton.innerHTML = "<strong></strong><small></small>";
      boton.querySelector("strong").textContent = clave.charAt(0).toUpperCase() + clave.slice(1);
      boton.querySelector("small").textContent = sub;
      boton.addEventListener("click", () => {
        tonoActual = clave;
        [...caja.children].forEach((b) => b.setAttribute("aria-pressed", String(b === boton)));
        actualizar();
      });
      caja.appendChild(boton);
    });
    input.addEventListener("input", actualizar);
    remitente.addEventListener("input", actualizar);
    document.getElementById("crearCopiar").addEventListener("click", () => copyText(enlace(), "Enlace copiado"));
    actualizar();
  }

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
    ctx.fillStyle="#c8941a"; ctx.font="700 26px Arial, sans-serif"; ctx.fillText("U N A   O R A C I Ó N   P A R A",540,330);
    ctx.fillStyle="#102b55"; ctx.font="600 92px \"Cormorant Garamond\", Georgia, serif"; ctx.fillText(nombreActual.length>16?nombreActual.slice(0,16)+"…":nombreActual,540,430);
    ctx.strokeStyle="rgba(200,148,26,.5)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(420,478);ctx.lineTo(660,478);ctx.stroke();
    ctx.fillStyle="#1f3327";ctx.font="italic 44px \"Cormorant Garamond\", Georgia, serif";const endY=wrap(ctx,selected.text.replace(/\n+/g," "),540,560,820,58);
    ctx.fillStyle="#c8941a";ctx.font="italic 600 50px \"Cormorant Garamond\", Georgia, serif";ctx.fillText("Amén.",540,Math.min(endY+30,1180));
    if (deActual) { ctx.fillStyle="#536176";ctx.font="italic 600 40px \"Cormorant Garamond\", Georgia, serif";ctx.fillText(`Con cariño, ${deActual}`,540,Math.min(endY+92,1212)); }
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
