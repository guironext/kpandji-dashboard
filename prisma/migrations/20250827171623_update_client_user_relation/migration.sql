/*
  Warnings:

  - You are about to drop the column `adresse` on the `Client` table. All the data in the column will be lost.
  - Made the column `telephone` on table `Client` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Client" DROP COLUMN "adresse",
ADD COLUMN     "commercial" TEXT,
ADD COLUMN     "entreprise" TEXT,
ADD COLUMN     "localisation" TEXT,
ADD COLUMN     "secteur_activite" TEXT,
ALTER COLUMN "telephone" SET NOT NULL;
