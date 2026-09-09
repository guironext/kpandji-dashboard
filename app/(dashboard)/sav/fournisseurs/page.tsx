import React from "react";
import { prisma } from "@/lib/prisma";
import FournisseursClient, {
  type FournisseurRow,
} from "./FournisseursClient";

export default async function FournisseursPage() {
  let initialFournisseurs: FournisseurRow[] = [];
  let loadError: string | null = null;

  try {
    const rows = await prisma.fournisseur.findMany({
      orderBy: { createdAt: "desc" },
    });

    initialFournisseurs = rows.map((f) => ({
      id: f.id,
      nom: f.nom,
      email: f.email,
      telephone: f.telephone,
      adresse: f.adresse,
      ville: f.ville,
      code_postal: f.code_postal,
      pays: f.pays,
      type_Activite: f.type_Activite,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.error("FournisseursPage: base de données inaccessible", err);
    loadError =
      "Connexion à la base impossible. Vérifiez que le serveur Neon est démarré, que votre réseau autorise l’accès, et que la variable DATABASE_URL dans .env est correcte.";
  }

  return (
    <FournisseursClient
      initialFournisseurs={initialFournisseurs}
      loadError={loadError}
    />
  );
}
