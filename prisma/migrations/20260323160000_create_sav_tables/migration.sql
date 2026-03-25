-- CreateEnum (idempotent: DB may already have these types from a prior attempt)
DO $$ BEGIN
    CREATE TYPE "public"."StatutVoitureSAV" AS ENUM ('ARRIVE', 'EN_TRAITEMENT', 'TESTE', 'TERMINE', 'ANNULE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."StatutReparation" AS ENUM ('EN_ATTENTE', 'EN_TRAITEMENT', 'TESTE', 'TERMINE', 'ANNULE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."ClientSAV" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT,
    "contact" TEXT NOT NULL,
    "entreprise" TEXT,
    "localisation" TEXT,
    "secteur_activite" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSAV_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."CatergorieDiagnostic" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatergorieDiagnostic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."VoitureSAV" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "motorisation" "public"."Motorisation" NOT NULL,
    "transmission" "public"."Transmission" NOT NULL,
    "couleur" TEXT NOT NULL,
    "nbr_portes" TEXT NOT NULL,
    "immatriculation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "statut" "public"."StatutVoitureSAV" NOT NULL DEFAULT 'ARRIVE',
    "voitureId" TEXT NOT NULL,
    "clientSAVId" TEXT NOT NULL,

    CONSTRAINT "VoitureSAV_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."DiagnosticArrivee" (
    "id" TEXT NOT NULL,
    "voitureSAVId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "catergorieDiagnosticId" TEXT NOT NULL,

    CONSTRAINT "DiagnosticArrivee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."Reparation" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "prix_unitaire" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voitureSAVId" TEXT NOT NULL,
    "statut" "public"."StatutReparation" NOT NULL DEFAULT 'EN_ATTENTE',

    CONSTRAINT "Reparation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."DetailDiagnostic" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "prix_unitaire" DECIMAL(18,2) DEFAULT 0,
    "diagnosticArriveeId" TEXT,
    "reparationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "catergorieDiagnosticId" TEXT NOT NULL,

    CONSTRAINT "DetailDiagnostic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."PieceSAV" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "prix_unitaire" DECIMAL(18,2) DEFAULT 0,
    "quantite_sortie" INTEGER NOT NULL DEFAULT 0,
    "quantite_entree" INTEGER NOT NULL DEFAULT 0,
    "quantite_restante" INTEGER NOT NULL DEFAULT 0,
    "reparationId" TEXT,
    "voitureSAVId" TEXT NOT NULL,
    "diagnosticArriveeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PieceSAV_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey (idempotent: constraints may already exist)
DO $$ BEGIN
    ALTER TABLE "public"."VoitureSAV" ADD CONSTRAINT "VoitureSAV_voitureId_fkey" FOREIGN KEY ("voitureId") REFERENCES "public"."Voiture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."VoitureSAV" ADD CONSTRAINT "VoitureSAV_clientSAVId_fkey" FOREIGN KEY ("clientSAVId") REFERENCES "public"."ClientSAV"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."DiagnosticArrivee" ADD CONSTRAINT "DiagnosticArrivee_voitureSAVId_fkey" FOREIGN KEY ("voitureSAVId") REFERENCES "public"."VoitureSAV"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."DiagnosticArrivee" ADD CONSTRAINT "DiagnosticArrivee_catergorieDiagnosticId_fkey" FOREIGN KEY ("catergorieDiagnosticId") REFERENCES "public"."CatergorieDiagnostic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."Reparation" ADD CONSTRAINT "Reparation_voitureSAVId_fkey" FOREIGN KEY ("voitureSAVId") REFERENCES "public"."VoitureSAV"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."DetailDiagnostic" ADD CONSTRAINT "DetailDiagnostic_diagnosticArriveeId_fkey" FOREIGN KEY ("diagnosticArriveeId") REFERENCES "public"."DiagnosticArrivee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."DetailDiagnostic" ADD CONSTRAINT "DetailDiagnostic_reparationId_fkey" FOREIGN KEY ("reparationId") REFERENCES "public"."Reparation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."DetailDiagnostic" ADD CONSTRAINT "DetailDiagnostic_catergorieDiagnosticId_fkey" FOREIGN KEY ("catergorieDiagnosticId") REFERENCES "public"."CatergorieDiagnostic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."PieceSAV" ADD CONSTRAINT "PieceSAV_reparationId_fkey" FOREIGN KEY ("reparationId") REFERENCES "public"."Reparation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."PieceSAV" ADD CONSTRAINT "PieceSAV_voitureSAVId_fkey" FOREIGN KEY ("voitureSAVId") REFERENCES "public"."VoitureSAV"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."PieceSAV" ADD CONSTRAINT "PieceSAV_diagnosticArriveeId_fkey" FOREIGN KEY ("diagnosticArriveeId") REFERENCES "public"."DiagnosticArrivee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
