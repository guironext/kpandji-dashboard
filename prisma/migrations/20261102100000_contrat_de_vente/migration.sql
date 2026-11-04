CREATE TABLE IF NOT EXISTS "ContratDeVente" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "factureId" TEXT NOT NULL,
  "contenu" JSONB NOT NULL,
  CONSTRAINT "ContratDeVente_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContratDeVente_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ContratDeVente_factureId_key" ON "ContratDeVente"("factureId");
