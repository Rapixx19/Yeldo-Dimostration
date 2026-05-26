import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getRecommendations } from '../services/recommendations.js';

const router = Router();
router.use(authMiddleware);

// GET /api/recommendations?limit=3 — portfolio-aware deal recommendations
router.get('/', async (req, res, next) => {
  try {
    const raw = Number(req.query.limit ?? 3);
    const limit = Math.min(Math.max(Number.isFinite(raw) ? raw : 3, 1), 10);
    const items = await getRecommendations(req.user!.id, limit);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

export default router;
