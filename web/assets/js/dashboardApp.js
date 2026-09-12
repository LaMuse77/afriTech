
const API_BASE =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000'
        : window.location.origin;


const TOKEN_KEY = 'afi_token';

function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Token ${token}` } : {};
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (res.status === 401) {
    logout();
    throw new Error('Non authentifié');
  }
  if (!res.ok) throw new Error(`Erreur API: ${res.status}`);
  return res.json();
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = 'login.html';
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerHTML = `<i class="fas fa-bell"></i><span>${escapeHtml(message)}</span>`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 6000);
}

const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animateCount(el, target, { suffix = '', duration = 1100 } = {}) {
  if (!el) return;
  if (prefersReducedMotion) {
    el.textContent = target.toLocaleString('fr-FR') + suffix;
    return;
  }
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    el.textContent = value.toLocaleString('fr-FR') + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// On retire la classe en fin d'animation, sinon le transform reste figé
// et casse les effets de survol.
function revealChildren(container, step = 0.08) {
  if (!container) return;
  Array.from(container.children).forEach((child, i) => {
    child.style.setProperty('--delay', `${i * step}s`);
    child.classList.add('reveal');
    child.addEventListener('animationend', function cleanup() {
      child.classList.remove('reveal');
      child.style.removeProperty('--delay');
    }, { once: true });
  });
}

function formatRelativeDate(isoDate) {
  const diffDays = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  const weeks = Math.floor(diffDays / 7);
  return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
}

function formatEventDate(isoDate) {
  return new Date(isoDate).toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  });
}

const CATEGORY_BADGES = {
  spotlight: { label: 'CEO & Leaders Spotlight', color: '#a855f7' },
  strategic: { label: 'Strategic Talk', color: '#3b82f6' },
  decoding:  { label: 'Market & Strategy Decoding', color: '#00d4ff' },
  learning:  { label: 'AFI Learning', color: '#22c55e' },
};

function renderProfile(profile) {
  const firstName = profile.first_name || profile.username || 'membre';
  document.getElementById('welcome-name').textContent = firstName;
  document.getElementById('avatar').textContent = firstName.charAt(0);

  animateCount(document.getElementById('stat-contents'), profile.completed_contents);
  animateCount(document.getElementById('stat-hours'), profile.training_hours, { suffix: 'h' });
  animateCount(document.getElementById('stat-events'), profile.events_attended);
  animateCount(document.getElementById('stat-points'), profile.community_points);
}



// 1) Remplacer renderVideoCard par cette version (ajout de data-youtube-id
//    sur le lien "play-overlay", rien d'autre ne change) :

function renderVideoCard(v) {
  const badge = CATEGORY_BADGES[v.category] || { label: v.category, color: '#64748b' };
  const thumb = escapeHtml(v.thumbnail_url);
  const watchUrl = escapeHtml(v.watch_url);
  return `
    <div class="content-card">
      <div class="thumbnail" style="--thumb: url('${thumb}')">
        <a href="${watchUrl}" target="_blank" rel="noopener" class="play-overlay"
           aria-label="Regarder la vidéo" data-youtube-id="${escapeHtml(v.youtube_id)}">
          <i class="fas fa-play"></i>
        </a>
      </div>
      <div class="content-info">
        <span class="badge" style="--badge-color: ${badge.color}">${escapeHtml(badge.label)}</span>
        <h3>${escapeHtml(v.title)}</h3>
        <p class="meta">${escapeHtml(v.duration || '')} • ${formatRelativeDate(v.published_at)}</p>
      </div>
    </div>`;
}

//    d'attendre DOMContentLoaded, la délégation d'événements marche dès
//    que le script est chargé) :

document.addEventListener('click', (e) => {
  const link = e.target.closest('.play-overlay');
  if (!link) return;

  const youtubeId = link.dataset.youtubeId;
  if (!youtubeId) return;

  // Fire-and-forget : on ne bloque jamais l'ouverture de YouTube (target="_blank")
  // en attendant la réponse. Si le membre n'est pas connecté ou que ça échoue,
  // on ignore silencieusement — ce n'est pas critique.
  postJson(`/api/content/${encodeURIComponent(youtubeId)}/watch/`, {}).catch(() => {});
});



function renderEvent(ev) {
  const statusClass = `status-${ev.status}`;
  const right = ev.status === 'open'
    ? `<a href="../../index.html#Evenements" class="btn btn-primary btn-sm">Réserver</a>`
    : `<span class="event-status ${statusClass}">${escapeHtml(ev.status_label)}</span>`;
  return `
    <div class="event-item">
      <div>
        <strong>${escapeHtml(ev.title)}</strong><br>
        <small>${formatEventDate(ev.starts_at)}${ev.location ? ' • ' + escapeHtml(ev.location) : ''}</small>
      </div>
      ${right}
    </div>`;
}

function renderAdminEvent(ev) {
  return `
    <div class="event-item" data-event-id="${ev.id}">
      <div>
        <strong>${escapeHtml(ev.title)}</strong><br>
        <small>${formatEventDate(ev.starts_at)}${ev.location ? ' • ' + escapeHtml(ev.location) : ''}</small>
      </div>
      <div class="event-actions">
        <button type="button" class="btn btn-sm btn-ghost" data-action="reservations">
          <i class="fas fa-users"></i> Réservations
        </button>
        <button type="button" class="btn btn-sm btn-ghost" data-action="edit">
          <i class="fas fa-pen"></i> Modifier
        </button>
        <button type="button" class="btn btn-sm btn-danger" data-action="delete">
          <i class="fas fa-trash"></i> Supprimer
        </button>
      </div>
    </div>`;
}

let cachedProfile = null;

async function loadProfile() {
  try {
    cachedProfile = await apiGet('/api/me/');
    renderProfile(cachedProfile);
    initEventCreation();
  } catch (err) {
    console.error('Profil:', err);
  }
}

function renderProfileCard(profile) {
  const card = document.getElementById('profile-card');
  if (!card) return;
  const rows = [
    ['Identifiant', profile.username],
    ['Prénom', profile.first_name || '—'],
    ['Email', profile.email || '—'],
    ['Contenus terminés', profile.completed_contents],
    ['Heures de formation', `${profile.training_hours}h`],
    ['Événements suivis', profile.events_attended],
    ['Points communauté', profile.community_points.toLocaleString('fr-FR')],
  ];
  card.innerHTML = rows.map(([label, value]) => `
    <div class="profile-row">
      <span class="profile-label">${escapeHtml(label)}</span>
      <span class="profile-value">${escapeHtml(value)}</span>
    </div>`).join('');
  revealChildren(card, 0.06);
}

async function loadProfileSection() {
  try {
    const profile = cachedProfile || await apiGet('/api/me/');
    renderProfileCard(profile);
  } catch (err) {
    console.error('Profil (section):', err);
  }
}

let contentCache = [];

async function loadAllContents() {
  const grid = document.getElementById('contents-full');
  if (!grid) return;
  try {
    const data = await apiGet('/api/content/?ordering=-published_at');
    const videos = data.results || [];
    contentCache = videos;
    grid.innerHTML = videos.length
      ? videos.map(renderVideoCard).join('')
      : '<p class="empty-state">Aucun contenu disponible.</p>';
    if (videos.length) revealChildren(grid);
  } catch (err) {
    console.error('Contenus:', err);
    grid.innerHTML = '<p class="empty-state">Impossible de charger les contenus.</p>';
  }
}

// Recherche : tri à bulles, avec sortie anticipée si un passage ne fait
// aucun échange.
function bubbleSort(arr, compare) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      if (compare(arr[j], arr[j + 1]) > 0) {
        const tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return arr;
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function scoreContent(video, q) {
  const title = normalizeText(video.title);
  const category = normalizeText(video.category);
  const description = normalizeText(video.description);

  let score = 0;
  if (title.includes(q)) score += 100;
  if (title.startsWith(q)) score += 50;
  if (category.includes(q)) score += 40;
  if (description.includes(q)) score += 20;
  return score;
}

function scoreEvent(ev, q) {
  const title = normalizeText(ev.title);
  const badge = normalizeText(ev.badge);
  const location = normalizeText(ev.location);
  const description = normalizeText(ev.description);

  let score = 0;
  if (title.includes(q)) score += 100;
  if (title.startsWith(q)) score += 50;
  if (badge.includes(q)) score += 40;
  if (location.includes(q)) score += 40;
  if (description.includes(q)) score += 20;
  return score;
}

const SEARCH_CONFIGS = {
  home: {
    gridId: 'recommendations',
    getItems: () => contentCache,
    ensureLoaded: () => (contentCache.length ? null : loadAllContents()),
    score: scoreContent,
    render: renderVideoCard,
    tieBreak: (a, b) => new Date(b.published_at) - new Date(a.published_at),
    revealStep: 0.08,
    label: 'contenu',
  },
  contents: {
    gridId: 'contents-full',
    getItems: () => contentCache,
    ensureLoaded: () => (contentCache.length ? null : loadAllContents()),
    score: scoreContent,
    render: renderVideoCard,
    tieBreak: (a, b) => new Date(b.published_at) - new Date(a.published_at),
    revealStep: 0.08,
    label: 'contenu',
  },
  events: {
    gridId: 'events-full',
    getItems: () => eventCache,
    ensureLoaded: () => (eventCache.length ? null : loadAllEvents()),
    score: scoreEvent,
    render: renderAdminEvent,
    tieBreak: (a, b) => new Date(a.starts_at) - new Date(b.starts_at),
    revealStep: 0.1,
    label: 'événement',
  },
};

function getActiveSectionName() {
  const active = document.querySelector('.dashboard-section.active');
  return active ? active.id.replace('section-', '') : null;
}

async function runSearch(query) {
  const section = getActiveSectionName();
  const config = SEARCH_CONFIGS[section];
  if (!config) return;

  const grid = document.getElementById(config.gridId);
  if (!grid) return;

  await config.ensureLoaded();

  const q = normalizeText(query);

  if (!q) {
    const items = config.getItems();
    grid.innerHTML = items.length
      ? items.map(config.render).join('')
      : `<p class="empty-state">Aucun ${config.label} disponible.</p>`;
    if (items.length) revealChildren(grid, config.revealStep);
    return;
  }

  const scored = config.getItems()
    .map((item) => ({ item, score: config.score(item, q) }))
    .filter((entry) => entry.score > 0);

  bubbleSort(scored, (a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return config.tieBreak(a.item, b.item);
  });

  grid.innerHTML = scored.length
    ? scored.map((entry) => config.render(entry.item)).join('')
    : `<p class="empty-state">Aucun résultat pour « ${escapeHtml(query)} ».</p>`;
  if (scored.length) revealChildren(grid, config.revealStep);
}

function initSearch() {
  const input = document.querySelector('.search-wrapper input');
  if (!input) return;

  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => runSearch(input.value.trim()), 200);
  });

  input.addEventListener('focus', () => {
    const section = getActiveSectionName();
    const config = SEARCH_CONFIGS[section];
    input.placeholder = config
      ? `Rechercher un ${config.label}…`
      : 'Rechercher…';
  });
}

let adminEventsById = {};
let eventCache = [];

async function loadAllEvents() {
  const list = document.getElementById('events-full');
  if (!list) return;
  try {
    const data = await apiGet('/api/admin/events/');
    const events = data.results || data || [];
    eventCache = events;
    adminEventsById = {};
    events.forEach((ev) => { adminEventsById[ev.id] = ev; });
    list.innerHTML = events.length
      ? events.map(renderAdminEvent).join('')
      : '<p class="empty-state">Aucun événement.</p>';
    if (events.length) revealChildren(list, 0.1);
  } catch (err) {
    console.error('Événements:', err);
    list.innerHTML = '<p class="empty-state">Impossible de charger les événements.</p>';
  }
}

async function sendJson(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

const postJson = (path, body) => sendJson('POST', path, body);
const putJson = (path, body) => sendJson('PUT', path, body);

async function deleteResource(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    throw await res.json().catch(() => ({}));
  }
}

function firstApiError(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.detail) return data.detail;
  const firstKey = Object.keys(data)[0];
  const val = data[firstKey];
  const msg = Array.isArray(val) ? val[0] : val;
  return firstKey && msg ? `${firstKey} : ${msg}` : msg;
}

let editingEventId = null; // null = création

function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    + `T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function startEventEdit(ev) {
  const form = document.getElementById('event-create-form');
  const f = form.elements;
  editingEventId = ev.id;

  f.title.value = ev.title || '';
  f.badge.value = ev.badge || '';
  f.description.value = ev.description || '';
  f.location.value = ev.location || '';
  f.starts_at.value = isoToLocalInput(ev.starts_at);
  f.join_url.value = ev.join_url || '';
  f.status.value = ev.status || 'open';

  document.getElementById('event-form-title').innerHTML =
    '<i class="fas fa-pen"></i> Modifier l\'événement';
  document.getElementById('event-form-subtitle').textContent =
    'Les changements seront répercutés sur la landing.';
  document.getElementById('event-submit-btn').textContent = 'Enregistrer les modifications';
  document.getElementById('event-cancel-btn').hidden = false;
  document.getElementById('event-create-feedback').textContent = '';

  document.getElementById('event-create-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetEventForm() {
  const form = document.getElementById('event-create-form');
  editingEventId = null;
  form.reset();
  document.getElementById('event-form-title').innerHTML =
    '<i class="fas fa-plus-circle"></i> Créer un événement';
  document.getElementById('event-form-subtitle').textContent =
    'Il apparaîtra sur la landing et sera ouvert à la réservation.';
  document.getElementById('event-submit-btn').textContent = "Publier l'événement";
  document.getElementById('event-cancel-btn').hidden = true;
}

async function deleteEvent(id) {
  const ev = adminEventsById[id];
  const label = ev ? ev.title : 'cet événement';
  if (!window.confirm(`Supprimer « ${label} » ? Cette action est irréversible.`)) return;
  try {
    await deleteResource(`/api/admin/events/${id}/`);
    showToast('Événement supprimé.');
    if (editingEventId === id) resetEventForm();
    loadAllEvents();
  } catch (data) {
    showToast(firstApiError(data) || 'Suppression impossible.');
  }
}


function initAdminEventList() {
  const list = document.getElementById('events-full');
  if (!list) return;
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const row = btn.closest('[data-event-id]');
    const id = row && row.dataset.eventId;
    if (!id) return;
    if (btn.dataset.action === 'edit' && adminEventsById[id]) {
      startEventEdit(adminEventsById[id]);
    } else if (btn.dataset.action === 'delete') {
      deleteEvent(id);
    } else if (btn.dataset.action === 'reservations') {
      openReservationsModal(id);
    }
  });
}


