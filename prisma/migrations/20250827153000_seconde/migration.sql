-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'MANAGER', 'COMMERCIAL', 'CHEFUSINE', 'CHEFEQUIPE', 'MAGASINIER', 'RH', 'CHEFQUALITE', 'EMPLOYEE', 'SAV', 'LOGISTIQUE', 'FINANCE', 'DIRECTEUR_GENERAL', 'CLIENTELLE', 'COMPTABLE', 'CONCESSIONAIRE');

-- CreateEnum
CREATE TYPE "public"."Transmission" AS ENUM ('AUTOMATIQUE', 'MANUEL');

-- CreateEnum
CREATE TYPE "public"."Etat" AS ENUM ('PIECES', 'MONTAGE', 'TESTE', 'PARKING', 'CORRECTION', 'VENTE');

-- CreateEnum
CREATE TYPE "public"."Etape" AS ENUM ('PROPOSITION', 'VALIDE', 'TRANSITE', 'ARRIVE', 'VERIF_PIECES', 'STOCK', 'MONTAGE', 'TESTE', 'CORRECTION', 'PARKING', 'LIVREE', 'VENTE');

-- CreateEnum
CREATE TYPE "public"."Motorisation" AS ENUM ('ELECTRIQUE', 'ESSENCE', 'DIESEL', 'HYBRIDE');

-- CreateEnum
CREATE TYPE "public"."EtapeCommande" AS ENUM ('PROPOSITION', 'VALIDE', 'TRANSITE', 'ARRIVE', 'VERIF_PIECES');

