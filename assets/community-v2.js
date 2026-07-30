
(() => {
  const body = document.body;
  const modeSwitch = document.querySelector(".mode-switch");
  const modeText = document.querySelector(".mode-switch-text");
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  const dialog = document.querySelector(".member-dialog");
  let pendingHref = null;

  function applyMode(mode) {
    const member = mode === "member";
    body.dataset.memberMode = member ? "member" : "visitor";
    modeSwitch?.setAttribute("aria-checked", String(member));
    if (modeText) modeText.textContent = member ? "Miembro" : "Visitante";
    try { localStorage.setItem("peregrino-demo-mode", member ? "member" : "visitor"); } catch (_) {}
  }

  let initial = "visitor";
  try { initial = localStorage.getItem("peregrino-demo-mode") || "visitor"; } catch (_) {}
  applyMode(initial);

  modeSwitch?.addEventListener("click", () => {
    applyMode(body.dataset.memberMode === "member" ? "visitor" : "member");
  });

  menuToggle?.addEventListener("click", () => {
    const open = nav?.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(Boolean(open)));
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      menuToggle?.setAttribute("aria-expanded", "false");
    });
  });

  document.querySelectorAll("[data-member-action]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (body.dataset.memberMode === "member") return;
      event.preventDefault();
      pendingHref = link.getAttribute("href");
      if (dialog?.showModal) {
        dialog.showModal();
        body.classList.add("dialog-open");
      } else if (window.confirm("Esta experiencia se presentará como ventaja para miembros. Todavía no existe un bloqueo real. ¿Quieres continuar?")) {
        window.location.href = pendingHref;
      }
    });
  });

  function closeDialog() {
    if (dialog?.open) dialog.close();
    body.classList.remove("dialog-open");
  }

  document.querySelector(".dialog-close")?.addEventListener("click", closeDialog);
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
  document.querySelector(".dialog-enable-member")?.addEventListener("click", () => {
    applyMode("member");
    closeDialog();
  });
  document.querySelector(".dialog-continue")?.addEventListener("click", () => {
    const destination = pendingHref;
    closeDialog();
    if (destination) window.location.href = destination;
  });

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
})();
