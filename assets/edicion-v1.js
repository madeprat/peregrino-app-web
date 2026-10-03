// Páginas interiores como parte de la misma revista que la portada.
//
// - Folio bajo la cabecera: "Peregrino · Edición del Cuarto Día" y la
//   sección del Trípode a la que pertenece la página (Piedad, Estudio,
//   Acción) con su número en el índice.
// - "Seguir leyendo" al final: página anterior y siguiente del índice y
//   vuelta al índice de la portada.
//
// El orden y los números son los de "En este número" en index.html.
(() => {
  "use strict";

  const INDICE = [
    { archivo: "biblioteca-oraciones.html", titulo: "Biblioteca de oraciones", seccion: "piedad" },
    { archivo: "sala/", titulo: "Rezar en grupo", seccion: "piedad" },
    { archivo: "rincon-de-la-luz.html", titulo: "Rincón de la Luz", seccion: "piedad" },
    { archivo: "regalo-de-oracion.html", titulo: "Regala una oración", seccion: "piedad" },
    { archivo: "que-es-el-mcc.html", titulo: "Qué es el MCC", seccion: "estudio" },
    { archivo: "reunion-de-grupo.html", titulo: "Reunión de Grupo", seccion: "estudio" },
    { archivo: "manual-usuario-peregrino.html", titulo: "Manual de Peregrino", seccion: "estudio" },
    { archivo: "historieta.html", titulo: "La historieta", seccion: "estudio" },
    { archivo: "mundo-cursillo.html", titulo: "El mundo está de Cursillo", seccion: "accion" },
    { archivo: "alguien-reza-por-ti.html", titulo: "Alguien reza por ti", seccion: "accion" },
    { archivo: "quiero-vivir-un-cursillo.html", titulo: "Quiero vivir un Cursillo", seccion: "accion" },
    { archivo: "apostolado-digital.html", titulo: "Apostolado digital", seccion: "accion" },
  ];

  // Páginas que no están en el índice pero forman parte de la revista.
  const OTRAS = {
    "manifiesto.html": "El proyecto",
    "plan-apostol.html": "Planes",
    "aviso-legal.html": "Información",
    "privacidad.html": "Información",
    "cookies.html": "Información",
  };

  const NOMBRES = { piedad: "Piedad", estudio: "Estudio", accion: "Acción" };

  const archivo = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const posicion = INDICE.findIndex((p) => p.archivo === archivo);
  const actual = posicion >= 0 ? INDICE[posicion] : null;
  const otra = OTRAS[archivo];
  if (!actual && !otra) return;

  const numero = (i) => String(i + 1).padStart(2, "0");
  const crear = (etiqueta, clase, texto) => {
    const el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto) el.textContent = texto;
    return el;
  };

  document.body.dataset.seccion = actual ? actual.seccion : "general";

  // ── Folio ──────────────────────────────────────────────────────────────
  const folio = crear("div", "ed-folio");
  folio.setAttribute("aria-label", "Sección de la revista");
  const interior = crear("div", "ed-folio-interior");

  const cabecera = crear("a", "ed-folio-cabecera");
  cabecera.href = "index.html";
  cabecera.append(crear("span", "ed-folio-marca", "Peregrino"), crear("span", "ed-folio-edicion", "Edición del Cuarto Día"));

  const seccion = crear("a", "ed-folio-seccion");
  seccion.href = "index.html#experiencias";
  if (actual) {
    seccion.append(
      crear("span", "ed-folio-nombre", NOMBRES[actual.seccion]),
      crear("span", "ed-folio-num", `${numero(posicion)} / ${String(INDICE.length).padStart(2, "0")}`),
    );
  } else {
    seccion.append(crear("span", "ed-folio-nombre", otra));
  }
  interior.append(cabecera, seccion);
  folio.append(interior);

  const header = document.querySelector(".site-header, .peregrino-site-header");
  if (header && header.parentNode) header.after(folio);

  // ── Seguir leyendo ─────────────────────────────────────────────────────
  const bloque = crear("nav", "ed-seguir");
  bloque.setAttribute("aria-label", "Seguir leyendo");
  const caja = crear("div", "ed-seguir-interior");
  caja.append(crear("p", "ed-seguir-titulo", "Seguir leyendo"));

  const tarjetas = crear("div", "ed-seguir-tarjetas");
  const tarjeta = (i, sentido) => {
    const p = INDICE[i];
    const a = crear("a", `ed-tarjeta ed-${p.seccion} ed-${sentido}`);
    a.href = p.archivo;
    a.append(
      crear("span", "ed-tarjeta-meta", sentido === "anterior" ? `← Anterior · ${NOMBRES[p.seccion]}` : `Siguiente · ${NOMBRES[p.seccion]} →`),
      crear("span", "ed-tarjeta-num", numero(i)),
      crear("strong", "ed-tarjeta-titulo", p.titulo),
    );
    return a;
  };

  if (actual) {
    const anterior = (posicion - 1 + INDICE.length) % INDICE.length;
    const siguiente = (posicion + 1) % INDICE.length;
    tarjetas.append(tarjeta(anterior, "anterior"), tarjeta(siguiente, "siguiente"));
  } else {
    // Fuera del índice: proponer el comienzo de cada pata del Trípode.
    [0, 4, 8].forEach((i) => tarjetas.append(tarjeta(i, "siguiente")));
    tarjetas.classList.add("ed-tres");
    tarjetas.querySelectorAll(".ed-tarjeta-meta").forEach((m, k) => { m.textContent = NOMBRES[INDICE[[0, 4, 8][k]].seccion]; });
  }

  const volver = crear("a", "ed-seguir-indice", "Ver todo el índice");
  volver.href = "index.html#experiencias";
  caja.append(tarjetas, volver);
  bloque.append(caja);

  const pie = document.querySelector("footer.site-footer");
  if (pie && pie.parentNode) pie.before(bloque);
  else document.body.append(bloque);
})();
