// Surulere LG — ICT Support Desk
// ICT Staff Portal: combines the ticket dashboard and staff directory
// into one page. One key entry unlocks both — the backend already uses
// the same DASHBOARD_KEY for the "list" and "staffList" actions, so
// there's no reason to ask for it twice.

(function () {
  const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbxISahUBA1l6Z9XYHr3a0qBw0wTUSNJeGk6H71SNu85M0z70nJtJrzqMzOg6moq6tXV/exec';

  const configNotice = document.getElementById('config-notice');
  const portalBody = document.getElementById('portal-body');

  let DASHBOARD_KEY = sessionStorage.getItem('ictDashboardKey');
  if (!DASHBOARD_KEY && ENDPOINT_URL) {
    DASHBOARD_KEY = (window.prompt('Enter the ICT dashboard access key:') || '').trim();
    sessionStorage.setItem('ictDashboardKey', DASHBOARD_KEY);
  }

  function showConfigNotice(message) {
    configNotice.hidden = false;
    configNotice.querySelector('p').textContent = message;
    portalBody.hidden = true;
  }

  if (!ENDPOINT_URL) {
    showConfigNotice("Portal isn't connected yet. Open ict-portal.js and set ENDPOINT_URL — see backend/README.md.");
    return;
  }
  if (!DASHBOARD_KEY) {
    showConfigNotice('No access key entered — refresh this page to try again.');
    return;
  }

  // ---------------- Tab switching ----------------
  const tabTickets = document.getElementById('tab-tickets');
  const tabStaff = document.getElementById('tab-staff');
  const ticketsPanel = document.getElementById('tickets-panel');
  const staffPanel = document.getElementById('staff-panel');

  function activateTab(name) {
    const ticketsActive = name === 'tickets';
    tabTickets.classList.toggle('active', ticketsActive);
    tabStaff.classList.toggle('active', !ticketsActive);
    tabTickets.setAttribute('aria-selected', String(ticketsActive));
    tabStaff.setAttribute('aria-selected', String(!ticketsActive));
    ticketsPanel.hidden = !ticketsActive;
    staffPanel.hidden = ticketsActive;
  }
  tabTickets.addEventListener('click', () => activateTab('tickets'));
  tabStaff.addEventListener('click', () => activateTab('staff'));

  function handleKeyError(err) {
    if (String(err.message || '').toLowerCase().includes('incorrect key')) {
      sessionStorage.removeItem('ictDashboardKey');
    }
  }

  // =====================================================
  // TICKETS
  // =====================================================
  (function ticketsModule() {
    const CATEGORY_LABELS = {
      'ICT-CU': 'Computer Upgrade', 'ICT-PR': 'Printer & Ink', 'ICT-SW': 'Software Upgrade',
      'ICT-SA': 'SmartAce', 'ICT-DA': 'Document Archiving', 'ICT-IC': 'Internet Connectivity'
    };
    const SLA_DAYS = { 'ICT-CU': 3, 'ICT-PR': 1, 'ICT-SW': 2, 'ICT-SA': 5, 'ICT-DA': 4, 'ICT-IC': 1 };

    const ticketBody = document.getElementById('ticket-body');
    const emptyState = document.getElementById('empty-state');
    const refreshBtn = document.getElementById('refresh-btn');
    const exportBtn = document.getElementById('export-btn');
    const filterCategory = document.getElementById('filter-category');
    const filterStatus = document.getElementById('filter-status');
    const filterSearch = document.getElementById('filter-search');

    let allTickets = [];
    let currentFiltered = [];

    function isOverdue(t) {
      if (!t.timestamp || (t.status || 'Open') === 'Resolved') return false;
      const slaDays = SLA_DAYS[t.category];
      if (!slaDays) return false;
      return Date.now() - new Date(t.timestamp).getTime() > slaDays * 24 * 60 * 60 * 1000;
    }

    function fetchTickets() {
      refreshBtn.textContent = 'Refreshing…';
      refreshBtn.disabled = true;
      const url = `${ENDPOINT_URL}?action=list&key=${encodeURIComponent(DASHBOARD_KEY)}`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.status !== 'ok') throw new Error('Incorrect key. Refresh the page to try again.');
          allTickets = data.tickets || [];
          render();
        })
        .catch((err) => {
          handleKeyError(err);
          ticketBody.innerHTML = '';
          emptyState.hidden = false;
          emptyState.textContent = `Couldn't load tickets: ${err.message}`;
        })
        .finally(() => { refreshBtn.textContent = 'Refresh'; refreshBtn.disabled = false; });
    }

    function statusBadgeClass(status) { return `badge ${(status || 'open').toLowerCase().replace(/\s+/g, '-')}`; }
    function priorityBadgeClass(priority) { return `badge priority-${(priority || 'routine').toLowerCase()}`; }
    function formatDate(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      return isNaN(d) ? iso : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function render() {
      const catFilter = filterCategory.value, statusFilter = filterStatus.value;
      const search = filterSearch.value.trim().toLowerCase();

      const filtered = allTickets.filter((t) => {
        if (catFilter && t.category !== catFilter) return false;
        if (statusFilter && t.status !== statusFilter) return false;
        if (search && !`${t.reference} ${t.name} ${t.department}`.toLowerCase().includes(search)) return false;
        return true;
      });
      currentFiltered = filtered;

      document.getElementById('stat-total').textContent = allTickets.length;
      document.getElementById('stat-open').textContent = allTickets.filter((t) => (t.status || 'Open') === 'Open').length;
      document.getElementById('stat-progress').textContent = allTickets.filter((t) => t.status === 'In Progress').length;
      document.getElementById('stat-resolved').textContent = allTickets.filter((t) => t.status === 'Resolved').length;
      document.getElementById('stat-urgent').textContent = allTickets.filter((t) => (t.priority || '').toLowerCase() === 'urgent').length;
      document.getElementById('stat-satisfied').textContent = allTickets.filter((t) => t.satisfaction === 'Satisfied').length;
      document.getElementById('stat-overdue').textContent = allTickets.filter(isOverdue).length;

      ticketBody.innerHTML = '';
      if (filtered.length === 0) { emptyState.hidden = false; return; }
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
          opt.value = s; opt.textContent = s;
          if ((t.status || 'Open') === s) opt.selected = true;
          select.appendChild(opt);
        });
        select.addEventListener('change', () => updateStatus(t.reference, select.value));
        statusCell.appendChild(select);

        if (isOverdue(t)) {
          const badge = document.createElement('span');
          badge.className = 'badge priority-urgent';
          badge.style.marginLeft = '0.4rem';
          badge.textContent = 'Overdue';
          statusCell.appendChild(badge);
        }
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

    function updateStatus(reference, status) {
      fetch(ENDPOINT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateStatus', key: DASHBOARD_KEY, reference, status })
      }).then(() => fetchTickets());
    }

    function exportCsv() {
      if (currentFiltered.length === 0) { window.alert('No tickets to export with the current filters.'); return; }
      const columns = ['reference', 'timestamp', 'category', 'name', 'department', 'contact', 'priority', 'status', 'satisfaction', 'feedback', 'purposeType', 'details'];
      const header = ['Reference', 'Submitted', 'Category', 'Name', 'Department', 'Contact', 'Priority', 'Status', 'Satisfaction', 'Feedback', 'Type', 'Details'];
      const rows = currentFiltered.map((t) => columns.map((col) => {
        let val = t[col] || '';
        if (col === 'category') val = CATEGORY_LABELS[val] || val;
        if (col === 'timestamp') val = formatDate(val);
        return csvEscape(val);
      }));
      downloadCsv([header, ...rows], `ict-support-desk-tickets-${new Date().toISOString().slice(0, 10)}.csv`);
    }

    refreshBtn.addEventListener('click', fetchTickets);
    if (exportBtn) exportBtn.addEventListener('click', exportCsv);
    filterCategory.addEventListener('change', render);
    filterStatus.addEventListener('change', render);
    filterSearch.addEventListener('input', render);

    fetchTickets();
  })();

  // =====================================================
  // STAFF DIRECTORY
  // =====================================================
  (function staffModule() {
    const staffBody = document.getElementById('staff-body');
    const staffEmptyState = document.getElementById('staff-empty-state');
    const staffRefreshBtn = document.getElementById('staff-refresh-btn');
    const staffExportBtn = document.getElementById('staff-export-btn');
    const staffFilterCadre = document.getElementById('staff-filter-cadre');
    const staffFilterSearch = document.getElementById('staff-filter-search');

    let allStaff = [];
    let currentFiltered = [];

    function fetchStaff() {
      staffRefreshBtn.textContent = 'Refreshing…';
      staffRefreshBtn.disabled = true;
      const url = `${ENDPOINT_URL}?action=staffList&key=${encodeURIComponent(DASHBOARD_KEY)}`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.status !== 'ok') throw new Error('Incorrect key. Refresh the page to try again.');
          allStaff = data.staff || [];
          render();
        })
        .catch((err) => {
          handleKeyError(err);
          staffBody.innerHTML = '';
          staffEmptyState.hidden = false;
          staffEmptyState.textContent = `Couldn't load staff records: ${err.message}`;
        })
        .finally(() => { staffRefreshBtn.textContent = 'Refresh'; staffRefreshBtn.disabled = false; });
    }

    function formatDate(val) {
      if (!val) return '—';
      const d = new Date(val);
      return isNaN(d) ? val : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function render() {
      const cadreFilter = staffFilterCadre.value;
      const search = staffFilterSearch.value.trim().toLowerCase();

      const filtered = allStaff.filter((s) => {
        if (cadreFilter && s.cadre !== cadreFilter) return false;
        if (search && !`${s.name} ${s.staffId} ${s.department}`.toLowerCase().includes(search)) return false;
        return true;
      });
      currentFiltered = filtered;

      document.getElementById('staff-stat-total').textContent = allStaff.length;
      document.getElementById('staff-stat-senior').textContent = allStaff.filter((s) => s.cadre === 'Senior Staff').length;
      document.getElementById('staff-stat-junior').textContent = allStaff.filter((s) => s.cadre === 'Junior Staff').length;

      staffBody.innerHTML = '';
      if (filtered.length === 0) { staffEmptyState.hidden = false; return; }
      staffEmptyState.hidden = true;

      filtered.forEach((s) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHtml(s.name || '—')}</td>
          <td class="ref">${escapeHtml(s.staffId || '—')}</td>
          <td><span class="badge ${s.cadre === 'Senior Staff' ? 'resolved' : 'in-progress'}">${escapeHtml(s.cadre || '—')}</span></td>
          <td>${escapeHtml(s.department || '—')}</td>
          <td>${escapeHtml(s.gradeLevel || '—')}</td>
          <td>${escapeHtml(s.contact || '—')}</td>
          <td>${escapeHtml(s.email || '—')}</td>
          <td>${formatDate(s.employmentDate)}</td>
          <td class="ref">${escapeHtml(s.password || '—')}</td>
        `;
        staffBody.appendChild(tr);
      });
    }

    function exportCsv() {
      if (currentFiltered.length === 0) { window.alert('No records to export with the current filters.'); return; }
      const columns = ['name', 'staffId', 'cadre', 'department', 'gradeLevel', 'contact', 'email', 'employmentDate', 'password'];
      const header = ['Full Name', 'Staff ID', 'Cadre', 'Department', 'Grade', 'Phone', 'Email', 'Employment Date', 'Password'];
      const rows = currentFiltered.map((s) => columns.map((col) => csvEscape(col === 'employmentDate' ? formatDate(s[col]) : (s[col] ?? ''))));
      downloadCsv([header, ...rows], `staff-directory-${new Date().toISOString().slice(0, 10)}.csv`);
    }

    staffRefreshBtn.addEventListener('click', fetchStaff);
    if (staffExportBtn) staffExportBtn.addEventListener('click', exportCsv);
    staffFilterCadre.addEventListener('change', render);
    staffFilterSearch.addEventListener('input', render);

    fetchStaff();
  })();

  // ---------------- Shared helpers ----------------
  function downloadCsv(rows, filename) {
    const csv = rows.map((r) => r.join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function csvEscape(val) {
    const s = String(val ?? '');
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
