-- AlterTable
ALTER TABLE "CalendrierSortie" ADD COLUMN "moyenTransport" TEXT,
ALTER COLUMN "voitureId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ReservationVehicule" ADD COLUMN "moyenTransport" TEXT,
ALTER COLUMN "voitureId" DROP NOT NULL;
