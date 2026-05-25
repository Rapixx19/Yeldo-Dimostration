# Deploy guide

Phase 5 of [`EXECUTION_PLAN.md`](./EXECUTION_PLAN.md). Two hosting targets: Railway (backend) and Vercel (frontend). Supabase already hosts the DB.

---

## 1. Supabase (already done)

- Project ref: `dkkctpumtyxjfubkgkla`, EU region
- Schema applied via Supabase MCP `apply_migration` (commit `185e9c3`, file `backend/prisma/migrations/20260525200615_init/migration.sql`)
- Seed run locally against the live DB (10 deals, demo user, 6 investments)
- **RLS** intentionally **off** — Browser → Express → Postgres flow, no anon-key exposure. See ARCHITECTURE.md decision log.

Connection strings (Settings → Database):
- **DIRECT** (port 5432): used for migrations + low-volume reads
- **POOLED / TRANSACTION** (port 6543, `?pgbouncer=true&connection_limit=1`): recommended for Express runtime in production

---

## 2. Backend → Railway

### Project setup
1. **railway.app** → New Project → Deploy from GitHub repo → `Rapixx19/Yeldo-Dimostration`
2. After import: **Settings → Root Directory** → set to `backend`
3. **Settings → Build** → leave Nixpacks default. It will:
   - run `npm install` (which triggers `postinstall: prisma generate`)
   - run `npm run build` (which also runs `prisma generate && tsc`)
   - run `npm start` (which runs `node dist/index.js`)

### Environment variables (Settings → Variables)
| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | Supabase **pooled** URL (port 6543, with `?pgbouncer=true&connection_limit=1`) | URL-encode special chars in password (`!` → `%21`) |
| `DIRECT_URL` | Supabase **direct** URL (port 5432) | Same password, URL-encoded |
| `JWT_SECRET` | 32+ random chars | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `7d` | optional |
| `BCRYPT_ROUNDS` | `10` | optional |
| `PORT` | (let Railway set it) | Railway injects $PORT; our Express reads `process.env.PORT` |
| `CORS_ORIGIN` | the Vercel URL once it exists | comma-separated allowed origins |
| `SEED_DEMO_PASSWORD` | `demo123` | optional, seed-time only |

### One-time migration baseline
The schema was applied via Supabase MCP before Prisma migrations were a thing in this project. Prisma's `_prisma_migrations` tracking table doesn't know about it yet. **Before the first deploy is useful**, baseline it:

Either via Railway shell:
```
railway run npm run prisma:baseline
```
or one-off from your laptop with the prod DATABASE_URL exported:
```
DATABASE_URL="<prod pooled url>" DIRECT_URL="<prod direct url>" npm run prisma:baseline
```

After that, future migrations work normally via `npm run prisma:deploy`.

### Verify (G13)
```
curl https://<your-app>.up.railway.app/health
# → {"ok":true,"service":"yeldo-backend","ts":"..."}

curl https://<your-app>.up.railway.app/api/deals | jq length
# → 10
```

---

## 3. Frontend → Vercel

### Project setup
1. **vercel.com/new** → Import Git Repository → `Rapixx19/Yeldo-Dimostration`
2. **Root Directory** → set to `frontend` (critical — without this Vercel builds from repo root and fails)
3. Framework should auto-detect **Vite**
4. Build / Output settings: leave defaults (`npm run build` → `dist/`)

### Environment variables (Settings → Environment Variables)
| Variable | Value |
|---|---|
| `VITE_API_URL` | the Railway URL (e.g., `https://yeldo-tracker.up.railway.app`) |

### After both deploys exist
1. Update Railway `CORS_ORIGIN` to the Vercel URL — redeploy
2. Update README and ARCHITECTURE.md `Live demo` placeholders
3. Verify the recruiter tour end-to-end (G15)
4. Tag `v1.0.0`:
   ```
   git tag -a v1.0.0 -m "v1.0.0 — initial portfolio build live"
   git push origin v1.0.0
   ```
   Then on GitHub, create a Release from the tag pointing to this commit.

---

## Failure recovery

| Symptom | Likely cause | Fix |
|---|---|---|
| Railway build fails on `prisma generate` | Old @prisma/client cached | Settings → Redeploy with "Clear build cache" |
| 500 on `/api/deals` after deploy | DATABASE_URL wrong | Check pooled URL has `?pgbouncer=true&connection_limit=1` |
| CORS error in browser console | `CORS_ORIGIN` doesn't list Vercel URL | Add it, redeploy backend |
| Vercel build fails with "Cannot find module" | Root Directory not set to `frontend` | Settings → General → Root Directory → `frontend` |
| `prisma migrate deploy` fails "tables already exist" | DB not baselined | Run `npm run prisma:baseline` once |
| Frontend builds but routes 404 | SPA fallback missing | Vercel auto-handles for Vite; if not, add `vercel.json` with rewrite `/(.*)` → `/index.html` |
