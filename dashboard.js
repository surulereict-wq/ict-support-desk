// Surulere LG — ICT Support Desk
// Dashboard: reads tickets from the same Apps Script backend used by the
// request forms, renders summary stats and a filterable table, and lets
// ICT staff update a ticket's status inline.

(function () {
  // Same backend URL as script.js, plus the DASHBOARD_KEY set in Code.gs.
  // Both must match what you configured on the backend — see
  // backend/README.md, "Connect the dashboard".
  const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbxISahUBA1l6Z9XYHr3a0qBw0wTUSNJeGk6H71SNu85M0z70nJtJrzqMzOg6moq6tXV/exec';

  // The key is never stored in this file. It's asked for on load and kept
  // only in this browser tab's memory (sessionStorage) — cleared when the
  // tab closes. The backend itself checks whether the key is correct, so a
  // wrong or missing key simply gets no data back.
  let DASHBOARD_KEY = sessionStorage.getItem('ictDashboardKey');
  if (!DASHBOARD_KEY) {
    DASHBOARD_KEY = window.prompt('Enter the ICT dashboard access key:') || '';
    sessionStorage.setItem('ictDashboardKey', DASHBOARD_KEY);
  }

  const CATEGORY_LABELS = {
    'ICT-CU': 'Computer Upgrade',
    'ICT-PR': 'Printer & Ink',
    'ICT-SW': 'Software Upgrade',
    'ICT-SA': 'SmartAce',
    'ICT-DA': 'Document Archiving',
    'ICT-IC': 'Internet Connectivity'
  };

  const ticketBody = document.getElementById('ticket-body');
  const emptyState = document.getElementById('empty-state');
  const configNotice = document.getElementById('config-notice');
  const statsSection = document.getElementById('stats-section');
  const refreshBtn = document.getElementById('refresh-btn');
  const filterCategory = document.getElementById('filter-category');
  const filterStatus = document.getElementById('filter-status');
  const filterSearch = document.getElementById('filter-search');

  let allTickets = [];

  if (!ENDPOINT_URL || !DASHBOARD_KEY) {
    configNotice.hidden = false;
    configNotice.querySelector('p').textContent = ENDPOINT_URL
      ? 'No access key entered — refresh this page to try again.'
      : "Dashboard isn't connected yet. Open dashboard.js and set ENDPOINT_URL — see backend/README.md.";
    statsSection.hidden = true;
    document.querySelector('.dash-toolbar').hidden = true;
    document.querySelector('.ticket-table-wrap').hidden = true;
    return;
  }

  function fetchTickets() {
    refreshBtn.textContent = 'Refreshing…';
    refreshBtn.disabled = true;

    const url = `${ENDPOINT_URL}?action=list&key=${encodeURIComponent(DASHBOARD_KEY)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.status !== 'ok') {
          sessionStorage.removeItem('ictDashboardKey');
          throw new Error('Incorrect key. Refresh the page to try again.');
        }
        allTickets = data.tickets || [];
        render();
      })
      .catch((err) => {
        ticketBody.innerHTML = '';
        emptyState.hidden = false;
        emptyState.textContent = `Couldn't load tickets: ${err.message}`;
      })
      .finally(() => {
        refreshBtn.textContent = 'Refresh';
        refreshBtn.disabled = false;
      });
  }

  function updateStatus(reference, status) {
    fetch(ENDPOINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'updateStatus', key: DASHBOARD_KEY, reference, status })
    }).then(() => fetchTickets());
  }

  function statusBadgeClass(status) {
    const s = (status || 'open').toLowerCase().replace(/\s+/g, '-');
    return `badge ${s}`;
  }

  function priorityBadgeClass(priority) {
    const p = (priority || 'routine').toLowerCase();
    return `badge priority-${p}`;
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function render() {
    const catFilter = filterCategory.value;
    const statusFilter = filterStatus.value;
    const search = filterSearch.value.trim().toLowerCase();

    const filtered = allTickets.filter((t) => {
      if (catFilter && t.category !== catFilter) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (search) {
        const haystack = `${t.reference} ${t.name} ${t.department}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    // Stats always reflect the full set, not the filtered view.
    document.getElementById('stat-total').textContent = allTickets.length;
    document.getElementById('stat-open').textContent = allTickets.filter((t) => (t.status || 'Open') === 'Open').length;
    document.getElementById('stat-progress').textContent = allTickets.filter((t) => t.status === 'In Progress').length;
    document.getElementById('stat-resolved').textContent = allTickets.filter((t) => t.status === 'Resolved').length;
    document.getElementById('stat-urgent').textContent = allTickets.filter((t) => (t.priority || '').toLowerCase() === 'urgent').length;
    document.getElementById('stat-satisfied').textContent = allTickets.filter((t) => t.satisfaction === 'Satisfied').length;

    ticketBody.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    filtered.forEach((t) => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td class="ref">${escapeHtml(t.reference || '—')}</td>
        <td>${formatDate(t.timestamp)}</td>
        <td>${escapeHtml(CATEGORY_LABELS[t.category] || t.category || '—')}</td>
        <td>${escapeHtml(t.name || '—')}</td>
        <td>${escapeHtml(t.department || '—')}</td>
        <td><span class="${priorityBadgeClass(t.priority)}">${escapeHtml(t.priority || 'routine')}</span></td>
        <td></td>
        <td>${feedbackCell(t)}</td>
      `;

      const statusCell = tr.children[6];
      const select = document.createElement('select');
      select.className = 'status-select';
      ['Open', 'In Progress', 'Resolved'].forEach((s) => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        if ((t.status || 'Open') === s) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener('change', () => updateStatus(t.reference, select.value));
      statusCell.appendChild(select);

      ticketBody.appendChild(tr);
    });
  }

  function feedbackCell(t) {
    if (!t.satisfaction) return '<span style="color:var(--muted);">—</span>';
    const good = t.satisfaction === 'Satisfied';
    const badge = `<span class="badge ${good ? 'resolved' : 'priority-urgent'}">${escapeHtml(t.satisfaction)}</span>`;
    const comment = t.feedback ? ` title="${escapeHtml(t.feedback)}"` : '';
    return `<span${comment}>${badge}</span>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  refreshBtn.addEventListener('click', fetchTickets);
  filterCategory.addEventListener('change', render);
  filterStatus.addEventListener('change', render);
  filterSearch.addEventListener('input', render);

  fetchTickets();
})();
