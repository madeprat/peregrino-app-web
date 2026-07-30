
(() => {
  const button = document.getElementById("copy-message");
  const message = document.getElementById("contact-message");
  const status = document.getElementById("copy-status");
  if (!button || !message || !status) return;

  button.addEventListener("click", async () => {
    const text = message.innerText.trim();
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "Mensaje copiado.";
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents(message);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = "No se pudo copiar automáticamente. El texto ha quedado seleccionado.";
    }
  });
})();
