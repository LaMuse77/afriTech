/* Carrousel générique (événements, et tout bloc [data-carousel]).
   - responsive : 1 / 2 / 3 cartes visibles selon la largeur
   - flèches, points, swipe tactile, clavier, autoplay avec pause au survol
   - se ré-initialise quand le contenu est injecté par l'API (voir refreshCarousel) */
(function () {
  'use strict';

  const instances = new Map();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function slidesPerView() {
    const w = window.innerWidth;
    if (w < 640) return 1;
    if (w < 1024) return 2;
    return 3;
  }

  function createCarousel(root) {
    const track = root.querySelector('.carousel-track');
    const viewport = root.querySelector('.carousel-viewport');
    const prevBtn = root.querySelector('[data-carousel-prev]');
    const nextBtn = root.querySelector('[data-carousel-next]');
    const dotsBox = root.querySelector('[data-carousel-dots]');
    if (!track || !viewport) return null;

    const autoplayDelay = Number(root.dataset.autoplay || 0);
    let index = 0;
    let perView = slidesPerView();
    let slides = [];
    let pages = 1;
    let timer = null;
    let dragStartX = 0;
    let dragging = false;

    function maxIndex() {
      return Math.max(0, slides.length - perView);
    }

    /* Chaque carte est enveloppée dans un .carousel-slide : le padding de
       gouttière vit sur le wrapper, la carte garde son style intact. */
    function wrapSlides() {
      Array.from(track.children).forEach(child => {
        if (child.classList.contains('carousel-slide')) return;
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        track.insertBefore(slide, child);
        slide.appendChild(child);
      });
    }

    function layout() {
      perView = slidesPerView();
      wrapSlides();
      slides = Array.from(track.children);
      track.style.setProperty('--per-view', perView);

      pages = Math.max(1, slides.length - perView + 1);
      const enabled = slides.length > perView;
      root.classList.toggle('is-static', !enabled);

      if (index > maxIndex()) index = maxIndex();
      buildDots();
      update();
    }

    function buildDots() {
      if (!dotsBox) return;
      dotsBox.innerHTML = '';
      if (pages <= 1) return;
      for (let i = 0; i < pages; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `Aller à la carte ${i + 1}`);
        dot.addEventListener('click', () => { goTo(i); restart(); });
        dotsBox.appendChild(dot);
      }
    }

    function update() {
      const step = 100 / perView;
      track.style.transform = `translate3d(-${index * step}%, 0, 0)`;

      slides.forEach((s, i) => {
        const visible = i >= index && i < index + perView;
        s.classList.toggle('is-active', visible);
        s.setAttribute('aria-hidden', visible ? 'false' : 'true');
      });

      if (dotsBox) {
        Array.from(dotsBox.children).forEach((d, i) => {
          d.classList.toggle('is-active', i === index);
          d.setAttribute('aria-selected', i === index ? 'true' : 'false');
        });
      }
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index >= maxIndex();
    }

    function goTo(i) {
      const max = maxIndex();
      index = i < 0 ? max : (i > max ? 0 : i);
      update();
    }

    const next = () => goTo(index + 1);
    const prev = () => goTo(index - 1);

    function start() {
      if (!autoplayDelay || reduceMotion) return;
      stop();
      if (slides.length <= perView) return;
      timer = setInterval(next, autoplayDelay);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    prevBtn && prevBtn.addEventListener('click', () => { prev(); restart(); });
    nextBtn && nextBtn.addEventListener('click', () => { next(); restart(); });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);

    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { next(); restart(); }
      if (e.key === 'ArrowLeft') { prev(); restart(); }
    });

    // Swipe / drag
    viewport.addEventListener('pointerdown', (e) => {
      if (slides.length <= perView) return;
      dragging = true;
      dragStartX = e.clientX;
      viewport.classList.add('is-dragging');
      stop();
    });
    viewport.addEventListener('pointerup', (e) => {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove('is-dragging');
      const delta = e.clientX - dragStartX;
      if (Math.abs(delta) > 50) { delta < 0 ? next() : prev(); }
      start();
    });
    viewport.addEventListener('pointercancel', () => {
      dragging = false;
      viewport.classList.remove('is-dragging');
      start();
    });

    let resizeId;
    window.addEventListener('resize', () => {
      clearTimeout(resizeId);
      resizeId = setTimeout(() => { layout(); restart(); }, 150);
    });

    layout();
    start();

    return { refresh() { index = 0; layout(); restart(); } };
  }

  function initCarousels() {
    document.querySelectorAll('[data-carousel]').forEach(root => {
      if (instances.has(root)) return;
      const inst = createCarousel(root);
      if (inst) instances.set(root, inst);
    });
  }

  /* Appelé après injection de cartes depuis l'API. */
  window.refreshCarousel = function (selector) {
    const root = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!root) return;
    const inst = instances.get(root);
    inst ? inst.refresh() : initCarousels();
  };

  document.addEventListener('DOMContentLoaded', initCarousels);
})();
