import type { Deal } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { EMBEDDING_MODEL, getOpenAI } from '../lib/openai.js';

export interface SemanticSearchResult {
  deal: Deal;
  similarity: number; // cosine similarity in [0, 1], higher = more similar
}

/**
 * Semantic deal search.
 *
 * Flow
 * ----
 *  1. Embed the user's query via OpenAI text-embedding-3-small (1536-d).
 *  2. Use pgvector's <=> cosine-distance operator to rank deals by
 *     distance to the query vector. Convert distance → similarity
 *     (1 - distance) before returning so callers see a "higher is better"
 *     score in [0, 1].
 *
 * Why $queryRaw and not Prisma's query builder
 * --------------------------------------------
 * Prisma has no first-class support for pgvector operators. We pass the
 * embedding as a string literal in the canonical pgvector format
 * "[a,b,c,...]" and cast it server-side with ::vector. Values are still
 * parameterized — no SQL injection surface.
 */
export async function semanticSearch(
  query: string,
  limit: number,
): Promise<SemanticSearchResult[]> {
  const client = getOpenAI();
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  });
  const vector = response.data[0]?.embedding;
  if (!vector) {
    throw new Error('OpenAI returned no embedding for the query');
  }

  // pgvector accepts vectors as "[v1,v2,...]" strings cast to ::vector.
  const vectorLiteral = `[${vector.join(',')}]`;

  // The SELECT list mirrors a full Deal row plus a `similarity` derived column.
  // The HNSW index on (embedding vector_cosine_ops) is used for the ORDER BY.
  const rows = await prisma.$queryRaw<Array<Deal & { similarity: number }>>`
    SELECT
      id, slug, name, location, country, "assetClass", instrument,
      "targetRaise", "raisedAmount", "targetIRR", "maturityMonths", "loanToValue",
      distribution, "minimumTicket", status, "startDate", "maturityDate", "closesAt",
      "sentimentLabel", "sentimentScore", "sentimentSignals",
      "sponsorName", "sponsorDescription", "hasFirstLienMortgage",
      risks, description, "imageUrl", "createdAt",
      1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM public.deals
    WHERE embedding IS NOT NULL AND status = 'open'
    ORDER BY embedding <=> ${vectorLiteral}::vector
    LIMIT ${limit};
  `;

  return rows.map(({ similarity, ...deal }) => ({
    deal: deal as Deal,
    similarity,
  }));
}
