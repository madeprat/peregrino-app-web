/* Novedades de Peregrino APP.
 *
 * Para anunciar una versión nueva, añade una entrada AL PRINCIPIO de la
 * lista NOVEDADES. Si lleva `lanzamiento` (fecha y hora con zona, p. ej.
 * "2026-11-08T20:00:00+01:00"), la portada de la página muestra una cuenta
 * atrás hasta ese momento y, al llegar, se ilumina como «¡Ya está aquí!»
 * durante una semana. Sin `lanzamiento`, basta con `cuando` (p. ej.
 * "Noviembre de 2026").
 */
const NOVEDADES = [
  {
    version: "1.8.1",
    lanzamiento: "2026-11-08T20:00:00+01:00",
    cuando: "Noviembre de 2026",
    titulo: "Sala de oración, para todos",
    frase: "Rezad a la vez, cada uno desde su móvil. La llamada es al cielo.",
    puntos: [
      "Ahora cualquiera puede crear una sala e invitar a rezar juntos.",
      "Invitación con un enlace: un toque y estás dentro, con la app o desde el navegador.",
      "La primera vez, tres escenas te enseñan cómo funciona.",
      "Una vela se enciende cuando alguien llega a la sala.",
    ],
    enlace: { texto: "Entrar en una sala", href: "sala/" },
  },
  {
    version: "1.8.0",
    cuando: "Noviembre de 2026",
    titulo: "Modo vela, más vivo",
    puntos: [
      "Acceso directo desde Inicio.",
      "La vela y el crucifijo, en una misma escena con luz cálida.",
      "Nueva escena mariana.",
    ],
  },
  {
    version: "1.7.0",
    cuando: "Octubre de 2026",
    titulo: "Regalar una oración, dentro de la app",
    puntos: [
      "Comparte cualquier oración de la Biblioteca con un enlace.",
      "Regala una oración y enciende una luz en el Rincón de la Luz sin salir de la app.",
      "Modo vela: el móvil como vela para crear ambiente de oración.",
      "Una pantalla de Oraciones más ligera.",
    ],
    enlace: { texto: "Regala una oración", href: "regalo-de-oracion.html" },
  },
  {
    version: "1.6.1",
    cuando: "Octubre de 2026",
    titulo: "Palancas desde la app",
    puntos: [
      "Envía tu palanca a un Cursillo directamente desde la app y aparece en el mural.",
    ],
    enlace: { texto: "El mundo está de Cursillo", href: "mundo-cursillo.html" },
  },
  {
    version: "1.6.0",
    cuando: "Octubre de 2026",
    titulo: "Un diseño renovado",
    puntos: [
      "Inicio, Reunión de Grupo, Devocionario y Mis apuntes, renovados.",
      "La misma letra en toda la app.",
      "Una bienvenida en tres escenas.",
    ],
  },
  {
    version: "1.5.0",
    cuando: "Octubre de 2026",
    titulo: "El mundo está de Cursillo",
    puntos: [
      "Un mapa dibujado con los Cursillos que se viven en el mundo.",
      "Reza por un Cursillo, por un continente o por el mundo entero.",
    ],
    enlace: { texto: "Verlo en la web", href: "mundo-cursillo.html" },
  },
];

