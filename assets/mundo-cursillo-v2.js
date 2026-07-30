
(() => {
  "use strict";

  const body = document.body;
  body.classList.add("peregrino-world-v2");

  const logoTargets = document.querySelectorAll(
    ".brand-mark, .peregrino-site-brand-mark"
  );
  logoTargets.forEach((mark) => {
    mark.innerHTML =
      '<img src="assets/peregrino-app-icon.png" alt="" ' +
      'onerror="if(!this.dataset.official){this.dataset.official=\'1\';this.src=\'https://play-lh.googleusercontent.com/zxnkQzVfq-zfMqRzUr1fJdmdvuTdtVWFjar-XkfA68eD3WDqd7iZa3tmrrp0WjIydhhq5R0S6Wpj1BVD1a5ZZA=w240-h480\';}' +
      'else{this.remove();this.parentElement.textContent=\'P\';}">';
  });

  const actions = document.querySelector(".topbar .actions") || document.querySelector(".topbar");
  if (actions && !document.querySelector(".world-v2-home")) {
    const home = document.createElement("a");
    home.className = "world-v2-home";
    home.href = "index.html";
    home.textContent = "← Peregrino";
    actions.prepend(home);

    const mode = document.createElement("button");
    mode.className = "world-v2-mode";
    mode.type = "button";
    mode.innerHTML =
      '<span class="world-v2-mode-track" aria-hidden="true"></span>' +
      '<span class="world-v2-mode-text">Visitante</span>';
    home.insertAdjacentElement("afterend", mode);

    let initial = "visitor";
    try {
      initial = localStorage.getItem("peregrino-demo-mode") || "visitor";
    } catch (_) {}

    const applyMode = (value) => {
      const member = value === "member";
      body.dataset.worldMember = member ? "member" : "visitor";
      mode.querySelector(".world-v2-mode-text").textContent =
        member ? "Miembro" : "Visitante";
      mode.setAttribute("aria-pressed", String(member));
      try {
        localStorage.setItem("peregrino-demo-mode", member ? "member" : "visitor");
      } catch (_) {}
      document.querySelectorAll(".world-v2-member-badge").forEach((badge) => {
        badge.textContent = member ? "Desbloqueado" : "Miembros";
      });
    };

    applyMode(initial);
    mode.addEventListener("click", () => {
      applyMode(body.dataset.worldMember === "member" ? "visitor" : "member");
    });
  }

  const app = document.querySelector(".app");
  if (app && !document.querySelector(".world-v2-member-note")) {
    const note = document.createElement("div");
    note.className = "world-v2-member-note";
    note.innerHTML =
      "<strong>Maqueta de membresía:</strong> consultar Cursillos y ofrecer palancas " +
      "permanece abierto. Solo las herramientas para conservar o presentar un recuerdo " +
      "pueden distinguirse como ventaja de miembro.";
    const insertionPoint =
      document.querySelector(".status-strip") ||
      document.querySelector(".kpis") ||
      app.firstElementChild;
    if (insertionPoint) insertionPoint.insertAdjacentElement("beforebegin", note);
  }

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
