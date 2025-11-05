/*
  Warnings:

  - The values [VERIF_PIECES] on the enum `EtapeCommande` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `etapeEvolution` on the `Conteneur` table. All the data in the column will be lost.
  - You are about to drop the column `voitureId` on the `Montage` table. All the data in the column will be lost.
  - You are about to drop the column `etape` on the `Voiture` table. All the data in the column will be lost.
  - You are about to drop the column `etat` on the `Voiture` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[montageId]` on the table `Commande` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `couleur` to the `Commande` table without a default value. This is not possible if the table is not empty.
  - Added the required column `motorisation` to the `Commande` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nbr_portes` to the `Commande` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transmission` to the `Commande` table without a default value. This is not possible if the table is not empty.
  - Made the column `etapeCommande` on table `Commande` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `etatVoiture` to the `Voiture` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."EtapeMontage" AS ENUM ('CREATION', 'VALIDE', 'EXECUTION', 'VERIFICATION', 'CORRECTION', 'TERMINEE');

-- CreateEnum
CREATE TYPE "public"."EtatVoiture" AS ENUM ('PIECES', 'MONTAGE', 'TESTE', 'PARKING', 'CORRECTION', 'VENTE', 'LIVREE');

-- CreateEnum
CREATE TYPE "public"."EtapeConteneur" AS ENUM ('EN_ATTENTE', 'CHARGE', 'TRANSITE', 'RENSEIGNE', 'ARRIVE', 'DECHERGE', 'VERIFIE');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."EtapeCommande_new" AS ENUM ('PROPOSITION', 'VALIDE', 'TRANSITE', 'RENSEIGNEE', 'ARRIVE', 'VERIFIER', 'MONTAGE', 'TESTE', 'PARKING', 'CORRECTION', 'VENTE');
ALTER TABLE "public"."Commande" ALTER COLUMN "etapeCommande" DROP DEFAULT;
ALTER TABLE "public"."Commande" ALTER COLUMN "etapeCommande" TYPE "public"."EtapeCommande_new" USING ("etapeCommande"::text::"public"."EtapeCommande_new");
ALTER TYPE "public"."EtapeCommande" RENAME TO "EtapeCommande_old";
ALTER TYPE "public"."EtapeCommande_new" RENAME TO "EtapeCommande";
DROP TYPE "public"."EtapeCommande_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Montage" DROP CONSTRAINT "Montage_voitureId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SparePart" DROP CONSTRAINT "SparePart_voitureId_fkey";

-- DropIndex
DROP INDEX "public"."Employee_userId_key";

-- AlterTable
ALTER TABLE "public"."Commande" ADD COLUMN     "commandeLocalId" TEXT,
ADD COLUMN     "couleur" TEXT NOT NULL,
ADD COLUMN     "montageId" TEXT,
ADD COLUMN     "motorisation" "public"."Motorisation" NOT NULL,
ADD COLUMN     "nbr_portes" TEXT NOT NULL,
ADD COLUMN     "transmission" "public"."Transmission" NOT NULL,
ADD COLUMN     "voitureModelId" TEXT,
ALTER COLUMN "etapeCommande" SET NOT NULL,
ALTER COLUMN "etapeCommande" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Conteneur" DROP COLUMN "etapeEvolution",
ADD COLUMN     "etapeConteneur" "public"."EtapeConteneur" NOT NULL DEFAULT 'EN_ATTENTE';

-- AlterTable
ALTER TABLE "public"."Correction" ADD COLUMN     "commandeId" TEXT;

-- AlterTable
ALTER TABLE "public"."Employee" ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "public"."Montage" DROP COLUMN "voitureId",
ADD COLUMN     "etapeMontage" "public"."EtapeMontage" NOT NULL DEFAULT 'CREATION';

-- AlterTable
ALTER TABLE "public"."SparePart" ADD COLUMN     "commandeId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
ADD COLUMN     "storageId" TEXT,
ALTER COLUMN "voitureId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Teste" ADD COLUMN     "commandeId" TEXT;

-- AlterTable
ALTER TABLE "public"."Voiture" DROP COLUMN "etape",
DROP COLUMN "etat",
ADD COLUMN     "etatVoiture" "public"."EtatVoiture" NOT NULL;

-- DropEnum
DROP TYPE "public"."Etape";

-- DropEnum
DROP TYPE "public"."Etat";

-- CreateTable
CREATE TABLE "public"."Storage" (
    "id" TEXT NOT NULL,
    "storageNumber" TEXT,
    "porte_Number" TEXT,
    "rayon" TEXT,
    "etage" TEXT,
    "caseNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Storage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MontageSparePart" (
    "id" TEXT NOT NULL,
    "qte_commandee" TEXT,
    "qte_attribue" TEXT,
    "qte_restante" TEXT,
    "equipe_montage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "montageId" TEXT NOT NULL,

    CONSTRAINT "MontageSparePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MontageSparePartAttribution" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "equipeId" TEXT NOT NULL,
    "montageSparePartId" TEXT NOT NULL,

    CONSTRAINT "MontageSparePartAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_MontageSparePartToSparePart" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MontageSparePartToSparePart_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_MontageSparePartToTool" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MontageSparePartToTool_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_MontageSparePartAttributionToSparePart" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MontageSparePartAttributionToSparePart_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_EquipeToMontageSparePart" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EquipeToMontageSparePart_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MontageSparePartToSparePart_B_index" ON "public"."_MontageSparePartToSparePart"("B");

-- CreateIndex
CREATE INDEX "_MontageSparePartToTool_B_index" ON "public"."_MontageSparePartToTool"("B");

-- CreateIndex
CREATE INDEX "_MontageSparePartAttributionToSparePart_B_index" ON "public"."_MontageSparePartAttributionToSparePart"("B");

-- CreateIndex
CREATE INDEX "_EquipeToMontageSparePart_B_index" ON "public"."_EquipeToMontageSparePart"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Commande_montageId_key" ON "public"."Commande"("montageId");

-- AddForeignKey
ALTER TABLE "public"."Commande" ADD CONSTRAINT "Commande_voitureModelId_fkey" FOREIGN KEY ("voitureModelId") REFERENCES "public"."VoitureModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commande" ADD CONSTRAINT "Commande_montageId_fkey" FOREIGN KEY ("montageId") REFERENCES "public"."Montage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commande" ADD CONSTRAINT "Commande_commandeLocalId_fkey" FOREIGN KEY ("commandeLocalId") REFERENCES "public"."CommandeLocal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SparePart" ADD CONSTRAINT "SparePart_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "public"."Commande"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SparePart" ADD CONSTRAINT "SparePart_voitureId_fkey" FOREIGN KEY ("voitureId") REFERENCES "public"."Voiture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SparePart" ADD CONSTRAINT "SparePart_storageId_fkey" FOREIGN KEY ("storageId") REFERENCES "public"."Storage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MontageSparePart" ADD CONSTRAINT "MontageSparePart_montageId_fkey" FOREIGN KEY ("montageId") REFERENCES "public"."Montage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MontageSparePartAttribution" ADD CONSTRAINT "MontageSparePartAttribution_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "public"."Equipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MontageSparePartAttribution" ADD CONSTRAINT "MontageSparePartAttribution_montageSparePartId_fkey" FOREIGN KEY ("montageSparePartId") REFERENCES "public"."MontageSparePart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Teste" ADD CONSTRAINT "Teste_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "public"."Commande"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Correction" ADD CONSTRAINT "Correction_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "public"."Commande"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MontageSparePartToSparePart" ADD CONSTRAINT "_MontageSparePartToSparePart_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."MontageSparePart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MontageSparePartToSparePart" ADD CONSTRAINT "_MontageSparePartToSparePart_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."SparePart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MontageSparePartToTool" ADD CONSTRAINT "_MontageSparePartToTool_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."MontageSparePart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MontageSparePartToTool" ADD CONSTRAINT "_MontageSparePartToTool_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MontageSparePartAttributionToSparePart" ADD CONSTRAINT "_MontageSparePartAttributionToSparePart_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."MontageSparePartAttribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MontageSparePartAttributionToSparePart" ADD CONSTRAINT "_MontageSparePartAttributionToSparePart_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."SparePart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_EquipeToMontageSparePart" ADD CONSTRAINT "_EquipeToMontageSparePart_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Equipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_EquipeToMontageSparePart" ADD CONSTRAINT "_EquipeToMontageSparePart_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."MontageSparePart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
