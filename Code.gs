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
 *
 * SERVICE STATUS BANNER:
 * A second sheet tab called "Status" controls a banner shown on every
 * public page (e.g. "Internet is currently down — ISP notified,
 * restoration expected by 3pm"). No code changes needed to update it —
 * ICT just edits two cells directly in the Sheet. See backend/README.md,
 * section "Post a service status update".
 *
 * FEEDBACK / SATISFACTION:
 * Once a ticket is marked Resolved, the requester can look it up on
 * check-status.html using their reference number and leave a
 * Satisfied / Not satisfied rating plus an optional comment. This
 * writes back into two new columns on the same "Log" row. If your
 * Sheet already existed before this feature, the two new column
 * headers are added automatically the next time this script runs —
 * no manual Sheet editing needed.
 */

const SHEET_NAME = 'Log';
const STATUS_SHEET_NAME = 'Status';
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
  'Status',
  'Satisfaction',
  'Feedback'
];
const STATUS_HEADERS = ['State', 'Message', 'Updated'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'updateStatus') {
      return updateStatus(data);
    }

    if (data.action === 'feedback') {
      return submitFeedback(data);
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
      'Open',
      '',
      ''
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

  const statusCol = HEADERS.indexOf('Status') + 1;
  const refs = sheet.getRange(2, 2, lastRow - 1, 1).getValues(); // column B = Reference
  for (let i = 0; i < refs.length; i++) {
    if (refs[i][0] === data.reference) {
      sheet.getRange(i + 2, statusCol).setValue(data.status);
      return jsonResponse({ status: 'ok' });
    }
  }
  return jsonResponse({ status: 'error', message: 'Reference not found.' });
}

// Public: look up a single ticket by reference, for check-status.html.
// Returns only what a requester needs to see — not the full row.
function lookupTicket(reference) {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { found: false };

  const statusCol = HEADERS.indexOf('Status') + 1;
  const satisfactionCol = HEADERS.indexOf('Satisfaction') + 1;
  const categoryCol = HEADERS.indexOf('Category') + 1;

  const refs = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (let i = 0; i < refs.length; i++) {
    if (refs[i][0] === reference) {
      const row = i + 2;
      return {
        found: true,
        category: sheet.getRange(row, categoryCol).getValue(),
        ticketStatus: sheet.getRange(row, statusCol).getValue() || 'Open',
        hasFeedback: !!sheet.getRange(row, satisfactionCol).getValue()
      };
    }
  }
  return { found: false };
}

// Public: records a requester's satisfaction rating once a ticket is
// Resolved. Only allowed once per ticket — after that, hasFeedback
// blocks further submissions (enforced by lookupTicket's check on the
// client, and re-checked here).
function submitFeedback(data) {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ status: 'error', message: 'Reference not found.' });

  const statusCol = HEADERS.indexOf('Status') + 1;
  const satisfactionCol = HEADERS.indexOf('Satisfaction') + 1;
  const feedbackCol = HEADERS.indexOf('Feedback') + 1;

  const refs = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (let i = 0; i < refs.length; i++) {
    if (refs[i][0] === data.reference) {
      const row = i + 2;
      const currentStatus = String(sheet.getRange(row, statusCol).getValue() || '');
      if (currentStatus.toLowerCase() !== 'resolved') {
        return jsonResponse({ status: 'error', message: 'This ticket has not been marked Resolved yet.' });
      }
      if (sheet.getRange(row, satisfactionCol).getValue()) {
        return jsonResponse({ status: 'error', message: 'Feedback was already submitted for this ticket.' });
      }
      sheet.getRange(row, satisfactionCol).setValue(data.satisfaction || '');
      sheet.getRange(row, feedbackCol).setValue(data.comment || '');
      return jsonResponse({ status: 'ok' });
    }
  }
  return jsonResponse({ status: 'error', message: 'Reference not found.' });
}

// GET with no params: simple health check you can open in a browser.
// GET ?action=list&key=DASHBOARD_KEY: returns all logged tickets as JSON,
// used by dashboard.html.
// GET ?action=status: returns the current service status banner — public,
// no key required, since this is meant to be visible to everyone.
function doGet(e) {
  const params = (e && e.parameter) || {};

  if (params.action === 'list') {
    if (params.key !== DASHBOARD_KEY) {
      return jsonResponse({ status: 'error', message: 'Invalid or missing key.' });
    }
    return jsonResponse({ status: 'ok', tickets: readAllTickets() });
  }

  if (params.action === 'status') {
    return jsonResponse({ status: 'ok', service: readServiceStatus() });
  }

  if (params.action === 'check') {
    return jsonResponse({ status: 'ok', ticket: lookupTicket(params.reference || '') });
  }

  return jsonResponse({ status: 'ok', message: 'ICT Support Desk backend is running.' });
}

function readServiceStatus() {
  const sheet = getOrCreateStatusSheet();
  const row = sheet.getRange(2, 1, 1, STATUS_HEADERS.length).getValues()[0];
  const updated = row[2];
  return {
    state: row[0] || 'Operational',
    message: row[1] || '',
    updatedAt: updated instanceof Date ? updated.toISOString() : (updated || '')
  };
}

function getOrCreateStatusSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(STATUS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(STATUS_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(STATUS_HEADERS);
    sheet.appendRow(['Operational', 'All services running normally.', new Date()]);
    sheet.setFrozenRows(1);
  }
  return sheet;
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
  } else {
    // Migration: if this sheet was created before Satisfaction/Feedback
    // existed, add any missing header columns without touching existing data.
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (currentHeaders.length < HEADERS.length) {
      const missing = HEADERS.slice(currentHeaders.length);
      sheet.getRange(1, currentHeaders.length + 1, 1, missing.length).setValues([missing]);
    }
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
