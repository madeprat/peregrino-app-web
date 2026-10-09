// Peregrino abierto como app (instalado en el móvil o en el ordenador).
//
// Solo actúa cuando la web se abre desde el icono instalado (display-mode
// standalone, o navigator.standalone en iPhone). En el navegador normal no
// cambia nada. Para verla así sin instalar, añadir ?app=1 a la dirección.
//
// - Marca <html class="es-app"> lo antes posible (por eso va en el <head>,
//   sin defer) para que el CSS no muestre primero la cabecera de la web.
// - Añade la navegación de app: barra inferior en el móvil y barra lateral
//   en pantallas anchas (assets/app-v1.css).
// - No guarda nada ni pide datos.
(() => {
  "use strict";

  const raiz = document.documentElement;
  let previsualizar = false;
  try { previsualizar = new URLSearchParams(location.search).get("app") === "1"; } catch (_) { /* sin URLSearchParams */ }
  const esApp = previsualizar ||
    (window.matchMedia && matchMedia("(display-mode: standalone)").matches) ||
    navigator.standalone === true;
  if (!esApp) return;
  raiz.classList.add("es-app");

  // Raíz del sitio a partir de la ubicación de este script (sirve también en sala/).
  const script = document.currentScript;
  const base = script ? new URL("../", script.src) : new URL("./", location.href);
  const url = (ruta) => new URL(ruta, base).href;
  // En la previsualización (?app=1) los enlaces internos la conservan.
  const interna = (ruta) => url(ruta) + (previsualizar ? "?app=1" : "");

  const ICONOS = {
    inicio: '<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>',
    biblioteca: '<path d="M2.5 5.5c3-1.2 6.2-1 9.5 1 3.3-2 6.5-2.2 9.5-1v13.5c-3-1.2-6.2-1-9.5 1-3.3-2-6.5-2.2-9.5-1z"/><path d="M12 6.5v13.5"/>',
    velita: '<path d="M12 2.8c1.4 2 3.2 3.4 3.2 5.9a3.2 3.2 0 0 1-6.4 0c0-1.3.6-2.3 1.4-3.1.2 1 .7 1.7 1.3 1.9-.2-1.7.1-3.2.5-4.7z"/><path d="M8.5 14h7v7h-7z"/>',
    regalo: '<path d="M3.5 6.5h17v12h-17z"/><path d="m3.5 7.5 8.5 6 8.5-6"/>',
    grupo: '<circle cx="9" cy="8" r="3.3"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0"/><path d="M15.5 4.9a3.3 3.3 0 0 1 0 6.2M17.6 14.2A6.2 6.2 0 0 1 21.2 20"/>',
    fuera: '<path d="M14 4h6v6M20 4l-8.5 8.5"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  };
  const icono = (nombre) =>
    `<svg class="app-icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONOS[nombre]}</svg>`;

  const SECCIONES = [
    { id: "inicio", texto: "Inicio", ruta: "inicio.html" },
    { id: "biblioteca", texto: "Biblioteca", ruta: "biblioteca-oraciones.html" },
    { id: "velita", texto: "Velita", largo: "Enciende una velita", ruta: "rincon-de-la-luz.html" },
    { id: "regalo", texto: "Regalar", largo: "Regala una oración", ruta: "regalo-de-oracion.html" },
    { id: "grupo", texto: "En grupo", largo: "Rezar en grupo", ruta: "sala/" },
  ];

  // Mismos enlaces que la sección Peregrinar de Peregrino APP.
  const PALABRA = [
    { texto: "Evangelio del día", href: "https://www.vaticannews.va/es/evangelio-de-hoy.html" },
    { texto: "Los Evangelios", href: "https://www.vatican.va/content/bibbia/es/nuovo-testamento/vangeli/matteo/capitolo-1.index.html" },
  ];

  const actual = (() => {
    const ruta = location.pathname.replace(/index\.html$/, "");
    const seccion = SECCIONES.find((s) => new URL(url(s.ruta)).pathname.replace(/index\.html$/, "") === ruta);
    return seccion ? seccion.id : "";
  })();

  const enlace = (s, clase) =>
    `<a class="${clase}" href="${interna(s.ruta)}"${s.id === actual ? ' aria-current="page"' : ""}>` +
    `${icono(s.id)}<span>${clase === "app-lateral-item" ? s.largo || s.texto : s.texto}</span></a>`;

  const montar = () => {
    if (document.querySelector(".app-lateral")) return;

    const lateral = document.createElement("nav");
    lateral.className = "app-lateral";
    lateral.setAttribute("aria-label", "Peregrino");
    lateral.innerHTML =
      `<a class="app-marca" href="${interna("inicio.html")}">` +
        `<img src="${url("assets/icon/icon-192.png")}" alt="" width="44" height="44">` +
        `<span><strong>Peregrino</strong><small>La app del Cuarto Día</small></span></a>` +
      `<div class="app-lateral-lista">${SECCIONES.map((s) => enlace(s, "app-lateral-item")).join("")}</div>` +
      `<div class="app-lateral-palabra">` +
        `<p class="app-lateral-titulo">Palabra de Dios</p>` +
        PALABRA.map((p) =>
          `<a class="app-lateral-fuera" href="${p.href}" target="_blank" rel="noopener">` +
          `<span>${p.texto}</span>${icono("fuera")}</a>`).join("") +
        `<p class="app-lateral-nota">Se abren en la web del Vaticano, fuera de Peregrino.</p>` +
      `</div>` +
      `<a class="app-lateral-conocer" href="${url("index.html")}">Conocer Peregrino APP</a>`;

    const inferior = document.createElement("nav");
    inferior.className = "app-inferior";
    inferior.setAttribute("aria-label", "Peregrino");
    inferior.innerHTML = SECCIONES.map((s) => enlace(s, "app-inferior-item")).join("");

    document.body.prepend(lateral);
    document.body.append(inferior);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar);
  else montar();
})();
