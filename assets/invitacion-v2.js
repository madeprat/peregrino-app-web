
(() => {
  function cleanName(value) {
    return value
      ? value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 42)
      : "";
  }

  const params = new URLSearchParams(window.location.search);
  const name = cleanName(params.get("nombre") || params.get("para") || params.get("n"));
  if (!name) return;

  document.title = `${name}, alguien está rezando por ti | Peregrino APP`;
  document.getElementById("hero-title").innerHTML = `${name}, alguien está <em>rezando por ti.</em>`;

  const intro = document.getElementById("intro-name");
  intro.textContent = "";
  intro.appendChild(document.createTextNode(`${name}, esta página no ha llegado a ti como un anuncio. `));
  const strong = document.createElement("strong");
  strong.textContent = "Alguien ha pensado en ti.";
  intro.appendChild(strong);

  document.getElementById("personal-line").textContent =
    `${name}, si esta invitación ha llegado hasta ti, quizá alguien está pidiendo a Dios que te acompañe, te ilumine y te muestre si este camino también puede ser para ti.`;

  document.getElementById("closing-title").innerHTML =
    `${name}, quizá esta invitación ha llegado a ti <em>por algo.</em>`;
})();
