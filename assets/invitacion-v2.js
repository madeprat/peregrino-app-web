
(() => {
  function cleanName(value) {
    return value
      ? value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 42)
      : "";
  }

  // El nombre nunca se traduce: "Rosa", "Luz" o "Dolores" son nombres, no
  // palabras. Se marca como no traducible para el traductor de Google.
  function nombre(texto) {
    const span = document.createElement("span");
    span.className = "notranslate";
    span.setAttribute("translate", "no");
    span.textContent = texto;
    return span;
  }

  function componer(el, partes) {
    el.textContent = "";
    partes.forEach((parte) => el.appendChild(typeof parte === "string" ? document.createTextNode(parte) : parte));
  }

  function enfasis(texto) {
    const em = document.createElement("em");
    em.textContent = texto;
    return em;
  }

  const params = new URLSearchParams(window.location.search);
  const name = cleanName(params.get("nombre") || params.get("para") || params.get("n"));
  if (!name) return;

  document.title = `${name}, alguien está rezando por ti | Peregrino APP`;
  componer(document.getElementById("hero-title"), [nombre(name), ", alguien está ", enfasis("rezando por ti.")]);

  const intro = document.getElementById("intro-name");
  const strong = document.createElement("strong");
  strong.textContent = "Alguien ha pensado en ti.";
  componer(intro, [nombre(name), ", esta página no ha llegado a ti como un anuncio. ", strong]);

  componer(document.getElementById("personal-line"), [
    nombre(name),
    ", si esta invitación ha llegado hasta ti, quizá alguien está pidiendo a Dios que te acompañe, te ilumine y te muestre si este camino también puede ser para ti.",
  ]);

  componer(document.getElementById("closing-title"), [
    nombre(name),
    ", quizá esta invitación ha llegado a ti ",
    enfasis("por algo."),
  ]);
})();
