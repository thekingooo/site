(() => {
  document.querySelectorAll('.mt-site [data-contact]').forEach(button => {
    button.addEventListener('click', () => document.getElementById('navContact').click());
  });
  // Keep the original gallery, with focus restored to the project that opened it.
  const gallery = document.getElementById('fpGallery');
  if (gallery) {
    let trigger = null;
    gallery.setAttribute('role', 'dialog');
    gallery.setAttribute('aria-modal', 'true');
    gallery.setAttribute('aria-label', 'Фотографии проекта');
    document.querySelectorAll('.mt-project-open').forEach(button => button.addEventListener('click', () => { trigger = button; }));
    new MutationObserver(() => {
      if (!gallery.hidden) gallery.querySelector('.fp-gallery-close')?.focus();
      else trigger?.focus({preventScroll: true});
    }).observe(gallery, {attributes: true, attributeFilter: ['hidden']});
    gallery.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(gallery.querySelectorAll('button:not([disabled]), a[href]'));
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
  }
})();
