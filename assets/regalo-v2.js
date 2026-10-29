
(() => {
  const params = new URLSearchParams(location.search);
  const clean = (value,fallback) => String(value || "").replace(/[<>"'`]/g,"").replace(/\s+/g," ").trim().slice(0,42) || fallback;
  const nombre = clean(params.get("nombre") || params.get("para") || params.get("n"),"alguien especial");
  const FIRMA = "alguien que te quiere bien";
  const de = clean(params.get("de"), "");
  const tono = clean(params.get("tono") || params.get("luz"),"esperanza").toLowerCase();
  // Catálogo: cuatro momentos de la vida; cada oración conserva su clave para los enlaces ya enviados.
  const CATALOGO = [
    { id: "alma", nombre: "Para el alma", tonos: [
      { clave: "paz", nombre: "Paz", sub: "para un corazón cansado", text: "Que el Señor ponga paz en tu corazón, serenidad en tus pensamientos y descanso en todo lo que hoy llevas por dentro.\n\nQue, en medio del ruido, puedas sentir una luz pequeña pero fiel acompañando tu camino." },
      { clave: "esperanza", nombre: "Esperanza", sub: "para mirar con luz", text: "Que el Señor ilumine tu camino con esperanza. Que donde haya cansancio vuelva a nacer una pequeña alegría, y donde haya incertidumbre aparezca una señal de luz.\n\nNo caminas solo. Tu vida está en manos de Dios." },
      { clave: "fortaleza", nombre: "Fortaleza", sub: "para seguir adelante", text: "Que el Señor te sostenga en lo difícil, te regale paciencia para atravesar cada paso y te recuerde que ningún esfuerzo hecho con amor se pierde.\n\nQue Cristo camine contigo y fortalezca tu corazón." },
      { clave: "alegria", nombre: "Alegría", sub: "para que nada la apague", text: "Que el Señor guarde tu alegría y la haga crecer. Que sepas reconocer sus regalos en lo pequeño de cada día: una mesa compartida, una risa, una mañana con luz.\n\nQue tu alegría sea contagiosa para quienes te rodean." },
      { clave: "descanso", nombre: "Descanso", sub: "para las noches largas", text: "Que el Señor calme tus pensamientos cuando la noche se hace larga. Que puedas dejar en sus manos lo que no está en las tuyas y dormir confiando en que Él vela.\n\nMañana también estará contigo." },
      { clave: "compania", nombre: "Compañía", sub: "para quien se siente a solas", text: "Que sientas hoy que no estás a solas. Que Dios, que conoce tu nombre, te haga notar su cercanía en un gesto, una voz o una llamada inesperada.\n\nY que sepas que alguien te lleva en el corazón y en la oración." },
      { clave: "busqueda", nombre: "Búsqueda", sub: "para quien busca sentido", text: "Que el Dios que sale al encuentro te encuentre en tu búsqueda, sin prisas y sin presiones. Que halles respuestas, o al menos buenas preguntas, y personas que caminen a tu lado.\n\nLa puerta siempre está abierta." }
    ]},
    { id: "dificil", nombre: "En lo difícil", tonos: [
      { clave: "consuelo", nombre: "Consuelo", sub: "para una etapa difícil", text: "Que el Señor te abrace con ternura en todo lo que hoy pesa. Que encuentres consuelo, compañía y una paz suave que no borra la historia, pero ayuda a respirar.\n\nQue la Virgen te cubra con su manto y te acompañe." },
      { clave: "salud", nombre: "Salud", sub: "para cuerpo y ánimo", text: "Que el Señor, que pasó por el mundo curando y acompañando, se acerque a ti en este tiempo de enfermedad. Que te dé alivio, buenos cuidados y fuerza para cada día.\n\nNo lo llevas a solas: muchos rezamos contigo." },
      { clave: "duelo", nombre: "Duelo", sub: "para quien echa de menos", text: "Que el Señor sostenga tu corazón en esta ausencia. Que el amor compartido siga vivo y se vuelva memoria agradecida.\n\nConfiamos a quien se ha ido a la misericordia de Dios, y a ti, a su consuelo. Que la Virgen, que también lloró, te acompañe." },
      { clave: "reconciliacion", nombre: "Reconciliación", sub: "para sanar un vínculo", text: "Que el Señor sane lo que se ha herido y te regale un corazón capaz de perdonar y de dejarse perdonar. Que las palabras justas lleguen a su tiempo.\n\nQue la paz vuelva a tu casa y a tus vínculos." },
      { clave: "decision", nombre: "Discernimiento", sub: "para una decisión", text: "Que el Espíritu Santo ilumine tu decisión. Que te dé calma para escuchar, claridad para ver y valentía para elegir el bien.\n\nQue la paz interior te confirme el camino y sepas que Dios va contigo." },
      { clave: "trabajo", nombre: "Trabajo", sub: "para el pan de cada día", text: "Que san José, hombre trabajador y fiel, interceda por ti. Que encuentres un trabajo digno, puertas que se abran y personas que confíen en lo que vales.\n\nQue no te falten el pan ni la esperanza." }
    ]},
    { id: "etapa", nombre: "Para una etapa", tonos: [
      { clave: "comienzo", nombre: "Nuevo comienzo", sub: "para lo que empieza", text: "Que el Señor bendiga este nuevo comienzo. Que lo nuevo no te dé miedo, que encuentres buenas personas en el camino y que lo vivido hasta hoy te sirva de raíz.\n\nQue Dios abra el camino delante de ti." },
      { clave: "estudios", nombre: "Estudios", sub: "para exámenes y esfuerzo", text: "Que el Espíritu Santo te dé memoria serena, mente clara y constancia en el esfuerzo. Que estudies con calma y te presentes con confianza.\n\nY que, salga como salga, recuerdes que vales mucho más que una nota." },
      { clave: "viaje", nombre: "Buen camino", sub: "para un viaje", text: "Que el Señor te acompañe en este viaje. Que tu ángel de la guarda vaya contigo, que el camino sea seguro y el regreso, alegre.\n\nComo a Tobías, que Dios te guíe y te devuelva a casa en paz." },
      { clave: "cuidar", nombre: "Quien cuida", sub: "para quien cuida a otros", text: "Que el Señor cuide de ti, que tanto cuidas. Que te regale descanso, ternura para los días largos y personas que también te sostengan.\n\nCada gesto de cuidado que haces, Él lo recibe como hecho a sí mismo." },
      { clave: "espera", nombre: "Dulce espera", sub: "para una vida que viene", text: "Que el Señor bendiga la vida que crece dentro de ti. Que este tiempo de espera esté lleno de paz, salud y ternura.\n\nQue la Virgen María, que también esperó con amor, acompañe cada día hasta el encuentro." },
      { clave: "anos", nombre: "Años vividos", sub: "para una vida larga", text: "Que el Señor bendiga tus años y la sabiduría que has ido guardando. Que no te falten compañía, salud ni motivos para sonreír.\n\nQue tus manos sigan bendiciendo y tu historia siga dando fruto." }
    ]},
    { id: "celebrar", nombre: "Para celebrar", tonos: [
      { clave: "gratitud", nombre: "Gratitud", sub: "para bendecir su vida", text: "Gracias, Señor, por su vida, por el bien que ha sembrado y por la luz que deja en quienes le quieren.\n\nBendice su camino, sus alegrías, sus luchas y todo lo que guarda en el corazón." },
      { clave: "cumpleanos", nombre: "Cumpleaños", sub: "para un año más", text: "Que el Señor bendiga este nuevo año de tu vida. Que te regale salud, buenos amigos, sueños que se cumplan y la certeza de que eres un regalo.\n\n¡Feliz cumpleaños! Dios sigue contando contigo." },
      { clave: "nacimiento", nombre: "Bienvenida", sub: "para una vida recién llegada", text: "Que el Señor bendiga tu vida recién estrenada. Que crezcas entre brazos que te quieran, con salud, alegría y una fe que te ilumine.\n\nQue tu ángel de la guarda nunca se aparte de tu lado." },
      { clave: "boda", nombre: "Amor", sub: "para un sí para siempre", text: "Que el Señor bendiga este amor y lo haga fuerte en los días fáciles y en los difíciles. Que el hogar que nace sea lugar de perdón, de risa y de puertas abiertas.\n\nQue Dios sea el tercer hilo de este cordón que no se rompe." },
      { clave: "sacramento", nombre: "Un gran día", sub: "bautizo, comunión, confirmación", text: "Que el Señor llene de gracia este día tan especial. Que lo que hoy recibes eche raíces y florezca toda tu vida.\n\nQue Jesús sea siempre tu mejor amigo y el Espíritu Santo, tu fuerza." },
      { clave: "navidad", nombre: "Navidad", sub: "para estas fiestas", text: "Que el Niño Dios nazca en tu casa y en tu corazón. Que estas fiestas te traigan paz, reencuentros y una alegría sencilla, como la de Belén.\n\n¡Feliz Navidad! Que su luz te acompañe todo el año." }
    ]}
  ];
  const templates = {};
  const grupoDe = {};
  CATALOGO.forEach((g) => g.tonos.forEach((t) => { templates[t.clave] = t; grupoDe[t.clave] = g.id; }));
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
