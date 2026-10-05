// API_BASE et ROUTES viennent de config.js (chargé avant ce fichier).

/* Formulaire "AFI Weekly" (section #Newsletter de la landing).
   Ce formulaire est le SEUL qui alimente la liste des abonnés newsletter
   (POST /api/newsletter/subscribe/). Les réservations d'événements passent
   par reserveApp.js et restent séparées. */
(function () {
  'use strict';

  let toastTimer = null;

  function escapeText(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Notification flottante (créée une seule fois, réutilisée ensuite). */
  function getToast() {
    let toast = document.getElementById('site-toast');
    if (toast) return toast;

    toast = document.createElement('div');
    toast.id = 'site-toast';
    toast.className = 'site-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);

    toast.addEventListener('click', (e) => {
      if (e.target.closest('.site-toast__close')) hideToast();
    });
    return toast;
  }

  function hideToast() {
    const toast = document.getElementById('site-toast');
    if (toast) toast.classList.remove('is-visible');
    clearTimeout(toastTimer);
  }

  function showToast(title, message, type = 'success') {
    const toast = getToast();
    const icon = type === 'error' ? 'fa-circle-exclamation' : 'fa-envelope-circle-check';
    toast.className = `site-toast site-toast--${type}`;
    toast.innerHTML = `
      <span class="site-toast__icon"><i class="fas ${icon}"></i></span>
      <div class="site-toast__body">
        <strong>${escapeText(title)}</strong>
        <span>${escapeText(message)}</span>
      </div>
      <button type="button" class="site-toast__close" aria-label="Fermer">&times;</button>`;

    // Double rAF : laisse le navigateur appliquer l'état caché avant d'animer.
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('is-visible')));

    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 6000);
  }

  function setFeedback(feedback, text, modifier) {
    if (!feedback) return;
    feedback.textContent = text;
    feedback.className = 'newsletter-feedback' + (modifier ? ` newsletter-feedback--${modifier}` : '');
  }

  function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    const feedback = document.getElementById('newsletter-feedback');
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = input.value.trim();
      if (!email) return;

      button.disabled = true;
      setFeedback(feedback, 'Envoi en cours…');

      try {
        const res = await fetch(`${API_BASE}/api/newsletter/subscribe/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          form.reset();
          if (!data.already_subscribed && window.afiTrack) {
            window.afiTrack('Newsletter Signup');
          }
          const message = data.detail || 'Merci ! Votre inscription est confirmée.';
          setFeedback(feedback, message, 'success');
          showToast(
            data.already_subscribed ? 'Déjà abonné(e)' : 'Abonnement confirmé 🎉',
            data.already_subscribed
              ? `${email} reçoit déjà AFI Weekly.`
              : `${email} recevra AFI Weekly chaque semaine.`,
          );
        } else {
          const message =
            (data.email && data.email[0]) ||
            data.detail ||
            'Une erreur est survenue. Réessayez.';
          setFeedback(feedback, message, 'error');
          showToast('Inscription impossible', message, 'error');
        }
      } catch (err) {
        console.error('Erreur inscription newsletter:', err);
        const message = 'Serveur injoignable. Réessayez plus tard.';
        setFeedback(feedback, message, 'error');
        showToast('Inscription impossible', message, 'error');
      } finally {
        button.disabled = false;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initNewsletterForm);
})();
