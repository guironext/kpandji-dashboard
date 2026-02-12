import React from "react";
import { executeWithRetry, prisma } from "@/lib/prisma";
import StockageClient from "./stockage-client";

export default async function StockagePage() {
  const spareParts = await executeWithRetry(() =>
    prisma.sparePart.findMany({
      where: {
        statusVerification: {
          in: ["RETROUVE", "MODIFIE"],
        },
      },
      include: {
        commande: {
          include: {
            voitureModel: true,
            client: true,
          },
        },
        voiture: {
          include: {
            voitureModel: true,
          },
        },
        subcase: {
          include: {
            conteneur: true,
          },
        },
        Storage: true,
      },
      orderBy: { updatedAt: "desc" },
    })
  );

  return <StockageClient spareParts={spareParts} />;
}