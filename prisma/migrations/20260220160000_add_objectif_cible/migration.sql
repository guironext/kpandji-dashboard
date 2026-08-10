-- CreateTable
CREATE TABLE "ObjectifCible" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prospectCible" INTEGER NOT NULL DEFAULT 0,
    "prospectReel" INTEGER NOT NULL DEFAULT 0,
    "tauxAtteint" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObjectifCible_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ObjectifCible_periodId_userId_key" ON "ObjectifCible"("periodId", "userId");

-- CreateIndex
CREATE INDEX "ObjectifCible_userId_idx" ON "ObjectifCible"("userId");

-- CreateIndex
CREATE INDEX "ObjectifCible_periodId_idx" ON "ObjectifCible"("periodId");

-- AddForeignKey
ALTER TABLE "ObjectifCible" ADD CONSTRAINT "ObjectifCible_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ObjectifPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectifCible" ADD CONSTRAINT "ObjectifCible_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
