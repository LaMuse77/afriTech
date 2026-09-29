const API_BASE =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000'
        : 'https://afritech-bsa6.onrender.com';

function initNewsletterForm() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  const feedback = document.getElementById('newsletter-feedback');
  const input = form.querySelector('input[type="email"]');
  const button = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = input.value.trim();
    if (!email) return;

    button.disabled = true;
    if (feedback) {
      feedback.textContent = 'Envoi en cours…';
      feedback.className = 'newsletter-feedback';
    }

    try {
      const res = await fetch(`${API_BASE}/api/newsletter/subscribe/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        form.reset();
        if (feedback) {
          feedback.textContent = data.detail || 'Merci ! Votre inscription est confirmée.';
          feedback.className = 'newsletter-feedback newsletter-feedback--success';
        }
      } else {
        const message =
          (data.email && data.email[0]) ||
          data.detail ||
          "Une erreur est survenue. Réessayez.";
        if (feedback) {
          feedback.textContent = message;
          feedback.className = 'newsletter-feedback newsletter-feedback--error';
        }
      }
    } catch (err) {
      console.error('Erreur inscription newsletter:', err);
      if (feedback) {
        feedback.textContent = 'Serveur injoignable. Réessayez plus tard.';
        feedback.className = 'newsletter-feedback newsletter-feedback--error';
      }
    } finally {
      button.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', initNewsletterForm);
