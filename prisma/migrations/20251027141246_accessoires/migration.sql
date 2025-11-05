-- CreateTable
CREATE TABLE "public"."Accessoire" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "prix" DECIMAL(65,30) NOT NULL,
    "voitureId" TEXT NOT NULL,
    "factureId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Accessoire_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Accessoire" ADD CONSTRAINT "Accessoire_voitureId_fkey" FOREIGN KEY ("voitureId") REFERENCES "public"."Voiture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Accessoire" ADD CONSTRAINT "Accessoire_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "public"."Facture"("id") ON DELETE SET NULL ON UPDATE CASCADE;
