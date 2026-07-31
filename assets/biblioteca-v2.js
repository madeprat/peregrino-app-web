
(() => {
  "use strict";
  const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRP8CBTj_hONpVId_i6C_qaKRR4eOM0my7oJ8OvB3f_TAi5OTymTeMu99L5JTnJOQlBqvJSv-1UZjVB/pub?gid=833946696&single=true&output=csv";
  const elements = {
    search: document.getElementById("prayerSearch"), clearSearch: document.getElementById("clearSearch"),
    count: document.getElementById("resultCount"), categories: document.getElementById("categoryStrip"),
    status: document.getElementById("libraryStatus"), grid: document.getElementById("prayerGrid"),
    dialog: document.getElementById("downloadDialog"), closeDialog: document.getElementById("closeDialog"),
    dialogPrayerName: document.getElementById("dialogPrayerName"), dialogInstructions: document.getElementById("dialogInstructions"),
    toast: document.getElementById("toast")
  };
  const state = { prayers:[], filtered:[], query:"", category:"Todas" };
  const normalize = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
  const clean = (value) => String(value ?? "").replace(/^\uFEFF/,"").replace(/\r\n?/g,"\n").trim();

  function detectDelimiter(text) {
    const firstLine = text.split(/\r?\n/,1)[0] || "";
    let best = ",", bestCount = -1;
    for (const candidate of [",",";","\t"]) {
      let count = 0, quoted = false;
      for (let i=0;i<firstLine.length;i++) {
        const char = firstLine[i];
        if (char === '"') {
          if (quoted && firstLine[i+1] === '"') i++;
          else quoted = !quoted;
        } else if (!quoted && char === candidate) count++;
      }
      if (count > bestCount) { best = candidate; bestCount = count; }
    }
    return best;
  }
  function parseDelimited(text) {
    const delimiter = detectDelimiter(text), rows = [];
    let row = [], field = "", quoted = false;
    for (let i=0;i<text.length;i++) {
      const char = text[i];
      if (quoted) {
        if (char === '"') {
          if (text[i+1] === '"') { field += '"'; i++; } else quoted = false;
        } else field += char;
      } else if (char === '"') quoted = true;
      else if (char === delimiter) { row.push(field); field = ""; }
      else if (char === "\n") { row.push(field); rows.push(row); row=[]; field=""; }
      else if (char !== "\r") field += char;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    const nonEmpty = rows.filter((item) => item.some((value) => clean(value) !== ""));
    if (nonEmpty.length < 2) return [];
    const headers = nonEmpty[0].map((header) => clean(header).toLowerCase());
    return nonEmpty.slice(1).map((values) => {
      const record = {};
      headers.forEach((header,index) => record[header] = clean(values[index] ?? ""));
      return record;
    });
  }
  function isPublishable(row) {
    const include = normalize(row.incluir), confidence = normalize(row.confianza_idioma), revision = normalize(row.revision);
    if (["no","false","0"].includes(include)) return false;
    if (!clean(row.id) || !clean(row.titulo) || !clean(row.texto)) return false;
    if (confidence === "baja" || revision.includes("error")) return false;
    return true;
  }
  const parseOrder = (value) => {
    const number = Number.parseInt(String(value ?? "").trim(),10);
    return Number.isFinite(number) ? number : Number.MAX_SAFE_INTEGER;
  };
  function toPrayer(row) {
    const category = clean(row.categoria) || "Otras oraciones";
    return {
      id:clean(row.id), title:clean(row.titulo), subtitle:clean(row.subtitulo), text:clean(row.texto),
      category, source:clean(row.fuente) || "Biblioteca Peregrino", order:parseOrder(row.orden),
      searchText:normalize([row.titulo,row.titulo_latin,row.subtitulo,row.categoria,row.fuente].join(" "))
    };
  }
  function renderCategories() {
    const categories = ["Todas", ...new Set(state.prayers.map((p) => p.category))].sort((a,b) => a === "Todas" ? -1 : b === "Todas" ? 1 : a.localeCompare(b,"es",{sensitivity:"base"}));
    elements.categories.innerHTML = "";
    categories.forEach((category) => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "category-button"; button.textContent = category;
      button.setAttribute("aria-pressed",String(category === state.category));
      button.addEventListener("click",() => { state.category = category; renderCategories(); applyFilters(); });
      elements.categories.appendChild(button);
    });
  }
  function createPrayerCard(prayer) {
    const article = document.createElement("article"); article.className = "prayer-card";
    const category = document.createElement("span"); category.className = "prayer-category"; category.textContent = prayer.category;
    const title = document.createElement("h2"); title.textContent = prayer.title;
    article.append(category,title);
    if (prayer.subtitle) { const subtitle = document.createElement("p"); subtitle.className = "prayer-subtitle"; subtitle.textContent = prayer.subtitle; article.appendChild(subtitle); }
    const source = document.createElement("p"); source.className = "prayer-source"; source.textContent = prayer.source;
    const button = document.createElement("button"); button.type = "button"; button.className = "prayer-download"; button.textContent = "Descargar para Peregrino";
    button.addEventListener("click",() => downloadPrayer(prayer,button));
    article.append(source,button); return article;
  }
  function renderPrayers() {
    elements.grid.innerHTML = "";
    if (!state.filtered.length) {
      elements.grid.hidden = true; elements.status.hidden = false;
      elements.status.innerHTML = '<div class="status-card"><strong>No hemos encontrado ninguna oración</strong><span>Prueba con otro término o categoría.</span></div>';
      return;
    }
    const fragment = document.createDocumentFragment();
    state.filtered.forEach((prayer) => fragment.appendChild(createPrayerCard(prayer)));
    elements.grid.appendChild(fragment); elements.status.hidden = true; elements.grid.hidden = false;
  }
  function updateCount() {
    const amount = state.filtered.length, total = state.prayers.length;
    elements.count.innerHTML = amount === total ? `<strong>${total}</strong> oracion${total === 1 ? "" : "es"} disponibles` : `<strong>${amount}</strong> de ${total} oraciones`;
  }
  function applyFilters() {
    const query = normalize(state.query);
    state.filtered = state.prayers.filter((prayer) =>
      (state.category === "Todas" || prayer.category === state.category) &&
      (!query || prayer.searchText.includes(query))
    );
    updateCount(); renderPrayers();
  }
  const slugify = (value) => normalize(value).replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || "oracion";
  function buildPayload(prayer) {
    const now = new Date().toISOString();
    return { kind:"devociones_propias", schemaVersion:1, app:"Peregrino APP", exportedAt:now, items:[{
      id:prayer.id,titulo:prayer.title,subtitulo:prayer.subtitle || prayer.category,texto:prayer.text,
      esFavorita:false,fechaCreacion:now,fechaActualizacion:now
    }]};
  }
  function triggerFileDownload(file) {
    const url = URL.createObjectURL(file), anchor = document.createElement("a");
    anchor.href=url; anchor.download=file.name; anchor.style.display="none"; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url),1500);
  }
  const isProbablyMobile = () => window.matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  function showDownloadDialog(prayer) {
    elements.dialogPrayerName.textContent = `«${prayer.title}» se ha preparado en un archivo compatible con Peregrino APP.`;
    elements.dialogInstructions.innerHTML = isProbablyMobile()
      ? "<li>Abre las descargas del navegador.</li><li>Toca el archivo terminado en <strong>.json</strong>.</li><li>Elige Peregrino APP y confirma que quieres añadir la oración.</li>"
      : "<li>Localiza el archivo descargado en tu ordenador.</li><li>Envíatelo al móvil por WhatsApp, correo o Drive.</li><li>En el móvil, abre el archivo con Peregrino APP.</li>";
    if (elements.dialog.showModal) elements.dialog.showModal(); else showToast("La oración se ha descargado correctamente.");
  }
  async function downloadPrayer(prayer,button) {
    const original = button.textContent; button.disabled=true; button.textContent="Preparando…";
    try {
      const content = JSON.stringify(buildPayload(prayer),null,2);
      const file = new File([content],`${slugify(prayer.title)}.peregrino.json`,{type:"application/json;charset=utf-8"});
      triggerFileDownload(file); showDownloadDialog(prayer);
    } catch (error) { console.error(error); showToast("No se pudo preparar esta oración."); }
    finally { button.disabled=false; button.textContent=original; }
  }
  let toastTimer;
  function showToast(message) {
    clearTimeout(toastTimer); elements.toast.textContent=message; elements.toast.classList.add("is-visible");
    toastTimer=setTimeout(() => elements.toast.classList.remove("is-visible"),3800);
  }
  function showLoadError(error) {
    console.error(error); elements.grid.hidden=true; elements.status.hidden=false; elements.count.textContent="Biblioteca no disponible";
    elements.status.innerHTML='<div class="status-card"><strong>No hemos podido cargar las oraciones</strong><span>Comprueba tu conexión y vuelve a intentarlo.</span><button class="button button-primary" id="retryLibrary" type="button">Reintentar</button></div>';
    document.getElementById("retryLibrary")?.addEventListener("click",loadLibrary);
  }
  async function loadLibrary() {
    elements.grid.hidden=true; elements.status.hidden=false;
    elements.status.innerHTML='<div class="status-card"><div class="spinner"></div><strong>Cargando las oraciones</strong><span>Preparando la biblioteca…</span></div>';
    try {
      const response = await fetch(CSV_URL,{cache:"no-store",credentials:"omit"});
      if (!response.ok) throw new Error(`Respuesta HTTP ${response.status}`);
      const prayers = parseDelimited(await response.text()).filter(isPublishable).map(toPrayer).sort((a,b) => a.order !== b.order ? a.order-b.order : a.title.localeCompare(b.title,"es",{sensitivity:"base"}));
      if (!prayers.length) throw new Error("La hoja no contiene entradas publicables.");
      state.prayers=prayers; state.filtered=prayers; state.category="Todas"; renderCategories(); applyFilters();
    } catch (error) { showLoadError(error); }
  }
  elements.search.addEventListener("input",(event) => { state.query=event.target.value; elements.clearSearch.style.display=state.query.length ? "grid" : "none"; applyFilters(); });
  elements.clearSearch.addEventListener("click",() => { state.query=""; elements.search.value=""; elements.clearSearch.style.display="none"; elements.search.focus(); applyFilters(); });
  elements.closeDialog.addEventListener("click",() => elements.dialog.close());
  elements.dialog.addEventListener("click",(event) => {
    const rectangle=elements.dialog.getBoundingClientRect();
    if (event.clientX<rectangle.left || event.clientX>rectangle.right || event.clientY<rectangle.top || event.clientY>rectangle.bottom) elements.dialog.close();
  });
  loadLibrary();
})();
