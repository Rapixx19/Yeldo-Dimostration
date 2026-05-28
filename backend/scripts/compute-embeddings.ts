import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { EMBEDDING_MODEL, getOpenAI } from '../src/lib/openai.js';

/**
 * One-shot script: compute OpenAI embeddings for every deal that
 * doesn't yet have one. Idempotent — re-running skips deals that
 * already have an embedding unless invoked with --force.
 *
 * Usage
 * -----
 *   npm run compute:embeddings           # only fill missing embeddings
 *   npm run compute:embeddings -- --force   # recompute everything
 *
 * Requires OPENAI_API_KEY in env. Cost estimate is printed before any
 * API calls so you know what you're committing to.
 *
 * What text gets embedded
 * -----------------------
 *   "Name. Location. AssetClass. Instrument: ... Description. Sponsor: ..."
 *
 * Concatenation (vs description-only) captures all the search dimensions
 * — a query like "industrial conversion near Milan" hits both location
 * AND assetClass AND description.
 */

interface DealRow {
  id: string;
  name: string;
  location: string;
  assetClass: string;
  instrument: string;
  description: string;
  sponsorDescription: string;
  hasEmbedding: boolean;
}

function buildEmbedText(deal: DealRow): string {
  return [
    deal.name,
    deal.location,
    deal.assetClass,
    `Instrument: ${deal.instrument.replace(/_/g, ' ')}`,
    deal.description,
    `Sponsor: ${deal.sponsorDescription}`,
  ].join('. ');
}

async function main() {
  const force = process.argv.includes('--force');
  const prisma = new PrismaClient();

  try {
    const rows = await prisma.$queryRaw<DealRow[]>`
      SELECT id, name, location, "assetClass", instrument,
             description, "sponsorDescription",
             embedding IS NOT NULL AS "hasEmbedding"
      FROM public.deals
      ORDER BY slug;
    `;

    const targets = force ? rows : rows.filter((r) => !r.hasEmbedding);

    if (targets.length === 0) {
      console.log('Nothing to embed. Pass --force to recompute everything.');
      return;
    }

    // Cost estimate: text-embedding-3-small is $0.02 per 1M tokens.
    // ~1 token per 4 chars in English. Each deal's embed text is ~400
    // chars on average → ~100 tokens → ~$0.000002 per deal.
    const avgChars = targets.reduce((s, d) => s + buildEmbedText(d).length, 0) / targets.length;
    const estCostUsd = ((targets.length * avgChars) / 4 / 1_000_000) * 0.02;
    console.log(
      `Embedding ${targets.length} deal(s) via ${EMBEDDING_MODEL}.` +
        `\nEstimated cost: ~$${estCostUsd.toFixed(6)} USD.\n`,
    );

    const client = getOpenAI();
    for (const deal of targets) {
      const text = buildEmbedText(deal);
      const response = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
      });
      const vector = response.data[0]?.embedding;
      if (!vector) {
        throw new Error(`OpenAI returned no embedding for ${deal.name}`);
      }

      const literal = `[${vector.join(',')}]`;
      await prisma.$executeRaw`
        UPDATE public.deals SET embedding = ${literal}::vector WHERE id = ${deal.id};
      `;

      process.stdout.write(`  ✓ ${deal.name}\n`);
    }

    console.log(`\nDone. ${targets.length} deal(s) updated.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('compute-embeddings failed:', err);
  process.exit(1);
});
