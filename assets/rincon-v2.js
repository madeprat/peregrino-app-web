
(() => {
  const appUrl = location.origin + location.pathname.replace(/rincon-de-la-luz\.html.*$/, "");
  const STORAGE_ALIAS = "peregrino_luz_alias";
  const $ = (id) => document.getElementById(id);
  const clean = (value, fallback) =>
    String(value || "").replace(/[<>"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, 40) || fallback;
  function toast(message) {
    const element = $("toast");
    element.textContent = message || "Copiado";
    element.classList.add("show");
    setTimeout(() => element.classList.remove("show"), 1600);
  }
  function copy(text) {
    if (!text) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => toast("Copiado"));
    } else {
      const area = document.createElement("textarea");
      area.value = text; document.body.appendChild(area); area.select();
      document.execCommand("copy"); area.remove(); toast("Copiado");
    }
  }
  const wa = (text) => "https://wa.me/?text=" + encodeURIComponent(text);

  const topics = [
    { title:"Por los enfermos", sub:"sanación y compañía", text:"Hoy he encendido una velita por los enfermos.\n\nSeñor Jesús, acompaña a quienes sienten dolor, miedo o cansancio. Lleva consuelo a sus cuerpos y paz a sus familias. Que nadie se sienta solo en la noche. Amén." },
    { title:"Por las familias", sub:"unidad y ternura", text:"Hoy he encendido una velita por las familias.\n\nSeñor, bendice los hogares que necesitan paciencia y paz. Sana las heridas pequeñas y grandes, y enséñanos a cuidar mejor a quienes tenemos cerca. Amén." },
    { title:"Por quien vive un duelo", sub:"consuelo en la ausencia", text:"Hoy he encendido una velita por quienes viven un duelo.\n\nSeñor de la Vida, abraza a quienes lloran una ausencia. Que tu luz entre despacio en su tristeza y que la esperanza no se apague. Amén." },
    { title:"Por los jóvenes", sub:"sentido y esperanza", text:"Hoy he encendido una velita por los jóvenes.\n\nSeñor, acompaña sus búsquedas y sus heridas. Pon en su camino amistades buenas y una esperanza que no dependa del ruido del mundo. Amén." },
    { title:"Por quien busca trabajo", sub:"puertas y dignidad", text:"Hoy he encendido una velita por quienes buscan trabajo.\n\nSeñor, abre caminos donde parece no haber salida. Sostén la dignidad de quien espera una oportunidad y bendice el esfuerzo de cada familia. Amén." },
    { title:"Por los candidatos a Cursillo", sub:"corazones abiertos", text:"Hoy he encendido una velita por los candidatos a Cursillo.\n\nSeñor, prepara sus corazones con delicadeza. Que se sepan amados y descubran una fe viva para caminar el Cuarto Día. Amén." },
    { title:"Por el mundo que sufre", sub:"paz y misericordia", text:"Hoy he encendido una velita por las situaciones que hieren al mundo.\n\nSeñor, mira a los pueblos que sufren violencia, pobreza o miedo. Despierta solidaridad y protege a los más vulnerables. Amén." },
    { title:"En acción de gracias", sub:"por lo recibido", text:"Hoy he encendido una velita en acción de gracias.\n\nSeñor, gracias por los dones visibles e invisibles, por quienes sostienen el camino y por la luz que vuelve incluso tras los días difíciles. Amén." }
  ];
  const tones = {
    paz:{ label:"Paz", sub:"para un corazón cansado" },
    fortaleza:{ label:"Fortaleza", sub:"para seguir adelante" },
    esperanza:{ label:"Esperanza", sub:"para mirar con luz" },
    consuelo:{ label:"Consuelo", sub:"para una etapa difícil" },
    gratitud:{ label:"Gratitud", sub:"para bendecir su vida" }
  };
  const luces = [
    "Hoy Dios te mira con ternura. No estás caminando solo.",
    "Lo que siembras en silencio, Él lo ve y lo multiplica.",
    "Respira. La paz que buscas ya está empezando en ti.",
    "No tienes que poder con todo hoy. Basta dar el siguiente paso.",
    "Eres amado tal como eres, no como crees que deberías ser.",
    "La luz pequeña también alumbra. La tuya importa.",
    "Después de la noche, la mañana siempre vuelve. Confía.",
    "Dios escribe derecho. Lo que hoy no entiendes, mañana será camino.",
    "Tu nombre está escrito en la palma de su mano."
  ];
  const wallBase = ["Por quienes empiezan","Por mi familia","Por quien necesita paz","Por quien busca sentido","Por los que sostienen el camino","Por una amiga en dificultad","Por los enfermos","En acción de gracias","Por los jóvenes","Por quien vive un duelo","Peregrino en camino","Por la paz"];
  let selectedTone = "paz";

  const topicBox = $("topicOptions");
  topics.forEach((topic) => {
    const button = document.createElement("button");
    button.className = "chip"; button.type = "button";
    button.innerHTML = `${topic.title}<small>${topic.sub}</small>`;
    button.addEventListener("click", () => {
      [...topicBox.children].forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      $("velitaTitle").textContent = topic.title;
      $("velitaText").textContent = topic.text;
      $("velitaWhats").href = wa(`${topic.text}\n\nMe uno a esta oración desde Peregrino APP: ${appUrl}`);
      $("velitaResult").classList.add("show");
    });
    topicBox.appendChild(button);
  });

  const toneBox = $("toneOptions");
  Object.entries(tones).forEach(([key, tone]) => {
    const button = document.createElement("button");
    button.className = `chip${key === "paz" ? " active" : ""}`;
    button.type = "button";
    button.innerHTML = `${tone.label}<small>${tone.sub}</small>`;
    button.addEventListener("click", () => {
      selectedTone = key;
      [...toneBox.children].forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
    toneBox.appendChild(button);
  });

  let pendingCard = false;
  function createCard() {
    const name = clean($("nombreRegalo").value, "alguien especial");
    $("nombreRegalo").value = name;
    const url = new URL("regalo-de-oracion.html", location.href);
    url.searchParams.set("nombre", name); url.searchParams.set("tono", selectedTone); url.searchParams.set("origen", "luz");
    const link = url.href;
    $("tarjetaPreview").textContent = `${name}, tu bendición ya está lista: una oración preparada con cariño, esperando llegar a sus manos.`;
    $("verTarjeta").href = link;
    $("tarjetaWhats").href = wa(`Hoy pensé en ti y quise dejarte una pequeña luz:\n${link}`);
    $("tarjetaResult").classList.add("show");
    pendingCard = false;
  }
  $("crearTarjeta").addEventListener("click", () => {
    if (document.body.dataset.memberMode !== "member") {
      const dialog = document.querySelector(".member-dialog");
      if (dialog?.showModal) {
        pendingCard = true;
        dialog.showModal(); document.body.classList.add("dialog-open");
        return;
      }
    }
    createCard();
  });
  document.querySelector(".dialog-continue")?.addEventListener("click", () => {
    if (pendingCard) setTimeout(createCard, 0);
  });
  document.querySelector(".dialog-enable-member")?.addEventListener("click", () => {
    if (pendingCard) setTimeout(createCard, 0);
  });

  function newLight() {
    const lamp = $("lamp"); lamp.classList.remove("spin"); void lamp.offsetWidth; lamp.classList.add("spin");
    const text = luces[Math.floor(Math.random() * luces.length)];
    setTimeout(() => {
      $("azarText").textContent = `“${text}”`;
      $("azarWhats").href = wa(`${text}\n\nUna luz desde Peregrino APP: ${appUrl}`);
      $("azarActions").style.display = "flex";
    }, 300);
  }
  $("lamp").addEventListener("click", newLight);
  $("otraLuz").addEventListener("click", newLight);

  const now = new Date();
  const month = new Intl.DateTimeFormat("es-ES", { month:"long", year:"numeric" }).format(now);
  $("monthLabel").textContent = `Oración de ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
  const monthText = "Señor Jesús,\n\neste mes te encomendamos a quienes sostienen Peregrino APP, a sus familias y a las intenciones que llevan en silencio.\n\nBendice sus caminos, multiplica el bien que siembran y concédeles paz, fortaleza y esperanza para vivir cada día con amor.\n\nAmén.";
  $("monthlyText").textContent = monthText;
  $("monthlyWhats").href = wa(`${monthText}\n\nMe uno a esta oración desde Peregrino APP: ${appUrl}`);
  $("unirmeMes").addEventListener("click", () => toast("Gracias por unirte a la oración mensual 🌙"));

  function renderWall() {
    const alias = localStorage.getItem(STORAGE_ALIAS);
    const names = alias ? [alias, ...wallBase] : wallBase;
    const box = $("wallNames"); box.innerHTML = "";
    names.slice(0, 12).forEach((name, index) => {
      const note = document.createElement("div");
      note.className = `note${alias && index === 0 ? " me" : ""}`;
      note.textContent = name; box.appendChild(note);
    });
  }
  function saveAlias(value) {
    const alias = clean(value, "Anónimo");
    localStorage.setItem(STORAGE_ALIAS, alias);
    $("aliasMuro").value = alias; renderWall(); toast("Tu intención está en el muro");
  }
  $("guardarAlias").addEventListener("click", () => saveAlias($("aliasMuro").value));
  $("aliasAnonimo").addEventListener("click", () => saveAlias("Anónimo"));
  renderWall();

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-copy]");
    if (!button) return;
    const element = $(button.getAttribute("data-copy"));
    copy(element ? element.textContent : "");
  });
})();
