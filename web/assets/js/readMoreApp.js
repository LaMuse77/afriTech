/* "Voir plus / Voir moins" adaptatif pour les textes longs des cartes.
   - le texte est tronqué en CSS (line-clamp) sur les éléments [data-clamp]
   - le bouton n'apparaît que si le texte déborde réellement
   - recalculé à chaque changement de taille (écran, carrousel, polices) */
(function () {
  'use strict';

  const observer = 'ResizeObserver' in window
    ? new ResizeObserver(entries => entries.forEach(e => check(e.target)))
    : null;

  function getToggle(el) {
    const next = el.nextElementSibling;
    if (next && next.classList.contains('read-more-toggle')) return next;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'read-more-toggle';
    btn.hidden = true;
    btn.innerHTML = '<span>Voir plus</span><i class="fas fa-chevron-down"></i>';
    // Empêche le carrousel d'interpréter le clic comme un début de swipe.
    btn.addEventListener('pointerdown', e => e.stopPropagation());
    btn.addEventListener('click', () => toggle(el, btn));
    el.insertAdjacentElement('afterend', btn);
    return btn;
  }

  function toggle(el, btn) {
    const expanded = el.classList.toggle('is-expanded');
    btn.classList.toggle('is-expanded', expanded);
    btn.setAttribute('aria-expanded', String(expanded));
    btn.querySelector('span').textContent = expanded ? 'Voir moins' : 'Voir plus';
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }

  /* Affiche le bouton uniquement si le texte tronqué déborde. */
  function check(el) {
    const btn = getToggle(el);
    if (el.classList.contains('is-expanded')) return; // on garde "Voir moins"
    btn.hidden = el.scrollHeight <= el.clientHeight + 1;
  }

  window.initReadMore = function (scope) {
    (scope || document).querySelectorAll('[data-clamp]').forEach(el => {
      el.classList.add('is-clamped');
      check(el);
      if (observer) observer.observe(el);
    });
  };

  document.addEventListener('DOMContentLoaded', () => window.initReadMore());
  window.addEventListener('load', () => window.initReadMore()); // après chargement des polices
  if (!observer) {
    let id;
    window.addEventListener('resize', () => {
      clearTimeout(id);
      id = setTimeout(() => window.initReadMore(), 150);
    });
  }
})();
