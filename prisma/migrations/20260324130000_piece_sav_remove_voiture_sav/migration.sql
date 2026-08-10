-- DropForeignKey
ALTER TABLE "public"."PieceSAV" DROP CONSTRAINT IF EXISTS "PieceSAV_voitureSAVId_fkey";

-- AlterTable
ALTER TABLE "public"."PieceSAV" DROP COLUMN IF EXISTS "voitureSAVId";
