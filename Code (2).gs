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
 */

const SHEET_NAME = 'Log';
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

// Lets you open the /exec URL directly in a browser to confirm it's live.
function doGet() {
  return jsonResponse({ status: 'ok', message: 'ICT Support Desk backend is running.' });
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
