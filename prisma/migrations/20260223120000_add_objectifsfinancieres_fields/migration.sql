-- AlterTable Objectifsfinancieres: add new columns and make userId/objectifPeriodId optional
ALTER TABLE "Objectifsfinancieres" ADD COLUMN IF NOT EXISTS "nomDuCommercial" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Objectifsfinancieres" ADD COLUMN IF NOT EXISTS "pole" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Objectifsfinancieres" ADD COLUMN IF NOT EXISTS "duree" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Objectifsfinancieres" ADD COLUMN IF NOT EXISTS "chiffreAffaire" DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "Objectifsfinancieres" ADD COLUMN IF NOT EXISTS "finObjectif" TIMESTAMP(3);
ALTER TABLE "Objectifsfinancieres" ADD COLUMN IF NOT EXISTS "pourcentageAtteint" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Objectifsfinancieres" ADD COLUMN IF NOT EXISTS "ecartCible" DECIMAL(18,2);

-- Make userId and objectifPeriodId nullable
ALTER TABLE "Objectifsfinancieres" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Objectifsfinancieres" ALTER COLUMN "objectifPeriodId" DROP NOT NULL;
