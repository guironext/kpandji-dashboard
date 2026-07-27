-- Align NOT NULL constraints with Prisma schema.

ALTER TABLE "ResponsableProjetRoutine"
ALTER COLUMN "tacheActiviteProjetRoutineId" SET NOT NULL,
ALTER COLUMN "activiteProjetRoutineId" SET NOT NULL;

ALTER TABLE "TacheActiviteProjetRoutineDocument"
ALTER COLUMN "tacheActiviteProjetRoutineId" SET NOT NULL;
