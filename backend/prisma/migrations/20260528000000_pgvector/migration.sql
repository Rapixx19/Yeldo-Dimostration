-- Enable pgvector for semantic deal search (V2 phase B1).
--
-- Why pgvector and not a dedicated vector store (Pinecone, Weaviate, etc)
-- ---------------------------------------------------------------------
-- Embeddings live in the same Postgres database as the rows they describe.
-- That removes a class of consistency problems: no two-store sync, no
-- second SaaS bill, no separate access-control surface to reason about.
-- At our scale (10 deals → potentially thousands), pgvector is a strictly
-- better choice than provisioning an external vector DB.
--
-- Index choice: HNSW vs IVFFlat
-- -----------------------------
-- HNSW (Hierarchical Navigable Small World) graph index — chosen because:
--   * Better recall/speed tradeoff than IVFFlat at our scale
--   * No tuning required (IVFFlat needs `lists` set to ~sqrt(rows))
--   * Robust to incremental inserts (IVFFlat needs periodic re-clustering)
--
-- Operator class: vector_cosine_ops
-- ---------------------------------
-- Matches the cosine distance operator (<=>) that our service uses. The
-- alternatives are vector_l2_ops (Euclidean) and vector_ip_ops (negative
-- inner product). OpenAI embeddings are L2-normalized, so cosine and IP
-- give the same ranking — we pick cosine for clarity in queries.

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS deals_embedding_hnsw_idx
  ON public.deals
  USING hnsw (embedding vector_cosine_ops);
