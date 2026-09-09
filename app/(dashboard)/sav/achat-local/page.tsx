import React from "react";
import { prisma } from "@/lib/prisma";
import AchatLocalClient, {
  type CommandeLocalRow,
} from "./AchatLocalClient";

export default async function AchatLocalPage() {
  let initialCommandes: CommandeLocalRow[] = [];
  let loadError: string | null = null;

  try {
    const rows = await prisma.commandeLocal.findMany({
      orderBy: { createdAt: "desc" },
    });

    initialCommandes = rows.map((c) => ({
      id: c.id,
      article: c.article,
      description: c.description,
      quantity: c.quantity,
      price: Number(c.price),
      total: Number(c.total),
      date_livraison: c.date_livraison.toISOString(),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.error("AchatLocalPage: base de données inaccessible", err);
    loadError =
      "Connexion à la base impossible. Vérifiez que le serveur Neon est démarré, que votre réseau autorise l’accès, et que la variable DATABASE_URL dans .env est correcte.";
  }

  return (
    <AchatLocalClient
      initialCommandes={initialCommandes}
      loadError={loadError}
    />
  );
}
