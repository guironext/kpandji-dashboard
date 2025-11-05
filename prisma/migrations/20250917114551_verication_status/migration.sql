-- CreateEnum
CREATE TYPE "public"."StatusVerification" AS ENUM ('EN_ATTENTE', 'RETROUVE', 'MODIFIE', 'NON_RETROUVE');

-- AlterTable
ALTER TABLE "public"."SparePart" ADD COLUMN     "statusVerification" "public"."StatusVerification" NOT NULL DEFAULT 'EN_ATTENTE';
