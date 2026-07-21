// Surulere LG — ICT Support Desk
// Dashboard: reads tickets from the same Apps Script backend used by the
// request forms, renders summary stats and a filterable table, and lets
// ICT staff update a ticket's status inline.

(function () {
  // Same backend URL as script.js, plus the DASHBOARD_KEY set in Code.gs.
  // Both must match what you configured on the backend — see
  // backend/README.md, "Connect the dashboard".
  const ENDPOINT_URL = '';
  const DASHBOARD_KEY = '';

  const CATEGORY_LABELS = {
    'ICT-CU': 'Computer Upgrade',
    'ICT-PR': 'Printer & Ink',
    'ICT-SW': 'Software Upgrade',
    'ICT-SA': 'SmartAce',
    'ICT-DA': 'Document Archiving'
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
        if (data.status !== 'ok') throw new Error(data.message || 'Unknown error');
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
