/*
  Warnings:

  - You are about to drop the column `fournisseurId` on the `FournisseurCommandeLocal` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `FournisseurCommandeLocal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."FournisseurCommandeLocal" DROP COLUMN "fournisseurId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
