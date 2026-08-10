-- Add missing columns to ReservationVehicule if they don't exist
-- (fixes "column coutTransport does not exist" when DB was created before full migration)
ALTER TABLE "ReservationVehicule" ADD COLUMN IF NOT EXISTS "coutTransport" DECIMAL(65,30) DEFAULT 0;
ALTER TABLE "ReservationVehicule" ADD COLUMN IF NOT EXISTS "accompagnant" TEXT;
