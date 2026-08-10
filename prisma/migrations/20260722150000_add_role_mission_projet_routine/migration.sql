-- Refactor activites routinieres: RoleMissionProjetRoutine module.
-- Restored migration file (already applied to database).

-- CreateEnum
CREATE TYPE "StatutActiviteProjetRoutine" AS ENUM ('NOUVEAU', 'EN_ATTENTE', 'EN_COURS', 'EN_ATTENTE_VALIDATION', 'VALIDEE', 'NON_VALIDEE', 'TRANSFEREE', 'TERMINEE', 'ANNULE');

-- CreateEnum
CREATE TYPE "StatutTacheActiviteProjetRoutine" AS ENUM ('NOUVEAU', 'EN_ATTENTE', 'EN_COURS', 'EN_ATTENTE_VALIDATION', 'VALIDEE', 'NON_VALIDEE', 'TRANSFEREE', 'TERMINEE', 'ANNULE');

-- CreateEnum
CREATE TYPE "TypeMessageTacheActiviteProjetRoutine" AS ENUM ('EN_ATTENTE', 'LU', 'NON_LU', 'REPONDU', 'SUPPRIME');

-- CreateEnum
CREATE TYPE "TypeDocumentTacheActiviteProjetRoutine" AS ENUM ('DOCUMENTATION', 'MEMOIRE', 'AVIS_TECHNIQUE', 'IMAGE', 'VIDEO', 'AUDIO', 'AUTRE');

