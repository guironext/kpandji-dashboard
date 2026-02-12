import React from "react";
import { executeWithRetry, prisma } from "@/lib/prisma";
import StockageClient from "./stockage-client";

export default async function StockagePage() {
  const sparePartsData = await executeWithRetry(() =>
    prisma.sparePart.findMany({
      where: {
        statusVerification: {
          in: ["RETROUVE", "MODIFIE"],
        },
      },
      include: {
        Commande: {
          include: {
            VoitureModel: true,
            Client: true,
          },
        },
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
        Subcase: {
          include: {
            Conteneur: true,
          },
        },
        Storage: true,
      },
      orderBy: { updatedAt: "desc" },
    })
  );

  const spareParts = sparePartsData.map((sp) => ({
    ...sp,
    commande: sp.Commande ? {
      id: sp.Commande.id,
      voitureModel: sp.Commande.VoitureModel ? { model: sp.Commande.VoitureModel.model } : null,
      client: sp.Commande.Client ? { nom: sp.Commande.Client.nom } : null,
    } : null,
    voiture: sp.Voiture ? {
      voitureModel: sp.Voiture.VoitureModel ? { model: sp.Voiture.VoitureModel.model } : null,
    } : null,
    subcase: sp.Subcase ? {
      subcaseNumber: sp.Subcase.subcaseNumber ?? "",
      conteneur: sp.Subcase.Conteneur ? { conteneurNumber: sp.Subcase.Conteneur.conteneurNumber } : null,
    } : null,
  }));

  return <StockageClient spareParts={spareParts} />;
}