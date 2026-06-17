-- Link each RisqueJuridique to its EcartJuridique (1:1)
ALTER TABLE "RisqueJuridique" ADD COLUMN IF NOT EXISTS "ecartJuridiqueId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "RisqueJuridique_ecartJuridiqueId_key" ON "RisqueJuridique"("ecartJuridiqueId");
ALTER TABLE "RisqueJuridique" DROP CONSTRAINT IF EXISTS "RisqueJuridique_ecartJuridiqueId_fkey";
ALTER TABLE "RisqueJuridique" ADD CONSTRAINT "RisqueJuridique_ecartJuridiqueId_fkey"
  FOREIGN KEY ("ecartJuridiqueId") REFERENCES "EcartJuridique"("id") ON DELETE CASCADE ON UPDATE CASCADE;
