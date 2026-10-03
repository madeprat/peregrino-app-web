// Instalar Peregrino como app web (portada e Inicio).
//
// - Marca en <html> la plataforma (data-plataforma="ios|android|otra") y si
//   la web ya está abierta como app (clase "es-app"), para que el CSS ponga
//   primero las instrucciones que tocan y oculte las que sobran.
// - En los navegadores que lo permiten (Chrome, Edge, Samsung Internet…),
//   los botones [data-instalar] abren el diálogo de instalación; mientras no
//   esté disponible se muestran las instrucciones manuales [data-instalar-manual].
//   En iPhone no existe ese diálogo: se instala desde Compartir en Safari.
(() => {
  "use strict";

  const raiz = document.documentElement;
  const ua = navigator.userAgent || "";
  const esIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const esApp = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;

  raiz.dataset.plataforma = esIOS ? "ios" : /Android/i.test(ua) ? "android" : "otra";
  if (esApp) raiz.classList.add("es-app");

  let peticion = null;
  const mostrarBotones = (visible) => {
    document.querySelectorAll("[data-instalar]").forEach((boton) => { boton.hidden = !visible; });
    document.querySelectorAll("[data-instalar-manual]").forEach((texto) => { texto.hidden = visible; });
  };

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    peticion = event;
    mostrarBotones(true);
  });
  window.addEventListener("appinstalled", () => {
    peticion = null;
    mostrarBotones(false);
    raiz.classList.add("app-instalada");
  });
  document.addEventListener("click", async (event) => {
    const boton = event.target.closest && event.target.closest("[data-instalar]");
    if (!boton || !peticion) return;
    peticion.prompt();
    try { await peticion.userChoice; } catch (_) { /* cerrado */ }
    peticion = null;
    mostrarBotones(false);
  });
})();
