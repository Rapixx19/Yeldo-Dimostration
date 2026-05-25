# Spec 01 — Database schema

**Goal:** Define the Prisma schema with User, Deal, Investment, Distribution models. Run first migration.

**Time:** 30 minutes
**Depends on:** `00-project-setup`
**Outputs:** Empty PostgreSQL tables, Prisma client generated

---

## Acceptance criteria

- [ ] `backend/prisma/schema.prisma` defines 4 models
- [ ] `npx prisma migrate dev --name init` succeeds
- [ ] `npx prisma studio` opens and shows empty tables
- [ ] Prisma client types generate without errors

## Schema

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String        @id @default(cuid())
  email         String        @unique
  passwordHash  String
  name          String
  createdAt     DateTime      @default(now())
  investments   Investment[]

  @@map("users")
}

enum Instrument {
  senior_loan
  mezzanine
  senior_debt
  secured_mezzanine
}

enum Distribution {
  quarterly
  at_maturity
}

enum DealStatus {
  open
  closed
  exited
}

enum SentimentLabel {
  bullish
  neutral
  cautious
}

model Deal {
  id                  String         @id @default(cuid())
  slug                String         @unique
  name                String
  location            String
  country             String         // ISO 3166-1 alpha-2 (IT, ES, CH, DE, PT)
  assetClass          String         // "Hospitality", "Residential", etc.
  instrument          Instrument
  targetRaise         Float
  raisedAmount        Float
  targetIRR           Float
  maturityMonths      Int
  loanToValue         Float
  distribution        Distribution
  minimumTicket       Float
  status              DealStatus     @default(open)
  startDate           DateTime
  maturityDate        DateTime
  closesAt            DateTime?      // Application deadline

  // FinBERT sentiment fields (computed at seed time)
  sentimentLabel      SentimentLabel
  sentimentScore      Float          // 0.0 – 1.0
  sentimentSignals    Json           // [{ text: string, polarity: "positive"|"negative" }]

  // Sponsor info
  sponsorName         String
  sponsorDescription  String
  hasFirstLienMortgage Boolean       @default(true)

  // Risk profile
  risks               Json           // [{ category: string, severity: "low"|"med"|"high", note: string }]

  // Description / memo
  description         String         @db.Text
  imageUrl            String?

  createdAt           DateTime       @default(now())
  investments         Investment[]

  @@map("deals")
}

model Investment {
  id          String     @id @default(cuid())
  userId      String
  dealId      String
  amount      Float
  investedAt  DateTime   @default(now())

  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  deal        Deal       @relation(fields: [dealId], references: [id])

  @@map("investments")
}
```

## Implementation notes

- Use `@@map("users")` lowercase table names (PostgreSQL convention)
- `sentimentSignals` and `risks` are stored as `Json` for flexibility — typed in app code via Zod
- `@db.Text` on `description` allows long deal memos
- `closesAt` is nullable since exited deals don't have a future close date

## Cursor prompt

```
Create the Prisma schema at backend/prisma/schema.prisma matching the spec above.
Use PostgreSQL provider.
Define enums: Instrument, Distribution, DealStatus, SentimentLabel.
Define 4 models: User, Deal, Investment, Distribution (omit Distribution model — distributions are computed in frontend from forecast.ts).
Then run: npx prisma migrate dev --name init
```
