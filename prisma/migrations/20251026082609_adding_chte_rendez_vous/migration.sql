-- CreateTable
CREATE TABLE "public"."Tableau_chute_rendez_vous" (
    "id" TEXT NOT NULL,
    "mois_chute" TEXT NOT NULL,
    "modeles_discutes" JSONB,
    "rapportRendezVousId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tableau_chute_rendez_vous_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Tableau_chute_rendez_vous" ADD CONSTRAINT "Tableau_chute_rendez_vous_rapportRendezVousId_fkey" FOREIGN KEY ("rapportRendezVousId") REFERENCES "public"."RapportRendezVous"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tableau_chute_rendez_vous" ADD CONSTRAINT "Tableau_chute_rendez_vous_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