function initEventCreation() {
  const card = document.getElementById('event-create-card');
  const form = document.getElementById('event-create-form');
  const feedback = document.getElementById('event-create-feedback');
  if (!card || !form) return;

  // Gating admin désactivé pour le test. La publication reste protégée côté
  // serveur (IsAdminUser). Pour réactiver :
  // if (!cachedProfile?.is_staff) { card.hidden = true; return; }
  card.hidden = false;

  document.getElementById('event-cancel-btn').addEventListener('click', resetEventForm);
  initAdminEventList();

  // form.elements et pas form.title (qui renverrait l'attribut title de l'élément).
  const f = form.elements;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    feedback.textContent = '';
    feedback.classList.remove('form-error--success');

    const submitBtn = document.getElementById('event-submit-btn');
    const isEdit = editingEventId != null;
    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = isEdit ? 'Enregistrement…' : 'Publication…';

    const payload = {
      title: f.title.value.trim(),
      badge: f.badge.value.trim(),
      description: f.description.value.trim(),
      location: f.location.value.trim(),
      starts_at: f.starts_at.value ? new Date(f.starts_at.value).toISOString() : '',
      join_url: f.join_url.value.trim(),
      status: f.status.value,
    };

    try {
      if (isEdit) {
        await putJson(`/api/admin/events/${editingEventId}/`, payload);
        feedback.classList.add('form-error--success');
        feedback.textContent = 'Événement mis à jour.';
        resetEventForm();
      } else {
        await postJson('/api/admin/events/', payload);
        feedback.classList.add('form-error--success');
        feedback.textContent = 'Événement publié. Il est maintenant visible sur la landing.';
        form.reset();
      }
      loadAllEvents();
    } catch (data) {
      feedback.textContent = firstApiError(data) || 'Opération impossible.';
    } finally {
      submitBtn.disabled = false;
      if (editingEventId != null) submitBtn.textContent = originalLabel;
    }
  });
}

