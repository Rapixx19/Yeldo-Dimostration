# Frontend — Yeldo Deal Tracker

React 18 + TypeScript + Vite + Tailwind CSS + Recharts.

## Quick start

```bash
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:4000

npm install
npm run dev      # → http://localhost:5173
```

## Folder structure

```
src/
├── App.tsx                    # Top-level routing
├── main.tsx                   # Entry point + auth provider
├── api/
│   ├── client.ts              # Axios instance with JWT interceptor
│   ├── auth.ts                # Login, signup, demo-login
│   ├── deals.ts               # Deal fetching
│   └── investments.ts         # Portfolio fetching, create investment
├── components/
│   ├── ui/                    # Reusable atoms (Button, Card, Pill, etc.)
│   ├── DealCard.tsx
│   ├── ForecastChart.tsx      # TFT-inspired Recharts stacked area
│   ├── SentimentWidget.tsx    # FinBERT chip + expanded widget
│   ├── MLInfoModal.tsx        # Educational tooltips for ML features
│   ├── FilterBar.tsx
│   ├── InvestForm.tsx
│   ├── KPICard.tsx
│   └── Nav.tsx
├── contexts/AuthContext.tsx   # Auth state + token management
├── hooks/                     # useAuth, useDeals, useInvestments
├── lib/
│   ├── forecast.ts            # TFT-inspired forecast (heavily commented)
│   ├── format.ts              # Currency, date, percentage formatters
│   └── api.ts
├── pages/
│   ├── Landing.tsx            # /
│   ├── Login.tsx              # /auth/login
│   ├── Signup.tsx             # /auth/signup
│   ├── Discover.tsx           # /discover
│   ├── DealDetailPage.tsx     # /deals/:slug
│   ├── Portfolio.tsx          # /portfolio
│   ├── Dashboard.tsx          # /dashboard
│   └── About.tsx              # /about (ML deep-dive)
├── styles/brand.css           # Editorial Forest + Brass tokens
└── types/api.ts               # Shared types
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend URL |

## Notes for recruiters

Two most interesting files:
1. **`src/lib/forecast.ts`** — TFT-inspired logic with full docblock
2. **`src/components/MLInfoModal.tsx`** — ML educational modals
