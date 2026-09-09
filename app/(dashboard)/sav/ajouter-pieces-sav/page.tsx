import React from "react";
import { prisma } from "@/lib/prisma";
import AjouterPiecesSavClient from "./AjouterPiecesSavClient";

export default async function AjouterPiecesSavPage() {
  const [rows, modelRows] = await Promise.all([
    prisma.pieceSAV.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nom: true,
        model_voiture: true,
        marque_piece: true,
        part_code: true,
        description: true,
        image: true,
        emplacement: true,
        origine: true,
        prix_achat: true,
        prix_vente: true,
        quantite_entree: true,
      },
    }),
    prisma.voitureModel.findMany({
      orderBy: { model: "asc" },
      select: { model: true },
    }),
  ]);

  const initialPieces = rows.map((p) => ({
    ...p,
    prix_achat: p.prix_achat != null ? Number(p.prix_achat) : null,
    prix_vente: p.prix_vente != null ? Number(p.prix_vente) : null,
  }));

  const voitureModels = Array.from(
    new Set(modelRows.map((m) => m.model.trim()).filter(Boolean))
  );

  return (
    <AjouterPiecesSavClient
      initialPieces={initialPieces}
      voitureModels={voitureModels}
    />
  );
}
