-- CreateTable ObjectifPeriod if it doesn't exist (shadow DB), or alter if it does (production)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ObjectifPeriod') THEN
    CREATE TABLE "ObjectifPeriod" (
      "id" TEXT NOT NULL,
      "objectif_start" TIMESTAMP(3) NOT NULL,
      "objectif_end" TIMESTAMP(3) NOT NULL,
      "objectif_duree" TEXT NOT NULL,
      "objectifs_financieres" TEXT NOT NULL,
      "objectifs_vehicules" TEXT NOT NULL,
      "objectifs_clients" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      "userId" TEXT NOT NULL,
      CONSTRAINT "ObjectifPeriod_pkey" PRIMARY KEY ("id")
    );
    ALTER TABLE "ObjectifPeriod" ADD CONSTRAINT "ObjectifPeriod_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  ELSE
    ALTER TABLE "ObjectifPeriod" ADD COLUMN IF NOT EXISTS "objectif_start" TIMESTAMP(3);
    ALTER TABLE "ObjectifPeriod" ADD COLUMN IF NOT EXISTS "objectif_end" TIMESTAMP(3);
    ALTER TABLE "ObjectifPeriod" ADD COLUMN IF NOT EXISTS "objectif_duree" TEXT;
    ALTER TABLE "ObjectifPeriod" ADD COLUMN IF NOT EXISTS "objectifs_financieres" TEXT;
    ALTER TABLE "ObjectifPeriod" ADD COLUMN IF NOT EXISTS "objectifs_vehicules" TEXT;
    ALTER TABLE "ObjectifPeriod" ADD COLUMN IF NOT EXISTS "objectifs_clients" TEXT;
    ALTER TABLE "ObjectifPeriod" ADD COLUMN IF NOT EXISTS "userId" TEXT;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ObjectifPeriod' AND column_name = 'start') THEN
      UPDATE "ObjectifPeriod" SET objectif_start = COALESCE("start", NOW()), objectif_end = COALESCE("end", NOW());
    ELSE
      UPDATE "ObjectifPeriod" SET objectif_start = NOW(), objectif_end = NOW() WHERE objectif_start IS NULL;
    END IF;

    UPDATE "ObjectifPeriod" SET objectif_duree = COALESCE(objectif_duree, ''), objectifs_financieres = COALESCE(objectifs_financieres, ''), objectifs_vehicules = COALESCE(objectifs_vehicules, ''), objectifs_clients = COALESCE(objectifs_clients, '') WHERE objectif_duree IS NULL;
    UPDATE "ObjectifPeriod" SET "userId" = (SELECT id FROM "User" LIMIT 1) WHERE "userId" IS NULL;

    ALTER TABLE "ObjectifPeriod" ALTER COLUMN "objectif_start" SET NOT NULL;
    ALTER TABLE "ObjectifPeriod" ALTER COLUMN "objectif_end" SET NOT NULL;
    ALTER TABLE "ObjectifPeriod" ALTER COLUMN "objectif_duree" SET NOT NULL;
    ALTER TABLE "ObjectifPeriod" ALTER COLUMN "objectifs_financieres" SET NOT NULL;
    ALTER TABLE "ObjectifPeriod" ALTER COLUMN "objectifs_vehicules" SET NOT NULL;
    ALTER TABLE "ObjectifPeriod" ALTER COLUMN "objectifs_clients" SET NOT NULL;
    ALTER TABLE "ObjectifPeriod" ALTER COLUMN "userId" SET NOT NULL;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ObjectifPeriod_userId_fkey') THEN
      ALTER TABLE "ObjectifPeriod" ADD CONSTRAINT "ObjectifPeriod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    ALTER TABLE "ObjectifPeriod" DROP COLUMN IF EXISTS "start";
    ALTER TABLE "ObjectifPeriod" DROP COLUMN IF EXISTS "end";
  END IF;
END $$;

-- CreateTable Objectifsprospects
CREATE TABLE IF NOT EXISTS "Objectifsprospects" (
    "id" TEXT NOT NULL,
    "objectif_cible" TEXT NOT NULL,
    "objectif_reel_atteint" TEXT NOT NULL,
    "objectif_pourcentage_atteint" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "objectifPeriodId" TEXT NOT NULL,

    CONSTRAINT "Objectifsprospects_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Objectifsprospects_userId_idx" ON "Objectifsprospects"("userId");
CREATE INDEX IF NOT EXISTS "Objectifsprospects_objectifPeriodId_idx" ON "Objectifsprospects"("objectifPeriodId");

ALTER TABLE "Objectifsprospects" ADD CONSTRAINT "Objectifsprospects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Objectifsprospects" ADD CONSTRAINT "Objectifsprospects_objectifPeriodId_fkey" FOREIGN KEY ("objectifPeriodId") REFERENCES "ObjectifPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable Objectifsvehicules
CREATE TABLE IF NOT EXISTS "Objectifsvehicules" (
    "id" TEXT NOT NULL,
    "objectif_cible" TEXT NOT NULL,
    "objectif_reel_atteint" TEXT,
    "objectif_pourcentage_atteint" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "objectifPeriodId" TEXT NOT NULL,

    CONSTRAINT "Objectifsvehicules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Objectifsvehicules_userId_idx" ON "Objectifsvehicules"("userId");
CREATE INDEX IF NOT EXISTS "Objectifsvehicules_objectifPeriodId_idx" ON "Objectifsvehicules"("objectifPeriodId");

ALTER TABLE "Objectifsvehicules" ADD CONSTRAINT "Objectifsvehicules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Objectifsvehicules" ADD CONSTRAINT "Objectifsvehicules_objectifPeriodId_fkey" FOREIGN KEY ("objectifPeriodId") REFERENCES "ObjectifPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable Objectifsfinancieres
CREATE TABLE IF NOT EXISTS "Objectifsfinancieres" (
    "id" TEXT NOT NULL,
    "objectif_cible" TEXT NOT NULL,
    "objectif_reel_atteint" TEXT,
    "objectif_pourcentage_atteint" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "objectifPeriodId" TEXT NOT NULL,

    CONSTRAINT "Objectifsfinancieres_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Objectifsfinancieres_userId_idx" ON "Objectifsfinancieres"("userId");
CREATE INDEX IF NOT EXISTS "Objectifsfinancieres_objectifPeriodId_idx" ON "Objectifsfinancieres"("objectifPeriodId");

ALTER TABLE "Objectifsfinancieres" ADD CONSTRAINT "Objectifsfinancieres_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Objectifsfinancieres" ADD CONSTRAINT "Objectifsfinancieres_objectifPeriodId_fkey" FOREIGN KEY ("objectifPeriodId") REFERENCES "ObjectifPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