(() => {
  const DIA = 86400000;
  const SEMANA = 7 * DIA;
  const ahora = () => Date.now();
  const tiempoDe = (n) => (n.lanzamiento ? Date.parse(n.lanzamiento) : NaN);

  // La protagonista: el lanzamiento pendiente más cercano o, si no hay, el
  // que se estrenó hace menos de una semana.
  const pendientes = NOVEDADES.filter((n) => tiempoDe(n) > ahora())
    .sort((a, b) => tiempoDe(a) - tiempoDe(b));
  const recientes = NOVEDADES.filter((n) => {
    const t = tiempoDe(n);
    return t <= ahora() && ahora() - t < SEMANA;
  });
  const protagonista = pendientes[0] || recientes[0] || null;

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  /* ── Portada: cuenta atrás ───────────────────────────────────────── */
  const portada = $("#nv-portada");
  let celebrando = false;

  function pintarPortada() {
    if (!portada) return;
    const n = protagonista || NOVEDADES[0];
    $("#nv-etiqueta").textContent = protagonista && tiempoDe(n) > ahora()
      ? `Próximo lanzamiento · versión ${n.version}`
      : `Lo último · versión ${n.version}`;
    $("#nv-titulo").textContent = n.titulo;
    $("#nv-frase").textContent = n.frase || n.puntos[0];

    if (!protagonista) {
      portada.dataset.estado = "ultimo";
      return;
    }
    const meta = tiempoDe(n);
    const unidades = {
      dias: $("#nv-dias"),
      horas: $("#nv-horas"),
      minutos: $("#nv-minutos"),
      segundos: $("#nv-segundos"),
    };
    const poner = (nodo, valor) => {
      const texto = String(valor).padStart(2, "0");
      if (nodo.textContent === texto) return;
      nodo.textContent = texto;
      nodo.classList.remove("nv-cae");
      void nodo.offsetWidth; // reinicia la animación
      nodo.classList.add("nv-cae");
    };
    const tic = () => {
      const falta = meta - ahora();
      if (falta <= 0) {
        portada.dataset.estado = "llegado";
        $("#nv-etiqueta").textContent = `¡Ya está aquí! · versión ${n.version}`;
        celebrando = true;
        return;
      }
      portada.dataset.estado = "cuenta";
      poner(unidades.dias, Math.floor(falta / DIA));
      poner(unidades.horas, Math.floor((falta % DIA) / 3600000));
      poner(unidades.minutos, Math.floor((falta % 3600000) / 60000));
      poner(unidades.segundos, Math.floor((falta % 60000) / 1000));
      setTimeout(tic, 1000 - (ahora() % 1000) + 5);
    };
    tic();
  }

  /* ── Línea del tiempo ────────────────────────────────────────────── */
  function pintarLinea() {
    const lista = $("#nv-lista");
    if (!lista) return;
    NOVEDADES.forEach((n, i) => {
      const pendiente = tiempoDe(n) > ahora();
      const item = el("li", "nv-hito reveal");
      if (pendiente) item.classList.add("nv-pendiente");
      if (i === 0) item.classList.add("nv-primero");

      item.append(el("span", "nv-llama"));
      const tarjeta = el("article", "nv-tarjeta");
      const meta = el("p", "nv-meta");
      meta.append(
        el("span", "nv-version notranslate", `v${n.version}`),
        el("span", "nv-cuando", pendiente ? "Próximamente" : n.cuando || ""),
      );
      tarjeta.append(meta, el("h3", "nv-hito-titulo", n.titulo));
      const ul = el("ul", "nv-puntos");
      n.puntos.forEach((p) => ul.append(el("li", null, p)));
      tarjeta.append(ul);
      if (n.enlace) {
        const a = el("a", "rv-enlace", n.enlace.texto + " ");
        a.href = n.enlace.href;
        a.append(Object.assign(el("span", null, "→"), { ariaHidden: "true" }));
        tarjeta.append(a);
      }
      item.append(tarjeta);
      lista.append(item);
    });

    // Cada vela se enciende al llegar a ella.
    const hitos = lista.querySelectorAll(".nv-hito");
    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible", "nv-encendida");
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.35 });
      hitos.forEach((h) => obs.observe(h));
    } else {
      hitos.forEach((h) => h.classList.add("is-visible", "nv-encendida"));
    }
  }

  /* ── El cielo: casitas con su vela y oraciones que suben ─────────── */
  function cielo() {
    const lienzo = $("#nv-cielo");
    if (!lienzo || !lienzo.getContext) return;
    const ctx = lienzo.getContext("2d");
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const LLAMA = [255, 207, 107];
    const LLAMA_C = [255, 243, 196];
    const ORO = [240, 215, 122];
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    let W = 0, H = 0, estrellas = [], casas = [];

    function medir() {
      const r = lienzo.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      lienzo.width = Math.round(W * dpr);
      lienzo.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      let semilla = 7;
      const azar = () => ((semilla = (semilla * 9301 + 49297) % 233280) / 233280);
      estrellas = Array.from({ length: Math.round(W / 14) }, () => ({
        x: azar() * W, y: azar() * H * 0.62, f: azar(), r: 0.8 + azar() * 1.2,
      }));
      const n = W < 600 ? 4 : 7;
      casas = Array.from({ length: n }, (_, i) => {
        const x = W * ((i + 0.5) / n) + (azar() - 0.5) * (W / n) * 0.4;
        return { x, y: horizonte(x) + 6 + azar() * 10, f: azar(), s: W < 600 ? 0.8 : 1 };
      });
    }
    // Curva del horizonte: más alta en el centro.
    function horizonte(x) {
      const u = x / W;
      return H * (0.95 - 0.1 * 4 * u * (1 - u));
    }
    function halo(x, y, r, a) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(LLAMA, a));
      g.addColorStop(1, rgba(LLAMA, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    function estrellaCielo(x, y, r, latido) {
      halo(x, y, r * (celebrando ? 6 : 3.4), (celebrando ? 0.5 : 0.32) + 0.18 * latido);
      const R = r * (0.92 + 0.12 * latido), c = R * 0.28;
      ctx.fillStyle = rgba(LLAMA_C, 1);
      ctx.beginPath();
      ctx.moveTo(x, y - R); ctx.lineTo(x + c, y - c); ctx.lineTo(x + R, y);
      ctx.lineTo(x + c, y + c); ctx.lineTo(x, y + R); ctx.lineTo(x - c, y + c);
      ctx.lineTo(x - R, y); ctx.lineTo(x - c, y - c); ctx.fill();
    }
    function casa(c, t) {
      const s = c.s, x = c.x, y = c.y;
      const ti = Math.sin((t * 2 + c.f) * 2 * Math.PI);
      halo(x, y - 12 * s, 46 * s, 0.26 + 0.08 * ti);
      ctx.fillStyle = "#26385F";
      ctx.beginPath();
      ctx.moveTo(x - 22 * s, y); ctx.lineTo(x - 22 * s, y - 24 * s); ctx.lineTo(x, y - 42 * s);
      ctx.lineTo(x + 22 * s, y - 24 * s); ctx.lineTo(x + 22 * s, y); ctx.fill();
      ctx.fillStyle = rgba(LLAMA, 0.85 + 0.15 * ti);
      ctx.fillRect(x - 8 * s, y - 24 * s, 16 * s, 16 * s);
    }

    function pintar(t) {
      ctx.clearRect(0, 0, W, H);
      const latido = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI);
      estrellas.forEach((e, i) => {
        const b = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin((t + e.f + i * 0.13) * 2 * Math.PI));
        ctx.fillStyle = rgba(ORO, b);
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 7); ctx.fill();
      });
      // El mundo.
      const g = ctx.createLinearGradient(0, H * 0.7, 0, H);
      g.addColorStop(0, "#1C2D52"); g.addColorStop(1, "#0E2347");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, horizonte(x));
      ctx.lineTo(W, H); ctx.fill();

      const cx = W / 2, cy = Math.max(46, H * 0.12);
      const chispas = celebrando ? 9 : 4;
      casas.forEach((c, i) => {
        const ox = c.x, oy = c.y - 32 * c.s;
        for (let k = 0; k < chispas; k++) {
          const u = (t + k / chispas + i * 0.11) % 1;
          const e = u * u * u;
          const x = ox + (cx - ox) * e + Math.sin((u + i) * Math.PI * 2) * 7 * (1 - u);
          const y = oy + (cy - oy) * u;
          ctx.fillStyle = rgba(LLAMA_C, Math.sin(u * Math.PI) * 0.85);
          ctx.beginPath(); ctx.arc(x, y, 2.6 * (1 - 0.5 * u), 0, 7); ctx.fill();
        }
      });
      estrellaCielo(cx, cy, W < 600 ? 13 : 17, latido);
      casas.forEach((c) => casa(c, t));
    }

    medir();
    window.addEventListener("resize", medir);
    if (quieto) { pintar(0.4); return; }
    const inicio = performance.now();
    const bucle = (ms) => {
      pintar(((ms - inicio) / 6000) % 1);
      requestAnimationFrame(bucle);
    };
    requestAnimationFrame(bucle);
  }

  pintarPortada();
  pintarLinea();
  cielo();
})();
