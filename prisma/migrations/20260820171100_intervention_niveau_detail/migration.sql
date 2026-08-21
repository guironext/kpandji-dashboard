-- InterventionDiagnosticOffert: niveau + optional DetailDiagnostic link
-- Idempotent for Neon DBs that already received this model via db push.

CREATE TABLE IF NOT EXISTS "InterventionDiagnosticOffert" (
    "id" TEXT NOT NULL,
    "date_Intervention" TIMESTAMP(3) NOT NULL,
    "typeProduitUtilise" TEXT NOT NULL,
    "niveau_Intervention" INTEGER NOT NULL DEFAULT 1,
    "voitureSAVId" TEXT NOT NULL,
    "detailDiagnosticId" TEXT,
    "groupePersonnelSAVId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterventionDiagnosticOffert_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InterventionDiagnosticOffert" ADD COLUMN IF NOT EXISTS "niveau_Intervention" INTEGER DEFAULT 1;
ALTER TABLE "InterventionDiagnosticOffert" ALTER COLUMN "niveau_Intervention" SET DEFAULT 1;
UPDATE "InterventionDiagnosticOffert" SET "niveau_Intervention" = 1 WHERE "niveau_Intervention" IS NULL;
ALTER TABLE "InterventionDiagnosticOffert" ADD COLUMN IF NOT EXISTS "detailDiagnosticId" TEXT;

DO $$ BEGIN
    ALTER TABLE "InterventionDiagnosticOffert"
        ADD CONSTRAINT "InterventionDiagnosticOffert_voitureSAVId_fkey"
        FOREIGN KEY ("voitureSAVId") REFERENCES "VoitureSAV"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "InterventionDiagnosticOffert"
        ADD CONSTRAINT "InterventionDiagnosticOffert_detailDiagnosticId_fkey"
        FOREIGN KEY ("detailDiagnosticId") REFERENCES "DetailDiagnostic"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "InterventionDiagnosticOffert_voitureSAVId_idx"
    ON "InterventionDiagnosticOffert"("voitureSAVId");
CREATE INDEX IF NOT EXISTS "InterventionDiagnosticOffert_detailDiagnosticId_idx"
    ON "InterventionDiagnosticOffert"("detailDiagnosticId");
