/**
 * Surulere LG — ICT Support Desk
 * Backend: logs every support request to a Google Sheet.
 *
 * SETUP (one-time, ~5 minutes):
 * 1. Create a new Google Sheet. Rename the first tab "Log".
 * 2. In the Sheet: Extensions > Apps Script.
 * 3. Delete any starter code, paste this whole file in, save.
 * 4. Click "Deploy" > "New deployment" > type: "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Deploy. Copy the Web App URL it gives you (ends in /exec).
 * 6. Paste that URL into ENDPOINT_URL in script.js on the website.
 * 7. Submit a test request from the site and confirm a row appears
 *    in the "Log" tab.
 *
 * That's the whole backend — no server, no hosting cost, and the
 * ICT Unit already has the Google Sheet as a readable, filterable,
 * exportable ticket log.
 *
 * DASHBOARD ACCESS:
 * dashboard.html reads tickets through this same web app, via
 * GET ?action=list&key=YOUR_KEY — set DASHBOARD_KEY below to any
 * password-like string, then paste the same value into dashboard.html
 * (see backend/README.md, section "Connect the dashboard").
 * This keeps the ticket list from being readable by anyone who
 * merely guesses the /exec URL.
 */

const SHEET_NAME = 'Log';
const DASHBOARD_KEY = 'change-this-key';
const HEADERS = [
  'Timestamp',
  'Reference',
  'Category',
  'Purpose / Type',
  'Name',
  'Department',
  'Contact',
  'Priority',
  'Details',
  'Status'
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'updateStatus') {
      return updateStatus(data);
    }

    const sheet = getOrCreateSheet();
    sheet.appendRow([
      new Date(),
      data.reference || '',
      data.category || '',
      data.purpose || data.requestType || data.upgradeType || data.issueType || '',
      data.name || '',
      data.department || '',
      data.contact || '',
      data.priority || 'routine',
      data.details || '',
      'Open'
    ]);

    return jsonResponse({ status: 'ok', reference: data.reference || '' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: String(err) });
  }
}

// Dashboard-only: updates the Status column for a given reference number.
// Requires the same DASHBOARD_KEY used for the list endpoint.
function updateStatus(data) {
  if (data.key !== DASHBOARD_KEY) {
    return jsonResponse({ status: 'error', message: 'Invalid or missing key.' });
  }
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ status: 'error', message: 'No tickets logged yet.' });

  const refs = sheet.getRange(2, 2, lastRow - 1, 1).getValues(); // column B = Reference
  for (let i = 0; i < refs.length; i++) {
    if (refs[i][0] === data.reference) {
      sheet.getRange(i + 2, HEADERS.length).setValue(data.status); // last column = Status
      return jsonResponse({ status: 'ok' });
    }
  }
  return jsonResponse({ status: 'error', message: 'Reference not found.' });
}

// GET with no params: simple health check you can open in a browser.
// GET ?action=list&key=DASHBOARD_KEY: returns all logged tickets as JSON,
// used by dashboard.html.
function doGet(e) {
  const params = (e && e.parameter) || {};

  if (params.action === 'list') {
    if (params.key !== DASHBOARD_KEY) {
      return jsonResponse({ status: 'error', message: 'Invalid or missing key.' });
    }
    return jsonResponse({ status: 'ok', tickets: readAllTickets() });
  }

  return jsonResponse({ status: 'ok', message: 'ICT Support Desk backend is running.' });
}

function readAllTickets() {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  return values.map(function (row) {
    const ticket = {};
    HEADERS.forEach(function (header, i) {
      const key = header.replace(/[^a-zA-Z0-9]/g, '').charAt(0).toLowerCase() + header.replace(/[^a-zA-Z0-9]/g, '').slice(1);
      ticket[key] = row[i] instanceof Date ? row[i].toISOString() : row[i];
    });
    return ticket;
  }).reverse(); // most recent first
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
