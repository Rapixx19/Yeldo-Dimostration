# Execution Plan

Operational layer on top of [BUILD_ORDER.md](BUILD_ORDER.md). This is what an autonomous agent (or a human in auto mode) follows end-to-end. BUILD_ORDER.md prescribes **what** to build per hour; this doc prescribes **how to ship it cleanly** — git hygiene, module boundaries, verification gates, stop conditions, and the definition of done.

> **Goal:** GitHub-inspector-ready repo, modular enough to extend (this is one of several apps we'll build on this base), production-deployed at the end.

---

## 0. Pre-flight (do once, before Phase 1)

These steps are not in BUILD_ORDER.md. Do them first.

### 0.1 Git init + first commit
```bash
git init -b main
git add .gitignore *.md backend/README.md frontend/README.md docs/ mockups/
git commit -m "chore: import planning specs, mockups, and brand docs"
```

### 0.2 Repo hygiene files
Create at root (do not exist yet):
- `LICENSE` — MIT (single-author portfolio project)
- `.editorconfig` — 2-space indent, LF, UTF-8, final newline
- `.nvmrc` — `20` (matches backend Node 20 target)
- `.github/workflows/ci.yml` — typecheck + build for both `frontend/` and `backend/` on push/PR
- `.github/PULL_REQUEST_TEMPLATE.md` — short template referencing the spec file changed
- Root `package.json` (workspace-style scripts only — no deps): `dev`, `build`, `typecheck`, `lint` that fan out to both packages

Commit: `chore: add repo hygiene (license, editorconfig, ci, workspace scripts)`

### 0.3 GitHub remote
Create remote repo `yeldo-deal-tracker` (public), `git remote add origin …`, `git push -u origin main`.

If running in auto mode without GitHub credentials: **stop here and ask**. Do not invent remote URLs.

### 0.4 Branch strategy
- `main` is always green (CI passing, deployable).
- One branch per phase: `phase-1-foundation`, `phase-2-backend`, …
- Within a branch, one commit per spec file (matches BUILD_ORDER.md convention `feat(spec-XX): …`).
- Merge to main via PR when the phase's verification gate passes. Squash-merge is fine if commit history within a phase has noise; otherwise preserve it — phase commits read like a tutorial, which is inspector-friendly.

---

## 1. Module contracts

Anchor for "we are going to build other shit on this." These are the boundaries that must not leak.

```
backend/
  src/
    domains/
      auth/         # JWT, bcrypt, demo-login — no knowledge of deals or investments
      deals/        # Deal listing/detail — depends on prisma only
      investments/  # Investment + portfolio — depends on deals via FK only
      ml/           # sentiment.ts, forecast.ts — pure functions, no I/O
    lib/            # prisma client, zod helpers, error middleware
    server.ts       # composition root
  prisma/

frontend/
  src/
    features/
      auth/         # login, signup, demo button, auth context
      deals/        # discover page, deal detail, filter UI
      portfolio/    # KPI cards, donut, distributions table
      ml/           # SentimentWidget, ForecastChart, info modals
    lib/            # axios client, formatters, hooks
    routes/         # React Router composition
    styles/         # brand tokens (tailwind config + globals.css)
```

**Contract rules** (enforce by code review on each PR):
1. **No cross-feature imports.** `features/portfolio` may not import from `features/deals/*`. If they need to share, the shared piece moves to `lib/` or a `shared/` subfolder.
2. **`ml/` is pure.** No network, no DB, no React state — just functions on data. Backend `ml/` and frontend `ml/` are independent.
3. **Types flow one way.** Backend exports a generated type file (`backend/src/types/api.ts` — optional v2); frontend never imports from backend source. For v1, the frontend redeclares its own DTOs.
4. **Brand tokens live once** — `frontend/src/styles/tokens.css` (or tailwind config). No hardcoded hex outside that file.

Future apps reuse: `backend/src/domains/auth`, `backend/src/lib`, `frontend/src/features/auth`, `frontend/src/styles`.

---

## 2. Verification gates

Auto mode **must not advance past a gate that fails.** If a gate fails, fix in place; if the fix isn't obvious, stop and ask.

| Gate | When | Command(s) | Pass condition |
|---|---|---|---|
| G1 — Scaffold | End of Hour 1 | `cd frontend && npm run dev` & `cd backend && npm run dev` | Both serve without errors |
| G2 — Schema | End of Hour 2 | `cd backend && npx prisma migrate dev && npx prisma studio` | Empty tables visible |
| G3 — Auth+Seed | End of Hour 3 | `curl -s -X POST localhost:PORT/api/auth/demo-login \| jq .token` | Returns JWT string |
| G4 — Deals API | End of Hour 4 | `curl -s localhost:PORT/api/deals \| jq 'length'` | Returns 10 |
| G5 — Investments API | End of Hour 5 | Authed POST creates row; GET portfolio returns 6 seeded investments | 201 + array length 6 |
| G6 — Auth UI | End of Hour 6 | Browser: click "Sign in as recruiter" → redirected to `/discover` | Visual pass |
| G7 — Discover | End of Hour 7 | Filter chips toggle, search filters cards, click → detail route | Visual pass |
| G8 — Deal detail | End of Hour 8 | Tabs switch, invest amount updates projection, submit creates investment | Visual + DB check |
| G9 — Portfolio | End of Hour 9 | KPIs computed from seed match expected (document expected values in seed) | Match |
| G10 — Forecast logic | End of Hour 10 | Unit test: `generateForecast()` returns 36 points per investment | Test green |
| G11 — Forecast chart | End of Hour 11 | Chart renders on portfolio page, hover tooltip shows data | Visual pass |
| G12 — Polish | End of Hour 12 | Side-by-side with mockups: dashboard + about pages match within tolerance | Visual pass |
| G13 — Backend deploy | End of Hour 13 | `curl <railway>/api/deals \| jq length` | Returns 10 |
| G14 — Frontend deploy | End of Hour 14 | Live URL: demo-login → discover → invest → portfolio works | Full flow pass |
| G15 — Recruiter walk | End of Hour 15 | Run the 8-step tour from RECRUITER_GUIDE.md against live URL | All 8 steps pass |

**Automation:** G1, G2, G3, G4, G5, G10 are scriptable (`scripts/verify-phase-N.sh`). The visual gates (G6–G9, G11, G12) require either a browser screenshot via the `browse` skill or human eyeball. In auto mode, capture a screenshot and compare against the corresponding file in `mockups/`; if the diff is large, flag and ask.

---

## 3. Commit cadence

- **One commit per spec** completed (matches BUILD_ORDER.md). Format: `feat(spec-XX): short description`.
- **Test/fix commits** in between are fine. Format: `fix(spec-XX): …` or `test(spec-XX): …`.
- **No "WIP" commits on main.** WIP allowed on phase branches.
- **No squashing away the spec-XX commits when merging phase → main** — they're the inspector's tour.
- Conventional commits throughout (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`).

---

## 4. Stop conditions for auto mode

Pause and ask the user when any of these hit:

1. **Missing credential.** No `DATABASE_URL`, `JWT_SECRET`, Railway/Vercel/Supabase login → ask once, then halt that phase.
2. **Verification gate fails twice in a row** after attempted fix.
3. **Spec ambiguity that changes UX.** Don't invent product decisions — ask.
4. **Mockup mismatch >20%** at a visual gate (rough call — when in doubt, screenshot and ask).
5. **Adding a dependency not listed in any spec doc.** Justify it in the PR description and ask if it stays.
6. **Deploy environment changes** (region, plan tier, custom domain) — always ask before changing.

Continue without asking when:

- A spec under-specifies an implementation detail that doesn't change the UI/API (file structure within a domain, naming of internal helpers, etc.).
- Recoverable errors with documented fixes (see BUILD_ORDER.md "Failure recovery" table).
- Lint/format fixups.

---

## 5. Definition of Done

The build is shippable when **all** of these are true:

- [ ] All 15 verification gates passed.
- [ ] `main` branch is green in CI.
- [ ] Live URLs in README (Vercel frontend, Railway backend health check).
- [ ] Demo credentials work end-to-end on live URL.
- [ ] RECRUITER_GUIDE.md's 8 deep-dive file links all resolve to real code with the called-out content.
- [ ] Screenshots in `/screenshots` (new folder) for: discover, deal-detail, deal-detail (with FinBERT modal), portfolio (with TFT chart), dashboard. Linked from README.
- [ ] All root `.md` docs are accurate (no stale "TODO" or placeholder URLs).
- [ ] `npm run typecheck` clean on both packages.
- [ ] `npm run build` produces a working production bundle on both packages.
- [ ] No secrets in git history (`git log -p | grep -iE 'secret|password|token|key='` returns only literal placeholders/env-var names).
- [ ] LICENSE present.
- [ ] Tagged release `v1.0.0` on the merge commit.

---

## 6. Extension hooks (for "other shit" later)

When this base gets reused for the next app:

- **New domain (backend):** add `src/domains/<name>/{routes,service,types}.ts` and mount in `server.ts`. Auth middleware is reusable as-is.
- **New feature (frontend):** add `src/features/<name>/` with same layout. Wire route in `src/routes/`. Reuse `lib/axios.ts` and auth context.
- **New ML widget:** drop a pure function in `ml/`, a presentational component beside it, info modal with arXiv link. Same pattern as FinBERT/TFT.
- **Theming:** swap brand tokens file. Tailwind config picks up automatically.
- **Multi-tenant / second product:** lift `auth/`, `lib/`, `styles/` into a separate `packages/core` (move to pnpm workspaces). Don't do this until you have the second product — premature monorepo is a tax.

---

## 7. Auto-mode runbook (short)

When the user says "ship it" or equivalent and auto mode is active:

```
1. Verify pre-flight (0.1–0.4). If git remote missing, ask once.
2. For each phase in BUILD_ORDER.md:
     a. Branch: phase-N-<slug>
     b. For each spec in the phase:
          - Implement per the spec
          - Commit: feat(spec-XX): …
          - Run that hour's verification gate
          - If gate fails: fix once; if still failing, fall to Stop Conditions
     c. Open PR to main; merge when CI green.
3. After Phase 5: deploy, verify G13/G14.
4. After Phase 6: run recruiter tour (G15). Tag v1.0.0.
5. Update README with live URLs and screenshots.
```

End of plan.
