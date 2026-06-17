-- Link Formation to NonConformiteJuridique
ALTER TABLE "Formation" ADD COLUMN IF NOT EXISTS "nonConformiteJuridiqueId" TEXT;
ALTER TABLE "Formation" DROP CONSTRAINT IF EXISTS "Formation_nonConformiteJuridiqueId_fkey";
ALTER TABLE "Formation" ADD CONSTRAINT "Formation_nonConformiteJuridiqueId_fkey"
  FOREIGN KEY ("nonConformiteJuridiqueId") REFERENCES "NonConformiteJuridique"("id") ON DELETE CASCADE ON UPDATE CASCADE;
