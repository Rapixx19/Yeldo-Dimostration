# Backend — Yeldo deal tracker

Node 20 + Express + TypeScript + Prisma + Postgres (Supabase).

## Setup

```bash
cp .env.example .env
# Fill in DATABASE_URL, DIRECT_URL, JWT_SECRET
npm install
npm run prisma:generate
npm run prisma:migrate   # first run: prisma migrate dev --name init
npm run seed             # populate demo user + 10 deals + 6 investments
npm run dev              # http://localhost:4000
```

## Scripts

| Script | What |
|---|---|
| `npm run dev` | tsx watch on `src/index.ts` (port 4000) |
| `npm run build` | tsc → `dist/` |
| `npm run start` | run compiled `dist/index.js` |
| `npm run typecheck` | tsc --noEmit |
| `npm run lint` | eslint |
| `npm run prisma:generate` | regen client |
| `npm run prisma:migrate` | dev migration |
| `npm run prisma:deploy` | apply migrations to a remote DB |
| `npm run prisma:studio` | open Prisma Studio GUI |
| `npm run seed` | run seed script |

## Health check

```
GET /health → { ok: true, service: "yeldo-backend", ts: "..." }
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | Supabase pooled connection (Transaction pooler, port 6543) |
| `DIRECT_URL` | yes | Supabase direct connection (port 5432, for migrations) |
| `JWT_SECRET` | yes | 32+ random chars |
| `JWT_EXPIRES_IN` | optional | Defaults to `7d` |
| `BCRYPT_ROUNDS` | optional | Defaults to `10` |
| `PORT` | optional | Defaults to `4000` |
| `CORS_ORIGIN` | yes in prod | Comma-separated allowed origins |
| `SEED_DEMO_PASSWORD` | optional | Defaults to `demo123` (seed-only) |

## Structure (target — populated through spec-02..04)

```
src/
  domains/
    auth/         # JWT, bcrypt, demo-login
    deals/        # Deal listing/detail
    investments/  # Investment + portfolio aggregates
    ml/           # sentiment.ts (pure)
  lib/            # prisma client, zod helpers, error middleware
  index.ts        # composition root
prisma/
  schema.prisma
  seed.ts
```

**Module rule:** domains may not import from each other. Shared utilities live in `lib/`.

## Two files worth reviewing first

1. `src/domains/ml/sentiment.ts` — FinBERT-inspired deterministic scoring (heavily commented)
2. `src/lib/auth-middleware.ts` — JWT verification single source of truth
