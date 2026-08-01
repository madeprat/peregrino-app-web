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
          <a href="index.html#app">La app</a>
          <a href="index.html#experiencias" aria-current="page">Oración y comunidad</a>
          <a href="index.html#cursillo">Descubre el Cursillo</a>
          <a href="index.html#miembros">Miembros</a>
          <a href="index.html#proyecto">El proyecto</a>
          <a class="peregrino-nav-cta" href="https://play.google.com/store/apps/details?id=com.cursillistas.peregrino_mcc">Descargar</a>
          <div id="google_translate_element"></div>
        </nav>

        <div class="world-header-member" aria-label="Vista de demostración">
          <span class="world-header-member-label">Vista</span>
          <button class="world-header-switch" type="button" role="switch" aria-checked="false">
            <span class="world-header-switch-track">
              <span class="world-header-switch-thumb"></span>
            </span>
            <span class="world-header-switch-text">Visitante</span>
          </button>
        </div>
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

  const modeButton = document.querySelector(".world-header-switch");
  const modeText = document.querySelector(".world-header-switch-text");

  const applyMode = (value) => {
    const member = value === "member";
    body.dataset.worldMember = member ? "member" : "visitor";
    modeButton?.setAttribute("aria-checked", String(member));
    if (modeText) modeText.textContent = member ? "Miembro" : "Visitante";

    try {
      localStorage.setItem("peregrino-demo-mode", member ? "member" : "visitor");
    } catch (_) {}

    document.querySelectorAll(".world-v2-member-badge").forEach((badge) => {
      badge.textContent = member ? "Desbloqueado" : "Miembros";
    });
  };

  let initialMode = "visitor";
  try {
    initialMode = localStorage.getItem("peregrino-demo-mode") || "visitor";
  } catch (_) {}
  applyMode(initialMode);

  modeButton?.addEventListener("click", () => {
    applyMode(body.dataset.worldMember === "member" ? "visitor" : "member");
  });

  document.querySelectorAll(".world-v2-home,.world-v2-mode,.world-v2-member-note").forEach((element) => {
    element.remove();
  });

  function markMemberFeatures() {
    const candidates = [...document.querySelectorAll("button, a, [role='button']")];

    candidates.forEach((element) => {
      const text = (element.textContent || "").replace(/\s+/g, " ").trim();

      if (!/guardar\s+(un\s+)?recuerdo|crear\s+recuerdo|descargar\s+recuerdo/i.test(text)) {
        return;
      }

      if (element.querySelector(".world-v2-member-badge")) return;

      const badge = document.createElement("span");
      badge.className = "world-v2-member-badge";
      badge.textContent =
        body.dataset.worldMember === "member" ? "Desbloqueado" : "Miembros";
      element.appendChild(badge);
    });
  }

  markMemberFeatures();

  const observer = new MutationObserver(() => markMemberFeatures());
  observer.observe(document.body, { childList: true, subtree: true });
})();
