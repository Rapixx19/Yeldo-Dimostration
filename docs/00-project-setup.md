# Spec 00 — Project setup

**Goal:** Scaffold both `frontend/` and `backend/` repos with TypeScript, dependencies, and dev tooling.

**Time:** 30 minutes
**Depends on:** Nothing
**Outputs:** Two runnable but empty apps

---

## Acceptance criteria

- [ ] `frontend/` has Vite + React + TypeScript scaffold, `npm run dev` opens blank page at `:5173`
- [ ] `backend/` has Express + TypeScript + Prisma scaffold, `npm run dev` runs on `:4000` returning `{ok:true}` at `/health`
- [ ] Both repos have `.gitignore`, `tsconfig.json`, `package.json` with scripts
- [ ] Both repos use TypeScript strict mode

## Files to create

### Frontend
```
frontend/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── index.html
├── .env.example
├── .gitignore
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   └── vite-env.d.ts
└── public/
    └── favicon.ico
```

### Backend
```
backend/
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── src/
│   ├── index.ts
│   └── lib/
│       └── prisma.ts
└── prisma/
    └── schema.prisma (empty for now)
```

## Implementation notes

**Frontend `package.json` dependencies:**
- `react@^18`, `react-dom@^18`, `react-router-dom@^6`
- `axios`, `react-hook-form`, `zod`, `@hookform/resolvers`
- `recharts`
- Dev: `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer`

**Backend `package.json` dependencies:**
- `express`, `cors`, `jsonwebtoken`, `bcrypt`, `zod`
- `@prisma/client`
- Dev: `typescript`, `tsx`, `prisma`, `@types/express`, `@types/cors`, `@types/jsonwebtoken`, `@types/bcrypt`

**TypeScript strict mode in both:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

## Cursor prompt

```
Scaffold a new React 18 + TypeScript + Vite project in the frontend/ folder with:
- React Router for routing
- Axios for HTTP
- React Hook Form + Zod for forms
- Recharts for charts
- Tailwind CSS for styling

In the backend/ folder, scaffold a Node.js + Express + TypeScript project with:
- Prisma ORM (initialize but don't define schema yet)
- JWT auth dependencies (jsonwebtoken, bcrypt)
- CORS middleware
- Zod for validation
- tsx for dev runtime

Both projects: TypeScript strict mode, ESLint, .gitignore, .env.example.
Backend should expose GET /health returning {ok: true} on port 4000.
Frontend should render a blank page on port 5173.
```
