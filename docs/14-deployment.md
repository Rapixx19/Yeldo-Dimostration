# Spec 14 — Deployment

**Goal:** Deploy backend to Railway and frontend to Vercel with proper environment configuration.

**Time:** 60 minutes
**Depends on:** All previous specs (build must work locally first)
**Outputs:** Live URL on the internet

---

## Acceptance criteria

- [ ] Backend live at a Railway URL (e.g., `https://yeldo-tracker-api.up.railway.app`)
- [ ] Frontend live at a Vercel URL (e.g., `https://yeldo-tracker.vercel.app`)
- [ ] Production database has the seed data (run migrations + seed remotely)
- [ ] Frontend can authenticate against production backend
- [ ] CORS configured to allow frontend → backend
- [ ] Demo login works end-to-end on live URLs
- [ ] All ML features visible and working on live demo

## Pre-deployment checklist

- [ ] `frontend/.env.example` includes `VITE_API_URL`
- [ ] `backend/.env.example` includes all required vars
- [ ] Both repos have working `npm run build` scripts
- [ ] `backend/package.json` has `start` script: `node dist/index.js`
- [ ] `frontend/package.json` includes `vercel-build` (Vite's default `build` works)
- [ ] Database connection string is for a managed instance (Supabase)
- [ ] No secrets committed to git (verify `.env` is in `.gitignore`)

---

## Backend deployment (Railway)

### Step 1 — Set up Supabase PostgreSQL (5 min)
1. Go to [supabase.com](https://supabase.com), create new project (Europe-Frankfurt region)
2. Settings → Database → copy the connection string (use the "Session" pooler one for production)
3. Save this as `DATABASE_URL`

### Step 2 — Create Railway project (5 min)
1. Go to [railway.app](https://railway.app), sign in with GitHub
2. New Project → Deploy from GitHub repo → select your backend repo
3. Settings → Root Directory → `/backend` (if in monorepo) or leave empty (if separate repo)

### Step 3 — Configure environment (5 min)
In Railway Variables tab, add:
```
DATABASE_URL=<supabase connection string>
JWT_SECRET=<generate with: openssl rand -hex 32>
CORS_ORIGIN=<your-vercel-url.vercel.app>   # add after frontend deploy
SEED_DEMO_PASSWORD=demo123
PORT=4000
NODE_ENV=production
```

### Step 4 — Configure build & start (5 min)
In Railway Settings → Build:
- Build command: `npm run build && npx prisma generate`
- Start command: `npm start`

In Settings → Networking: Generate domain

### Step 5 — Run migrations + seed (5 min)
```bash
# Locally with production DATABASE_URL temporarily in .env
npx prisma migrate deploy
npm run seed
```

Or via Railway CLI:
```bash
railway login
railway link
railway run npx prisma migrate deploy
railway run npm run seed
```

### Step 6 — Verify backend (5 min)
```bash
curl https://your-app.up.railway.app/health
# Should return: {"ok":true}

curl -X POST https://your-app.up.railway.app/api/auth/demo-login
# Should return: {user: {...}, token: "..."}
```

---

## Frontend deployment (Vercel)

### Step 1 — Connect repo to Vercel (3 min)
1. Go to [vercel.com](https://vercel.com), import the frontend repo
2. Framework preset: Vite
3. Root directory: `frontend` (if monorepo) or leave empty
4. Build command: `npm run build` (Vercel auto-detects)
5. Output directory: `dist`

### Step 2 — Configure environment (2 min)
In Vercel Project Settings → Environment Variables:
```
VITE_API_URL=https://your-app.up.railway.app
```

### Step 3 — Deploy
Click Deploy. Vercel will:
- Run `npm install`
- Run `npm run build`
- Deploy the `dist/` folder to a CDN
- Give you a URL like `https://yeldo-tracker.vercel.app`

### Step 4 — Update backend CORS (2 min)
Back in Railway Variables, update:
```
CORS_ORIGIN=https://yeldo-tracker.vercel.app
```

Restart the backend service for the change to take effect.

### Step 5 — Verify end-to-end (5 min)
1. Open the Vercel URL in a browser
2. Click "Sign in as recruiter"
3. Should redirect to `/discover` with deals visible
4. Click a deal, then click Invest now → should show toast and navigate to portfolio
5. Portfolio should show TFT forecast chart and KPI cards

---

## Backend `package.json` final scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "seed": "tsx prisma/seed.ts",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:reset": "prisma migrate reset --force && npm run seed",
    "postinstall": "prisma generate"
  }
}
```

---

## CORS configuration on backend

In `backend/src/index.ts`:
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
  credentials: true,
}));
```

This allows comma-separated origins, useful when you have both `*.vercel.app` and a custom domain.

---

## Custom domain (optional, +15 min)

If you want `yeldo-tracker.com` or similar:
1. Buy a domain (Namecheap, ~$10/yr)
2. In Vercel → Settings → Domains → Add domain, follow DNS instructions
3. Same on Railway for the API: `api.yeldo-tracker.com`
4. Update env vars accordingly

---

## Cursor prompt

```
Help me deploy the Yeldo Deal Tracker to Railway (backend) and Vercel (frontend).

Steps:
1. Ensure backend/package.json has proper build and start scripts (tsc + node dist/index.js)
2. Ensure backend has postinstall script: prisma generate
3. Configure CORS in backend/src/index.ts to read from process.env.CORS_ORIGIN
4. Walk me through Railway setup including env vars and prisma migrate deploy
5. Walk me through Vercel setup including VITE_API_URL env var
6. Verify end-to-end with curl commands
```

---

## Troubleshooting

| Issue | Likely cause | Fix |
|---|---|---|
| Railway build fails on `prisma generate` | Missing `postinstall` script | Add `"postinstall": "prisma generate"` to package.json |
| Frontend 401s on login | CORS misconfigured | Check `CORS_ORIGIN` in Railway includes the Vercel URL exactly |
| `Cannot find module '@prisma/client'` | Build didn't run prisma generate | Add to build command or postinstall |
| Demo login 404s | Seed didn't run on production DB | Run `railway run npm run seed` |
| Chart shows blank on production | Stale Recharts bundle | Hard refresh; verify build artifacts include recharts |
