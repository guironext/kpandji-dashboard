-- Activités routinières module (baseline for shadow DB / fresh environments).
-- Uses IF NOT EXISTS so this is safe when tables already exist in production.

DO $$ BEGIN
  CREATE TYPE "StatutActiviteProjetActiviteRoutinee" AS ENUM (
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
  CREATE TYPE "StatutTacheProjetActiviteRoutinee" AS ENUM (
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
  CREATE TYPE "TypeMessageTacheProjetActiviteRoutinee" AS ENUM (
    'EN_ATTENTE',
    'LU',
    'NON_LU',
    'REPONDU',
    'SUPPRIME'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TypeDocumentTacheProjetActiviteRoutinee" AS ENUM (
    'DOCUMENTATION',
    'MEMOIRE',
    'REPORT',
    'PRESENTATION',
    'AUTRE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ProjetActiviteRoutinee" (
  "id" TEXT NOT NULL,
  "titre" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "dateDebut" TIMESTAMP(3) NOT NULL,
  "dateCloture" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,

  CONSTRAINT "ProjetActiviteRoutinee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProjetActiviteRoutineeResponsable" (
  "id" TEXT NOT NULL,
  "roleMission" TEXT NOT NULL,
  "objectifMensuel" TEXT,
  "objectifMensuelAtteint" TEXT,
  "userId" TEXT NOT NULL,
  "projetActiviteRoutineeId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProjetActiviteRoutineeResponsable_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ActiviteProjetActiviteRoutinee" (
  "id" TEXT NOT NULL,
  "titre" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "objectifMensuel" TEXT NOT NULL,
  "objectifMensuelAtteint" TEXT NOT NULL,
  "statutActiviteProjetActiviteRoutinee" "StatutActiviteProjetActiviteRoutinee" NOT NULL DEFAULT 'EN_ATTENTE',
  "dateDebut" TIMESTAMP(3) NOT NULL,
  "dateCloture" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "projetActiviteRoutineeId" TEXT NOT NULL,

  CONSTRAINT "ActiviteProjetActiviteRoutinee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TacheProjetActiviteRoutinee" (
  "id" TEXT NOT NULL,
  "titre" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "dateDebut" TIMESTAMP(3) NOT NULL,
  "dateCloture" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "activiteProjetActiviteRoutineeId" TEXT NOT NULL,
  "projetActiviteRoutineeId" TEXT NOT NULL,
  "statutTache" "StatutTacheProjetActiviteRoutinee" NOT NULL DEFAULT 'EN_ATTENTE',

  CONSTRAINT "TacheProjetActiviteRoutinee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TacheProjetActiviteRoutineeResponsable" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tacheProjetActiviteRoutineeId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TacheProjetActiviteRoutineeResponsable_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TacheProjetActiviteRoutineeMessage" (
  "id" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "typeMessage" "TypeMessageTacheProjetActiviteRoutinee" NOT NULL,
  "userId" TEXT NOT NULL,
  "tacheProjetActiviteRoutineeId" TEXT NOT NULL,

  CONSTRAINT "TacheProjetActiviteRoutineeMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TacheProjetActiviteRoutineeDocument" (
  "id" TEXT NOT NULL,
  "nom" TEXT NOT NULL,
  "typeDocument" "TypeDocumentTacheProjetActiviteRoutinee" NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  "tacheProjetActiviteRoutineeId" TEXT NOT NULL,

  CONSTRAINT "TacheProjetActiviteRoutineeDocument_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjetActiviteRoutinee_userId_fkey'
  ) THEN
    ALTER TABLE "ProjetActiviteRoutinee"
    ADD CONSTRAINT "ProjetActiviteRoutinee_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjetActiviteRoutineeResponsable_userId_fkey'
  ) THEN
    ALTER TABLE "ProjetActiviteRoutineeResponsable"
    ADD CONSTRAINT "ProjetActiviteRoutineeResponsable_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjetActiviteRoutineeResponsable_projetActiviteRoutineeId_fkey'
  ) THEN
    ALTER TABLE "ProjetActiviteRoutineeResponsable"
    ADD CONSTRAINT "ProjetActiviteRoutineeResponsable_projetActiviteRoutineeId_fkey"
    FOREIGN KEY ("projetActiviteRoutineeId") REFERENCES "ProjetActiviteRoutinee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ActiviteProjetActiviteRoutinee_projetActiviteRoutineeId_fkey'
  ) THEN
    ALTER TABLE "ActiviteProjetActiviteRoutinee"
    ADD CONSTRAINT "ActiviteProjetActiviteRoutinee_projetActiviteRoutineeId_fkey"
    FOREIGN KEY ("projetActiviteRoutineeId") REFERENCES "ProjetActiviteRoutinee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TacheProjetActiviteRoutinee_activiteProjetActiviteRoutinee_fkey'
  ) THEN
    ALTER TABLE "TacheProjetActiviteRoutinee"
    ADD CONSTRAINT "TacheProjetActiviteRoutinee_activiteProjetActiviteRoutinee_fkey"
    FOREIGN KEY ("activiteProjetActiviteRoutineeId") REFERENCES "ActiviteProjetActiviteRoutinee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TacheProjetActiviteRoutinee_projetActiviteRoutineeId_fkey'
  ) THEN
    ALTER TABLE "TacheProjetActiviteRoutinee"
    ADD CONSTRAINT "TacheProjetActiviteRoutinee_projetActiviteRoutineeId_fkey"
    FOREIGN KEY ("projetActiviteRoutineeId") REFERENCES "ProjetActiviteRoutinee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TacheProjetActiviteRoutineeResponsable_userId_fkey'
  ) THEN
    ALTER TABLE "TacheProjetActiviteRoutineeResponsable"
    ADD CONSTRAINT "TacheProjetActiviteRoutineeResponsable_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TacheProjetActiviteRoutineeResponsable_tacheProjetActivite_fkey'
  ) THEN
    ALTER TABLE "TacheProjetActiviteRoutineeResponsable"
    ADD CONSTRAINT "TacheProjetActiviteRoutineeResponsable_tacheProjetActivite_fkey"
    FOREIGN KEY ("tacheProjetActiviteRoutineeId") REFERENCES "TacheProjetActiviteRoutinee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TacheProjetActiviteRoutineeMessage_userId_fkey'
  ) THEN
    ALTER TABLE "TacheProjetActiviteRoutineeMessage"
    ADD CONSTRAINT "TacheProjetActiviteRoutineeMessage_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TacheProjetActiviteRoutineeMessage_tacheProjetActiviteRout_fkey'
  ) THEN
    ALTER TABLE "TacheProjetActiviteRoutineeMessage"
    ADD CONSTRAINT "TacheProjetActiviteRoutineeMessage_tacheProjetActiviteRout_fkey"
    FOREIGN KEY ("tacheProjetActiviteRoutineeId") REFERENCES "TacheProjetActiviteRoutinee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TacheProjetActiviteRoutineeDocument_userId_fkey'
  ) THEN
    ALTER TABLE "TacheProjetActiviteRoutineeDocument"
    ADD CONSTRAINT "TacheProjetActiviteRoutineeDocument_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TacheProjetActiviteRoutineeDocument_tacheProjetActiviteRou_fkey'
  ) THEN
    ALTER TABLE "TacheProjetActiviteRoutineeDocument"
    ADD CONSTRAINT "TacheProjetActiviteRoutineeDocument_tacheProjetActiviteRou_fkey"
    FOREIGN KEY ("tacheProjetActiviteRoutineeId") REFERENCES "TacheProjetActiviteRoutinee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
