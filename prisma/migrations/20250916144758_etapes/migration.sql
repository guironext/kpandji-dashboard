/*
  Warnings:

  - You are about to drop the column `status` on the `SparePart` table. All the data in the column will be lost.
  - You are about to drop the column `etapeEvolution` on the `Tool` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."EtapeTool" AS ENUM ('TRANSITE', 'ARRIVE', 'VERIFIE', 'STOCKE', 'ATTRIBUE', 'USAGE', 'RETOUR');

-- CreateEnum
CREATE TYPE "public"."EtapeSparePart" AS ENUM ('TRANSITE', 'ARRIVE', 'VERIFIE', 'STOCKE', 'ATTRIBUE', 'CONSOMME', 'RETOUR');

-- AlterTable
ALTER TABLE "public"."SparePart" DROP COLUMN "status",
ADD COLUMN     "etapeSparePart" "public"."EtapeSparePart" NOT NULL DEFAULT 'TRANSITE';

-- AlterTable
ALTER TABLE "public"."Tool" DROP COLUMN "etapeEvolution",
ADD COLUMN     "etapeTool" "public"."EtapeTool" NOT NULL DEFAULT 'TRANSITE';
