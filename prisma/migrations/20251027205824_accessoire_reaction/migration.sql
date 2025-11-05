/*
  Warnings:

  - You are about to drop the column `description` on the `Accessoire` table. All the data in the column will be lost.
  - You are about to drop the column `prix` on the `Accessoire` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Accessoire` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Accessoire" DROP COLUMN "description",
DROP COLUMN "prix",
DROP COLUMN "quantity",
ADD COLUMN     "image" TEXT;
