-- CreateEnum
CREATE TYPE "public"."StatusClient" AS ENUM ('CLIENT', 'PROSPECT', 'ABANDONNE');

-- CreateEnum
CREATE TYPE "public"."RendezVousStatut" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ANNULE');

-- AlterTable
ALTER TABLE "public"."Client" ADD COLUMN     "status_client" "public"."StatusClient" NOT NULL DEFAULT 'PROSPECT';

-- CreateTable
CREATE TABLE "public"."RendezVous" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "duree" TEXT NOT NULL,
    "resume_rendez_vous" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "statut" "public"."RendezVousStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "note" TEXT,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "RendezVous_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."RendezVous" ADD CONSTRAINT "RendezVous_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
