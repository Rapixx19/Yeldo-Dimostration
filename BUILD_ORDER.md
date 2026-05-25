# Build order

Recommended sequence for implementing this with Cursor. Each spec file in `/docs` is self-contained, but they build on each other in dependency order.

Total estimated time for a Cursor-assisted developer: **12-15 hours** for v1 + ML features.

---

## Phase 1 — Foundation (2 hours)

### Hour 1 — Project setup
- Drop `docs/00-project-setup.md` into Cursor
- Cursor scaffolds both `frontend/` and `backend/` with package.json, tsconfig, etc.
- Verify: `npm run dev` works in both folders, even if pages are blank

### Hour 2 — Database + brand tokens
- Drop `docs/01-database-schema.md` into Cursor (in `backend/` folder)
- Cursor creates Prisma schema, runs first migration
- Drop `docs/05-frontend-setup-with-tokens.md` into Cursor (in `frontend/` folder)
- Cursor installs Tailwind, applies the Editorial Forest + Brass tokens, sets up routing
- Verify: visit `localhost:5173`, see brand-tokenized blank page; `npx prisma studio` shows empty tables

---

## Phase 2 — Backend (3 hours)

### Hour 3 — Auth + seed
- Drop `docs/02-backend-auth.md` into Cursor → JWT + bcrypt + login/signup/demo-login endpoints
- Drop `docs/11-seed-data.md` into Cursor → 10 realistic deals + 1 demo user with 6 pre-populated investments
- Run `npm run seed` → verify Prisma Studio shows the data
- Verify: `curl POST /api/auth/login` with demo credentials returns a JWT

### Hour 4 — Deals API
- Drop `docs/03-backend-deals-api.md` into Cursor → REST endpoints with Zod validation
- Endpoints: `GET /api/deals`, `GET /api/deals/:slug`, `GET /api/deals?country=...&instrument=...`
- Verify: `curl GET /api/deals` returns array of 10 deals as JSON

### Hour 5 — Investments API + Sentiment scoring
- Drop `docs/04-backend-investments-api.md` into Cursor → investments + portfolio endpoints
- Drop `docs/12-finbert-sentiment.md` into Cursor → `services/sentiment.ts` with the deterministic scoring logic
- The sentiment scores get baked into the seed data at this point
- Verify: `curl POST /api/investments` with JWT creates an investment; deals API now returns sentiment fields

---

## Phase 3 — Frontend (4 hours)

### Hour 6 — Auth UI
- Drop `docs/06-frontend-auth.md` into Cursor → login/signup pages + auth context + protected routes
- The *"Sign in as recruiter"* one-click button is here
- Verify: log in as demo, see redirect to `/discover`

### Hour 7 — Discover page
- Drop `docs/07-frontend-deals-list.md` into Cursor → deals list with filter chips, search, card grid
- Sentiment chip on each deal card
- Verify: filters work, search works, cards link to detail pages

### Hour 8 — Deal detail page
- Drop `docs/08-frontend-deal-detail.md` into Cursor → hero, tabs, key terms grid, sticky invest sidebar
- FinBERT widget integrated (use the existing mockup as visual reference)
- ML info modal that opens when hovering the FinBERT badge
- Verify: tabs switch, invest amount input updates projections live, "Invest now" creates an investment

### Hour 9 — Portfolio page (without TFT chart yet)
- Drop `docs/09-frontend-portfolio.md` into Cursor → KPI cards, allocation donut, upcoming distributions, active investments table
- Verify: page renders with mock user's 6 investments, KPIs computed correctly

---

## Phase 4 — ML features visualization (3 hours)

### Hour 10 — TFT forecast logic
- Drop `docs/13-tft-forecast.md` into Cursor → `lib/forecast.ts` with heavy comments
- Cursor implements `generateForecast()` function
- Verify: function returns a 36-month series for each investment

### Hour 11 — TFT chart component
- Drop the chart spec (still in `docs/13`) for the Recharts component
- Custom tooltip, dashed maturity markers, paper citation footer
- ML info modal that opens when hovering the TFT badge
- Verify: chart renders on portfolio page, hover shows tooltips

### Hour 12 — Dashboard page polish
- Drop `docs/10-frontend-dashboard.md` into Cursor → dashboard route (currently same as portfolio in v1)
- Add the `/about` page accessible from footer
- Final visual polish pass against the mockups

---

## Phase 5 — Deploy (2 hours)

### Hour 13 — Backend deploy
- Drop `docs/14-deployment.md` (backend section) into Cursor → Railway setup
- Add environment variables in Railway dashboard
- Push to `main`, Railway auto-deploys
- Run migrations: `railway run npx prisma migrate deploy`
- Run seed: `railway run npm run seed`

### Hour 14 — Frontend deploy
- Drop `docs/14-deployment.md` (frontend section) into Cursor → Vercel setup
- Add environment variable: `VITE_API_URL=<railway-url>`
- Push to `main`, Vercel auto-deploys
- Test live demo URL end-to-end

---

## Phase 6 — Polish & screenshots (1 hour)

- Take screenshots of every major page for the README
- Update README with live demo URL
- Add architecture diagram screenshot to ARCHITECTURE.md
- Verify all internal markdown links work
- Final pass: log in as demo, walk through the 8-step recruiter tour, confirm every step works

---

## Failure recovery

If any step breaks:

| Symptom | Likely cause | Fix |
|---|---|---|
| Cursor can't find a file | Wrong folder context | `cd frontend` or `cd backend` first |
| Prisma migration fails | DATABASE_URL wrong | Check `.env`, verify Supabase project active |
| JWT auth fails | JWT_SECRET mismatch between dev/prod | Use same secret string everywhere |
| CORS error from frontend | Missing CORS_ORIGIN env var | Set on backend: `CORS_ORIGIN=https://...vercel.app` |
| Chart doesn't render | Recharts version mismatch | Lock to `recharts@^2.10.0` |
| Sentiment shows null | Seed wasn't re-run after schema change | `npm run prisma:reset && npm run seed` |

---

## Recommended Cursor workflow per spec file

For each `docs/XX-...md` file:
1. Open Cursor, make sure you're in the right folder (frontend or backend)
2. Open the spec file in Cursor
3. Copy the *Cursor prompt* section at the bottom of each spec
4. Paste into Cursor chat with `@docs/XX-...md` to reference the full spec
5. Review the generated code, accept changes
6. Run the verification command listed in the spec
7. Commit with the message format: `feat(spec-XX): [feature name]`

---

## Tips

- **Always run `npm run dev` in both frontend and backend** during work — see live changes
- **Use Prisma Studio** (`npx prisma studio`) to inspect data during backend work
- **Use React DevTools** to debug component state during frontend work
- **Commit after each spec**, not after each feature — easier to revert
