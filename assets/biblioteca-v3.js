// Biblioteca de oraciones de Peregrino en la web.
//
// Lee la misma hoja publicada que la Biblioteca de la app
// (lib/services/biblioteca_online_service.dart) con sus mismas reglas:
// - una fila es una oración y lleva sus cuatro variantes (es, pt, en, la);
// - se publica si "incluir" no es no, tiene id, la confianza no es baja y la
//   revisión no marca error;
// - en cada idioma solo aparecen las oraciones con título y texto.
//
// La lectura de la hoja, las etiquetas de oración y la protección de solo
// lectura viven en assets/oracion-v1.js, compartido con la portada.
//
// Aquí la oración solo se lee y se reza: no se descarga, ni se comparte, ni
// se copia. El texto usa las etiquetas semánticas de la app
// ([heading], [rubric], [V], [R], [speaker=Coro A]…), interpretadas igual
// que en lib/prayer_engine/devotion_markup_parser.dart.
(() => {
  "use strict";

  const O = window.PeregrinoOracion;
  const { LANGS, LANG_CODES, LANG_KEY, langInfo, normalize, el, storageGet, storageSet, hasLang, bestLang, parseBlocks, renderBlock, renderBlockList } = O;
  const SIZE_KEY = "peregrinoBibliotecaLetra";

  const $ = (id) => document.getElementById(id);
  const elements = {
    search: $("prayerSearch"), clearSearch: $("clearSearch"), count: $("resultCount"),
    langs: $("languageSwitch"), categories: $("categoryStrip"), status: $("libraryStatus"), grid: $("prayerGrid"),
    reader: $("prayerReader"), readerClose: $("readerClose"), readerLangs: $("readerLanguages"),
    readerCompare: $("readerCompare"), readerSmaller: $("readerSmaller"), readerBigger: $("readerBigger"),
    readerScroll: $("readerScroll"), readerCategory: $("readerCategory"), readerTitle: $("readerTitle"),
    readerAka: $("readerAka"), readerSubtitle: $("readerSubtitle"), readerBody: $("readerBody"),
    readerPrev: $("readerPrev"), readerNext: $("readerNext")
  };

  const state = {
    prayers: [], filtered: [], query: "", category: "Todas", lang: initialLanguage(),
    reader: { prayer: null, lang: "es", compare: "" }, size: readSize()
  };

  function initialLanguage() {
    const fromHash = parseHash();
    if (fromHash && LANG_CODES.includes(fromHash.lang)) return fromHash.lang;
    return O.preferredLang();
  }
  function readSize() {
    const value = Number.parseFloat(storageGet(SIZE_KEY));
    return Number.isFinite(value) && value >= 0.85 && value <= 1.6 ? value : 1;
  }

  // ---------- listado ----------
  function renderLanguageSwitch() {
    elements.langs.innerHTML = "";
    LANGS.forEach((lang) => {
      const button = el("button", "lang-button");
      button.type = "button";
      button.setAttribute("aria-pressed", String(lang.code === state.lang));
      button.innerHTML = `<b>${lang.badge}</b><span>${lang.label}</span>`;
      button.addEventListener("click", () => setLanguage(lang.code));
      elements.langs.appendChild(button);
    });
  }
  function setLanguage(code) {
    if (!LANG_CODES.includes(code) || code === state.lang) return;
    state.lang = code; storageSet(LANG_KEY, code);
    renderLanguageSwitch(); applyFilters();
  }
  function renderCategories() {
    const categories = ["Todas", ...new Set(state.prayers.map((p) => p.category))].sort((a, b) => a === "Todas" ? -1 : b === "Todas" ? 1 : a.localeCompare(b, "es", { sensitivity: "base" }));
    elements.categories.innerHTML = "";
    categories.forEach((category) => {
      const button = el("button", "category-button", category);
      button.type = "button";
      button.setAttribute("aria-pressed", String(category === state.category));
      button.addEventListener("click", () => { state.category = category; renderCategories(); applyFilters(); });
      elements.categories.appendChild(button);
    });
  }
  function otherTitles(prayer, lang) {
    const own = normalize(prayer.variants[lang]?.title);
    const seen = new Set([own]), titles = [];
    LANG_CODES.filter((code) => code !== lang && hasLang(prayer, code)).forEach((code) => {
      const title = prayer.variants[code].title, key = normalize(title);
      if (!seen.has(key)) { seen.add(key); titles.push({ code, title }); }
    });
    return titles;
  }
  function fillAka(container, prayer, lang) {
    container.innerHTML = "";
    otherTitles(prayer, lang).forEach(({ code, title }, index) => {
      if (index) container.append(" · ");
      const span = el("span", "", title); span.lang = code; container.appendChild(span);
    });
    container.hidden = !container.childNodes.length;
  }
  function createPrayerCard(prayer) {
    const lang = state.lang, variant = prayer.variants[lang];
    const article = el("article", "prayer-card");
    article.appendChild(el("span", "prayer-category", prayer.category));
    const title = el("h2", "notranslate", variant.title);
    title.lang = lang; title.translate = false;
    article.appendChild(title);
    const aka = el("p", "prayer-aka notranslate"); aka.translate = false;
    fillAka(aka, prayer, lang);
    article.appendChild(aka);
    if (variant.subtitle) article.appendChild(el("p", "prayer-subtitle", variant.subtitle));

    const footer = el("div", "prayer-actions");
    const pray = el("button", "prayer-open", "Leer y rezar");
    pray.type = "button";
    pray.addEventListener("click", () => openReader(prayer, lang));
    const chips = el("div", "prayer-langs");
    chips.setAttribute("role", "group");
    chips.setAttribute("aria-label", "Rezar en otro idioma");
    LANGS.filter((l) => hasLang(prayer, l.code)).forEach((l) => {
      const chip = el("button", "prayer-lang", l.badge);
      chip.type = "button";
      chip.title = `Rezar en ${l.label}`;
      chip.setAttribute("aria-label", `Rezar en ${l.label}`);
      if (l.code === lang) chip.setAttribute("aria-current", "true");
      chip.addEventListener("click", () => openReader(prayer, l.code));
      chips.appendChild(chip);
    });
    footer.append(pray, chips);
    article.appendChild(footer);
    // Toda la tarjeta abre la oración; los botones conservan su propio idioma.
    article.addEventListener("click", (event) => { if (!event.target.closest("button")) openReader(prayer, lang); });
    return article;
  }
  function renderPrayers() {
    elements.grid.innerHTML = "";
    if (!state.filtered.length) {
      elements.grid.hidden = true; elements.status.hidden = false;
      elements.status.innerHTML = '<div class="status-card"><strong>No hemos encontrado ninguna oración</strong><span>Prueba con otro término, otra categoría u otro idioma.</span></div>';
      return;
    }
    const fragment = document.createDocumentFragment();
    state.filtered.forEach((prayer) => fragment.appendChild(createPrayerCard(prayer)));
    elements.grid.appendChild(fragment); elements.status.hidden = true; elements.grid.hidden = false;
  }
  function updateCount() {
    const amount = state.filtered.length, total = state.prayers.filter((p) => hasLang(p, state.lang)).length;
    const language = langInfo(state.lang).label;
    elements.count.innerHTML = amount === total
      ? `<strong>${total}</strong> oraciones en ${language}`
      : `<strong>${amount}</strong> de ${total} oraciones`;
  }
  function sortTitle(prayer) { return prayer.variants[state.lang]?.title || ""; }
  function applyFilters() {
    const query = normalize(state.query);
    state.filtered = state.prayers
      .filter((prayer) => hasLang(prayer, state.lang) &&
        (state.category === "Todas" || prayer.category === state.category) &&
        (!query || prayer.searchText.includes(query)))
      .sort((a, b) => a.order !== b.order ? a.order - b.order : sortTitle(a).localeCompare(sortTitle(b), state.lang, { sensitivity: "base" }));
    updateCount(); renderPrayers();
  }

  // ---------- lector ----------
  function parseHash() {
    const match = /^#rezar\/([^/]+)(?:\/([a-z]{2}))?$/.exec(location.hash || "");
    if (!match) return null;
    let id = match[1];
    try { id = decodeURIComponent(id); } catch (_) { /* id tal cual */ }
    return { id, lang: match[2] || "" };
  }
  const hashFor = (prayer, lang) => `#rezar/${encodeURIComponent(prayer.id)}/${lang}`;

  function renderReaderLanguages() {
    const { prayer, lang, compare } = state.reader;
    elements.readerLangs.innerHTML = "";
    LANGS.filter((l) => hasLang(prayer, l.code)).forEach((l) => {
      const button = el("button", "lang-button");
      button.type = "button";
      button.setAttribute("aria-pressed", String(l.code === lang));
      button.innerHTML = `<b>${l.badge}</b><span>${l.label}</span>`;
      button.addEventListener("click", () => {
        if (l.code === state.reader.lang) return;
        state.reader.lang = l.code;
        if (state.reader.compare === l.code) state.reader.compare = "";
        renderReader(); syncHash(true);
      });
      elements.readerLangs.appendChild(button);
    });
    elements.readerCompare.innerHTML = "";
    elements.readerCompare.appendChild(new Option("Sin comparar", ""));
    LANGS.filter((l) => l.code !== lang && hasLang(prayer, l.code)).forEach((l) => {
      elements.readerCompare.appendChild(new Option(l.label, l.code, false, l.code === compare));
    });
    elements.readerCompare.value = compare;
  }

  function columnLabel(code) {
    const label = el("div", "parallel-label", langInfo(code).label);
    label.setAttribute("aria-hidden", "true");
    return label;
  }

  function renderReaderBody() {
    const { prayer, lang, compare } = state.reader;
    const body = elements.readerBody;
    body.innerHTML = "";
    body.className = "reader-body notranslate";
    body.parentElement.classList.toggle("is-wide", Boolean(compare && hasLang(prayer, compare)));
    const primary = parseBlocks(prayer.variants[lang].text);
    if (!compare || !hasLang(prayer, compare)) {
      body.lang = lang;
      renderBlockList(primary, body);
      return;
    }
    body.removeAttribute("lang");
    const secondary = parseBlocks(prayer.variants[compare].text);
    if (primary.length === secondary.length) {
      // Bloque a bloque: cada estrofa junto a su traducción.
      body.classList.add("is-parallel", "is-aligned");
      const head = el("div", "parallel-row parallel-head");
      head.append(columnLabel(lang), columnLabel(compare));
      body.appendChild(head);
      primary.forEach((block, index) => {
        const row = el("div", `parallel-row parallel-${block.type}`);
        const left = el("div", "parallel-cell"), right = el("div", "parallel-cell is-secondary");
        left.lang = lang; right.lang = compare;
        left.appendChild(renderBlock(block)); right.appendChild(renderBlock(secondary[index]));
        row.append(left, right);
        body.appendChild(row);
      });
    } else {
      // Las versiones no tienen los mismos bloques: dos columnas completas.
      body.classList.add("is-parallel", "is-columns");
      [[lang, primary, ""], [compare, secondary, " is-secondary"]].forEach(([code, blocks, extra]) => {
        const column = el("section", `parallel-column${extra}`);
        column.lang = code;
        column.appendChild(columnLabel(code));
        renderBlockList(blocks, column);
        body.appendChild(column);
      });
    }
  }

  function renderReader() {
    const { prayer, lang } = state.reader;
    const variant = prayer.variants[lang];
    elements.readerCategory.textContent = prayer.category;
    elements.readerTitle.textContent = variant.title;
    elements.readerTitle.lang = lang;
    fillAka(elements.readerAka, prayer, lang);
    elements.readerSubtitle.textContent = variant.subtitle;
    elements.readerSubtitle.hidden = !variant.subtitle;
    renderReaderLanguages();
    renderReaderBody();
    renderNeighbours();
    elements.reader.style.setProperty("--reader-scale", String(state.size));
    elements.readerSmaller.disabled = state.size <= 0.85;
    elements.readerBigger.disabled = state.size >= 1.6;
  }

  function neighbours() {
    const list = state.filtered.length ? state.filtered : state.prayers;
    const index = list.indexOf(state.reader.prayer);
    if (index < 0) return { prev: null, next: null };
    return { prev: list[index - 1] || null, next: list[index + 1] || null };
  }
  function renderNeighbours() {
    const { prev, next } = neighbours();
    [[elements.readerPrev, prev], [elements.readerNext, next]].forEach(([button, prayer]) => {
      button.hidden = !prayer;
      if (!prayer) return;
      const target = button.querySelector("[data-title]");
      const code = bestLang(prayer, state.reader.lang);
      target.textContent = prayer.variants[code].title;
      target.lang = code;
    });
  }
  function goTo(prayer) {
    if (!prayer) return;
    const lang = bestLang(prayer, state.reader.lang);
    state.reader = { prayer, lang, compare: state.reader.compare === lang ? "" : state.reader.compare };
    if (state.reader.compare && !hasLang(prayer, state.reader.compare)) state.reader.compare = "";
    renderReader(); syncHash(true);
    elements.readerScroll.scrollTop = 0;
  }

  let openedFromPage = false;
  function syncHash(replace) {
    const hash = hashFor(state.reader.prayer, state.reader.lang);
    if (location.hash === hash) return;
    const url = `${location.pathname}${location.search}${hash}`;
    if (replace) history.replaceState({ rezar: true }, "", url);
    else history.pushState({ rezar: true }, "", url);
  }
  function openReader(prayer, lang, fromHistory) {
    const code = bestLang(prayer, lang);
    state.reader = { prayer, lang: code, compare: "" };
    renderReader();
    if (!fromHistory) { openedFromPage = true; syncHash(false); }
    if (!elements.reader.open) {
      if (typeof elements.reader.showModal === "function") elements.reader.showModal();
      else elements.reader.setAttribute("open", "");
      document.documentElement.classList.add("reader-open");
    }
    elements.readerScroll.scrollTop = 0;
    elements.readerClose.focus({ preventScroll: true });
  }
  function closeReader() {
    if (elements.reader.open) {
      if (typeof elements.reader.close === "function") elements.reader.close();
      else elements.reader.removeAttribute("open");
    }
  }
  function onReaderClosed() {
    document.documentElement.classList.remove("reader-open");
    if (!parseHash()) return;
    // Al cerrar se vuelve a la página tal como estaba, sin dejar el lector
    // en el historial (el botón Atrás del móvil también lo cierra).
    if (openedFromPage) { openedFromPage = false; history.back(); }
    else history.replaceState(null, "", `${location.pathname}${location.search}`);
  }
  function openFromHash() {
    const target = parseHash();
    if (!target) { openedFromPage = false; closeReader(); return; }
    const prayer = state.prayers.find((p) => p.id === target.id);
    if (!prayer) { history.replaceState(null, "", `${location.pathname}${location.search}`); return; }
    openReader(prayer, LANG_CODES.includes(target.lang) ? target.lang : state.lang, true);
  }
  function setSize(delta) {
    state.size = Math.min(1.6, Math.max(0.85, Math.round((state.size + delta) * 100) / 100));
    storageSet(SIZE_KEY, String(state.size));
    elements.reader.style.setProperty("--reader-scale", String(state.size));
    elements.readerSmaller.disabled = state.size <= 0.85;
    elements.readerBigger.disabled = state.size >= 1.6;
  }

  // ---------- carga ----------
  function showLoadError(error) {
    console.error(error); elements.grid.hidden = true; elements.status.hidden = false; elements.count.textContent = "Biblioteca no disponible";
    elements.status.innerHTML = '<div class="status-card"><strong>No hemos podido cargar las oraciones</strong><span>Comprueba tu conexión y vuelve a intentarlo.</span><button class="button button-primary" id="retryLibrary" type="button">Reintentar</button></div>';
    document.getElementById("retryLibrary")?.addEventListener("click", loadLibrary);
  }
  async function loadLibrary() {
    elements.grid.hidden = true; elements.status.hidden = false;
    elements.status.innerHTML = '<div class="status-card"><div class="spinner"></div><strong>Cargando las oraciones</strong><span>Preparando la biblioteca…</span></div>';
    try {
      const prayers = await O.loadPrayers();
      if (!prayers.length) throw new Error("La hoja no contiene entradas publicables.");
      state.prayers = prayers; state.category = "Todas";
      renderCategories(); applyFilters(); openFromHash();
    } catch (error) { showLoadError(error); }
  }

  elements.search.addEventListener("input", (event) => { state.query = event.target.value; elements.clearSearch.style.display = state.query.length ? "grid" : "none"; applyFilters(); });
  elements.clearSearch.addEventListener("click", () => { state.query = ""; elements.search.value = ""; elements.clearSearch.style.display = "none"; elements.search.focus(); applyFilters(); });
  elements.readerClose.addEventListener("click", closeReader);
  elements.reader.addEventListener("close", onReaderClosed);
  elements.readerCompare.addEventListener("change", (event) => { state.reader.compare = event.target.value; renderReaderBody(); });
  elements.readerSmaller.addEventListener("click", () => setSize(-0.1));
  elements.readerBigger.addEventListener("click", () => setSize(0.1));
  elements.readerPrev.addEventListener("click", () => goTo(neighbours().prev));
  elements.readerNext.addEventListener("click", () => goTo(neighbours().next));
  // Solo lectura: con la oración abierta no se copia, ni se guarda, ni se
  // imprime, ni se inspecciona; cada intento muestra un aviso de gracias.
  O.protect({ zone: elements.reader, isActive: () => elements.reader.open, blockCopyEverywhere: true });
  window.addEventListener("popstate", () => { if (state.prayers.length) openFromHash(); });

  renderLanguageSwitch();
  loadLibrary();
})();