async function loadVideos() {
  const grid = document.getElementById('recommendations');
  if (!grid) return;
  try {
    const data = await apiGet('/api/content/?ordering=-published_at');
    const videos = data.results || [];
    grid.innerHTML = videos.length
      ? videos.slice(0, 4).map(renderVideoCard).join('')
      : '<p class="empty-state">Aucun contenu disponible.</p>';
    if (videos.length) revealChildren(grid);
  } catch (err) {
    console.error('Vidéos:', err);
    grid.innerHTML = '<p class="empty-state">Impossible de charger les contenus.</p>';
  }
}

async function loadEvents() {
  const list = document.getElementById('events-list');
  if (!list) return;
  try {
    const data = await apiGet('/api/events/');
    const events = data.results || [];
    list.innerHTML = events.length
      ? events.map(renderEvent).join('')
      : '<p class="empty-state">Aucun événement à venir.</p>';
    if (events.length) revealChildren(list, 0.1);
  } catch (err) {
    console.error('Événements:', err);
    list.innerHTML = '<p class="empty-state">Impossible de charger les événements.</p>';
  }
}

const SECTION_LOADERS = {
  contents: loadAllContents,
  events: loadAllEvents,
  profile: loadProfileSection,
};
const loadedSections = new Set();

function activateSection(target, links, sections) {
  links.forEach(l => l.classList.toggle('active', l.dataset.section === target));
  sections.forEach(s => s.classList.toggle('active', s.id === `section-${target}`));

  if (SECTION_LOADERS[target] && !loadedSections.has(target)) {
    loadedSections.add(target);
    SECTION_LOADERS[target]();
  }

  const searchInput = document.querySelector('.search-wrapper input');
  if (searchInput && searchInput.value.trim() && SEARCH_CONFIGS[target]) {
    runSearch(searchInput.value.trim());
  }
}

