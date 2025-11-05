-- DropForeignKey
ALTER TABLE "public"."FournisseurCommandeLocal" DROP CONSTRAINT "FournisseurCommandeLocal_commandeLocalId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FournisseurCommandeLocal" DROP CONSTRAINT "FournisseurCommandeLocal_fournisseurId_fkey";

-- CreateTable
CREATE TABLE "public"."_CommandeLocalToFournisseurCommandeLocal" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CommandeLocalToFournisseurCommandeLocal_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CommandeLocalToFournisseurCommandeLocal_B_index" ON "public"."_CommandeLocalToFournisseurCommandeLocal"("B");

-- AddForeignKey
ALTER TABLE "public"."_CommandeLocalToFournisseurCommandeLocal" ADD CONSTRAINT "_CommandeLocalToFournisseurCommandeLocal_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."CommandeLocal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CommandeLocalToFournisseurCommandeLocal" ADD CONSTRAINT "_CommandeLocalToFournisseurCommandeLocal_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."FournisseurCommandeLocal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
