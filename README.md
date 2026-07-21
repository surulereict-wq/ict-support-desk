# ICT Support Desk — Surulere Local Government

A self-contained mini site for the ICT Unit: five request forms, a live
ticket dashboard, and a Google Sheets backend. Everything below is
already built — this file is about getting it live at a real URL your
colleagues can open.

## What's in this folder

| File | Purpose |
|---|---|
| `index.html` | Home page, links to all five request forms and the dashboard |
| `computer-upgrade.html` | Computer Upgrade Session request form |
| `printer-ink.html` | Printer Ink Outage & Repairs request form |
| `software-upgrade.html` | Software Upgrade request form |
| `smartace.html` | SmartAce Registration & Complaint form |
| `document-archiving.html` | Document Archiving & Retrieval form |
| `dashboard.html` | Live ticket dashboard (internal use) |
| `styles.css` | Shared styling for every page |
| `script.js` | Submits requests from the five forms |
| `dashboard.js` | Reads and updates tickets on the dashboard |
| `backend/Code.gs` | Google Apps Script — the backend |
| `backend/README.md` | Step-by-step backend + dashboard setup |
| `ICT-Support-Desk-Process-Documentation.docx` | Official process write-up |

The site is **static** — plain HTML/CSS/JS, no build step, no framework.
That means hosting it is just "put these files somewhere," which is why
you have several easy options below.

## 1. Set up the backend first

Do this before hosting, so the forms work immediately once the site is
live. Follow `backend/README.md` end to end — it covers both the
request-logging backend and connecting the dashboard. Takes about
10 minutes total.

## 2. Choose where to host it

All three options are free and require no server maintenance.

### Option A — GitHub Pages (recommended if you're comfortable with Git)
1. Create a free GitHub account and a new repository (e.g. `ict-support-desk`).
2. Upload this whole folder's contents to the repository (drag-and-drop
   works on github.com — no command line needed).
3. Go to **Settings > Pages**, set source to the `main` branch, root folder.
4. GitHub gives you a URL like `https://yourname.github.io/ict-support-desk/`.
5. Share that URL, or point a custom domain at it later if the LG has one.

### Option B — Netlify Drop (fastest, zero account needed to try)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag this whole folder onto the page.
3. Netlify gives you a live URL immediately (e.g. `random-name.netlify.app`).
4. Create a free account afterward if you want to keep the site and get
   a more permanent URL.

### Option C — Surulere LG's own web server
If the LG already has a web server or cPanel-style hosting for its
website, this is likely the most appropriate long-term home:
1. Connect via FTP/SFTP or the hosting control panel's file manager.
2. Upload all files (keeping `backend/` as reference material — it
   doesn't need to be uploaded, since Google runs that part).
3. Point a subdomain at it, e.g. `support.surulerelg.gov.ng`.

## 3. After it's live

- Bookmark `dashboard.html` for ICT Unit staff; it's not linked
  publicly from anywhere except the site's own nav, but it also isn't
  password-protected beyond the dashboard key — don't share that URL
  outside the unit.
- Test each of the five forms once from the live URL to confirm
  submissions reach the Google Sheet.
- Anything needing to change later (new category, different SLA text,
  new turnaround time) is a plain HTML/CSS edit — no rebuild step.
