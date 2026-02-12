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
        client: true,
        clientEntreprise: true,
        voitureModel: true,
        fournisseurs: true,
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
      client: updatedCommande.client
        ? {
            ...updatedCommande.client,
            createdAt: updatedCommande.client.createdAt.toISOString(),
            updatedAt: updatedCommande.client.updatedAt.toISOString(),
          }
        : null,
      clientEntreprise: updatedCommande.clientEntreprise
        ? {
            ...updatedCommande.clientEntreprise,
            createdAt: updatedCommande.clientEntreprise.createdAt.toISOString(),
            updatedAt: updatedCommande.clientEntreprise.updatedAt.toISOString(),
          }
        : null,
      voitureModel: updatedCommande.voitureModel
        ? {
            ...updatedCommande.voitureModel,
            createdAt: updatedCommande.voitureModel.createdAt.toISOString(),
            updatedAt: updatedCommande.voitureModel.updatedAt.toISOString(),
          }
        : null,
      fournisseurs: updatedCommande.fournisseurs
        ? updatedCommande.fournisseurs.map((f) => ({
            ...f,
            createdAt: f.createdAt.toISOString(),
            updatedAt: f.updatedAt.toISOString(),
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
