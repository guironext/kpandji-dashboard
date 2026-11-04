CREATE TABLE IF NOT EXISTS "ObjectifMoisOpsDev" (
  "id" TEXT NOT NULL,
  "objectif" TEXT NOT NULL,
  "description" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "ObjectifMoisOpsDev_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ObjectifMoisOpsDev_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ObjectifMoisOpsDev_userId_idx" ON "ObjectifMoisOpsDev"("userId");
