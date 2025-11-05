/*
  Warnings:

  - The values [DECHERGE] on the enum `EtapeConteneur` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "public"."EtapeCommande" ADD VALUE 'DECHARGE';

-- AlterEnum
BEGIN;
CREATE TYPE "public"."EtapeConteneur_new" AS ENUM ('EN_ATTENTE', 'CHARGE', 'TRANSITE', 'RENSEIGNE', 'ARRIVE', 'DECHARGE', 'VERIFIE');
ALTER TABLE "public"."Conteneur" ALTER COLUMN "etapeConteneur" DROP DEFAULT;
ALTER TABLE "public"."Conteneur" ALTER COLUMN "etapeConteneur" TYPE "public"."EtapeConteneur_new" USING ("etapeConteneur"::text::"public"."EtapeConteneur_new");
ALTER TYPE "public"."EtapeConteneur" RENAME TO "EtapeConteneur_old";
ALTER TYPE "public"."EtapeConteneur_new" RENAME TO "EtapeConteneur";
DROP TYPE "public"."EtapeConteneur_old";
ALTER TABLE "public"."Conteneur" ALTER COLUMN "etapeConteneur" SET DEFAULT 'EN_ATTENTE';
COMMIT;

-- AlterEnum
ALTER TYPE "public"."EtapeSparePart" ADD VALUE 'DECHARGE';

-- AlterEnum
ALTER TYPE "public"."EtapeTool" ADD VALUE 'DECHARGE';
