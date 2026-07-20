-- Projet ponctuel module (baseline for shadow DB / fresh environments).
-- Uses IF NOT EXISTS so this is safe when tables already exist in production.

DO $$ BEGIN
  CREATE TYPE "TypeDocumentProjetPonctuel" AS ENUM (
    'DOCUMENTATION',
    'MEMOIRE',
    'REPORT',
    'PRESENTATION',
    'AUTRE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatutProjetPonctuel" AS ENUM (
    'EN_ATTENTE',
    'EN_COURS',
    'TERMINEE',
    'ANNULE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatutProjetPonctuelActivite" AS ENUM (
    'EN_ATTENTE',
    'EN_COURS',
    'EN_ATTENTE_VALIDATION',
    'VALIDEE',
    'NON_VALIDEE',
    'TRANSFEREE',
    'TERMINEE',
    'ANNULE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TypeMessageProjetPonctuelActivite" AS ENUM (
    'EN_ATTENTE',
    'LU',
    'NON_LU',
    'REPONDU',
    'SUPPRIME'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ProjetPonctuel" (
  "id" TEXT NOT NULL,
  "titre" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "dateDebut" TIMESTAMP(3) NOT NULL,
  "dateCloture" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  "statutProjet" "StatutProjetPonctuel" NOT NULL,

  CONSTRAINT "ProjetPonctuel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProjetPonctuelActivite" (
  "id" TEXT NOT NULL,
  "titre" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "dateDebut" TIMESTAMP(3) NOT NULL,
  "dateCloture" TIMESTAMP(3),
  "statutActivite" "StatutProjetPonctuelActivite" NOT NULL DEFAULT 'EN_ATTENTE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  "projetPonctuelId" TEXT NOT NULL,

  CONSTRAINT "ProjetPonctuelActivite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProjetPonctuelActiviteMessage" (
  "id" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "typeMessage" "TypeMessageProjetPonctuelActivite" NOT NULL,
  "userId" TEXT NOT NULL,
  "projetPonctuelActiviteId" TEXT NOT NULL,

  CONSTRAINT "ProjetPonctuelActiviteMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProjetPonctuelDocument" (
  "id" TEXT NOT NULL,
  "nom" TEXT NOT NULL,
  "typeDocument" "TypeDocumentProjetPonctuel" NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  "projetPonctuelActiviteId" TEXT NOT NULL,

  CONSTRAINT "ProjetPonctuelDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProjetPonctuelResponsable" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projetPonctuelId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "projetPonctuelActiviteId" TEXT NOT NULL,

  CONSTRAINT "ProjetPonctuelResponsable_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "ProjetPonctuel"
  ADD CONSTRAINT "ProjetPonctuel_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProjetPonctuelActivite"
  ADD CONSTRAINT "ProjetPonctuelActivite_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProjetPonctuelActivite"
  ADD CONSTRAINT "ProjetPonctuelActivite_projetPonctuelId_fkey"
  FOREIGN KEY ("projetPonctuelId") REFERENCES "ProjetPonctuel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProjetPonctuelActiviteMessage"
  ADD CONSTRAINT "ProjetPonctuelActiviteMessage_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProjetPonctuelActiviteMessage"
  ADD CONSTRAINT "ProjetPonctuelActiviteMessage_projetPonctuelActiviteId_fkey"
  FOREIGN KEY ("projetPonctuelActiviteId") REFERENCES "ProjetPonctuelActivite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProjetPonctuelDocument"
  ADD CONSTRAINT "ProjetPonctuelDocument_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProjetPonctuelDocument"
  ADD CONSTRAINT "ProjetPonctuelDocument_projetPonctuelActiviteId_fkey"
  FOREIGN KEY ("projetPonctuelActiviteId") REFERENCES "ProjetPonctuelActivite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProjetPonctuelResponsable"
  ADD CONSTRAINT "ProjetPonctuelResponsable_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProjetPonctuelResponsable"
  ADD CONSTRAINT "ProjetPonctuelResponsable_projetPonctuelId_fkey"
  FOREIGN KEY ("projetPonctuelId") REFERENCES "ProjetPonctuel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProjetPonctuelResponsable"
  ADD CONSTRAINT "ProjetPonctuelResponsable_projetPonctuelActiviteId_fkey"
  FOREIGN KEY ("projetPonctuelActiviteId") REFERENCES "ProjetPonctuelActivite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
