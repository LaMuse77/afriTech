// Section "Statistiques" : expose le endpoint réel /api/site-stats/.
// Gère deux formes de réponse possibles tant qu'on n'a pas vu stats/views.py :
// - une liste de snapshots : [{metric_key, value, fetched_at}, ...]
// - un objet unique : {metric_key, value, fetched_at}
// Dépend de fonctions déjà définies dans dashboardApp.js : apiGet,
// escapeHtml, formatRelativeDate, revealChildren.
// Ce fichier doit être chargé APRÈS dashboardApp.js.

const METRIC_LABELS = {
  pageviews_7d: { label: 'Pages vues (7j)', icon: 'fas fa-eye' },
  event_registrations_7d: { label: 'Inscriptions événements (7j)', icon: 'fas fa-calendar-check' },
};

function renderSiteStatCard(snapshot) {
  const meta = METRIC_LABELS[snapshot.metric_key] || { label: snapshot.metric_key || 'Statistique', icon: 'fas fa-chart-bar' };
  const value = typeof snapshot.value === 'number'
    ? snapshot.value.toLocaleString('fr-FR')
    : JSON.stringify(snapshot.value);
  return `
    <div class="stat-card stat-card--info">
      <p><i class="${meta.icon}"></i> ${escapeHtml(meta.label)}</p>
      <div class="stat-value">${value}</div>
      <p class="stat-hint">Mis à jour ${formatRelativeDate(snapshot.fetched_at)}</p>
    </div>`;
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
      ? snapshots.map(renderSiteStatCard).join('')
      : '<p class="empty-state">Aucune statistique disponible pour le moment.</p>';
    if (snapshots.length) revealChildren(grid, 0.08);
  } catch (err) {
    console.error('Stats:', err);
    grid.innerHTML = String(err.message).includes('403')
      ? '<p class="empty-state">Accès réservé aux administrateurs.</p>'
      : '<p class="empty-state">Impossible de charger les statistiques.</p>';
  }
}

SECTION_LOADERS.stats = loadStatsSection;