-- Validation des proformas (Facture.validationRespoCom) et demandes de décaissement (Decaissement).
-- Purement additif et idempotent : ces objets existent déjà sur la base Neon actuelle
-- (créés hors migrations), donc sur cette base il faut marquer la migration comme appliquée :
--   npx prisma migrate resolve --applied <nom_du_dossier>
-- Sur une base neuve, elle crée les objets normalement.

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ValidationRespoCom" AS ENUM ('CREER', 'VALIDATION_COURS', 'VALIDATED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "Facture" ADD COLUMN IF NOT EXISTS "validationRespoCom" "ValidationRespoCom" NOT NULL DEFAULT 'CREER';

-- CreateTable
CREATE TABLE IF NOT EXISTS "Decaissement" (
    "id" TEXT NOT NULL,
    "demandeur" TEXT NOT NULL,
    "service" TEXT,
    "departement" TEXT NOT NULL,
    "raison" TEXT NOT NULL,
    "montant" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "validationDepartement" BOOLEAN NOT NULL DEFAULT false,
    "decaissementEffectues" BOOLEAN DEFAULT false,
    "montantDecaisse" TEXT,

    CONSTRAINT "Decaissement_pkey" PRIMARY KEY ("id")
);
