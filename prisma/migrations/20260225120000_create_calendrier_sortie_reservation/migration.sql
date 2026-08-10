-- CreateEnum (idempotent: skip if already exists)
DO $$ BEGIN
  CREATE TYPE "public"."StatutCalendrierSortie" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ANNULE', 'DEPLACE', 'EFFECTUE', 'EN_COURS', 'TERMINEE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."StatutReservationVehicule" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ANNULE', 'DEPLACE', 'EFFECTUE', 'EN_COURS', 'TERMINEE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."CalendrierSortie" (
    "id" TEXT NOT NULL,
    "dateSortie" TIMESTAMP(3) NOT NULL,
    "dateRetour" TIMESTAMP(3) NOT NULL,
    "destination" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "commentaire" TEXT,
    "statut" "public"."StatutCalendrierSortie" NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "voitureId" TEXT NOT NULL,
    "rendezVousId" TEXT NOT NULL,
    "autre_moyen_transport" TEXT,

    CONSTRAINT "CalendrierSortie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."ReservationVehicule" (
    "id" TEXT NOT NULL,
    "dateReservation" TIMESTAMP(3) NOT NULL,
    "dateRetour" TIMESTAMP(3) NOT NULL,
    "heure_reserve" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "commentaire" TEXT,
    "statut" "public"."StatutReservationVehicule" NOT NULL DEFAULT 'EN_ATTENTE',
    "rendezVousId" TEXT NOT NULL,
    "voitureId" TEXT NOT NULL,
    "coutTransport" DECIMAL(65,30) DEFAULT 0,
    "accompagnant" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "calendrierSortieId" TEXT NOT NULL,

    CONSTRAINT "ReservationVehicule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CalendrierSortie_userId_idx" ON "public"."CalendrierSortie"("userId");
CREATE INDEX IF NOT EXISTS "ReservationVehicule_userId_idx" ON "public"."ReservationVehicule"("userId");
CREATE INDEX IF NOT EXISTS "ReservationVehicule_rendezVousId_idx" ON "public"."ReservationVehicule"("rendezVousId");
CREATE INDEX IF NOT EXISTS "ReservationVehicule_voitureId_idx" ON "public"."ReservationVehicule"("voitureId");
CREATE INDEX IF NOT EXISTS "ReservationVehicule_calendrierSortieId_idx" ON "public"."ReservationVehicule"("calendrierSortieId");

-- AddForeignKey (idempotent)
DO $$ BEGIN
  ALTER TABLE "public"."CalendrierSortie" ADD CONSTRAINT "CalendrierSortie_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "public"."CalendrierSortie" ADD CONSTRAINT "CalendrierSortie_voitureId_fkey" FOREIGN KEY ("voitureId") REFERENCES "public"."Voiture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "public"."CalendrierSortie" ADD CONSTRAINT "CalendrierSortie_rendezVousId_fkey" FOREIGN KEY ("rendezVousId") REFERENCES "public"."RendezVous"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "public"."ReservationVehicule" ADD CONSTRAINT "ReservationVehicule_rendezVousId_fkey" FOREIGN KEY ("rendezVousId") REFERENCES "public"."RendezVous"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "public"."ReservationVehicule" ADD CONSTRAINT "ReservationVehicule_voitureId_fkey" FOREIGN KEY ("voitureId") REFERENCES "public"."Voiture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "public"."ReservationVehicule" ADD CONSTRAINT "ReservationVehicule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "public"."ReservationVehicule" ADD CONSTRAINT "ReservationVehicule_calendrierSortieId_fkey" FOREIGN KEY ("calendrierSortieId") REFERENCES "public"."CalendrierSortie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