function initSidebar() {
  const links = document.querySelectorAll('.nav-menu a[data-section]');
  const sections = document.querySelectorAll('.dashboard-section');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      activateSection(link.dataset.section, links, sections);
    });
  });

  document.querySelectorAll('[data-section-link]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      activateSection(el.dataset.sectionLink, links, sections);
    });
  });
}


document.addEventListener('DOMContentLoaded', () => {
  if (!getToken()) {
    logout();
    return;
  }

  initSidebar();
  initSearch();
  initReservationsModal(); // ← ajouté
  revealChildren(document.querySelector('.stats-grid'), 0.1);
  loadProfile();
  loadVideos();
  loadEvents();

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
});

// this is add 
function formatReservationDate(isoDate) {
  return new Date(isoDate).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function renderReservationItem(r) {
  return `
    <div class="reservation-item">
      <div>
        <strong>${escapeHtml(r.full_name || r.name || r.email)}</strong>
        <small>${escapeHtml(r.email || '')}${r.phone ? ' • ' + escapeHtml(r.phone) : ''}</small>
      </div>
      <small>${formatReservationDate(r.created_at)}</small>
    </div>`;
}

async function openReservationsModal(eventId) {
  const modal = document.getElementById('reservations-modal');
  if (!modal) return;
  const list = modal.querySelector('.reservations-modal__list');
  const title = modal.querySelector('.reservations-modal__title');
  const sub = modal.querySelector('.reservations-modal__sub');

  const ev = adminEventsById[eventId];
  title.textContent = ev ? ev.title : 'Réservations';
  list.innerHTML = '<p class="empty-state">Chargement…</p>';
  modal.classList.add('is-open');

  try {
    const data = await apiGet(`/api/admin/reservations/?event=${eventId}`);
    const reservations = data.results || data || [];
    sub.textContent = `${reservations.length} réservation${reservations.length > 1 ? 's' : ''}`;
    list.innerHTML = reservations.length
      ? reservations.map(renderReservationItem).join('')
      : '<p class="empty-state">Aucune réservation pour le moment.</p>';
  } catch (err) {
    console.error('Réservations:', err);
    list.innerHTML = '<p class="empty-state">Impossible de charger les réservations.</p>';
  }
}

function closeReservationsModal() {
  document.getElementById('reservations-modal')?.classList.remove('is-open');
}

function initReservationsModal() {
  const modal = document.getElementById('reservations-modal');
  if (!modal) return;
  modal.querySelector('.reservations-modal__overlay')?.addEventListener('click', closeReservationsModal);
  modal.querySelector('.reservations-modal__close')?.addEventListener('click', closeReservationsModal);
}