-- CreateTable ObjectifPole
CREATE TABLE IF NOT EXISTS "ObjectifPole" (
    "id" TEXT NOT NULL,
    "objectifPoleCible" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "objectifPeriodId" TEXT NOT NULL,

    CONSTRAINT "ObjectifPole_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ObjectifPole_userId_idx" ON "ObjectifPole"("userId");
CREATE INDEX IF NOT EXISTS "ObjectifPole_objectifPeriodId_idx" ON "ObjectifPole"("objectifPeriodId");

ALTER TABLE "ObjectifPole" ADD CONSTRAINT "ObjectifPole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ObjectifPole" ADD CONSTRAINT "ObjectifPole_objectifPeriodId_fkey" FOREIGN KEY ("objectifPeriodId") REFERENCES "ObjectifPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
