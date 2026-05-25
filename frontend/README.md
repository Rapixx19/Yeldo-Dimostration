# Frontend — Yeldo deal tracker

React 18 + Vite + TypeScript + Tailwind CSS + Recharts.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev    # http://localhost:5173
```

## Scripts

| Script | What |
|---|---|
| `npm run dev` | Vite dev server (port 5173) |
| `npm run build` | typecheck + Vite production build → `dist/` |
| `npm run preview` | preview the built bundle |
| `npm run typecheck` | tsc --noEmit |
| `npm run lint` | eslint |

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | yes | Backend URL (e.g. `http://localhost:4000`) |

## Structure (target — populated through spec-05..10)

```
src/
  features/
    auth/         # login, signup, demo button, auth context
    deals/        # discover page, deal detail, filter UI
    portfolio/    # KPI cards, donut, distributions table
    ml/           # SentimentWidget, ForecastChart, info modals
  lib/            # axios client, formatters, hooks
  routes/        # React Router composition
  styles/        # brand tokens + globals
  App.tsx
  main.tsx
```

**Module rule:** features may not import from each other. Brand tokens live in `styles/brand.css` (consumed by `tailwind.config.ts`).

## Two files worth reviewing first

1. `src/features/ml/forecast.ts` — TFT-inspired logic with full docblock
2. `src/features/ml/InfoModal.tsx` — ML educational modals (arXiv-linked)
