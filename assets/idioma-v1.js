// Idioma de la web.
//
// La web está escrita en español y el traductor de Google la pasa a otros
// idiomas. En la primera visita se usa el idioma del sistema de la persona;
// después manda lo que ella elija en el selector, también volver al español.
//
// La preferencia se guarda en localStorage ("gTranslateLang") y se aplica con
// la cookie "googtrans", que el traductor lee al arrancar en cada página. Por
// eso este script va en el <head>, antes de cargar el traductor.
(function () {
  "use strict";

  var KEY = "gTranslateLang";
  var AUTO_KEY = "peregrinoIdiomaAuto";
  var ORIGINAL = "es";

  function get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* sin almacenamiento */ } }

  // Etiqueta del sistema (es-ES, pt-BR, zh-Hant-TW…) a código del traductor.
  function codigoTraductor(etiqueta) {
    var tag = String(etiqueta || "").toLowerCase();
    var base = tag.split(/[-_]/)[0];
    if (!base) return "";
    if (base === "zh") return /-(tw|hk|mo|hant)/.test(tag) ? "zh-TW" : "zh-CN";
    if (base === "he") return "iw";
    if (base === "nb" || base === "nn") return "no";
    if (base === "fil") return "tl";
    return base;
  }

  function idiomaDelSistema() {
    var lista = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    return codigoTraductor(lista[0]);
  }

  function dominios() {
    var host = location.hostname, partes = host.split("."), lista = ["", host];
    for (var i = 0; i < partes.length - 1; i++) lista.push("." + partes.slice(i).join("."));
    return lista;
  }

  function borrarCookie() {
    dominios().forEach(function (dominio) {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + (dominio ? "; domain=" + dominio : "");
    });
  }

  // 1. Primera visita: el idioma del sistema, si no es el de la web.
  var preferido = get(KEY);
  if (!preferido && !get(AUTO_KEY)) {
    set(AUTO_KEY, "1");
    var sistema = idiomaDelSistema();
    if (sistema) { preferido = sistema; set(KEY, sistema); }
  }

  // 2. La cookie del traductor, siempre de acuerdo con la preferencia.
  if (preferido && preferido !== ORIGINAL) {
    document.cookie = "googtrans=/" + ORIGINAL + "/" + preferido + "; path=/; SameSite=Lax";
  } else {
    borrarCookie();
  }

  // 3. Botón para volver al español: el traductor no lo ofrece en su selector
  //    y su barra superior está oculta.
  function botonOriginal() {
    var widget = document.getElementById("google_translate_element");
    if (!widget || document.getElementById("idiomaOriginal")) return;
    var boton = document.createElement("button");
    boton.type = "button";
    boton.id = "idiomaOriginal";
    boton.className = "idioma-original notranslate";
    boton.setAttribute("translate", "no");
    boton.lang = ORIGINAL;
    boton.title = "Ver la web en español";
    boton.innerHTML = "<b>ES</b> Español";
    boton.addEventListener("click", function () {
      set(KEY, ORIGINAL);
      borrarCookie();
      location.reload();
    });
    widget.insertAdjacentElement("afterend", boton);
    if (!document.getElementById("idiomaOriginalEstilo")) {
      var estilo = document.createElement("style");
      estilo.id = "idiomaOriginalEstilo";
      estilo.textContent =
        ".idioma-original{display:inline-flex;align-items:center;gap:6px;min-height:36px;margin-left:6px;padding:0 12px;" +
        "border:1px solid rgba(23,63,122,.22);border-radius:999px;background:#fff;color:#173f7a;" +
        "font:700 .82rem/1 Inter,system-ui,sans-serif;cursor:pointer;white-space:nowrap}" +
        ".idioma-original b{font-size:.68rem;letter-spacing:.06em;padding:3px 5px;border-radius:6px;background:rgba(23,63,122,.08)}" +
        ".idioma-original:hover{border-color:#173f7a}";
      document.head.appendChild(estilo);
    }
  }

  // 4. Guardar lo que la persona elija en el selector del traductor.
  function vigilarSelector() {
    var observador = new MutationObserver(function () {
      var selector = document.querySelector(".goog-te-combo");
      if (!selector || selector.dataset.peregrino) return;
      selector.dataset.peregrino = "1";
      selector.addEventListener("change", function () {
        if (!selector.value) return;
        set(KEY, selector.value);
        if (selector.value !== ORIGINAL) botonOriginal();
      });
    });
    observador.observe(document.documentElement, { childList: true, subtree: true });
  }

  // 5. Palabras que el traductor no debe tocar: nombres propios del
  //    Movimiento y de la app ("Cursillo" no es "short course", "palanca" no
  //    es "lever", "Peregrino APP" no es "Pilgrim APP"). Se envuelven en
  //    <pg-nt translate="no" class="notranslate">, que el traductor respeta.
  //    Es un elemento propio (en línea, sin estilos) para que las reglas CSS
  //    de tipo ".bloque span" no le afecten. También se aplica al contenido
  //    que las páginas añaden después.
  var LETRA = "A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñÀ-ÿ";
  var TERMINOS = new RegExp(
    "(^|[^" + LETRA + "])(" + [
      "Peregrino APP", "Peregrino App", "Peregrino",
      "Movimiento de Cursillos de Cristiandad", "Cursillos de Cristiandad",
      "Cursillo de Cristiandad", "[Cc]ursillos?", "[Cc]ursillistas?",
      "[Pp]alancas?", "Bordón", "Bordones", "Palmero",
      "[Uu]ltreyas?", "¡?De Colores!?"
    ].join("|") + ")(?=$|[^" + LETRA + "])", "g");
  var SALTAR = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1, OPTION: 1, CODE: 1, PRE: 1 };

  function protegido(nodo) {
    for (var el = nodo.parentNode; el && el.nodeType === 1; el = el.parentNode) {
      if (SALTAR[el.nodeName]) return true;
      if (el.getAttribute("translate") === "no" || el.classList.contains("notranslate")) return true;
      if (el.isContentEditable) return true;
    }
    return false;
  }

  function envolverTexto(nodo) {
    var texto = nodo.nodeValue;
    if (!texto || !/[CcPpBUuD]/.test(texto)) return;
    TERMINOS.lastIndex = 0;
    if (!TERMINOS.test(texto) || protegido(nodo)) return;
    TERMINOS.lastIndex = 0;
    // Todo el texto va dentro de un único elemento en línea: si el padre es
    // flex o grid (botones, pastillas…), sigue siendo un solo elemento y no
    // se pierden los espacios entre palabras.
    var fragmento = document.createElement("pg-tx"), ultimo = 0, m;
    while ((m = TERMINOS.exec(texto))) {
      var inicio = m.index + m[1].length;
      if (inicio > ultimo) fragmento.appendChild(document.createTextNode(texto.slice(ultimo, inicio)));
      var marca = document.createElement("pg-nt");
      marca.className = "notranslate";
      marca.setAttribute("translate", "no");
      marca.textContent = m[2];
      fragmento.appendChild(marca);
      ultimo = inicio + m[2].length;
    }
    if (ultimo < texto.length) fragmento.appendChild(document.createTextNode(texto.slice(ultimo)));
    nodo.parentNode.replaceChild(fragmento, nodo);
  }

  function proteger(raiz) {
    if (!raiz) return;
    if (raiz.nodeType === 3) { envolverTexto(raiz); return; }
    if (raiz.nodeType !== 1 || SALTAR[raiz.nodeName]) return;
    var recorrido = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, null), nodos = [], n;
    while ((n = recorrido.nextNode())) nodos.push(n);
    nodos.forEach(envolverTexto);
  }

  function vigilarContenido() {
    var observador = new MutationObserver(function (cambios) {
      cambios.forEach(function (cambio) {
        for (var i = 0; i < cambio.addedNodes.length; i++) proteger(cambio.addedNodes[i]);
      });
    });
    observador.observe(document.body, { childList: true, subtree: true });
  }

  // Para que otras páginas protejan un nodo concreto (por ejemplo un nombre).
  window.PeregrinoIdioma = { proteger: proteger };

  function alCargar() {
    proteger(document.body);
    vigilarContenido();
    if (preferido && preferido !== ORIGINAL) botonOriginal();
    vigilarSelector();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", alCargar);
  else alCargar();
})();
