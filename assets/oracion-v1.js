// Oraciones de Peregrino: lo que comparten la Biblioteca y la portada.
//
// - Lectura de la hoja publicada, con las mismas reglas que la Biblioteca de
//   la app (lib/services/biblioteca_online_service.dart).
// - Interpretación de las etiquetas de oración ([heading], [rubric], [V],
//   [R], [speaker=Coro A]…), igual que lib/prayer_engine/devotion_markup_parser.dart.
// - Idioma de oración de cada persona.
// - Protección de solo lectura: las oraciones se leen y se rezan, no se
//   copian, ni se guardan, ni se imprimen.
(() => {
  "use strict";

  const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRP8CBTj_hONpVId_i6C_qaKRR4eOM0my7oJ8OvB3f_TAi5OTymTeMu99L5JTnJOQlBqvJSv-1UZjVB/pub?gid=833946696&single=true&output=csv";
  const LANG_KEY = "peregrinoBibliotecaIdioma";

  // Mismo orden y nombres que PrayerLanguage.supported en la app.
  const LANGS = [
    { code: "es", label: "Español", badge: "ES" },
    { code: "pt", label: "Português", badge: "PT" },
    { code: "en", label: "English", badge: "EN" },
    { code: "la", label: "Latín", badge: "LA" }
  ];
  const LANG_CODES = LANGS.map((l) => l.code);
  const langInfo = (code) => LANGS.find((l) => l.code === code) || LANGS[0];

  // ---------- utilidades ----------
  const normalize = (value) => String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const clean = (value) => String(value ?? "").replace(/^﻿/, "").replace(/\r\n?/g, "\n").trim();
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function storageGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function storageSet(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* sin almacenamiento */ } }

  // ---------- idioma de oración ----------
  // Lenguas cercanas al español rezan en español; el resto, en inglés.
  const CERCANAS_AL_ESPANOL = new Set(["ca", "gl", "eu", "ast", "it", "fr", "ro", "oc"]);
  function prayerLangFor(code) {
    const base = String(code || "").toLowerCase().split(/[-_]/)[0];
    if (LANG_CODES.includes(base)) return base;
    if (!base || CERCANAS_AL_ESPANOL.has(base)) return "es";
    return "en";
  }
  // Lo último que eligió la persona para rezar; si no, el idioma en que ve la
  // web (que en la primera visita es el de su sistema).
  function preferredLang() {
    const saved = storageGet(LANG_KEY);
    if (LANG_CODES.includes(saved)) return saved;
    const web = storageGet("gTranslateLang") || (navigator.languages && navigator.languages[0]) || navigator.language;
    return prayerLangFor(web);
  }
  const savePreferredLang = (code) => { if (LANG_CODES.includes(code)) storageSet(LANG_KEY, code); };

  // ---------- CSV ----------
  function detectDelimiter(text) {
    const firstLine = text.split(/\r?\n/, 1)[0] || "";
    let best = ",", bestCount = -1;
    for (const candidate of [",", ";", "\t"]) {
      let count = 0, quoted = false;
      for (let i = 0; i < firstLine.length; i++) {
        const char = firstLine[i];
        if (char === '"') {
          if (quoted && firstLine[i + 1] === '"') i++;
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
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (quoted) {
        if (char === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
        } else field += char;
      } else if (char === '"') quoted = true;
      else if (char === delimiter) { row.push(field); field = ""; }
      else if (char === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (char !== "\r") field += char;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    const nonEmpty = rows.filter((item) => item.some((value) => clean(value) !== ""));
    if (nonEmpty.length < 2) return [];
    const headers = nonEmpty[0].map((header) => clean(header).toLowerCase());
    return nonEmpty.slice(1).map((values) => {
      const record = {};
      headers.forEach((header, index) => { record[header] = clean(values[index] ?? ""); });
      return record;
    });
  }

  // ---------- catálogo (mismas reglas que BibliotecaOnlineService) ----------
  function isPublishable(row) {
    const include = normalize(row.incluir), confidence = normalize(row.confianza_idioma), revision = normalize(row.revision);
    if (["no", "false", "0"].includes(include)) return false;
    if (!clean(row.id)) return false;
    if (confidence === "baja" || revision.includes("error")) return false;
    return true;
  }
  const parseOrder = (value) => {
    const number = Number.parseInt(String(value ?? "").trim(), 10);
    return Number.isFinite(number) ? number : Number.MAX_SAFE_INTEGER;
  };
  function titleFor(row, lang) {
    switch (lang) {
      case "la": return clean(row.titulo_latin);
      case "pt": return clean(row.titulo_portuges || row.titulo_portugues);
      case "en": return clean(row.titulo_ingles);
      default: return clean(row.titulo);
    }
  }
  function subtitleFor(row, lang) {
    switch (lang) {
      case "la": return clean(row.subtitulo_latin);
      case "pt": return clean(row.subtitulo_portuges || row.subtitulo_portugues);
      case "en": return clean(row.subtitulo_ingles);
      default: return clean(row.subtitulo);
    }
  }
  function textFor(row, lang) {
    switch (lang) {
      case "la": return clean(row.texto_latin);
      case "pt": return clean(row.texto_portugues);
      case "en": return clean(row.texto_ingles);
      default: return clean(row.texto_es) || clean(row.texto);
    }
  }
  function toPrayer(row) {
    const variants = {};
    for (const code of LANG_CODES) {
      const title = titleFor(row, code), text = textFor(row, code);
      if (title && text) variants[code] = { title, subtitle: subtitleFor(row, code), text };
    }
    if (!Object.keys(variants).length) return null;
    const category = clean(row.categoria) || "Otras oraciones";
    const source = clean(row.fuente) || "Biblioteca Peregrino";
    return {
      id: clean(row.id), category, source, order: parseOrder(row.orden), variants,
      searchText: normalize([...LANG_CODES.map((code) => titleFor(row, code)), ...LANG_CODES.map((code) => subtitleFor(row, code)), category, source].join(" "))
    };
  }
  async function loadPrayers(options = {}) {
    const response = await fetch(CSV_URL, { cache: "no-store", credentials: "omit", signal: options.signal });
    if (!response.ok) throw new Error(`Respuesta HTTP ${response.status}`);
    return parseDelimited(await response.text()).filter(isPublishable).map(toPrayer).filter(Boolean);
  }
  const hasLang = (prayer, lang) => Boolean(prayer.variants[lang]);
  const bestLang = (prayer, wanted) => hasLang(prayer, wanted) ? wanted : (LANG_CODES.find((code) => hasLang(prayer, code)) || "es");
  const prayerHref = (prayer, lang) => `biblioteca-oraciones.html#rezar/${encodeURIComponent(prayer.id)}/${lang}`;

  // ---------- etiquetas de oración (DevotionMarkupParser) ----------
  const TAG_LINE = /^\s*\[([^\]]+)\]\s*(.*)$/;
  const SPEAKER_SHORTCUTS = new Set(["v", "r", "antifona", "invitatorio", "coro a", "coro b", "todos", "lector", "sacerdote", "guia", "asamblea"]);

  function parseTag(rawTag) {
    const raw = rawTag.trim();
    if (!raw) return null;
    const lower = normalize(raw);
    if (["heading", "title", "titulo"].includes(lower)) return { type: "heading" };
    if (["text", "texto"].includes(lower)) return { type: "text" };
    if (["rubric", "rubrica"].includes(lower)) return { type: "rubric" };
    if (["reference", "referencia"].includes(lower)) return { type: "reference" };
    if (["silence", "silencio", "pause", "pausa"].includes(lower)) return { type: "silence" };
    const equals = raw.indexOf("=");
    if (equals > 0) {
      const key = normalize(raw.slice(0, equals)), value = raw.slice(equals + 1).trim();
      return (key === "speaker" || key === "locutor") && value ? { type: "dialogue", speaker: value } : null;
    }
    return SPEAKER_SHORTCUTS.has(lower) ? { type: "dialogue", speaker: raw } : null;
  }

  function parseBlocks(raw) {
    const result = [];
    let current = null, buffer = [];
    const flush = () => {
      const text = buffer.join("\n").trim();
      if (current) {
        if (current.type === "silence") result.push({ type: "silence", text });
        else if (text) result.push({ type: current.type, text, speaker: current.speaker });
      } else if (text) result.push({ type: "text", text });
      current = null; buffer = [];
    };
    for (const line of String(raw).replace(/\r\n?/g, "\n").split("\n")) {
      const match = TAG_LINE.exec(line);
      if (match) {
        const tag = parseTag(match[1]);
        if (tag) {
          flush(); current = tag;
          const inline = (match[2] || "").trim();
          if (inline) buffer.push(inline);
          continue;
        }
      }
      if (!line.trim()) { if (buffer.length || current) flush(); continue; }
      buffer.push(line);
    }
    if (buffer.length || current) flush();
    return result;
  }

  function speakerKind(speaker) {
    const value = normalize(speaker);
    if (value === "v") return "v";
    if (value === "r") return "r";
    if (/^\d+$/.test(value)) return "number";
    if (/^(coro|chorus|choir)\s*b$/.test(value)) return "choir-b";
    if (/^(coro|chorus|choir)\s*a$/.test(value)) return "choir-a";
    if (/^(todos|all|omnes|asamblea|pueblo|people|povo)/.test(value)) return "all";
    if (/^antiph|^antif|^invitator/.test(value)) return "antiphon";
    return "other";
  }

  function renderBlock(block) {
    switch (block.type) {
      case "heading": return el("h3", "pb-heading", block.text);
      case "rubric": return el("p", "pb-rubric", block.text);
      case "reference": return el("p", "pb-reference", block.text);
      case "silence": { const node = el("div", "pb-silence", "· · ·"); node.setAttribute("aria-hidden", "true"); return node; }
      case "dialogue": {
        const kind = speakerKind(block.speaker);
        const line = el("div", `pb-line pb-${kind}`);
        const label = kind === "v" ? "℣" : kind === "r" ? "℟" : block.speaker;
        const who = el("span", "pb-who", label);
        if (kind === "v" || kind === "r") who.setAttribute("aria-label", kind === "v" ? "Versículo" : "Respuesta");
        line.append(who, el("p", "pb-said", block.text));
        return line;
      }
      default: return el("p", "pb-text", block.text);
    }
  }
  function renderBlockList(blocks, container) {
    blocks.forEach((block) => container.appendChild(renderBlock(block)));
    return container;
  }

  // ---------- solo lectura ----------
  // Dentro de "zone" no se puede seleccionar, copiar, arrastrar ni abrir el
  // menú contextual. Mientras "isActive()" sea cierto se bloquean también los
  // atajos de copiar, guardar, imprimir, ver el código e inspeccionar. Cada
  // intento muestra un aviso de agradecimiento en "host" (dentro del <dialog>
  // del lector, para que quede por encima).
  const BLOCKED_KEYS = new Set(["KeyC", "KeyX", "KeyA", "KeyS", "KeyP", "KeyU"]);
  const DEVTOOLS_KEYS = new Set(["KeyI", "KeyJ", "KeyC", "KeyK"]);

  function isBlockedShortcut(event) {
    if (event.key === "F12" || event.code === "F12") return true;
    const mod = event.ctrlKey || event.metaKey;
    if (!mod) return false;
    if ((event.shiftKey || event.altKey) && DEVTOOLS_KEYS.has(event.code)) return true;
    if (event.altKey && event.code === "KeyU") return true;
    return !event.shiftKey && !event.altKey && BLOCKED_KEYS.has(event.code);
  }

  function createNotice(appHref) {
    const notice = el("div", "aviso-gracias");
    notice.setAttribute("role", "status");
    notice.hidden = true;
    notice.innerHTML =
      '<div class="aviso-gracias-card">' +
        '<span class="aviso-gracias-icono" aria-hidden="true">🙏</span>' +
        "<strong>Gracias por rezar con Peregrino</strong>" +
        "<p>Las oraciones de la Biblioteca están aquí para leerlas y rezarlas, no para copiarlas ni guardarlas. " +
        "Así cuidamos el trabajo de prepararlas con mimo en cuatro idiomas y apoyas que este proyecto siga adelante.</p>" +
        "<p>Si quieres tenerlas siempre contigo, sin conexión y con voz, están en la app.</p>" +
        '<div class="aviso-gracias-acciones">' +
          '<button type="button" class="aviso-gracias-cerrar">Seguir rezando</button>' +
          `<a href="${appHref}">Conocer la app</a>` +
        "</div>" +
      "</div>";
    notice.addEventListener("click", (event) => {
      if (event.target === notice || event.target.closest(".aviso-gracias-cerrar")) notice.hidden = true;
    });
    return notice;
  }

  function protect(options) {
    const { zone, host = zone, isActive = () => true, appHref = "la-app.html" } = options;
    let notice = null, timer = 0;
    const show = () => {
      if (!notice) { notice = createNotice(appHref); host.appendChild(notice); }
      notice.hidden = false;
      clearTimeout(timer);
      timer = setTimeout(() => { notice.hidden = true; }, 9000);
      notice.querySelector(".aviso-gracias-cerrar")?.focus({ preventScroll: true });
    };
    const inZone = (event) => zone.contains(event.target);
    const block = (event) => {
      if (!inZone(event) || (notice && notice.contains(event.target))) return;
      event.preventDefault();
      show();
    };
    zone.classList.add("solo-lectura");
    ["contextmenu", "copy", "cut", "dragstart"].forEach((type) => zone.addEventListener(type, block));
    zone.addEventListener("selectstart", (event) => { if (!(notice && notice.contains(event.target))) event.preventDefault(); });
    document.addEventListener("keydown", (event) => {
      if (!isActive() || !isBlockedShortcut(event)) return;
      event.preventDefault();
      event.stopPropagation();
      show();
    }, true);
    if (options.blockCopyEverywhere) {
      // Copiar con la selección fuera de la zona (por ejemplo, con el menú
      // Editar del navegador) mientras la oración está abierta.
      document.addEventListener("copy", (event) => { if (isActive()) { event.preventDefault(); show(); } }, true);
    }
    return { show };
  }

  window.PeregrinoOracion = {
    CSV_URL, LANG_KEY, LANGS, LANG_CODES, langInfo,
    normalize, clean, el, storageGet, storageSet,
    prayerLangFor, preferredLang, savePreferredLang,
    parseDelimited, isPublishable, toPrayer, loadPrayers, hasLang, bestLang, prayerHref,
    parseBlocks, speakerKind, renderBlock, renderBlockList,
    protect
  };
})();
