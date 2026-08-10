-- CreateEnum
CREATE TYPE "TypeRapportMaintenanceSAV" AS ENUM ('AUTOMATIQUE', 'MANUEL', 'COMPLET');

-- CreateEnum
CREATE TYPE "StatutRapportMaintenanceSAV" AS ENUM ('BROUILLON', 'VALIDE', 'ARCHIVE');

-- AlterTable
ALTER TABLE "RapportMaintenanceSAV" ADD COLUMN     "contenuAuto" TEXT,
ADD COLUMN     "redacteurId" TEXT,
ADD COLUMN     "snapshotActivites" JSONB,
ADD COLUMN     "statut" "StatutRapportMaintenanceSAV" NOT NULL DEFAULT 'BROUILLON',
ADD COLUMN     "type" "TypeRapportMaintenanceSAV" NOT NULL DEFAULT 'COMPLET';

-- CreateIndex
CREATE INDEX "RapportMaintenanceSAV_voitureSAVId_idx" ON "RapportMaintenanceSAV"("voitureSAVId");

-- CreateIndex
CREATE INDEX "RapportMaintenanceSAV_statut_idx" ON "RapportMaintenanceSAV"("statut");

-- AddForeignKey
ALTER TABLE "RapportMaintenanceSAV" ADD CONSTRAINT "RapportMaintenanceSAV_redacteurId_fkey" FOREIGN KEY ("redacteurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
