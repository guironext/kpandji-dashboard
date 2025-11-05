-- CreateTable
CREATE TABLE "public"."BonDeCommande" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "numero" TEXT NOT NULL,
    "factureId" TEXT NOT NULL,

    CONSTRAINT "BonDeCommande_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BonDeCommande_factureId_key" ON "public"."BonDeCommande"("factureId");

-- AddForeignKey
ALTER TABLE "public"."BonDeCommande" ADD CONSTRAINT "BonDeCommande_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "public"."Facture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
