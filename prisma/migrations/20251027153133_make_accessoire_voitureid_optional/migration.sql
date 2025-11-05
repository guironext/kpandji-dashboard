-- DropForeignKey
ALTER TABLE "public"."Accessoire" DROP CONSTRAINT "Accessoire_voitureId_fkey";

-- AlterTable
ALTER TABLE "public"."Accessoire" ALTER COLUMN "voitureId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Accessoire" ADD CONSTRAINT "Accessoire_voitureId_fkey" FOREIGN KEY ("voitureId") REFERENCES "public"."Voiture"("id") ON DELETE SET NULL ON UPDATE CASCADE;
