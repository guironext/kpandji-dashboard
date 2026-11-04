ALTER TABLE "RapportVisiteClientele" ADD COLUMN IF NOT EXISTS "barrieresDecision" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "RapportVisiteClientele" ADD COLUMN IF NOT EXISTS "conclusion" JSONB NOT NULL DEFAULT '{}';
