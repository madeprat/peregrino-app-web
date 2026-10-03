// Peregrino para iPhone — aviso hasta que la app esté en App Store.
//
// En iPhone/iPad, los enlaces de descarga a Google Play no sirven. En lugar de
// mandar a la persona a un callejón sin salida, se muestra cuándo llega la app
// y lo que ya puede hacer desde el navegador.
//
// Para verlo desde un ordenador: añade ?iphone=1 a la dirección.
(() => {
  const FECHA_IOS = '31 de diciembre de 2026';
  const CONTACTO = 'peregrinoapp@outlook.es';
  const PLAY = 'play.google.com/store/apps/details';
  const PAQUETE = 'com.cursillistas.peregrino_mcc';

  let forzar = false;
  try { forzar = new URLSearchParams(location.search).get('iphone') === '1'; } catch (_) {}

  const ua = navigator.userAgent || '';
  const esIOS = /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!esIOS && !forzar) return;

  // Raíz del sitio a partir de la ubicación de este script (…/assets/iphone-v1.js).
  const script = document.currentScript;
  const raiz = script ? new URL('../', script.src).href : new URL('./', location.href).href;
  const enlace = (ruta) => new URL(ruta, raiz).href;

  const avisame = `mailto:${CONTACTO}?subject=${encodeURIComponent('Avísame cuando Peregrino esté en App Store')}` +
    `&body=${encodeURIComponent('Hola, quiero que me aviséis cuando Peregrino APP esté disponible para iPhone. ¡Gracias!')}`;

  const estilos = `
.pi-capa{position:fixed;inset:0;z-index:9999;display:grid;place-items:end center;padding:16px;background:rgba(10,20,34,.55);backdrop-filter:blur(6px)}
.pi-capa[hidden]{display:none}
.pi-hoja{position:relative;width:min(480px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:22px 20px 16px;border-radius:28px;background:#fffdf8;color:#13243a;box-shadow:0 30px 80px rgba(0,0,0,.25);font-family:Inter,system-ui,-apple-system,sans-serif;text-align:left}
.pi-etiqueta{margin:0;color:#173f7a;font-size:.68rem;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
.pi-hoja h2{margin:6px 0 0;padding-right:28px;font-family:"Cormorant Garamond",serif;font-size:1.65rem;line-height:1.05;letter-spacing:-.02em}
.pi-hoja p{margin:8px 0 0;color:#42526a;font-size:.9rem;line-height:1.45}
.pi-x{position:absolute;top:12px;right:12px;width:36px;height:36px;border:0;border-radius:50%;background:rgba(19,36,58,.07);color:#13243a;font-size:1.3rem;line-height:1;cursor:pointer}
.pi-lista{margin:12px 0 0;padding:0;list-style:none;display:grid;gap:6px}
.pi-lista a{display:flex;gap:12px;align-items:center;padding:9px 12px;border-radius:16px;background:#fff;border:1px solid rgba(19,36,58,.12);color:#13243a;text-decoration:none}
.pi-lista a:hover{border-color:#173f7a}
.pi-lista span:first-child{font-size:1.35rem}
.pi-lista strong{display:block;font-size:.9rem;line-height:1.3}
.pi-lista small{display:block;color:#5b687b;font-size:.8rem;line-height:1.35}
.pi-acciones{display:grid;gap:4px;margin-top:14px}
.pi-boton{min-height:48px;display:flex;align-items:center;justify-content:center;border:0;border-radius:999px;background:#173f7a;color:#fff;font:800 .95rem Inter,system-ui,sans-serif;text-decoration:none;cursor:pointer}
.pi-boton.pi-sec{background:transparent;color:#173f7a}
@media(min-width:700px){.pi-capa{place-items:center}}`;

  const opciones = [
    ['🙏', 'Unirme a una oración en grupo', 'Con el código que te han enviado', 'sala/'],
    ['🕯️', 'Rincón de la Luz', 'Enciende una velita o regala una oración', 'rincon-de-la-luz.html'],
    ['📖', 'Biblioteca de oraciones', 'Busca y lee oraciones', 'biblioteca-oraciones.html'],
    ['🌍', 'El mundo está de Cursillo', 'Cursillos y palancas en el mapa', 'mundo-cursillo.html'],
  ];

  let capa = null;
  let anterior = null;

  function crear() {
    const style = document.createElement('style');
    style.textContent = estilos;
    document.head.append(style);

    capa = document.createElement('div');
    capa.className = 'pi-capa';
    capa.hidden = true;
    capa.innerHTML = `
      <div class="pi-hoja" role="dialog" aria-modal="true" aria-labelledby="pi-titulo" tabindex="-1">
        <button class="pi-x" type="button" data-pi-cerrar aria-label="Cerrar">×</button>
        <p class="pi-etiqueta">Peregrino para iPhone</p>
        <h2 id="pi-titulo">Llega a App Store el ${FECHA_IOS}</h2>
        <p>Mientras tanto, puedes vivir gran parte de Peregrino desde el navegador:</p>
        <ul class="pi-lista">
          ${opciones.map(([icono, titulo, texto, ruta]) => `
            <li><a href="${enlace(ruta)}"><span aria-hidden="true">${icono}</span><span><strong>${titulo}</strong><small>${texto}</small></span></a></li>`).join('')}
        </ul>
        <div class="pi-acciones">
          <a class="pi-boton" href="${avisame}">Avísame cuando esté en App Store</a>
          <button class="pi-boton pi-sec" type="button" data-pi-cerrar>Cerrar</button>
        </div>
      </div>`;
    document.body.append(capa);

    capa.addEventListener('click', (e) => {
      if (e.target === capa || e.target.closest('[data-pi-cerrar]')) cerrar();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && capa && !capa.hidden) cerrar();
    });
  }

  function abrir() {
    if (!capa) crear();
    anterior = document.activeElement;
    capa.hidden = false;
    capa.querySelector('.pi-hoja').focus();
  }

  function cerrar() {
    capa.hidden = true;
    if (anterior && anterior.focus) anterior.focus();
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (!href.includes(PLAY) || !href.includes(PAQUETE)) return;
    e.preventDefault();
    abrir();
  });
})();
