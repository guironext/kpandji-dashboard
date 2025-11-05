-- AlterTable
ALTER TABLE "public"."Tableau_chute" ADD COLUMN     "voitureId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Tableau_chute" ADD CONSTRAINT "Tableau_chute_voitureId_fkey" FOREIGN KEY ("voitureId") REFERENCES "public"."Voiture"("id") ON DELETE SET NULL ON UPDATE CASCADE;
