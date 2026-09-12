/* Réservation d'événements sur la landing.
   Scopé dans une IIFE pour ne pas entrer en collision avec les constantes
   globales déjà déclarées dans fecthApp.js (API_BASE, escapeHtml...). */
(function () {
  'use strict';

  const API_BASE =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000'
        : window.location.origin;

  const modal = document.getElementById('reserve-modal');
  const form = document.getElementById('reserve-form');
  const select = document.getElementById('reserve-event');
  const feedback = document.getElementById('reserve-feedback');
  if (!modal || !form || !select) return;

  let events = [];

  function esc(value) {
    if (value == null) return '';
    return String(value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatEventDate(iso) {
    return new Date(iso).toLocaleString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit',
    });
  }

  /* ---------- Chargement des événements (créés par l'admin) ---------- */
  async function loadEvents() {
    try {
      const res = await fetch(`${API_BASE}/api/events/`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      events = data.results || [];
    } catch (err) {
      console.error('Événements injoignables:', err);
      events = [];
    }
    populateSelect();
    renderCards();
  }

  function populateSelect() {
    if (!events.length) {
      select.innerHTML = '<option value="">Aucun événement ouvert pour le moment</option>';
      return;
    }
    select.innerHTML = events
      .map(ev => `<option value="${ev.id}">${esc(ev.title)} — ${formatEventDate(ev.starts_at)}</option>`)
      .join('');
  }

  /* Remplace les cartes statiques par les vrais événements, avec un bouton
     Réserver par carte. Si aucun événement, on garde le contenu de repli. */
  function renderCards() {
    const grid = document.getElementById('events-grid');
    if (!grid || !events.length) return;
    grid.innerHTML = events.map(ev => `
      <article class="card-item">
        ${ev.badge ? `<div class="card-badge">${esc(ev.badge)}</div>` : ''}
        <h3>${esc(ev.title)}</h3>
        <p>${esc(ev.description || '')}</p>
        <p class="card-meta"><i class="fas fa-calendar"></i> ${formatEventDate(ev.starts_at)}${ev.location ? ' • ' + esc(ev.location) : ''}</p>
        <button type="button" class="btn btn-primary btn-sm" data-reserve data-event="${ev.id}">Réserver</button>
      </article>`).join('');

    // Le carrousel doit recalculer ses slides/points après l'injection.
    if (typeof window.refreshCarousel === 'function') {
      window.refreshCarousel('#events-carousel');
    }
  }

  /* ---------- Ouverture / fermeture du modal ---------- */
  function openModal(eventId) {
    setFeedback('');
    form.reset();
    if (eventId) select.value = String(eventId);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const firstEmpty = eventId ? document.getElementById('reserve-name') : select;
    firstEmpty && firstEmpty.focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function setFeedback(msg, type) {
    feedback.textContent = msg;
    feedback.className = 'reserve-feedback' + (type ? ` is-${type}` : '');
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-reserve]');
    if (trigger) {
      e.preventDefault();
      if (!events.length) {
        openModal(); // affichera "aucun événement"
        return;
      }
      openModal(trigger.dataset.event);
    }
    if (e.target.closest('[data-reserve-close]')) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  /* ---------- Soumission ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setFeedback('');

    const eventId = select.value;
    if (!eventId) {
      setFeedback("Aucun événement n'est disponible à la réservation.", 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi…';

    try {
      const res = await fetch(`${API_BASE}/api/reservations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: Number(eventId),
          full_name: document.getElementById('reserve-name').value.trim(),
          email: document.getElementById('reserve-email').value.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback(firstError(data) || 'Réservation impossible.', 'error');
        return;
      }
      setFeedback(data.detail || 'Réservation confirmée. Vérifiez votre email.', 'success');
      form.reset();
      setTimeout(closeModal, 2500);
    } catch (err) {
      console.error(err);
      setFeedback('Serveur injoignable. Réessayez plus tard.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirmer ma réservation';
    }
  });

  /* Extrait le premier message d'erreur d'une réponse DRF. */
  function firstError(data) {
    if (!data || typeof data !== 'object') return null;
    if (data.detail) return data.detail;
    const firstKey = Object.keys(data)[0];
    const val = data[firstKey];
    return Array.isArray(val) ? val[0] : val;
  }

  document.addEventListener('DOMContentLoaded', loadEvents);
})();
