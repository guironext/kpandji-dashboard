/*
  Warnings:

  - You are about to drop the column `duree` on the `RendezVous` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."StatusFacture" AS ENUM ('EN_ATTENTE', 'PROFORMA', 'FACTURE', 'PAYEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "public"."ModePaiement" AS ENUM ('CB', 'CHEQUE', 'VIREMENT');

-- CreateEnum
CREATE TYPE "public"."StatusPaiement" AS ENUM ('EN_ATTENTE', 'PAYE', 'ANNULE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."RendezVousStatut" ADD VALUE 'DEPLACE';
ALTER TYPE "public"."RendezVousStatut" ADD VALUE 'EFFECTUE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."StatusClient" ADD VALUE 'FAVORABLE';
ALTER TYPE "public"."StatusClient" ADD VALUE 'A_SUIVRE';

-- DropForeignKey
ALTER TABLE "public"."Client" DROP CONSTRAINT "Client_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Commande" DROP CONSTRAINT "Commande_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RendezVous" DROP CONSTRAINT "RendezVous_clientId_fkey";

-- AlterTable
ALTER TABLE "public"."Commande" ADD COLUMN     "clientEntrepriseId" TEXT,
ADD COLUMN     "factureId" TEXT,
ADD COLUMN     "prix_unitaire" DECIMAL(65,30),
ALTER COLUMN "clientId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."RendezVous" DROP COLUMN "duree",
ADD COLUMN     "clientEntrepriseId" TEXT,
ALTER COLUMN "clientId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "telephone" TEXT;

-- AlterTable
ALTER TABLE "public"."Voiture" ADD COLUMN     "clientEntrepriseId" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "rendezVousId" TEXT;

-- AlterTable
ALTER TABLE "public"."VoitureModel" ADD COLUMN     "description" TEXT,
ADD COLUMN     "image" TEXT;

-- CreateTable
CREATE TABLE "public"."Client_entreprise" (
    "id" TEXT NOT NULL,
    "nom_entreprise" TEXT NOT NULL,
    "sigle" TEXT,
    "email" TEXT,
    "telephone" TEXT NOT NULL,
    "nom_personne_contact" TEXT,
    "fonction_personne_contact" TEXT,
    "email_personne_contact" TEXT,
    "telephone_personne_contact" TEXT,
    "localisation" TEXT,
    "secteur_activite" TEXT,
    "flotte_vehicules" BOOLEAN,
    "flotte_vehicules_description" TEXT,
    "status_client" "public"."StatusClient" NOT NULL DEFAULT 'PROSPECT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "commercial" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Client_entreprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RapportRendezVous" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "date_rendez_vous" TIMESTAMP(3) NOT NULL,
    "heure_rendez_vous" TEXT NOT NULL,
    "lieu_rendez_vous" TEXT NOT NULL,
    "lieu_autre" TEXT,
    "conseiller_commercial" TEXT NOT NULL,
    "duree_rendez_vous" TEXT NOT NULL,
    "nom_prenom_client" TEXT NOT NULL,
    "telephone_client" TEXT NOT NULL,
    "email_client" TEXT,
    "profession_societe" TEXT,
    "type_client" TEXT NOT NULL,
    "presentation_gamme" BOOLEAN NOT NULL DEFAULT false,
    "essai_vehicule" BOOLEAN NOT NULL DEFAULT false,
    "negociation_commerciale" BOOLEAN NOT NULL DEFAULT false,
    "livraison_vehicule" BOOLEAN NOT NULL DEFAULT false,
    "service_apres_vente" BOOLEAN NOT NULL DEFAULT false,
    "objet_autre" TEXT,
    "modeles_discutes" JSONB,
    "motivations_achat" TEXT,
    "points_positifs" TEXT,
    "objections_freins" TEXT,
    "degre_interet" TEXT,
    "decision_attendue" TEXT,
    "devis_offre_remise" BOOLEAN NOT NULL DEFAULT false,
    "reference_offre" TEXT,
    "financement_propose" TEXT,
    "assurance_entretien" BOOLEAN NOT NULL DEFAULT false,
    "reprise_ancien_vehicule" BOOLEAN NOT NULL DEFAULT false,
    "actions_suivi" JSONB,
    "commentaire_global" TEXT,
    "voitureId" TEXT,
    "rendezVousId" TEXT NOT NULL,
    "clientId" TEXT,
    "clientEntrepriseId" TEXT,

    CONSTRAINT "RapportRendezVous_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Facture" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT,
    "clientEntrepriseId" TEXT,
    "userId" TEXT NOT NULL,
    "date_facture" TIMESTAMP(3) NOT NULL,
    "date_echeance" TIMESTAMP(3) NOT NULL,
    "status_facture" "public"."StatusFacture" NOT NULL DEFAULT 'EN_ATTENTE',
    "voitureId" TEXT,
    "nbr_voiture_commande" INTEGER NOT NULL,
    "prix_unitaire" DECIMAL(65,30) NOT NULL,
    "montant_ht" DECIMAL(65,30) NOT NULL,
    "total_ht" DECIMAL(65,30) NOT NULL,
    "remise" DECIMAL(65,30) NOT NULL,
    "montant_remise" DECIMAL(65,30) NOT NULL,
    "montant_net_ht" DECIMAL(65,30) NOT NULL,
    "tva" DECIMAL(65,30) NOT NULL,
    "montant_tva" DECIMAL(65,30) NOT NULL,
    "total_ttc" DECIMAL(65,30) NOT NULL,
    "avance_payee" DECIMAL(65,30) NOT NULL,
    "reste_payer" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Facture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FactureLigne" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "factureId" TEXT NOT NULL,
    "voitureModelId" TEXT NOT NULL,
    "couleur" TEXT NOT NULL,
    "nbr_voiture" INTEGER NOT NULL,
    "prix_unitaire" DECIMAL(65,30) NOT NULL,
    "montant_ligne" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "FactureLigne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Paiement" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "factureId" TEXT NOT NULL,
    "clientId" TEXT,
    "clientEntrepriseId" TEXT,
    "userId" TEXT NOT NULL,
    "avance_payee" DECIMAL(65,30) NOT NULL,
    "reste_payer" DECIMAL(65,30) NOT NULL,
    "date_paiement" TIMESTAMP(3) NOT NULL,
    "mode_paiement" "public"."ModePaiement" NOT NULL,
    "status_paiement" "public"."StatusPaiement" NOT NULL DEFAULT 'EN_ATTENTE',

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tableau_chute" (
    "id" TEXT NOT NULL,
    "mois_chute" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rapportRendezVousId" TEXT NOT NULL,
    "clientId" TEXT,
    "clientEntrepriseId" TEXT,
    "voitureId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Tableau_chute_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Client_entreprise" ADD CONSTRAINT "Client_entreprise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RendezVous" ADD CONSTRAINT "RendezVous_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RendezVous" ADD CONSTRAINT "RendezVous_clientEntrepriseId_fkey" FOREIGN KEY ("clientEntrepriseId") REFERENCES "public"."Client_entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RapportRendezVous" ADD CONSTRAINT "RapportRendezVous_voitureId_fkey" FOREIGN KEY ("voitureId") REFERENCES "public"."Voiture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RapportRendezVous" ADD CONSTRAINT "RapportRendezVous_rendezVousId_fkey" FOREIGN KEY ("rendezVousId") REFERENCES "public"."RendezVous"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RapportRendezVous" ADD CONSTRAINT "RapportRendezVous_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RapportRendezVous" ADD CONSTRAINT "RapportRendezVous_clientEntrepriseId_fkey" FOREIGN KEY ("clientEntrepriseId") REFERENCES "public"."Client_entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Voiture" ADD CONSTRAINT "Voiture_rendezVousId_fkey" FOREIGN KEY ("rendezVousId") REFERENCES "public"."RendezVous"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Voiture" ADD CONSTRAINT "Voiture_clientEntrepriseId_fkey" FOREIGN KEY ("clientEntrepriseId") REFERENCES "public"."Client_entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Facture" ADD CONSTRAINT "Facture_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Facture" ADD CONSTRAINT "Facture_clientEntrepriseId_fkey" FOREIGN KEY ("clientEntrepriseId") REFERENCES "public"."Client_entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Facture" ADD CONSTRAINT "Facture_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Facture" ADD CONSTRAINT "Facture_voitureId_fkey" FOREIGN KEY ("voitureId") REFERENCES "public"."Voiture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FactureLigne" ADD CONSTRAINT "FactureLigne_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "public"."Facture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FactureLigne" ADD CONSTRAINT "FactureLigne_voitureModelId_fkey" FOREIGN KEY ("voitureModelId") REFERENCES "public"."VoitureModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Paiement" ADD CONSTRAINT "Paiement_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "public"."Facture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Paiement" ADD CONSTRAINT "Paiement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Paiement" ADD CONSTRAINT "Paiement_clientEntrepriseId_fkey" FOREIGN KEY ("clientEntrepriseId") REFERENCES "public"."Client_entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Paiement" ADD CONSTRAINT "Paiement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tableau_chute" ADD CONSTRAINT "Tableau_chute_rapportRendezVousId_fkey" FOREIGN KEY ("rapportRendezVousId") REFERENCES "public"."RapportRendezVous"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tableau_chute" ADD CONSTRAINT "Tableau_chute_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tableau_chute" ADD CONSTRAINT "Tableau_chute_clientEntrepriseId_fkey" FOREIGN KEY ("clientEntrepriseId") REFERENCES "public"."Client_entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tableau_chute" ADD CONSTRAINT "Tableau_chute_voitureId_fkey" FOREIGN KEY ("voitureId") REFERENCES "public"."Voiture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tableau_chute" ADD CONSTRAINT "Tableau_chute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commande" ADD CONSTRAINT "Commande_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "public"."Facture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commande" ADD CONSTRAINT "Commande_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commande" ADD CONSTRAINT "Commande_clientEntrepriseId_fkey" FOREIGN KEY ("clientEntrepriseId") REFERENCES "public"."Client_entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
