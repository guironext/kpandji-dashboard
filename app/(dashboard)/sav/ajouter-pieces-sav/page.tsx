import React from "react";
import { prisma } from "@/lib/prisma";
import AjouterPiecesSavClient from "./AjouterPiecesSavClient";

export default async function AjouterPiecesSavPage() {
  const rows = await prisma.pieceSAV.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nom: true,
      model_voiture: true,
      marque_piece: true,
      part_code: true,
      description: true,
      prix_achat: true,
      prix_vente: true,
      quantite_entree: true,
    },
  });

  const initialPieces = rows.map((p) => ({
    ...p,
    prix_achat: p.prix_achat != null ? Number(p.prix_achat) : null,
    prix_vente: p.prix_vente != null ? Number(p.prix_vente) : null,
  }));

  return <AjouterPiecesSavClient initialPieces={initialPieces} />;
}
