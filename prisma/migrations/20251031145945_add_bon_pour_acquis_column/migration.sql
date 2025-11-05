-- AlterTable
-- Add bon_pour_acquis column to Facture table with default value false
ALTER TABLE "public"."Facture" ADD COLUMN IF NOT EXISTS "bon_pour_acquis" BOOLEAN NOT NULL DEFAULT false;
