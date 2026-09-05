[1mdiff --git a/web/assets/js/notifications.js b/notif-features-temp.js[m
[1mindex 200daad..7e043ee 100644[m
[1m--- a/web/assets/js/notifications.js[m
[1m+++ b/notif-features-temp.js[m
[36m@@ -1,4 +1,4 @@[m
[31m-let notificationsCache = [];[m
[32m+[m[32m﻿let notificationsCache = [];[m
 [m
 function renderNotifications(notifications) {[m
     const list = document.getElementById('notification-list');[m
[36m@@ -12,8 +12,8 @@[m [mfunction renderNotifications(notifications) {[m
     badge.hidden = unread.length === 0;[m
     subtitle.textContent = `${unread.length} non lue${unread.length > 1 ? 's' : ''}`;[m
 [m
[31m-    // État vide régénéré proprement (avant, le .map sur [] écrasait[m
[31m-    // le placeholder initial avec une chaîne vide)[m
[32m+[m[32m    // ├ëtat vide r├®g├®n├®r├® proprement (avant, le .map sur [] ├®crasait[m
[32m+[m[32m    // le placeholder initial avec une cha├«ne vide)[m
     if (notifications.length === 0) {[m
         list.innerHTML = `[m
             <div class="notification-empty">[m
[36m@@ -56,7 +56,7 @@[m [mfunction attachNotificationHandlers() {[m
 async function markAsRead(id) {[m
     try {[m
         await apiGet(`/api/notifications/${id}/read/`, { method: 'PATCH' });[m
[31m-        // mise à jour optimiste locale : pas besoin de refetch tout[m
[32m+[m[32m        // mise ├á jour optimiste locale : pas besoin de refetch tout[m
         notificationsCache = notificationsCache.map(n =>[m
             n.id == id ? { ...n, is_read: true } : n[m
         );[m
[36m@@ -110,5 +110,5 @@[m [mfunction initNotificationPanel() {[m
 document.addEventListener('DOMContentLoaded', () => {[m
     initNotificationPanel();[m
     loadNotifications();[m
[31m-    setInterval(loadNotifications, 60000); // rafraîchit toutes les 60s[m
[31m-});[m
\ No newline at end of file[m
[32m+[m[32m    setInterval(loadNotifications, 60000); // rafra├«chit toutes les 60s[m
[32m+[m[32m});[m
