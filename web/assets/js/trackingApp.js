/* Suivi des clics de la landing vers Mixpanel.
   Les noms d'événements doivent rester identiques à TRACKED_METRICS
   (src/fin/content/management/commands/sync_stats.py), sinon ils
   n'apparaîtront pas dans la section Statistiques du dashboard.

   - window.afiTrack(nom, props) : utilisable par les autres scripts
     (newsletterApp.js, reserveApp.js) pour les conversions réussies.
   - Clics suivis automatiquement (délégation, marche aussi pour le contenu
     injecté après coup) :
       * liens vidéo des cartes         -> "Video Click"
       * éléments [data-track="..."]    -> nom indiqué (ex: "YouTube CTA Click")
       * boutons [data-reserve]         -> "Reserve Click" */
(function () {
  'use strict';

  // Garde : si le CDN Mixpanel est bloqué (adblock, hors-ligne), on ignore.
  window.afiTrack = function (eventName, props) {
    try {
      if (window.mixpanel && typeof window.mixpanel.track === 'function') {
        window.mixpanel.track(eventName, props || {});
      }
    } catch (err) {
      console.warn('Tracking indisponible:', err);
    }
  };

  document.addEventListener('click', (e) => {
    const videoLink = e.target.closest('.video-card a');
    if (videoLink) {
      const card = videoLink.closest('.video-card');
      const title = card.querySelector('h3');
      window.afiTrack('Video Click', {
        video_id: card.dataset.videoId,
        title: title ? title.textContent.trim() : '',
      });
      return;
    }

    const tracked = e.target.closest('[data-track]');
    if (tracked) {
      window.afiTrack(tracked.dataset.track, { source: tracked.dataset.trackSource || '' });
      return;
    }

    const reserve = e.target.closest('[data-reserve]');
    if (reserve) {
      window.afiTrack('Reserve Click', { event_id: reserve.dataset.event || '' });
    }
  });
})();
