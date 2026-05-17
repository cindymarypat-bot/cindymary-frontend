# Cindymary Couture — Frontend Deployment Guide
## GitHub → Vercel

---

## What's in this folder

```
cindymary-couture-frontend/
├── index.html          ← App entry point
├── vite.config.js      ← Vite build config
├── package.json        ← Dependencies
├── .gitignore          ← Excludes node_modules & .env
├── .env.example        ← Copy to .env.local for local dev
├── DEPLOY.md           ← This file
└── src/
    ├── main.jsx        ← React entry
    ├── App.jsx         ← All pages & components (1200+ lines)
    ├── App.css         ← Component styles
    ├── index.css       ← Global styles & design tokens
    └── api.js          ← Backend API client
```

---

## STEP 1 — Run locally (optional, to test first)

```bash
# 1. Install Node.js from https://nodejs.org (LTS version)

# 2. Open terminal in this folder
cd cindymary-couture-frontend

# 3. Install dependencies
npm install

# 4. Create your local environment file
cp .env.example .env.local
# Then open .env.local and paste your Railway backend URL:
# VITE_API_URL=https://your-app.railway.app

# 5. Start the dev server
npm run dev
# Open http://localhost:3000
```

> If VITE_API_URL is left blank, the app runs in Demo Mode
> with sample orders — great for testing without a backend.

---

## STEP 2 — Upload to GitHub

### Option A — GitHub Desktop (easiest, no command line)
1. Download GitHub Desktop: https://desktop.github.com
2. Sign in with your GitHub account (create one free at github.com)
3. Click **File → Add Local Repository**
4. Select this folder (`cindymary-couture-frontend`)
5. Click **"create a repository"** → name it `cindymary-frontend` → Create
6. Click **Publish Repository** (top right)
7. Uncheck "Keep this code private" if you want it public, then Publish
8. Your code is now at: `https://github.com/YOUR_USERNAME/cindymary-frontend`

### Option B — Command line
```bash
# In this folder:
git init
git add .
git commit -m "Initial Cindymary Couture frontend"

# Go to github.com → New Repository → name: cindymary-frontend → Create
# Then copy the two lines GitHub shows you, e.g.:
git remote add origin https://github.com/YOUR_USERNAME/cindymary-frontend.git
git push -u origin main
```

---

## STEP 3 — Deploy on Vercel

1. Go to **https://vercel.com** and sign up (free) — use "Continue with GitHub"
2. Click **"Add New… → Project"**
3. Find and click **Import** next to `cindymary-frontend`
4. Vercel detects Vite automatically — leave all settings as-is
5. Expand **"Environment Variables"** and add:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-railway-backend.railway.app`
   - *(Leave blank if you want demo mode for now)*
6. Click **Deploy**
7. Wait ~60 seconds — Vercel gives you a live URL like:
   `https://cindymary-frontend.vercel.app`

---

## STEP 4 — Connect your domain (optional)

1. Buy `cindymarycouture.com` at https://namecheap.com (~£12/yr)
2. In Vercel → your project → **Settings → Domains**
3. Click **Add Domain** → type `cindymarycouture.com`
4. Vercel shows you two DNS records (an A record and a CNAME)
5. Go to Namecheap → your domain → **Advanced DNS**
6. Add those two records exactly as Vercel shows
7. Wait 10–30 minutes → your site is live at your custom domain

---

## STEP 5 — Future updates

Every time you change the code:

**GitHub Desktop:** just click "Commit to main" → "Push origin"
**Command line:**
```bash
git add .
git commit -m "describe your change"
git push
```

Vercel automatically re-deploys within 30 seconds of every push. No extra steps.

---

## Environment Variables Reference

| Variable       | Description                        | Example                                  |
|----------------|------------------------------------|------------------------------------------|
| `VITE_API_URL` | Your Railway backend URL           | `https://cindymary-api.railway.app`      |

Set this in:
- **Local dev:** `.env.local` (copy from `.env.example`)
- **Vercel:** Project → Settings → Environment Variables

---

## Demo Mode

If `VITE_API_URL` is not set, the app runs entirely with sample data.
No backend needed. Great for:
- Showing clients what the portal looks like
- Testing new features before connecting the database

Demo login credentials:
| Role   | Email                     | Password  |
|--------|---------------------------|-----------|
| Admin  | admin@cindymary.com       | admin123  |
| Client | adaeze@example.com        | client123 |
| Client | sophia@example.com        | client123 |
| Client | funke@example.com         | client123 |

---

## Troubleshooting

**"Module not found" error on deploy**
→ Run `npm install` locally first, then push again.

**Backend API calls failing**
→ Make sure `VITE_API_URL` has no trailing slash.
→ Make sure your Railway backend has CORS set to allow your Vercel domain.

**Blank page after deploy**
→ Check Vercel build logs (Project → Deployments → click the deployment → View logs).

**Fonts not loading**
→ Check internet connection — fonts load from Google Fonts.

---

*Built for Cindymary Couture · cindymarycouture.com*
