import OpenAI from 'openai';

/**
 * OpenAI client wrapper.
 *
 * Lazy-instantiated singleton so importing this module from tests or from
 * the embedding script doesn't crash when OPENAI_API_KEY is intentionally
 * unset (e.g. unit tests mock this module entirely).
 *
 * If the key is missing at runtime, getOpenAI() throws with a clear error.
 * Callers that should degrade gracefully (the semantic search endpoint)
 * check process.env.OPENAI_API_KEY before calling and return 503 if absent.
 */

let cached: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required but not set');
  }
  cached = new OpenAI({ apiKey });
  return cached;
}

// Centralized choice of embedding model. Changing this value:
//   1. requires re-running compute-embeddings.ts to repopulate the column
//   2. may require updating the embedding dimension in the schema
export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;
