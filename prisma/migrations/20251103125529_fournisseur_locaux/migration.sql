/*
  Warnings:

  - Added the required column `article` to the `CommandeLocal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `CommandeLocal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `CommandeLocal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `CommandeLocal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `CommandeLocal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."CommandeLocal" ADD COLUMN     "article" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "price" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "total" DECIMAL(65,30) NOT NULL;

-- CreateTable
CREATE TABLE "public"."FournisseurCommandeLocal" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "code_postal" TEXT,
    "pays" TEXT,
    "type_Activite" TEXT,
    "commandeLocalId" TEXT NOT NULL,
    "fournisseurId" TEXT NOT NULL,

    CONSTRAINT "FournisseurCommandeLocal_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."FournisseurCommandeLocal" ADD CONSTRAINT "FournisseurCommandeLocal_commandeLocalId_fkey" FOREIGN KEY ("commandeLocalId") REFERENCES "public"."CommandeLocal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FournisseurCommandeLocal" ADD CONSTRAINT "FournisseurCommandeLocal_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "public"."Fournisseur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
