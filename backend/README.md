# Backend — Yeldo Deal Tracker

Node.js 20 + Express + TypeScript + Prisma + PostgreSQL + JWT.

## Quick start

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run seed
npm run dev               # → http://localhost:4000
```

## Folder structure

```
src/
├── index.ts                   # Express app entry
├── routes/
│   ├── auth.ts                # POST /api/auth/{signup,login,demo-login}
│   ├── deals.ts               # GET /api/deals, /api/deals/:slug
│   └── investments.ts         # GET/POST /api/investments
├── middleware/
│   ├── auth.ts                # JWT verification (single point of auth)
│   └── error.ts               # Centralized error handler
├── services/
│   ├── sentiment.ts           # FinBERT-style scoring (heavily commented)
│   └── portfolio.ts           # IRR + KPI aggregation
├── schemas/                   # Zod validation schemas
└── lib/prisma.ts              # Prisma client singleton

prisma/
├── schema.prisma              # User, Deal, Investment, Distribution
├── seed.ts                    # 10 deals + demo user + 6 investments
└── migrations/
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | 32+ random chars |
| `PORT` | ⚠️ | Defaults to 4000 |
| `CORS_ORIGIN` | ✅ in prod | Frontend URL |
| `SEED_DEMO_PASSWORD` | ⚠️ | Defaults to `demo123` |

## API endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | ❌ | Create account |
| POST | `/api/auth/login` | ❌ | Login → JWT |
| POST | `/api/auth/demo-login` | ❌ | One-click demo login |
| GET | `/api/deals` | ❌ | List deals (filters) |
| GET | `/api/deals/:slug` | ❌ | Single deal detail |
| POST | `/api/investments` | ✅ | Virtual invest |
| GET | `/api/investments` | ✅ | User's investments |
| GET | `/api/portfolio` | ✅ | Aggregated KPIs |

## Notes for recruiters

Two most interesting files:
1. **`src/services/sentiment.ts`** — FinBERT-inspired scoring with docblock
2. **`src/middleware/auth.ts`** — JWT verification single source of truth
