-- CreateTable
CREATE TABLE IF NOT EXISTS "ObjectifProjetActiviteRoutineeResponsable" (
    "id" TEXT NOT NULL,
    "objectifMensuel" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObjectifProjetActiviteRoutineeResponsable_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ObjectifProjetActiviteRoutineeResponsable_responsableId_fkey'
    ) THEN
        ALTER TABLE "ObjectifProjetActiviteRoutineeResponsable"
        ADD CONSTRAINT "ObjectifProjetActiviteRoutineeResponsable_responsableId_fkey"
        FOREIGN KEY ("responsableId") REFERENCES "ProjetActiviteRoutineeResponsable"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- DropColumn
ALTER TABLE "ProjetActiviteRoutineeResponsable" DROP COLUMN IF EXISTS "objectifMensuelAtteint";
