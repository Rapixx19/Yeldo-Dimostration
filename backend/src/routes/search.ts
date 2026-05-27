import { Router } from 'express';
import { semanticSearchSchema } from '../schemas/search.js';
import { semanticSearch } from '../services/semanticSearch.js';

const router = Router();

/**
 * POST /api/search — semantic deal search.
 *
 * Public endpoint (no auth) because semantic search is part of the public
 * Discover experience. Cost ceiling per request is governed by the Zod
 * schema's query length cap (500 chars → ~125 tokens → ~$0.0000025).
 *
 * Returns 503 if OPENAI_API_KEY is not configured, so the rest of the API
 * keeps working in environments where semantic search isn't provisioned.
 */
router.post('/', async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      res.status(503).json({ error: 'SEMANTIC_SEARCH_UNAVAILABLE' });
      return;
    }
    const { query, limit } = semanticSearchSchema.parse(req.body);
    const results = await semanticSearch(query, limit);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

export default router;
