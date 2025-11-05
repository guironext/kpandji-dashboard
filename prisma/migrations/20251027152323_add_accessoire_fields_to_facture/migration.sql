-- AlterTable
ALTER TABLE "public"."Facture" ADD COLUMN     "accessoire_description" TEXT,
ADD COLUMN     "accessoire_nbr" INTEGER,
ADD COLUMN     "accessoire_nom" TEXT,
ADD COLUMN     "accessoire_prix" DECIMAL(65,30),
ADD COLUMN     "accessoire_subtotal" DECIMAL(65,30);
