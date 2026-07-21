// Surulere LG — ICT Support Desk
// Looks up a ticket by reference and, once Resolved, lets the requester
// leave a Satisfied / Not satisfied rating plus an optional comment.

(function () {
  const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbxISahUBA1l6Z9XYHr3a0qBw0wTUSNJeGk6H71SNu85M0z70nJtJrzqMzOg6moq6tXV/exec';

  const form = document.getElementById('lookup-form');
  const resultArea = document.getElementById('result-area');
  if (!form || !resultArea) return;

  const CATEGORY_LABELS = {
    'ICT-CU': 'Computer Upgrade',
    'ICT-PR': 'Printer & Ink',
    'ICT-SW': 'Software Upgrade',
    'ICT-SA': 'SmartAce',
    'ICT-DA': 'Document Archiving',
    'ICT-IC': 'Internet Connectivity'
  };

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const reference = document.getElementById('reference-input').value.trim();
    if (!reference) return;

    resultArea.innerHTML = '<p class="dash-empty">Checking…</p>';

    if (!ENDPOINT_URL) {
      resultArea.innerHTML = '<p class="dash-config">Lookup isn\'t connected yet. Set ENDPOINT_URL in check-status.js.</p>';
      return;
    }

    fetch(`${ENDPOINT_URL}?action=check&reference=${encodeURIComponent(reference)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status !== 'ok' || !data.ticket || !data.ticket.found) {
          resultArea.innerHTML = '<p class="dash-empty">No request found with that reference. Double-check the number and try again.</p>';
          return;
        }
        renderResult(reference, data.ticket);
      })
      .catch(() => {
        resultArea.innerHTML = '<p class="dash-empty">Couldn\'t reach the ticket log right now. Please try again shortly.</p>';
      });
  });

  function renderResult(reference, ticket) {
    const category = CATEGORY_LABELS[ticket.category] || ticket.category || 'Request';
    const status = ticket.ticketStatus || 'Open';

    let html = `
      <div class="dash-config" style="text-align:left;">
        <p style="margin-bottom:0.4rem;"><strong>${escapeHtml(category)}</strong> — ${escapeHtml(reference)}</p>
        <p>Status: <span class="badge ${status.toLowerCase().replace(/\s+/g, '-')}">${escapeHtml(status)}</span></p>
      </div>
    `;

    if (status.toLowerCase() !== 'resolved') {
      html += '<p style="margin-top:1rem; color:var(--muted);">This request hasn\'t been marked Resolved yet — check back later, or call the desk if it\'s urgent.</p>';
      resultArea.innerHTML = html;
      return;
    }

    if (ticket.hasFeedback) {
      html += '<p style="margin-top:1rem; color:var(--muted);">Thanks — you\'ve already given feedback on this request.</p>';
      resultArea.innerHTML = html;
      return;
    }

    html += `
      <form id="feedback-form" style="margin-top:1.25rem;">
        <fieldset>
          <legend>Were you satisfied with how this was resolved?</legend>
          <div class="radio-group">
            <label><input type="radio" name="satisfaction" value="Satisfied" checked> Satisfied</label>
            <label><input type="radio" name="satisfaction" value="Not satisfied"> Not satisfied</label>
          </div>
        </fieldset>
        <div class="field">
          <label for="feedback-comment">Comment <span class="hint">(optional)</span></label>
          <textarea id="feedback-comment" rows="3" placeholder="Anything ICT should know."></textarea>
        </div>
        <button class="submit" type="submit">Submit feedback</button>
      </form>
    `;
    resultArea.innerHTML = html;

    document.getElementById('feedback-form').addEventListener('submit', function (e) {
      e.preventDefault();
      const satisfaction = this.querySelector('input[name="satisfaction"]:checked').value;
      const comment = document.getElementById('feedback-comment').value.trim();

      fetch(ENDPOINT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'feedback', reference, satisfaction, comment })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'ok') {
            resultArea.innerHTML = html.split('<form')[0] + '<p style="margin-top:1rem; color:var(--gold-dark); font-weight:600;">Thanks for the feedback — recorded.</p>';
          } else {
            resultArea.innerHTML += `<p style="margin-top:0.75rem; color:#8f2618;">${escapeHtml(data.message || 'Something went wrong, please try again.')}</p>`;
          }
        })
        .catch(() => {
          resultArea.innerHTML += '<p style="margin-top:0.75rem; color:#8f2618;">Couldn\'t submit feedback right now, please try again.</p>';
        });
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
})();
