CREATE TABLE IF NOT EXISTS "RapportVisiteClientele" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "prospectId" TEXT NOT NULL,
  "prospectType" TEXT NOT NULL,
  "prospectNom" TEXT NOT NULL,
  "activites" JSONB NOT NULL DEFAULT '[]',
  "typesVehicules" JSONB NOT NULL DEFAULT '[]',
  "modelesPresentes" JSONB NOT NULL DEFAULT '[]',
  "modelesRetenus" JSONB NOT NULL DEFAULT '[]',
  "lieuRencontre" TEXT,
  "modeleVoiture" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "RapportVisiteClientele_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RapportVisiteClientele_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "RapportVisiteClientele_userId_idx" ON "RapportVisiteClientele"("userId");
CREATE INDEX IF NOT EXISTS "RapportVisiteClientele_prospectId_idx" ON "RapportVisiteClientele"("prospectId");
