-- GarantieSAV was added via db push on some environments and is missing from
-- earlier migrations. Create it for shadow/fresh DBs, then make voitureSAVId optional.

DO $$ BEGIN
    CREATE TYPE "StatutGarantie" AS ENUM (
        'EN_ATTENTE',
        'EN_TRAITEMENT',
        'TESTE',
        'TERMINE',
        'ANNULE',
        'EN_MAINTENANCE'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "GarantieSAV" (
    "id" TEXT NOT NULL,
    "categorie_garantie" TEXT NOT NULL,
    "nom_garantie" TEXT,
    "quantite_garantie_offert" INTEGER,
    "prix_unitaire" DECIMAL(65,30) DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voitureSAVId" TEXT,
    "statut" "StatutGarantie" NOT NULL DEFAULT 'EN_TRAITEMENT',
    "groupePersonnelSAVId" TEXT,

    CONSTRAINT "GarantieSAV_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "GarantieSAV" ADD COLUMN IF NOT EXISTS "nom_garantie" TEXT;
ALTER TABLE "GarantieSAV" ADD COLUMN IF NOT EXISTS "quantite_garantie_offert" INTEGER;
ALTER TABLE "GarantieSAV" ADD COLUMN IF NOT EXISTS "prix_unitaire" DECIMAL(65,30) DEFAULT 0;
ALTER TABLE "GarantieSAV" ADD COLUMN IF NOT EXISTS "voitureSAVId" TEXT;
ALTER TABLE "GarantieSAV" ADD COLUMN IF NOT EXISTS "groupePersonnelSAVId" TEXT;
ALTER TABLE "GarantieSAV" ADD COLUMN IF NOT EXISTS "statut" "StatutGarantie" DEFAULT 'EN_TRAITEMENT';

ALTER TABLE "GarantieSAV" ALTER COLUMN "voitureSAVId" DROP NOT NULL;

ALTER TABLE "GarantieSAV" DROP CONSTRAINT IF EXISTS "GarantieSAV_voitureSAVId_fkey";

DO $$ BEGIN
    ALTER TABLE "GarantieSAV"
        ADD CONSTRAINT "GarantieSAV_voitureSAVId_fkey"
        FOREIGN KEY ("voitureSAVId") REFERENCES "VoitureSAV"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "DetailDiagnostic" ADD COLUMN IF NOT EXISTS "garantieSAVId" TEXT;

DO $$ BEGIN
    ALTER TABLE "DetailDiagnostic"
        ADD CONSTRAINT "DetailDiagnostic_garantieSAVId_fkey"
        FOREIGN KEY ("garantieSAVId") REFERENCES "GarantieSAV"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "PieceSAV" ADD COLUMN IF NOT EXISTS "garantieSAVId" TEXT;

DO $$ BEGIN
    ALTER TABLE "PieceSAV"
        ADD CONSTRAINT "PieceSAV_garantieSAVId_fkey"
        FOREIGN KEY ("garantieSAVId") REFERENCES "GarantieSAV"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
