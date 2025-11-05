/*
  Warnings:

  - The values [STOCKE] on the enum `EtapeSparePart` will be removed. If these variants are still used in the database, this will fail.
  - The values [STOCKE,USAGE] on the enum `EtapeTool` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."EtapeSparePart_new" AS ENUM ('TRANSITE', 'RENSEIGNE', 'ARRIVE', 'VERIFIE', 'ATTRIBUE', 'CONSOMME', 'RETOUR');
ALTER TABLE "public"."SparePart" ALTER COLUMN "etapeSparePart" DROP DEFAULT;
ALTER TABLE "public"."SparePart" ALTER COLUMN "etapeSparePart" TYPE "public"."EtapeSparePart_new" USING ("etapeSparePart"::text::"public"."EtapeSparePart_new");
ALTER TYPE "public"."EtapeSparePart" RENAME TO "EtapeSparePart_old";
ALTER TYPE "public"."EtapeSparePart_new" RENAME TO "EtapeSparePart";
DROP TYPE "public"."EtapeSparePart_old";
ALTER TABLE "public"."SparePart" ALTER COLUMN "etapeSparePart" SET DEFAULT 'TRANSITE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."EtapeTool_new" AS ENUM ('TRANSITE', 'RENSEIGNE', 'ARRIVE', 'VERIFIE', 'ATTRIBUE', 'CONSOMME', 'RETOUR');
ALTER TABLE "public"."Tool" ALTER COLUMN "etapeTool" DROP DEFAULT;
ALTER TABLE "public"."Tool" ALTER COLUMN "etapeTool" TYPE "public"."EtapeTool_new" USING ("etapeTool"::text::"public"."EtapeTool_new");
ALTER TYPE "public"."EtapeTool" RENAME TO "EtapeTool_old";
ALTER TYPE "public"."EtapeTool_new" RENAME TO "EtapeTool";
DROP TYPE "public"."EtapeTool_old";
ALTER TABLE "public"."Tool" ALTER COLUMN "etapeTool" SET DEFAULT 'TRANSITE';
COMMIT;
