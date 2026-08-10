-- Allow several stock rows (PieceSAV) to be linked to the same diagnostic detail line.
DROP INDEX IF EXISTS "PieceSAV_detailDiagnosticId_key";
-- If the unique rule was created as a table constraint (varies by migration history):
ALTER TABLE "PieceSAV" DROP CONSTRAINT IF EXISTS "PieceSAV_detailDiagnosticId_key";
