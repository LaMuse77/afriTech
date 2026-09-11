// Section "Statistiques" : cache Mixpanel exposé par GET /api/stats/
// (IsAdminUser côté serveur — un membre non-staff verra un 403).
// Dépend de fonctions déjà définies dans dashboardApp.js : apiGet,
// escapeHtml, formatRelativeDate, revealChildren.
// Ce fichier doit être chargé APRÈS dashboardApp.js.

const METRIC_LABELS = {
  pageviews_7d: { label: 'Pages vues (7j)', icon: 'fas fa-eye' },
  event_registrations_7d: { label: 'Inscriptions événements (7j)', icon: 'fas fa-calendar-check' },
};

function renderSiteStatCard(snapshot) {
  const meta = METRIC_LABELS[snapshot.metric_key] || { label: snapshot.metric_key, icon: 'fas fa-chart-bar' };
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
    const data = await apiGet('/api/stats/');
    const snapshots = data.results || data;
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

// Même remarque que dans community.js : on AJOUTE une propriété à
// SECTION_LOADERS, déjà déclaré dans dashboardApp.js — pas de redéclaration.
SECTION_LOADERS.stats = loadStatsSection;