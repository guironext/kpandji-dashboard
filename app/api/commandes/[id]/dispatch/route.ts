import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Check if the commande exists
    const existingCommande = await prisma.commande.findUnique({
      where: { id },
    });

    if (!existingCommande) {
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 },
      );
    }

    // Update the commande to VALIDE status (dispatch)
    const updatedCommande = await prisma.commande.update({
      where: { id },
      data: {
        etapeCommande: "VALIDE",
      },
      include: {
        Client: true,
        Client_entreprise: true,
        VoitureModel: true,
        CommandeToFournisseur: { include: { Fournisseur: true } },
      },
    });

    const serializedCommande = {
      ...updatedCommande,
      prix_unitaire: updatedCommande.prix_unitaire
        ? Number(updatedCommande.prix_unitaire)
        : null,
      date_livraison: updatedCommande.date_livraison.toISOString(),
      createdAt: updatedCommande.createdAt.toISOString(),
      updatedAt: updatedCommande.updatedAt.toISOString(),
      client: updatedCommande.Client
        ? {
            ...updatedCommande.Client,
            createdAt: updatedCommande.Client.createdAt.toISOString(),
            updatedAt: updatedCommande.Client.updatedAt.toISOString(),
          }
        : null,
      clientEntreprise: updatedCommande.Client_entreprise
        ? {
            ...updatedCommande.Client_entreprise,
            createdAt: updatedCommande.Client_entreprise.createdAt.toISOString(),
            updatedAt: updatedCommande.Client_entreprise.updatedAt.toISOString(),
          }
        : null,
      voitureModel: updatedCommande.VoitureModel
        ? {
            ...updatedCommande.VoitureModel,
            createdAt: updatedCommande.VoitureModel.createdAt.toISOString(),
            updatedAt: updatedCommande.VoitureModel.updatedAt.toISOString(),
          }
        : null,
      fournisseurs: updatedCommande.CommandeToFournisseur
        ? updatedCommande.CommandeToFournisseur.map((ctf) => ({
            ...ctf.Fournisseur,
            createdAt: ctf.Fournisseur.createdAt.toISOString(),
            updatedAt: ctf.Fournisseur.updatedAt.toISOString(),
          }))
        : [],
    };

    return NextResponse.json(
      {
        message: "Commande dispatchée avec succès",
        commande: serializedCommande,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error dispatching commande:", error);
    return NextResponse.json(
      { error: "Erreur lors du dispatch de la commande" },
      { status: 500 },
    );
  }
}
