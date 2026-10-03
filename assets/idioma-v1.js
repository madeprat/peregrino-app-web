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

  function alCargar() {
    if (preferido && preferido !== ORIGINAL) botonOriginal();
    vigilarSelector();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", alCargar);
  else alCargar();
})();
