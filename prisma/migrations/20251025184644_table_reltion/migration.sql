/*
  Warnings:

  - Added the required column `rapportRendezVousId` to the `Tableau_chute` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Tableau_chute" ADD COLUMN     "rapportRendezVousId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Tableau_chute" ADD CONSTRAINT "Tableau_chute_rapportRendezVousId_fkey" FOREIGN KEY ("rapportRendezVousId") REFERENCES "public"."RapportRendezVous"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
