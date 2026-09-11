// Notifications calculées côté front, sans endpoint dédié :
// - "Nouveau contenu" pour les vidéos publiées dans la fenêtre récente
// - "Événement à venir" pour les events proches dans le temps
// Le statut "lu" est purement local (pas de notion d'utilisateur distant ici).

const NOTIFICATIONS_READ_KEY = 'afi_notifications_read';
const CONTENT_NOTIF_WINDOW_DAYS = 7;   // contenu publié il y a moins de 7 jours
const EVENT_NOTIF_WINDOW_DAYS = 3;     // événement dans les 3 prochains jours

let notificationsCache = [];

function getReadIds() {
    try {
        return new Set(JSON.parse(localStorage.getItem(NOTIFICATIONS_READ_KEY) || '[]'));
    } catch {
        return new Set();
    }
}

function saveReadIds(ids) {
    localStorage.setItem(NOTIFICATIONS_READ_KEY, JSON.stringify([...ids]));
}

function daysBetween(a, b) {
    return Math.abs(a - b) / 86400000;
}

function buildContentNotifications(videos) {
    const now = Date.now();
    return videos
        .filter(v => daysBetween(now, new Date(v.published_at).getTime()) <= CONTENT_NOTIF_WINDOW_DAYS)
        .map(v => ({
            id: `content:${v.youtube_id}`,
            title: 'Nouveau contenu',
            message: v.title,
            icon: 'fas fa-play-circle',
            created_at: v.published_at,
        }));
}

function buildEventNotifications(events) {
    const now = Date.now();
    return events
        .filter(ev => {
            const start = new Date(ev.starts_at).getTime();
            return start >= now && daysBetween(now, start) <= EVENT_NOTIF_WINDOW_DAYS;
        })
        .map(ev => ({
            id: `event:${ev.id}`,
            title: 'Événement à venir',
            message: `${ev.title} — ${formatEventDate(ev.starts_at)}`,
            icon: 'fas fa-calendar-check',
            created_at: ev.starts_at,
        }));
}

async function buildNotifications() {
    // On réutilise apiGet, déjà défini dans dashboardApp.js — pas de nouvel
    // endpoint, juste les deux endpoints publics existants.
    const [contentData, eventData] = await Promise.all([
        apiGet('/api/content/?ordering=-published_at'),
        apiGet('/api/events/'),
    ]);
    const videos = contentData.results || [];
    const events = eventData.results || [];

    const items = [
        ...buildContentNotifications(videos),
        ...buildEventNotifications(events),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const readIds = getReadIds();
    return items.map(item => ({ ...item, is_read: readIds.has(item.id) }));
}

function renderNotifications(notifications) {
    const list = document.getElementById('notification-list');
    const badge = document.getElementById('notification-count');
    const subtitle = document.getElementById('notification-subtitle');

    notificationsCache = notifications;
    const unread = notifications.filter(n => !n.is_read);

    badge.textContent = unread.length;
    badge.hidden = unread.length === 0;
    subtitle.textContent = `${unread.length} non lue${unread.length > 1 ? 's' : ''}`;

    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-bell-slash"></i>
                <p>Aucune notification</p>
            </div>`;
        return;
    }

    list.innerHTML = notifications.map(notification => `
        <div class="notification-item ${notification.is_read ? 'read' : 'unread'}"
             data-id="${notification.id}" role="button" tabindex="0">
            <div class="notification-icon">
                <i class="${notification.icon}"></i>
            </div>
            <div class="notification-content">
                <strong>${escapeHtml(notification.title)}</strong>
                <p>${escapeHtml(notification.message)}</p>
                <small>${formatRelativeDate(notification.created_at)}</small>
            </div>
        </div>
    `).join('');

    attachNotificationHandlers();
}

function attachNotificationHandlers() {
    document.querySelectorAll('.notification-item.unread').forEach(item => {
        const markRead = () => markAsRead(item.dataset.id);
        item.addEventListener('click', markRead);
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                markRead();
            }
        });
    });
}

function markAsRead(id) {
    const readIds = getReadIds();
    readIds.add(id);
    saveReadIds(readIds);
    notificationsCache = notificationsCache.map(n => n.id === id ? { ...n, is_read: true } : n);
    renderNotifications(notificationsCache);
}

function markAllAsRead() {
    const readIds = getReadIds();
    notificationsCache.forEach(n => readIds.add(n.id));
    saveReadIds(readIds);
    notificationsCache = notificationsCache.map(n => ({ ...n, is_read: true }));
    renderNotifications(notificationsCache);
}

async function loadNotifications() {
    try {
        notificationsCache = await buildNotifications();
        renderNotifications(notificationsCache);
    } catch (err) {
        console.error('Erreur lors du chargement des notifications:', err);
    }
}

function initNotificationPanel() {
    const btn = document.getElementById('notification-btn');
    const panel = document.getElementById('notification-panel');
    const markAllBtn = document.getElementById('mark-all-read');

    if (!btn || !panel) return;

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('is-open');
    });

    document.addEventListener('click', (e) => {
        if (panel.classList.contains('is-open') && !panel.contains(e.target) && e.target !== btn) {
            panel.classList.remove('is-open');
        }
    });

    markAllBtn?.addEventListener('click', markAllAsRead);
}

document.addEventListener('DOMContentLoaded', () => {
    initNotificationPanel();
    loadNotifications();
    setInterval(loadNotifications, 60000); // rafraîchit toutes les 60s
});