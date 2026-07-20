-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "StatutProjetPonctuelActivite" AS ENUM (
    'EN_ATTENTE',
    'EN_COURS',
    'EN_ATTENTE_VALIDATION',
    'VALIDEE',
    'NON_VALIDEE',
    'TRANSFEREE',
    'TERMINEE',
    'ANNULE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "ProjetPonctuelActivite"
ADD COLUMN IF NOT EXISTS "statutActivite" "StatutProjetPonctuelActivite" NOT NULL DEFAULT 'EN_ATTENTE';
