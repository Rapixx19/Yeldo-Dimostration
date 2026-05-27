import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDeal } from '../fixtures.js';

// Mock the OpenAI client so tests don't make real network calls.
const embeddingsCreate = vi.fn();
vi.mock('../../src/lib/openai.js', () => ({
  getOpenAI: () => ({
    embeddings: { create: embeddingsCreate },
  }),
  EMBEDDING_MODEL: 'text-embedding-3-small',
  EMBEDDING_DIMENSIONS: 1536,
}));

// Mock prisma.$queryRaw — pgvector queries return Deal columns + similarity.
vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

import { prisma } from '../../src/lib/prisma.js';
import { semanticSearch } from '../../src/services/semanticSearch.js';

const queryRaw = vi.mocked(prisma.$queryRaw);

beforeEach(() => {
  vi.clearAllMocks();
  // Default: a valid 1536-d embedding
  embeddingsCreate.mockResolvedValue({
    data: [{ embedding: new Array(1536).fill(0.001) }],
  });
});

describe('semanticSearch', () => {
  it('calls OpenAI embeddings.create with the query and the configured model', async () => {
    queryRaw.mockResolvedValueOnce([]);
    await semanticSearch('luxury hotel in Italy', 5);
    expect(embeddingsCreate).toHaveBeenCalledTimes(1);
    expect(embeddingsCreate).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: 'luxury hotel in Italy',
    });
  });

  it('returns rows in the order the DB returned them (DB does the ranking)', async () => {
    // Service is a thin layer over the SQL — it does not re-sort. The
    // ORDER BY clause in the SQL is the authority. We assert that whatever
    // order the DB returns is what comes out of the service.
    const dealA = makeDeal({ id: 'a', slug: 'a-slug', name: 'A' });
    const dealB = makeDeal({ id: 'b', slug: 'b-slug', name: 'B' });
    queryRaw.mockResolvedValueOnce([
      { ...dealA, similarity: 0.92 },
      { ...dealB, similarity: 0.74 },
    ]);

    const results = await semanticSearch('test query', 5);
    expect(results).toHaveLength(2);
    expect(results[0].deal.id).toBe('a');
    expect(results[0].similarity).toBe(0.92);
    expect(results[1].deal.id).toBe('b');
    expect(results[1].similarity).toBe(0.74);
  });

  it('strips the similarity column out of the deal payload', async () => {
    const deal = makeDeal({ id: 'x' });
    queryRaw.mockResolvedValueOnce([{ ...deal, similarity: 0.5 }]);

    const [result] = await semanticSearch('test', 1);
    expect(result.deal).not.toHaveProperty('similarity');
    expect(result.similarity).toBe(0.5);
  });

  it('returns an empty array when the DB returns no matches', async () => {
    queryRaw.mockResolvedValueOnce([]);
    const results = await semanticSearch('nothing matches this', 5);
    expect(results).toEqual([]);
  });

  it('throws if OpenAI returns an empty embedding payload', async () => {
    embeddingsCreate.mockResolvedValueOnce({ data: [] });
    await expect(semanticSearch('test', 5)).rejects.toThrow(/no embedding/i);
  });

  it('preserves the similarity score type as number', async () => {
    queryRaw.mockResolvedValueOnce([{ ...makeDeal(), similarity: 0.873 }]);
    const [result] = await semanticSearch('test', 1);
    expect(typeof result.similarity).toBe('number');
  });
});
