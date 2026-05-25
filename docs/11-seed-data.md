# Spec 11 — Seed data

**Goal:** Populate the database with 10 realistic mock deals + 1 demo user + 6 pre-populated investments. Sentiment scores computed at seed time.

**Time:** 60 minutes
**Depends on:** `01-database-schema`, `12-finbert-sentiment` (the sentiment service)
**Outputs:** Database ready for demo, demo account works immediately

---

## Acceptance criteria

- [ ] `npm run seed` creates 10 deals across IT, ES, CH, DE
- [ ] Each deal has realistic data based on Yeldo's actual deals
- [ ] Each deal has sentiment computed by `services/sentiment.ts`
- [ ] Demo user (`recruiter@yeldo-demo.app` / `demo123`) is created
- [ ] Demo user has 6 pre-populated investments across different deals/countries
- [ ] Seed is idempotent (running twice doesn't duplicate)

## File to create

```
backend/prisma/seed.ts
```

## Implementation

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { computeSentiment } from '../src/services/sentiment';

const prisma = new PrismaClient();

const DEALS = [
  {
    slug: 'mas-den-bruno',
    name: "Mas d'en Bruno",
    location: 'Priorat, Spain',
    country: 'ES',
    assetClass: 'Hospitality',
    instrument: 'senior_loan',
    targetRaise: 11_500_000,
    raisedAmount: 9_000_000,
    targetIRR: 12.5,
    maturityMonths: 24,
    loanToValue: 35,
    distribution: 'quarterly',
    minimumTicket: 100_000,
    startDate: new Date('2025-03-01'),
    maturityDate: new Date('2027-03-01'),
    sponsorName: 'The Stein Group',
    sponsorDescription: 'Top-tier equity sponsor and world specialist in the development and management of luxury hotels, with 20+ properties under management across 9 countries.',
    hasFirstLienMortgage: true,
    description: 'Senior secured loan to finance the development of a luxury 5★ hotel in the renowned wine region of Priorat — one of Spain\'s most prestigious viticultural appellations, with growing tourism demand and limited luxury hospitality supply.',
    risks: [
      { category: 'Sponsor execution', severity: 'low', note: '20+ comparable assets' },
      { category: 'Collateral coverage', severity: 'low', note: '35% LTV · first-lien' },
      { category: 'Construction completion', severity: 'med', note: '24-month timeline' },
      { category: 'Tourism market exposure', severity: 'med', note: 'macro-dependent' },
    ],
  },
  {
    slug: 'rovello-14',
    name: 'Rovello 14',
    location: 'Milan, Italy',
    country: 'IT',
    assetClass: 'Residential',
    instrument: 'mezzanine',
    targetRaise: 9_000_000,
    raisedAmount: 8_600_000,
    targetIRR: 14.2,
    maturityMonths: 30,
    loanToValue: 61,
    distribution: 'at_maturity',
    minimumTicket: 100_000,
    startDate: new Date('2024-09-01'),
    maturityDate: new Date('2027-03-01'),
    sponsorName: 'Milano Residences',
    sponsorDescription: 'Boutique residential developer with 12 completed projects in the Milan luxury market, total GDV €450M.',
    hasFirstLienMortgage: false,
    description: 'Mezzanine loan on a luxury residential development at Via Rovello 14, in the heart of Milan\'s historic centre. The project converts a 19th-century palazzo into 8 ultra-luxury apartments.',
    risks: [
      { category: 'Sponsor execution', severity: 'low', note: '12 completed projects' },
      { category: 'Collateral position', severity: 'med', note: 'Mezzanine subordinated' },
      { category: 'Milan luxury market', severity: 'low', note: 'Strong demand' },
    ],
  },
  {
    slug: 'varedo-ex-snia',
    name: 'Varedo, ex SNIA',
    location: 'Milan, Italy',
    country: 'IT',
    assetClass: 'Industrial',
    instrument: 'senior_debt',
    targetRaise: 5_000_000,
    raisedAmount: 5_000_000,
    targetIRR: 9.8,
    maturityMonths: 12,
    loanToValue: 24.4,
    distribution: 'at_maturity',
    minimumTicket: 100_000,
    startDate: new Date('2025-05-01'),
    maturityDate: new Date('2026-05-01'),
    sponsorName: 'Industrial Conversions SRL',
    sponsorDescription: 'Specialist in industrial-to-residential conversions across Northern Italy, 18 successful projects.',
    hasFirstLienMortgage: true,
    description: 'Senior debt for the requalification and use-conversion of a former SNIA industrial lot near Milan into mixed-use residential and commercial space.',
    risks: [
      { category: 'Sponsor execution', severity: 'low', note: '18 completed' },
      { category: 'Permitting', severity: 'low', note: 'Permits already secured' },
      { category: 'Short maturity', severity: 'low', note: '12 months' },
    ],
  },
  {
    slug: 'louis-casai',
    name: 'Louis-Casaï',
    location: 'Meyrin, Switzerland',
    country: 'CH',
    assetClass: 'Hospitality',
    instrument: 'secured_mezzanine',
    targetRaise: 4_000_000,
    raisedAmount: 2_500_000,
    targetIRR: 15.1,
    maturityMonths: 48,
    loanToValue: 46,
    distribution: 'quarterly',
    minimumTicket: 100_000,
    startDate: new Date('2025-01-01'),
    maturityDate: new Date('2029-01-01'),
    sponsorName: 'Swiss Hospitality Capital',
    sponsorDescription: 'Geneva-based hospitality investor with portfolio across Switzerland and France.',
    hasFirstLienMortgage: true,
    description: 'Secured mezzanine financing for a 4-star hospitality asset near Geneva airport, targeting business and conference traffic.',
    risks: [
      { category: 'Long maturity', severity: 'med', note: '48 months' },
      { category: 'Hospitality cycle', severity: 'med', note: 'Macro-dependent' },
      { category: 'Collateral coverage', severity: 'low', note: 'Secured + first-lien' },
    ],
  },
  {
    slug: 'berlin-mitte-lofts',
    name: 'Berlin Mitte Lofts',
    location: 'Berlin, Germany',
    country: 'DE',
    assetClass: 'Residential',
    instrument: 'senior_loan',
    targetRaise: 12_000_000,
    raisedAmount: 6_500_000,
    targetIRR: 11.4,
    maturityMonths: 36,
    loanToValue: 42,
    distribution: 'quarterly',
    minimumTicket: 100_000,
    startDate: new Date('2024-12-01'),
    maturityDate: new Date('2027-12-01'),
    sponsorName: 'Berlin Capital Partners',
    sponsorDescription: 'Berlin residential developer focused on adaptive reuse of historic buildings.',
    hasFirstLienMortgage: true,
    description: 'Senior loan for the conversion of a former industrial building in Berlin-Mitte into 24 luxury loft apartments. Strong demand fundamentals in Berlin\'s prime residential market.',
    risks: [
      { category: 'Sponsor execution', severity: 'low', note: 'Track record' },
      { category: 'Berlin residential demand', severity: 'low', note: 'Structural undersupply' },
      { category: 'Construction', severity: 'med', note: 'Adaptive reuse complexity' },
    ],
  },
  {
    slug: 'costa-brava-villas',
    name: 'Costa Brava Villas',
    location: 'Catalonia, Spain',
    country: 'ES',
    assetClass: 'Vacation',
    instrument: 'mezzanine',
    targetRaise: 12_000_000,
    raisedAmount: 4_200_000,
    targetIRR: 13.7,
    maturityMonths: 24,
    loanToValue: 55,
    distribution: 'at_maturity',
    minimumTicket: 100_000,
    startDate: new Date('2025-08-01'),
    maturityDate: new Date('2027-08-01'),
    sponsorName: 'Mediterranean Holiday Group',
    sponsorDescription: 'Spanish vacation rental operator with 200+ properties across the Costa Brava and Balearics.',
    hasFirstLienMortgage: false,
    description: 'Mezzanine financing for the acquisition and refurbishment of 6 vacation villas along the Costa Brava, targeting the premium short-term rental market.',
    risks: [
      { category: 'Tourism sensitivity', severity: 'med', note: 'Macro-dependent' },
      { category: 'Mezzanine position', severity: 'med', note: 'Subordinated to senior' },
      { category: 'Short maturity', severity: 'low', note: '24 months' },
    ],
  },
  // Add 4 more for variety: Italian alpine resort, Portuguese coastal hotel, Madrid prime office, Zurich student housing
  {
    slug: 'alpine-resort-cortina',
    name: 'Alpine Resort Cortina',
    location: 'Cortina d\'Ampezzo, Italy',
    country: 'IT',
    assetClass: 'Hospitality',
    instrument: 'senior_loan',
    targetRaise: 15_000_000,
    raisedAmount: 11_200_000,
    targetIRR: 11.8,
    maturityMonths: 36,
    loanToValue: 38,
    distribution: 'quarterly',
    minimumTicket: 100_000,
    startDate: new Date('2024-11-01'),
    maturityDate: new Date('2027-11-01'),
    sponsorName: 'Dolomiti Resorts',
    sponsorDescription: 'Alpine hospitality specialist with 8 resorts in the Italian Alps.',
    hasFirstLienMortgage: true,
    description: 'Senior loan for a luxury alpine resort expansion in Cortina d\'Ampezzo, host of the 2026 Winter Olympics.',
    risks: [
      { category: 'Olympic catalyst', severity: 'low', note: 'Strong tailwind' },
      { category: 'Construction', severity: 'med', note: 'Alpine logistics' },
    ],
  },
  {
    slug: 'lisbon-waterfront',
    name: 'Lisbon Waterfront',
    location: 'Lisbon, Portugal',
    country: 'PT',
    assetClass: 'Hospitality',
    instrument: 'senior_debt',
    targetRaise: 7_500_000,
    raisedAmount: 3_100_000,
    targetIRR: 10.5,
    maturityMonths: 18,
    loanToValue: 41,
    distribution: 'at_maturity',
    minimumTicket: 100_000,
    startDate: new Date('2025-06-01'),
    maturityDate: new Date('2026-12-01'),
    sponsorName: 'Iberian Hospitality',
    sponsorDescription: 'Portuguese hotel developer with 14 boutique properties.',
    hasFirstLienMortgage: true,
    description: 'Senior debt for a boutique hotel redevelopment on the Lisbon waterfront.',
    risks: [
      { category: 'Lisbon tourism', severity: 'low', note: 'Growing market' },
      { category: 'Short maturity', severity: 'low', note: '18 months' },
    ],
  },
  {
    slug: 'madrid-prime-office',
    name: 'Madrid Prime Office',
    location: 'Madrid, Spain',
    country: 'ES',
    assetClass: 'Commercial',
    instrument: 'senior_loan',
    targetRaise: 20_000_000,
    raisedAmount: 14_500_000,
    targetIRR: 9.2,
    maturityMonths: 60,
    loanToValue: 52,
    distribution: 'quarterly',
    minimumTicket: 250_000,
    startDate: new Date('2024-10-01'),
    maturityDate: new Date('2029-10-01'),
    sponsorName: 'Spanish Office REIT',
    sponsorDescription: 'Listed Spanish REIT focused on Madrid CBD commercial assets.',
    hasFirstLienMortgage: true,
    description: 'Senior loan for the acquisition of a prime Class A office building in Madrid\'s Castellana district, 95% leased to investment-grade tenants.',
    risks: [
      { category: 'Office market', severity: 'med', note: 'Post-COVID adjustment' },
      { category: 'Long maturity', severity: 'med', note: '60 months' },
      { category: 'Tenant credit', severity: 'low', note: '95% IG' },
    ],
  },
  {
    slug: 'zurich-student-housing',
    name: 'Zurich Student Housing',
    location: 'Zurich, Switzerland',
    country: 'CH',
    assetClass: 'Residential',
    instrument: 'senior_loan',
    targetRaise: 6_000_000,
    raisedAmount: 5_800_000,
    targetIRR: 10.8,
    maturityMonths: 42,
    loanToValue: 39,
    distribution: 'quarterly',
    minimumTicket: 100_000,
    startDate: new Date('2024-08-01'),
    maturityDate: new Date('2028-02-01'),
    sponsorName: 'Swiss Educational Housing',
    sponsorDescription: 'Operator of 1,200+ purpose-built student housing beds across Switzerland.',
    hasFirstLienMortgage: true,
    description: 'Senior loan for the development of 180 purpose-built student housing units near ETH Zurich.',
    risks: [
      { category: 'Demand', severity: 'low', note: 'Chronic Zurich shortage' },
      { category: 'Construction', severity: 'low', note: 'Standard build' },
    ],
  },
];

async function main() {
  // 1. Create demo user (idempotent)
  const passwordHash = await bcrypt.hash(process.env.SEED_DEMO_PASSWORD || 'demo123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'recruiter@yeldo-demo.app' },
    update: {},
    create: {
      email: 'recruiter@yeldo-demo.app',
      passwordHash,
      name: 'Recruiter Demo',
    },
  });
  console.log(`✓ Demo user: ${demoUser.email}`);

  // 2. Create deals with computed sentiment
  const dealRecords = [];
  for (const dealData of DEALS) {
    const sentiment = computeSentiment({
      loanToValue: dealData.loanToValue,
      instrument: dealData.instrument as any,
      maturityMonths: dealData.maturityMonths,
      hasFirstLienMortgage: dealData.hasFirstLienMortgage,
    });

    const deal = await prisma.deal.upsert({
      where: { slug: dealData.slug },
      update: {},
      create: {
        ...dealData,
        instrument: dealData.instrument as any,
        distribution: dealData.distribution as any,
        sentimentLabel: sentiment.label,
        sentimentScore: sentiment.score,
        sentimentSignals: sentiment.signals as any,
        risks: dealData.risks as any,
      },
    });
    dealRecords.push(deal);
    console.log(`✓ Deal: ${deal.name} [${sentiment.label} ${Math.round(sentiment.score*100)}%]`);
  }

  // 3. Create 6 mock investments for the demo user (only if none exist)
  const existingCount = await prisma.investment.count({ where: { userId: demoUser.id } });
  if (existingCount === 0) {
    const investments = [
      { dealSlug: 'mas-den-bruno', amount: 12000 },
      { dealSlug: 'varedo-ex-snia', amount: 10000 },
      { dealSlug: 'rovello-14', amount: 8000 },
      { dealSlug: 'berlin-mitte-lofts', amount: 6000 },
      { dealSlug: 'louis-casai', amount: 5000 },
      { dealSlug: 'costa-brava-villas', amount: 4200 },
    ];
    for (const inv of investments) {
      const deal = dealRecords.find(d => d.slug === inv.dealSlug)!;
      await prisma.investment.create({
        data: {
          userId: demoUser.id,
          dealId: deal.id,
          amount: inv.amount,
        },
      });
    }
    console.log(`✓ Created ${investments.length} mock investments`);
  } else {
    console.log(`Demo user already has ${existingCount} investments — skipping`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

Add to `backend/package.json`:
```json
"scripts": {
  "seed": "tsx prisma/seed.ts",
  "prisma:reset": "prisma migrate reset --force && npm run seed"
}
```

## Cursor prompt

```
Create backend/prisma/seed.ts matching the spec.
10 deals across IT, ES, CH, DE, PT with realistic data.
Each deal's sentiment is computed by calling computeSentiment() from services/sentiment.ts.
Demo user (recruiter@yeldo-demo.app) is created with 6 mock investments totaling ~€45,200.
Seed is idempotent — uses prisma.user.upsert and prisma.deal.upsert, skips investment creation if any exist for the demo user.
Add npm scripts: "seed" and "prisma:reset".
```
