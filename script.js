// Surulere LG — ICT Support Desk
// Builds a reference number, submits it to the backend (if configured),
// and reveals the confirmation stub either way.

(function () {
  // Paste your Google Apps Script Web App URL here once deployed —
  // see backend/README.md. Leave blank and the site still works,
  // it just won't log requests anywhere.
  const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbxISahUBA1l6Z9XYHr3a0qBw0wTUSNJeGk6H71SNu85M0z70nJtJrzqMzOg6moq6tXV/exec';

  const form = document.querySelector('form.request-form');
  if (!form) return;

  const prefix = form.dataset.prefix || 'ICT';

  function buildReference() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${yy}${mm}${dd}-${rand}`;
  }

  function showStub(reference, note) {
    const stub = document.getElementById('confirmation-stub');
    if (!stub) return;
    const refEl = stub.querySelector('.ref');
    const sealEl = stub.querySelector('.seal');
    const noteEl = stub.querySelector('.details p:last-child');
    if (refEl) refEl.textContent = `Reference: ${reference}`;
    if (sealEl) sealEl.textContent = prefix;
    if (noteEl) {
      noteEl.textContent = note || 'Request received. Note this reference and quote it if you follow up with the desk.';
    }
    stub.classList.add('is-visible');
    stub.setAttribute('role', 'status');
    stub.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const reference = buildReference();
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.reference = reference;
    payload.category = prefix;

    if (!ENDPOINT_URL) {
      showStub(reference);
      form.reset();
      return;
    }

    fetch(ENDPOINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(function () {
        showStub(reference);
      })
      .catch(function () {
        showStub(reference, "Reference generated, but we couldn't confirm the connection to the log. Please also let the desk know directly.");
      })
      .finally(function () {
        form.reset();
      });
  });
})();
