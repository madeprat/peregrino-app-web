// Estadísticas de uso con GoatCounter (sin cookies, solo recuentos agregados).
//
// El recuento de visitas lo hace el script oficial de GoatCounter que se carga
// en el <head>. Este archivo añade dos eventos para saber si Peregrino se usa
// como app web:
//   - "abierta-como-app": la web se abre instalada (pantalla completa, sin
//     barra del navegador). Se cuenta una vez por sesión. Funciona en Android,
//     iPhone y ordenador.
//   - "pwa-instalada": el navegador confirma la instalación. Solo lo avisan
//     Chrome, Edge y Samsung Internet; en iPhone no existe este aviso.
// Si GoatCounter está bloqueado (p. ej. por un bloqueador), no se hace nada.
(() => {
  "use strict";

  const disponible = () => window.goatcounter && typeof window.goatcounter.count === "function";
  const contarEvento = (ruta, titulo) => {
    if (!disponible()) return;
    try { window.goatcounter.count({ path: ruta, title: titulo, event: true }); } catch (_) { /* sin estadísticas */ }
  };

  const esApp = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;

  window.addEventListener("load", () => {
    if (!esApp) return;
    const clave = "peregrinoAppContada";
    try {
      if (sessionStorage.getItem(clave)) return;
      sessionStorage.setItem(clave, "1");
    } catch (_) { /* almacenamiento no disponible: se cuenta igualmente */ }
    contarEvento("abierta-como-app", "Abierta como app");
  });

  window.addEventListener("appinstalled", () => {
    contarEvento("pwa-instalada", "PWA instalada");
  });
})();
