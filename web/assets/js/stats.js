// Section "Statistiques" : affiche les snapshots de /api/site-stats/, groupés.
// - Audience du site : alimentée par `manage.py sync_stats` (Mixpanel).
// - Chaîne YouTube   : alimentée par `manage.py sync_youtube`.
// Dépend de fonctions déjà définies dans dashboardApp.js : apiGet,
// escapeHtml, formatRelativeDate, revealChildren.
// Ce fichier doit être chargé APRÈS dashboardApp.js.

// L'ordre des clés ici = l'ordre d'affichage des cartes.
const STATS_GROUPS = [
  {
    title: 'Audience du site (7 derniers jours)',
    icon: 'fas fa-chart-line',
    hint: 'via Mixpanel · sync_stats',
    metrics: {
      pageviews_7d: { label: 'Pages vues', icon: 'fas fa-eye' },
      video_clicks_7d: { label: 'Clics sur les vidéos', icon: 'fas fa-play-circle' },
      youtube_cta_clicks_7d: { label: 'Clics vers YouTube', icon: 'fab fa-youtube' },
      reserve_clicks_7d: { label: 'Clics « Réserver »', icon: 'fas fa-hand-pointer' },
      event_registrations_7d: { label: 'Réservations confirmées', icon: 'fas fa-calendar-check' },
      newsletter_signups_7d: { label: 'Inscriptions newsletter', icon: 'fas fa-envelope-open-text' },
    },
  },
  {
    title: 'Chaîne YouTube',
    icon: 'fab fa-youtube',
    hint: 'via YouTube · sync_youtube',
    metrics: {
      youtube_subscribers: { label: 'Abonnés', icon: 'fas fa-users' },
      youtube_total_views: { label: 'Vues totales', icon: 'fas fa-eye' },
      youtube_video_count: { label: 'Vidéos publiées', icon: 'fas fa-video' },
      youtube_recent_likes: { label: 'Likes (20 dernières vidéos)', icon: 'fas fa-thumbs-up' },
      youtube_recent_comments: { label: 'Commentaires (20 dernières vidéos)', icon: 'fas fa-comments' },
    },
  },
];

// Taux de conversion calculés à partir de deux métriques déjà présentes.
const STATS_RATIOS = [
  {
    group: 0,
    label: 'Taux de réservation',
    icon: 'fas fa-percent',
    numerator: 'event_registrations_7d',
    denominator: 'reserve_clicks_7d',
    hint: 'Réservations confirmées / clics « Réserver »',
  },
];

function formatStatValue(value) {
  return typeof value === 'number'
    ? value.toLocaleString('fr-FR')
    : escapeHtml(JSON.stringify(value));
}

function renderSiteStatCard(meta, value, hint) {
  return `
    <div class="stat-card stat-card--info">
      <p><i class="${meta.icon}"></i> ${escapeHtml(meta.label)}</p>
      <div class="stat-value">${value}</div>
      <p class="stat-hint">${hint}</p>
    </div>`;
}

function renderStatsGroupTitle(group) {
  return `
    <div class="stats-group-title">
      <i class="${group.icon}"></i> ${escapeHtml(group.title)}
      <span>${escapeHtml(group.hint)}</span>
    </div>`;
}

function renderStatsGroups(snapshots) {
  const byKey = Object.fromEntries(snapshots.map((s) => [s.metric_key, s]));
  const known = new Set();
  let html = '';

  STATS_GROUPS.forEach((group, index) => {
    const cards = Object.entries(group.metrics)
      .filter(([key]) => byKey[key])
      .map(([key, meta]) => {
        known.add(key);
        const snap = byKey[key];
        return renderSiteStatCard(meta, formatStatValue(snap.value),
          `Mis à jour ${formatRelativeDate(snap.fetched_at)}`);
      });

    STATS_RATIOS.filter((r) => r.group === index).forEach((ratio) => {
      const num = byKey[ratio.numerator];
      const den = byKey[ratio.denominator];
      if (!num || !den || typeof den.value !== 'number' || den.value === 0) return;
      const pct = Math.round((num.value / den.value) * 100);
      cards.push(renderSiteStatCard(ratio, `${pct} %`, escapeHtml(ratio.hint)));
    });

    if (cards.length) html += renderStatsGroupTitle(group) + cards.join('');
  });

  // Métriques ajoutées côté backend mais pas encore déclarées ici.
  const others = snapshots.filter((s) => !known.has(s.metric_key));
  if (others.length) {
    html += renderStatsGroupTitle({ title: 'Autres', icon: 'fas fa-chart-bar', hint: '' });
    html += others.map((s) => renderSiteStatCard(
      { label: s.metric_key || 'Statistique', icon: 'fas fa-chart-bar' },
      formatStatValue(s.value),
      `Mis à jour ${formatRelativeDate(s.fetched_at)}`,
    )).join('');
  }
  return html;
}

async function loadStatsSection() {
  const grid = document.getElementById('site-stats-grid');
  if (!grid) return;
  try {
    const data = await apiGet('/api/site-stats/');
    // Normalise en tableau, quelle que soit la forme renvoyée par le backend :
    // liste directe, pagination DRF ({results: [...]}), ou objet unique.
    const snapshots = Array.isArray(data)
      ? data
      : (data.results || [data]);

    grid.innerHTML = snapshots.length
      ? renderStatsGroups(snapshots)
      : '<p class="empty-state">Aucune statistique disponible pour le moment. Lancez <code>sync_stats</code> et <code>sync_youtube</code>.</p>';
    if (snapshots.length) revealChildren(grid, 0.08);
  } catch (err) {
    console.error('Stats:', err);
    grid.innerHTML = String(err.message).includes('403')
      ? '<p class="empty-state">Accès réservé aux administrateurs.</p>'
      : '<p class="empty-state">Impossible de charger les statistiques.</p>';
  }
}

SECTION_LOADERS.stats = loadStatsSection;
