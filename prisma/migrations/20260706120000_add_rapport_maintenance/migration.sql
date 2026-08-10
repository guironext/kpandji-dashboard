-- CreateTable
CREATE TABLE "RapportMaintenanceSAV" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT,
    "observations" TEXT,
    "voitureSAVId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RapportMaintenanceSAV_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RapportMaintenanceSAV" ADD CONSTRAINT "RapportMaintenanceSAV_voitureSAVId_fkey" FOREIGN KEY ("voitureSAVId") REFERENCES "VoitureSAV"("id") ON DELETE CASCADE ON UPDATE CASCADE;
