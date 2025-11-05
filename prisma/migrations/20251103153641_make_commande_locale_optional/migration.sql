/*
  Warnings:

  - You are about to drop the `_CommandeLocalToFournisseurCommandeLocal` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `fournisseurId` to the `FournisseurCommandeLocal` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."_CommandeLocalToFournisseurCommandeLocal" DROP CONSTRAINT "_CommandeLocalToFournisseurCommandeLocal_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_CommandeLocalToFournisseurCommandeLocal" DROP CONSTRAINT "_CommandeLocalToFournisseurCommandeLocal_B_fkey";

-- AlterTable
ALTER TABLE "public"."FournisseurCommandeLocal" ADD COLUMN     "commandeLocalId" TEXT,
ADD COLUMN     "fournisseurId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."_CommandeLocalToFournisseurCommandeLocal";

-- AddForeignKey
ALTER TABLE "public"."FournisseurCommandeLocal" ADD CONSTRAINT "FournisseurCommandeLocal_commandeLocalId_fkey" FOREIGN KEY ("commandeLocalId") REFERENCES "public"."CommandeLocal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FournisseurCommandeLocal" ADD CONSTRAINT "FournisseurCommandeLocal_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "public"."Fournisseur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
