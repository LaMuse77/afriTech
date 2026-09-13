
const API_BASE =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000'
        : 'https://afritech-bsa6.onrender.com';
// à remplacer par ton domaine en prod

const CATEGORY_BADGES = {
  spotlight: { label: 'CEO & Leaders Spotlight', class: 'badge-spotlight' },
  strategic: { label: 'Strategic Talk', class: 'badge-spotlight' },
  decoding:  { label: 'Market Decoding', class: 'badge-decoding' },
  learning:  { label: 'AFI Learning', class: 'badge-learning' },
};

/** Échappe une chaîne pour une insertion sûre dans du HTML. */
function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Renvoie une date relative en français (ex: "Il y a 3 jours"). */
function formatRelativeDate(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;

  const diffWeeks = Math.floor(diffDays / 7);
  return `Il y a ${diffWeeks} semaine${diffWeeks > 1 ? 's' : ''}`;
}

function renderVideoCard(video, featured = false) {
  const badge = CATEGORY_BADGES[video.category] || { label: video.category, class: '' };
  const title = escapeHtml(video.title);
  const watchUrl = escapeHtml(video.watch_url);

  return `
    <article class="video-card ${featured ? 'featured-video' : ''}" data-video-id="${escapeHtml(video.youtube_id)}">
      <div class="thumbnail-wrapper">
        <img src="${escapeHtml(video.thumbnail_url)}" alt="${title}" loading="lazy">
        <div class="thumbnail-overlay">
          <a href="${watchUrl}" target="_blank" rel="noopener" class="play-btn-circle" aria-label="Regarder la vidéo">
            <i class="fas fa-play"></i>
          </a>
        </div>
        ${video.duration ? `<span class="video-duration">${escapeHtml(video.duration)}</span>` : ''}
      </div>
      <div class="video-info">
        <div class="meta-top">
          <span class="video-badge ${escapeHtml(badge.class)}">${escapeHtml(badge.label)}</span>
          <span class="video-date">${formatRelativeDate(video.published_at)}</span>
        </div>
        <h3>${title}</h3>
      </div>
    </article>
  `;
}

function renderMessage(text) {
  return `<p class="no-videos">${escapeHtml(text)}</p>`;
}

async function fetchVideos() {
  const res = await fetch(`${API_BASE}/api/content/?ordering=-published_at`);
  if (!res.ok) throw new Error(`Erreur API: ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

async function loadVideos() {
  const container = document.querySelector('.video-bento-grid');
  if (!container) return;

  try {
    const videos = await fetchVideos();

    if (videos.length === 0) {
      container.innerHTML = renderMessage('Aucune vidéo disponible pour le moment.');
      return;
    }

    container.innerHTML = videos
      .map((video, i) => renderVideoCard(video, video.is_featured || i === 0))
      .join('');

    // Le contenu injecté change la hauteur de la page : on recalcule les
    // positions des animations au scroll (GSAP) si disponible.
    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
    }
  } catch (err) {
    console.error('Erreur lors du chargement des vidéos:', err);
    container.innerHTML = renderMessage('Impossible de charger les vidéos pour le moment.');
  }
}

document.addEventListener('DOMContentLoaded', loadVideos);
