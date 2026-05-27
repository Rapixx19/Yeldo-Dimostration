import { z } from 'zod';

/**
 * Zod schema for POST /api/search body.
 *
 * Bounds chosen for cost control + UX:
 *   - query 1..500 chars  → caps per-request OpenAI token spend at ~125 tokens
 *   - limit 1..20         → paginated grid friendly, no DB hot loops
 *   - limit default 5     → matches the default Discover grid layout
 */
export const semanticSearchSchema = z.object({
  query: z.string().trim().min(1).max(500),
  limit: z.number().int().min(1).max(20).optional().default(5),
});

export type SemanticSearchRequest = z.infer<typeof semanticSearchSchema>;
