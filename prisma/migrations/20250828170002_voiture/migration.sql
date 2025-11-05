/*
  Warnings:

  - The values [PROPOSITION,VALIDE,TRANSITE,ARRIVE] on the enum `Etape` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Etape_new" AS ENUM ('VERIF_PIECES', 'STOCK', 'MONTAGE', 'TESTE', 'CORRECTION', 'PARKING', 'LIVREE', 'VENTE');
ALTER TABLE "public"."Voiture" ALTER COLUMN "etape" TYPE "public"."Etape_new" USING ("etape"::text::"public"."Etape_new");
ALTER TYPE "public"."Etape" RENAME TO "Etape_old";
ALTER TYPE "public"."Etape_new" RENAME TO "Etape";
DROP TYPE "public"."Etape_old";
COMMIT;