-- CreateTable
CREATE TABLE "RoleMissionProjetRoutine" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleMissionProjetRoutine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicateurObjectifMensuelProjetRoutine" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "objectifMensuel" TEXT NOT NULL,
    "nombreObjectifsMensuels" INTEGER NOT NULL,
    "nombreObjectifsMensuelsAtteints" INTEGER NOT NULL DEFAULT 0,
    "nombreObjectifsMensuelsNonAtteints" INTEGER NOT NULL DEFAULT 0,
    "roleMissionProjetRoutineId" TEXT NOT NULL,

    CONSTRAINT "IndicateurObjectifMensuelProjetRoutine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiviteProjetRoutine" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateCloture" TIMESTAMP(3),
    "mois" TEXT,
    "statutActivite" "StatutActiviteProjetRoutine" NOT NULL DEFAULT 'NOUVEAU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roleMissionProjetRoutineId" TEXT NOT NULL,
    "indicateurObjectifMensuelProjetRoutineId" TEXT,

    CONSTRAINT "ActiviteProjetRoutine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TacheActiviteProjetRoutine" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateCloture" TIMESTAMP(3),
    "statutTache" "StatutTacheActiviteProjetRoutine" NOT NULL DEFAULT 'NOUVEAU',
    "activiteProjetRoutineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TacheActiviteProjetRoutine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsableProjetRoutine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleMissionProjetRoutineId" TEXT NOT NULL,
    "tacheActiviteProjetRoutineId" TEXT NOT NULL,
    "activiteProjetRoutineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResponsableProjetRoutine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsableTacheResponsable" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tacheActiviteProjetRoutineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResponsableTacheResponsable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TacheActiviteProjetRoutineMessage" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "typeMessage" "TypeMessageTacheActiviteProjetRoutine" NOT NULL,
    "responsableProjetRoutineId" TEXT NOT NULL,
    "tacheActiviteProjetRoutineId" TEXT NOT NULL,

    CONSTRAINT "TacheActiviteProjetRoutineMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TacheActiviteProjetRoutineDocument" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "typeDocument" "TypeDocumentTacheActiviteProjetRoutine" NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "responsableTacheResponsableId" TEXT NOT NULL,

    CONSTRAINT "TacheActiviteProjetRoutineDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IndicateurObjectifMensuelProjetRoutine" ADD CONSTRAINT "IndicateurObjectifMensuelProjetRoutine_roleMissionProjetRou_fkey" FOREIGN KEY ("roleMissionProjetRoutineId") REFERENCES "RoleMissionProjetRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiviteProjetRoutine" ADD CONSTRAINT "ActiviteProjetRoutine_roleMissionProjetRoutineId_fkey" FOREIGN KEY ("roleMissionProjetRoutineId") REFERENCES "RoleMissionProjetRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiviteProjetRoutine" ADD CONSTRAINT "ActiviteProjetRoutine_indicateurObjectifMensuelProjetRouti_fkey" FOREIGN KEY ("indicateurObjectifMensuelProjetRoutineId") REFERENCES "IndicateurObjectifMensuelProjetRoutine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TacheActiviteProjetRoutine" ADD CONSTRAINT "TacheActiviteProjetRoutine_activiteProjetRoutineId_fkey" FOREIGN KEY ("activiteProjetRoutineId") REFERENCES "ActiviteProjetRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsableProjetRoutine" ADD CONSTRAINT "ResponsableProjetRoutine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsableProjetRoutine" ADD CONSTRAINT "ResponsableProjetRoutine_roleMissionProjetRoutineId_fkey" FOREIGN KEY ("roleMissionProjetRoutineId") REFERENCES "RoleMissionProjetRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsableProjetRoutine" ADD CONSTRAINT "ResponsableProjetRoutine_tacheActiviteProjetRoutineId_fkey" FOREIGN KEY ("tacheActiviteProjetRoutineId") REFERENCES "TacheActiviteProjetRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsableProjetRoutine" ADD CONSTRAINT "ResponsableProjetRoutine_activiteProjetRoutineId_fkey" FOREIGN KEY ("activiteProjetRoutineId") REFERENCES "ActiviteProjetRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsableTacheResponsable" ADD CONSTRAINT "ResponsableTacheResponsable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsableTacheResponsable" ADD CONSTRAINT "ResponsableTacheResponsable_tacheActiviteProjetRoutineId_fkey" FOREIGN KEY ("tacheActiviteProjetRoutineId") REFERENCES "TacheActiviteProjetRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TacheActiviteProjetRoutineMessage" ADD CONSTRAINT "TacheActiviteProjetRoutineMessage_responsableProjetRoutine_fkey" FOREIGN KEY ("responsableProjetRoutineId") REFERENCES "ResponsableProjetRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TacheActiviteProjetRoutineMessage" ADD CONSTRAINT "TacheActiviteProjetRoutineMessage_tacheActiviteProjetRoutine_fkey" FOREIGN KEY ("tacheActiviteProjetRoutineId") REFERENCES "TacheActiviteProjetRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TacheActiviteProjetRoutineDocument" ADD CONSTRAINT "TacheActiviteProjetRoutineDocument_responsableTacheResponsa_fkey" FOREIGN KEY ("responsableTacheResponsableId") REFERENCES "ResponsableTacheResponsable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropTable
DROP TABLE IF EXISTS "ObjectifProjetActiviteRoutineeResponsable";

-- DropTable
DROP TABLE IF EXISTS "TacheProjetActiviteRoutineeDocument";

-- DropTable
DROP TABLE IF EXISTS "TacheProjetActiviteRoutineeMessage";

-- DropTable
DROP TABLE IF EXISTS "TacheProjetActiviteRoutineeResponsable";

-- DropTable
DROP TABLE IF EXISTS "TacheProjetActiviteRoutinee";

-- DropTable
DROP TABLE IF EXISTS "ActiviteProjetActiviteRoutinee";

-- DropTable
DROP TABLE IF EXISTS "ProjetActiviteRoutineeResponsable";

-- DropTable
DROP TABLE IF EXISTS "ProjetActiviteRoutinee";

-- DropEnum
DROP TYPE IF EXISTS "TypeDocumentTacheProjetActiviteRoutinee";

-- DropEnum
DROP TYPE IF EXISTS "TypeMessageTacheProjetActiviteRoutinee";

-- DropEnum
DROP TYPE IF EXISTS "StatutTacheProjetActiviteRoutinee";

-- DropEnum
DROP TYPE IF EXISTS "StatutActiviteProjetActiviteRoutinee";
