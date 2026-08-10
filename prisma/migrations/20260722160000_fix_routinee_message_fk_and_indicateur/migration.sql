-- Fix routinee message / indicateur relations.
-- Restored migration file (already applied to database).

-- CreateEnum
CREATE TYPE "TypeMessageResponsableProjetRoutine" AS ENUM ('EN_ATTENTE', 'LU', 'NON_LU', 'REPONDU', 'SUPPRIME');

-- AlterTable
ALTER TABLE "IndicateurObjectifMensuelProjetRoutine"
ADD COLUMN IF NOT EXISTS "responsableProjetRoutineId" TEXT;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'IndicateurObjectifMensuelProjetRoutine_responsableProjetRo_fkey'
  ) THEN
    ALTER TABLE "IndicateurObjectifMensuelProjetRoutine"
    ADD CONSTRAINT "IndicateurObjectifMensuelProjetRoutine_responsableProjetRo_fkey"
    FOREIGN KEY ("responsableProjetRoutineId") REFERENCES "ResponsableProjetRoutine"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
