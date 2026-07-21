
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
