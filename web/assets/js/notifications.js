let notificationsCache = [];

function renderNotifications(notifications) {
    const list = document.getElementById('notification-list');
    const badge = document.getElementById('notification-count');
    const subtitle = document.getElementById('notification-subtitle');

    notificationsCache = notifications;
    const unread = notifications.filter(n => !n.is_read);

    badge.textContent = unread.length;
    badge.hidden = unread.length === 0;
    subtitle.textContent = `${unread.length} non lue${unread.length > 1 ? 's' : ''}`;

    // État vide régénéré proprement (avant, le .map sur [] écrasait
    // le placeholder initial avec une chaîne vide)
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

async function markAsRead(id) {
    try {
        await apiGet(`/api/notifications/${id}/read/`, { method: 'PATCH' });
        // mise à jour optimiste locale : pas besoin de refetch tout
        notificationsCache = notificationsCache.map(n =>
            n.id == id ? { ...n, is_read: true } : n
        );
        renderNotifications(notificationsCache);
    } catch (err) {
        console.error('Erreur markAsRead:', err);
    }
}

async function markAllAsRead() {
    try {
        await apiGet('/api/notifications/mark-all-read/', { method: 'POST' });
        notificationsCache = notificationsCache.map(n => ({ ...n, is_read: true }));
        renderNotifications(notificationsCache);
    } catch (err) {
        console.error('Erreur markAllAsRead:', err);
    }
}

async function loadNotifications() {
    try {
        const notifications = await apiGet('/api/notifications/');
        renderNotifications(notifications);
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

    // Ferme le panneau au clic en dehors
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