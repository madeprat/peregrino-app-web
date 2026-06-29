(function () {
  const slider = document.getElementById('slider');
  const amount = document.getElementById('amount');
  const modal = document.getElementById('donationModal');
  const closeBtn = document.getElementById('closeDonationModal');
  const topBtn = document.getElementById('toTop');

  if (slider && amount) {
    const paintAmount = () => { amount.textContent = slider.value + ' €'; };
    slider.addEventListener('input', paintAmount);
    paintAmount();
  }

  window.donar = function donar() {
    if (!slider) return;
    const valor = slider.value || '10';
    window.open('https://paypal.me/ingresoucha/' + valor + '?locale.x=es_ES&country.x=ES', '_blank', 'noopener');
    if (modal) modal.classList.add('open');
  };

  window.cerrarModalDonacion = function cerrarModalDonacion() {
    if (modal) modal.classList.remove('open');
  };

  if (closeBtn) closeBtn.addEventListener('click', window.cerrarModalDonacion);
  if (modal) {
    modal.addEventListener('click', function (event) {
      if (event.target === modal) window.cerrarModalDonacion();
    });
  }

  if (topBtn) {
    const syncTopButton = () => {
      if (window.scrollY > 600) topBtn.classList.add('visible');
      else topBtn.classList.remove('visible');
    };
    topBtn.addEventListener('click', function (event) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.addEventListener('scroll', syncTopButton, { passive: true });
    syncTopButton();
  }
})();
