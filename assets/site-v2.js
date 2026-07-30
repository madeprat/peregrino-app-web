(() => {
  const body = document.body;
  const modeSwitch = document.querySelector('.mode-switch');
  const modeText = document.querySelector('.mode-switch-text');
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  const dialog = document.querySelector('.member-dialog');
  const closeButton = document.querySelector('.dialog-close');
  const enableMemberButton = document.querySelector('.dialog-enable-member');
  const continueButton = document.querySelector('.dialog-continue');
  let pendingHref = null;

  const applyMode = (mode) => {
    const isMember = mode === 'member';
    body.dataset.memberMode = isMember ? 'member' : 'visitor';
    modeSwitch?.setAttribute('aria-checked', String(isMember));
    if (modeText) modeText.textContent = isMember ? 'Miembro' : 'Visitante';
    try { localStorage.setItem('peregrino-demo-mode', isMember ? 'member' : 'visitor'); } catch (_) {}
  };

  let initialMode = 'visitor';
  try { initialMode = localStorage.getItem('peregrino-demo-mode') || 'visitor'; } catch (_) {}
  applyMode(initialMode);

  modeSwitch?.addEventListener('click', () => {
    applyMode(body.dataset.memberMode === 'member' ? 'visitor' : 'member');
  });

  menuToggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    });
  });

  document.querySelectorAll('[data-member-action]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (body.dataset.memberMode === 'member') return;
      event.preventDefault();
      pendingHref = link.getAttribute('href');
      if (typeof dialog?.showModal === 'function') {
        dialog.showModal();
        body.classList.add('dialog-open');
      } else {
        const proceed = window.confirm(
          'Esta experiencia se presentará como ventaja para miembros. Todavía no existe un bloqueo real. ¿Quieres abrir la función actual?'
        );
        if (proceed && pendingHref) window.location.href = pendingHref;
      }
    });
  });

  const closeDialog = () => {
    if (dialog?.open) dialog.close();
    body.classList.remove('dialog-open');
  };

  closeButton?.addEventListener('click', closeDialog);
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });

  enableMemberButton?.addEventListener('click', () => {
    applyMode('member');
    closeDialog();
  });

  continueButton?.addEventListener('click', () => {
    const destination = pendingHref;
    closeDialog();
    if (destination) window.location.href = destination;
  });

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }
})();
