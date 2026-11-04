CREATE TABLE IF NOT EXISTS "DossierClientele" (
  "id" TEXT NOT NULL,
  "numero" TEXT NOT NULL,
  "nomCourt" TEXT NOT NULL,
  "prospectId" TEXT NOT NULL,
  "prospectType" TEXT NOT NULL,
  "prospectNom" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "DossierClientele_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DossierClientele_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "DossierClientele_numero_key" ON "DossierClientele"("numero");
CREATE UNIQUE INDEX IF NOT EXISTS "DossierClientele_prospectId_prospectType_key" ON "DossierClientele"("prospectId", "prospectType");
CREATE INDEX IF NOT EXISTS "DossierClientele_userId_idx" ON "DossierClientele"("userId");
