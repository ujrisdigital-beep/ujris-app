# UJRIS Deployment Guide — Hostinger Node.js
## app.ujris.co.uk

### What you have
- server.js        — Express server, proxies Anthropic API (keeps key server-side)
- src/App.jsx      — Full UJRIS v3 React application (1,688 lines)
- src/main.jsx     — React entry point
- index.html       — HTML shell
- vite.config.js   — Build config
- package.json     — Dependencies

---

### STEP 1 — Upload these files to Hostinger

Option A: File Manager (easiest, no terminal needed)
1. hPanel → Files → File Manager
2. Navigate to /home/u865921376/app.ujris.co.uk/
3. Upload ALL files in this folder maintaining folder structure:
   - server.js          → root
   - package.json       → root
   - vite.config.js     → root
   - index.html         → root
   - src/main.jsx       → src/
   - src/App.jsx        → src/
   - public/manifest.json → public/
   - public/.htaccess   → public/

Option B: FTP (FileZilla)
- FTP Host: ftp://app.ujris.co.uk
- Username: u865921376.app.ujris.co.uk
- Password: your Hostinger FTP password
- Upload to: /public_html/ or home directory

---

### STEP 2 — Set Node.js application in hPanel

hPanel → Websites → app.ujris.co.uk → Node.js → Create Application:
- Node.js version: 20.x
- Application mode: Production
- Application root: / (or the folder you uploaded to)
- Application startup file: server.js
- Click Create

---

### STEP 3 — Add environment variable (CRITICAL)

Still in Node.js section → Environment Variables → Add:
- Name:  ANTHROPIC_API_KEY
- Value: sk-ant-XXXXXXXXXXXXXXXX (your actual key)

Click Save. This keeps your key server-side — never in browser code.

---

### STEP 4 — Install dependencies and build

In hPanel → Node.js → your app → click "Run NPM command":
Run: npm install
Wait for completion.

Run: npm run build
This creates the /dist folder with the compiled React app.

---

### STEP 5 — Start the application

In hPanel → Node.js → your app → click "Start Application"
Status should show: Running

---

### STEP 6 — Test

Visit: https://app.ujris.co.uk
- Home page loads ✓
- Click "Start Your Assessment" ✓
- Complete step 1 (discrimination type) ✓
- Reach AI Assessment step → type something → AI responds ✓

Health check: https://app.ujris.co.uk/health
Should return: {"status":"ok","version":"3.0.0","service":"UJRIS"}

---

### Troubleshooting

App not starting:
- Check Node.js logs in hPanel → Node.js → Logs
- Confirm server.js is in the correct directory
- Confirm npm install completed without errors

AI not responding:
- Confirm ANTHROPIC_API_KEY environment variable is set
- Check key starts with sk-ant-
- Visit /health endpoint — if it works, server is running, issue is the key

Page not loading (shows Hostinger default):
- Check Application mode is Production
- Restart the app in hPanel → Node.js → Restart

---

### After deployment

1. Test all 10 modules work
2. Share URL with your first 5 beta users
3. Report back — we move to Stripe integration next
