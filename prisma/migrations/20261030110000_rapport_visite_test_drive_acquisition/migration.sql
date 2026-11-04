ALTER TABLE "RapportVisiteClientele" ADD COLUMN IF NOT EXISTS "testDrivePropose" BOOLEAN;
ALTER TABLE "RapportVisiteClientele" ADD COLUMN IF NOT EXISTS "modesAcquisition" JSONB NOT NULL DEFAULT '[]';
