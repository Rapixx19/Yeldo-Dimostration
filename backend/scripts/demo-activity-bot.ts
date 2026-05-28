import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

/**
 * Demo activity bot — long-running.
 *
 * Why it exists
 * -------------
 * Two of the Realtime features in this project (the Dashboard activity
 * feed and the DealCard "LIVE" raise-progress bars) only show motion
 * when someone invests. During a recruiter demo there is no real
 * user clicking Invest, so the page sits static.
 *
 * This script simulates that traffic: every 60–90 seconds it picks a
 * random open deal, picks a realistic amount, and writes one
 * investment row + a raisedAmount increment in a transaction —
 * exactly what POST /api/investments would do for a real user. The
 * Realtime broadcast that follows lights up every connected browser.
 *
 * Usage
 * -----
 *   cd backend
 *   npm run bot:demo
 *
 * Stop with Ctrl+C. The bot installs a SIGINT handler so it shuts the
 * Prisma client cleanly instead of leaving the connection hanging.
 *
 * Production note
 * ---------------
 * This is a demo aid, not a service. Don't run it on Railway. The DB
 * doesn't distinguish "bot" investments from real ones — they go in
 * the same table — so it should not run anywhere users might be making
 * real (virtual) investments.
 */

const TICK_MIN_MS = 60_000;
const TICK_MAX_MS = 90_000;
const AMOUNT_MIN = 5_000;
const AMOUNT_MAX = 30_000;
const DEMO_EMAIL = 'ferdinand.straehuber@gmail.com';

const prisma = new PrismaClient();

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAmount(): number {
  // Round to nearest €100 so the running totals look like real round-number
  // ticket sizes, not /(0\.00$)/ noise.
  return Math.round(randomBetween(AMOUNT_MIN, AMOUNT_MAX) / 100) * 100;
}

async function getDemoUserId(): Promise<string> {
  const user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!user) {
    throw new Error(
      `Demo user ${DEMO_EMAIL} not found. Sign up via the live site first or re-seed the database.`,
    );
  }
  return user.id;
}

async function tick(userId: string): Promise<void> {
  // Pick a deal with room to grow. Re-read each tick so we react to deals
  // closing out as the demo progresses.
  const openDeals = await prisma.deal.findMany({
    where: { status: 'open' },
  });
  const candidates = openDeals.filter((d) => d.raisedAmount < d.targetRaise);
  if (candidates.length === 0) {
    console.log('[bot] no open deals with remaining capacity — sleeping until next tick.');
    return;
  }

  const deal = candidates[Math.floor(Math.random() * candidates.length)];
  if (!deal) return;

  // Clip the amount so we never overshoot the target raise. The card's
  // progress bar tops out at 100% but conceptually it's cleaner to keep
  // raisedAmount <= targetRaise.
  const remaining = deal.targetRaise - deal.raisedAmount;
  const amount = Math.min(randomAmount(), Math.floor(remaining / 100) * 100);
  if (amount <= 0) return;

  await prisma.$transaction([
    prisma.investment.create({
      data: { userId, dealId: deal.id, amount },
    }),
    prisma.deal.update({
      where: { id: deal.id },
      data: { raisedAmount: { increment: amount } },
    }),
  ]);

  const newRaised = deal.raisedAmount + amount;
  console.log(
    `[bot] +€${amount.toLocaleString('en-US')} → ${deal.name} (${newRaised.toLocaleString('en-US')} / ${deal.targetRaise.toLocaleString('en-US')})`,
  );
}

async function main() {
  const userId = await getDemoUserId();
  console.log(`[bot] starting — demo user id ${userId.slice(0, 8)}…`);
  console.log(`[bot] tick every ${TICK_MIN_MS / 1000}–${TICK_MAX_MS / 1000}s — Ctrl+C to stop.\n`);

  // Run one tick immediately so the demo has visible motion within a few
  // seconds of starting. Then schedule the next tick at a random delay.
  await tick(userId);

  const scheduleNext = () => {
    const delay = randomBetween(TICK_MIN_MS, TICK_MAX_MS);
    setTimeout(async () => {
      try {
        await tick(userId);
      } catch (err) {
        console.error('[bot] tick failed:', err);
      }
      scheduleNext();
    }, delay);
  };
  scheduleNext();
}

process.on('SIGINT', async () => {
  console.log('\n[bot] stopping — disconnecting Prisma.');
  await prisma.$disconnect();
  process.exit(0);
});

main().catch(async (err) => {
  console.error('[bot] failed to start:', err);
  await prisma.$disconnect();
  process.exit(1);
});
