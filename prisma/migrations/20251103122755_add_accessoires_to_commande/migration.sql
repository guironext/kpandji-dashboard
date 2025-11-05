-- AlterTable
ALTER TABLE "public"."Accessoire" ADD COLUMN     "commandeId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Accessoire" ADD CONSTRAINT "Accessoire_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "public"."Commande"("id") ON DELETE SET NULL ON UPDATE CASCADE;
