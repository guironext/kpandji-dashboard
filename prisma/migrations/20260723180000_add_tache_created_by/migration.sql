-- AlterTable
ALTER TABLE "TacheActiviteProjetRoutine" ADD COLUMN "createdByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "TacheActiviteProjetRoutine" ADD CONSTRAINT "TacheActiviteProjetRoutine_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
