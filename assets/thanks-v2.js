
(() => {
  const text =
    "Que el Señor te devuelva multiplicado el bien que hoy has sembrado.\n" +
    "Que cuide tus pasos, sostenga a los tuyos y ponga paz en lo que llevas en silencio.\n" +
    "Que nunca te falte la luz que tú hoy ayudas a encender en otros.\n\nAmén.";

  const button = document.getElementById("copyBless");
  const toast = document.getElementById("toast");

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1700);
  }

  button?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Bendición copiada");
    } catch (_) {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      showToast("Bendición copiada");
    }
  });
})();
