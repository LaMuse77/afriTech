// Section "Communauté" : statut d'adhésion (GET /api/community/me/) +
// compteur global (GET /api/community/stats/).
// Dépend de fonctions déjà définies dans dashboardApp.js : apiGet.
// Ce fichier doit être chargé APRÈS dashboardApp.js.

function formatJoinDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function renderCommunity(me, stats) {
  const target = document.getElementById('section-community');
  if (!target) return;

  const count = stats.total_members;
  const statusHtml = me.is_member
    ? `<div class="community-status community-status--active">
         <i class="fas fa-users"></i>
         <div>
           <strong>Vous êtes membre de la communauté</strong>
           <p>Depuis le ${formatJoinDate(me.sus_Start_time)}</p>
         </div>
       </div>`
    : `<div class="community-status community-status--inactive">
         <i class="fas fa-user-plus"></i>
         <div>
           <strong>Pas encore membre</strong>
           <p>Réservez un événement pour rejoindre la communauté.</p>
         </div>
       </div>`;

  target.innerHTML = `
    <div class="section-title"><i class="fas fa-users"></i> Communauté</div>
    ${statusHtml}
    <div class="community-count">
      <span class="community-count__value">${count.toLocaleString('fr-FR')}</span>
      <span class="community-count__label">membre${count > 1 ? 's' : ''} actif${count > 1 ? 's' : ''}</span>
    </div>`;
}

async function loadCommunitySection() {
  const target = document.getElementById('section-community');
  try {
    const [me, stats] = await Promise.all([
      apiGet('/api/community/me/'),
      apiGet('/api/community/stats/'),
    ]);
    renderCommunity(me, stats);
  } catch (err) {
    console.error('Communauté:', err);
    if (target) {
      target.innerHTML = `
        <div class="section-title"><i class="fas fa-users"></i> Communauté</div>
        <p class="empty-state">Impossible de charger la communauté.</p>`;
    }
  }
}

// IMPORTANT : SECTION_LOADERS est déjà déclaré en `const` dans
// dashboardApp.js (chargé avant ce fichier). On AJOUTE une propriété,
// on ne redéclare surtout pas `const SECTION_LOADERS = {...}` ici —
// ça casserait le chargement de tout le dashboard.
SECTION_LOADERS.community = loadCommunitySection;