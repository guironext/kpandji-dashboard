/*
  Warnings:

  - You are about to drop the column `rapportRendezVousId` on the `Tableau_chute` table. All the data in the column will be lost.
  - You are about to drop the column `voitureId` on the `Tableau_chute` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Tableau_chute" DROP CONSTRAINT "Tableau_chute_rapportRendezVousId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tableau_chute" DROP CONSTRAINT "Tableau_chute_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tableau_chute" DROP CONSTRAINT "Tableau_chute_voitureId_fkey";

-- AlterTable
ALTER TABLE "public"."Tableau_chute" DROP COLUMN "rapportRendezVousId",
DROP COLUMN "voitureId",
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Tableau_chute" ADD CONSTRAINT "Tableau_chute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
