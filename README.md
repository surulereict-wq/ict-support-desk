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
5. Connect the ICT Staff Portal
The ICT Staff Portal (`ict-staff-3841.html`) reads tickets and staff
records from the same backend, protected by a shared key so this data
isn't public. It's a single page — the "Tickets" and "Staff Directory"
tabs share one key entry rather than asking twice.
In `Code.gs`, find:
```js
   const DASHBOARD_KEY = 'change-this-key';
   ```
Change it to any password-like string of your choosing, save, and
redeploy (Deploy > Manage deployments > pencil icon > New version
> Deploy — editing the code alone doesn't update a live deployment).
Open `ict-portal.js` and set:
```js
   const ENDPOINT_URL = 'https://script.google.com/macros/s/XXXXXXXX/exec';
   ```
Save and re-upload `ict-portal.js`. Open `ict-staff-3841.html` — it
will prompt for the key once (kept only in that browser tab's memory,
never stored in the file), then populate both tabs: tickets with
inline status updates, and the staff directory once you've added
staff records.
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
8. Set up the weekly summary email
In `Code.gs`, find `const SUMMARY_RECIPIENT = 'ict@surulerelg.gov.ng';` near the top and change the email address to whoever should receive it (yourself, your supervisor, or both — for multiple recipients, separate with a comma inside the same quotes, e.g. `'you@x.com,boss@x.com'`)
Save
In the left sidebar of the Apps Script editor, click the clock icon ("Triggers")
Click + Add Trigger (bottom right)
Set it up as:
Choose which function to run: sendWeeklySummary
Choose which deployment should run: Head
Select event source: Time-driven
Select type of time based trigger: Week timer
Select day of week: whichever day you want the report (e.g. Monday)
Select time of day: e.g. 8am–9am
Click Save — you may be asked to authorize again, same as before
To send yourself a test email right now instead of waiting for the trigger: in the Apps Script toolbar, use the function dropdown (next to Debug) to select `sendWeeklySummary`, then click Run. Check your inbox.
9. Dashboard: Export CSV and Overdue flag (automatic — nothing to set up)
The dashboard now has an Export CSV button next to Refresh — it downloads whatever's currently shown (respecting your category/status/search filters) as a spreadsheet file, useful for reporting upward.
Tickets still Open or In Progress past their category's stated turnaround are automatically flagged Overdue in the table and counted in the overview stats. The thresholds live in `ict-portal.js` as `SLA_DAYS` if you ever want to adjust them.
10. Staff Directory for SmartAce support (automatic — nothing to set up)
`staff-registration.html` lets newly recruited senior and junior staff
register their details once — full name, Staff ID, cadre, department,
phone, email, employment date, and their SmartAce password. SmartAce is
used only for monthly payslip printing and locks after 4 failed logins,
so ICT keeps the password on file to get staff back in quickly rather
than running a full reset process every time.
Records are split into two sheet tabs — "Staff Directory - Senior"
and "Staff Directory - Junior" — chosen automatically based on the
Cadre selected at registration. Both are created automatically the
first time someone in that cadre registers.
Important: these tabs must live inside the exact same Google Sheet
as your `Log` and `Status` tabs — the same file you opened
`Extensions > Apps Script` from. A separate, standalone Google Sheet
titled "Staff Directory" will not work, even with correctly named
tabs — the script can only see the one spreadsheet it's bound to.
The "Staff Directory" tab in the ICT Staff Portal (`ict-staff-3841.html`)
is the search view — same `DASHBOARD_KEY` protection as the Tickets
tab (one key unlocks both), and it searches both sheets at once. Use
it to confirm someone's identity (name, Staff ID, department match)
and hand them their password directly.
This sheet holds personal contact details and login passwords.
Keep the `DASHBOARD_KEY` limited to the ICT staff who actually need
it — a small, known list, not shared broadly. If anyone outside that
list ever sees the key, treat every password in the sheet as
compromised and have those staff change them.
11. Test it
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
