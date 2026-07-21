ICT Support Desk — Backend Setup
This connects the website's forms to a Google Sheet, so every request
submitted on any of the five pages gets logged automatically with a
timestamp and reference number. No server to buy, host, or maintain —
Google runs it.
1. Create the log sheet
Go to sheets.google.com and create a new,
blank spreadsheet. Name it something like "ICT Support Desk — Log".
Rename the first tab (bottom-left) to Log.
2. Add the backend script
In the sheet, go to Extensions > Apps Script.
Delete the placeholder `function myFunction() {}` code.
Open `Code.gs` from this folder, copy everything, and paste it in.
Click the save icon (or Ctrl/Cmd+S).
3. Deploy it as a web app
Click Deploy > New deployment.
Click the gear icon next to "Select type" and choose Web app.
Set:
Execute as: Me
Who has access: Anyone
Click Deploy. The first time, Google will ask you to authorize
the script — click through the "unverified app" warning (it's your
own script, this is expected for personal Apps Script projects).
Copy the Web app URL. It ends in `/exec`.
4. Connect the website
Open `script.js` (in the main site folder, not this one).
Near the top, find:
```js
   const ENDPOINT_URL = '';
   ```
Paste your URL between the quotes:
```js
   const ENDPOINT_URL = 'https://script.google.com/macros/s/XXXXXXXX/exec';
   ```
Save, and re-upload `script.js` to wherever the site is hosted.
5. Connect the dashboard
The dashboard (`dashboard.html`) reads tickets from the same backend,
protected by a simple shared key so the ticket list isn't public.
In `Code.gs`, find:
```js
   const DASHBOARD_KEY = 'change-this-key';
   ```
Change it to any password-like string of your choosing, save, and
redeploy (Deploy > Manage deployments > pencil icon > New version
> Deploy — editing the code alone doesn't update a live deployment).
Open `dashboard.js` and set both:
```js
   const ENDPOINT_URL = 'https://script.google.com/macros/s/XXXXXXXX/exec';
   const DASHBOARD_KEY = 'the-same-string-you-set-above';
   ```
Save and re-upload `dashboard.js`. Open `dashboard.html` — it should
populate with tickets and let you update status inline (Open / In
Progress / Resolved), which writes straight back to the sheet.
6. Post a service status update (internet/ISP downtime, etc.)
Redeploy after adding this feature (Deploy > Manage deployments > pencil
icon > New version > Deploy) so the site picks up the new `status`
endpoint — otherwise skip straight to using it if you're setting this up
fresh.
The first time anyone loads the site after this is deployed, a second
tab called "Status" is created automatically in your Google Sheet,
with one row already filled in: `Operational | All services running normally. | [timestamp]`.
To post an update, just edit that row directly — no code, no redeploy:
Open the Google Sheet, click the Status tab
Column A (State) — type one of: `Operational`, `Degraded`, or `Down`
Column B (Message) — a short note, e.g. `Internet down since 9:40am — ISP notified, restoration expected by 2pm.`
Column C (Updated) — optional, mostly for your own reference
A banner appears automatically across the entire site within about a
minute of your change:
`Operational` → no banner shown at all
`Degraded` → amber banner
`Down` → red banner
When the issue is resolved, change State back to `Operational` and the
banner disappears site-wide immediately.
7. Feedback / satisfaction (automatic — nothing to set up)
Once a ticket is marked Resolved on the dashboard, the requester can
go to `check-status.html`, enter their reference number, and leave a
Satisfied / Not satisfied rating with an optional comment. It's
recorded in two new columns on the same row in the Log tab —
Satisfaction and Feedback.
If your Sheet already existed before this feature, those two columns
are added automatically the next time anyone submits a request or opens
the dashboard — no manual editing needed.
The dashboard now also shows a Feedback column per ticket and a
Satisfied count in the overview stats.
8. Test it
Open any request page (e.g. `printer-ink.html`), fill in the form, and
submit. Within a few seconds a new row should appear in the Log tab
of your sheet, and the on-screen confirmation stub will still show the
reference number as before.
Notes
If `ENDPOINT_URL` is left blank, the site still works exactly as
before — it just shows the confirmation on-screen without logging
anywhere. This means the site never breaks even if the backend isn't
set up yet.
If a submission fails to reach the sheet (e.g. no internet), the site
still shows the reference number to the requester, with a small note
that it couldn't confirm the connection — nothing is silently lost
from the requester's point of view, but you should ask them to also
report it directly if that keeps happening.
To change who can see the sheet, use the normal Google Sheets
Share button — this does not affect the web app's ability to
write to it.
You can later add columns (e.g. "Assigned to", "Resolved date") to
the sheet directly; the script only appends to existing columns and
won't be affected by extra ones you add manually.
