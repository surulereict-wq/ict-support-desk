// Surulere LG — ICT Support Desk
// Staff directory lookup for SmartAce identity verification. Same
// key-gating pattern as dashboard.js: the key is asked for on load and
// checked server-side — never stored in this file.

(function () {
  const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbxISahUBA1l6Z9XYHr3a0qBw0wTUSNJeGk6H71SNu85M0z70nJtJrzqMzOg6moq6tXV/exec';

  const ticketBody = document.getElementById('ticket-body');
  const emptyState = document.getElementById('empty-state');
  const configNotice = document.getElementById('config-notice');
  const statsSection = document.getElementById('stats-section');
  const refreshBtn = document.getElementById('refresh-btn');
  const exportBtn = document.getElementById('export-btn');
  const filterCadre = document.getElementById('filter-cadre');
  const filterSearch = document.getElementById('filter-search');

  let allStaff = [];
  let currentFiltered = [];

  let DASHBOARD_KEY = sessionStorage.getItem('ictDashboardKey');
  if (!DASHBOARD_KEY) {
    DASHBOARD_KEY = (window.prompt('Enter the ICT dashboard access key:') || '').trim();
    sessionStorage.setItem('ictDashboardKey', DASHBOARD_KEY);
  }

  function showConfigNotice(message) {
    configNotice.hidden = false;
    configNotice.querySelector('p').textContent = message;
    statsSection.hidden = true;
    document.querySelector('.dash-toolbar').hidden = true;
    document.querySelector('.ticket-table-wrap').hidden = true;
  }

  if (!ENDPOINT_URL) {
    showConfigNotice("Directory isn't connected yet. Open staff-directory.js and set ENDPOINT_URL — see backend/README.md.");
    return;
  }
  if (!DASHBOARD_KEY) {
    showConfigNotice('No access key entered — refresh this page to try again.');
    return;
  }

  function fetchStaff() {
    refreshBtn.textContent = 'Refreshing…';
    refreshBtn.disabled = true;

    const url = `${ENDPOINT_URL}?action=staffList&key=${encodeURIComponent(DASHBOARD_KEY)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.status !== 'ok') {
          sessionStorage.removeItem('ictDashboardKey');
          throw new Error('Incorrect key. Refresh the page to try again.');
        }
        allStaff = data.staff || [];
        render();
      })
      .catch((err) => {
        ticketBody.innerHTML = '';
        emptyState.hidden = false;
        emptyState.textContent = `Couldn't load staff records: ${err.message}`;
      })
      .finally(() => {
        refreshBtn.textContent = 'Refresh';
        refreshBtn.disabled = false;
      });
  }

  function formatDate(val) {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function render() {
    const cadreFilter = filterCadre.value;
    const search = filterSearch.value.trim().toLowerCase();

    const filtered = allStaff.filter((s) => {
      if (cadreFilter && s.cadre !== cadreFilter) return false;
      if (search) {
        const haystack = `${s.name} ${s.staffId} ${s.department}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
    currentFiltered = filtered;

    document.getElementById('stat-total').textContent = allStaff.length;
    document.getElementById('stat-senior').textContent = allStaff.filter((s) => s.cadre === 'Senior Staff').length;
    document.getElementById('stat-junior').textContent = allStaff.filter((s) => s.cadre === 'Junior Staff').length;

    ticketBody.innerHTML = '';
    if (filtered.length === 0) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

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
      ticketBody.appendChild(tr);
    });
  }

  function exportCsv() {
    if (currentFiltered.length === 0) {
      window.alert('No records to export with the current filters.');
      return;
    }
    const columns = ['name', 'staffId', 'cadre', 'department', 'gradeLevel', 'contact', 'email', 'employmentDate', 'password'];
    const header = ['Full Name', 'Staff ID', 'Cadre', 'Department', 'Grade', 'Phone', 'Email', 'Employment Date', 'Password'];

    const rows = currentFiltered.map((s) => columns.map((col) => csvEscape(col === 'employmentDate' ? formatDate(s[col]) : (s[col] ?? ''))));
    const csv = [header.map(csvEscape).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `staff-directory-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function csvEscape(val) {
    const s = String(val ?? '');
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  refreshBtn.addEventListener('click', fetchStaff);
  if (exportBtn) exportBtn.addEventListener('click', exportCsv);
  filterCadre.addEventListener('change', render);
  filterSearch.addEventListener('input', render);

  fetchStaff();
})();
