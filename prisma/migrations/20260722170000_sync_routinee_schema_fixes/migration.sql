-- Sync routinee schema with prisma/schema.prisma

-- DropForeignKey
ALTER TABLE "ActiviteProjetRoutine" DROP CONSTRAINT IF EXISTS "ActiviteProjetRoutine_indicateurObjectifMensuelProjetRouti_fkey";

-- DropForeignKey
ALTER TABLE "IndicateurObjectifMensuelProjetRoutine" DROP CONSTRAINT IF EXISTS "IndicateurObjectifMensuelProjetRoutine_responsableProjetRo_fkey";

-- AlterTable
ALTER TABLE "ActiviteProjetRoutine" DROP COLUMN IF EXISTS "indicateurObjectifMensuelProjetRoutineId";

-- AlterTable
ALTER TABLE "IndicateurObjectifMensuelProjetRoutine"
DROP COLUMN IF EXISTS "responsableProjetRoutineId",
ADD COLUMN IF NOT EXISTS "description" TEXT;

ALTER TABLE "IndicateurObjectifMensuelProjetRoutine"
ALTER COLUMN "nombreObjectifsMensuelsAtteints" DROP DEFAULT,
ALTER COLUMN "nombreObjectifsMensuelsNonAtteints" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RoleMissionProjetRoutine" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- AlterTable
ALTER TABLE "TacheActiviteProjetRoutineDocument"
ADD COLUMN IF NOT EXISTS "tacheActiviteProjetRoutineId" TEXT,
ADD COLUMN IF NOT EXISTS "tacheActiviteProjetRoutineMessageId" TEXT;

-- DropEnum
DROP TYPE IF EXISTS "TypeMessageResponsableProjetRoutine";

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TacheRoutineDocument_tache_fkey'
  ) THEN
    ALTER TABLE "TacheActiviteProjetRoutineDocument"
    ADD CONSTRAINT "TacheRoutineDocument_tache_fkey"
    FOREIGN KEY ("tacheActiviteProjetRoutineId") REFERENCES "TacheActiviteProjetRoutine"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TacheRoutineDocument_message_fkey'
  ) THEN
    ALTER TABLE "TacheActiviteProjetRoutineDocument"
    ADD CONSTRAINT "TacheRoutineDocument_message_fkey"
    FOREIGN KEY ("tacheActiviteProjetRoutineMessageId") REFERENCES "TacheActiviteProjetRoutineMessage"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
