(function () {
  document.documentElement.classList.add('js');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slider = document.getElementById('slider');
  const amount = document.getElementById('amount');
  const modal = document.getElementById('donationModal');
  const closeBtn = document.getElementById('closeDonationModal');
  const topBtn = document.getElementById('toTop');
  const hero = document.querySelector('.hero');
  const heroMedia = document.querySelector('.hero-media');
  const splitTargets = document.querySelectorAll('[data-split-words]');
  const countTargets = document.querySelectorAll('[data-count]');

  if (slider && amount) {
    const paintAmount = () => {
      amount.textContent = slider.value + ' €';
    };
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
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
    window.addEventListener('scroll', syncTopButton, { passive: true });
    syncTopButton();
  }

  if (splitTargets.length && !prefersReducedMotion) {
    splitTargets.forEach(function (heading) {
      const words = heading.textContent.trim().split(/\s+/);
      heading.textContent = '';
      words.forEach(function (word, index) {
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = word;
        span.style.animationDelay = (index * 0.09) + 's';
        heading.appendChild(span);
      });
    });
  }

  const revealItems = document.querySelectorAll('[data-reveal]');
  if (revealItems.length) {
    const groups = document.querySelectorAll('[data-reveal-group]');
    groups.forEach(function (group) {
      const children = group.querySelectorAll(':scope > [data-reveal]');
      children.forEach(function (child, index) {
        child.style.transitionDelay = (index * 70) + 'ms';
      });
    });

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach(function (item) { item.classList.add('is-visible'); });
    } else {
      const revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

      revealItems.forEach(function (item) { revealObserver.observe(item); });
    }
  }

  if (hero && heroMedia && !prefersReducedMotion) {
    let ticking = false;
    const syncHeroParallax = function () {
      const rect = hero.getBoundingClientRect();
      const viewport = window.innerHeight || 0;
      if (rect.bottom <= 0 || rect.top >= viewport) {
        hero.style.setProperty('--hero-parallax', '0px');
        ticking = false;
        return;
      }
      const progress = Math.min(1, Math.max(0, (viewport - rect.top) / (viewport + rect.height)));
      const shift = Math.round(progress * 40);
      hero.style.setProperty('--hero-parallax', shift + 'px');
      ticking = false;
    };

    const requestParallax = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(syncHeroParallax);
    };

    window.addEventListener('scroll', requestParallax, { passive: true });
    window.addEventListener('resize', requestParallax);
    requestParallax();
  }

  if (countTargets.length) {
    const animateCount = function (element) {
      const target = Number(element.dataset.count || '0');
      const decimals = Number(element.dataset.decimals || '0');
      const prefix = element.dataset.prefix || '';
      const suffix = element.dataset.suffix || '';
      const duration = Number(element.dataset.duration || '1400');
      const start = performance.now();

      const frame = function (now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;
        element.textContent = prefix + value.toFixed(decimals) + suffix;
        if (progress < 1) window.requestAnimationFrame(frame);
      };

      window.requestAnimationFrame(frame);
    };

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      countTargets.forEach(function (element) {
        const target = Number(element.dataset.count || '0');
        const decimals = Number(element.dataset.decimals || '0');
        const prefix = element.dataset.prefix || '';
        const suffix = element.dataset.suffix || '';
        element.textContent = prefix + target.toFixed(decimals) + suffix;
      });
    } else {
      const countObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.45 });

      countTargets.forEach(function (element) { countObserver.observe(element); });
    }
  }
})();
