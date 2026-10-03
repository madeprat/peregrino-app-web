// Compartir la página actual con un código QR.
//
// Cualquier botón con el atributo data-compartir abre una ventana con:
// - un código QR de la dirección de la página, para escanearlo con el móvil;
// - copiar el enlace, enviarlo por WhatsApp o usar el menú de compartir del
//   dispositivo;
// - descargar el QR como imagen (por ejemplo, para proyectarlo o imprimirlo).
//
// El QR se genera en el navegador con assets/vendor/qrcode-generator (MIT),
// que solo se descarga la primera vez que alguien pulsa "Compartir".
// data-compartir-titulo="..." cambia el título de la ventana.
(() => {
  "use strict";

  const script = document.currentScript;
  const raiz = script ? new URL("../", script.src).href : new URL("./", location.href).href;
  const LIBRERIA = new URL("assets/vendor/qrcode-generator-2.0.4.js", raiz).href;

  let capa = null;
  let anterior = null;
  let cargando = null;

  function direccion() {
    const url = new URL(location.href);
    url.hash = "";
    if (url.searchParams.has("iphone")) url.searchParams.delete("iphone");
    return url.href;
  }

  function cargarLibreria() {
    if (window.qrcode) return Promise.resolve(window.qrcode);
    if (cargando) return cargando;
    cargando = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = LIBRERIA;
      s.onload = () => (window.qrcode ? resolve(window.qrcode) : reject(new Error("qrcode")));
      s.onerror = () => { cargando = null; reject(new Error("qrcode")); };
      document.head.append(s);
    });
    return cargando;
  }

  function matriz(texto) {
    if (window.qrcode.stringToBytesFuncs && window.qrcode.stringToBytesFuncs["UTF-8"]) {
      window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs["UTF-8"];
    }
    const qr = window.qrcode(0, "M");
    qr.addData(texto, "Byte");
    qr.make();
    return qr;
  }

  function svg(qr) {
    const n = qr.getModuleCount();
    const margen = 4;
    const lado = n + margen * 2;
    let d = "";
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (qr.isDark(y, x)) d += `M${x + margen} ${y + margen}h1v1h-1z`;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" shape-rendering="crispEdges" role="img" aria-label="Código QR de esta página">` +
      `<rect width="${lado}" height="${lado}" fill="#fff"/><path d="${d}" fill="#0e2347"/></svg>`;
  }

  function descargarPNG(qr, nombre) {
    const n = qr.getModuleCount();
    const escala = 16, margen = 4;
    const lado = (n + margen * 2) * escala;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = lado;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, lado, lado);
    ctx.fillStyle = "#0e2347";
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (qr.isDark(y, x)) ctx.fillRect((x + margen) * escala, (y + margen) * escala, escala, escala);
      }
    }
    const a = document.createElement("a");
    a.download = nombre;
    a.href = canvas.toDataURL("image/png");
    document.body.append(a);
    a.click();
    a.remove();
  }

  const estilos = `
.cq-capa{position:fixed;inset:0;z-index:9998;display:grid;place-items:center;padding:16px;background:rgba(10,20,34,.55);backdrop-filter:blur(6px)}
.cq-capa[hidden]{display:none}
.cq-hoja{position:relative;width:min(420px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:26px 24px 20px;border-radius:24px;background:#fffdf8;color:#13243a;box-shadow:0 30px 80px rgba(0,0,0,.25);font-family:Inter,system-ui,-apple-system,sans-serif;text-align:center}
.cq-x{position:absolute;top:12px;right:12px;width:36px;height:36px;border:0;border-radius:50%;background:rgba(19,36,58,.07);color:#13243a;font-size:1.3rem;line-height:1;cursor:pointer}
.cq-etiqueta{margin:0;color:#173f7a;font-size:.68rem;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
.cq-hoja h2{margin:8px 34px 0;font-family:"Cormorant Garamond",Georgia,serif;font-size:1.7rem;line-height:1.1}
.cq-qr{width:min(240px,70vw);margin:18px auto 0;padding:10px;border-radius:16px;background:#fff;border:1px solid rgba(19,36,58,.12)}
.cq-qr svg{display:block;width:100%;height:auto}
.cq-qr p{margin:40px 0;color:#5b687b;font-size:.9rem}
.cq-ayuda{margin:12px 0 0;color:#5b687b;font-size:.88rem}
.cq-url{margin:12px 0 0;padding:9px 12px;border-radius:10px;background:#f4f1ea;color:#13243a;font-size:.8rem;word-break:break-all}
.cq-acciones{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px}
.cq-boton{min-height:46px;display:flex;align-items:center;justify-content:center;gap:6px;padding:0 12px;border:1.5px solid rgba(19,36,58,.16);border-radius:999px;background:#fff;color:#0e2347;font:800 .86rem Inter,system-ui,sans-serif;text-decoration:none;cursor:pointer}
.cq-boton:hover{border-color:#173f7a}
.cq-boton.cq-principal{grid-column:1/-1;background:#0e2347;border-color:#0e2347;color:#fff}
.cq-boton[hidden]{display:none}
.cq-aviso{min-height:1.2em;margin:10px 0 0;color:#23845c;font-size:.82rem;font-weight:700}`;

  function crear() {
    const style = document.createElement("style");
    style.textContent = estilos;
    document.head.append(style);

    capa = document.createElement("div");
    capa.className = "cq-capa";
    capa.hidden = true;
    capa.innerHTML = `
      <div class="cq-hoja" role="dialog" aria-modal="true" aria-labelledby="cq-titulo" tabindex="-1">
        <button class="cq-x" type="button" data-cq-cerrar aria-label="Cerrar">×</button>
        <p class="cq-etiqueta">Compartir</p>
        <h2 id="cq-titulo"></h2>
        <div class="cq-qr"></div>
        <p class="cq-ayuda">Escanéalo con la cámara del móvil para abrir esta página.</p>
        <p class="cq-url"></p>
        <div class="cq-acciones">
          <button class="cq-boton cq-principal" type="button" data-cq-copiar>Copiar enlace</button>
          <a class="cq-boton" data-cq-whatsapp target="_blank" rel="noopener">WhatsApp</a>
          <button class="cq-boton" type="button" data-cq-descargar>Descargar QR</button>
          <button class="cq-boton" type="button" data-cq-nativo hidden>Más opciones…</button>
        </div>
        <p class="cq-aviso" role="status"></p>
      </div>`;
    document.body.append(capa);

    capa.addEventListener("click", (e) => {
      if (e.target === capa || e.target.closest("[data-cq-cerrar]")) cerrar();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && capa && !capa.hidden) cerrar();
    });
  }

  function avisar(texto) {
    capa.querySelector(".cq-aviso").textContent = texto;
  }

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch (_) {
      const t = document.createElement("textarea");
      t.value = texto;
      t.setAttribute("readonly", "");
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.append(t);
      t.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (__) { ok = false; }
      t.remove();
      return ok;
    }
    return true;
  }

  async function abrir(boton) {
    if (!capa) crear();
    anterior = document.activeElement;

    const url = direccion();
    const tituloPagina = (document.title || "Peregrino APP").split("|")[0].trim();
    capa.querySelector("#cq-titulo").textContent = boton.getAttribute("data-compartir-titulo") || tituloPagina;
    let legible = url;
    try { legible = decodeURI(url); } catch (_) {}
    capa.querySelector(".cq-url").textContent = legible.replace(/^https?:\/\//, "");
    capa.querySelector("[data-cq-whatsapp]").href = "https://wa.me/?text=" + encodeURIComponent(`${tituloPagina}\n${url}`);
    avisar("");

    const nativo = capa.querySelector("[data-cq-nativo]");
    nativo.hidden = !navigator.share;
    nativo.onclick = () => navigator.share({ title: tituloPagina, url }).catch(() => {});
    capa.querySelector("[data-cq-copiar]").onclick = async () => {
      avisar((await copiar(url)) ? "Enlace copiado." : "No se pudo copiar. Selecciona el enlace y cópialo.");
    };

    const caja = capa.querySelector(".cq-qr");
    const descargar = capa.querySelector("[data-cq-descargar]");
    caja.innerHTML = "<p>Preparando el código QR…</p>";
    descargar.disabled = true;

    capa.hidden = false;
    capa.querySelector(".cq-hoja").focus();

    try {
      await cargarLibreria();
      const qr = matriz(url);
      caja.innerHTML = svg(qr);
      descargar.disabled = false;
      descargar.onclick = () => descargarPNG(qr, "peregrino-qr.png");
    } catch (_) {
      caja.innerHTML = "<p>No se pudo crear el código QR. Puedes copiar el enlace.</p>";
    }
  }

  function cerrar() {
    capa.hidden = true;
    if (anterior && anterior.focus) anterior.focus();
  }

  document.addEventListener("click", (e) => {
    const boton = e.target.closest && e.target.closest("[data-compartir]");
    if (!boton) return;
    e.preventDefault();
    abrir(boton);
  });
})();
