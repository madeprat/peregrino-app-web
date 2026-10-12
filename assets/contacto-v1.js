// Buzón de Peregrino (contacto.html).
//
// Envía cada mensaje a una hoja de cálculo de Google mediante Apps Script
// (código en herramientas/contacto-apps-script.gs). Mientras ENDPOINT esté
// vacío, el formulario abre el correo con el mensaje ya redactado.
//
// Se puede abrir con datos ya elegidos: contacto.html?tipo=incidencia&sobre=app&donde=Reunión%20de%20Grupo
// Si se llega desde otra página de la web, se marca «La web» y esa página.
(() => {
  "use strict";

  const ENDPOINT = "https://script.google.com/macros/s/AKfycbyBSwLpgTctTIgj37iJFwUOiJ_4e-FmggbzGENyaoKzByaHgxuJG20LoofFeJuEVU5X/exec";
  const CORREO = "peregrinoapp@outlook.es";

  const TIPOS = [
    { id: "Sugerencia", clave: "sugerencia", icono: "💡", texto: "Una idea para mejorar" },
    { id: "Petición", clave: "peticion", icono: "🙋", texto: "Algo que necesitas" },
    { id: "Incidencia", clave: "incidencia", icono: "🛠️", texto: "Algo no funciona" },
    { id: "Felicitación", clave: "felicitacion", icono: "🎉", texto: "Algo que te gusta" },
    { id: "Agradecimiento", clave: "agradecimiento", icono: "💛", texto: "Algo que agradecer" },
    { id: "Otra cosa", clave: "otra", icono: "✉️", texto: "Cualquier otro tema" }
  ];

  const SOBRES = [
    { id: "La app", clave: "app", icono: "📱" },
    { id: "La web", clave: "web", icono: "🌐" },
    { id: "Peregrino en general", clave: "general", icono: "🕊️" }
  ];

  const PARTES_APP = [
    "Oraciones: Rosario, Vía Crucis, Hora Apostólica…",
    "Oración guiada y audio",
    "Modo Auto (escuchar con la pantalla apagada)",
    "Biblioteca y devociones propias",
    "Recordatorios y rutinas de oración",
    "Reunión de Grupo",
    "Oraciones en grupo",
    "Candidatos y palancas",
    "Constancia y perfil",
    "Planes, Bordones y compras",
    "Plan Comunidad",
    "Copia de seguridad",
    "Instalar o abrir la app",
    "Otra parte de la app"
  ];

  // Páginas de la web: ruta → nombre que se muestra.
  const PAGINAS_WEB = [
    ["index.html", "Portada"],
    ["inicio.html", "Rezar hoy (Inicio)"],
    ["biblioteca-oraciones.html", "Biblioteca de oraciones"],
    ["rincon-de-la-luz.html", "Rincón de la Luz"],
    ["regalo-de-oracion.html", "Regala una oración"],
    ["alguien-reza-por-ti.html", "Alguien reza por ti"],
    ["sala/", "Rezar en grupo (sala)"],
    ["reunion-de-grupo.html", "Reunión de Grupo"],
    ["mundo-cursillo.html", "El mundo está de Cursillo"],
    ["la-app.html", "La app"],
    ["descubre.html", "Descubre"],
    ["que-es-el-mcc.html", "Qué es el MCC"],
    ["quiero-vivir-un-cursillo.html", "Vivir un Cursillo"],
    ["apostolado-digital.html", "Apostolado digital"],
    ["plan-apostol.html", "Me sumo (planes)"],
    ["manual-usuario-peregrino.html", "Manual"],
    ["manifiesto.html", "Manifiesto"],
    ["historieta.html", "Historieta"],
    ["bordon/", "Bordón regalado"],
    ["", "Instalar la web como app"],
    ["", "Traducción e idiomas"],
    ["", "Otra página de la web"]
  ];

  const GRAVEDADES = ["No puedo usar Peregrino", "Me molesta, pero puedo seguir", "Es un detalle"];

  const VALORACIONES = [
    "Las oraciones", "El audio y la oración guiada", "La Reunión de Grupo", "Rezar en grupo",
    "Candidatos y palancas", "El Rincón de la Luz", "Que me ayude a ser constante",
    "Que sea gratis", "Que sea sencillo", "El cuidado del diseño"
  ];

  const TEXTOS = {
    "Sugerencia": { titulo: "Cuéntame tu idea", pista: "Qué se te ocurre y en qué te ayudaría." },
    "Petición": { titulo: "¿Qué necesitas?", pista: "Cuéntame qué te gustaría tener o qué necesitas de mí." },
    "Incidencia": { titulo: "¿Qué ha pasado?", pista: "Qué estabas haciendo, qué esperabas que pasara y qué pasó." },
    "Felicitación": { titulo: "Cuéntame", pista: "¿Qué te ha gustado? ¿Cómo te acompaña Peregrino?" },
    "Agradecimiento": { titulo: "Cuéntame", pista: "¿Qué quieres agradecer? ¿Cómo te acompaña Peregrino?" },
    "Otra cosa": { titulo: "Cuéntame", pista: "Escribe lo que quieras." }
  };

  const GRACIAS = {
    "Sugerencia": ["💡", "Gracias por tu idea", "La apunto para valorarla. Muchas mejoras de Peregrino nacen así, de alguien que se toma un minuto para contarlo."],
    "Petición": ["🙋", "Recibido", "Lo reviso con calma. Si me has dejado tu correo, te respondo en cuanto pueda."],
    "Incidencia": ["🛠️", "Gracias por avisar", "Me pongo a revisarlo. Saber qué falla es lo que más me ayuda a que Peregrino funcione bien para todos."],
    "Felicitación": ["🎉", "¡Qué alegría!", "Gracias por contármelo. Saber qué te acompaña me ayuda a cuidar lo que de verdad importa."],
    "Agradecimiento": ["💛", "Gracias a ti", "Tu mensaje me anima a seguir. Que el Señor te bendiga en tu camino."],
    "Otra cosa": ["🕊️", "Gracias por escribirme", "He recibido tu mensaje. Si me has dejado tu correo, te respondo en cuanto pueda."]
  };

  const $ = (id) => document.getElementById(id);
  const form = $("buzon");
  if (!form) return;
  const cargadoEn = Date.now();

  const crearChip = (nombre, tipo, valor, contenido) => {
    const etiqueta = document.createElement("label");
    etiqueta.className = "chip";
    const entrada = document.createElement("input");
    entrada.type = tipo;
    entrada.name = nombre;
    entrada.value = valor;
    const caja = document.createElement("span");
    caja.innerHTML = contenido;
    etiqueta.append(entrada, caja);
    return etiqueta;
  };
  const escapar = (texto) => String(texto).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  TIPOS.forEach((t) => $("tipos").append(crearChip("tipo", "radio", t.id,
    `<span class="chip-icono" aria-hidden="true">${t.icono}</span><strong>${escapar(t.id)}</strong><small>${escapar(t.texto)}</small>`)));
  SOBRES.forEach((s) => $("sobres").append(crearChip("sobre", "radio", s.id, `<span aria-hidden="true">${s.icono}</span>${escapar(s.id)}`)));
  GRAVEDADES.forEach((g) => $("gravedades").append(crearChip("gravedad", "radio", g, escapar(g))));
  VALORACIONES.forEach((v) => $("valoraciones").append(crearChip("valora", "checkbox", v, escapar(v))));

  const valor = (nombre) => {
    const marcado = form.querySelector(`input[name="${nombre}"]:checked`);
    return marcado ? marcado.value : "";
  };
  const marcar = (nombre, v) => {
    const entrada = [...form.querySelectorAll(`input[name="${nombre}"]`)].find((e) => e.value === v);
    if (entrada) entrada.checked = true;
  };

  const rellenarDonde = (sobre, preferido) => {
    const select = $("donde");
    select.innerHTML = "";
    const opciones = sobre === "La app" ? PARTES_APP : PAGINAS_WEB.map(([, nombre]) => nombre);
    const vacia = new Option("Elige una opción", "");
    vacia.disabled = true;
    select.append(vacia);
    opciones.forEach((o) => select.append(new Option(o, o)));
    select.value = preferido && opciones.includes(preferido) ? preferido : "";
    if (!select.value) vacia.selected = true;
    $("dondeEtiqueta").textContent = sobre === "La app" ? "¿En qué parte de la app?" : "¿En qué página?";
  };

  const detectarDispositivo = () => {
    const ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iPhone o iPad";
    if (/Android/i.test(ua)) return "Android";
    return "Ordenador";
  };
  $("dispositivo").value = detectarDispositivo();

  const actualizar = () => {
    const tipo = valor("tipo");
    const sobre = valor("sobre");
    $("pasoSobre").hidden = !tipo;
    const listo = Boolean(tipo && sobre);
    ["pasoMensaje", "pasoContacto", "pie"].forEach((id) => { $(id).hidden = !listo; });
    $("campoDonde").hidden = !sobre || sobre === "Peregrino en general";
    $("extraIncidencia").hidden = tipo !== "Incidencia";
    $("extraValora").hidden = !(tipo === "Felicitación" || tipo === "Agradecimiento");
    $("camposTestimonio").hidden = !$("testimonio").checked;
    if (tipo) {
      $("mensajeTitulo").textContent = TEXTOS[tipo].titulo;
      $("mensaje").placeholder = TEXTOS[tipo].pista;
    }
  };

  form.addEventListener("change", (event) => {
    if (event.target.name === "sobre") rellenarDonde(event.target.value, "");
    if (event.target.name === "tipo" && !valor("sobre")) {
      requestAnimationFrame(() => $("pasoSobre").scrollIntoView({ behavior: "smooth", block: "nearest" }));
    }
    if (event.target.name === "sobre") {
      requestAnimationFrame(() => $("pasoMensaje").scrollIntoView({ behavior: "smooth", block: "nearest" }));
    }
    actualizar();
  });

  $("mensaje").addEventListener("input", () => {
    const n = $("mensaje").value.length;
    $("contador").textContent = n > 3500 ? `${n} / 4000` : "";
  });

  // Datos que llegan en el enlace o por la página de la que viene la persona.
  const parametros = new URLSearchParams(location.search);
  const tipoPedido = TIPOS.find((t) => t.clave === (parametros.get("tipo") || "").toLowerCase());
  const sobrePedido = SOBRES.find((s) => s.clave === (parametros.get("sobre") || "").toLowerCase());
  let dondePedido = parametros.get("donde") || "";
  let origen = "";
  try {
    if (document.referrer) {
      const ref = new URL(document.referrer);
      if (ref.origin === location.origin && !/contacto\.html$/.test(ref.pathname)) {
        origen = ref.pathname + ref.search;
        const ruta = ref.pathname.replace(/^\//, "");
        const pagina = PAGINAS_WEB.find(([r]) => r && (ruta === r || (r.endsWith("/") && ruta.startsWith(r)) || (r === "index.html" && ruta === "")));
        if (pagina && !sobrePedido) {
          marcar("sobre", "La web");
          dondePedido = dondePedido || pagina[1];
        }
      }
    }
  } catch (_) { /* sin página de origen */ }
  if (tipoPedido) marcar("tipo", tipoPedido.id);
  if (sobrePedido) marcar("sobre", sobrePedido.id);
  if (valor("sobre")) rellenarDonde(valor("sobre"), dondePedido);
  actualizar();

  const mostrarError = (texto) => {
    $("error").textContent = texto;
    $("error").hidden = !texto;
  };

  const recoger = () => {
    const tipo = valor("tipo");
    const valora = [...form.querySelectorAll('input[name="valora"]:checked')].map((e) => e.value);
    if ($("valoraOtra").value.trim()) valora.push($("valoraOtra").value.trim());
    const conValora = tipo === "Felicitación" || tipo === "Agradecimiento";
    const testimonio = conValora && $("testimonio").checked;
    return {
      tipo,
      sobre: valor("sobre"),
      donde: $("campoDonde").hidden ? "" : $("donde").value,
      mensaje: $("mensaje").value.trim(),
      gravedad: tipo === "Incidencia" ? valor("gravedad") : "",
      dispositivo: tipo === "Incidencia" ? $("dispositivo").value : "",
      valora: conValora ? valora.join(", ") : "",
      testimonio,
      nombrePublico: testimonio ? $("nombrePublico").value.trim() : "",
      lugar: testimonio ? $("lugar").value.trim() : "",
      nombre: $("nombre").value.trim(),
      email: $("email").value.trim(),
      origen,
      navegador: (navigator.userAgent || "").slice(0, 300),
      web: $("web").value
    };
  };

  const validar = (d) => {
    if (!d.tipo) return "Elige qué quieres contarme.";
    if (!d.sobre) return "Elige sobre qué es tu mensaje.";
    if (d.mensaje.length < 3) { $("mensaje").focus(); return "Escribe tu mensaje."; }
    if (d.tipo === "Incidencia" && !d.gravedad) return "Dime cuánto te afecta, así sé qué atender primero.";
    if (d.testimonio && (!d.nombrePublico || !d.lugar)) return "Para publicar tu testimonio, dime cómo quieres aparecer y desde dónde escribes.";
    if (d.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) { $("email").focus(); return "Revisa tu correo: parece que le falta algo."; }
    return "";
  };

  const mostrarGracias = (tipo, porCorreo) => {
    const [icono, titulo, texto] = GRACIAS[tipo] || GRACIAS["Otra cosa"];
    $("graciasIcono").textContent = porCorreo ? "✉️" : icono;
    $("graciasTitulo").textContent = porCorreo ? "Ya casi está" : titulo;
    $("graciasTexto").textContent = porCorreo
      ? `Se ha abierto tu correo con el mensaje ya escrito. Solo falta que pulses Enviar. Si no se ha abierto, escríbeme a ${CORREO}.`
      : texto;
    form.hidden = true;
    $("gracias").hidden = false;
    $("gracias").scrollIntoView({ behavior: "smooth", block: "center" });
    try {
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: "buzon-" + tipo.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-"), title: "Buzón: " + tipo, event: true });
      }
    } catch (_) { /* sin estadísticas */ }
  };

  const abrirCorreo = (d) => {
    const partes = [`${d.tipo} sobre ${d.sobre}${d.donde ? " (" + d.donde + ")" : ""}`];
    if (d.gravedad) partes.push(`Gravedad: ${d.gravedad} · ${d.dispositivo}`);
    partes.push("", d.mensaje);
    if (d.valora) partes.push("", `Lo que más valoro: ${d.valora}`);
    if (d.testimonio) partes.push("", `Puedes publicarlo como testimonio: ${d.nombrePublico} (${d.lugar})`);
    const asunto = `[Peregrino] ${d.tipo}${d.donde ? " · " + d.donde : ""}`;
    location.href = `mailto:${CORREO}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(partes.join("\n"))}`;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const datos = recoger();
    const problema = validar(datos);
    mostrarError(problema);
    if (problema) return;
    if (datos.web || Date.now() - cargadoEn < 2500) { mostrarGracias(datos.tipo); return; }

    if (!ENDPOINT) { abrirCorreo(datos); mostrarGracias(datos.tipo, true); return; }

    const boton = $("enviar");
    boton.disabled = true;
    boton.textContent = "Enviando…";
    try {
      // Petición simple (texto plano) para que Apps Script la acepte sin preflight.
      await fetch(ENDPOINT, { method: "POST", mode: "no-cors", body: JSON.stringify(datos) });
      mostrarGracias(datos.tipo);
    } catch (_) {
      mostrarError(`No he podido enviarlo. Revisa tu conexión e inténtalo de nuevo, o escríbeme a ${CORREO}.`);
    } finally {
      boton.disabled = false;
      boton.textContent = "Enviar mensaje";
    }
  });

  $("testimonio").addEventListener("change", actualizar);

  $("otroMensaje").addEventListener("click", () => {
    form.reset();
    $("dispositivo").value = detectarDispositivo();
    form.hidden = false;
    $("gracias").hidden = true;
    mostrarError("");
    actualizar();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
