-- AlterTable
ALTER TABLE "PieceSAV" ADD COLUMN IF NOT EXISTS "detailDiagnosticId" TEXT,
ADD COLUMN IF NOT EXISTS "quantiteSortieDetail" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PieceSAV_detailDiagnosticId_fkey'
  ) THEN
    ALTER TABLE "PieceSAV" ADD CONSTRAINT "PieceSAV_detailDiagnosticId_fkey"
      FOREIGN KEY ("detailDiagnosticId") REFERENCES "DetailDiagnostic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PieceSAV_detailDiagnosticId_key" ON "PieceSAV"("detailDiagnosticId");