-- CreateEnum
CREATE TYPE "public"."Qualite" AS ENUM ('CHEF_EQUIPE', 'MEMBRE_EQUIPE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Employee" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenoms" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "bloodType" TEXT NOT NULL,
    "specialite" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Client" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VoitureModel" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "fiche_technique" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoitureModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Voiture" (
    "id" TEXT NOT NULL,
    "nbr_portes" TEXT NOT NULL,
    "transmission" "public"."Transmission" NOT NULL,
    "motorisation" "public"."Motorisation" NOT NULL,
    "etat" "public"."Etat" NOT NULL,
    "etape" "public"."Etape" NOT NULL,
    "couleur" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT,
    "commandeId" TEXT,
    "commandeLocalId" TEXT,
    "conteneurId" TEXT,
    "voitureModelId" TEXT,

    CONSTRAINT "Voiture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Commande" (
    "id" TEXT NOT NULL,
    "etapeCommande" "public"."EtapeCommande" DEFAULT 'PROPOSITION',
    "date_livraison" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "conteneurId" TEXT,

    CONSTRAINT "Commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Conteneur" (
    "id" TEXT NOT NULL,
    "conteneurNumber" TEXT NOT NULL,
    "sealNumber" TEXT NOT NULL,
    "totalPackages" TEXT,
    "grossWeight" TEXT,
    "netWeight" TEXT,
    "stuffingMap" TEXT,
    "dateEmbarquement" TIMESTAMP(3),
    "dateArriveProbable" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "etapeEvolution" TEXT NOT NULL DEFAULT 'EN_ATTENTE',

    CONSTRAINT "Conteneur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subcase" (
    "id" TEXT NOT NULL,
    "subcaseNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "conteneurId" TEXT NOT NULL,

    CONSTRAINT "Subcase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommandeLocal" (
    "id" TEXT NOT NULL,
    "date_livraison" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommandeLocal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SparePart" (
    "id" TEXT NOT NULL,
    "partCode" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "partNameFrench" TEXT,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "commandeLocalId" TEXT,
    "voitureId" TEXT NOT NULL,
    "subcaseId" TEXT,
    "verificationConteneurId" TEXT,

    CONSTRAINT "SparePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PieceComplement" (
    "id" TEXT NOT NULL,
    "partCode" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "partNameFrench" TEXT,
    "vehicleModel" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "commandeLocalId" TEXT NOT NULL,
    "verificationConteneurId" TEXT,

    CONSTRAINT "PieceComplement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tool" (
    "id" TEXT NOT NULL,
    "toolCode" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "check" BOOLEAN NOT NULL DEFAULT false,
    "etapeEvolution" TEXT NOT NULL,
    "commandeId" TEXT,
    "commandeLocalId" TEXT,
    "subcaseId" TEXT,
    "verificationConteneurId" TEXT,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Fournisseur" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "code_postal" TEXT,
    "pays" TEXT,
    "type_Activite" TEXT,
    "etape" TEXT NOT NULL DEFAULT 'PROPOSITION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fournisseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LocalBuy" (
    "id" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "partNameFrench" TEXT,
    "partCode" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION,
    "description" TEXT,
    "montant" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "LocalBuy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationConteneur" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "conteneurId" TEXT NOT NULL,

    CONSTRAINT "VerificationConteneur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RapportVerification" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verificationConteneurId" TEXT NOT NULL,

    CONSTRAINT "RapportVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Montage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "no_chassis" TEXT,
    "commandeId" TEXT NOT NULL,
    "voitureId" TEXT NOT NULL,

    CONSTRAINT "Montage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RapportMontage" (
    "id" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "montageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RapportMontage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Equipe" (
    "id" TEXT NOT NULL,
    "nomEquipe" TEXT NOT NULL,
    "chefEquipeId" TEXT NOT NULL,
    "activite" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "montageId" TEXT,

    CONSTRAINT "Equipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EquipeMembre" (
    "id" TEXT NOT NULL,
    "qualite" "public"."Qualite" NOT NULL,
    "fonction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "equipeId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "EquipeMembre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Teste" (
    "id" TEXT NOT NULL,
    "activite" TEXT NOT NULL,
    "dateTeste" TIMESTAMP(3) NOT NULL,
    "heureTeste" TIMESTAMP(3) NOT NULL,
    "resultat" TEXT NOT NULL,
    "commentaire" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voitureId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "Teste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RapportTeste" (
    "id" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "testeId" TEXT NOT NULL,

    CONSTRAINT "RapportTeste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Correction" (
    "id" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voitureId" TEXT NOT NULL,

    CONSTRAINT "Correction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RapportCorrection" (
    "id" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "correctionId" TEXT NOT NULL,

    CONSTRAINT "RapportCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RapportEquipe" (
    "id" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "equipeId" TEXT NOT NULL,

    CONSTRAINT "RapportEquipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_CommandeToFournisseur" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CommandeToFournisseur_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_CommandeLocalToFournisseur" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CommandeLocalToFournisseur_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_CorrectionToSparePart" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CorrectionToSparePart_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_CorrectionToTool" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CorrectionToTool_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "public"."User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "public"."Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_userId_key" ON "public"."Client"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Conteneur_conteneurNumber_key" ON "public"."Conteneur"("conteneurNumber");

-- CreateIndex
CREATE INDEX "_CommandeToFournisseur_B_index" ON "public"."_CommandeToFournisseur"("B");

-- CreateIndex
CREATE INDEX "_CommandeLocalToFournisseur_B_index" ON "public"."_CommandeLocalToFournisseur"("B");

-- CreateIndex
CREATE INDEX "_CorrectionToSparePart_B_index" ON "public"."_CorrectionToSparePart"("B");

-- CreateIndex
CREATE INDEX "_CorrectionToTool_B_index" ON "public"."_CorrectionToTool"("B");

-- AddForeignKey
ALTER TABLE "public"."Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Voiture" ADD CONSTRAINT "Voiture_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Voiture" ADD CONSTRAINT "Voiture_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "public"."Commande"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Voiture" ADD CONSTRAINT "Voiture_commandeLocalId_fkey" FOREIGN KEY ("commandeLocalId") REFERENCES "public"."CommandeLocal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Voiture" ADD CONSTRAINT "Voiture_conteneurId_fkey" FOREIGN KEY ("conteneurId") REFERENCES "public"."Conteneur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Voiture" ADD CONSTRAINT "Voiture_voitureModelId_fkey" FOREIGN KEY ("voitureModelId") REFERENCES "public"."VoitureModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commande" ADD CONSTRAINT "Commande_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commande" ADD CONSTRAINT "Commande_conteneurId_fkey" FOREIGN KEY ("conteneurId") REFERENCES "public"."Conteneur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subcase" ADD CONSTRAINT "Subcase_conteneurId_fkey" FOREIGN KEY ("conteneurId") REFERENCES "public"."Conteneur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SparePart" ADD CONSTRAINT "SparePart_commandeLocalId_fkey" FOREIGN KEY ("commandeLocalId") REFERENCES "public"."CommandeLocal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SparePart" ADD CONSTRAINT "SparePart_voitureId_fkey" FOREIGN KEY ("voitureId") REFERENCES "public"."Voiture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SparePart" ADD CONSTRAINT "SparePart_subcaseId_fkey" FOREIGN KEY ("subcaseId") REFERENCES "public"."Subcase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SparePart" ADD CONSTRAINT "SparePart_verificationConteneurId_fkey" FOREIGN KEY ("verificationConteneurId") REFERENCES "public"."VerificationConteneur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PieceComplement" ADD CONSTRAINT "PieceComplement_commandeLocalId_fkey" FOREIGN KEY ("commandeLocalId") REFERENCES "public"."CommandeLocal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PieceComplement" ADD CONSTRAINT "PieceComplement_verificationConteneurId_fkey" FOREIGN KEY ("verificationConteneurId") REFERENCES "public"."VerificationConteneur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tool" ADD CONSTRAINT "Tool_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "public"."Commande"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tool" ADD CONSTRAINT "Tool_commandeLocalId_fkey" FOREIGN KEY ("commandeLocalId") REFERENCES "public"."CommandeLocal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tool" ADD CONSTRAINT "Tool_subcaseId_fkey" FOREIGN KEY ("subcaseId") REFERENCES "public"."Subcase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tool" ADD CONSTRAINT "Tool_verificationConteneurId_fkey" FOREIGN KEY ("verificationConteneurId") REFERENCES "public"."VerificationConteneur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LocalBuy" ADD CONSTRAINT "LocalBuy_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VerificationConteneur" ADD CONSTRAINT "VerificationConteneur_conteneurId_fkey" FOREIGN KEY ("conteneurId") REFERENCES "public"."Conteneur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RapportVerification" ADD CONSTRAINT "RapportVerification_verificationConteneurId_fkey" FOREIGN KEY ("verificationConteneurId") REFERENCES "public"."VerificationConteneur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Montage" ADD CONSTRAINT "Montage_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "public"."Commande"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Montage" ADD CONSTRAINT "Montage_voitureId_fkey" FOREIGN KEY ("voitureId") REFERENCES "public"."Voiture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RapportMontage" ADD CONSTRAINT "RapportMontage_montageId_fkey" FOREIGN KEY ("montageId") REFERENCES "public"."Montage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Equipe" ADD CONSTRAINT "Equipe_chefEquipeId_fkey" FOREIGN KEY ("chefEquipeId") REFERENCES "public"."Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Equipe" ADD CONSTRAINT "Equipe_montageId_fkey" FOREIGN KEY ("montageId") REFERENCES "public"."Montage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EquipeMembre" ADD CONSTRAINT "EquipeMembre_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "public"."Equipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EquipeMembre" ADD CONSTRAINT "EquipeMembre_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Teste" ADD CONSTRAINT "Teste_voitureId_fkey" FOREIGN KEY ("voitureId") REFERENCES "public"."Voiture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Teste" ADD CONSTRAINT "Teste_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RapportTeste" ADD CONSTRAINT "RapportTeste_testeId_fkey" FOREIGN KEY ("testeId") REFERENCES "public"."Teste"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Correction" ADD CONSTRAINT "Correction_voitureId_fkey" FOREIGN KEY ("voitureId") REFERENCES "public"."Voiture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RapportCorrection" ADD CONSTRAINT "RapportCorrection_correctionId_fkey" FOREIGN KEY ("correctionId") REFERENCES "public"."Correction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RapportEquipe" ADD CONSTRAINT "RapportEquipe_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "public"."Equipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CommandeToFournisseur" ADD CONSTRAINT "_CommandeToFournisseur_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Commande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CommandeToFournisseur" ADD CONSTRAINT "_CommandeToFournisseur_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Fournisseur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CommandeLocalToFournisseur" ADD CONSTRAINT "_CommandeLocalToFournisseur_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."CommandeLocal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CommandeLocalToFournisseur" ADD CONSTRAINT "_CommandeLocalToFournisseur_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Fournisseur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CorrectionToSparePart" ADD CONSTRAINT "_CorrectionToSparePart_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Correction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CorrectionToSparePart" ADD CONSTRAINT "_CorrectionToSparePart_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."SparePart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CorrectionToTool" ADD CONSTRAINT "_CorrectionToTool_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Correction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CorrectionToTool" ADD CONSTRAINT "_CorrectionToTool_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
