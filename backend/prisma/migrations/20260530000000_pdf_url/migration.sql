-- Add pdfUrl column to deals for Tab 4 (Documents).
--
-- Stores the public URL of each deal's term-sheet PDF, hosted in the
-- Supabase Storage bucket `deal-documents`. Populated by the one-shot
-- script backend/scripts/generate-deal-pdfs.ts.
--
-- Nullable so deals without a generated PDF render an empty-state
-- card on the Documents tab instead of a broken link. Future deals
-- get a PDF the next time the script is run.

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT;
