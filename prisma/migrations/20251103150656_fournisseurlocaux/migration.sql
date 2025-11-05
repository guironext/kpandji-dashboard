/*
  Warnings:

  - You are about to drop the column `commandeLocalId` on the `FournisseurCommandeLocal` table. All the data in the column will be lost.
  - You are about to drop the column `fournisseurId` on the `FournisseurCommandeLocal` table. All the data in the column will be lost.
  - You are about to drop the `_CommandeLocalToFournisseur` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."FournisseurCommandeLocal" DROP CONSTRAINT "FournisseurCommandeLocal_commandeLocalId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FournisseurCommandeLocal" DROP CONSTRAINT "FournisseurCommandeLocal_fournisseurId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_CommandeLocalToFournisseur" DROP CONSTRAINT "_CommandeLocalToFournisseur_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_CommandeLocalToFournisseur" DROP CONSTRAINT "_CommandeLocalToFournisseur_B_fkey";

-- AlterTable
ALTER TABLE "public"."FournisseurCommandeLocal" DROP COLUMN "commandeLocalId",
DROP COLUMN "fournisseurId";

-- DropTable
DROP TABLE "public"."_CommandeLocalToFournisseur";

-- CreateTable
CREATE TABLE "public"."_CommandeLocalToFournisseurCommandeLocal" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CommandeLocalToFournisseurCommandeLocal_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CommandeLocalToFournisseurCommandeLocal_B_index" ON "public"."_CommandeLocalToFournisseurCommandeLocal"("B");

-- AddForeignKey
ALTER TABLE "public"."_CommandeLocalToFournisseurCommandeLocal" ADD CONSTRAINT "_CommandeLocalToFournisseurCommandeLocal_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."CommandeLocal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CommandeLocalToFournisseurCommandeLocal" ADD CONSTRAINT "_CommandeLocalToFournisseurCommandeLocal_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."FournisseurCommandeLocal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
