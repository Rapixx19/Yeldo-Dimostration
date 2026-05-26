import { Router } from 'express';
import { getActivityById, getRecentActivity } from '../services/activity.js';

const router = Router();

// GET /api/activity/recent?limit=5 — public; latest N investments anonymized
router.get('/recent', async (req, res, next) => {
  try {
    const raw = Number(req.query.limit ?? 5);
    const limit = Math.min(Math.max(Number.isFinite(raw) ? raw : 5, 1), 20);
    const items = await getRecentActivity(limit);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// GET /api/activity/:investmentId — hydrate a single event by id
router.get('/:investmentId', async (req, res, next) => {
  try {
    const item = await getActivityById(req.params.investmentId);
    if (!item) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

export default router;
