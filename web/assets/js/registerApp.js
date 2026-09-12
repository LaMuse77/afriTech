
const API_BASE =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000'
        : window.location.origin;

const TOKEN_KEY = 'afi_token';

// Déjà connecté ? On va directement au dashboard.
if (localStorage.getItem(TOKEN_KEY)) {
  window.location.href = 'dashboard.html';
}

const form = document.getElementById('register-form');
const errorEl = document.getElementById('register-error');

/** Extrait le premier message d'erreur d'une réponse DRF. */
function firstError(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.detail) return data.detail;
  const firstKey = Object.keys(data)[0];
  if (!firstKey) return null;
  const val = data[firstKey];
  return Array.isArray(val) ? val[0] : val;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';

  const payload = {
    username: document.getElementById('username').value.trim(),
    first_name: document.getElementById('first_name').value.trim(),
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value,
  };

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = firstError(data) || "Échec de l'inscription.";
      return;
    }

    // Le backend renvoie déjà un token : on connecte directement le membre.
    localStorage.setItem(TOKEN_KEY, data.token);
    window.location.href = 'dashboard.html';
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Serveur injoignable. Réessaie plus tard.';
  } finally {
    submitBtn.disabled = false;
  }
});
