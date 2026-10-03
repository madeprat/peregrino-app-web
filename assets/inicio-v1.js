// Inicio de Peregrino en la web: la pantalla que se abre desde el icono del
// móvil. Saludo según la hora, fecha y "una luz para hoy" (una frase breve que
// cambia cada día; "Otra luz" muestra otra al azar).
(() => {
  "use strict";

  const LUCES = [
    "Hoy Dios te mira con ternura. No caminas solo.",
    "Lo que siembras en silencio, Él lo ve y lo multiplica.",
    "Respira. La paz que buscas ya está empezando en ti.",
    "No tienes que poder con todo hoy. Basta dar el siguiente paso.",
    "Eres amado tal como eres, no como crees que deberías ser.",
    "La luz pequeña también alumbra. La tuya importa.",
    "Después de la noche, la mañana siempre vuelve. Confía.",
    "Dios escribe derecho. Lo que hoy no entiendes, mañana será camino.",
    "Tu nombre está escrito en la palma de su mano.",
  ];

  const hoy = new Date();
  const $ = (id) => document.getElementById(id);

  const hora = hoy.getHours();
  const saludo = $("inSaludo");
  if (saludo) saludo.textContent = hora >= 6 && hora < 13 ? "Buenos días" : hora >= 13 && hora < 20 ? "Buenas tardes" : "Buenas noches";

  const fecha = $("inFecha");
  if (fecha) {
    try {
      const texto = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(hoy);
      fecha.textContent = texto.charAt(0).toUpperCase() + texto.slice(1);
    } catch (_) { fecha.hidden = true; }
  }

  const luz = $("inLuz");
  const otra = $("inOtraLuz");
  if (!luz) return;
  const numeroDeDia = Math.floor(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) / 86400000);
  let actual = numeroDeDia % LUCES.length;
  const mostrar = () => { luz.textContent = `“${LUCES[actual]}”`; };
  mostrar();
  otra?.addEventListener("click", () => {
    let siguiente = actual;
    while (siguiente === actual) siguiente = Math.floor(Math.random() * LUCES.length);
    actual = siguiente;
    luz.classList.remove("is-nueva"); void luz.offsetWidth; luz.classList.add("is-nueva");
    mostrar();
  });
})();
