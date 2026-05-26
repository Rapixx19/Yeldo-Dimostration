import { prisma } from '../lib/prisma.js';

export interface ActivityItem {
  id: string;
  amount: number;
  dealName: string;
  investedAt: Date;
  userName: string;
}

/**
 * Most recent investments across all users, anonymized to first names only.
 * Used by the Dashboard activity feed (public; no auth required).
 */
export async function getRecentActivity(limit: number): Promise<ActivityItem[]> {
  const rows = await prisma.investment.findMany({
    orderBy: { investedAt: 'desc' },
    take: limit,
    include: {
      deal: { select: { name: true } },
      user: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    amount: row.amount,
    dealName: row.deal.name,
    investedAt: row.investedAt,
    userName: row.user.name.split(' ')[0] ?? 'Investor',
  }));
}

/**
 * Single-investment activity row by id. Used to hydrate Realtime INSERT
 * payloads on the frontend (the channel emits the raw row; we need names).
 */
export async function getActivityById(investmentId: string): Promise<ActivityItem | null> {
  const row = await prisma.investment.findUnique({
    where: { id: investmentId },
    include: {
      deal: { select: { name: true } },
      user: { select: { name: true } },
    },
  });

  if (!row) return null;
  return {
    id: row.id,
    amount: row.amount,
    dealName: row.deal.name,
    investedAt: row.investedAt,
    userName: row.user.name.split(' ')[0] ?? 'Investor',
  };
}
