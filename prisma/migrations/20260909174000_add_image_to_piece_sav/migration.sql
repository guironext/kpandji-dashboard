-- Optional photo of a spare part (URL or local public path).
ALTER TABLE "PieceSAV" ADD COLUMN IF NOT EXISTS "image" TEXT;
