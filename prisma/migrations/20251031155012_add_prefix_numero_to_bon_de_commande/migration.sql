-- AlterTable
ALTER TABLE "public"."BonDeCommande" ADD COLUMN "prefix_numero" TEXT DEFAULT '';
ALTER TABLE "public"."BonDeCommande" ALTER COLUMN "prefix_numero" SET NOT NULL;
