/* Configuration partagée par toutes les pages — à charger AVANT les autres scripts.

   Deux façons de servir le front :
   - Django (localhost:8000, ou le backend en prod) : front et API sur la même
     origine, pages accessibles via les routes Django (/login/, /dashboard/...).
   - Live Server (port 5500) ou front statique : fichiers HTML bruts, l'API est
     appelée sur le backend Django.

   Les autres scripts utilisent API_BASE et ROUTES (globales déclarées ici une
   seule fois : ne pas les redéclarer ailleurs, sinon le script plante). */

const PROD_API = 'https://afritech-bsa6.onrender.com';

const IS_LOCAL =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const SERVED_BY_DJANGO =
  (IS_LOCAL && window.location.port === '8000') ||
  window.location.origin === PROD_API;

const API_BASE = SERVED_BY_DJANGO
  ? ''
  : (IS_LOCAL ? 'http://localhost:8000' : PROD_API);

// Racine du dossier web/ déduite de l'URL de ce script (.../assets/js/config.js) :
// fonctionne même si Live Server est lancé depuis la racine du projet.
const WEB_ROOT = document.currentScript
  ? document.currentScript.src.replace(/assets\/js\/config\.js.*$/, '')
  : '/';

const ROUTES = SERVED_BY_DJANGO
  ? {
      home: '/',
      login: '/login/',
      register: '/register/',
      dashboard: '/dashboard/',
    }
  : {
      home: `${WEB_ROOT}index.html`,
      login: `${WEB_ROOT}assets/pages/login.html`,
      register: `${WEB_ROOT}assets/pages/register.html`,
      dashboard: `${WEB_ROOT}assets/pages/dashboard.html`,
    };

/* Liens HTML : <a data-route="login" data-route-hash="#Evenements">.
   Le href écrit dans le HTML (route Django) sert de repli. */
function applyRouteLinks(scope) {
  (scope || document).querySelectorAll('a[data-route]').forEach((a) => {
    const base = ROUTES[a.dataset.route];
    if (base) a.href = base + (a.dataset.routeHash || '');
  });
}

document.addEventListener('DOMContentLoaded', () => applyRouteLinks());
