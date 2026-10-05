// API_BASE et ROUTES viennent de config.js (chargé avant ce fichier).

const TOKEN_KEY = 'afi_token';

// Déjà connecté ? On va directement au dashboard.
if (localStorage.getItem(TOKEN_KEY)) {
  window.location.href = ROUTES.dashboard;
}

const form = document.getElementById('login-form');
const errorEl = document.getElementById('login-error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.detail || 'Échec de la connexion.';
      return;
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    window.location.href = ROUTES.dashboard;
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Serveur injoignable. Réessaie plus tard.';
  } finally {
    submitBtn.disabled = false;
  }
});
