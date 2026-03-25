import React from "react";
import { prisma } from "@/lib/prisma";
import GestionPiecesSavClient, {
  type GestionPieceRow,
  type ReparationOption,
} from "./GestionPiecesSavClient";

export default async function GestionPiecesSavPage() {
  let initialPieces: GestionPieceRow[] = [];
  let reparationOptions: ReparationOption[] = [];
  let loadError: string | null = null;

  try {
    const [rows, reps] = await Promise.all([
      prisma.pieceSAV.findMany({
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
          quantite_sortie: true,
          quantite_restante: true,
        },
      }),
      prisma.reparation.findMany({
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          categorie_reparation: true,
          detail_reparation: true,
          voitureSAV: {
            select: {
              immatriculation: true,
              model: true,
              ClientSAV: { select: { nom: true, prenom: true } },
            },
          },
        },
      }),
    ]);

    initialPieces = rows.map((p) => ({
      ...p,
      prix_achat: p.prix_achat != null ? Number(p.prix_achat) : null,
      prix_vente: p.prix_vente != null ? Number(p.prix_vente) : null,
    }));

    reparationOptions = reps.map((r) => {
      const detail = r.detail_reparation?.trim();
      const client = `${r.voitureSAV.ClientSAV.prenom} ${r.voitureSAV.ClientSAV.nom}`.trim();
      const label = [
        r.categorie_reparation + (detail ? ` — ${detail}` : ""),
        r.voitureSAV.immatriculation,
        client,
      ].join(" · ");
      return { id: r.id, label };
    });
  } catch (err) {
    console.error("GestionPiecesSavPage: base de données inaccessible", err);
    loadError =
      "Connexion à la base impossible. Vérifiez que le serveur Neon est démarré, que votre réseau autorise l’accès, et que la variable DATABASE_URL dans .env est correcte.";
  }

  return (
    <GestionPiecesSavClient
      initialPieces={initialPieces}
      reparationOptions={reparationOptions}
      loadError={loadError}
    />
  );
}
