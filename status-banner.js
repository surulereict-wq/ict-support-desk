// Surulere LG — ICT Support Desk
// Shows a site-wide banner when the "Status" tab in the Google Sheet
// says anything other than Operational. ICT updates that sheet directly —
// no code changes needed. See backend/README.md, "Post a service
// status update".

(function () {
  const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbxISahUBA1l6Z9XYHr3a0qBw0wTUSNJeGk6H71SNu85M0z70nJtJrzqMzOg6moq6tXV/exec';
  if (!ENDPOINT_URL) return;

  fetch(`${ENDPOINT_URL}?action=status`)
    .then((res) => res.json())
    .then((data) => {
      if (data.status !== 'ok' || !data.service) return;
      const { state, message } = data.service;
      if (!state || state === 'Operational') return;

      const banner = document.createElement('div');
      banner.className = `status-banner ${state.toLowerCase()}`;
      banner.setAttribute('role', 'alert');
      banner.innerHTML = `
        <span class="status-banner-label">${state === 'Down' ? 'Service down' : 'Service degraded'}</span>
        <span class="status-banner-message"></span>
      `;
      banner.querySelector('.status-banner-message').textContent = message || '';

      if (state === 'Down') {
        const phone = document.createElement('a');
        phone.href = 'tel:+2348100285278';
        phone.className = 'status-banner-phone';
        phone.textContent = 'Call ICT: 0810 028 5278';
        banner.appendChild(phone);
      }

      document.body.insertBefore(banner, document.body.firstChild);
    })
    .catch(() => { /* fail silently — banner just doesn't show */ });
})();
