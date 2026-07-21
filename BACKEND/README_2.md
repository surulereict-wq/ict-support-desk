# ICT Support Desk — Backend Setup

This connects the website's forms to a Google Sheet, so every request
submitted on any of the five pages gets logged automatically with a
timestamp and reference number. No server to buy, host, or maintain —
Google runs it.

## 1. Create the log sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new,
   blank spreadsheet. Name it something like **"ICT Support Desk — Log"**.
2. Rename the first tab (bottom-left) to **Log**.

## 2. Add the backend script

1. In the sheet, go to **Extensions > Apps Script**.
2. Delete the placeholder `function myFunction() {}` code.
3. Open `Code.gs` from this folder, copy everything, and paste it in.
4. Click the save icon (or Ctrl/Cmd+S).

## 3. Deploy it as a web app

1. Click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**. The first time, Google will ask you to authorize
   the script — click through the "unverified app" warning (it's your
   own script, this is expected for personal Apps Script projects).
5. Copy the **Web app URL**. It ends in `/exec`.

## 4. Connect the website

1. Open `script.js` (in the main site folder, not this one).
2. Near the top, find:
   ```js
   const ENDPOINT_URL = '';
   ```
3. Paste your URL between the quotes:
   ```js
   const ENDPOINT_URL = 'https://script.google.com/macros/s/XXXXXXXX/exec';
   ```
4. Save, and re-upload `script.js` to wherever the site is hosted.

## 5. Connect the dashboard

The dashboard (`dashboard.html`) reads tickets from the same backend,
protected by a simple shared key so the ticket list isn't public.

1. In `Code.gs`, find:
   ```js
   const DASHBOARD_KEY = 'change-this-key';
   ```
   Change it to any password-like string of your choosing, save, and
   **redeploy** (Deploy > Manage deployments > pencil icon > New version
   > Deploy — editing the code alone doesn't update a live deployment).
2. Open `dashboard.js` and set both:
   ```js
   const ENDPOINT_URL = 'https://script.google.com/macros/s/XXXXXXXX/exec';
   const DASHBOARD_KEY = 'the-same-string-you-set-above';
   ```
3. Save and re-upload `dashboard.js`. Open `dashboard.html` — it should
   populate with tickets and let you update status inline (Open / In
   Progress / Resolved), which writes straight back to the sheet.

## 6. Test it

Open any request page (e.g. `printer-ink.html`), fill in the form, and
submit. Within a few seconds a new row should appear in the **Log** tab
of your sheet, and the on-screen confirmation stub will still show the
reference number as before.

## Notes

- If `ENDPOINT_URL` is left blank, the site still works exactly as
  before — it just shows the confirmation on-screen without logging
  anywhere. This means the site never breaks even if the backend isn't
  set up yet.
- If a submission fails to reach the sheet (e.g. no internet), the site
  still shows the reference number to the requester, with a small note
  that it couldn't confirm the connection — nothing is silently lost
  from the requester's point of view, but you should ask them to also
  report it directly if that keeps happening.
- To change who can see the sheet, use the normal Google Sheets
  **Share** button — this does not affect the web app's ability to
  write to it.
- You can later add columns (e.g. "Assigned to", "Resolved date") to
  the sheet directly; the script only appends to existing columns and
  won't be affected by extra ones you add manually.
