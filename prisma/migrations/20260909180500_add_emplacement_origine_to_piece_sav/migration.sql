-- Optional warehouse location and origin of a spare part.
ALTER TABLE "PieceSAV" ADD COLUMN IF NOT EXISTS "emplacement" TEXT;
ALTER TABLE "PieceSAV" ADD COLUMN IF NOT EXISTS "origine" TEXT;
