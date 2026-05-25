import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { dealListQuerySchema } from '../schemas/deal.js';

const router = Router();

// GET /api/deals — list with optional filters
router.get('/', async (req, res, next) => {
  try {
    const q = dealListQuerySchema.parse(req.query);
    const where: Prisma.DealWhereInput = {};
    if (q.country) where.country = q.country;
    if (q.instrument) where.instrument = q.instrument;
    if (q.status) where.status = q.status;
    if (q.maturityMin !== undefined || q.maturityMax !== undefined) {
      where.maturityMonths = {
        ...(q.maturityMin !== undefined ? { gte: q.maturityMin } : {}),
        ...(q.maturityMax !== undefined ? { lte: q.maturityMax } : {}),
      };
    }
    if (q.search) where.name = { contains: q.search, mode: 'insensitive' };

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(deals);
  } catch (err) {
    next(err);
  }
});

// GET /api/deals/:slug — single deal
router.get('/:slug', async (req, res, next) => {
  try {
    const deal = await prisma.deal.findUnique({ where: { slug: req.params.slug } });
    if (!deal) {
      throw new Error('DEAL_NOT_FOUND');
    }
    res.json(deal);
  } catch (err) {
    next(err);
  }
});

export default router;
