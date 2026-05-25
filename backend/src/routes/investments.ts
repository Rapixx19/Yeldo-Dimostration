import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { createInvestmentSchema } from '../schemas/investment.js';
import { getPortfolioKPIs } from '../services/portfolio.js';

const router = Router();
router.use(authMiddleware);

// POST /api/investments — virtual invest
router.post('/', async (req, res, next) => {
  try {
    const data = createInvestmentSchema.parse(req.body);
    const deal = await prisma.deal.findUnique({ where: { id: data.dealId } });
    if (!deal) throw new Error('DEAL_NOT_FOUND');
    if (deal.status !== 'open') throw new Error('DEAL_CLOSED');
    if (data.amount < deal.minimumTicket) throw new Error('BELOW_MIN_TICKET');

    const remaining = deal.targetRaise - deal.raisedAmount;
    if (data.amount > remaining) {
      res.status(422).json({ error: 'EXCEEDS_CAPACITY', details: { remaining } });
      return;
    }

    const [investment] = await prisma.$transaction([
      prisma.investment.create({
        data: {
          userId: req.user!.id,
          dealId: data.dealId,
          amount: data.amount,
        },
        include: { deal: true },
      }),
      prisma.deal.update({
        where: { id: data.dealId },
        data: { raisedAmount: { increment: data.amount } },
      }),
    ]);

    res.status(201).json(investment);
  } catch (err) {
    next(err);
  }
});

// GET /api/investments — user's investments with deal data
router.get('/', async (req, res, next) => {
  try {
    const investments = await prisma.investment.findMany({
      where: { userId: req.user!.id },
      include: { deal: true },
      orderBy: { investedAt: 'desc' },
    });
    res.json(investments);
  } catch (err) {
    next(err);
  }
});

export default router;

// Separate router for /api/portfolio — aggregated KPIs
export const portfolioRouter = (() => {
  const r = Router();
  r.use(authMiddleware);
  r.get('/', async (req, res, next) => {
    try {
      const kpis = await getPortfolioKPIs(req.user!.id);
      res.json(kpis);
    } catch (err) {
      next(err);
    }
  });
  return r;
})();
