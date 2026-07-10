-- CreateEnum
CREATE TYPE "StatutCheckListSAV" AS ENUM ('BROUILLON', 'VALIDE', 'ARCHIVE');

-- CreateTable
CREATE TABLE "CheckListsSAV" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL DEFAULT 'Check-list de réception et de contrôle du véhicule',
    "statut" "StatutCheckListSAV" NOT NULL DEFAULT 'BROUILLON',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numeroOrdreReparation" TEXT,
    "nomClient" TEXT,
    "telephone" TEXT,
    "marque" TEXT,
    "modele" TEXT,
    "immatriculation" TEXT,
    "numeroChassis" TEXT,
    "kilometrage" INTEGER,
    "niveauCarburant" TEXT,
    "pareBrise" BOOLEAN NOT NULL DEFAULT false,
    "vitresLaterales" BOOLEAN NOT NULL DEFAULT false,
    "lunetteArriere" BOOLEAN NOT NULL DEFAULT false,
    "capot" BOOLEAN NOT NULL DEFAULT false,
    "pareChocsAvant" BOOLEAN NOT NULL DEFAULT false,
    "pareChocsArriere" BOOLEAN NOT NULL DEFAULT false,
    "ailesAvant" BOOLEAN NOT NULL DEFAULT false,
    "ailesArriere" BOOLEAN NOT NULL DEFAULT false,
    "portes" BOOLEAN NOT NULL DEFAULT false,
    "toit" BOOLEAN NOT NULL DEFAULT false,
    "coffre" BOOLEAN NOT NULL DEFAULT false,
    "retroviseurs" BOOLEAN NOT NULL DEFAULT false,
    "essuieGlaces" BOOLEAN NOT NULL DEFAULT false,
    "eclairageAvantArriere" BOOLEAN NOT NULL DEFAULT false,
    "plaquesImmatriculation" BOOLEAN NOT NULL DEFAULT false,
    "pressionCorrecte" BOOLEAN NOT NULL DEFAULT false,
    "usureReguliere" BOOLEAN NOT NULL DEFAULT false,
    "roueSecoursPresente" BOOLEAN NOT NULL DEFAULT false,
    "cricPresent" BOOLEAN NOT NULL DEFAULT false,
    "cleRouePresente" BOOLEAN NOT NULL DEFAULT false,
    "niveauHuileMoteur" BOOLEAN NOT NULL DEFAULT false,
    "liquideRefroidissement" BOOLEAN NOT NULL DEFAULT false,
    "liquideFrein" BOOLEAN NOT NULL DEFAULT false,
    "liquideDirectionAssistee" BOOLEAN NOT NULL DEFAULT false,
    "liquideLaveGlace" BOOLEAN NOT NULL DEFAULT false,
    "batterie" BOOLEAN NOT NULL DEFAULT false,
    "courroies" BOOLEAN NOT NULL DEFAULT false,
    "absenceFuite" BOOLEAN NOT NULL DEFAULT false,
    "tableauBord" BOOLEAN NOT NULL DEFAULT false,
    "temoinsAllumes" BOOLEAN NOT NULL DEFAULT false,
    "climatisation" BOOLEAN NOT NULL DEFAULT false,
    "chauffage" BOOLEAN NOT NULL DEFAULT false,
    "klaxon" BOOLEAN NOT NULL DEFAULT false,
    "ceinturesSecurite" BOOLEAN NOT NULL DEFAULT false,
    "sieges" BOOLEAN NOT NULL DEFAULT false,
    "leveVitres" BOOLEAN NOT NULL DEFAULT false,
    "verrouillageCentralise" BOOLEAN NOT NULL DEFAULT false,
    "autoradio" BOOLEAN NOT NULL DEFAULT false,
    "feuxPosition" BOOLEAN NOT NULL DEFAULT false,
    "feuxCroisement" BOOLEAN NOT NULL DEFAULT false,
    "feuxRoute" BOOLEAN NOT NULL DEFAULT false,
    "clignotants" BOOLEAN NOT NULL DEFAULT false,
    "feuxStop" BOOLEAN NOT NULL DEFAULT false,
    "feuxRecul" BOOLEAN NOT NULL DEFAULT false,
    "feuxAntibrouillard" BOOLEAN NOT NULL DEFAULT false,
    "controleMoteur" BOOLEAN NOT NULL DEFAULT false,
    "controleEmbrayage" BOOLEAN NOT NULL DEFAULT false,
    "controleBoiteVitesses" BOOLEAN NOT NULL DEFAULT false,
    "controleDirection" BOOLEAN NOT NULL DEFAULT false,
    "controleSuspension" BOOLEAN NOT NULL DEFAULT false,
    "controleFreinage" BOOLEAN NOT NULL DEFAULT false,
    "controleTransmission" BOOLEAN NOT NULL DEFAULT false,
    "demarrageNormal" BOOLEAN NOT NULL DEFAULT false,
    "accelerationCorrecte" BOOLEAN NOT NULL DEFAULT false,
    "freinageEfficace" BOOLEAN NOT NULL DEFAULT false,
    "directionStable" BOOLEAN NOT NULL DEFAULT false,
    "absenceVibrations" BOOLEAN NOT NULL DEFAULT false,
    "absenceBruitAnormal" BOOLEAN NOT NULL DEFAULT false,
    "cle1" BOOLEAN NOT NULL DEFAULT false,
    "cle2" BOOLEAN NOT NULL DEFAULT false,
    "carteGrise" BOOLEAN NOT NULL DEFAULT false,
    "accessoireRoueSecours" BOOLEAN NOT NULL DEFAULT false,
    "accessoireCric" BOOLEAN NOT NULL DEFAULT false,
    "trousseOutils" BOOLEAN NOT NULL DEFAULT false,
    "giletSecurite" BOOLEAN NOT NULL DEFAULT false,
    "triangleSignalisation" BOOLEAN NOT NULL DEFAULT false,
    "observations" TEXT,
    "voitureSAVId" TEXT NOT NULL,
    "redacteurId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckListsSAV_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckListsSAV_voitureSAVId_idx" ON "CheckListsSAV"("voitureSAVId");

-- CreateIndex
CREATE INDEX "CheckListsSAV_statut_idx" ON "CheckListsSAV"("statut");

-- AddForeignKey
ALTER TABLE "CheckListsSAV" ADD CONSTRAINT "CheckListsSAV_voitureSAVId_fkey" FOREIGN KEY ("voitureSAVId") REFERENCES "VoitureSAV"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckListsSAV" ADD CONSTRAINT "CheckListsSAV_redacteurId_fkey" FOREIGN KEY ("redacteurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
