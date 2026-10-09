(() => {
  "use strict";

  const body = document.body;
  body.classList.add("peregrino-world-v2");

  const header = document.querySelector(".peregrino-site-header");
  if (header) {
    header.innerHTML = `
      <div class="site-wrap peregrino-site-nav">
        <a class="peregrino-site-brand" href="index.html" aria-label="Peregrino, volver al inicio">
          <span class="peregrino-site-brand-mark">
            <img
              src="assets/peregrino-app-icon.png"
              alt=""
              onerror="this.hidden=true;this.nextElementSibling.hidden=false;"
            >
            <span class="peregrino-site-brand-fallback" hidden aria-hidden="true">P</span>
          </span>
          <span class="peregrino-site-brand-copy">
            <strong>Peregrino</strong>
            <small>El Cuarto Día, vivo cada día</small>
          </span>
        </a>

        <button
          class="peregrino-site-menu-toggle"
          type="button"
          aria-expanded="false"
          aria-controls="peregrino-world-nav"
          aria-label="Abrir menú"
        >
          <span></span><span></span><span></span>
        </button>

        <nav id="peregrino-world-nav" class="peregrino-nav-links" aria-label="Navegación principal">
          <a href="inicio.html">Rezar</a>
          <a href="reunion-de-grupo.html">Reunión de Grupo</a>
          <a href="mundo-cursillo.html" aria-current="page">El mundo está de Cursillo</a>
          <a href="descubre.html">Descubre</a>
          <a class="peregrino-nav-cta" href="https://play.google.com/store/apps/details?id=com.cursillistas.peregrino_mcc">Descargar</a>
          <div id="google_translate_element"></div>
        </nav>
      </div>
    `;
  }

  const titleMark = document.querySelector(".title-zone .brand-mark");
  if (titleMark) {
    titleMark.innerHTML =
      '<img src="assets/peregrino-app-icon.png" alt="" ' +
      'onerror="this.remove();this.parentElement.textContent=\'P\'">';
  }

  const nav = document.querySelector("#peregrino-world-nav");
  const menuButton = document.querySelector(".peregrino-site-menu-toggle");

  menuButton?.addEventListener("click", () => {
    const open = nav?.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(Boolean(open)));
    menuButton.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      menuButton?.setAttribute("aria-expanded", "false");
      menuButton?.setAttribute("aria-label", "Abrir menú");
    });
  });

  document.querySelectorAll(".world-v2-home,.world-v2-mode,.world-v2-member-note").forEach((element) => {
    element.remove();
  });

})();
