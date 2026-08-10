-- AlterTable
-- Rename and add RapportRendezVous objet fields:
-- presentation_gamme -> Com_Pres, essai_vehicule -> Com_Drive, negociation_commerciale -> Com_Achat,
-- livraison_vehicule -> Com_Livre, service_apres_vente -> Com_APV
-- Add new: Com_Office, Com_Close

-- Step 1: Add new columns
ALTER TABLE "RapportRendezVous" ADD COLUMN "Com_Pres" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RapportRendezVous" ADD COLUMN "Com_Drive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RapportRendezVous" ADD COLUMN "Com_Achat" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RapportRendezVous" ADD COLUMN "Com_Livre" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RapportRendezVous" ADD COLUMN "Com_APV" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RapportRendezVous" ADD COLUMN "Com_Office" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RapportRendezVous" ADD COLUMN "Com_Close" BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Copy data from old columns to new
UPDATE "RapportRendezVous" SET "Com_Pres" = "presentation_gamme";
UPDATE "RapportRendezVous" SET "Com_Drive" = "essai_vehicule";
UPDATE "RapportRendezVous" SET "Com_Achat" = "negociation_commerciale";
UPDATE "RapportRendezVous" SET "Com_Livre" = "livraison_vehicule";
UPDATE "RapportRendezVous" SET "Com_APV" = "service_apres_vente";

-- Step 3: Drop old columns
ALTER TABLE "RapportRendezVous" DROP COLUMN "presentation_gamme";
ALTER TABLE "RapportRendezVous" DROP COLUMN "essai_vehicule";
ALTER TABLE "RapportRendezVous" DROP COLUMN "negociation_commerciale";
ALTER TABLE "RapportRendezVous" DROP COLUMN "livraison_vehicule";
ALTER TABLE "RapportRendezVous" DROP COLUMN "service_apres_vente";
