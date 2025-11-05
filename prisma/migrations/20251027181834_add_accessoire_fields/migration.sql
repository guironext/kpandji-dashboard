-- AlterTable
ALTER TABLE "public"."Accessoire" ADD COLUMN     "description" TEXT,
ADD COLUMN     "prix" DECIMAL(65,30),
ADD COLUMN     "quantity" INTEGER;
